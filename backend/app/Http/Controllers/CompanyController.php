<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::all();
        return response()->json($companies);
    }

    public function show(Company $company)
    {
        return response()->json($company);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:companies',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $payload = $request->only(['name', 'email', 'address', 'phone', 'website', 'country', 'currency']);

        if ($request->hasFile('logo')) {
            $payload['logo_path'] = $request->file('logo')->store('company-logos', 'public');
        }

        $company = Company::create($payload);

        return response()->json($company, 201);
    }

    public function update(Request $request, Company $company)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:companies,email,' . $company->id,
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $payload = $request->only(['name', 'email', 'address', 'phone', 'website', 'country', 'currency']);

        if ($request->hasFile('logo')) {
            if ($company->logo_path && Storage::disk('public')->exists($company->logo_path)) {
                Storage::disk('public')->delete($company->logo_path);
            }

            $payload['logo_path'] = $request->file('logo')->store('company-logos', 'public');
        }

        $company->update($payload);

        return response()->json($company);
    }

    public function destroy(Company $company)
    {
        // Check if company is referenced in other tables
        $hasEmployees = Employee::where('tenant_id', $company->id)->orWhere('branch_id', $company->id)->exists();
        $hasCandidates = Candidate::where('tenant_id', $company->id)->orWhere('branch_id', $company->id)->exists();
        $hasDepartments = Department::where('tenant_id', $company->id)->orWhere('branch_id', $company->id)->exists();
        $hasDesignations = Designation::where('tenant_id', $company->id)->orWhere('branch_id', $company->id)->exists();

        if ($hasEmployees || $hasCandidates || $hasDepartments || $hasDesignations) {
            return response()->json(['error' => 'Cannot delete company because it is referenced by other records.'], 422);
        }

        $company->delete();
        return response()->json(['message' => 'Company deleted successfully']);
    }
}
