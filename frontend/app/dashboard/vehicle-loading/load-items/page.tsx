'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Load {
  id: number;
  load_number: string;
  vehicle_id: number;
  driver_id: number;
  route_id: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  load_date: string;
  delivery_date: string | null;
  total_weight: number;
  notes: string;
  vehicle?: {
    id: number;
    registration_number: string;
    type: string;
  };
  driver?: {
    id: number;
    name: string;
    license_number: string;
  };
  route?: {
    id: number;
    name: string;
    origin: string;
    destination: string;
  };
}

interface LoadItem {
  id: number;
  load_id: number;
  product_code: string;
  name: string;
  type: 'finished_product' | 'raw_material';
  out_price: number;
  sell_price: number;
  qty: number;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: number;
  name: string;
  code: string;
  type: 'raw_material' | 'finished_good';
  unit_price: number;
  current_stock: number;
  unit: string;
}

export default function LoadItemsPage() {
  const [token, setToken] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [loadItems, setLoadItems] = useState<LoadItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<LoadItem | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState(-1);
  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    type: 'finished_product' as 'finished_product' | 'raw_material',
    out_price: '',
    sell_price: '',
    qty: ''
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
      fetchLoads();
      fetchInventoryItems();
    }
  }, [token]);

  useEffect(() => {
    if (selectedLoad) {
      fetchLoadItems();
    }
  }, [selectedLoad]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.item-search-box')) {
        setShowItemDropdown(false);
        setHighlightedItemIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLoads = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/loads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoads(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching loads:', error);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadItems = async () => {
    if (!selectedLoad) return;

    try {
      const response = await axios.get(`http://localhost:8000/api/vehicle-loading/load-items?load_id=${selectedLoad.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoadItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching load items:', error);
      setLoadItems([]);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/stock/inventory?status=active&per_page=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let items: InventoryItem[] = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          items = response.data.data;
        } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
          items = response.data.data.data;
        }
      }

      if (!Array.isArray(items)) {
        console.warn('Inventory API returned unexpected data format:', response.data);
        items = [];
      }

      setInventoryItems(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setInventoryItems([]);
    }
  };

  const selectInventoryItem = (item: InventoryItem) => {
    setFormData({
      ...formData,
      product_code: item.code,
      name: item.name,
      type: item.type === 'finished_good' ? 'finished_product' : 'raw_material',
      out_price: item.unit_price.toString(),
      sell_price: item.unit_price.toString()
    });
    setItemSearch(`${item.code} - ${item.name}`);
    setShowItemDropdown(false);
    setHighlightedItemIndex(-1);
  };

  const resetForm = () => {
    setFormData({
      product_code: '',
      name: '',
      type: 'finished_product',
      out_price: '',
      sell_price: '',
      qty: ''
    });
    setItemSearch('');
    setShowItemDropdown(false);
    setHighlightedItemIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad) return;

    try {
      const payload = {
        load_id: selectedLoad.id,
        product_code: formData.product_code,
        name: formData.name,
        type: formData.type,
        out_price: parseFloat(formData.out_price),
        sell_price: parseFloat(formData.sell_price),
        qty: parseFloat(formData.qty)
      };

      if (editingItem) {
        await axios.put(`http://localhost:8000/api/vehicle-loading/load-items/${editingItem.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post('http://localhost:8000/api/vehicle-loading/load-items', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      fetchLoadItems();
      setEditingItem(null);
      resetForm();
    } catch (error: any) {
      console.error('Error saving load item:', error);
      alert(error.response?.data?.message || 'Failed to save load item');
    }
  };

  const handleEdit = (item: LoadItem) => {
    setEditingItem(item);
    setFormData({
      product_code: item.product_code,
      name: item.name,
      type: item.type,
      out_price: item.out_price.toString(),
      sell_price: item.sell_price.toString(),
      qty: item.qty.toString()
    });
    setItemSearch(`${item.product_code} - ${item.name}`);
    setShowItemDropdown(false);
    setHighlightedItemIndex(-1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this load item?')) {
      try {
        await axios.delete(`http://localhost:8000/api/vehicle-loading/load-items/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchLoadItems();
      } catch (error) {
        console.error('Error deleting load item:', error);
      }
    }
  };

  const handleCsvUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLoad) return;

    const formDataCsv = new FormData(e.currentTarget);
    formDataCsv.append('load_id', selectedLoad.id.toString());

    try {
      const response = await axios.post('http://localhost:8000/api/vehicle-loading/load-items/upload-csv', formDataCsv, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(response.data.message);
      if (response.data.imported > 0) {
        fetchLoadItems();
        setShowCsvModal(false);
      }
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      alert(error.response?.data?.message || 'Failed to upload CSV');
    }
  };

  const getTotalValue = () => {
    return loadItems.reduce((total, item) => total + (item.sell_price * item.qty), 0);
  };

  const getTotalWeight = () => {
    // Assuming average weight per item - this could be enhanced with actual weight data
    return loadItems.reduce((total, item) => total + item.qty, 0);
  };

  const filteredInventoryItems = inventoryItems
    .filter((item) => {
      const search = itemSearch.trim().toLowerCase();
      if (!search) return true;
      return item.name.toLowerCase().includes(search) || item.code.toLowerCase().includes(search);
    })
    .slice(0, 12);

  const generateLoadConfirmationPDF = () => {
    if (!selectedLoad) return;

    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LOAD CONFIRMATION', 105, 20, { align: 'center' });

    // Load Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Load Details', 20, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Load Number: ${selectedLoad.load_number}`, 20, 50);
    doc.text(`Vehicle: ${selectedLoad.vehicle?.registration_number || 'N/A'}`, 20, 58);
    doc.text(`Driver: ${selectedLoad.driver?.name || 'N/A'}`, 20, 66);
    doc.text(`Route: ${selectedLoad.route?.name || 'N/A'} (${selectedLoad.route?.origin || ''} to ${selectedLoad.route?.destination || ''})`, 20, 74);
    doc.text(`Load Date: ${new Date(selectedLoad.load_date).toLocaleDateString()}`, 20, 82);
    doc.text(`Status: ${selectedLoad.status.replace('_', ' ').toUpperCase()}`, 20, 90);
    doc.text(`Total Items: ${loadItems.length}`, 20, 98);
    doc.text(`Total Value: LKR ${getTotalValue().toLocaleString()}`, 20, 106);

    // Load Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Loaded Items', 20, 125);

    const tableData = loadItems.map(item => [
      item.product_code,
      item.name,
      item.type.replace('_', ' '),
      `LKR ${item.out_price.toLocaleString()}`,
      `LKR ${item.sell_price.toLocaleString()}`,
      item.qty.toString(),
      `LKR ${(item.sell_price * item.qty).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 135,
      head: [['Product Code', 'Name', 'Type', 'Out Price', 'Sell Price', 'Quantity', 'Total Value']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Calculate approximate table height (header + rows)
    const tableHeight = 15 + (loadItems.length * 10); // header height + row height per item
    const finalY = 135 + tableHeight + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorization Signatures', 20, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared By: _______________________________ Date: _______________', 20, finalY + 15);
    doc.text('Checked By: _______________________________ Date: _______________', 20, finalY + 30);
    doc.text('Approved By: ______________________________ Date: _______________', 20, finalY + 45);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This document confirms the loading of items into the vehicle.', 20, pageHeight - 20);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);

    // Save the PDF
    doc.save(`Load_Confirmation_${selectedLoad.load_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Load Items Management</h1>
              <p className="text-gray-600 mt-2">Manage items loaded into vehicles</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/vehicle-loading/loads')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Loads
            </button>
          </div>
        </div>

        {/* Load Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Load</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loads.map((load) => (
              <div
                key={load.id}
                onClick={() => setSelectedLoad(load)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLoad?.id === load.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{load.load_number}</div>
                <div className="text-sm text-gray-600">
                  {load.vehicle?.registration_number} - {load.route?.name}
                </div>
                <div className="text-sm text-gray-500">{load.load_date}</div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${
                  load.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  load.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  load.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {load.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedLoad && (
          <>
            {/* Load Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Load: {selectedLoad.load_number}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Vehicle</div>
                  <div className="font-semibold text-gray-900">
                    {selectedLoad.vehicle?.registration_number}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Route</div>
                  <div className="font-semibold text-gray-900">
                    {selectedLoad.route?.name}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Items</div>
                  <div className="font-semibold text-gray-900">{loadItems.length}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Value</div>
                  <div className="font-semibold text-gray-900">
                    LKR {getTotalValue().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Load Item' : 'Add New Load Item'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="relative item-search-box lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Search
                    </label>
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => {
                        setItemSearch(e.target.value);
                        if (!e.target.value.trim()) {
                          setFormData({ ...formData, product_code: '', name: '' });
                        }
                        setShowItemDropdown(true);
                        setHighlightedItemIndex(-1);
                      }}
                      onFocus={() => {
                        setShowItemDropdown(true);
                        setHighlightedItemIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        if (!showItemDropdown || filteredInventoryItems.length === 0) return;

                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedItemIndex((prev) => (prev < filteredInventoryItems.length - 1 ? prev + 1 : 0));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedItemIndex((prev) => (prev > 0 ? prev - 1 : filteredInventoryItems.length - 1));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const targetIndex = highlightedItemIndex >= 0 ? highlightedItemIndex : 0;
                          const picked = filteredInventoryItems[targetIndex];
                          if (picked) {
                            selectInventoryItem(picked);
                          }
                        } else if (e.key === 'Escape') {
                          setShowItemDropdown(false);
                          setHighlightedItemIndex(-1);
                        }
                      }}
                      placeholder="Type item code or name"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                    {showItemDropdown && filteredInventoryItems.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                        {filteredInventoryItems.map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectInventoryItem(item)}
                            className={`w-full text-left px-3 py-2 border-b last:border-b-0 ${
                              highlightedItemIndex === index ? 'bg-green-100' : 'hover:bg-green-50'
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">{item.code} - {item.name}</div>
                            <div className="text-xs text-gray-500">Stock: {item.current_stock} {item.unit}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code *
                    </label>
                    <input
                      type="text"
                      value={formData.product_code}
                      onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="PROD001"
                      required
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'finished_product' | 'raw_material' })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      required
                    >
                      <option value="finished_product">Finished Product</option>
                      <option value="raw_material">Raw Material</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Out Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.out_price}
                      onChange={(e) => setFormData({ ...formData, out_price: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="100.00"
                      required
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sell Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sell_price}
                      onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="150.00"
                      required
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="10.00"
                      required
                    />
                  </div>
                  <div className="lg:col-span-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        resetForm();
                      }}
                      className="w-1/2 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {editingItem ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        )}
                      </svg>
                      {editingItem ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Load Items Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Out Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sell Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.type === 'finished_product'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          LKR {item.out_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          LKR {item.sell_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.qty.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          LKR {(item.sell_price * item.qty).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Load Items</h2>
                <div className="space-x-3">
                  <button
                    onClick={generateLoadConfirmationPDF}
                    disabled={loadItems.length === 0}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Load Confirm (PDF)
                  </button>
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload CSV
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    New Item
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CSV Upload Modal */}
        {showCsvModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Upload CSV File</h3>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">CSV Format:</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    The CSV file should have the following columns (without header):
                  </p>
                  <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                    <li>Product Code</li>
                    <li>Product Name</li>
                    <li>Type (finished_product or raw_material)</li>
                    <li>Out Price</li>
                    <li>Sell Price</li>
                    <li>Quantity</li>
                  </ol>
                  <p className="text-sm text-blue-700 mt-2">
                    Example: PROD001,Sample Product,finished_product,100.00,150.00,10.00
                  </p>
                </div>
                <form onSubmit={handleCsvUpload}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV File *
                    </label>
                    <input
                      type="file"
                      name="csv_file"
                      accept=".csv"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCsvModal(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Upload CSV
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}