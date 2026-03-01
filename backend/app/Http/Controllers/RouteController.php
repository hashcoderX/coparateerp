<?php

namespace App\Http\Controllers;

use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RouteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $routes = Route::all();
        return response()->json($routes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'distance_km' => 'required|numeric|min:0',
            'estimated_duration_hours' => 'required|numeric|min:0',
            'status' => 'in:active,inactive',
            'route_type' => 'required|in:local,inter_city,highway',
            'toll_charges' => 'numeric|min:0',
            'fuel_estimate_liters' => 'numeric|min:0',
            'description' => 'nullable|string',
            'waypoints' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Process waypoints - convert comma-separated string to array
        $waypoints = null;
        if ($request->waypoints) {
            $waypoints = array_map('trim', explode(',', $request->waypoints));
        }

        $route = Route::create([
            'name' => $request->name,
            'origin' => $request->origin,
            'destination' => $request->destination,
            'distance_km' => $request->distance_km,
            'estimated_duration_hours' => $request->estimated_duration_hours,
            'status' => $request->status ?? 'active',
            'route_type' => $request->route_type,
            'toll_charges' => $request->toll_charges ?? 0,
            'fuel_estimate_liters' => $request->fuel_estimate_liters ?? 0,
            'description' => $request->description,
            'waypoints' => $waypoints
        ]);

        return response()->json([
            'message' => 'Route created successfully',
            'route' => $route
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Route $route): JsonResponse
    {
        return response()->json($route);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Route $route): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'distance_km' => 'required|numeric|min:0',
            'estimated_duration_hours' => 'required|numeric|min:0',
            'status' => 'in:active,inactive',
            'route_type' => 'required|in:local,inter_city,highway',
            'toll_charges' => 'numeric|min:0',
            'fuel_estimate_liters' => 'numeric|min:0',
            'description' => 'nullable|string',
            'waypoints' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Process waypoints - convert comma-separated string to array
        $waypoints = null;
        if ($request->waypoints) {
            $waypoints = array_map('trim', explode(',', $request->waypoints));
        }

        $route->update([
            'name' => $request->name,
            'origin' => $request->origin,
            'destination' => $request->destination,
            'distance_km' => $request->distance_km,
            'estimated_duration_hours' => $request->estimated_duration_hours,
            'status' => $request->status ?? 'active',
            'route_type' => $request->route_type,
            'toll_charges' => $request->toll_charges ?? 0,
            'fuel_estimate_liters' => $request->fuel_estimate_liters ?? 0,
            'description' => $request->description,
            'waypoints' => $waypoints
        ]);

        return response()->json([
            'message' => 'Route updated successfully',
            'route' => $route
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Route $route): JsonResponse
    {
        $route->delete();

        return response()->json([
            'message' => 'Route deleted successfully'
        ]);
    }
}
