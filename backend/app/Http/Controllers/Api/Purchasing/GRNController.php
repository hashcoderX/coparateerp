<?php

namespace App\Http\Controllers\Api\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceivedNote;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GRNController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GoodsReceivedNote::with(['purchaseOrder.supplier', 'grnItems.purchaseOrderItem.inventoryItem']);

        $grns = $query->get();

        return response()->json($grns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required|numeric|min:0',
            'items.*.accepted_quantity' => 'nullable|numeric|min:0',
            'items.*.rejected_quantity' => 'nullable|numeric|min:0',
            'items.*.purchase_price' => 'nullable|numeric|min:0',
            'items.*.sell_price' => 'nullable|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.remarks' => 'nullable|string',
            'items.*.quality_status' => 'nullable|in:pending,accepted,rejected,partial',
        ]);

        $grn = GoodsReceivedNote::create([
            'purchase_order_id' => $validated['purchase_order_id'],
            'received_date' => $validated['received_date'],
            'notes' => $validated['notes'],
            'status' => 'received',
        ]);

        // Create GRN items
        foreach ($validated['items'] as $itemData) {
            $grn->grnItems()->create([
                'purchase_order_item_id' => $itemData['purchase_order_item_id'],
                'received_quantity' => $itemData['received_quantity'],
                'accepted_quantity' => $itemData['accepted_quantity'] ?? $itemData['received_quantity'],
                'rejected_quantity' => $itemData['rejected_quantity'] ?? 0,
                'purchase_price' => $itemData['purchase_price'] ?? null,
                'sell_price' => $itemData['sell_price'] ?? null,
                'expiry_date' => $itemData['expiry_date'] ?? null,
                'remarks' => $itemData['remarks'] ?? null,
                'quality_status' => $itemData['quality_status'] ?? 'pending',
            ]);
        }

        // Update inventory stock quantities and PO received quantities
        foreach ($grn->grnItems as $grnItem) {
            $inventoryItem = $grnItem->purchaseOrderItem->inventoryItem;
            if ($inventoryItem) {
                $inventoryItem->increment('current_stock', $grnItem->accepted_quantity);
            }

            // Update received quantity in purchase order item
            $grnItem->purchaseOrderItem->increment('received_quantity', $grnItem->accepted_quantity);
        }

        return response()->json($grn->load(['purchaseOrder.supplier', 'grnItems.purchaseOrderItem.inventoryItem']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(GoodsReceivedNote $grn): JsonResponse
    {
        return response()->json($grn->load(['purchaseOrder.supplier', 'grnItems.purchaseOrderItem.inventoryItem']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GoodsReceivedNote $grn): JsonResponse
    {
        $validated = $request->validate([
            'received_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|required|in:draft,received,inspected,approved,rejected',
            'items' => 'sometimes|array',
            'items.*.purchase_order_item_id' => 'required_with:items|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required_with:items|numeric|min:0',
            'items.*.accepted_quantity' => 'nullable|numeric|min:0',
            'items.*.rejected_quantity' => 'nullable|numeric|min:0',
            'items.*.purchase_price' => 'nullable|numeric|min:0',
            'items.*.sell_price' => 'nullable|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.remarks' => 'nullable|string',
            'items.*.quality_status' => 'nullable|in:pending,accepted,rejected,partial',
        ]);

        // Store old accepted quantities for stock adjustment
        $oldQuantities = [];
        foreach ($grn->grnItems as $grnItem) {
            $oldQuantities[$grnItem->purchase_order_item_id] = $grnItem->accepted_quantity;
        }

        // Update GRN header
        $grn->update([
            'received_date' => $validated['received_date'] ?? $grn->received_date,
            'notes' => $validated['notes'] ?? $grn->notes,
            'status' => $validated['status'] ?? $grn->status,
        ]);

        // Update GRN items if provided
        if (isset($validated['items'])) {
            // Delete existing GRN items
            $grn->grnItems()->delete();

            // Create new GRN items
            foreach ($validated['items'] as $itemData) {
                $grn->grnItems()->create([
                    'purchase_order_item_id' => $itemData['purchase_order_item_id'],
                    'received_quantity' => $itemData['received_quantity'],
                    'accepted_quantity' => $itemData['accepted_quantity'] ?? $itemData['received_quantity'],
                    'rejected_quantity' => $itemData['rejected_quantity'] ?? 0,
                    'purchase_price' => $itemData['purchase_price'] ?? null,
                    'sell_price' => $itemData['sell_price'] ?? null,
                    'expiry_date' => $itemData['expiry_date'] ?? null,
                    'remarks' => $itemData['remarks'] ?? null,
                    'quality_status' => $itemData['quality_status'] ?? 'pending',
                ]);
            }

            // Adjust inventory stock and PO received quantities based on differences
            foreach ($grn->fresh()->grnItems as $grnItem) {
                $oldQuantity = $oldQuantities[$grnItem->purchase_order_item_id] ?? 0;
                $newQuantity = $grnItem->accepted_quantity;
                $quantityDifference = $newQuantity - $oldQuantity;

                if ($quantityDifference != 0) {
                    // Adjust inventory stock
                    $inventoryItem = $grnItem->purchaseOrderItem->inventoryItem;
                    if ($inventoryItem) {
                        $inventoryItem->increment('current_stock', $quantityDifference);
                    }

                    // Adjust PO received quantity
                    $grnItem->purchaseOrderItem->increment('received_quantity', $quantityDifference);
                }
            }
        }

        return response()->json($grn->load(['purchaseOrder.supplier', 'grnItems.purchaseOrderItem.inventoryItem']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GoodsReceivedNote $grn): JsonResponse
    {
        // Load GRN with relationships if not already loaded
        $grn->load(['grnItems.purchaseOrderItem.inventoryItem']);

        // Reverse inventory stock updates and PO received quantities
        foreach ($grn->grnItems as $grnItem) {
            $inventoryItem = $grnItem->purchaseOrderItem->inventoryItem;
            if ($inventoryItem) {
                $inventoryItem->decrement('current_stock', $grnItem->accepted_quantity);
            }

            // Reverse received quantity in purchase order item
            $grnItem->purchaseOrderItem->decrement('received_quantity', $grnItem->accepted_quantity);
        }

        $grn->delete();

        return response()->json(['message' => 'GRN deleted successfully']);
    }
}
