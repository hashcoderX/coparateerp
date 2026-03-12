<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use App\Models\Designation;
use App\Http\Requests\StoreEmployeeRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Employee::with(['department', 'designation', 'branch', 'user:id,employee_id,role,email,name']);

        // Filter by authenticated user's tenant/branch if available
        $user = $request->user();
        if ($user && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $employees = $query->get();

        return response()->json($employees);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Set default values for required fields
        $employeeData = [
            'tenant_id' => 1, // Default tenant
            'branch_id' => $validated['branch_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'mobile' => $validated['phone'] ?? '',
            'nic_passport' => 'TEMP' . time(), // Temporary NIC for demo
            'address' => $validated['address'] ?? '',
            'photo_path' => $validated['photo_path'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => 'other', // Default gender
            'department_id' => $validated['department_id'],
            'designation_id' => $validated['designation_id'],
            'join_date' => $validated['hire_date'],
            'basic_salary' => $validated['basic_salary'],
            'commission' => $validated['commission'] ?? null,
            'commission_base' => $validated['commission_base'] ?? null,
            'overtime_payment_per_hour' => $validated['overtime_payment_per_hour'] ?? null,
            'deduction_late_hour' => $validated['deduction_late_hour'] ?? null,
            'employee_type' => 'full_time', // Default type
            'status' => $validated['status'] ?? 'active',
        ];

        // Generate employee code
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        $nextNumber = $lastEmployee ? intval(substr($lastEmployee->employee_code, -4)) + 1 : 1;
        $employeeData['employee_code'] = 'EMP' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $employee = Employee::create($employeeData);

        // Create user account for the employee
        $employee->load('designation');
        $designationName = $employee->designation?->name;
        $userRole = $designationName ?: 'employee';

        User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $userRole,
            'employee_id' => $employee->id,
            'branch_id' => $validated['branch_id'],
        ]);

        return response()->json($employee->load(['department', 'designation', 'branch', 'user:id,employee_id,role,email,name']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee): JsonResponse
    {
        return response()->json($employee->load(['department', 'designation', 'branch', 'user:id,employee_id,role,email,name']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:employees,email,' . $employee->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'date_of_birth' => 'nullable|date|before:today',
            'hire_date' => 'sometimes|required|date',
            'basic_salary' => 'sometimes|required|numeric|min:0',
            'commission' => 'nullable|numeric|min:0|max:100',
            'commission_base' => 'nullable|in:company_profit,own_business',
            'overtime_payment_per_hour' => 'nullable|numeric|min:0',
            'deduction_late_hour' => 'nullable|numeric|min:0',
            'department_id' => 'sometimes|required|exists:departments,id',
            'designation_id' => 'sometimes|required|exists:designations,id',
            'branch_id' => 'sometimes|required|exists:companies,id',
            'status' => 'in:active,inactive',
        ]);

        // Map frontend fields to backend fields
        $updateData = [
            'first_name' => $validated['first_name'] ?? $employee->first_name,
            'last_name' => $validated['last_name'] ?? $employee->last_name,
            'email' => $validated['email'] ?? $employee->email,
            'mobile' => $validated['phone'] ?? $employee->mobile,
            'address' => $validated['address'] ?? $employee->address,
            'date_of_birth' => $validated['date_of_birth'] ?? $employee->date_of_birth,
            'department_id' => $validated['department_id'] ?? $employee->department_id,
            'designation_id' => $validated['designation_id'] ?? $employee->designation_id,
            'branch_id' => $validated['branch_id'] ?? $employee->branch_id,
            'join_date' => $validated['hire_date'] ?? $employee->join_date,
            'basic_salary' => $validated['basic_salary'] ?? $employee->basic_salary,
            'commission' => $validated['commission'] ?? $employee->commission,
            'commission_base' => $validated['commission_base'] ?? $employee->commission_base,
            'overtime_payment_per_hour' => $validated['overtime_payment_per_hour'] ?? $employee->overtime_payment_per_hour,
            'deduction_late_hour' => $validated['deduction_late_hour'] ?? $employee->deduction_late_hour,
            'status' => $validated['status'] ?? $employee->status,
        ];

        $employee->update($updateData);

        // Keep linked user role in sync with designation
        $employee->load('designation');
        $employeeUser = User::where('employee_id', $employee->id)->first();
        if ($employeeUser && $employee->designation) {
            $employeeUser->update(['role' => $employee->designation->name]);
        }

        return response()->json($employee->load(['department', 'designation', 'branch', 'user:id,employee_id,role,email,name']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully']);
    }
}
