<?php

namespace App\Http\Controllers;

use App\Models\DistributionInvoice;
use App\Models\DistributionInvoiceItem;
use App\Models\InventoryItem;
use App\Models\Load;
use App\Models\LoadItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DistributionInvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DistributionInvoice::with(['customer:id,shop_name,customer_code', 'items']);

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
                    // No allocated routes for this sales ref - hide invoices
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

        $invoices = $query->orderByDesc('invoice_date')->orderByDesc('id')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $invoices,
            'message' => 'Distribution invoices retrieved successfully',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'invoice_number' => 'required|string|max:60|unique:distribution_invoices,invoice_number',
            'customer_id' => 'required|exists:distribution_customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|exists:inventory_items,id',
            'items.*.item_code' => 'required|string|max:80',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.unit' => 'nullable|string|max:30',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $invoice = DB::transaction(function () use ($payload, $request) {
            $user = $request->user();

            $activeLoad = null;
            if ($user && $user->employee_id) {
                $activeLoad = Load::where('sales_ref_id', $user->employee_id)
                    ->whereIn('status', ['pending', 'in_transit'])
                    ->orderByDesc('load_date')
                    ->orderByDesc('id')
                    ->first();
            }

            $subtotal = 0;
            foreach ($payload['items'] as $item) {
                $subtotal += (float) $item['quantity'] * (float) $item['unit_price'];
            }

            $discount = (float) ($payload['discount'] ?? 0);
            $total = max(0, $subtotal - $discount);

            $invoice = DistributionInvoice::create([
                'invoice_number' => $payload['invoice_number'],
                'customer_id' => $payload['customer_id'],
                'invoice_date' => $payload['invoice_date'],
                'due_date' => $payload['due_date'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'paid_amount' => 0,
                'status' => 'pending',
                'notes' => $payload['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($payload['items'] as $item) {
                $lineTotal = (float) $item['quantity'] * (float) $item['unit_price'];

                DistributionInvoiceItem::create([
                    'distribution_invoice_id' => $invoice->id,
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                    'item_code' => $item['item_code'],
                    'item_name' => $item['item_name'],
                    'unit' => $item['unit'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $lineTotal,
                ]);

                $handledByLoad = false;

                if ($activeLoad) {
                    $loadItem = LoadItem::where('load_id', $activeLoad->id)
                        ->where('product_code', $item['item_code'])
                        ->first();

                    if ($loadItem) {
                        $loadItem->qty = max(0, (float) $loadItem->qty - (float) $item['quantity']);
                        $loadItem->save();
                        $handledByLoad = true;
                    }
                }

                if (!$handledByLoad && !empty($item['inventory_item_id'])) {
                    $inventory = InventoryItem::find($item['inventory_item_id']);
                    if ($inventory) {
                        $inventory->current_stock = max(0, (float) $inventory->current_stock - (float) $item['quantity']);
                        $inventory->save();
                    }
                }
            }

            return $invoice->load(['customer:id,shop_name,customer_code', 'items']);
        });

        return response()->json([
            'success' => true,
            'data' => $invoice,
            'message' => 'Distribution invoice created successfully',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $invoice = DistributionInvoice::with(['customer:id,shop_name,customer_code', 'items', 'payments'])->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution invoice not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice,
            'message' => 'Distribution invoice retrieved successfully',
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $invoice = DistributionInvoice::find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution invoice not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:distribution_customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'discount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,partial,paid,cancelled',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $invoice->update($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $invoice->load(['customer:id,shop_name,customer_code', 'items']),
            'message' => 'Distribution invoice updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $invoice = DistributionInvoice::find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution invoice not found',
            ], 404);
        }

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Distribution invoice deleted successfully',
        ]);
    }
}
