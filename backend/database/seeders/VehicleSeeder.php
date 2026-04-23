<?php

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vehicles = [
            [
                'registration_number' => 'TRK-001',
                'type' => 'truck',
                'capacity_kg' => 5000,
                'status' => 'active',
                'fuel_type' => 'diesel',
                'model' => 'Ashok Leyland Boss',
                'year' => 2022,
                'insurance_expiry' => '2025-06-15',
                'license_expiry' => '2025-03-20',
                'current_location' => 'Colombo Depot',
                'notes' => 'Well maintained, recently serviced'
            ],
            [
                'registration_number' => 'VAN-002',
                'type' => 'van',
                'capacity_kg' => 1500,
                'status' => 'active',
                'fuel_type' => 'petrol',
                'model' => 'Toyota Hiace',
                'year' => 2021,
                'insurance_expiry' => '2025-08-10',
                'license_expiry' => '2025-05-15',
                'current_location' => 'Kandy Depot',
                'notes' => 'Good condition'
            ],
            [
                'registration_number' => 'TRK-003',
                'type' => 'truck',
                'capacity_kg' => 8000,
                'status' => 'maintenance',
                'fuel_type' => 'diesel',
                'model' => 'Tata LPT',
                'year' => 2020,
                'insurance_expiry' => '2025-04-22',
                'license_expiry' => '2025-01-30',
                'current_location' => 'Workshop',
                'notes' => 'Under maintenance - brake system'
            ],
            [
                'registration_number' => 'PIC-004',
                'type' => 'pickup',
                'capacity_kg' => 1200,
                'status' => 'active',
                'fuel_type' => 'diesel',
                'model' => 'Mitsubishi L200',
                'year' => 2023,
                'insurance_expiry' => '2025-09-05',
                'license_expiry' => '2025-06-10',
                'current_location' => 'Galle Depot',
                'notes' => 'New vehicle, excellent condition'
            ],
            [
                'registration_number' => 'LOR-005',
                'type' => 'lorry',
                'capacity_kg' => 10000,
                'status' => 'active',
                'fuel_type' => 'diesel',
                'model' => 'Isuzu F Series',
                'year' => 2019,
                'insurance_expiry' => '2025-02-28',
                'license_expiry' => '2024-12-15',
                'current_location' => 'Matara Depot',
                'notes' => 'Heavy duty vehicle for long distance transport'
            ]
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create($vehicle);
        }
    }
}
