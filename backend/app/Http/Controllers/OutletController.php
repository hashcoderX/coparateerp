<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class OutletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Outlet::with('user:id,name,email');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('manager_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $outlets = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $outlets,
            'message' => 'Outlets retrieved successfully',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:outlets,code',
            'manager_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'outlet_user_name' => 'required|string|max:255',
            'outlet_user_email' => 'required|email|max:255|unique:users,email',
            'outlet_user_password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $outlet = DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->outlet_user_name,
                    'email' => $request->outlet_user_email,
                    'password' => Hash::make($request->outlet_user_password),
                ]);

                $outletRole = Role::firstOrCreate(
                    ['name' => 'outlet_user'],
                    ['description' => 'Outlet sales user', 'is_active' => true]
                );

                UserRole::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'role_id' => $outletRole->id,
                    ],
                    [
                        'assigned_at' => now(),
                        'assigned_by' => $request->user()->id,
                    ]
                );

                return Outlet::create([
                    'name' => $request->name,
                    'code' => $request->code,
                    'manager_name' => $request->manager_name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'address' => $request->address,
                    'status' => $request->status ?? 'active',
                    'user_id' => $user->id,
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $outlet->load('user:id,name,email'),
                'message' => 'Outlet created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create outlet',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $outlet = Outlet::with('user:id,name,email')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $outlet,
                'message' => 'Outlet retrieved successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet not found',
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:outlets,code,' . $id,
            'manager_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $outlet = Outlet::findOrFail($id);

            $outlet->update([
                'name' => $request->name,
                'code' => $request->code,
                'manager_name' => $request->manager_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'status' => $request->status ?? $outlet->status,
            ]);

            return response()->json([
                'success' => true,
                'data' => $outlet->load('user:id,name,email'),
                'message' => 'Outlet updated successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update outlet',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $outlet = Outlet::findOrFail($id);
            $outlet->delete();

            return response()->json([
                'success' => true,
                'message' => 'Outlet deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete outlet',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function stockReport(string $id): JsonResponse
    {
        try {
            $outlet = Outlet::findOrFail($id);

            $stockLines = DB::table('stock_transfers')
                ->join('inventory_items', 'stock_transfers.inventory_item_id', '=', 'inventory_items.id')
                ->where('stock_transfers.outlet_id', $outlet->id)
                ->groupBy('stock_transfers.inventory_item_id', 'inventory_items.name', 'inventory_items.code', 'inventory_items.unit')
                ->selectRaw('stock_transfers.inventory_item_id, inventory_items.name, inventory_items.code, inventory_items.unit, SUM(stock_transfers.quantity) as available_quantity')
                ->orderBy('inventory_items.name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'outlet' => [
                        'id' => $outlet->id,
                        'name' => $outlet->name,
                        'code' => $outlet->code,
                    ],
                    'stocks' => $stockLines,
                ],
                'message' => 'Outlet stock report retrieved successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve outlet stock report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
