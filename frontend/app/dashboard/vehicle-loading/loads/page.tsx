'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Vehicle {
  id: number;
  registration_number: string;
  type: string;
  capacity_kg: number;
  status: string;
}

interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
}

interface Route {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
}

interface Load {
  id: number;
  load_number: string;
  vehicle_id: number;
  driver_id: number;
  sales_ref_id?: number | null;
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
  sales_ref?: {
    id: number;
    name: string;
    employee_code: string;
    first_name: string;
    last_name: string;
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
  type: string;
  out_price: number;
  sell_price: number;
  qty: number;
}

interface LoadDeliverySummary {
  load: {
    id: number;
    load_number: string;
    status: string;
    load_date: string;
    delivery_date: string | null;
  };
  period: {
    from: string;
    to: string;
  };
  invoices: {
    count: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
  };
  payments: {
    total_collected: number;
    by_method: Record<string, { total: number; count: number }>;
    cheques: Array<{
      id: number;
      payment_number: string;
      payment_date: string;
      amount: number;
      payment_method: string;
      reference_no: string | null;
      bank_name: string | null;
      status: string;
    }>;
  };
  items: Array<{
    item_code: string;
    item_name: string;
    unit: string | null;
    sold_qty: number;
    sold_value: number;
    return_qty: number;
    return_value: number;
    net_qty: number;
    net_value: number;
    cost_value: number;
    profit: number;
  }>;
}

interface DistributionInvoiceListResponse {
  data?: {
    data?: DistributionInvoiceRecord[];
  };
}

interface DistributionInvoiceRecord {
  id: number;
  load_id?: number | null;
  invoice_number?: string;
  customer_id?: number;
  total?: number;
  discount?: number;
  customer?: {
    shop_name?: string;
    customer_code?: string;
  };
  items?: DistributionInvoiceItemRecord[];
}

interface DistributionInvoiceItemRecord {
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface SoldItemProfitRow {
  item_code: string;
  item_name: string;
  sold_qty: number;
  avg_unit_price: number;
  gross_sales: number;
  discount_allocated: number;
  net_sales: number;
  out_price: number;
  cost_value: number;
  profit: number;
}

interface DistributionPaymentListResponse {
  data?: {
    data?: DistributionPaymentRecord[];
  };
}

interface DistributionPaymentRecord {
  id: number;
  load_id?: number | null;
  distribution_invoice_id?: number | null;
  customer_id?: number;
  payment_number?: string;
  payment_date?: string;
  amount?: number;
  payment_method?: string;
  reference_no?: string | null;
  bank_name?: string | null;
  status?: string;
  customer?: {
    shop_name?: string;
    customer_code?: string;
  };
  invoice?: {
    invoice_number?: string;
  };
}

interface LoadCustomerBaseRow {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  invoices_count: number;
  total_sale: number;
  collected: number;
  balance: number;
}

export default function LoadsPage() {
  const [token, setToken] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedLoadDetails, setSelectedLoadDetails] = useState<Load | null>(null);
  const [selectedLoadItems, setSelectedLoadItems] = useState<LoadItem[]>([]);
  const [soldItemProfitRows, setSoldItemProfitRows] = useState<SoldItemProfitRow[]>([]);
  const [loadInvoices, setLoadInvoices] = useState<DistributionInvoiceRecord[]>([]);
  const [loadPayments, setLoadPayments] = useState<DistributionPaymentRecord[]>([]);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [salesRefs, setSalesRefs] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'complete'; load: Load } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deliverySummary, setDeliverySummary] = useState<LoadDeliverySummary | null>(null);
  const [formData, setFormData] = useState({
    load_number: '',
    vehicle_id: '',
    driver_id: '',
    sales_ref_id: '',
    route_id: '',
    load_date: '',
    total_weight: '',
    notes: ''
  });
  const router = useRouter();

  const soldProfitTotals = useMemo(() => {
    return soldItemProfitRows.reduce(
      (acc, row) => {
        acc.gross += Number(row.gross_sales || 0);
        acc.discount += Number(row.discount_allocated || 0);
        acc.net += Number(row.net_sales || 0);
        acc.cost += Number(row.cost_value || 0);
        acc.profit += Number(row.profit || 0);
        return acc;
      },
      { gross: 0, discount: 0, net: 0, cost: 0, profit: 0 }
    );
  }, [soldItemProfitRows]);

  const customerBaseRows = useMemo<LoadCustomerBaseRow[]>(() => {
    const grouped = new Map<number, LoadCustomerBaseRow>();

    loadInvoices.forEach((inv) => {
      const customerId = Number(inv.customer_id || 0);
      if (!customerId) return;

      const existing = grouped.get(customerId) || {
        customer_id: customerId,
        customer_name: inv.customer?.shop_name || `Customer #${customerId}`,
        customer_code: inv.customer?.customer_code || '-',
        invoices_count: 0,
        total_sale: 0,
        collected: 0,
        balance: 0,
      };

      existing.invoices_count += 1;
      existing.total_sale += Number(inv.total || 0);
      grouped.set(customerId, existing);
    });

    loadPayments.forEach((pay) => {
      const customerId = Number(pay.customer_id || 0);
      if (!customerId) return;

      const existing = grouped.get(customerId) || {
        customer_id: customerId,
        customer_name: pay.customer?.shop_name || `Customer #${customerId}`,
        customer_code: pay.customer?.customer_code || '-',
        invoices_count: 0,
        total_sale: 0,
        collected: 0,
        balance: 0,
      };

      existing.collected += Number(pay.amount || 0);
      grouped.set(customerId, existing);
    });

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        balance: row.total_sale - row.collected,
      }))
      .sort((a, b) => b.total_sale - a.total_sale);
  }, [loadInvoices, loadPayments]);

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
      fetchVehicles();
      fetchDrivers();
      fetchRoutes();
    }
  }, [token]);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/loads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoads(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loads:', error);
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/vehicles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVehicles(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/hr/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const employeeList = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      const onlyDrivers = employeeList.filter((employee: any) => {
        const designationName = String(employee?.designation?.name || '').toLowerCase();
        return designationName.includes('driver');
      });
      setDrivers(onlyDrivers);
      const onlySalesRefs = employeeList.filter((employee: any) => {
        const designationName = String(employee?.designation?.name || '').toLowerCase();
        return designationName.includes('sales');
      });
      setSalesRefs(onlySalesRefs);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
      setSalesRefs([]);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/routes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRoutes(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        load_number: formData.load_number,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        sales_ref_id: formData.sales_ref_id ? parseInt(formData.sales_ref_id) : null,
        route_id: parseInt(formData.route_id),
        load_date: formData.load_date,
        total_weight: parseFloat(formData.total_weight),
        notes: formData.notes
      };

      if (editingLoad) {
        await axios.put(`http://localhost:8000/api/vehicle-loading/loads/${editingLoad.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post('http://localhost:8000/api/vehicle-loading/loads', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setShowModal(false);
      setEditingLoad(null);
      resetForm();
      fetchLoads(); // Refresh the list
    } catch (error) {
      console.error('Error saving load:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      load_number: '',
      vehicle_id: '',
      driver_id: '',
      sales_ref_id: '',
      route_id: '',
      load_date: '',
      total_weight: '',
      notes: ''
    });
  };

  const generateLoadNumber = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `VL-${currentYear}-`;
    
    // Find the highest number for the current year
    const currentYearLoads = loads.filter(load => load.load_number.startsWith(prefix));
    let nextNumber = 1;
    
    if (currentYearLoads.length > 0) {
      const numbers = currentYearLoads.map(load => {
        const parts = load.load_number.split('-');
        return parseInt(parts[2]) || 0;
      });
      nextNumber = Math.max(...numbers) + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setFormData({
      load_number: load.load_number,
      vehicle_id: load.vehicle_id.toString(),
      driver_id: load.driver_id.toString(),
      sales_ref_id: load.sales_ref_id ? load.sales_ref_id.toString() : '',
      route_id: load.route_id.toString(),
      load_date: load.load_date,
      total_weight: load.total_weight.toString(),
      notes: load.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/vehicle-loading/loads/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchLoads(); // Refresh the list
    } catch (error) {
      console.error('Error deleting load:', error);
      alert('Failed to delete load');
    }
  };

  const handleCompleteLoad = async (load: Load) => {
    try {
      const today = new Date();
      const loadDate = new Date(load.load_date);
      const effectiveDate = loadDate > today ? loadDate : today;
      const year = effectiveDate.getFullYear();
      const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
      const day = String(effectiveDate.getDate()).padStart(2, '0');
      const deliveryDate = `${year}-${month}-${day}`;

      await axios.put(`http://localhost:8000/api/vehicle-loading/loads/${load.id}`, {
        load_number: load.load_number,
        vehicle_id: load.vehicle_id,
        driver_id: load.driver_id,
        sales_ref_id: load.sales_ref_id ?? null,
        route_id: load.route_id,
        status: 'delivered',
        load_date: load.load_date,
        delivery_date: deliveryDate,
        total_weight: load.total_weight,
        notes: load.notes,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLoads();
    } catch (error) {
      console.error('Error completing load:', error);
      alert('Failed to complete load');
    }
  };

  const computeSoldItemsProfit = (
    loadItems: LoadItem[],
    invoices: DistributionInvoiceRecord[]
  ): { rows: SoldItemProfitRow[]; totals: { gross: number; discount: number; net: number; cost: number; profit: number } } => {
    const costByCode = new Map<string, number>();
    const nameByCode = new Map<string, string>();

    loadItems.forEach((li) => {
      const code = String(li.product_code || '').trim();
      if (!code) return;
      costByCode.set(code, Number(li.out_price) || 0);
      nameByCode.set(code, li.name || code);
    });

    const bucket = new Map<string, SoldItemProfitRow>();

    invoices.forEach((inv) => {
      const items = Array.isArray(inv.items) ? inv.items : [];
      const grossTotal = items.reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        0
      );
      const invoiceDiscount = Math.max(0, Number(inv.discount) || 0);

      items.forEach((it) => {
        const code = String(it.item_code || '').trim();
        if (!code) return;

        const qty = Number(it.quantity) || 0;
        const unitPrice = Number(it.unit_price) || 0;
        const gross = qty * unitPrice;
        const discountShare = grossTotal > 0 ? (invoiceDiscount * gross) / grossTotal : 0;
        const net = Math.max(0, gross - discountShare);
        const outPrice = costByCode.get(code) ?? 0;
        const cost = qty * outPrice;

        const existing = bucket.get(code) || {
          item_code: code,
          item_name: it.item_name || nameByCode.get(code) || code,
          sold_qty: 0,
          avg_unit_price: 0,
          gross_sales: 0,
          discount_allocated: 0,
          net_sales: 0,
          out_price: outPrice,
          cost_value: 0,
          profit: 0,
        };

        existing.sold_qty += qty;
        existing.gross_sales += gross;
        existing.discount_allocated += discountShare;
        existing.net_sales += net;
        existing.cost_value += cost;
        existing.profit += net - cost;
        existing.out_price = outPrice;

        bucket.set(code, existing);
      });
    });

    const rows = Array.from(bucket.values())
      .map((row) => ({
        ...row,
        avg_unit_price: row.sold_qty > 0 ? row.gross_sales / row.sold_qty : 0,
      }))
      .sort((a, b) => b.net_sales - a.net_sales);

    const totals = rows.reduce(
      (acc, row) => {
        acc.gross += row.gross_sales;
        acc.discount += row.discount_allocated;
        acc.net += row.net_sales;
        acc.cost += row.cost_value;
        acc.profit += row.profit;
        return acc;
      },
      { gross: 0, discount: 0, net: 0, cost: 0, profit: 0 }
    );

    return { rows, totals };
  };

  const handleViewDetails = async (loadId: number) => {
    try {
      setShowDetailsModal(true);
      setDetailsLoading(true);
      setSelectedLoadDetails(null);
      setSelectedLoadItems([]);
      setSoldItemProfitRows([]);
      setLoadInvoices([]);
      setLoadPayments([]);
      setDeliverySummary(null);

      const [loadRes, itemsRes, summaryRes, invoicesRes, paymentsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/vehicle-loading/loads/${loadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('http://localhost:8000/api/vehicle-loading/load-items', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { load_id: loadId },
        }),
        axios.get(`http://localhost:8000/api/vehicle-loading/loads/${loadId}/delivery-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null),
        axios.get<DistributionInvoiceListResponse>('http://localhost:8000/api/distribution/invoices', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { per_page: 1000 },
        }).catch(() => null),
        axios.get<DistributionPaymentListResponse>('http://localhost:8000/api/distribution/payments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { per_page: 1000 },
        }).catch(() => null),
      ]);

      setSelectedLoadDetails(loadRes.data);
      const loadItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      setSelectedLoadItems(loadItems);

      const allInvoices = invoicesRes?.data?.data?.data || [];
      const loadInvoices = allInvoices.filter((inv) => Number(inv.load_id) === Number(loadId));
      setLoadInvoices(loadInvoices);

      const allPayments = paymentsRes?.data?.data?.data || [];
      const loadPayments = allPayments.filter((pay) => Number(pay.load_id) === Number(loadId));
      setLoadPayments(loadPayments);

      const soldProfit = computeSoldItemsProfit(loadItems, loadInvoices);
      setSoldItemProfitRows(soldProfit.rows);

      if (summaryRes && summaryRes.data && summaryRes.data.data) {
        setDeliverySummary(summaryRes.data.data as LoadDeliverySummary);
      }
    } catch (error) {
      console.error('Error fetching load details:', error);
      alert('Failed to load vehicle load details');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrintDetails = () => {
    if (!selectedLoadDetails) return;

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) {
      alert('Unable to open print window. Please allow popups.');
      return;
    }

    const rows = selectedLoadItems
      .map((item) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${item.product_code}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.type}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(item.qty).toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(item.sell_price).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>Load ${selectedLoadDetails.load_number}</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
          <h2 style="margin-bottom: 6px;">Vehicle Load Details</h2>
          <p style="margin: 2px 0;"><strong>Load Number:</strong> ${selectedLoadDetails.load_number}</p>
          <p style="margin: 2px 0;"><strong>Status:</strong> ${selectedLoadDetails.status.replace('_', ' ')}</p>
          <p style="margin: 2px 0;"><strong>Load Date:</strong> ${new Date(selectedLoadDetails.load_date).toLocaleDateString()}</p>
          <p style="margin: 2px 0;"><strong>Delivery Date:</strong> ${selectedLoadDetails.delivery_date ? new Date(selectedLoadDetails.delivery_date).toLocaleDateString() : '-'}</p>
          <p style="margin: 2px 0;"><strong>Vehicle:</strong> ${selectedLoadDetails.vehicle?.registration_number || '-'} (${selectedLoadDetails.vehicle?.type || '-'})</p>
          <p style="margin: 2px 0;"><strong>Driver:</strong> ${selectedLoadDetails.driver?.name || '-'}</p>
          <p style="margin: 2px 0;"><strong>Sales Ref:</strong> ${selectedLoadDetails.sales_ref?.name || `${selectedLoadDetails.sales_ref?.first_name || ''} ${selectedLoadDetails.sales_ref?.last_name || ''}`.trim() || '-'}</p>
          <p style="margin: 2px 0;"><strong>Route:</strong> ${selectedLoadDetails.route?.name || '-'} (${selectedLoadDetails.route?.origin || '-'} → ${selectedLoadDetails.route?.destination || '-'})</p>
          <p style="margin: 2px 0;"><strong>Total Weight:</strong> ${Number(selectedLoadDetails.total_weight).toFixed(2)} kg</p>
          <p style="margin: 2px 0;"><strong>Notes:</strong> ${selectedLoadDetails.notes || '-'}</p>

          <h3 style="margin-top: 16px;">Load Items</h3>
          <table style="margin-top: 8px; width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product Code</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Name</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Type</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Qty</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Sell Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:center;">No items found</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

  const handleDownloadDetails = () => {
    if (!selectedLoadDetails) return;

    const header = [
      'Load Number',
      'Status',
      'Load Date',
      'Delivery Date',
      'Vehicle',
      'Driver',
      'Sales Ref',
      'Route',
      'Total Weight (kg)',
      'Product Code',
      'Item Name',
      'Type',
      'Qty',
      'Sell Price',
      'Notes',
    ];

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const common = [
      selectedLoadDetails.load_number,
      selectedLoadDetails.status,
      selectedLoadDetails.load_date,
      selectedLoadDetails.delivery_date || '',
      selectedLoadDetails.vehicle?.registration_number || '',
      selectedLoadDetails.driver?.name || '',
      selectedLoadDetails.sales_ref?.name || `${selectedLoadDetails.sales_ref?.first_name || ''} ${selectedLoadDetails.sales_ref?.last_name || ''}`.trim(),
      selectedLoadDetails.route?.name || '',
      Number(selectedLoadDetails.total_weight).toFixed(2),
    ];

    const rows = selectedLoadItems.length > 0
      ? selectedLoadItems.map((item) => [
          ...common,
          item.product_code,
          item.name,
          item.type,
          Number(item.qty).toFixed(2),
          Number(item.sell_price).toFixed(2),
          selectedLoadDetails.notes || '',
        ])
      : [[...common, '', '', '', '', '', selectedLoadDetails.notes || '']];

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedLoadDetails.load_number}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Loads Management</h1>
        <button
          onClick={() => {
            setEditingLoad(null);
            resetForm();
            setFormData(prev => ({ ...prev, load_number: generateLoadNumber() }));
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add New Load
        </button>
      </div>

      {/* Loads Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loads.map((load) => (
                <tr key={load.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {load.load_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {load.vehicle?.registration_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {load.driver?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {load.route?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(load.status)}`}>
                      {load.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {load.total_weight.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(load.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      View
                    </button>
                    {load.status !== 'delivered' && load.status !== 'cancelled' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'complete', load })}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(load)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', load })}
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

      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Vehicle Load Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedLoadDetails(null);
                    setSelectedLoadItems([]);
                    setSoldItemProfitRows([]);
                    setLoadInvoices([]);
                    setLoadPayments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {detailsLoading ? (
                <div className="py-12 text-center text-gray-600">Loading details...</div>
              ) : !selectedLoadDetails ? (
                <div className="py-12 text-center text-gray-600">No details found.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Load Number</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLoadDetails.load_number}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLoadDetails.status.replace('_', ' ')}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Load Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(selectedLoadDetails.load_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Delivery Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedLoadDetails.delivery_date ? new Date(selectedLoadDetails.delivery_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedLoadDetails.vehicle?.registration_number || '-'} ({selectedLoadDetails.vehicle?.type || '-'})
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Driver</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLoadDetails.driver?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Sales Ref</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedLoadDetails.sales_ref?.name || `${selectedLoadDetails.sales_ref?.first_name || ''} ${selectedLoadDetails.sales_ref?.last_name || ''}`.trim() || '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Route</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedLoadDetails.route?.name || '-'} ({selectedLoadDetails.route?.origin || '-'} → {selectedLoadDetails.route?.destination || '-'})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Total Weight</p>
                      <p className="text-sm font-semibold text-gray-900">{Number(selectedLoadDetails.total_weight).toFixed(2)} kg</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Total Items</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLoadItems.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-800">{selectedLoadDetails.notes || '-'}</p>
                  </div>

                  {deliverySummary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h4 className="text-sm font-semibold text-emerald-900">Load Delivery Summary</h4>
                        <p className="text-xs text-emerald-800">
                          Period: {new Date(deliverySummary.period.from).toLocaleDateString()} – {new Date(deliverySummary.period.to).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Total Sale (Invoices)</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {Number(deliverySummary.invoices.total_amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-emerald-700">{deliverySummary.invoices.count} invoice(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Total Collected</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {Number(deliverySummary.payments.total_collected || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Cash: {Number(deliverySummary.payments.by_method?.cash?.total || 0).toFixed(2)} ·
                            {' '}Cheque: {Number(deliverySummary.payments.by_method?.check?.total || 0).toFixed(2)} ·
                            {' '}Bank: {Number(deliverySummary.payments.by_method?.bank_transfer?.total || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Balance (Approx)</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {(
                              Number(deliverySummary.invoices.total_amount || 0) -
                              Number(deliverySummary.payments.total_collected || 0)
                            ).toFixed(2)}
                          </p>
                          <p className="text-xs text-emerald-700">Total sale minus collected payments</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3 border-t border-emerald-100 pt-3">
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Total Cost (Estimate)</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {Number(
                              soldItemProfitRows.length > 0
                                ? soldProfitTotals.cost
                                : (deliverySummary.invoices.total_cost || 0)
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Total Profit (Estimate)</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {Number(
                              soldItemProfitRows.length > 0
                                ? soldProfitTotals.profit
                                : (deliverySummary.invoices.total_profit || 0)
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 uppercase">Margin % (Approx)</p>
                          <p className="text-base font-semibold text-emerald-900">
                            {(soldItemProfitRows.length > 0
                              ? soldProfitTotals.net
                              : Number(deliverySummary.invoices.total_amount || 0)) > 0
                              ? ((
                                  (soldItemProfitRows.length > 0
                                    ? soldProfitTotals.profit
                                    : Number(deliverySummary.invoices.total_profit || 0)) /
                                  (soldItemProfitRows.length > 0
                                    ? soldProfitTotals.net
                                    : Number(deliverySummary.invoices.total_amount || 0))
                                ) * 100).toFixed(1)
                              : '0.0'}
                            %
                          </p>
                        </div>
                      </div>

                      {deliverySummary.payments.cheques.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-emerald-800 uppercase mb-1">Cheque Details</p>
                          <div className="overflow-x-auto border border-emerald-100 rounded-md bg-white">
                            <table className="min-w-full divide-y divide-emerald-100 text-xs">
                              <thead className="bg-emerald-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-emerald-800">Number</th>
                                  <th className="px-3 py-2 text-left font-medium text-emerald-800">Date</th>
                                  <th className="px-3 py-2 text-right font-medium text-emerald-800">Amount</th>
                                  <th className="px-3 py-2 text-left font-medium text-emerald-800">Bank</th>
                                  <th className="px-3 py-2 text-left font-medium text-emerald-800">Reference</th>
                                  <th className="px-3 py-2 text-left font-medium text-emerald-800">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50">
                                {deliverySummary.payments.cheques.map((chq) => (
                                  <tr key={chq.id}>
                                    <td className="px-3 py-1 text-emerald-900">{chq.payment_number}</td>
                                    <td className="px-3 py-1 text-emerald-900">{new Date(chq.payment_date).toLocaleDateString()}</td>
                                    <td className="px-3 py-1 text-emerald-900 text-right">{Number(chq.amount).toFixed(2)}</td>
                                    <td className="px-3 py-1 text-emerald-900">{chq.bank_name || '-'}</td>
                                    <td className="px-3 py-1 text-emerald-900">{chq.reference_no || '-'}</td>
                                    <td className="px-3 py-1 text-emerald-900 capitalize">{chq.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Collected Payment Details (By Load)</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Payment #</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Invoice</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Reference</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Bank</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loadPayments.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                              No collected payments found for this load.
                            </td>
                          </tr>
                        ) : (
                          loadPayments.map((pay) => (
                            <tr key={pay.id}>
                              <td className="px-4 py-2 text-gray-700">{pay.payment_number || `PAY-${pay.id}`}</td>
                              <td className="px-4 py-2 text-gray-700">
                                {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-2 text-gray-700">
                                {pay.customer?.shop_name || (pay.customer_id ? `Customer #${pay.customer_id}` : '-')}
                              </td>
                              <td className="px-4 py-2 text-gray-700">{pay.invoice?.invoice_number || '-'}</td>
                              <td className="px-4 py-2 text-gray-700 capitalize">{(pay.payment_method || '-').replace('_', ' ')}</td>
                              <td className="px-4 py-2 text-gray-700">{pay.reference_no || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{pay.bank_name || '-'}</td>
                              <td className="px-4 py-2 text-gray-700 capitalize">{pay.status || '-'}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(pay.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {loadPayments.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td colSpan={8} className="px-4 py-2 text-right font-semibold text-gray-800">Total Collected</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">
                              {loadPayments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer Base Summary (By Load)</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Invoices</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Total Sale</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Collected</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customerBaseRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                              No customer base data found for this load.
                            </td>
                          </tr>
                        ) : (
                          customerBaseRows.map((row) => (
                            <tr key={row.customer_id}>
                              <td className="px-4 py-2 text-gray-700">
                                <div className="flex flex-col">
                                  <span>{row.customer_name}</span>
                                  <span className="text-[10px] text-gray-500">{row.customer_code}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">{row.invoices_count}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.total_sale).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.collected).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-800">{Number(row.balance).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {customerBaseRows.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td className="px-4 py-2 font-semibold text-gray-800">Total</td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {customerBaseRows.reduce((sum, row) => sum + Number(row.invoices_count || 0), 0)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {customerBaseRows.reduce((sum, row) => sum + Number(row.total_sale || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {customerBaseRows.reduce((sum, row) => sum + Number(row.collected || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">
                              {customerBaseRows.reduce((sum, row) => sum + Number(row.balance || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Loaded items table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Loaded Items (Truck)</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty (Current)</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedLoadItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No load items found.</td>
                          </tr>
                        ) : (
                          selectedLoadItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-sm text-gray-700">{item.product_code}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{item.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{item.type.replace('_', ' ')}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{Number(item.qty).toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{Number(item.sell_price).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sold Items & Profit (By Load)</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Sold Qty</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Avg Sell</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Gross</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Discount</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Net Sale</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Out Price</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Cost</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {soldItemProfitRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                              No sold item data found for this load.
                            </td>
                          </tr>
                        ) : (
                          soldItemProfitRows.map((row) => (
                            <tr key={row.item_code}>
                              <td className="px-4 py-2 text-gray-700">
                                <div className="flex flex-col">
                                  <span>{row.item_name}</span>
                                  <span className="text-[10px] text-gray-500">{row.item_code}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.sold_qty).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.avg_unit_price).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.gross_sales).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.discount_allocated).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.net_sales).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.out_price).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{Number(row.cost_value).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-800">{Number(row.profit).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {soldItemProfitRows.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td className="px-4 py-2 font-semibold text-gray-800">Total</td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.sold_qty || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.gross_sales || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.discount_allocated || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.net_sales || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.cost_value || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">
                              {soldItemProfitRows.reduce((sum, row) => sum + Number(row.profit || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handlePrintDetails}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadDetails}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-11/12 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {confirmAction.type === 'complete' ? 'Complete Load' : 'Delete Load'}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {confirmAction.type === 'complete'
                ? `Mark load ${confirmAction.load.load_number} as delivered and end this route?`
                : `Are you sure you want to delete load ${confirmAction.load.load_number}? This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={confirming}
                onClick={() => {
                  if (confirming) return;
                  setConfirmAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={async () => {
                  if (!confirmAction) return;
                  setConfirming(true);
                  try {
                    if (confirmAction.type === 'delete') {
                      await handleDelete(confirmAction.load.id);
                    } else {
                      await handleCompleteLoad(confirmAction.load);
                    }
                    setConfirmAction(null);
                  } finally {
                    setConfirming(false);
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                  confirmAction.type === 'complete' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirming ? 'Please wait...' : confirmAction.type === 'complete' ? 'Yes, Complete' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingLoad ? 'Edit Load' : 'Create New Load'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingLoad(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Load Number</label>
                      <input
                        type="text"
                        value={formData.load_number}
                        readOnly
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-900 cursor-not-allowed"
                        placeholder="VL-2024-001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Load Date</label>
                      <input
                        type="date"
                        value={formData.load_date}
                        onChange={(e) => setFormData({ ...formData, load_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                      <select
                        value={formData.vehicle_id}
                        onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                        required
                      >
                        <option value="">Select Vehicle</option>
                        {Array.isArray(vehicles) && vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.registration_number} - {vehicle.type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                      <select
                        value={formData.driver_id}
                        onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                        required
                      >
                        <option value="">Select Driver</option>
                        {Array.isArray(drivers) && drivers.map((driver) => (
                          <option key={driver.id} value={driver.id.toString()}>
                            {driver.employee_code} - {driver.first_name} {driver.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                      <select
                        value={formData.route_id}
                        onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                        required
                      >
                        <option value="">Select Route</option>
                        {Array.isArray(routes) && routes.map((route) => (
                          <option key={route.id} value={route.id.toString()}>
                            {route.name} - {route.origin} to {route.destination}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sales Ref</label>
                      <select
                        value={formData.sales_ref_id}
                        onChange={(e) => setFormData({ ...formData, sales_ref_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      >
                        <option value="">Select Sales Ref</option>
                        {Array.isArray(salesRefs) && salesRefs.map((salesRef) => (
                          <option key={salesRef.id} value={salesRef.id.toString()}>
                            {salesRef.employee_code} - {salesRef.first_name} {salesRef.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Load Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Load Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.total_weight}
                        onChange={(e) => setFormData({ ...formData, total_weight: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="2500.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="Enter any additional notes about this load..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingLoad(null);
                      resetForm();
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {editingLoad ? 'Update Load' : 'Create Load'}
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