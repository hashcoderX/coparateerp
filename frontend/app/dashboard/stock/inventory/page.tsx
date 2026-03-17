'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface InventoryItem {
  id: number;
  name: string;
  code: string;
  description: string;
  type: 'raw_material' | 'finished_good';
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_price: number;
  supplier_name: string | null;
  supplier_id: number | null;
  location: string;
  expiry_date: string | null;
  status: 'active' | 'inactive';
  additional_info?: {
    store_tag?: string;
    stock_source?: string;
    last_packaging_batch_id?: number;
    last_label_code?: string;
    last_barcode_value?: string;
    last_qr_value?: string;
    last_synced_at?: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function Inventory() {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<'raw_material' | 'finished_good'>('raw_material');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'raw_material' as 'raw_material' | 'finished_good',
    category: '',
    unit: '',
    current_stock: 0,
    minimum_stock: 0,
    maximum_stock: 0,
    unit_price: 0,
    supplier_name: '',
    supplier_id: '',
    location: '',
    expiry_date: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
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
      fetchSuppliers();
      fetchItems();
    }
  }, [token, activeTab]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/stock/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 1000 }
      });

      if (response.data.success) {
        setSuppliers(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/stock/inventory', {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: activeTab, per_page: 100 }
      });

      if (response.data.success) {
        const itemsData = response.data.data.data || [];
        const formattedItems = itemsData.map((item: any) => ({
          ...item,
          current_stock: Number(item.current_stock) || 0,
          minimum_stock: Number(item.minimum_stock) || 0,
          maximum_stock: Number(item.maximum_stock) || 0,
          unit_price: Number(item.unit_price) || 0,
        }));
        setItems(formattedItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Mock data for development
      const mockItems: InventoryItem[] = activeTab === 'raw_material' ? [
        {
          id: 1,
          name: 'Steel Rods',
          code: 'STL-001',
          description: 'High-quality steel rods for construction',
          type: 'raw_material',
          category: 'Metals',
          unit: 'kg',
          current_stock: 500,
          minimum_stock: 100,
          maximum_stock: 1000,
          unit_price: 250.00,
          supplier_name: 'ABC Supplies Ltd',
          supplier_id: 1,
          location: 'Warehouse A - Section 1',
          expiry_date: null,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: 'Cement Bags',
          code: 'CMT-001',
          description: 'Portland cement 50kg bags',
          type: 'raw_material',
          category: 'Construction Materials',
          unit: 'bags',
          current_stock: 200,
          minimum_stock: 50,
          maximum_stock: 500,
          unit_price: 850.00,
          supplier_name: 'Global Traders Inc',
          supplier_id: 2,
          location: 'Warehouse B - Section 2',
          expiry_date: null,
          status: 'active',
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-20T14:30:00Z'
        }
      ] : [
        {
          id: 3,
          name: 'Steel Door Frame',
          code: 'SDF-001',
          description: 'Pre-fabricated steel door frame',
          type: 'finished_good',
          category: 'Door Systems',
          unit: 'pieces',
          current_stock: 25,
          minimum_stock: 10,
          maximum_stock: 100,
          unit_price: 2500.00,
          supplier_name: null,
          supplier_id: null,
          location: 'Finished Goods Warehouse - Section A',
          expiry_date: null,
          status: 'active',
          created_at: '2024-01-25T09:00:00Z',
          updated_at: '2024-01-25T09:00:00Z'
        }
      ];
      setItems(mockItems);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        type: activeTab,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null
      };

      if (editingItem) {
        const response = await axios.put(`http://localhost:8000/api/stock/inventory/${editingItem.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setItems(prev => prev.map(item =>
            item.id === editingItem.id
              ? { ...response.data.data, current_stock: Number(response.data.data.current_stock), minimum_stock: Number(response.data.data.minimum_stock), maximum_stock: Number(response.data.data.maximum_stock), unit_price: Number(response.data.data.unit_price) }
              : item
          ));
        } else {
          throw new Error(response.data.message || 'Failed to update item');
        }
      } else {
        const response = await axios.post('http://localhost:8000/api/stock/inventory', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setItems(prev => [...prev, { ...response.data.data, current_stock: Number(response.data.data.current_stock), minimum_stock: Number(response.data.data.minimum_stock), maximum_stock: Number(response.data.data.maximum_stock), unit_price: Number(response.data.data.unit_price) }]);
        } else {
          throw new Error(response.data.message || 'Failed to create item');
        }
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      type: item.type,
      category: item.category || '',
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      maximum_stock: item.maximum_stock || 0,
      unit_price: item.unit_price,
      supplier_name: item.supplier_name || '',
      supplier_id: item.supplier_id?.toString() || '',
      location: item.location || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      status: item.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(`http://localhost:8000/api/stock/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setItems(prev => prev.filter(item => item.id !== id));
        setDeleteConfirm(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete item');
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      type: activeTab,
      category: '',
      unit: '',
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: 0,
      unit_price: 0,
      supplier_name: '',
      supplier_id: '',
      location: '',
      expiry_date: '',
      status: 'active'
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.current_stock <= item.minimum_stock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (item.maximum_stock && item.current_stock > item.maximum_stock) return { status: 'Overstocked', color: 'bg-blue-100 text-blue-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const modalLabelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-600';
  const modalInputClass = 'mt-1.5 block w-full rounded-xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/30 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none';
  const modalSelectClass = 'mt-1.5 block w-full rounded-xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/30 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none';
  const modalTextareaClass = 'mt-1.5 block w-full rounded-xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/30 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none';

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Inventory Management
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage raw materials and finished goods inventory.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Store Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('raw_material')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'raw_material'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Raw Material Store
            </button>
            <button
              onClick={() => setActiveTab('finished_good')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'finished_good'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Finished Goods Store
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-orange-50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📦</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {items.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Low Stock Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {items.filter(item => item.current_stock <= item.minimum_stock).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        In Stock Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {items.filter(item => item.current_stock > item.minimum_stock).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Value
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        LKR {items.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0).toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">No items found in this store</div>
              <button
                onClick={openAddModal}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Add First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-600 font-medium text-sm">
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.code} • {item.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.current_stock} {item.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {item.minimum_stock} {item.unit}
                          </div>
                          {item.location && (
                            <div className="text-xs text-gray-400">
                              {item.location}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.additional_info?.last_label_code || '-'}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {item.additional_info?.store_tag && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {item.additional_info.store_tag.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                            {item.additional_info?.stock_source && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {item.additional_info.stock_source.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {item.additional_info?.last_packaging_batch_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              Batch #{item.additional_info.last_packaging_batch_id}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          LKR {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border border-orange-100 w-11/12 md:w-4/5 lg:w-2/3 shadow-2xl rounded-2xl bg-white/95 max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Edit Item' : `Add Item to ${activeTab === 'raw_material' ? 'Raw Material Store' : 'Finished Goods Store'}`}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-orange-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={modalLabelClass}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={modalInputClass}
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Item Code/SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className={modalInputClass}
                      placeholder="Enter unique code"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={modalInputClass}
                      placeholder="Enter category"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className={modalSelectClass}
                    >
                      <option value="">Select unit</option>
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="liters">Liters</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="bags">Bags</option>
                      <option value="boxes">Boxes</option>
                      <option value="meters">Meters</option>
                      <option value="feet">Feet</option>
                    </select>
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) || 0 })}
                      className={modalInputClass}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Minimum Stock *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.minimum_stock}
                      onChange={(e) => setFormData({ ...formData, minimum_stock: Number(e.target.value) || 0 })}
                      className={modalInputClass}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Maximum Stock
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maximum_stock}
                      onChange={(e) => setFormData({ ...formData, maximum_stock: Number(e.target.value) || 0 })}
                      className={modalInputClass}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Unit Price (LKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) || 0 })}
                      className={modalInputClass}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Supplier
                    </label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => {
                        const selectedSupplier = suppliers.find(s => s.id.toString() === e.target.value);
                        setFormData({
                          ...formData,
                          supplier_id: e.target.value,
                          supplier_name: selectedSupplier ? selectedSupplier.name : ''
                        });
                      }}
                      className={modalSelectClass}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className={modalInputClass}
                      placeholder="Warehouse location"
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className={modalInputClass}
                    />
                  </div>

                  <div>
                    <label className={modalLabelClass}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className={modalSelectClass}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={modalLabelClass}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={modalTextareaClass}
                    placeholder="Enter item description"
                  />
                </div>

                <div className="sticky bottom-0 bg-white/95 border-t border-orange-100 -mx-6 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-white py-2.5 px-5 border border-orange-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 px-5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Item
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}