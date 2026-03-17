'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Outlet {
  id: number;
  name: string;
  code: string;
  manager_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface OutletStockLine {
  inventory_item_id: number;
  name: string;
  code: string;
  unit: string;
  available_quantity: number;
}

interface OutletSalesItemWise {
  inventory_item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  total_qty: number;
  total_amount: number;
}

interface OutletSaleRecord {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name: string | null;
  total_quantity: number;
  total_amount: number;
}

export default function OutletManagementPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockLines, setStockLines] = useState<OutletStockLine[]>([]);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesTotals, setSalesTotals] = useState({ total_sales: 0, total_quantity: 0, total_amount: 0 });
  const [salesRecords, setSalesRecords] = useState<OutletSaleRecord[]>([]);
  const [itemWiseSales, setItemWiseSales] = useState<OutletSalesItemWise[]>([]);
  const [origin, setOrigin] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
    outlet_user_name: '',
    outlet_user_email: '',
    outlet_user_password: '',
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
    } else {
      setToken(storedToken);
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchOutlets();
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/outlets', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 100 }
      });

      const data = response.data.success ? (response.data.data.data || response.data.data || []) : [];
      setOutlets(data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      manager_name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      outlet_user_name: '',
      outlet_user_email: '',
      outlet_user_password: '',
    });
    setEditingOutlet(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      code: outlet.code,
      manager_name: outlet.manager_name || '',
      email: outlet.email || '',
      phone: outlet.phone || '',
      address: outlet.address || '',
      status: outlet.status,
      outlet_user_name: outlet.user?.name || '',
      outlet_user_email: outlet.user?.email || '',
      outlet_user_password: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingOutlet) {
        const updatePayload = {
          name: formData.name,
          code: formData.code,
          manager_name: formData.manager_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status,
        };
        await axios.put(`http://localhost:8000/api/outlets/${editingOutlet.id}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const createRes = await axios.post('http://localhost:8000/api/outlets', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const createdOutlet = createRes?.data?.data;
        const posLink = `${window.location.origin}/outlet-pos?outlet_code=${encodeURIComponent(createdOutlet?.code || formData.code)}`;
        alert(`Outlet created successfully. POS Link: ${posLink}\nOutlet POS Login Email: ${formData.outlet_user_email}`);
      }

      setShowModal(false);
      resetForm();
      fetchOutlets();
    } catch (error: any) {
      console.error('Error saving outlet:', error);
      alert(error?.response?.data?.message || 'Failed to save outlet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (outlet: Outlet) => {
    if (!confirm(`Delete outlet ${outlet.name}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/outlets/${outlet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOutlets();
    } catch (error: any) {
      console.error('Error deleting outlet:', error);
      alert(error?.response?.data?.message || 'Failed to delete outlet');
    }
  };

  const openStoreReport = async (outlet: Outlet) => {
    try {
      setSelectedOutlet(outlet);
      setStockModalOpen(true);
      setStockLoading(true);

      const response = await axios.get(`http://localhost:8000/api/outlets/${outlet.id}/stock-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lines = response.data?.success ? (response.data?.data?.stocks || []) : [];
      setStockLines(lines);
    } catch (error) {
      console.error('Error fetching outlet store report:', error);
      setStockLines([]);
    } finally {
      setStockLoading(false);
    }
  };

  const openSalesRecords = async (outlet: Outlet) => {
    try {
      setSelectedOutlet(outlet);
      setSalesModalOpen(true);
      setSalesLoading(true);

      const response = await axios.get(`http://localhost:8000/api/outlet-pos/outlets/${outlet.id}/sales-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.data || {};
      setSalesTotals(data?.totals || { total_sales: 0, total_quantity: 0, total_amount: 0 });
      setSalesRecords(data?.sales || []);
      setItemWiseSales(data?.item_wise || []);
    } catch (error) {
      console.error('Error fetching outlet sales records:', error);
      setSalesTotals({ total_sales: 0, total_quantity: 0, total_amount: 0 });
      setSalesRecords([]);
      setItemWiseSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-lg">
                🏪
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Outlets Management</h1>
                <p className="text-xs text-gray-500">Create, edit and delete outlets</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outlets Management</h1>
            <p className="mt-2 text-gray-600">Create, edit and delete outlet records.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => router.push('/dashboard/outlets')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Outlets Home
            </button>
            <button
              onClick={() => router.push('/dashboard/outlets/sales')}
              className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Outlet Sales Tracking
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-violet-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-violet-700"
            >
              Add Outlet
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POS Access</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outlets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                      No outlets found.
                    </td>
                  </tr>
                ) : (
                  outlets.map((outlet) => (
                    <tr key={outlet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{outlet.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{outlet.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{outlet.manager_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{outlet.user?.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/outlet-pos?outlet_code=${encodeURIComponent(outlet.code)}`, '_blank')}
                            className="px-2 py-1 text-xs rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          >
                            Open POS
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const posLink = `${origin}/outlet-pos?outlet_code=${encodeURIComponent(outlet.code)}`;
                              try {
                                await navigator.clipboard.writeText(posLink);
                                alert(`POS link copied for ${outlet.name}`);
                              } catch {
                                alert(posLink);
                              }
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Copy Link
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{outlet.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          outlet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {outlet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/outlets/store/${outlet.id}`)}
                            className="text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            View Store
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/outlets/sales/${outlet.id}`)}
                            className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Sales Records
                          </button>
                          <button
                            onClick={() => openEdit(outlet)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(outlet)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingOutlet ? 'Edit Outlet' : 'Create Outlet'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {!editingOutlet && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Outlet User Name</label>
                      <input
                        type="text"
                        value={formData.outlet_user_name}
                        onChange={(e) => setFormData({ ...formData, outlet_user_name: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Outlet User Email</label>
                      <input
                        type="email"
                        value={formData.outlet_user_email}
                        onChange={(e) => setFormData({ ...formData, outlet_user_email: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {!editingOutlet && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet User Password</label>
                  <input
                    type="password"
                    value={formData.outlet_user_password}
                    onChange={(e) => setFormData({ ...formData, outlet_user_password: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                    minLength={8}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm text-black"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-violet-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingOutlet ? 'Update Outlet' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Outlet Store - {selectedOutlet?.name}
              </h3>
              <button
                onClick={() => {
                  setStockModalOpen(false);
                  setStockLines([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {stockLoading ? (
              <div className="py-8 text-center text-gray-500">Loading outlet store...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockLines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No stock in this outlet store.</td>
                      </tr>
                    ) : (
                      stockLines.map((line) => (
                        <tr key={line.inventory_item_id}>
                          <td className="px-4 py-2 text-sm text-gray-800">{line.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{line.code}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{line.unit}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(line.available_quantity || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {salesModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sales Records - {selectedOutlet?.name}
              </h3>
              <button
                onClick={() => {
                  setSalesModalOpen(false);
                  setSalesRecords([]);
                  setItemWiseSales([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {salesLoading ? (
              <div className="py-8 text-center text-gray-500">Loading sales records...</div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-black flex flex-wrap gap-4">
                  <span>Total Sales: <strong>{Number(salesTotals.total_sales || 0)}</strong></span>
                  <span>Total Sales Qty: <strong>{Number(salesTotals.total_quantity || 0).toFixed(2)}</strong></span>
                  <span>Total Sales Amount: <strong>{Number(salesTotals.total_amount || 0).toFixed(2)}</strong></span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Item-wise Sales Qty</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sales Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sales Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {itemWiseSales.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No item-wise sales yet.</td>
                          </tr>
                        ) : (
                          itemWiseSales.map((line) => (
                            <tr key={`${line.inventory_item_id}-${line.item_code}`}>
                              <td className="px-4 py-2 text-sm text-gray-800">{line.item_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{line.item_code}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{line.unit || '-'}</td>
                              <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(line.total_qty || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(line.total_amount || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Sales History</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {salesRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No sales records found.</td>
                          </tr>
                        ) : (
                          salesRecords.map((record) => (
                            <tr key={record.id}>
                              <td className="px-4 py-2 text-sm text-gray-800">{record.sale_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{new Date(record.sale_date).toLocaleString()}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{record.customer_name || '-'}</td>
                              <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(record.total_quantity || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(record.total_amount || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
