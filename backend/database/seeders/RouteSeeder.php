<?php

namespace Database\Seeders;

use App\Models\Route;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RouteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $routes = [
            [
                'name' => 'Colombo City Route',
                'origin' => 'Colombo Central Warehouse',
                'destination' => 'Colombo City Center',
                'distance_km' => 15.5,
                'estimated_duration_hours' => 1.5,
                'status' => 'active',
                'route_type' => 'local',
                'toll_charges' => 150.00,
                'fuel_estimate_liters' => 12.5,
                'description' => 'Main route for Colombo city deliveries',
                'waypoints' => null
            ],
            [
                'name' => 'Colombo-Kandy Highway',
                'origin' => 'Colombo Distribution Center',
                'destination' => 'Kandy Warehouse',
                'distance_km' => 115.0,
                'estimated_duration_hours' => 3.5,
                'status' => 'active',
                'route_type' => 'highway',
                'toll_charges' => 850.00,
                'fuel_estimate_liters' => 45.0,
                'description' => 'Major highway route connecting Colombo to Kandy',
                'waypoints' => ['Kadawatha', 'Gampaha']
            ],
            [
                'name' => 'Galle Coastal Route',
                'origin' => 'Colombo Port',
                'destination' => 'Galle Harbor',
                'distance_km' => 125.0,
                'estimated_duration_hours' => 4.0,
                'status' => 'active',
                'route_type' => 'inter_city',
                'toll_charges' => 320.00,
                'fuel_estimate_liters' => 38.5,
                'description' => 'Coastal route for southern deliveries',
                'waypoints' => null
            ],
            [
                'name' => 'Jaffna Northern Route',
                'origin' => 'Colombo Main Depot',
                'destination' => 'Jaffna Distribution Center',
                'distance_km' => 395.0,
                'estimated_duration_hours' => 8.5,
                'status' => 'active',
                'route_type' => 'highway',
                'toll_charges' => 1250.00,
                'fuel_estimate_liters' => 95.0,
                'description' => 'Long distance route to northern region',
                'waypoints' => ['Kurunegala', 'Anuradhapura']
            ],
            [
                'name' => 'Matara Southern Route',
                'origin' => 'Colombo South Depot',
                'destination' => 'Matara Warehouse',
                'distance_km' => 165.0,
                'estimated_duration_hours' => 5.0,
                'status' => 'active',
                'route_type' => 'inter_city',
                'toll_charges' => 450.00,
                'fuel_estimate_liters' => 52.0,
                'description' => 'Southern route for regional distribution',
                'waypoints' => null
            ]
        ];

        foreach ($routes as $route) {
            Route::create($route);
        }
    }
}
