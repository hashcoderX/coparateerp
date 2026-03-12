'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface PurchaseOrderItem {
  id: number;
  inventory_item: { 
    id: number; 
    name: string; 
    type: string;
    purchase_price: number;
    sell_price: number;
    expiry_date: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
}

interface GrnItemForm {
  purchase_order_item_id: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  purchase_price: number;
  sell_price: number;
  expiry_date: string;
  remarks: string;
  quality_status: 'pending' | 'accepted' | 'rejected' | 'partial';
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    contact_person: string;
  };
  order_date: string;
  expected_delivery_date: string | null;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  total_amount: number;
  notes: string | null;
  items: PurchaseOrderItem[];
}

interface GrnItem {
  id: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  purchase_price: number;
  sell_price: number;
  expiry_date: string | null;
  remarks: string;
  quality_status: 'pending' | 'accepted' | 'rejected' | 'partial';
  purchase_order_item: PurchaseOrderItem;
}

interface GRN {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  received_date: string;
  notes: string | null;
  status: string;
  purchase_order: PurchaseOrder;
  grn_items: GrnItem[];
  created_at: string;
  updated_at: string;
}

export default function GRNPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'po' | 'grn'>('po');
  const router = useRouter();
  const [token, setToken] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);
  const [showGrnForm, setShowGrnForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [grnFormData, setGrnFormData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as GrnItemForm[],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

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
      fetchPurchaseOrders();
      fetchGRNs();
    }
  }, [token]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/purchasing/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = response.data.data || response.data || [];
      // Filter to show only approved or pending orders that can receive goods
      const receivableOrders = orders.filter((order: PurchaseOrder) =>
        order.status === 'approved' || order.status === 'pending'
      );
      // Sort by order_date descending (latest first)
      receivableOrders.sort((a: PurchaseOrder, b: PurchaseOrder) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      setPurchaseOrders(receivableOrders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGRNs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/purchasing/grn', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const grnData = response.data || [];
      setGrns(grnData);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
      setGrns([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasGrnForOrder = (orderId: number) => {
    return grns.some(grn => grn.purchase_order_id === orderId);
  };

  const getPriceRange = (order: PurchaseOrder, priceType: 'purchase' | 'sell') => {
    const prices = order.items
      .map(item => {
        const price = priceType === 'purchase' ? item.inventory_item.purchase_price : item.inventory_item.sell_price;
        return typeof price === 'number' && !isNaN(price) ? price : 0;
      })
      .filter(price => price > 0);

    if (prices.length === 0) return 'N/A';

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `LKR ${minPrice.toFixed(2)}`;
    } else {
      return `LKR ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
    }
  };

  const createGRN = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    // Initialize GRN form with items from the purchase order
    const grnItems: GrnItemForm[] = order.items.map(item => ({
      purchase_order_item_id: item.id,
      received_quantity: item.quantity, // Set PO quantity as default received quantity
      accepted_quantity: item.quantity, // Set PO quantity as default accepted quantity
      rejected_quantity: 0,
      purchase_price: item.inventory_item.purchase_price || 0,
      sell_price: item.inventory_item.sell_price || 0,
      expiry_date: item.inventory_item.expiry_date ? new Date(item.inventory_item.expiry_date).toISOString().split('T')[0] : '',
      remarks: '',
      quality_status: 'pending' as const,
    }));
    setGrnFormData({
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      items: grnItems,
    });
    setShowGrnForm(true);
  };

  const editGRN = (grn: GRN) => {
    setSelectedGrn(grn);
    setSelectedOrder(grn.purchase_order);
    setIsEditing(true);

    // Initialize GRN form with existing data
    const grnItems: GrnItemForm[] = grn.grn_items.map(item => ({
      purchase_order_item_id: item.purchase_order_item.id,
      received_quantity: item.received_quantity,
      accepted_quantity: item.accepted_quantity,
      rejected_quantity: item.rejected_quantity,
      purchase_price: item.purchase_price,
      sell_price: item.sell_price,
      expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '',
      remarks: item.remarks,
      quality_status: item.quality_status,
    }));

    setGrnFormData({
      received_date: new Date(grn.received_date).toISOString().split('T')[0],
      notes: grn.notes || '',
      items: grnItems,
    });
    setShowGrnForm(true);
  };

  const submitGRN = async (grnData: any) => {
    try {
      const response = await axios.post('http://localhost:8000/api/purchasing/grn', grnData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('GRN created successfully!');
      setShowGrnForm(false);
      setSelectedOrder(null);
      setIsEditing(false);
      setCurrentPage(1); // Reset to first page
      // Refresh both lists
      fetchPurchaseOrders();
      fetchGRNs();
      return response.data;
    } catch (error) {
      console.error('Error creating GRN:', error);
      alert('Failed to create GRN. Please try again.');
      throw error;
    }
  };

  const updateGRN = async (grnData: any) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/purchasing/grn/${selectedGrn?.id}`, grnData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('GRN updated successfully!');
      setShowGrnForm(false);
      setSelectedGrn(null);
      setSelectedOrder(null);
      setIsEditing(false);
      setCurrentPage(1); // Reset to first page
      // Refresh both lists
      fetchPurchaseOrders();
      fetchGRNs();
      return response.data;
    } catch (error) {
      console.error('Error updating GRN:', error);
      alert('Failed to update GRN. Please try again.');
      throw error;
    }
  };

  const deleteGRN = async (grnId: number) => {
    if (!confirm('Are you sure you want to delete this GRN? This will reverse the inventory stock adjustments.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/purchasing/grn/${grnId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('GRN deleted successfully!');
      setCurrentPage(1); // Reset to first page
      fetchGRNs();
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error deleting GRN:', error);
      alert('Failed to delete GRN. Please try again.');
    }
  };
  const updateGrnItem = (index: number, field: keyof GrnItemForm, value: any) => {
    const updatedItems = [...grnFormData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setGrnFormData({ ...grnFormData, items: updatedItems });
  };

  const updateRejectedQuantity = (index: number, rejectedValue: number) => {
    const updatedItems = [...grnFormData.items];
    const receivedQuantity = updatedItems[index]?.received_quantity || 0;
    const acceptedQuantity = Math.max(0, receivedQuantity - rejectedValue); // Ensure accepted quantity is not negative

    updatedItems[index] = {
      ...updatedItems[index],
      rejected_quantity: rejectedValue,
      accepted_quantity: acceptedQuantity
    };
    setGrnFormData({ ...grnFormData, items: updatedItems });
  };

  const updateReceivedQuantity = (index: number, receivedValue: number) => {
    const updatedItems = [...grnFormData.items];
    const rejectedQuantity = updatedItems[index]?.rejected_quantity || 0;
    const acceptedQuantity = Math.max(0, receivedValue - rejectedQuantity); // Ensure accepted quantity is not negative

    updatedItems[index] = {
      ...updatedItems[index],
      received_quantity: receivedValue,
      accepted_quantity: acceptedQuantity
    };
    setGrnFormData({ ...grnFormData, items: updatedItems });
  };

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Prepare data for submission, converting empty strings to null
    const submitData = {
      purchase_order_id: selectedOrder.id,
      received_date: grnFormData.received_date,
      notes: grnFormData.notes,
      items: grnFormData.items.map(item => ({
        ...item,
        expiry_date: item.expiry_date || null, // Convert empty string to null
      })),
    };

    if (isEditing) {
      await updateGRN(submitData);
    } else {
      await submitGRN(submitData);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(purchaseOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = purchaseOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Purchase Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goods Received Notes (GRN)</h1>
              <p className="mt-2 text-gray-600">
                Manage purchase orders and goods received notes.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Purchasing
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('po')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'po'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchase Orders
              </button>
              <button
                onClick={() => setCurrentView('grn')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'grn'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                GRN Records ({grns.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Purchase Orders View */}
        {currentView === 'po' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Available Purchase Orders</h2>
              <p className="mt-1 text-sm text-gray-600">
                Purchase orders that are approved or pending and can receive goods.
              </p>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders Available</h3>
                <p className="text-gray-600 mb-4">
                  There are no approved or pending purchase orders that can receive goods.
                </p>
                <button
                  onClick={() => router.push('/dashboard/purchasing/purchase-orders')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Purchase Order
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Delivery
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sell Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.supplier.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.order_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.expected_delivery_date
                              ? new Date(order.expected_delivery_date).toLocaleDateString()
                              : 'Not specified'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPriceRange(order, 'purchase')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPriceRange(order, 'sell')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            LKR {parseFloat(order.total_amount.toString()).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.length} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {hasGrnForOrder(order.id) ? (
                              <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-md text-sm font-medium">
                                GRN Created
                              </span>
                            ) : (
                              <button
                                onClick={() => createGRN(order)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                Create GRN
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(endIndex, purchaseOrders.length)}</span> of{' '}
                          <span className="font-medium">{purchaseOrders.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* GRN Records View */}
        {currentView === 'grn' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">GRN Records</h2>
              <p className="mt-1 text-sm text-gray-600">
                View and manage existing Goods Received Notes.
              </p>
            </div>

            {grns.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No GRN Records</h3>
                <p className="text-gray-600 mb-4">
                  No Goods Received Notes have been created yet.
                </p>
                <button
                  onClick={() => setCurrentView('po')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create First GRN
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GRN #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Accepted
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {grns.map((grn) => (
                      <tr key={grn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grn.grn_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grn.purchase_order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grn.purchase_order.supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(grn.received_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {grn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grn.grn_items.length} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(grn.grn_items.reduce((sum, item) => sum + (Number(item.accepted_quantity) || 0), 0)).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editGRN(grn)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteGRN(grn.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GRN Form Modal */}
      {showGrnForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit' : 'Create'} Goods Received Note - {selectedOrder?.order_number}
                </h3>
                <button
                  onClick={() => {
                    setShowGrnForm(false);
                    setIsEditing(false);
                    setSelectedGrn(null);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleGrnSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                    <input
                      type="date"
                      value={grnFormData.received_date}
                      onChange={(e) => setGrnFormData({ ...grnFormData, received_date: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={grnFormData.notes}
                      onChange={(e) => setGrnFormData({ ...grnFormData, notes: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                      rows={3}
                      placeholder="Optional notes about the received goods"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-4">Received Items</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>Auto-filled quantities:</strong> Received and Accepted quantities are pre-filled with PO quantities. Adjust rejected quantity to automatically recalculate accepted quantity.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Accepted Qty
                            <span className="block text-xs text-blue-600 font-normal">Auto-calculated</span>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((orderItem, index) => (
                          <tr key={orderItem.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {orderItem.inventory_item.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {orderItem.quantity}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">LKR</span>
                                <input
                                  type="number"
                                  value={grnFormData.items[index]?.purchase_price || 0}
                                  onChange={(e) => updateGrnItem(index, 'purchase_price', parseFloat(e.target.value) || 0)}
                                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">LKR</span>
                                <input
                                  type="number"
                                  value={grnFormData.items[index]?.sell_price || 0}
                                  onChange={(e) => updateGrnItem(index, 'sell_price', parseFloat(e.target.value) || 0)}
                                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="date"
                                value={grnFormData.items[index]?.expiry_date || ''}
                                onChange={(e) => updateGrnItem(index, 'expiry_date', e.target.value)}
                                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={grnFormData.items[index]?.received_quantity || 0}
                                onChange={(e) => updateReceivedQuantity(index, parseFloat(e.target.value) || 0)}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                                min="0"
                                step="0.01"
                                required
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={grnFormData.items[index]?.accepted_quantity || 0}
                                readOnly
                                className="w-20 rounded-md border-gray-300 bg-gray-50 shadow-sm text-sm text-black cursor-not-allowed"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={grnFormData.items[index]?.rejected_quantity || 0}
                                onChange={(e) => updateRejectedQuantity(index, parseFloat(e.target.value) || 0)}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <select
                                value={grnFormData.items[index]?.quality_status || 'pending'}
                                onChange={(e) => updateGrnItem(index, 'quality_status', e.target.value)}
                                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                              >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="partial">Partial</option>
                              </select>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={grnFormData.items[index]?.remarks || ''}
                                onChange={(e) => updateGrnItem(index, 'remarks', e.target.value)}
                                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                                placeholder="Remarks"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGrnForm(false);
                      setIsEditing(false);
                      setSelectedGrn(null);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
                  >
                    {isEditing ? 'Update' : 'Create'} GRN
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}