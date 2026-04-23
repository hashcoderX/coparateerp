<?php

namespace App\Http\Controllers\Api\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
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
            'items.*.inventory_item_id' => 'nullable|exists:inventory_items,id',
            'items.*.item_name' => 'nullable|string|max:255',
            'items.*.item_code' => 'nullable|string|max:100',
            'items.*.item_unit' => 'nullable|string|max:50',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        foreach ($validated['items'] as $index => $item) {
            $hasInventoryId = !empty($item['inventory_item_id']);
            $hasTypedName = !empty(trim((string) ($item['item_name'] ?? '')));

            if (!$hasInventoryId && !$hasTypedName) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        "items.{$index}.item_name" => ['Please select an item or type a new item name.'],
                    ],
                ], 422);
            }
        }

        $resolvedItems = [];
        $supplierName = optional(\App\Models\Supplier::find($validated['supplier_id']))->name;

        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $inventoryItemId = $item['inventory_item_id'] ?? null;

            if ($inventoryItemId) {
                $inventoryItem = InventoryItem::findOrFail($inventoryItemId);
            } else {
                $typedName = trim((string) ($item['item_name'] ?? ''));
                $typedCode = strtoupper(trim((string) ($item['item_code'] ?? '')));
                $typedUnit = trim((string) ($item['item_unit'] ?? '')) ?: 'pieces';
                $typedPrice = (float) ($item['unit_price'] ?? 0);

                $inventoryItem = null;
                if (!empty($typedCode)) {
                    $inventoryItem = InventoryItem::where('code', $typedCode)->first();
                }

                if (!$inventoryItem) {
                    $inventoryItem = InventoryItem::where('name', $typedName)
                        ->where('type', 'raw_material')
                        ->first();
                }

                if (!$inventoryItem) {
                    $newCode = $typedCode;
                    if (empty($newCode)) {
                        $newCode = 'PO-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $typedName), 0, 8));
                        if (empty(trim($newCode, '-'))) {
                            $newCode = 'PO-ITEM';
                        }
                    }

                    if (InventoryItem::where('code', $newCode)->exists()) {
                        $suffix = 1;
                        $baseCode = $newCode;
                        while (InventoryItem::where('code', $newCode)->exists()) {
                            $newCode = $baseCode . '-' . $suffix;
                            $suffix++;
                        }
                    }

                    $inventoryItem = InventoryItem::create([
                        'name' => $typedName,
                        'code' => $newCode,
                        'description' => 'Auto-created from purchase order item entry.',
                        'type' => 'raw_material',
                        'category' => 'Purchased Items',
                        'unit' => $typedUnit,
                        'current_stock' => 0,
                        'minimum_stock' => 0,
                        'maximum_stock' => null,
                        'unit_price' => $typedPrice,
                        'purchase_price' => $typedPrice,
                        'sell_price' => null,
                        'supplier_name' => $supplierName,
                        'supplier_id' => $validated['supplier_id'],
                        'location' => 'Main Store',
                        'status' => 'active',
                    ]);
                }
            }

            $lineUnitPrice = isset($item['unit_price']) && $item['unit_price'] !== null
                ? (float) $item['unit_price']
                : (float) $inventoryItem->unit_price;

            if ($lineUnitPrice <= 0) {
                $lineUnitPrice = (float) $inventoryItem->unit_price;
            }

            $lineTotal = (float) $item['quantity'] * $lineUnitPrice;
            $totalAmount += $lineTotal;
            $resolvedItems[] = [
                'inventory_item_id' => $inventoryItem->id,
                'quantity' => $item['quantity'],
                'unit_price' => $lineUnitPrice,
                'total_price' => $lineTotal,
            ];
        }

        $purchaseOrder = PurchaseOrder::create([
            'supplier_id' => $validated['supplier_id'],
            'order_date' => $validated['order_date'],
            'expected_delivery_date' => $validated['expected_delivery_date'],
            'total_amount' => $totalAmount,
            'notes' => $validated['notes'],
        ]);

        // Create order items
        foreach ($resolvedItems as $itemData) {
            $purchaseOrder->items()->create([
                'inventory_item_id' => $itemData['inventory_item_id'],
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'total_price' => $itemData['total_price'],
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