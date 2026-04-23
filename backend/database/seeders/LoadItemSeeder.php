<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Load;
use App\Models\LoadItem;

class LoadItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only seed if there are existing loads
        $loads = Load::all();

        if ($loads->isEmpty()) {
            $this->command->info('No loads found. Skipping LoadItem seeding.');
            return;
        }

        $sampleItems = [
            [
                'load_id' => $loads->first()->id,
                'product_code' => 'PROD001',
                'name' => 'Sample Finished Product 1',
                'type' => 'finished_product',
                'out_price' => 100.00,
                'sell_price' => 150.00,
                'qty' => 10.00,
            ],
            [
                'load_id' => $loads->first()->id,
                'product_code' => 'PROD002',
                'name' => 'Sample Finished Product 2',
                'type' => 'finished_product',
                'out_price' => 200.00,
                'sell_price' => 280.00,
                'qty' => 5.00,
            ],
            [
                'load_id' => $loads->first()->id,
                'product_code' => 'RAW001',
                'name' => 'Sample Raw Material 1',
                'type' => 'raw_material',
                'out_price' => 50.00,
                'sell_price' => 75.00,
                'qty' => 20.00,
            ],
        ];

        foreach ($sampleItems as $item) {
            LoadItem::create($item);
        }

        $this->command->info('LoadItem seeding completed.');
    }
}
