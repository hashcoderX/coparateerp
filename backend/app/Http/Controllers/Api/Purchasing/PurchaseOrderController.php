<?php

namespace App\Http\Controllers\Api\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier', 'items.inventoryItem']);

        $purchaseOrders = $query->get();

        return response()->json($purchaseOrders);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0',
        ]);

        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $inventoryItem = \App\Models\InventoryItem::find($item['inventory_item_id']);
            $unitPrice = $inventoryItem->unit_price;
            $totalAmount += $item['quantity'] * $unitPrice;
        }

        $purchaseOrder = PurchaseOrder::create([
            'supplier_id' => $validated['supplier_id'],
            'order_date' => $validated['order_date'],
            'expected_delivery_date' => $validated['expected_delivery_date'],
            'total_amount' => $totalAmount,
            'notes' => $validated['notes'],
        ]);

        // Create order items
        foreach ($validated['items'] as $itemData) {
            $inventoryItem = \App\Models\InventoryItem::find($itemData['inventory_item_id']);
            $unitPrice = $inventoryItem->unit_price;
            $purchaseOrder->items()->create([
                'inventory_item_id' => $itemData['inventory_item_id'],
                'quantity' => $itemData['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $itemData['quantity'] * $unitPrice,
            ]);
        }

        return response()->json($purchaseOrder->load(['supplier', 'items.inventoryItem']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        return response()->json($purchaseOrder->load(['supplier', 'items.inventoryItem']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'order_date' => 'sometimes|required|date',
            'expected_delivery_date' => 'nullable|date',
            'status' => 'sometimes|required|in:pending,approved,received,cancelled',
            'notes' => 'nullable|string',
        ]);

        $purchaseOrder->update($validated);

        return response()->json($purchaseOrder->load(['supplier', 'items.inventoryItem']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $purchaseOrder->delete();

        return response()->json(['message' => 'Purchase order deleted successfully']);
    }
}