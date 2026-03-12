'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Customer {
  id: number;
  shop_name: string;
  customer_code: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  route_id?: number | null;
  route?: {
    id: number;
    name: string;
    origin: string;
    destination: string;
  } | null;
  outstanding?: number;
  status: 'active' | 'inactive';
}

interface RouteOption {
  id: number;
  name: string;
  origin: string;
  destination: string;
}

export default function DistributionCustomersPage() {
  const [token, setToken] = useState('');
  const [assignedRouteId, setAssignedRouteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    shop_name: '',
    customer_code: '',
    owner_name: '',
    phone: '',
    address: '',
    route_id: '',
    outstanding: '',
    status: 'active' as 'active' | 'inactive',
  });
  const router = useRouter();

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
      fetchRoutes();
      resolveAssignedRoute();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token, assignedRouteId]);

  const resolveAssignedRoute = async () => {
    const routeFromQuery = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('route_id')
      : null;
    if (routeFromQuery) {
      setAssignedRouteId(routeFromQuery);
      localStorage.setItem('distribution_assigned_route_id', routeFromQuery);
      return;
    }

    const cachedRouteId = localStorage.getItem('distribution_assigned_route_id');
    if (cachedRouteId) {
      setAssignedRouteId(cachedRouteId);
    }

    try {
      const userRes = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employeeId = Number(userRes.data?.employee_id || userRes.data?.employee?.id || 0);
      if (!employeeId) return;

      const loadsRes = await axios.get('http://localhost:8000/api/vehicle-loading/loads', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const loads = Array.isArray(loadsRes.data) ? loadsRes.data : (loadsRes.data?.data || []);
      const assignedLoad = loads
        .filter((load: any) => Number(load.sales_ref_id) === employeeId && ['pending', 'in_transit'].includes(load.status))
        .sort((a: any, b: any) => new Date(b.load_date || b.created_at || 0).getTime() - new Date(a.load_date || a.created_at || 0).getTime())[0];

      if (assignedLoad?.route_id) {
        const routeId = String(assignedLoad.route_id);
        setAssignedRouteId(routeId);
        localStorage.setItem('distribution_assigned_route_id', routeId);
      }
    } catch (error) {
      console.error('Error resolving assigned route on customers page:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/distribution/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 100 }
      });
      const allCustomers: Customer[] = res.data?.data?.data || [];
      const filteredCustomers = assignedRouteId
        ? allCustomers.filter((customer) => String(customer.route_id || '') === assignedRouteId)
        : allCustomers;
      setCustomers(filteredCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/vehicle-loading/routes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutes(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const resetForm = () => {
    setFormData({
      shop_name: '',
      customer_code: '',
      owner_name: '',
      phone: '',
      address: '',
      route_id: assignedRouteId || '',
      outstanding: '',
      status: 'active',
    });
    setEditingCustomer(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      shop_name: customer.shop_name,
      customer_code: customer.customer_code,
      owner_name: customer.owner_name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      route_id: customer.route_id ? String(customer.route_id) : '',
      outstanding: String(customer.outstanding ?? ''),
      status: customer.status,
    });
    setShowModal(true);
  };

  const routeLabel = useMemo(() => {
    if (!assignedRouteId) return '';
    const selectedRoute = routes.find((route) => String(route.id) === assignedRouteId);
    if (!selectedRoute) return `Route #${assignedRouteId}`;
    return `${selectedRoute.name} (${selectedRoute.origin} → ${selectedRoute.destination})`;
  }, [routes, assignedRouteId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingCustomer) {
        await axios.put(`http://localhost:8000/api/distribution/customers/${editingCustomer.id}`, {
          ...formData,
          route_id: formData.route_id ? Number(formData.route_id) : null,
          outstanding: Number(formData.outstanding || 0),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8000/api/distribution/customers', {
          ...formData,
          route_id: formData.route_id ? Number(formData.route_id) : null,
          outstanding: Number(formData.outstanding || 0),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Delete customer ${customer.shop_name}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/distribution/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
    } catch {
      alert('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 h-auto">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-lg">
                  🚚
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900">Distribution Customers</h1>
                  <p className="text-xs text-gray-500">Create, edit and delete customer shops</p>
                </div>
              </div>
            </div>
            <div className="flex justify-start sm:justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Customers (Shops)</h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-600">
              Register and manage distribution customers.
            </p>
            {assignedRouteId && (
              <p className="mt-1 text-sm text-green-700 font-medium">Auto route: {routeLabel}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Back
            </button>
            <button
              onClick={() => router.push('/dashboard/distribution')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Distribution Home
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 w-full sm:w-auto"
            >
              Add Customer
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No customers found.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.shop_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.customer_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.owner_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.route?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{Number(customer.outstanding || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(customer)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer)}
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
              {editingCustomer ? 'Edit Customer Shop' : 'Create Customer Shop'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code</label>
                  <input
                    type="text"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={formData.route_id}
                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                    disabled={!!assignedRouteId}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                  >
                    <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>{route.name} ({route.origin} → {route.destination})</option>
                    ))}
                  </select>
                  {assignedRouteId && (
                    <p className="mt-1 text-xs text-green-700">Route is auto-locked from your allocated load.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.outstanding}
                    onChange={(e) => setFormData({ ...formData, outstanding: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm text-black"
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
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
