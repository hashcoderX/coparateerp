'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  website?: string;
  country?: string;
  currency?: string;
  logo_path?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

const PROFILE_ID_KEY = 'company_profile_id';
const PROFILE_DATA_KEY = 'company_profile_data';

export default function CompanySettingsPage() {
  const [token, setToken] = useState('');
  const [accessReady, setAccessReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      try {
        const userRes = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = userRes.data || {};
        const employeeId = Number(userData?.employee_id || userData?.employee?.id || 0);
        const roleNames = [
          String(userData?.role || ''),
          ...(Array.isArray(userData?.roles)
            ? userData.roles.map((role: any) => String(role?.name || role || ''))
            : []),
        ]
          .join(' ')
          .toLowerCase();

        const adminUser =
          !employeeId ||
          roleNames.includes('super admin') ||
          roleNames.includes('superadmin') ||
          roleNames.includes('administrator') ||
          roleNames.includes('admin');

        setIsAdmin(adminUser);

        if (!adminUser) {
          router.push('/dashboard');
          return;
        }

        const profileIdRaw = localStorage.getItem(PROFILE_ID_KEY);
        if (profileIdRaw) {
          const parsed = Number(profileIdRaw);
          if (parsed > 0) setActiveProfileId(parsed);
        }

        await fetchCompanies(token);
      } catch (error) {
        console.error('Error loading company settings access:', error);
        router.push('/dashboard');
      } finally {
        setAccessReady(true);
      }
    };

    bootstrap();
  }, [token, router]);

  const fetchCompanies = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/companies', {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCompanies(rows);

      if (rows.length > 0 && !activeProfileId) {
        const first = rows[0];
        setActiveCompanyProfile(first);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const activeCompany = useMemo(
    () => companies.find((company) => Number(company.id) === Number(activeProfileId)) || null,
    [companies, activeProfileId]
  );

  const profileCount = companies.length;
  const profileCoverage = activeCompany
    ? [
        activeCompany.name,
        activeCompany.email,
        activeCompany.phone,
        activeCompany.address,
        activeCompany.country,
        activeCompany.currency,
      ].filter((value) => Boolean(String(value || '').trim())).length
    : 0;
  const profileHealth = activeCompany ? Math.round((profileCoverage / 6) * 100) : 0;

  const setActiveCompanyProfile = (company: CompanyProfile) => {
    setActiveProfileId(company.id);
    localStorage.setItem(PROFILE_ID_KEY, String(company.id));
    localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(company));
  };

  const resetForm = () => {
    setEditingCompanyId(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setWebsite('');
    setCountry('');
    setCurrency('LKR');
    setLogoFile(null);
    setLogoPreview('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (company: CompanyProfile) => {
    setEditingCompanyId(company.id);
    setName(company.name || '');
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setAddress(company.address || '');
    setWebsite(company.website || '');
    setCountry(company.country || '');
    setCurrency(company.currency || 'LKR');
    setLogoFile(null);
    setLogoPreview(company.logo_url || '');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append('name', name);
    payload.append('email', email);
    if (phone.trim()) payload.append('phone', phone.trim());
    if (address.trim()) payload.append('address', address.trim());
    if (website.trim()) payload.append('website', website.trim());
    if (country.trim()) payload.append('country', country.trim());
    if (currency.trim()) payload.append('currency', currency.trim());
    if (logoFile) payload.append('logo', logoFile);

    try {
      setSaving(true);

      if (editingCompanyId) {
        payload.append('_method', 'PUT');
        await axios.post(`http://localhost:8000/api/companies/${editingCompanyId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('http://localhost:8000/api/companies', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchCompanies();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving company profile:', error);
      alert(error?.response?.data?.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!token || !accessReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-emerald-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-12 -left-16 w-72 h-72 bg-cyan-200/60 rounded-full blur-3xl"></div>
        <div className="absolute top-24 right-0 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-200/50 rounded-full blur-3xl"></div>
      </div>

      <nav className="relative z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Company Settings</h1>
              <p className="text-xs text-gray-500">Configure company profiles for invoices, documents, and operational identity.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 border border-transparent rounded-md text-sm font-semibold text-white hover:from-emerald-700 hover:to-cyan-700 shadow-lg shadow-emerald-200/50 transition-all"
              >
                Add Company Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-lg shadow-xl p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Company Identity Center</h2>
              <p className="text-sm text-gray-600 mt-1">Maintain profile consistency for invoices, printed docs, and branch operations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 border border-cyan-200">
                Profiles: {profileCount}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                Active Health: {profileHealth}%
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4">
              <p className="text-xs uppercase tracking-wide text-cyan-700 font-semibold">Active Profile</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeCompany ? activeCompany.name : 'Not Set'}</p>
              <p className="text-xs text-gray-600 mt-1">Selected profile is used in headers and print outputs.</p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
              <p className="text-xs uppercase tracking-wide text-sky-700 font-semibold">Data Completeness</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{profileHealth}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-sky-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-500" style={{ width: `${profileHealth}%` }}></div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Currency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeCompany?.currency || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">Default currency used in financial documents.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-lg shadow-xl p-5 md:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Document Profile</h3>
          {activeCompany ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
                <p><span className="font-medium">Company:</span> {activeCompany.name}</p>
                <p><span className="font-medium">Email:</span> {activeCompany.email}</p>
                <p><span className="font-medium">Phone:</span> {activeCompany.phone || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
                <p><span className="font-medium">Address:</span> {activeCompany.address || '-'}</p>
                <p><span className="font-medium">Country:</span> {activeCompany.country || '-'}</p>
                <p><span className="font-medium">Currency:</span> {activeCompany.currency || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 md:col-span-2">
                <p className="font-medium mb-2">Logo:</p>
                {activeCompany.logo_url ? (
                  <img src={activeCompany.logo_url} alt="Company logo" className="h-16 w-auto object-contain rounded border border-gray-200 bg-white p-1" />
                ) : (
                  <p className="text-xs text-gray-500">No logo uploaded.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active company profile selected.</p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            This profile is stored in browser local storage and can be used for invoice headers and printed documents.
          </p>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-lg shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-cyan-50">
            <h2 className="text-sm font-semibold text-gray-900">Company Profiles</h2>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Loading company profiles...</div>
          ) : companies.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">No company profiles found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {companies.map((company) => {
                const isActive = Number(company.id) === Number(activeProfileId);
                return (
                  <div key={company.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-cyan-50/40 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-600">{company.email}</p>
                      <p className="text-xs text-gray-500">{company.address || '-'} {company.country ? `| ${company.country}` : ''}</p>
                      {company.logo_url && (
                        <div className="mt-2">
                          <img src={company.logo_url} alt={`${company.name} logo`} className="h-8 w-auto object-contain rounded border border-gray-200 bg-white p-1" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCompanyProfile(company)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isActive ? 'Active Profile' : 'Set Active'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(company)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {editingCompanyId ? 'Edit Company Profile' : 'Create Company Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-7 w-7 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gradient-to-b from-white to-cyan-50/30">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Logo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setLogoFile(file);
                    if (file) {
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 file:mr-3 file:rounded file:border-0 file:bg-cyan-100 file:px-2 file:py-1 file:text-cyan-700"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain rounded border border-gray-200 bg-white p-1" />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Accepted: JPG, PNG, WEBP. Max size: 2MB.</p>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-md text-sm font-semibold hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 shadow-lg shadow-emerald-200/50 transition-all">
                  {saving ? 'Saving...' : editingCompanyId ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
