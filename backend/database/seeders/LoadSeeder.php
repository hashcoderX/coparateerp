<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Load;

class LoadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = \App\Models\Employee::all();
        $vehicles = \App\Models\Vehicle::all();
        $routes = \App\Models\Route::all();

        if ($employees->count() >= 3 && $vehicles->count() >= 2 && $routes->count() >= 2) {
            Load::create([
                'load_number' => 'VL-2024-001',
                'vehicle_id' => $vehicles->first()->id,
                'driver_id' => $employees->first()->id,
                'route_id' => $routes->first()->id,
                'status' => 'in_transit',
                'load_date' => '2024-02-24',
                'delivery_date' => null,
                'total_weight' => 2500.00,
                'total_value' => 150000.00,
                'notes' => 'Electronics shipment to Colombo'
            ]);

            Load::create([
                'load_number' => 'VL-2024-002',
                'vehicle_id' => $vehicles->skip(1)->first()->id,
                'driver_id' => $employees->skip(1)->first()->id,
                'route_id' => $routes->skip(1)->first()->id,
                'status' => 'delivered',
                'load_date' => '2024-02-23',
                'delivery_date' => '2024-02-24',
                'total_weight' => 1800.00,
                'total_value' => 95000.00,
                'notes' => 'Food items shipment to Kandy'
            ]);

            Load::create([
                'load_number' => 'VL-2024-003',
                'vehicle_id' => $vehicles->first()->id,
                'driver_id' => $employees->first()->id,
                'route_id' => $routes->first()->id,
                'status' => 'pending',
                'load_date' => '2024-02-25',
                'delivery_date' => null,
                'total_weight' => 3200.00,
                'total_value' => 200000.00,
                'notes' => 'Construction materials shipment'
            ]);
        }
    }
}
