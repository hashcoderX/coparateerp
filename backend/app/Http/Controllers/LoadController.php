<?php

namespace App\Http\Controllers;

use App\Models\DistributionInvoice;
use App\Models\DistributionPayment;
use App\Models\Load;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LoadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Load::with(['vehicle', 'driver', 'salesRef', 'route']);

        if ($user) {
            $isAdmin = (!$user->employee_id) || $user->hasRole('Super Admin');

            if (!$isAdmin && $user->employee_id) {
                $query->where('sales_ref_id', $user->employee_id);
            }
        }

        $loads = $query->get();

        return response()->json($loads);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'load_number' => 'required|string|unique:loads',
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:employees,id',
            'sales_ref_id' => 'nullable|exists:employees,id',
            'route_id' => 'required|exists:routes,id',
            'status' => 'in:pending,in_transit,delivered,cancelled',
            'load_date' => 'required|date|after_or_equal:today',
            'delivery_date' => 'nullable|date|after_or_equal:load_date',
            'total_weight' => 'numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $load = Load::create($request->all());

        return response()->json([
            'message' => 'Load created successfully',
            'load' => $load->load(['vehicle', 'driver', 'salesRef', 'route'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Load $load): JsonResponse
    {
        return response()->json($load->load(['vehicle', 'driver', 'salesRef', 'route']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Load $load): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'load_number' => 'required|string|unique:loads,load_number,' . $load->id,
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:employees,id',
            'sales_ref_id' => 'nullable|exists:employees,id',
            'route_id' => 'required|exists:routes,id',
            'status' => 'in:pending,in_transit,delivered,cancelled',
            'load_date' => 'required|date',
            'delivery_date' => 'nullable|date|after_or_equal:load_date',
            'total_weight' => 'numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $load->update($request->all());

        return response()->json([
            'message' => 'Load updated successfully',
            'load' => $load->load(['vehicle', 'driver', 'salesRef', 'route'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Load $load): JsonResponse
    {
        $load->delete();

        return response()->json([
            'message' => 'Load deleted successfully'
        ]);
    }

    public function deliverySummary(Request $request, Load $load): JsonResponse
    {
        $fromDate = $load->load_date;
        $toDate = $load->delivery_date ?? now();

        $invoices = DistributionInvoice::with(['customer:id,shop_name,customer_code,route_id', 'items'])
            ->whereBetween('invoice_date', [$fromDate, $toDate])
            ->whereHas('customer', function ($q) use ($load) {
                $q->where('route_id', $load->route_id);
            })
            ->get(['id', 'invoice_number', 'customer_id', 'invoice_date', 'total', 'status', 'paid_amount']);

        $invoiceTotal = (float) $invoices->sum('total');
        $invoiceCount = $invoices->count();

        $customerIds = $invoices->pluck('customer_id')->filter()->unique()->values();

        $payments = $customerIds->isEmpty()
            ? collect([])
            : DistributionPayment::whereIn('customer_id', $customerIds)
                ->whereBetween('payment_date', [$fromDate, $toDate])
                ->where('status', '!=', 'bounced')
                ->get(['id', 'payment_number', 'payment_date', 'amount', 'payment_method', 'reference_no', 'bank_name', 'status']);

        $totalCollected = (float) $payments->sum('amount');

        $byMethod = $payments->groupBy('payment_method')->map(function ($group) {
            return [
                'total' => (float) $group->sum('amount'),
                'count' => $group->count(),
            ];
        });

        $cheques = $payments->where('payment_method', 'check')->values();

        // Aggregate item-level sales from invoices (quantity and value) keyed by item_code
        $itemSales = [];
        foreach ($invoices as $invoice) {
            foreach ($invoice->items as $item) {
                $code = $item->item_code;
                if (!isset($itemSales[$code])) {
                    $itemSales[$code] = [
                        'item_code' => $code,
                        'item_name' => $item->item_name,
                        'unit' => $item->unit,
                        'sold_qty' => 0.0,
                        'sold_value' => 0.0,
                        'return_qty' => 0.0,
                        'return_value' => 0.0,
                        'net_qty' => 0.0,
                        'net_value' => 0.0,
                        'cost_value' => 0.0,
                        'profit' => 0.0,
                    ];
                }

                $itemSales[$code]['sold_qty'] += (float) $item->quantity;
                $lineValue = (float) $item->quantity * (float) $item->unit_price;
                $itemSales[$code]['sold_value'] += $lineValue;
            }
        }

        // Fetch returns within the same period for customers on this route
        $returns = $customerIds->isEmpty()
            ? collect([])
            : \App\Models\DistributionReturn::whereIn('customer_id', $customerIds)
                ->whereBetween('return_date', [$fromDate, $toDate])
                ->with('returnedItem:id,code')
                ->get(['id', 'customer_id', 'returned_inventory_item_id', 'return_date', 'total_quantity', 'total_amount']);

        foreach ($returns as $return) {
            $code = $return->returnedItem?->code;
            if (!$code) {
                continue;
            }

            if (!isset($itemSales[$code])) {
                $itemSales[$code] = [
                    'item_code' => $code,
                    'item_name' => $return->returnedItem->name ?? $code,
                    'unit' => $return->returnedItem->unit ?? null,
                    'sold_qty' => 0.0,
                    'sold_value' => 0.0,
                    'return_qty' => 0.0,
                    'return_value' => 0.0,
                    'net_qty' => 0.0,
                    'net_value' => 0.0,
                    'cost_value' => 0.0,
                    'profit' => 0.0,
                ];
            }

            $itemSales[$code]['return_qty'] += (float) $return->total_quantity;
            $itemSales[$code]['return_value'] += (float) $return->total_amount;
        }

        // Map to collection for further calculations
        $itemSalesCollection = collect($itemSales);

        // Attach cost from load items (out_price) and compute profit per item
        $loadItems = $load->loadItems()->get(['product_code', 'out_price', 'sell_price']);
        foreach ($itemSalesCollection as $code => &$row) {
            $loadItem = $loadItems->firstWhere('product_code', $code);
            $netQty = (float) $row['sold_qty'] - (float) $row['return_qty'];
            $netValue = (float) $row['sold_value'] - (float) $row['return_value'];
            $costPerUnit = $loadItem ? (float) $loadItem->out_price : 0.0;
            $costValue = $costPerUnit * $netQty;
            $profit = $netValue - $costValue;

            $row['net_qty'] = $netQty;
            $row['net_value'] = $netValue;
            $row['cost_value'] = $costValue;
            $row['profit'] = $profit;
        }
        unset($row);

        $totalCost = (float) $itemSalesCollection->sum('cost_value');
        $totalProfit = (float) $itemSalesCollection->sum('profit');

        return response()->json([
            'success' => true,
            'data' => [
                'load' => [
                    'id' => $load->id,
                    'load_number' => $load->load_number,
                    'route_id' => $load->route_id,
                    'sales_ref_id' => $load->sales_ref_id,
                    'status' => $load->status,
                    'load_date' => $fromDate,
                    'delivery_date' => $load->delivery_date,
                ],
                'period' => [
                    'from' => $fromDate,
                    'to' => $toDate,
                ],
                'invoices' => [
                    'count' => $invoiceCount,
                    'total_amount' => $invoiceTotal,
                    'total_cost' => $totalCost,
                    'total_profit' => $totalProfit,
                ],
                'payments' => [
                    'total_collected' => $totalCollected,
                    'by_method' => $byMethod,
                    'cheques' => $cheques,
                ],
                'items' => $itemSalesCollection->values(),
            ],
        ]);
    }
}
