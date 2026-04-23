<?php

namespace App\Http\Controllers\Production;

use App\Http\Controllers\Controller;
use App\Models\ProductionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductionPlanningController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductionPlan::with(['product:id,name,code,unit', 'bom:id,product_id,version,batch_size']);

        if ($request->filled('from_date')) {
            $query->whereDate('plan_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('plan_date', '<=', $request->to_date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->product_id);
        }

        $plans = $query->orderBy('plan_date')->orderByDesc('id')->paginate((int) $request->get('per_page', 50));

        $today = now()->toDateString();
        $summary = [
            'total_plans' => (clone $query)->count(),
            'today_plans' => (clone $query)->whereDate('plan_date', $today)->count(),
            'total_target_quantity' => round((float) (clone $query)->sum('target_quantity'), 3),
            'scheduled_or_order_created' => (clone $query)->whereIn('status', ['scheduled', 'order_created'])->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $plans->items(),
                'meta' => [
                    'current_page' => $plans->currentPage(),
                    'last_page' => $plans->lastPage(),
                    'per_page' => $plans->perPage(),
                    'total' => $plans->total(),
                ],
                'summary' => $summary,
            ],
            'message' => 'Production plans retrieved successfully',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'bom_id' => 'nullable|exists:bom_headers,id',
            'plan_date' => 'required|date',
            'shift' => 'nullable|string|max:50',
            'target_quantity' => 'required|numeric|min:0.001',
            'batch_count' => 'required|numeric|min:0.01',
            'priority' => 'nullable|in:low,medium,high',
            'status' => 'nullable|in:draft,scheduled,order_created,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $plan = ProductionPlan::create([
            'product_id' => $request->product_id,
            'bom_id' => $request->bom_id,
            'plan_date' => $request->plan_date,
            'shift' => $request->shift,
            'target_quantity' => $request->target_quantity,
            'batch_count' => $request->batch_count,
            'priority' => $request->priority ?? 'medium',
            'status' => $request->status ?? 'draft',
            'notes' => $request->notes,
            'created_by' => optional($request->user())->id,
        ])->load(['product:id,name,code,unit', 'bom:id,product_id,version,batch_size']);

        return response()->json([
            'success' => true,
            'data' => $plan,
            'message' => 'Production plan created successfully',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $plan = ProductionPlan::find($id);
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Production plan not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'sometimes|exists:products,id',
            'bom_id' => 'nullable|exists:bom_headers,id',
            'plan_date' => 'sometimes|date',
            'shift' => 'nullable|string|max:50',
            'target_quantity' => 'sometimes|numeric|min:0.001',
            'batch_count' => 'sometimes|numeric|min:0.01',
            'priority' => 'sometimes|in:low,medium,high',
            'status' => 'sometimes|in:draft,scheduled,order_created,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $plan->update($request->only([
            'product_id',
            'bom_id',
            'plan_date',
            'shift',
            'target_quantity',
            'batch_count',
            'priority',
            'status',
            'notes',
        ]));

        return response()->json([
            'success' => true,
            'data' => $plan->load(['product:id,name,code,unit', 'bom:id,product_id,version,batch_size']),
            'message' => 'Production plan updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $plan = ProductionPlan::find($id);
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Production plan not found',
            ], 404);
        }

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Production plan deleted successfully',
        ]);
    }

    public function createOrder(int $id): JsonResponse
    {
        $plan = ProductionPlan::with('product')->find($id);
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Production plan not found',
            ], 404);
        }

        if ($plan->order_number) {
            return response()->json([
                'success' => false,
                'message' => 'Production order is already created for this plan.',
            ], 422);
        }

        $prefix = 'PO-' . now()->format('Ymd') . '-';
        $lastToday = ProductionPlan::whereDate('created_at', now()->toDateString())
            ->whereNotNull('order_number')
            ->count();
        $number = $prefix . str_pad((string) ($lastToday + 1), 4, '0', STR_PAD_LEFT);

        $plan->update([
            'order_number' => $number,
            'status' => 'order_created',
        ]);

        return response()->json([
            'success' => true,
            'data' => $plan->fresh(['product:id,name,code,unit', 'bom:id,product_id,version,batch_size']),
            'message' => 'Production order created successfully',
        ]);
    }
}
