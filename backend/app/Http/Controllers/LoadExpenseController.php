<?php

namespace App\Http\Controllers;

use App\Models\DeliveryCashTransaction;
use App\Models\Load;
use App\Models\LoadExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LoadExpenseController extends Controller
{
    public function index(Load $load): JsonResponse
    {
        $rows = LoadExpense::query()
            ->where('load_id', $load->id)
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
            'message' => 'Load expenses retrieved successfully',
        ]);
    }

    public function store(Request $request, Load $load): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'expense_date' => 'required|date',
            'expense_type' => 'required|string|max:50',
            'amount' => 'required|numeric|gt:0',
            'reference' => 'nullable|string|max:100',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $result = DB::transaction(function () use ($request, $load, $payload) {
            $deliveryTx = DeliveryCashTransaction::create([
                'date' => $payload['expense_date'],
                'type' => 'out',
                'amount' => $payload['amount'],
                'reference' => $payload['reference'] ?? null,
                'note' => $payload['note'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $expense = LoadExpense::create([
                'load_id' => $load->id,
                'expense_date' => $payload['expense_date'],
                'expense_type' => $payload['expense_type'],
                'amount' => $payload['amount'],
                'reference' => $payload['reference'] ?? null,
                'note' => $payload['note'] ?? null,
                'delivery_cash_transaction_id' => $deliveryTx->id,
                'created_by' => $request->user()?->id,
            ]);

            return $expense;
        });

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Load expense saved and delivery cash deducted successfully',
        ], 201);
    }
}
