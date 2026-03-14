<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\Api\HR\DepartmentController;
use App\Http\Controllers\Api\HR\DesignationController;
use App\Http\Controllers\Api\HR\EmployeeController;
use App\Http\Controllers\Api\HR\AttendanceController;
use App\Http\Controllers\Api\HR\LeaveController;
use App\Http\Controllers\Api\HR\LeaveTypeController;
use App\Http\Controllers\Api\HR\PayrollController;
use App\Http\Controllers\Api\HR\CandidateController;
use App\Http\Controllers\Api\HR\CandidateDocumentController;
use App\Http\Controllers\Api\HR\CandidateEducationController;
use App\Http\Controllers\Api\HR\CandidateExperienceController;
use App\Http\Controllers\Api\HR\CandidateInterviewController;
use App\Http\Controllers\Api\HR\EmployeeDocumentController;
use App\Http\Controllers\Api\HR\EmployeeEducationController;
use App\Http\Controllers\Api\HR\EmployeeExperienceController;
use App\Http\Controllers\Api\Purchasing\GRNController;
use App\Models\User;
use App\Http\Controllers\LoadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return null;
    }

    $user->loadMissing(['employee', 'roles.permissions']);

    // Backward compatibility: if legacy users.role exists but user_roles is empty,
    // expose matching role with permissions in the response.
    if ($user->roles->isEmpty() && !empty($user->role)) {
        $legacyRole = \App\Models\Role::with('permissions')
            ->whereRaw('LOWER(name) = ?', [strtolower((string) $user->role)])
            ->first();

        if ($legacyRole) {
            $user->setRelation('roles', collect([$legacyRole]));
        }
    }

    return $user;
})->middleware('auth:sanctum');

Route::get('/users', function () {
    return User::all();
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('companies', CompanyController::class);

    // HRM Routes
    Route::prefix('hr')->group(function () {
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('designations', DesignationController::class);
        Route::apiResource('employees', EmployeeController::class);
        Route::apiResource('candidates', CandidateController::class);
        // Candidate nested resources
        Route::get('candidates/{candidate}/documents', [CandidateDocumentController::class, 'index']);
        Route::post('candidates/{candidate}/documents', [CandidateDocumentController::class, 'store']);
        Route::delete('candidates/{candidate}/documents/{document}', [CandidateDocumentController::class, 'destroy']);
        Route::get('candidates/{candidate}/documents/{document}/download', [CandidateDocumentController::class, 'download']);

        Route::get('candidates/{candidate}/educations', [CandidateEducationController::class, 'index']);
        Route::post('candidates/{candidate}/educations', [CandidateEducationController::class, 'store']);
        Route::put('candidates/{candidate}/educations/{education}', [CandidateEducationController::class, 'update']);
        Route::delete('candidates/{candidate}/educations/{education}', [CandidateEducationController::class, 'destroy']);

        Route::get('candidates/{candidate}/experiences', [CandidateExperienceController::class, 'index']);
        Route::post('candidates/{candidate}/experiences', [CandidateExperienceController::class, 'store']);
        Route::put('candidates/{candidate}/experiences/{experience}', [CandidateExperienceController::class, 'update']);
        Route::delete('candidates/{candidate}/experiences/{experience}', [CandidateExperienceController::class, 'destroy']);
        Route::post('candidates/{candidate}/generate-appointment-letter', [CandidateController::class, 'generateAppointmentLetter']);
        Route::post('candidates/{candidate}/convert-to-employee', [CandidateController::class, 'convertToEmployee']);
        Route::post('candidates/{candidate}/schedule-interview', [CandidateController::class, 'scheduleInterview']);
        // Multiple interviews per candidate
        Route::get('candidates/{candidate}/interviews', [CandidateInterviewController::class, 'index']);
        Route::post('candidates/{candidate}/interviews', [CandidateInterviewController::class, 'store']);
        Route::put('candidates/{candidate}/interviews/{interview}', [CandidateInterviewController::class, 'update']);
        Route::get('interviews/upcoming', [CandidateInterviewController::class, 'upcoming']);
        Route::get('candidates/{candidate}/download-cv', [CandidateController::class, 'downloadCv']);
        Route::get('candidates/{candidate}/download-appointment-letter', [CandidateController::class, 'downloadAppointmentLetter']);

        // Employee nested resources
        Route::get('employees/{employee}/documents', [EmployeeDocumentController::class, 'index']);
        Route::post('employees/{employee}/documents', [EmployeeDocumentController::class, 'store']);
        Route::delete('employees/{employee}/documents/{document}', [EmployeeDocumentController::class, 'destroy']);
        Route::get('employees/{employee}/documents/{document}/download', [EmployeeDocumentController::class, 'download']);

        Route::get('employees/{employee}/education', [EmployeeEducationController::class, 'index']);
        Route::post('employees/{employee}/education', [EmployeeEducationController::class, 'store']);
        Route::put('employees/{employee}/education/{education}', [EmployeeEducationController::class, 'update']);
        Route::delete('employees/{employee}/education/{education}', [EmployeeEducationController::class, 'destroy']);

        Route::get('employees/{employee}/experience', [EmployeeExperienceController::class, 'index']);
        Route::post('employees/{employee}/experience', [EmployeeExperienceController::class, 'store']);
        Route::put('employees/{employee}/experience/{experience}', [EmployeeExperienceController::class, 'update']);
        Route::delete('employees/{employee}/experience/{experience}', [EmployeeExperienceController::class, 'destroy']);

        // Employee Allowances and Deductions
        Route::get('employees/{employee}/allowances-deductions', [EmployeeAllowanceDeductionController::class, 'index']);
        Route::post('employees/{employee}/allowances-deductions', [EmployeeAllowanceDeductionController::class, 'store']);
        Route::put('employees/{employee}/allowances-deductions/{allowanceDeduction}', [EmployeeAllowanceDeductionController::class, 'update']);
        Route::delete('employees/{employee}/allowances-deductions/{allowanceDeduction}', [EmployeeAllowanceDeductionController::class, 'destroy']);

        Route::apiResource('attendance', AttendanceController::class);
        Route::post('attendance/mark', [AttendanceController::class, 'markBasic']);
        Route::post('attendance/mark-out', [AttendanceController::class, 'markOut']);
        Route::post('attendance/upload-csv', [AttendanceController::class, 'uploadCsv']);
        Route::get('attendance/employee/{employeeId}', [AttendanceController::class, 'getEmployeeAttendance']);
        Route::apiResource('leaves', LeaveController::class);
        Route::post('leaves/{leave}/section-head-approve', [LeaveController::class, 'sectionHeadApprove']);
        Route::post('leaves/{leave}/hr-approve', [LeaveController::class, 'hrApprove']);
        Route::apiResource('leave-types', LeaveTypeController::class);
        Route::apiResource('payrolls', PayrollController::class);
        Route::post('payrolls/generate', [PayrollController::class, 'generate']);
        Route::get('payrolls/{payroll}/payslip', [PayrollController::class, 'payslip']);
    });

    // Role and Permission Management Routes
    Route::apiResource('roles', \App\Http\Controllers\RoleController::class);
    Route::apiResource('permissions', \App\Http\Controllers\PermissionController::class);
    Route::put('roles/{role}/permissions', [\App\Http\Controllers\RoleController::class, 'updatePermissions']);
    Route::post('roles/assign-to-user', [\App\Http\Controllers\RoleController::class, 'assignToUser']);
    Route::post('roles/remove-from-user', [\App\Http\Controllers\RoleController::class, 'removeFromUser']);
    Route::get('users/{userId}/roles', [\App\Http\Controllers\RoleController::class, 'getUserRoles']);

    // Stock Management Routes
    Route::apiResource('stock/suppliers', \App\Http\Controllers\SupplierController::class);
    Route::apiResource('stock/inventory', \App\Http\Controllers\InventoryController::class);
    Route::apiResource('stock/transfers', \App\Http\Controllers\StockTransferController::class)->only(['index', 'store']);
    Route::get('stock/transfers/reference/{reference}', [\App\Http\Controllers\StockTransferController::class, 'detailsByReference']);

    // Outlets Management Routes
    Route::apiResource('outlets', \App\Http\Controllers\OutletController::class);
    Route::get('outlets/{outlet}/stock-report', [\App\Http\Controllers\OutletController::class, 'stockReport']);

    // Purchasing Routes
    // Route::apiResource('purchasing/purchase-orders', PurchaseOrderController::class);
    Route::apiResource('purchasing/purchase-orders', \App\Http\Controllers\Api\Purchasing\PurchaseOrderController::class);
    Route::apiResource('purchasing/grn', \App\Http\Controllers\Api\Purchasing\GRNController::class);

    // Vehicle Loading Routes
    Route::apiResource('vehicle-loading/vehicles', \App\Http\Controllers\VehicleController::class);
    Route::apiResource('vehicle-loading/routes', \App\Http\Controllers\RouteController::class);
    Route::apiResource('vehicle-loading/loads', LoadController::class);
    Route::get('vehicle-loading/loads/{load}/delivery-summary', [LoadController::class, 'deliverySummary']);
    Route::apiResource('vehicle-loading/load-items', \App\Http\Controllers\LoadItemController::class);
    Route::post('vehicle-loading/load-items/upload-csv', [\App\Http\Controllers\LoadItemController::class, 'uploadCsv']);

    // Distribution Routes
    Route::apiResource('distribution/customers', \App\Http\Controllers\DistributionCustomerController::class);
    Route::apiResource('distribution/invoices', \App\Http\Controllers\DistributionInvoiceController::class);
    Route::apiResource('distribution/returns', \App\Http\Controllers\DistributionReturnController::class);
    Route::apiResource('distribution/payments', \App\Http\Controllers\DistributionPaymentController::class);
});