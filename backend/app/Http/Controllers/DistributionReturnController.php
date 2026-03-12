<?php

namespace App\Http\Controllers;

use App\Models\DistributionInvoice;
use App\Models\DistributionReturn;
use App\Models\InventoryItem;
use App\Models\Load;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DistributionReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DistributionReturn::with([
            'customer:id,shop_name,customer_code',
            'invoice:id,invoice_number',
            'returnedItem:id,name,code,unit',
            'exchangeItem:id,name,code,unit',
        ]);

        $user = $request->user();

        if ($user) {
            $isAdmin = (!$user->employee_id) || $user->hasRole('Super Admin');

            if (!$isAdmin && $user->employee_id) {
                $routeIds = Load::where('sales_ref_id', $user->employee_id)
                    ->whereIn('status', ['pending', 'in_transit', 'delivered'])
                    ->pluck('route_id')
                    ->filter()
                    ->unique()
                    ->toArray();

                if (!empty($routeIds)) {
                    $query->whereHas('customer', function ($q) use ($routeIds) {
                        $q->whereIn('route_id', $routeIds);
                    });
                } else {
                    // No allocated routes for this sales ref - hide returns
                    $query->whereRaw('1 = 0');
                }
            }
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $returns = $query->orderByDesc('return_date')->orderByDesc('id')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $returns,
            'message' => 'Distribution returns retrieved successfully',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'return_number' => 'required|string|max:60|unique:distribution_returns,return_number',
            'distribution_invoice_id' => 'nullable|exists:distribution_invoices,id',
            'customer_id' => 'required|exists:distribution_customers,id',
            'returned_inventory_item_id' => 'nullable|exists:inventory_items,id',
            'return_date' => 'required|date',
            'total_quantity' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'settlement_type' => 'nullable|in:bill_deduction,cash_refund,item_exchange',
            'settlement_amount' => 'nullable|numeric|min:0',
            'exchange_inventory_item_id' => 'nullable|exists:inventory_items,id',
            'exchange_quantity' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $distributionReturn = DB::transaction(function () use ($payload) {
            $settlementType = $payload['settlement_type'] ?? 'bill_deduction';
            $settlementAmount = (float) ($payload['settlement_amount'] ?? $payload['total_amount'] ?? 0);

            $distributionReturn = DistributionReturn::create([
                'return_number' => $payload['return_number'],
                'distribution_invoice_id' => $payload['distribution_invoice_id'] ?? null,
                'customer_id' => $payload['customer_id'],
                'returned_inventory_item_id' => $payload['returned_inventory_item_id'] ?? null,
                'return_date' => $payload['return_date'],
                'total_quantity' => $payload['total_quantity'],
                'total_amount' => $payload['total_amount'],
                'settlement_type' => $settlementType,
                'settlement_amount' => $settlementAmount,
                'exchange_inventory_item_id' => $payload['exchange_inventory_item_id'] ?? null,
                'exchange_quantity' => (float) ($payload['exchange_quantity'] ?? 0),
                'reason' => $payload['reason'] ?? null,
                'status' => $payload['status'] ?? 'pending',
                'notes' => $payload['notes'] ?? null,
            ]);

            if (!empty($payload['returned_inventory_item_id']) && (float) $payload['total_quantity'] > 0) {
                $inventory = InventoryItem::find($payload['returned_inventory_item_id']);
                if ($inventory) {
                    $inventory->current_stock = (float) $inventory->current_stock + (float) $payload['total_quantity'];
                    $inventory->save();
                }
            }

            if ($settlementType === 'item_exchange' && !empty($payload['exchange_inventory_item_id']) && (float) ($payload['exchange_quantity'] ?? 0) > 0) {
                $exchangeItem = InventoryItem::find($payload['exchange_inventory_item_id']);
                if ($exchangeItem) {
                    $exchangeQty = (float) ($payload['exchange_quantity'] ?? 0);
                    $exchangeItem->current_stock = max(0, (float) $exchangeItem->current_stock - $exchangeQty);
                    $exchangeItem->save();
                }
            }

            if (!empty($payload['distribution_invoice_id'])) {
                $invoice = DistributionInvoice::find($payload['distribution_invoice_id']);
                if ($invoice) {
                    if ($settlementType === 'bill_deduction') {
                        $invoice->total = max(0, (float) $invoice->total - $settlementAmount);
                    } elseif ($settlementType === 'cash_refund') {
                        $invoice->paid_amount = max(0, (float) $invoice->paid_amount - $settlementAmount);
                    }

                    if ((float) $invoice->paid_amount >= (float) $invoice->total) {
                        $invoice->status = 'paid';
                    } elseif ((float) $invoice->paid_amount > 0) {
                        $invoice->status = 'partial';
                    } else {
                        $invoice->status = 'pending';
                    }

                    $invoice->save();
                }
            }

            return $distributionReturn;
        });

        return response()->json([
            'success' => true,
            'data' => $distributionReturn->load([
                'customer:id,shop_name,customer_code',
                'invoice:id,invoice_number',
                'returnedItem:id,name,code,unit',
                'exchangeItem:id,name,code,unit',
            ]),
            'message' => 'Distribution return recorded successfully',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $distributionReturn = DistributionReturn::with([
            'customer:id,shop_name,customer_code',
            'invoice:id,invoice_number',
            'returnedItem:id,name,code,unit',
            'exchangeItem:id,name,code,unit',
        ])->find($id);

        if (!$distributionReturn) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution return not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $distributionReturn,
            'message' => 'Distribution return retrieved successfully',
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $distributionReturn = DistributionReturn::find($id);

        if (!$distributionReturn) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution return not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'return_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $distributionReturn->update($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $distributionReturn->load([
                'customer:id,shop_name,customer_code',
                'invoice:id,invoice_number',
                'returnedItem:id,name,code,unit',
                'exchangeItem:id,name,code,unit',
            ]),
            'message' => 'Distribution return updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $distributionReturn = DistributionReturn::find($id);

        if (!$distributionReturn) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution return not found',
            ], 404);
        }

        $distributionReturn->delete();

        return response()->json([
            'success' => true,
            'message' => 'Distribution return deleted successfully',
        ]);
    }
}
