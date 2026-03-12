'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Customer { id: number; shop_name: string; customer_code: string; route_id?: number | null; }
interface Item { id: number; name: string; code: string; unit: string; sell_price: number; current_stock: number; }

interface LoadItemInfo {
  id: number;
  load_id: number;
  product_code: string;
  name: string;
  qty: number;
  sell_price: number;
}

interface InvoiceItem {
  id: number;
  inventory_item_id: number | null;
  item_code: string;
  item_name: string;
  unit: string | null;
  quantity: number;
  unit_price: number;
}

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: { shop_name: string; customer_code?: string };
  invoice_date: string;
  subtotal?: number;
  discount?: number;
  total: number;
  status: string;
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceLine {
  inventory_item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  base_unit_price?: number;
  item_discount?: number;
  free_quantity?: number;
   paid_quantity?: number;
}

interface ReturnLine {
  inventory_item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

interface PendingOfflineInvoice {
  id: string;
  createdAt: string;
  payload: {
    invoice_number: string;
    customer_id: number;
    invoice_date: string;
    due_date: string | null;
    discount: number;
    notes: string;
    items: {
      inventory_item_id: number | null;
      item_code: string;
      item_name: string;
      unit: string | null;
      quantity: number;
      unit_price: number;
    }[];
    payment?: {
      amount: number;
      method: 'cash' | 'check' | 'bank_transfer';
      date: string;
      reference?: string | null;
      bank_name?: string | null;
    } | null;
    returnPayload?: {
      return_number: string;
      customer_id: number;
      return_date: string;
      total_quantity: number;
      total_amount: number;
      settlement_type: 'bill_deduction' | 'cash_refund' | 'item_exchange';
      settlement_amount: number;
      exchange_inventory_item_id: number | null;
      exchange_quantity: number;
      reason?: string | null;
      status: string;
      notes?: string | null;
    } | null;
  };
}

const OFFLINE_INVOICE_STORAGE_KEY = 'distribution_offline_invoices';

export default function DistributionInvoicesPage() {
  const [token, setToken] = useState('');
  const [assignedRouteId, setAssignedRouteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState('0');
  const [notes, setNotes] = useState('');

  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState(-1);
  const [lineQty, setLineQty] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState<InvoiceRecord | null>(null);
  const [returnLineId, setReturnLineId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [settlementType, setSettlementType] = useState<'bill_deduction' | 'cash_refund' | 'item_exchange'>('bill_deduction');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [exchangeItemId, setExchangeItemId] = useState('');
  const [exchangeQty, setExchangeQty] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSearch, setReturnSearch] = useState('');
  const [showReturnSuggestions, setShowReturnSuggestions] = useState(false);
  const [returnSelectedItemId, setReturnSelectedItemId] = useState('');
  const [returnQtyInput, setReturnQtyInput] = useState('');
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([]);

  const [lineFreeQty, setLineFreeQty] = useState('');
  const [lineItemDiscount, setLineItemDiscount] = useState('');

  const [addPayment, setAddPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentBankName, setPaymentBankName] = useState('');

  const [activeLoadId, setActiveLoadId] = useState('');
  const [loadItems, setLoadItems] = useState<LoadItemInfo[]>([]);
  const [inlineReturnMode, setInlineReturnMode] = useState<'deduct' | 'exchange'>('deduct');

  const [qtyWarningOpen, setQtyWarningOpen] = useState(false);
  const [qtyWarningMessage, setQtyWarningMessage] = useState('');

  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editingReturnId, setEditingReturnId] = useState<number | null>(null);

  const [posPrintInvoice, setPosPrintInvoice] = useState<InvoiceRecord | null>(null);
  const posPrintRef = useRef<HTMLDivElement | null>(null);

  const [pendingOfflineInvoices, setPendingOfflineInvoices] = useState<PendingOfflineInvoice[]>([]);
  const [syncingOfflineInvoices, setSyncingOfflineInvoices] = useState(false);

  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) router.push('/');
    else setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      resolveAssignedRoute();
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(OFFLINE_INVOICE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PendingOfflineInvoice[];
        if (Array.isArray(parsed)) {
          setPendingOfflineInvoices(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load offline invoices from storage:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        OFFLINE_INVOICE_STORAGE_KEY,
        JSON.stringify(pendingOfflineInvoices)
      );
    } catch (error) {
      console.error('Failed to persist offline invoices to storage:', error);
    }
  }, [pendingOfflineInvoices]);

  const resolveAssignedRoute = async () => {
    const searchParams = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;

    const routeFromQuery = searchParams?.get('route_id');
    const loadFromQuery = searchParams?.get('load_id');

    if (routeFromQuery) {
      setAssignedRouteId(routeFromQuery);
      localStorage.setItem('distribution_assigned_route_id', routeFromQuery);
    }

    if (loadFromQuery) {
      setActiveLoadId(loadFromQuery);
      localStorage.setItem('distribution_active_load_id', loadFromQuery);
    }

    if (routeFromQuery || loadFromQuery) {
      return;
    }

    const cachedRouteId = localStorage.getItem('distribution_assigned_route_id');
    const cachedLoadId = localStorage.getItem('distribution_active_load_id');
    if (cachedRouteId) {
      setAssignedRouteId(cachedRouteId);
    }
    if (cachedLoadId) {
      setActiveLoadId(cachedLoadId);
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

      if (assignedLoad?.id) {
        const loadId = String(assignedLoad.id);
        setActiveLoadId(loadId);
        localStorage.setItem('distribution_active_load_id', loadId);
      }

      if (assignedLoad?.route_id) {
        const routeId = String(assignedLoad.route_id);
        setAssignedRouteId(routeId);
        localStorage.setItem('distribution_assigned_route_id', routeId);
      }
    } catch (error) {
      console.error('Error resolving assigned route on invoices page:', error);
    }
  };

  const generateInvoiceNumber = () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

    const generatePaymentNumber = () => `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
    const generateReturnNumber = () => `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

  const syncOfflineInvoices = async () => {
    if (!token || syncingOfflineInvoices || pendingOfflineInvoices.length === 0) return;
    setSyncingOfflineInvoices(true);
    try {
      const stillPending: PendingOfflineInvoice[] = [];
      let anySynced = false;

      for (const entry of pendingOfflineInvoices) {
        const inv = entry.payload;
        try {
          const invoiceRes = await axios.post('http://localhost:8000/api/distribution/invoices', {
            invoice_number: inv.invoice_number,
            customer_id: inv.customer_id,
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            discount: inv.discount,
            notes: inv.notes,
            items: inv.items,
          }, { headers: { Authorization: `Bearer ${token}` } });

          const createdInvoice: any = invoiceRes.data?.data;

          if (inv.payment && createdInvoice?.id) {
            try {
              await axios.post('http://localhost:8000/api/distribution/payments', {
                payment_number: generatePaymentNumber(),
                distribution_invoice_id: createdInvoice.id,
                customer_id: createdInvoice.customer_id ?? inv.customer_id,
                payment_date: inv.payment.date,
                amount: inv.payment.amount,
                payment_method: inv.payment.method,
                reference_no: inv.payment.reference || null,
                bank_name: inv.payment.bank_name || null,
                status: 'received',
                notes: `Auto payment from invoice ${createdInvoice.invoice_number} (offline sync)`,
              }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (paymentError) {
              console.error('Failed to sync offline payment for invoice:', paymentError);
            }
          }

          if (entry.payload.returnPayload && createdInvoice?.id) {
            try {
              const rp = entry.payload.returnPayload;
              await axios.post('http://localhost:8000/api/distribution/returns', {
                return_number: rp.return_number,
                distribution_invoice_id: createdInvoice.id,
                customer_id: createdInvoice.customer_id ?? inv.customer_id,
                returned_inventory_item_id: null,
                return_date: rp.return_date,
                total_quantity: rp.total_quantity,
                total_amount: rp.total_amount,
                settlement_type: rp.settlement_type,
                settlement_amount: rp.settlement_amount,
                exchange_inventory_item_id: rp.exchange_inventory_item_id,
                exchange_quantity: rp.exchange_quantity,
                reason: rp.reason,
                status: rp.status,
                notes: rp.notes,
              }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (returnError) {
              console.error('Failed to sync offline return for invoice:', returnError);
            }
          }

          anySynced = true;
        } catch (error: any) {
          console.error('Failed to sync offline invoice entry, keeping in queue:', error);
          stillPending.push(entry);
        }
      }

      if (anySynced) {
        setPendingOfflineInvoices(stillPending);
        fetchData();
      }
    } finally {
      setSyncingOfflineInvoices(false);
    }
  };

  const fetchLoadItems = async (loadId: string) => {
    if (!loadId) return;
    try {
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/load-items', {
        headers: { Authorization: `Bearer ${token}` },
        params: { load_id: loadId },
      });
      const raw = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const mapped: LoadItemInfo[] = raw.map((li: any) => ({
        id: Number(li.id),
        load_id: Number(li.load_id),
        product_code: String(li.product_code),
        name: String(li.name ?? ''),
        qty: Number(li.qty) || 0,
        sell_price: Number(li.sell_price) || 0,
      }));
      setLoadItems(mapped);
    } catch (error) {
      console.error('Error fetching active load items for invoices:', error);
      setLoadItems([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, inventoryRes, invoicesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/distribution/customers', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 1000 } }),
        axios.get('http://localhost:8000/api/stock/inventory', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 1000 } }),
        axios.get('http://localhost:8000/api/distribution/invoices', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 50 } }),
      ]);

      setCustomers(customersRes.data?.data?.data || []);
      const inventory = inventoryRes.data?.data?.data || inventoryRes.data?.data || [];
      setItems(inventory.filter((item: any) => item.status === 'active').map((item: any) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        unit: item.unit,
        sell_price: Number(item.sell_price) || 0,
        current_stock: Number(item.current_stock) || 0,
      })));
      setInvoices(invoicesRes.data?.data?.data || []);

      setInvoiceNumber(generateInvoiceNumber());
    } catch (error) {
      console.error('Error loading invoices page data:', error);
      setCustomers([]);
      setItems([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeLoadId) {
      fetchLoadItems(activeLoadId);
    } else {
      setLoadItems([]);
    }
  }, [token, activeLoadId]);

  useEffect(() => {
    if (!token) return;

    const handleOnline = () => {
      syncOfflineInvoices();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    // Try an initial sync when token becomes available
    syncOfflineInvoices();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [token, pendingOfflineInvoices.length]);

  const addLine = () => {
    const selected = items.find((item) => item.id === Number(selectedItemId));
    const paidQty = Number(lineQty);
    const freeQty = Number(lineFreeQty) || 0;
    const discountPerUnit = Number(lineItemDiscount) || 0;
    if (!selected) {
      setQtyWarningMessage('Please select an item from the list.');
      setQtyWarningOpen(true);
      return;
    }
    if (!paidQty || paidQty <= 0) {
      setQtyWarningMessage('Please enter a valid quantity.');
      setQtyWarningOpen(true);
      return;
    }

    const totalUnits = paidQty + freeQty;
    if (totalUnits <= 0) {
      setQtyWarningMessage('Total quantity must be greater than zero.');
      setQtyWarningOpen(true);
      return;
    }

    const activeLoadNumeric = Number(activeLoadId) || undefined;
    const matchingLoad = loadItems.find(
      (li) =>
        li.product_code === selected.code &&
        (!activeLoadNumeric || li.load_id === activeLoadNumeric)
    );

    if (matchingLoad) {
      const alreadyOnInvoice = lines
        .filter((line) => line.inventory_item_id === selected.id)
        .reduce((sum, line) => sum + line.quantity, 0);

      const remainingFromLoad = Number(matchingLoad.qty) - alreadyOnInvoice;

      if (remainingFromLoad <= 0) {
        setQtyWarningMessage(
          `No remaining quantity for this item in the current load. Loaded: ${Number(matchingLoad.qty).toFixed(2)} ${selected.unit}.`
        );
        setQtyWarningOpen(true);
        return;
      }

      if (totalUnits > remainingFromLoad + 1e-9) {
        setQtyWarningMessage(
          `You can only add up to ${remainingFromLoad.toFixed(2)} ${selected.unit} from this load (loaded: ${Number(
            matchingLoad.qty
          ).toFixed(2)}).`
        );
        setQtyWarningOpen(true);
        return;
      }
    }
    const basePrice = matchingLoad && matchingLoad.sell_price > 0
      ? matchingLoad.sell_price
      : selected.sell_price;
    const effectivePaidUnitPrice = Math.max(0, basePrice - discountPerUnit);

    setLines((prev) => {
      const existingIndex = prev.findIndex(
        (line) =>
          line.inventory_item_id === selected.id &&
          (line.item_discount || 0) === discountPerUnit &&
          (line.base_unit_price || line.unit_price) === basePrice
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        const existing = copy[existingIndex];
        const existingFree = existing.free_quantity || 0;
        const existingPaid =
          typeof existing.paid_quantity === 'number'
            ? existing.paid_quantity
            : existing.quantity - existingFree;
        copy[existingIndex] = {
          ...existing,
          quantity: existing.quantity + totalUnits,
          free_quantity: existingFree + freeQty,
          paid_quantity: existingPaid + paidQty,
        };
        return copy;
      }

      return [
        ...prev,
        {
          inventory_item_id: selected.id,
          item_code: selected.code,
          item_name: selected.name,
          unit: selected.unit,
          quantity: totalUnits,
          unit_price: effectivePaidUnitPrice,
          base_unit_price: basePrice,
          item_discount: discountPerUnit,
          free_quantity: freeQty,
          paid_quantity: paidQty,
        },
      ];
    });

    setSelectedItemId('');
    setItemSearch('');
    setShowItemDropdown(false);
    setHighlightedItemIndex(-1);
    setLineQty('');
    setLineFreeQty('');
    setLineItemDiscount('');
  };

  const removeLine = (id: number) => setLines((prev) => prev.filter((line) => line.inventory_item_id !== id));

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const freeQty = line.free_quantity || 0;
        const paidQty =
          typeof line.paid_quantity === 'number'
            ? line.paid_quantity
            : line.quantity - freeQty;
        return sum + paidQty * line.unit_price;
      }, 0),
    [lines]
  );

  const updateLineQuantities = (itemId: number, newPaid: number, newFree: number) => {
    setLines((prev) => {
      const line = prev.find((l) => l.inventory_item_id === itemId);
      if (!line) return prev;

      const paidQty = newPaid;
      const freeQty = newFree;
      const totalUnits = paidQty + freeQty;

      if (totalUnits <= 0) {
        setQtyWarningMessage('Total quantity must be greater than zero.');
        setQtyWarningOpen(true);
        return prev;
      }

      const activeLoadNumeric = Number(activeLoadId) || undefined;
      const matchingLoad = loadItems.find(
        (li) =>
          li.product_code === line.item_code &&
          (!activeLoadNumeric || li.load_id === activeLoadNumeric)
      );

      if (matchingLoad) {
        const otherLinesTotal = prev
          .filter((l) => l.inventory_item_id === itemId && l !== line)
          .reduce((sum, l) => sum + l.quantity, 0);

        const remainingFromLoad = Number(matchingLoad.qty) - otherLinesTotal;

        if (remainingFromLoad <= 0) {
          setQtyWarningMessage(
            `No remaining quantity for this item in the current load. Loaded: ${Number(
              matchingLoad.qty
            ).toFixed(2)} ${line.unit}.`
          );
          setQtyWarningOpen(true);
          return prev;
        }

        if (totalUnits > remainingFromLoad + 1e-9) {
          setQtyWarningMessage(
            `You can only set up to ${remainingFromLoad.toFixed(2)} ${line.unit} from this load (loaded: ${Number(
              matchingLoad.qty
            ).toFixed(2)}).`
          );
          setQtyWarningOpen(true);
          return prev;
        }
      }

      return prev.map((l) => {
        if (l.inventory_item_id !== itemId) return l;
        return {
          ...l,
          quantity: paidQty + freeQty,
          paid_quantity: paidQty,
          free_quantity: freeQty,
        };
      });
    });
  };

  const updateLineDiscount = (itemId: number, newDiscount: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.inventory_item_id !== itemId) return line;
        const base =
          typeof line.base_unit_price === 'number'
            ? line.base_unit_price
            : line.unit_price + (line.item_discount || 0);
        const effectivePaidUnitPrice = Math.max(0, base - newDiscount);
        return {
          ...line,
          base_unit_price: base,
          item_discount: newDiscount,
          unit_price: effectivePaidUnitPrice,
        };
      })
    );
  };

  const updateLineUnitPrice = (itemId: number, newPrice: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.inventory_item_id !== itemId) return line;
        const price = Math.max(0, newPrice);
        const base =
          typeof line.base_unit_price === 'number'
            ? line.base_unit_price
            : price + (line.item_discount || 0);
        const discount = Math.max(0, base - price);
        return {
          ...line,
          base_unit_price: base,
          unit_price: price,
          item_discount: discount,
        };
      })
    );
  };

  const updateReturnLine = (itemId: number, newQty: number, newPrice: number) => {
    setReturnLines((prev) =>
      prev.map((line) => {
        if (line.inventory_item_id !== itemId) return line;
        const qty = Math.max(0, newQty);
        const price = Math.max(0, newPrice);
        if (!qty || !price) {
          return {
            ...line,
            quantity: qty,
            unit_price: price,
          };
        }
        return {
          ...line,
          quantity: qty,
          unit_price: price,
        };
      })
    );
  };
  const scopedCustomers = useMemo(() => {
    if (!assignedRouteId) return customers;
    return customers.filter((customer) => String(customer.route_id || '') === assignedRouteId);
  }, [customers, assignedRouteId]);

  const scopedCustomerIdSet = useMemo(() => new Set(scopedCustomers.map((customer) => customer.id)), [scopedCustomers]);
  const scopedInvoices = useMemo(() => {
    if (!assignedRouteId) return invoices;
    return invoices.filter((invoice) => scopedCustomerIdSet.has(invoice.customer_id));
  }, [invoices, scopedCustomerIdSet, assignedRouteId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(scopedInvoices.length / pageSize)),
    [scopedInvoices.length, pageSize]
  );

  const pagedInvoices = useMemo(
    () => {
      const start = (currentPage - 1) * pageSize;
      return scopedInvoices.slice(start, start + pageSize);
    },
    [scopedInvoices, currentPage, pageSize]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [scopedInvoices.length]);

  const filteredItems = useMemo(() => {
    const search = itemSearch.trim().toLowerCase();
    if (!search) return [];
    return items
      .filter((item) => item.code.toLowerCase().includes(search) || item.name.toLowerCase().includes(search))
      .slice(0, 8);
  }, [itemSearch, items]);
  const selectedItem = items.find((item) => item.id === Number(selectedItemId)) || null;
  const discountAmount = useMemo(() => {
    const value = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      return Math.max(0, (subtotal * value) / 100);
    }
    return Math.max(0, value);
  }, [discountType, discountValue, subtotal]);
  const totalReturnValue = useMemo(
    () => returnLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0),
    [returnLines]
  );

  const payloadDiscount = useMemo(
    () => discountAmount + (inlineReturnMode === 'deduct' ? totalReturnValue : 0),
    [discountAmount, inlineReturnMode, totalReturnValue]
  );

  const invoiceTotalBeforeReturns = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const invoiceFinalTotal = useMemo(
    () => Math.max(0, subtotal - payloadDiscount),
    [subtotal, payloadDiscount]
  );

  const returnSuggestionItems = useMemo(() => {
    const term = returnSearch.trim().toLowerCase();
    if (!term) return [] as Item[];
    return items
      .filter((item) =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [returnSearch, items]);
  const loadQtyByCode = useMemo(() => {
    const map = new Map<string, number>();
    loadItems.forEach((li) => {
      if (li && typeof li.product_code === 'string') {
        map.set(li.product_code, Number(li.qty) || 0);
      }
    });
    return map;
  }, [loadItems]);

  const resetInvoiceForm = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setDiscountType('amount');
    setDiscountValue('0');
    setNotes('');
    setSelectedItemId('');
    setItemSearch('');
    setShowItemDropdown(false);
    setHighlightedItemIndex(-1);
    setLineQty('');
    setLineFreeQty('');
    setLineItemDiscount('');
    setLines([]);
    setReturnSearch('');
    setShowReturnSuggestions(false);
    setReturnSelectedItemId('');
    setReturnQtyInput('');
    setReturnLines([]);
    setInlineReturnMode('deduct');
    setAddPayment(false);
    setPaymentMethod('cash');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split( 'T')[0]);
    setPaymentReference('');
    setPaymentBankName('');
  };

  const handlePosPrint = (invoice: InvoiceRecord) => {
    setPosPrintInvoice(invoice);
    // Allow React to render the print area before triggering print
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 300);
  };

  const openViewInvoice = (invoice: InvoiceRecord) => {
    setViewInvoice(invoice);
  };

  const openCreate = () => {
    resetInvoiceForm();
    if (assignedRouteId && scopedCustomers.length === 1) {
      setCustomerId(String(scopedCustomers[0].id));
    }
    setShowModal(true);
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lines.length === 0) {
      setQtyWarningMessage('Select customer and add at least one item line.');
      setQtyWarningOpen(true);
      return;
    }

    if (assignedRouteId && !scopedCustomers.some((customer) => customer.id === Number(customerId))) {
      setQtyWarningMessage('Selected customer is not in your allocated route.');
      setQtyWarningOpen(true);
      return;
    }

    if (addPayment) {
      const amt = Number(paymentAmount);
      if (!amt || amt <= 0) {
        setQtyWarningMessage('Enter a valid payment amount.');
        setQtyWarningOpen(true);
        return;
      }
    }

    const composedNotes = (() => {
        const parts: string[] = [];
        if (notes.trim()) parts.push(notes.trim());

        if (lines.length > 0) {
          parts.push('[INVOICE LINES]');
          parts.push('Line breakdown:');
          lines.forEach((line) => {
            const freeQty = line.free_quantity || 0;
            const paidQty =
              typeof line.paid_quantity === 'number'
                ? line.paid_quantity
                : line.quantity - freeQty;
            const base =
              typeof line.base_unit_price === 'number'
                ? line.base_unit_price
                : line.unit_price + (line.item_discount || 0);
            const discountPerUnit = line.item_discount || 0;
            const paidTotal = paidQty * line.unit_price;
            parts.push(
              `- ${paidQty.toFixed(2)} paid + ${freeQty.toFixed(2)} free x ${line.item_name} (${line.item_code}) @ base ${base.toFixed(2)}, disc/unit ${discountPerUnit.toFixed(2)}, effective ${line.unit_price.toFixed(2)} => paid total ${paidTotal.toFixed(2)}`
            );
          });
        }

        if (returnLines.length > 0) {
          parts.push('[ITEM RETURNS]');
          parts.push('Returned items:');
          returnLines.forEach((line) => {
            const lineValue = line.quantity * line.unit_price;
            parts.push(
              `- ${line.quantity.toFixed(2)} x ${line.item_name} (${line.item_code}) @ ${line.unit_price.toFixed(2)} = ${lineValue.toFixed(2)}`
            );
          });
          parts.push(`Total return value: ${totalReturnValue.toFixed(2)}`);
          parts.push(
            inlineReturnMode === 'deduct'
              ? 'Return mode: DEDUCT FROM INVOICE'
              : 'Return mode: EXCHANGE ONLY (no deduction from invoice)'
          );
        }

      return parts.join('\n');
    })();

    const itemsPayload = lines.flatMap((line) => {
        const freeQty = line.free_quantity || 0;
        const paidQty =
          typeof line.paid_quantity === 'number'
            ? line.paid_quantity
            : line.quantity - freeQty;

        const baseItem = {
          inventory_item_id: line.inventory_item_id,
          item_code: line.item_code,
          item_name: line.item_name,
          unit: line.unit,
        };

        const result: any[] = [];

        if (paidQty > 0) {
          result.push({
            ...baseItem,
            quantity: paidQty,
            unit_price: line.unit_price,
          });
        }

        if (freeQty > 0) {
          result.push({
            ...baseItem,
            quantity: freeQty,
            unit_price: 0,
          });
        }
      return result;
    });

    const baseInvoicePayload = {
      invoice_number: invoiceNumber,
      customer_id: Number(customerId),
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      discount: payloadDiscount,
      notes: composedNotes,
      items: itemsPayload,
    };

    const paymentPayload = addPayment
      ? {
          amount: Number(paymentAmount),
          method: paymentMethod,
          date: paymentDate || invoiceDate,
          reference: paymentReference || null,
          bank_name: paymentBankName || null,
        }
      : null;

    const queueOfflineAndFinish = () => {
      const hasReturns = returnLines.length > 0;
      const totalReturnQty = hasReturns
        ? returnLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
        : 0;

      const returnPayload = hasReturns
        ? {
            return_number: generateReturnNumber(),
            customer_id: Number(customerId),
            return_date: invoiceDate,
            total_quantity: totalReturnQty,
            total_amount: totalReturnValue,
            settlement_type: inlineReturnMode === 'deduct' ? 'bill_deduction' : 'item_exchange',
            settlement_amount: inlineReturnMode === 'deduct' ? totalReturnValue : 0,
            exchange_inventory_item_id: null,
            exchange_quantity: 0,
            reason: null,
            status: 'approved',
            notes: composedNotes,
          }
        : null;

      const offlineEntry = {
        id: `${invoiceNumber}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        payload: {
          ...baseInvoicePayload,
          payment: paymentPayload,
          returnPayload,
        },
      } as PendingOfflineInvoice;

      setPendingOfflineInvoices((prev) => [...prev, offlineEntry]);

      const customer = customers.find((c) => c.id === Number(customerId));
      const subtotalLocal = subtotal;
      const discountLocal = payloadDiscount;
      const totalLocal = Math.max(0, subtotalLocal - discountLocal);

      const pseudoInvoice: InvoiceRecord = {
        id: Date.now(),
        invoice_number: invoiceNumber,
        customer_id: Number(customerId),
        customer: customer
          ? { shop_name: customer.shop_name, customer_code: customer.customer_code }
          : undefined,
        invoice_date: invoiceDate,
        subtotal: subtotalLocal,
        discount: discountLocal,
        total: totalLocal,
        status: 'pending',
        items: baseInvoicePayload.items.map((it, index) => ({
          id: index,
          inventory_item_id: it.inventory_item_id,
          item_code: it.item_code,
          item_name: it.item_name,
          unit: it.unit,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
        notes: composedNotes,
      };

      setShowModal(false);
      resetInvoiceForm();

      handlePosPrint(pseudoInvoice);

      setQtyWarningMessage('No internet connection. Invoice saved locally and will sync automatically when connection is available.');
      setQtyWarningOpen(true);
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueOfflineAndFinish();
      return;
    }

    try {
      setSaving(true);

      const invoiceRes = await axios.post('http://localhost:8000/api/distribution/invoices', {
        ...baseInvoicePayload,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const createdInvoice: any = invoiceRes.data?.data;

      if (paymentPayload && createdInvoice?.id) {
        try {
          await axios.post('http://localhost:8000/api/distribution/payments', {
            payment_number: generatePaymentNumber(),
            distribution_invoice_id: createdInvoice.id,
            customer_id: createdInvoice.customer_id ?? Number(customerId),
            payment_date: paymentPayload.date,
            amount: paymentPayload.amount,
            payment_method: paymentPayload.method,
            reference_no: paymentPayload.reference || null,
            bank_name: paymentPayload.bank_name || null,
            status: 'received',
            notes: `Auto payment from invoice ${createdInvoice.invoice_number}`,
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (paymentError: any) {
          console.error('Failed to record payment for invoice:', paymentError);
          setQtyWarningMessage(paymentError?.response?.data?.message || 'Invoice saved, but payment could not be recorded.');
          setQtyWarningOpen(true);
        }
      }

      if (returnLines.length > 0 && createdInvoice?.id) {
        try {
          const totalReturnQty = returnLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
          await axios.post('http://localhost:8000/api/distribution/returns', {
            return_number: generateReturnNumber(),
            distribution_invoice_id: createdInvoice.id,
            customer_id: createdInvoice.customer_id ?? Number(customerId),
            returned_inventory_item_id: null,
            return_date: invoiceDate,
            total_quantity: totalReturnQty,
            total_amount: totalReturnValue,
            settlement_type: inlineReturnMode === 'deduct' ? 'bill_deduction' : 'item_exchange',
            settlement_amount: inlineReturnMode === 'deduct' ? totalReturnValue : 0,
            exchange_inventory_item_id: null,
            exchange_quantity: 0,
            reason: null,
            status: 'approved',
            notes: composedNotes,
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (returnError: any) {
          console.error('Failed to record inline return for invoice:', returnError);
        }
      }

      setShowModal(false);
      resetInvoiceForm();

      await fetchData();

      if (createdInvoice) {
        handlePosPrint(createdInvoice as InvoiceRecord);
      }
    } catch (error: any) {
      if (!error?.response) {
        // Network / connectivity issue -> queue for offline sync
        queueOfflineAndFinish();
      } else {
        setQtyWarningMessage(error?.response?.data?.message || 'Failed to create invoice');
        setQtyWarningOpen(true);
      }
    } finally {
      setSaving(false);
    }
  };
  const handleReturnSuggestionClick = (item: Item) => {
    setReturnSelectedItemId(String(item.id));
    setReturnSearch(`${item.code} - ${item.name}`);
    setShowReturnSuggestions(false);
  };

  const addReturnLine = () => {
    const selected = items.find((item) => item.id === Number(returnSelectedItemId));
    const qty = Number(returnQtyInput);

    if (!selected) {
      setQtyWarningMessage('Please select a return item from the list.');
      setQtyWarningOpen(true);
      return;
    }

    if (!qty || qty <= 0) {
      setQtyWarningMessage('Please enter a valid return quantity.');
      setQtyWarningOpen(true);
      return;
    }

    setReturnLines((prev) => {
      const exists = prev.find((line) => line.inventory_item_id === selected.id);
      if (exists) {
        return prev.map((line) =>
          line.inventory_item_id === selected.id
            ? { ...line, quantity: line.quantity + qty }
            : line
        );
      }

      return [
        ...prev,
        {
          inventory_item_id: selected.id,
          item_code: selected.code,
          item_name: selected.name,
          unit: selected.unit,
          quantity: qty,
          unit_price: selected.sell_price,
        },
      ];
    });

    setReturnSelectedItemId('');
    setReturnSearch('');
    setReturnQtyInput('');
    setShowReturnSuggestions(false);
  };

  const removeReturnLine = (id: number) => {
    setReturnLines((prev) => prev.filter((line) => line.inventory_item_id !== id));
  };

  const openReturnModal = (invoice: InvoiceRecord) => {
    setReturnInvoice(invoice);
    setReturnLineId('');
    setReturnQty('');
    setSettlementType('bill_deduction');
    setSettlementAmount('');
    setExchangeItemId('');
    setExchangeQty('');
    setReturnReason('');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const selectedReturnLine = returnInvoice?.items?.find((line) => line.id === Number(returnLineId));
  const computedReturnAmount = selectedReturnLine
    ? (Number(returnQty || 0) * Number(selectedReturnLine.unit_price || 0))
    : 0;

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice || !selectedReturnLine) {
      setQtyWarningMessage('Please select an invoice item to return.');
      setQtyWarningOpen(true);
      return;
    }

    const qty = Number(returnQty);
    if (!qty || qty <= 0) {
      setQtyWarningMessage('Please enter a valid return quantity.');
      setQtyWarningOpen(true);
      return;
    }

    if (qty > Number(selectedReturnLine.quantity)) {
      setQtyWarningMessage('Return quantity cannot exceed invoiced quantity.');
      setQtyWarningOpen(true);
      return;
    }

    if (settlementType === 'item_exchange' && (!exchangeItemId || Number(exchangeQty) <= 0)) {
      setQtyWarningMessage('Select exchange item and quantity.');
      setQtyWarningOpen(true);
      return;
    }

    try {
      setReturnSaving(true);
      await axios.post('http://localhost:8000/api/distribution/returns', {
        return_number: `RET-${Date.now()}`,
        distribution_invoice_id: returnInvoice.id,
        customer_id: returnInvoice.customer_id,
        returned_inventory_item_id: selectedReturnLine.inventory_item_id,
        return_date: new Date().toISOString().split('T')[0],
        total_quantity: qty,
        total_amount: computedReturnAmount,
        settlement_type: settlementType,
        settlement_amount: Number(settlementAmount || computedReturnAmount || 0),
        exchange_inventory_item_id: settlementType === 'item_exchange' ? Number(exchangeItemId) : null,
        exchange_quantity: settlementType === 'item_exchange' ? Number(exchangeQty || 0) : 0,
        reason: returnReason || null,
        notes: returnNotes || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowReturnModal(false);
      setReturnInvoice(null);
      fetchData();
    } catch (error: any) {
      setQtyWarningMessage(error?.response?.data?.message || 'Failed to process return');
      setQtyWarningOpen(true);
    } finally {
      setReturnSaving(false);
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
                  🧾
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900">Distribution Invoices</h1>
                  <p className="text-xs text-gray-500">Create and manage customer invoices</p>
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-600">
              Create and track distribution invoices.
            </p>
            {assignedRouteId && (
              <p className="mt-1 text-sm text-green-700 font-medium">Auto route filter enabled from allocated load.</p>
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
              Add Invoice
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scopedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">No invoices yet.</td>
                  </tr>
                ) : (
                  pagedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customer?.shop_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{Number(invoice.total).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openViewInvoice(invoice)}
                            className="text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm font-medium border border-gray-200"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handlePosPrint(invoice)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            POS Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-200">
            {scopedInvoices.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">No invoices yet.</div>
            ) : pagedInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                  <span className="text-xs text-gray-600">{invoice.status}</span>
                </div>
                <p className="text-sm text-gray-700">{invoice.customer?.shop_name || '-'}</p>
                <p className="text-xs text-gray-500">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                <p className="text-sm font-medium text-gray-900">Total: {Number(invoice.total).toFixed(2)}</p>
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => openViewInvoice(invoice)}
                    className="flex-1 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium border border-gray-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handlePosPrint(invoice)}
                    className="flex-1 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    POS Print
                  </button>
                </div>
              </div>
            ))}
          </div>

          {scopedInvoices.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
              <div>
                {(() => {
                  const start = (currentPage - 1) * pageSize + 1;
                  const end = Math.min(scopedInvoices.length, currentPage * pageSize);
                  return `Showing ${start}–${end} of ${scopedInvoices.length} invoices`;
                })()}
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-md border border-gray-300 bg-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-[11px] text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-md border border-gray-300 bg-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-60 z-50 flex items-end md:items-center justify-center">
          <div className="relative w-full h-[90vh] md:h-auto md:w-11/12 max-w-5xl mx-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden md:max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between px-4 md:px-6 pt-4 pb-3 border-b border-gray-100 bg-gray-50/70 backdrop-blur-sm">
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Create Invoice</h3>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Select shop, add items, and optionally record payment in one flow.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetInvoiceForm();
                }}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
              <form onSubmit={submitInvoice} className="space-y-6 pt-4">
                <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Invoice details</h4>
                      <p className="text-xs text-gray-500">Basic information for this bill.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                      <span>{assignedRouteId ? 'Auto route filter active' : 'No route filter'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
                      <input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shop</label>
                      <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                      >
                        <option value="">Select Shop</option>
                        {scopedCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.shop_name} ({customer.customer_code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Items</h4>
                      <p className="text-xs text-gray-500">Search stock, add quantity, then review the lines.</p>
                    </div>
                    <div className="hidden md:flex flex-col items-end text-xs text-gray-600">
                      <span>Subtotal: <span className="font-semibold text-gray-900">{subtotal.toFixed(2)}</span></span>
                      <span>Bill total (before returns): <span className="font-semibold text-gray-900">{invoiceTotalBeforeReturns.toFixed(2)}</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={(e) => {
                            setItemSearch(e.target.value);
                            setSelectedItemId('');
                            setShowItemDropdown(true);
                            setHighlightedItemIndex(-1);
                          }}
                          onFocus={() => {
                            setShowItemDropdown(true);
                            setHighlightedItemIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (!showItemDropdown || filteredItems.length === 0) return;

                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedItemIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedItemIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              const targetIndex = highlightedItemIndex >= 0 ? highlightedItemIndex : 0;
                              const picked = filteredItems[targetIndex];
                              if (picked) {
                                setSelectedItemId(String(picked.id));
                                setItemSearch(`${picked.code} - ${picked.name}`);
                                setShowItemDropdown(false);
                                setHighlightedItemIndex(-1);
                              }
                            } else if (e.key === 'Escape') {
                              setShowItemDropdown(false);
                              setHighlightedItemIndex(-1);
                            }
                          }}
                          placeholder="Type item code or name"
                          className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                        />
                        {showItemDropdown && filteredItems.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                            {filteredItems.map((item, index) => {
                              const loadQty = loadQtyByCode.get(item.code);
                              const matchingLoad = loadItems.find(
                                (li) =>
                                  li.product_code === item.code &&
                                  (!activeLoadId || String(li.load_id) === String(activeLoadId))
                              );
                              const priceFromLoad = matchingLoad && matchingLoad.sell_price > 0
                                ? matchingLoad.sell_price
                                : item.sell_price;

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedItemId(String(item.id));
                                    setItemSearch(`${item.code} - ${item.name}`);
                                    setShowItemDropdown(false);
                                    setHighlightedItemIndex(-1);
                                  }}
                                  className={`w-full text-left px-3 py-2 border-b last:border-b-0 ${
                                    highlightedItemIndex === index ? 'bg-green-100' : 'hover:bg-green-50'
                                  }`}
                                >
                                  <div className="text-sm font-medium text-gray-900">{item.code} - {item.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {typeof loadQty === 'number' ? `Load: ${loadQty.toFixed(2)} ${item.unit} | ` : ''}
                                    Stock: {item.current_stock} {item.unit}
                                    {` | Price: ${priceFromLoad.toFixed(2)}`}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {selectedItem && (
                        (() => {
                          const loadQty = loadQtyByCode.get(selectedItem.code);
                          const matchingLoad = loadItems.find(
                            (li) =>
                              li.product_code === selectedItem.code &&
                              (!activeLoadId || String(li.load_id) === String(activeLoadId))
                          );
                          const priceFromLoad = matchingLoad && matchingLoad.sell_price > 0
                            ? matchingLoad.sell_price
                            : selectedItem.sell_price;

                          return (
                            <p className="mt-1 text-xs text-green-700">
                              Selected: {selectedItem.name}
                              {typeof loadQty === 'number'
                                ? ` | Load: ${loadQty.toFixed(2)} ${selectedItem.unit}`
                                : ''}
                              {` | Warehouse: ${selectedItem.current_stock} ${selectedItem.unit}`}
                              {` | Price: ${priceFromLoad.toFixed(2)}`}
                            </p>
                          );
                        })()
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Qty (Paid)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lineQty}
                        onChange={(e) => setLineQty(e.target.value)}
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2 mb-2"
                      />
                      <label className="block text-xs font-medium text-gray-700 mb-1">Free Qty</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lineFreeQty}
                        onChange={(e) => setLineFreeQty(e.target.value)}
                        className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                      />
                    </div>
                    <div className="flex flex-col justify-end gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item Discount (per unit)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lineItemDiscount}
                          onChange={(e) => setLineItemDiscount(e.target.value)}
                          className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addLine}
                        className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
                      >
                        Add Line
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                      rows={2}
                    />
                  </div>

                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Qty (Paid)</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Free Qty</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Disc/Unit</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Line Total</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lines.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              No lines added.
                            </td>
                          </tr>
                        ) : (
                          lines.map((line) => {
                            const freeQty = line.free_quantity || 0;
                            const paidQty =
                              typeof line.paid_quantity === 'number'
                                ? line.paid_quantity
                                : line.quantity - freeQty;
                            const isEditing = editingLineId === line.inventory_item_id;
                            return (
                              <tr key={line.inventory_item_id}>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {line.item_name} ({line.item_code})
                                </td>
                                <td className="px-4 py-1 text-sm text-gray-700 text-right align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={paidQty}
                                      onChange={(e) =>
                                        updateLineQuantities(
                                          line.inventory_item_id,
                                          Number(e.target.value) || 0,
                                          freeQty
                                        )
                                      }
                                      className="w-24 rounded-md border border-gray-300 text-right text-sm text-black px-2 py-1"
                                    />
                                  ) : (
                                    <span>{paidQty.toFixed(2)} {line.unit}</span>
                                  )}
                                </td>
                                <td className="px-4 py-1 text-sm text-gray-700 text-right align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={freeQty}
                                      onChange={(e) =>
                                        updateLineQuantities(
                                          line.inventory_item_id,
                                          paidQty,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      className="w-24 rounded-md border border-gray-300 text-right text-sm text-black px-2 py-1"
                                    />
                                  ) : (
                                    <span>{freeQty.toFixed(2)} {line.unit}</span>
                                  )}
                                </td>
                                <td className="px-4 py-1 text-sm text-gray-700 text-right align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={line.item_discount || 0}
                                      onChange={(e) =>
                                        updateLineDiscount(
                                          line.inventory_item_id,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      className="w-24 rounded-md border border-gray-300 text-right text-sm text-black px-2 py-1"
                                    />
                                  ) : (
                                    <span>{(line.item_discount || 0).toFixed(2)}</span>
                                  )}
                                </td>
                                <td className="px-4 py-1 text-sm text-gray-700 text-right align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={line.unit_price}
                                      onChange={(e) =>
                                        updateLineUnitPrice(
                                          line.inventory_item_id,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      className="w-24 rounded-md border border-gray-300 text-right text-sm text-black px-2 py-1"
                                    />
                                  ) : (
                                    <span>{line.unit_price.toFixed(2)}</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                  {(paidQty * line.unit_price).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    {isEditing ? (
                                      <button
                                        type="button"
                                        onClick={() => setEditingLineId(null)}
                                        className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                      >
                                        Done
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setEditingLineId(line.inventory_item_id)}
                                        className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeLine(line.inventory_item_id)}
                                      className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-2 text-right text-sm font-semibold text-gray-700"
                          >
                            Discount
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                            {discountAmount.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-2 text-right text-sm font-semibold text-gray-700"
                          >
                            Bill total (before returns)
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                            {invoiceTotalBeforeReturns.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

              <div className="md:hidden border border-gray-200 rounded-lg bg-white divide-y divide-gray-200 mt-3">
                {lines.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-500">No lines added.</div>
                ) : (
                  lines.map((line) => {
                    const freeQty = line.free_quantity || 0;
                    const paidQty =
                      typeof line.paid_quantity === 'number'
                        ? line.paid_quantity
                        : line.quantity - freeQty;
                    const isEditing = editingLineId === line.inventory_item_id;
                    return (
                      <div
                        key={line.inventory_item_id}
                        className="px-4 py-3 text-sm text-gray-700 flex justify-between gap-3"
                      >
                        <div>
                          <div className="font-medium">{line.item_name}</div>
                          <div className="text-xs text-gray-500">{line.item_code}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Qty: {line.quantity.toFixed(2)} {line.unit}
                          </div>
                          {(freeQty > 0 || (line.item_discount || 0) > 0) && (
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {freeQty > 0 && (
                                <span>Free: {freeQty.toFixed(2)} {line.unit}</span>
                              )}
                              {freeQty > 0 && (line.item_discount || 0) > 0 && (
                                <span className="mx-1">·</span>
                              )}
                              {(line.item_discount || 0) > 0 && (
                                <span>Disc/Unit: {(line.item_discount || 0).toFixed(2)}</span>
                              )}
                            </div>
                          )}
                          {isEditing && (
                            <div className="mt-2 space-y-1 text-[11px] text-gray-700">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Qty (Paid)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paidQty}
                                  onChange={(e) =>
                                    updateLineQuantities(
                                      line.inventory_item_id,
                                      Number(e.target.value) || 0,
                                      freeQty
                                    )
                                  }
                                  className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Free Qty</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={freeQty}
                                  onChange={(e) =>
                                    updateLineQuantities(
                                      line.inventory_item_id,
                                      paidQty,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Disc/Unit</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.item_discount || 0}
                                  onChange={(e) =>
                                    updateLineDiscount(
                                      line.inventory_item_id,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Unit Price</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.unit_price}
                                  onChange={(e) =>
                                    updateLineUnitPrice(
                                      line.inventory_item_id,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Unit</div>
                          <div className="text-sm font-medium">{line.unit_price.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">Total</div>
                          <div className="text-sm font-semibold">
                            {(paidQty * line.unit_price).toFixed(2)}
                          </div>
                          <div className="mt-2 flex justify-end gap-2">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingLineId(null)}
                                className="px-2 py-1 text-[11px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Done
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingLineId(line.inventory_item_id)}
                                className="px-2 py-1 text-[11px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeLine(line.inventory_item_id)}
                              className="px-2 py-1 text-[11px] rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div className="px-4 py-2 bg-gray-50 flex justify-between text-sm font-semibold text-gray-700">
                  <span>Discount</span>
                  <span>{discountAmount.toFixed(2)}</span>
                </div>
                <div className="px-4 py-2 bg-gray-100 flex justify-between text-sm font-bold text-gray-900 rounded-b-lg">
                  <span>Bill total (before returns)</span>
                  <span>{invoiceTotalBeforeReturns.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-dashed border-gray-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percentage')}
                      className="w-1/2 rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">%</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-1/2 rounded-md border border-gray-300 text-sm text-black px-2 py-2"
                    />
                  </div>
                </div>
                <div className="flex sm:items-end justify-between sm:justify-end">
                  <div className="text-xs text-gray-600 text-right">
                    <div>
                      Discount value: <span className="font-semibold text-gray-900">{discountAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      Bill total (before returns): <span className="font-semibold text-gray-900">{invoiceTotalBeforeReturns.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800">Item Returns (Expired / Damaged)</h4>
                    <span className="text-xs text-gray-500">Optional</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Search products, enter return quantity, and we will calculate the value of expired or damaged items returned on this visit.
                  </p>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-gray-600 mb-1">
                      <div className="inline-flex rounded-full bg-white border border-gray-200 p-1">
                        <button
                          type="button"
                          onClick={() => setInlineReturnMode('deduct')}
                          className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                            inlineReturnMode === 'deduct'
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-transparent text-gray-700 border-transparent'
                          }`}
                        >
                          Deduct from invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => setInlineReturnMode('exchange')}
                          className={`ml-1 px-2.5 py-1 rounded-full border text-xs font-medium ${
                            inlineReturnMode === 'exchange'
                              ? 'bg-emerald-50 text-green-700 border-green-200'
                              : 'bg-transparent text-gray-700 border-transparent'
                          }`}
                        >
                          Exchange only
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="block">Return total: <span className="font-semibold text-gray-900">{totalReturnValue.toFixed(2)}</span></span>
                        <span className="block text-[10px] text-gray-500">
                          {inlineReturnMode === 'deduct'
                            ? 'Will reduce this invoice amount.'
                            : 'For exchange only, invoice amount unchanged.'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Return Item</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={returnSearch}
                            onChange={(e) => {
                              const value = e.target.value;
                              setReturnSearch(value);
                              setReturnSelectedItemId('');
                              setShowReturnSuggestions(!!value.trim());
                            }}
                            onFocus={() => {
                              if (returnSearch.trim()) {
                                setShowReturnSuggestions(true);
                              }
                            }}
                            placeholder="Type item code or name"
                            className="w-full rounded-md border border-gray-300 text-black text-sm"
                          />
                          {showReturnSuggestions && returnSuggestionItems.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                              {returnSuggestionItems.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleReturnSuggestionClick(item)}
                                  className="w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-green-50"
                                >
                                  <div className="text-xs font-medium text-gray-900">{item.code} - {item.name}</div>
                                  <div className="text-[11px] text-gray-500">Stock: {item.current_stock} {item.unit}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Return Qty</label>
                        <input
                          type="number"
                          step="0.01"
                          value={returnQtyInput}
                          onChange={(e) => setReturnQtyInput(e.target.value)}
                          className="w-full rounded-md border border-gray-300 text-black text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addReturnLine}
                        className="px-3 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700"
                      >
                        Add Return
                      </button>
                    </div>

                    {returnLines.length > 0 && (
                      <div className="mt-2">
                        <div className="hidden md:block border border-gray-200 rounded-md bg-white overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-1 text-left text-[11px] font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-3 py-1 text-right text-[11px] font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-3 py-1 text-right text-[11px] font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-3 py-1 text-right text-[11px] font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-3 py-1 text-right text-[11px] font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {returnLines.map((line) => {
                                const lineValue = line.quantity * line.unit_price;
                                const isEditing = editingReturnId === line.inventory_item_id;
                                return (
                                  <tr key={line.inventory_item_id}>
                                    <td className="px-3 py-1 text-[11px] text-gray-700">{line.item_name} ({line.item_code})</td>
                                    <td className="px-3 py-1 text-[11px] text-gray-700 text-right align-middle">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={line.quantity}
                                          onChange={(e) =>
                                            updateReturnLine(
                                              line.inventory_item_id,
                                              Number(e.target.value) || 0,
                                              line.unit_price
                                            )
                                          }
                                          className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                        />
                                      ) : (
                                        <span>{line.quantity.toFixed(2)}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1 text-[11px] text-gray-700 text-right align-middle">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={line.unit_price}
                                          onChange={(e) =>
                                            updateReturnLine(
                                              line.inventory_item_id,
                                              line.quantity,
                                              Number(e.target.value) || 0
                                            )
                                          }
                                          className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                        />
                                      ) : (
                                        <span>{line.unit_price.toFixed(2)}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1 text-[11px] text-gray-700 text-right">{lineValue.toFixed(2)}</td>
                                    <td className="px-3 py-1 text-right">
                                      <div className="flex justify-end gap-1">
                                        {isEditing ? (
                                          <button
                                            type="button"
                                            onClick={() => setEditingReturnId(null)}
                                            className="px-2 py-0.5 text-[10px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                          >
                                            Done
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setEditingReturnId(line.inventory_item_id)}
                                            className="px-2 py-0.5 text-[10px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                          >
                                            Edit
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => removeReturnLine(line.inventory_item_id)}
                                          className="px-2 py-0.5 text-[10px] rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan={3} className="px-3 py-1 text-right text-xs font-semibold text-gray-700">Total Return Value</td>
                                <td className="px-3 py-1 text-right text-xs font-bold text-gray-900">{totalReturnValue.toFixed(2)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div className="md:hidden border border-gray-200 rounded-md bg-white divide-y divide-gray-100">
                          {returnLines.map((line) => {
                            const lineValue = line.quantity * line.unit_price;
                            const isEditing = editingReturnId === line.inventory_item_id;
                            return (
                              <div
                                key={line.inventory_item_id}
                                className="px-3 py-2 text-xs text-gray-700 flex justify-between gap-3"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-[11px]">{line.item_name}</div>
                                  <div className="text-[10px] text-gray-500">{line.item_code}</div>
                                  {isEditing ? (
                                    <div className="mt-1">
                                      <label className="block text-[10px] text-gray-500 mb-0.5">Qty</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={line.quantity}
                                        onChange={(e) =>
                                          updateReturnLine(
                                            line.inventory_item_id,
                                            Number(e.target.value) || 0,
                                            line.unit_price
                                          )
                                        }
                                        className="w-full rounded-md border border-gray-300 text-right text-[11px] text-black px-2 py-1"
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-gray-500 mt-1">
                                      Qty: <span className="font-medium text-gray-700">{line.quantity.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-gray-500">Unit</div>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={line.unit_price}
                                      onChange={(e) =>
                                        updateReturnLine(
                                          line.inventory_item_id,
                                          line.quantity,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      className="w-20 rounded-md border border-gray-300 text-right text-[11px] text-black px-1 py-0.5"
                                    />
                                  ) : (
                                    <div className="text-[11px] font-medium">{line.unit_price.toFixed(2)}</div>
                                  )}
                                  <div className="text-[10px] text-gray-500 mt-1">Value</div>
                                  <div className="text-[11px] font-semibold">{lineValue.toFixed(2)}</div>
                                  <div className="mt-1 flex justify-end gap-1">
                                    {isEditing ? (
                                      <button
                                        type="button"
                                        onClick={() => setEditingReturnId(null)}
                                        className="px-2 py-0.5 text-[10px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                      >
                                        Done
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setEditingReturnId(line.inventory_item_id)}
                                        className="px-2 py-0.5 text-[10px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeReturnLine(line.inventory_item_id)}
                                      className="px-2 py-0.5 text-[10px] rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="px-3 py-2 bg-gray-50 flex justify-between text-xs font-semibold text-gray-700 rounded-b-md">
                            <span>Total Return Value</span>
                            <span>{totalReturnValue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800">Payment Details</h4>
                    <label className="inline-flex items-center text-xs text-gray-600">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-gray-300"
                        checked={addPayment}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAddPayment(checked);
                          if (checked) {
                            setPaymentAmount(invoiceFinalTotal.toFixed(2));
                            setPaymentDate(invoiceDate);
                          }
                        }}
                      />
                      Add payment now
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Record cheque, cash, or bank transfer details together with this invoice.
                  </p>

                  {addPayment && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'check' | 'bank_transfer')}
                            className="w-full rounded-md border border-gray-300 text-black text-sm"
                          >
                            <option value="cash">Cash</option>
                            <option value="check">Cheque</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 text-black text-sm"
                            required={addPayment}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full rounded-md border border-gray-300 text-black text-sm"
                            required={addPayment}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Reference / Cheque No.</label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            className="w-full rounded-md border border-gray-300 text-black text-sm"
                            placeholder={paymentMethod === 'check' ? 'Cheque number' : 'Bank reference no.'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name (optional)</label>
                        <input
                          type="text"
                          value={paymentBankName}
                          onChange={(e) => setPaymentBankName(e.target.value)}
                          className="w-full rounded-md border border-gray-300 text-black text-sm"
                          placeholder="Bank / Branch"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

                <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur pt-3 mt-1 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-3 mb-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Grand Total</span>
                      <span className="text-lg font-semibold text-gray-900">{invoiceFinalTotal.toFixed(2)}</span>
                    </div>
                    <div className="hidden sm:flex flex-col text-xs text-gray-600">
                      <span>Lines: {lines.length}</span>
                      <span>Returns value: {totalReturnValue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetInvoiceForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
                    >
                      {saving ? 'Saving…' : 'Create Invoice'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {qtyWarningOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-11/12 p-4 border border-red-100">
            <h4 className="text-sm font-semibold text-red-700 mb-2">Notice</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{qtyWarningMessage}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setQtyWarningOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && returnInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Return Item - {returnInvoice.invoice_number}</h3>

            <form onSubmit={submitReturn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Item</label>
                  <select
                    value={returnLineId}
                    onChange={(e) => {
                      setReturnLineId(e.target.value);
                      setReturnQty('');
                      setSettlementAmount('');
                    }}
                    className="w-full rounded-md border border-gray-300 text-black"
                    required
                  >
                    <option value="">Select Item</option>
                    {(returnInvoice.items || []).map((line) => (
                      <option key={line.id} value={line.id}>{line.item_code} - {line.item_name} ({Number(line.quantity).toFixed(2)} {line.unit || ''})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    value={returnQty}
                    onChange={(e) => {
                      setReturnQty(e.target.value);
                      if (selectedReturnLine) {
                        const amount = Number(e.target.value || 0) * Number(selectedReturnLine.unit_price || 0);
                        setSettlementAmount(amount > 0 ? amount.toFixed(2) : '');
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Type</label>
                  <select
                    value={settlementType}
                    onChange={(e) => setSettlementType(e.target.value as 'bill_deduction' | 'cash_refund' | 'item_exchange')}
                    className="w-full rounded-md border border-gray-300 text-black"
                  >
                    <option value="bill_deduction">Deduct Bill Amount</option>
                    <option value="cash_refund">Return Cash</option>
                    <option value="item_exchange">Give Items (Exchange)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full rounded-md border border-gray-300 text-black"
                  />
                </div>
              </div>

              {settlementType === 'item_exchange' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Item</label>
                    <select
                      value={exchangeItemId}
                      onChange={(e) => setExchangeItemId(e.target.value)}
                      className="w-full rounded-md border-gray-300 text-black"
                      required
                    >
                      <option value="">Select Exchange Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.code} - {item.name} ({item.current_stock} {item.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Qty</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeQty}
                      onChange={(e) => setExchangeQty(e.target.value)}
                      className="w-full rounded-md border-gray-300 text-black"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full rounded-md border border-gray-300 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full rounded-md border border-gray-300 text-black"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
                Return Amount: <span className="font-semibold">{computedReturnAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnInvoice(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSaving}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {returnSaving ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-11/12 md:w-[640px] max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Invoice {viewInvoice.invoice_number}</h3>
                <p className="text-xs text-gray-500">
                  {viewInvoice.customer?.shop_name || 'Unknown customer'}
                  {viewInvoice.customer?.customer_code ? ` (${viewInvoice.customer.customer_code})` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-500">Invoice Date</div>
                  <div className="font-medium">{new Date(viewInvoice.invoice_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Status</div>
                  <div className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-700">
                    {viewInvoice.status}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">Items</div>
                <div className="divide-y divide-gray-100">
                  {viewInvoice.items.map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const unitPrice = Number(item.unit_price) || 0;
                    const lineTotal = qty * unitPrice;
                    return (
                      <div key={item.id} className="px-3 py-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <div className="font-medium text-gray-800">{item.item_name}</div>
                          <div className="text-gray-500">{item.item_code}</div>
                        </div>
                        <div className="mt-0.5 flex justify-between text-gray-600">
                          <span>
                            {qty.toFixed(2)} x {unitPrice.toFixed(2)}
                          </span>
                          <span className="font-semibold text-gray-900">{lineTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {viewInvoice.items.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">No items recorded on this invoice.</div>
                  )}
                </div>
              </div>

              {(() => {
                const subtotalVal = typeof viewInvoice.subtotal === 'number'
                  ? Number(viewInvoice.subtotal)
                  : viewInvoice.items.reduce(
                      (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
                      0
                    );

                const notesText = String(viewInvoice.notes || '');
                let rawReturnAmount = 0;
                let deductsFromInvoice = false;
                if (notesText.includes('[ITEM RETURNS]')) {
                  const rawLines = notesText.split('\n');
                  for (const raw of rawLines) {
                    const t = raw.trim();
                    if (t.startsWith('Total return value:')) {
                      const numStr = t.split('Total return value:')[1]?.trim() || '';
                      const parsed = parseFloat(numStr.replace(/[^0-9.\-]/g, ''));
                      if (!Number.isNaN(parsed)) rawReturnAmount = parsed;
                    }
                    if (t.includes('Return mode: DEDUCT FROM INVOICE')) {
                      deductsFromInvoice = true;
                    }
                    if (t.includes('Return mode: EXCHANGE ONLY')) {
                      deductsFromInvoice = false;
                    }
                  }
                }

                const effectiveReturnAmount = deductsFromInvoice ? Math.max(0, rawReturnAmount) : 0;
                const rawDiscount = Number(viewInvoice.discount ?? 0);
                const discountVal = Math.max(0, rawDiscount - effectiveReturnAmount);
                const totalVal = Number(viewInvoice.total ?? Math.max(0, subtotalVal - rawDiscount));

                return (
                  <div className="mt-1 space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>{subtotalVal.toFixed(2)}</span>
                    </div>
                    {discountVal > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Discount</span>
                        <span>-{discountVal.toFixed(2)}</span>
                      </div>
                    )}
                    {effectiveReturnAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Returns</span>
                        <span>-{effectiveReturnAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-900 font-semibold border-t border-dashed border-gray-200 pt-1 mt-1">
                      <span>Total</span>
                      <span>{totalVal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {viewInvoice.notes && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Notes</div>
                  <pre className="text-[11px] sm:text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {viewInvoice.notes}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-[11px] text-gray-500">
                Invoice ID: {viewInvoice.id}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewInvoice(null)}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePosPrint(viewInvoice);
                    setViewInvoice(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  POS Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS 80mm thermal receipt print area for Pabasara Sweets */}
      {posPrintInvoice && (
        <div
          ref={posPrintRef}
          className="pos-print-area"
          style={{ position: 'absolute', left: '-9999px', top: 0 }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '80mm',
              padding: '4px 6px',
              boxSizing: 'border-box',
              fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
              fontSize: '11px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Pabasara Sweets</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

            <div style={{ fontSize: '11px', lineHeight: 1.3 }}>
              <div>Invoice: {posPrintInvoice.invoice_number}</div>
              <div>
                Date:{' '}
                {new Date(posPrintInvoice.invoice_date).toLocaleDateString()}{' '}
                {new Date(posPrintInvoice.invoice_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {posPrintInvoice.customer && (
                <div>
                  Customer: {posPrintInvoice.customer.shop_name}
                  {posPrintInvoice.customer.customer_code
                    ? ` (${posPrintInvoice.customer.customer_code})`
                    : ''}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

            <div style={{ fontSize: '10px' }}>
              {posPrintInvoice.items.map((item) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unit_price) || 0;
                const lineTotal = qty * price;
                return (
                  <div key={item.id} style={{ marginBottom: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.item_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {qty.toFixed(2)} x {price.toFixed(2)}
                      </span>
                      <span>{lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

            {(() => {
              const subtotal = Number(
                (posPrintInvoice as any).subtotal ??
                  posPrintInvoice.items.reduce(
                    (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
                    0
                  )
              );

              const notesText = String((posPrintInvoice as any).notes || '');
              let rawReturnAmount = 0;
              let deductsFromInvoice = false;
              if (notesText.includes('[ITEM RETURNS]')) {
                const rawLines = notesText.split('\n');
                for (const raw of rawLines) {
                  const t = raw.trim();
                  if (t.startsWith('Total return value:')) {
                    const numStr = t.split('Total return value:')[1]?.trim() || '';
                    const parsed = parseFloat(numStr.replace(/[^0-9.\-]/g, ''));
                    if (!Number.isNaN(parsed)) rawReturnAmount = parsed;
                  }
                  if (t.includes('Return mode: DEDUCT FROM INVOICE')) {
                    deductsFromInvoice = true;
                  }
                  if (t.includes('Return mode: EXCHANGE ONLY')) {
                    deductsFromInvoice = false;
                  }
                }
              }

              const effectiveReturnAmount = deductsFromInvoice ? Math.max(0, rawReturnAmount) : 0;
              const rawDiscount = Number((posPrintInvoice as any).discount ?? 0);
              const discount = Math.max(0, rawDiscount - effectiveReturnAmount);
              const total = Number(posPrintInvoice.total ?? Math.max(0, subtotal - rawDiscount));

              return (
                <div style={{ fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Discount</span>
                      <span>-{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {effectiveReturnAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Returns</span>
                      <span>-{effectiveReturnAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontWeight: 700 }}>
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const notes = (posPrintInvoice as any).notes as string | undefined;
              if (!notes || !notes.includes('[ITEM RETURNS]')) return null;

              const rawLines = notes.split('\n');
              const returnedItemsIndex = rawLines.findIndex((l) => l.includes('Returned items:'));
              const summaryLines: string[] = [];
              let totalLine: string | null = null;
              let modeLine: string | null = null;

              if (returnedItemsIndex >= 0) {
                for (let i = returnedItemsIndex + 1; i < rawLines.length; i++) {
                  const t = rawLines[i].trim();
                  if (!t) continue;
                  if (t.startsWith('Total return value:')) {
                    totalLine = t;
                    continue;
                  }
                  if (t.startsWith('Return mode:')) {
                    modeLine = t;
                    continue;
                  }
                  if (!t.startsWith('- ')) break;
                  summaryLines.push(t.replace(/^-\s*/, ''));
                }
              }

              if (summaryLines.length === 0 && !totalLine && !modeLine) return null;

              return (
                <>
                  <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
                  <div style={{ fontSize: '9px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '1px' }}>Returns in this bill</div>
                    {summaryLines.slice(0, 3).map((l, idx) => (
                      <div key={idx}>{l}</div>
                    ))}
                    {totalLine && <div>{totalLine}</div>}
                    {modeLine && <div>{modeLine}</div>}
                  </div>
                </>
              );
            })()}

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '2px' }}>
              Thank you! Come again.
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .pos-print-area, .pos-print-area * {
            visibility: visible;
          }
          .pos-print-area {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </div>
  );
}
