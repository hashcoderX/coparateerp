<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $vehicles = Vehicle::all();
        return response()->json($vehicles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => 'required|string|unique:vehicles',
            'type' => 'required|in:truck,van,pickup,lorry',
            'capacity_kg' => 'required|numeric|min:0',
            'status' => 'in:active,maintenance,inactive',
            'fuel_type' => 'required|in:diesel,petrol,electric',
            'model' => 'required|string',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'insurance_expiry' => 'required|date|after:today',
            'license_expiry' => 'required|date|after:today',
            'current_location' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $vehicle = Vehicle::create($request->all());

        return response()->json([
            'message' => 'Vehicle created successfully',
            'vehicle' => $vehicle
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Vehicle $vehicle): JsonResponse
    {
        return response()->json($vehicle);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => 'required|string|unique:vehicles,registration_number,' . $vehicle->id,
            'type' => 'required|in:truck,van,pickup,lorry',
            'capacity_kg' => 'required|numeric|min:0',
            'status' => 'in:active,maintenance,inactive',
            'fuel_type' => 'required|in:diesel,petrol,electric',
            'model' => 'required|string',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'insurance_expiry' => 'required|date',
            'license_expiry' => 'required|date',
            'current_location' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $vehicle->update($request->all());

        return response()->json([
            'message' => 'Vehicle updated successfully',
            'vehicle' => $vehicle
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $vehicle->delete();

        return response()->json([
            'message' => 'Vehicle deleted successfully'
        ]);
    }
}
