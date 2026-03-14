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
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      website: website || null,
      country: country || null,
      currency: currency || null,
    };

    try {
      setSaving(true);

      if (editingCompanyId) {
        await axios.put(`http://localhost:8000/api/companies/${editingCompanyId}`, payload, {
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Company Settings</h1>
              <p className="text-xs text-gray-500">Configure company profile for invoices and documentation headers.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
              >
                Add Company Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Active Document Profile</h2>
          {activeCompany ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <p><span className="font-medium">Company:</span> {activeCompany.name}</p>
                <p><span className="font-medium">Email:</span> {activeCompany.email}</p>
                <p><span className="font-medium">Phone:</span> {activeCompany.phone || '-'}</p>
              </div>
              <div>
                <p><span className="font-medium">Address:</span> {activeCompany.address || '-'}</p>
                <p><span className="font-medium">Country:</span> {activeCompany.country || '-'}</p>
                <p><span className="font-medium">Currency:</span> {activeCompany.currency || '-'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active company profile selected.</p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            This profile is stored in browser local storage and can be used for invoice headers and printed documents.
          </p>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
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
                  <div key={company.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-600">{company.email}</p>
                      <p className="text-xs text-gray-500">{company.address || '-'} {company.country ? `| ${company.country}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCompanyProfile(company)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                          isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
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

            <form onSubmit={handleSave} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50">
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
