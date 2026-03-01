<?php

namespace App\Http\Controllers;

use App\Models\Load;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LoadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $loads = Load::with(['vehicle', 'driver', 'route'])->get();
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
            'load' => $load->load(['vehicle', 'driver', 'route'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Load $load): JsonResponse
    {
        return response()->json($load->load(['vehicle', 'driver', 'route']));
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
            'load' => $load->load(['vehicle', 'driver', 'route'])
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
}
