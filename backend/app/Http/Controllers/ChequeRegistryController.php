<?php

namespace App\Http\Controllers;

use App\Models\ChequeRegistryEntry;
use App\Models\Company;
use App\Models\CompanyChequeAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ChequeRegistryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ChequeRegistryEntry::with([
            'company:id,name',
            'chequeAccount:id,company_id,bank_name,account_no,current_balance',
            'distributionPayment:id,payment_number,payment_date,amount,payment_method,reference_no,status,received_by,customer_id',
            'distributionPayment.customer:id,shop_name,customer_code',
        ])->orderByDesc('created_at');

        if ($request->filled('direction')) {
            $query->where('direction', $request->input('direction'));
        }

        if ($request->filled('lifecycle_status')) {
            $query->where('lifecycle_status', $request->input('lifecycle_status'));
        }

        if ($request->filled('source_module')) {
            $query->where('source_module', $request->input('source_module'));
        }

        $entries = $query->paginate((int) $request->input('per_page', 25));

        $distributionCheques = DB::table('distribution_payments as dp')
            ->leftJoin('distribution_customers as dc', 'dc.id', '=', 'dp.customer_id')
            ->leftJoin('users as u', 'u.id', '=', 'dp.received_by')
            ->where('dp.payment_method', 'check')
            ->orderByDesc('dp.payment_date')
            ->orderByDesc('dp.id')
            ->select([
                'dp.id',
                'dp.payment_number',
                'dp.payment_date',
                'dp.amount',
                'dp.reference_no',
                'dp.bank_name',
                'dp.status',
                'dp.notes',
                'dp.created_at',
                DB::raw("COALESCE(dc.shop_name, '-') as customer_name"),
                DB::raw("COALESCE(dc.customer_code, '-') as customer_code"),
                DB::raw("COALESCE(u.name, 'Unknown') as sales_person_name"),
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $entries,
            'distribution_cheques' => $distributionCheques,
            'message' => 'Cheque registry retrieved successfully',
        ]);
    }

    public function registerReceived(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'cheque_no' => 'required|string|max:100',
            'cheque_date' => 'required|date',
            'amount' => 'required|numeric|gt:0',
            'bank_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:100',
            'counterparty_name' => 'required|string|max:255',
            'reference_no' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'source_module' => 'nullable|in:manual,distribution',
            'distribution_payment_id' => 'nullable|exists:distribution_payments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        if (($payload['source_module'] ?? 'manual') === 'distribution' && empty($payload['distribution_payment_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Distribution payment is required when source module is distribution.',
            ], 422);
        }

        $entry = ChequeRegistryEntry::create([
            'company_id' => $payload['company_id'],
            'direction' => 'received',
            'lifecycle_status' => 'registered',
            'source_module' => $payload['source_module'] ?? 'manual',
            'distribution_payment_id' => $payload['distribution_payment_id'] ?? null,
            'cheque_no' => $payload['cheque_no'],
            'cheque_date' => $payload['cheque_date'],
            'amount' => $payload['amount'],
            'bank_name' => $payload['bank_name'] ?? null,
            'account_no' => $payload['account_no'] ?? null,
            'counterparty_name' => $payload['counterparty_name'],
            'reference_no' => $payload['reference_no'] ?? null,
            'notes' => $payload['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $entry->load(['company:id,name']),
            'message' => 'Cheque registered successfully',
        ], 201);
    }

    public function deposit(Request $request, int $id): JsonResponse
    {
        $entry = ChequeRegistryEntry::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Cheque registry entry not found',
            ], 404);
        }

        if ($entry->direction !== 'received') {
            return response()->json([
                'success' => false,
                'message' => 'Only received cheques can be deposited.',
            ], 422);
        }

        if ($entry->lifecycle_status === 'deposited' || $entry->lifecycle_status === 'cleared') {
            return response()->json([
                'success' => false,
                'message' => 'This cheque is already deposited.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'company_cheque_account_id' => 'required|exists:company_cheque_accounts,id',
            'deposit_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $updated = DB::transaction(function () use ($entry, $payload) {
            $chequeAccount = CompanyChequeAccount::findOrFail($payload['company_cheque_account_id']);

            if ($entry->company_id && (int) $entry->company_id !== (int) $chequeAccount->company_id) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Selected cheque account does not belong to cheque company.',
                ], 422));
            }

            CompanyChequeAccount::whereKey($chequeAccount->id)
                ->update(['current_balance' => DB::raw('current_balance + ' . (float) $entry->amount)]);

            $company = Company::findOrFail($chequeAccount->company_id);
            $companyChequeBalance = (float) $company->chequeAccounts()->sum('current_balance');
            $company->update(['current_cheque_balance' => round($companyChequeBalance, 2)]);

            $entry->update([
                'company_id' => $chequeAccount->company_id,
                'company_cheque_account_id' => $chequeAccount->id,
                'deposit_date' => $payload['deposit_date'],
                'lifecycle_status' => 'deposited',
                'notes' => $payload['notes'] ?? $entry->notes,
            ]);

            return $entry->fresh()->load(['company:id,name', 'chequeAccount:id,company_id,bank_name,account_no,current_balance']);
        });

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Cheque deposited successfully',
        ]);
    }

    public function issueCheque(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'company_cheque_account_id' => 'required|exists:company_cheque_accounts,id',
            'supplier_name' => 'required|string|max:255',
            'cheque_no' => 'required|string|max:100',
            'cheque_date' => 'required|date',
            'amount' => 'required|numeric|gt:0',
            'bank_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:100',
            'reference_no' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $entry = DB::transaction(function () use ($payload, $request) {
            $chequeAccount = CompanyChequeAccount::findOrFail($payload['company_cheque_account_id']);

            if ((int) $chequeAccount->company_id !== (int) $payload['company_id']) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Cheque account does not belong to selected company.',
                ], 422));
            }

            $available = (float) $chequeAccount->current_balance;
            $amount = (float) $payload['amount'];

            if ($available < $amount) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Insufficient cheque account balance.',
                ], 422));
            }

            CompanyChequeAccount::whereKey($chequeAccount->id)
                ->update(['current_balance' => DB::raw('current_balance - ' . $amount)]);

            $company = Company::findOrFail($payload['company_id']);
            $companyChequeBalance = (float) $company->chequeAccounts()->sum('current_balance');
            $company->update(['current_cheque_balance' => round($companyChequeBalance, 2)]);

            return ChequeRegistryEntry::create([
                'company_id' => $payload['company_id'],
                'company_cheque_account_id' => $chequeAccount->id,
                'direction' => 'issued',
                'lifecycle_status' => 'issued',
                'source_module' => 'supplier_payment',
                'cheque_no' => $payload['cheque_no'],
                'cheque_date' => $payload['cheque_date'],
                'amount' => $payload['amount'],
                'bank_name' => $payload['bank_name'] ?? $chequeAccount->bank_name,
                'account_no' => $payload['account_no'] ?? $chequeAccount->account_no,
                'counterparty_name' => $payload['supplier_name'],
                'reference_no' => $payload['reference_no'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $entry->load(['company:id,name', 'chequeAccount:id,company_id,bank_name,account_no,current_balance']),
            'message' => 'Issued cheque saved successfully',
        ], 201);
    }
}
