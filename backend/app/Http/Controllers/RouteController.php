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
            'origin' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'distance_km' => 'nullable|numeric|min:0',
            'estimated_duration_hours' => 'nullable|numeric|min:0',
            'status' => 'in:active,inactive',
            'route_type' => 'required|in:local,inter_city,highway',
            'toll_charges' => 'nullable|numeric|min:0',
            'fuel_estimate_liters' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'waypoints' => 'nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $waypoints = $this->parseWaypoints($request->input('waypoints'));

        $route = Route::create([
            'name' => $request->name,
            'origin' => $request->origin ?? '',
            'destination' => $request->destination ?? '',
            'distance_km' => $request->distance_km ?? 0,
            'estimated_duration_hours' => $request->estimated_duration_hours ?? 0,
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
            'origin' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'distance_km' => 'nullable|numeric|min:0',
            'estimated_duration_hours' => 'nullable|numeric|min:0',
            'status' => 'in:active,inactive',
            'route_type' => 'required|in:local,inter_city,highway',
            'toll_charges' => 'nullable|numeric|min:0',
            'fuel_estimate_liters' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'waypoints' => 'nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $waypoints = $this->parseWaypoints($request->input('waypoints'));

        $route->update([
            'name' => $request->name,
            'origin' => $request->origin ?? '',
            'destination' => $request->destination ?? '',
            'distance_km' => $request->distance_km ?? 0,
            'estimated_duration_hours' => $request->estimated_duration_hours ?? 0,
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

    private function parseWaypoints(mixed $rawWaypoints): ?array
    {
        if (is_array($rawWaypoints)) {
            $normalized = array_values(array_filter(array_map(static fn($point) => trim((string) $point), $rawWaypoints)));
            return empty($normalized) ? null : $normalized;
        }

        $raw = trim((string) ($rawWaypoints ?? ''));
        if ($raw === '') {
            return null;
        }

        $parsed = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return empty($parsed) ? null : $parsed;
    }
}
