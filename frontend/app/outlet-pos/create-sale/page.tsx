'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const COMPANY_PROFILE_ID_KEY = 'company_profile_id';
const LOYALTY_POINT_RATE = 0.01;

const normalizePhone = (value: string): string => String(value || '').replace(/\D+/g, '');
const isLikelyPhone = (value: string): boolean => normalizePhone(value).length >= 7;

const normalizeCompanyLogoUrl = (rawUrl?: string, rawPath?: string): string => {
  const logoPath = String(rawPath || '').trim();
  if (logoPath) {
    return `http://localhost:8000/storage/${logoPath.replace(/^\/+/, '')}`;
  }

  const url = String(rawUrl || '').trim();
  if (!url) return '';

  if (url.startsWith('/storage/')) {
    return `http://localhost:8000${url}`;
  }

  if (url.startsWith('http://localhost/storage/') || url.startsWith('https://localhost/storage/')) {
    return url.replace('http://localhost/storage/', 'http://localhost:8000/storage/')
      .replace('https://localhost/storage/', 'http://localhost:8000/storage/');
  }

  return url;
};

type StockLine = {
  inventory_item_id: number;
  name: string;
  code: string;
  unit: string;
  sell_price: number;
  transferred_qty: number;
  sold_qty: number;
  available_qty: number;
};

type SaleItem = {
  id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type SaleRow = {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name?: string;
  total_quantity: number;
  total_amount: number;
  items: SaleItem[];
};

type CartLine = {
  inventory_item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
};

type OutletProfile = {
  id?: number;
  name?: string;
  code?: string;
};

type CreatedSale = {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name?: string | null;
  notes?: string | null;
  total_quantity: number;
  total_amount: number;
  items?: SaleItem[];
  outlet?: { name?: string; code?: string } | null;
  loyalty_points_awarded?: number;
  loyalty_customer_id?: number | null;
  loyalty_customer?: { id: number; customer_code: string; name: string; phone: string } | null;
};

type LoyaltyCustomer = {
  id: number;
  customer_code: string;
  name: string;
  phone: string;
  email?: string | null;
  points_balance?: number;
  status?: string;
};

type CashierSessionStatus = {
  is_open: boolean;
  is_closed: boolean;
  needs_open: boolean;
  session_date?: string;
};

export default function OutletPosPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outletName, setOutletName] = useState('');
  const [outletCode, setOutletCode] = useState('');
  const [outletId, setOutletId] = useState<number | null>(null);
  const [stocks, setStocks] = useState<StockLine[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState<number>(-1);
  const [selectedQty, setSelectedQty] = useState<string>('1');
  const [selectedPrice, setSelectedPrice] = useState<string>('0');
  const [lastCreatedSale, setLastCreatedSale] = useState<CreatedSale | null>(null);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [selectedLoyaltyCustomerId, setSelectedLoyaltyCustomerId] = useState<number>(0);
  const [showLoyaltySuggestions, setShowLoyaltySuggestions] = useState(false);
  const [creatingLoyaltyFromCustomerPhone, setCreatingLoyaltyFromCustomerPhone] = useState(false);
  const [cashierSession, setCashierSession] = useState<CashierSessionStatus | null>(null);
  const [companyProfileName, setCompanyProfileName] = useState('Company');
  const [companyProfileLogoUrl, setCompanyProfileLogoUrl] = useState('');
  const [companyProfileAddress, setCompanyProfileAddress] = useState('');
  const [companyProfilePhone, setCompanyProfilePhone] = useState('');
  const [companyProfileEmail, setCompanyProfileEmail] = useState('');
  const [companyProfileWebsite, setCompanyProfileWebsite] = useState('');
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const params = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const formInputClass =
    'w-full rounded-xl border border-rose-100 bg-white/95 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none';
  const formInputClassCompact =
    'w-full rounded-xl border border-rose-100 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none';

  const getNextPath = () => {
    const outletCode = params.get('outlet_code') || '';
    return `/outlet-pos/create-sale${outletCode ? `?outlet_code=${encodeURIComponent(outletCode)}` : ''}`;
  };

  const authHeaders = (authToken: string) => ({ Authorization: `Bearer ${authToken}` });

  const redirectToLoginWithNext = () => {
    localStorage.removeItem('token');
    router.push(`/?next=${encodeURIComponent(getNextPath())}`);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const invalidStoredToken = !storedToken || storedToken === 'undefined' || storedToken === 'null';

    if (invalidStoredToken) {
      router.push(`/?next=${encodeURIComponent(getNextPath())}`);
      return;
    }
    setToken(storedToken);
  }, [router, params]);

  const fetchOutletStock = async (authToken: string): Promise<{ ok: boolean; profile?: OutletProfile }> => {
    const res = await axios.get(`${API_URL}/api/outlet-pos/me`, {
      headers: authHeaders(authToken),
      validateStatus: () => true,
    });

    if (res.status === 401) {
      redirectToLoginWithNext();
      return { ok: false };
    }

    if (res.status >= 400) {
      setMessage(res.data?.message || 'Failed to load outlet profile.');
      return { ok: false };
    }

    const payload = res.data?.data;
    const outlet = payload?.outlet;

    if (!outlet) {
      redirectToLoginWithNext();
      return { ok: false };
    }

    setStocks((payload?.stocks || []).filter((line: StockLine) => Number(line.available_qty) > 0));

    const expectedCode = (params.get('outlet_code') || '').trim();
    if (expectedCode && outlet.code && expectedCode.toLowerCase() !== String(outlet.code).toLowerCase()) {
      setMessage(`Link was for outlet ${expectedCode}, but you are logged in to ${outlet.code}.`);
    }

    return { ok: true, profile: { id: outlet.id, name: outlet.name, code: outlet.code } };
  };

  const fetchOutletSales = async (authToken: string): Promise<boolean> => {
    const res = await axios.get(`${API_URL}/api/outlet-pos/sales`, {
      headers: authHeaders(authToken),
      params: { per_page: 10 },
      validateStatus: () => true,
    });

    if (res.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (res.status >= 400) {
      setMessage(res.data?.message || 'Failed to load outlet sales.');
      setSales([]);
      return false;
    }

    const rows = res.data?.data?.data || [];
    setSales(rows);
    return true;
  };

  const fetchLoyaltyCustomers = async (authToken: string, outletIdValue: number): Promise<boolean> => {
    const res = await axios.get(`${API_URL}/api/outlet-pos/loyalty-customers`, {
      headers: authHeaders(authToken),
      params: { outlet_id: outletIdValue, per_page: 200 },
      validateStatus: () => true,
    });

    if (res.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (res.status >= 400) {
      setLoyaltyCustomers([]);
      return false;
    }

    const rows = res.data?.data?.data || [];
    setLoyaltyCustomers(Array.isArray(rows) ? rows : []);
    return true;
  };

  const refreshOutletData = async (authToken: string): Promise<boolean> => {
    const stockResult = await fetchOutletStock(authToken);
    if (!stockResult.ok) return false;

    setOutletName(stockResult.profile?.name || 'Outlet');
    setOutletCode(stockResult.profile?.code || '-');
    const outletIdValue = stockResult.profile?.id || null;
    setOutletId(outletIdValue);

    const statusRes = await axios.get(`${API_URL}/api/outlet-pos/cash-drawer-status`, {
      headers: authHeaders(authToken),
      validateStatus: () => true,
    });

    if (statusRes.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (statusRes.status < 400) {
      setCashierSession(statusRes.data?.data?.session || null);
    }

    if (outletIdValue) {
      await fetchLoyaltyCustomers(authToken, outletIdValue);
    }

    const salesOk = await fetchOutletSales(authToken);
    return salesOk;
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        await refreshOutletData(token);
      } catch (error: any) {
        console.error('Error loading outlet POS:', error);
        const serverMessage = error?.response?.data?.message || 'Failed to load outlet POS.';
        setMessage(serverMessage);
        if (error?.response?.status === 401) {
          redirectToLoginWithNext();
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, API_URL, router, params]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('company_profile_data');
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        name?: string;
        logo_url?: string;
        logo_path?: string;
        address?: string;
        phone?: string;
        email?: string;
        website?: string;
      };

      const name = String(parsed?.name || '').trim();
      if (name) {
        setCompanyProfileName(name);
      }

      setCompanyProfileAddress(String(parsed?.address || '').trim());
      setCompanyProfilePhone(String(parsed?.phone || '').trim());
      setCompanyProfileEmail(String(parsed?.email || '').trim());
      setCompanyProfileWebsite(String(parsed?.website || '').trim());

      const normalizedLogoUrl = normalizeCompanyLogoUrl(parsed?.logo_url, parsed?.logo_path);
      if (normalizedLogoUrl) {
        setCompanyProfileLogoUrl(normalizedLogoUrl);
      }
    } catch (error) {
      console.error('Failed to load company profile for bill header:', error);
    }
  }, []);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const hydrateCompanyHeader = async () => {
      try {
        const profileId = Number(window.localStorage.getItem(COMPANY_PROFILE_ID_KEY) || 0);
        if (profileId <= 0) return;

        const res = await axios.get(`http://localhost:8000/api/companies/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const company = (res?.data || {}) as {
          name?: string;
          logo_url?: string;
          logo_path?: string;
          address?: string;
          phone?: string;
          email?: string;
          website?: string;
        };

        const latestName = String(company?.name || '').trim();
        if (latestName) {
          setCompanyProfileName(latestName);
        }

        const latestLogoUrl = normalizeCompanyLogoUrl(company?.logo_url, company?.logo_path);
        setCompanyProfileLogoUrl(latestLogoUrl);
        setCompanyProfileAddress(String(company?.address || '').trim());
        setCompanyProfilePhone(String(company?.phone || '').trim());
        setCompanyProfileEmail(String(company?.email || '').trim());
        setCompanyProfileWebsite(String(company?.website || '').trim());

        const currentRaw = window.localStorage.getItem('company_profile_data');
        const current = currentRaw ? JSON.parse(currentRaw) : {};
        const merged = {
          ...current,
          ...company,
          logo_url: latestLogoUrl,
        };
        window.localStorage.setItem('company_profile_data', JSON.stringify(merged));
      } catch (error) {
        console.error('Failed to refresh company profile for bill header:', error);
      }
    };

    hydrateCompanyHeader();
  }, [token]);

  const stockTotals = useMemo(() => {
    const totalItems = stocks.length;
    const totalAvailableQty = stocks.reduce((sum, line) => sum + Number(line.available_qty || 0), 0);
    return { totalItems, totalAvailableQty };
  }, [stocks]);

  const salesTotals = useMemo(() => {
    const totalSales = sales.length;
    const totalQty = sales.reduce((sum, sale) => sum + Number(sale.total_quantity || 0), 0);
    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    return { totalSales, totalQty, totalAmount };
  }, [sales]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0);
  }, [cart]);

  const filteredStocks = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    if (!term) return stocks.slice(0, 12);

    return stocks
      .filter((line) => {
        const text = `${line.code} ${line.name} ${line.unit}`.toLowerCase();
        return text.includes(term);
      })
      .slice(0, 12);
  }, [stocks, itemSearch]);

  const filteredLoyaltyCustomers = useMemo(() => {
    const term = loyaltySearch.trim().toLowerCase();
    if (!term) return loyaltyCustomers.slice(0, 12);

    return loyaltyCustomers
      .filter((c) => `${c.customer_code} ${c.name} ${c.phone} ${c.email || ''}`.toLowerCase().includes(term))
      .slice(0, 12);
  }, [loyaltyCustomers, loyaltySearch]);

  const matchedLoyaltyByCustomerPhone = useMemo(() => {
    if (!isLikelyPhone(customerName)) return null;
    const phoneDigits = normalizePhone(customerName);
    return loyaltyCustomers.find((c) => normalizePhone(c.phone) === phoneDigits) || null;
  }, [customerName, loyaltyCustomers]);

  const selectedLoyaltyCustomer = useMemo(() => {
    return loyaltyCustomers.find((c) => c.id === selectedLoyaltyCustomerId) || null;
  }, [loyaltyCustomers, selectedLoyaltyCustomerId]);

  const loyaltyPointsPreview = useMemo(() => {
    if (!selectedLoyaltyCustomerId) return 0;
    return Number((cartTotal * LOYALTY_POINT_RATE).toFixed(2));
  }, [cartTotal, selectedLoyaltyCustomerId]);

  const canQuickCreateLoyaltyFromCustomerPhone = useMemo(() => {
    return Boolean(
      token &&
      outletId &&
      customerName.trim() &&
      isLikelyPhone(customerName) &&
      !matchedLoyaltyByCustomerPhone
    );
  }, [token, outletId, customerName, matchedLoyaltyByCustomerPhone]);

  useEffect(() => {
    const raw = customerName.trim();
    if (!raw) {
      if (selectedLoyaltyCustomerId !== 0) {
        setSelectedLoyaltyCustomerId(0);
      }
      return;
    }

    if (!isLikelyPhone(raw)) return;
    if (!matchedLoyaltyByCustomerPhone) return;

    if (selectedLoyaltyCustomerId !== matchedLoyaltyByCustomerPhone.id) {
      setSelectedLoyaltyCustomerId(matchedLoyaltyByCustomerPhone.id);
      setLoyaltySearch(`${matchedLoyaltyByCustomerPhone.customer_code} - ${matchedLoyaltyByCustomerPhone.name}`);
    }
  }, [customerName, matchedLoyaltyByCustomerPhone, selectedLoyaltyCustomerId]);

  useEffect(() => {
    if (!showItemSuggestions) {
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (filteredStocks.length === 0) {
      setHighlightedSuggestionIndex(-1);
      return;
    }

    setHighlightedSuggestionIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredStocks.length) return filteredStocks.length - 1;
      return prev;
    });
  }, [filteredStocks, showItemSuggestions]);

  const selectStockItem = (line: StockLine) => {
    setSelectedItemId(line.inventory_item_id);
    setItemSearch(`${line.code} - ${line.name}`);
    setSelectedPrice(Number(line.sell_price || 0).toFixed(2));
    setShowItemSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setTimeout(() => qtyInputRef.current?.focus(), 0);
  };

  const handleItemSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showItemSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (filteredStocks.length > 0) {
        setShowItemSuggestions(true);
        setHighlightedSuggestionIndex(0);
      }
      e.preventDefault();
      return;
    }

    if (!showItemSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredStocks.length === 0) return;
      setHighlightedSuggestionIndex((prev) => {
        const next = prev + 1;
        return next >= filteredStocks.length ? 0 : next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredStocks.length === 0) return;
      setHighlightedSuggestionIndex((prev) => {
        const next = prev <= 0 ? filteredStocks.length - 1 : prev - 1;
        return next;
      });
      return;
    }

    if (e.key === 'Enter') {
      if (filteredStocks.length > 0) {
        e.preventDefault();
        const idx = highlightedSuggestionIndex >= 0 ? highlightedSuggestionIndex : 0;
        const item = filteredStocks[idx];
        if (item) {
          selectStockItem(item);
        }
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowItemSuggestions(false);
      setHighlightedSuggestionIndex(-1);
    }
  };

  const addToCart = () => {
    const stockLine = stocks.find((s) => s.inventory_item_id === selectedItemId);
    if (!stockLine) {
      alert('Please select an item.');
      return;
    }

    const qty = Number(selectedQty || 0);
    const price = Number(selectedPrice || 0);

    if (qty <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    if (qty > Number(stockLine.available_qty || 0)) {
      alert('Quantity exceeds available stock.');
      return;
    }

    const existing = cart.find((c) => c.inventory_item_id === stockLine.inventory_item_id);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > Number(stockLine.available_qty || 0)) {
        alert('Combined quantity exceeds available stock.');
        return;
      }

      setCart((prev) =>
        prev.map((line) =>
          line.inventory_item_id === stockLine.inventory_item_id
            ? { ...line, quantity: newQty, unit_price: price > 0 ? price : line.unit_price }
            : line
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          inventory_item_id: stockLine.inventory_item_id,
          item_code: stockLine.code,
          item_name: stockLine.name,
          unit: stockLine.unit,
          quantity: qty,
          unit_price: price,
        },
      ]);
    }

    setSelectedQty('1');
    setSelectedPrice('0');
  };

  const removeFromCart = (inventoryItemId: number) => {
    setCart((prev) => prev.filter((line) => line.inventory_item_id !== inventoryItemId));
  };

  const selectLoyaltyCustomer = (customer: LoyaltyCustomer) => {
    setSelectedLoyaltyCustomerId(customer.id);
    setLoyaltySearch(`${customer.customer_code} - ${customer.name}`);
    setShowLoyaltySuggestions(false);
    if (!customerName.trim()) {
      setCustomerName(customer.name);
    }
  };

  const clearLoyaltyCustomer = () => {
    setSelectedLoyaltyCustomerId(0);
    setLoyaltySearch('');
  };

  const quickCreateLoyaltyFromCustomerPhone = async () => {
    if (!token || !outletId) return;

    const rawInput = customerName.trim();
    const phone = normalizePhone(rawInput);
    if (phone.length < 7) {
      alert('Enter a valid phone number in Customer Name field.');
      return;
    }

    const hasLetters = /[A-Za-z]/.test(rawInput);
    const loyaltyName = hasLetters ? rawInput : `Customer ${phone}`;

    try {
      setCreatingLoyaltyFromCustomerPhone(true);

      const res = await axios.post(
        `${API_URL}/api/outlet-pos/loyalty-customers`,
        {
          outlet_id: outletId,
          name: loyaltyName,
          phone,
        },
        { headers: authHeaders(token), validateStatus: () => true }
      );

      if (res.status === 401) {
        redirectToLoginWithNext();
        return;
      }

      if (res.status >= 400) {
        const apiMessage = res.data?.message || 'Failed to create loyalty customer.';
        const validationErrors = (res.data?.errors || {}) as Record<string, string[]>;
        const firstError = Object.values(validationErrors)?.[0]?.[0];
        alert(firstError || apiMessage);
        return;
      }

      const created = res.data?.data as LoyaltyCustomer | undefined;
      if (created?.id) {
        setLoyaltyCustomers((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        setSelectedLoyaltyCustomerId(created.id);
        setLoyaltySearch(`${created.customer_code} - ${created.name}`);
        setMessage(`Loyalty customer created for phone ${created.phone}.`);
      }
    } catch (error) {
      console.error('Failed to create loyalty customer from customer field phone:', error);
      alert('Failed to create loyalty customer.');
    } finally {
      setCreatingLoyaltyFromCustomerPhone(false);
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const printCustomerBill = (sale: CreatedSale) => {
    const printWindow = window.open('', '_blank', 'width=420,height=760');
    if (!printWindow) {
      alert('Unable to open print window. Please allow popups.');
      return;
    }

    const lines = Array.isArray(sale.items) ? sale.items : [];
    const lineRows = lines
      .map((line) => {
        const qty = Number(line.quantity || 0).toFixed(2);
        const price = Number(line.unit_price || 0).toFixed(2);
        const total = Number(line.line_total || Number(line.quantity || 0) * Number(line.unit_price || 0)).toFixed(2);
        return `
          <tr>
            <td>${escapeHtml(`${line.item_code || '-'} - ${line.item_name || '-'}`)}</td>
            <td style="text-align:right;">${qty}</td>
            <td style="text-align:right;">${price}</td>
            <td style="text-align:right;">${total}</td>
          </tr>
        `;
      })
      .join('');

    const saleDate = sale.sale_date ? new Date(sale.sale_date).toLocaleString() : new Date().toLocaleString();
    const customer = sale.customer_name?.trim() ? sale.customer_name : 'Walk-in Customer';
    const outletDisplay = `${sale.outlet?.name || outletName || 'Outlet'} (${sale.outlet?.code || outletCode || '-'})`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${escapeHtml(sale.sale_number || '')}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              margin: 0;
              padding: 8px;
              color: #111;
              font-size: 11px;
            }
            .receipt { width: 80mm; min-width: 80mm; max-width: 80mm; margin: 0 auto; }
            .center { text-align: center; }
            .logo-wrap { margin-bottom: 4px; }
            .logo-wrap img { max-width: 26mm; max-height: 16mm; object-fit: contain; display: block; margin: 0 auto; }
            h2 { margin: 0; font-size: 14px; }
            .muted { font-size: 10px; line-height: 1.25; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .meta { margin: 1px 0; font-size: 11px; line-height: 1.25; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; }
            th, td { border-bottom: 1px dashed #999; padding: 4px 2px; vertical-align: top; font-size: 10px; }
            th { text-align: left; }
            .totals { margin-top: 6px; }
            .totals p { margin: 3px 0; display: flex; justify-content: space-between; font-size: 11px; }
            .strong { font-weight: 700; }
            .note { margin-top: 6px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center">
              ${companyProfileLogoUrl ? `<div class="logo-wrap"><img src="${escapeHtml(companyProfileLogoUrl)}" alt="Company logo" /></div>` : ''}
              <h2>${escapeHtml(companyProfileName || 'Company')}</h2>
              ${companyProfileAddress ? `<div class="muted">${escapeHtml(companyProfileAddress)}</div>` : ''}
              ${companyProfilePhone ? `<div class="muted">Tel: ${escapeHtml(companyProfilePhone)}</div>` : ''}
              ${companyProfileEmail ? `<div class="muted">${escapeHtml(companyProfileEmail)}</div>` : ''}
              ${companyProfileWebsite ? `<div class="muted">${escapeHtml(companyProfileWebsite)}</div>` : ''}
            </div>

            <div class="line"></div>

            <p class="meta"><strong>Outlet:</strong> ${escapeHtml(outletDisplay)}</p>
            <p class="meta"><strong>Bill #:</strong> ${escapeHtml(sale.sale_number || '-')}</p>
            <p class="meta"><strong>Date:</strong> ${escapeHtml(saleDate)}</p>
            <p class="meta"><strong>Customer:</strong> ${escapeHtml(customer)}</p>

            <div class="line"></div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:right;">Qty</th>
                  <th style="text-align:right;">Price</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${lineRows || '<tr><td colspan="4">No line items</td></tr>'}
              </tbody>
            </table>

            <div class="line"></div>

            <div class="totals">
              <p><span>Total Qty</span><span>${Number(sale.total_quantity || 0).toFixed(2)}</span></p>
              <p class="strong"><span>Grand Total</span><span>${Number(sale.total_amount || 0).toFixed(2)}</span></p>
            </div>

            <p class="note"><strong>Notes:</strong> ${escapeHtml((sale.notes || '').trim() || '-')}</p>
            <p class="center" style="margin-top:10px;">Thank you for your purchase</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const submitSale = async () => {
    if (!cashierSession?.is_open) {
      alert('Cashier is not open. Please open cash drawer first.');
      router.push(`/outlet-pos/cash-drawer${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`);
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${API_URL}/api/outlet-pos/sales`,
        {
          outlet_id: outletId,
          sale_date: saleDate || null,
          customer_name: customerName || null,
          loyalty_customer_id: selectedLoyaltyCustomerId || null,
          notes: notes || null,
          items: cart.map((line) => ({
            inventory_item_id: line.inventory_item_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdSale = response.data?.data as CreatedSale | undefined;

      setCart([]);
      setCustomerName('');
      setSaleDate(new Date().toISOString().slice(0, 16));
      setNotes('');
      setSelectedLoyaltyCustomerId(0);
      setLoyaltySearch('');
      const awarded = Number(createdSale?.loyalty_points_awarded || 0);
      setMessage(awarded > 0
        ? `Sale recorded successfully. ${awarded.toFixed(2)} loyalty points awarded.`
        : 'Sale recorded successfully. Bill is ready to print.');
      if (createdSale) {
        setLastCreatedSale(createdSale);
        setTimeout(() => printCustomerBill(createdSale), 120);
      }
      await refreshOutletData(token);
    } catch (error: any) {
      console.error('Error recording sale:', error);
      const apiMessage = error?.response?.data?.message || 'Failed to record sale';
      const validationErrors = (error?.response?.data?.errors || {}) as Record<string, string[]>;
      const firstError = Object.values(validationErrors)?.[0]?.[0];
      alert(firstError || apiMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    if (cashierSession?.is_open) {
      alert('Cashier is still open. Please close cash drawer before logout.');
      router.push(`/outlet-pos/cash-drawer${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`);
      return;
    }

    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Outlet POS - Create Sale</h1>
                <p className="text-xs text-gray-600">{outletName} ({outletCode})</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={`/outlet-pos${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/outlet-pos/stock${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  Stock
                </Link>
                <Link
                  href={`/outlet-pos/sales${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                >
                  Sales
                </Link>
                <Link
                  href={`/outlet-pos/cash-drawer${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  Cash Drawer
                </Link>
                <Link
                  href={`/outlet-pos/loyalty-customers${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Loyalty
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-sm font-medium hover:from-rose-600 hover:to-pink-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {message && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</div>
        )}

        {!cashierSession?.is_open && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-amber-800">Cashier Not Open</h2>
            <p className="text-sm text-amber-700 mt-1">You must open cash drawer before creating sales for the day.</p>
            <div className="mt-3">
              <Link
                href={`/outlet-pos/cash-drawer${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                className="inline-flex px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-teal-700"
              >
                Open Cash Drawer
              </Link>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Items In Store</div>
            <div className="text-2xl font-bold text-gray-900">{stockTotals.totalItems}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Available Qty</div>
            <div className="text-2xl font-bold text-gray-900">{stockTotals.totalAvailableQty.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Recent Sales</div>
            <div className="text-2xl font-bold text-gray-900">{salesTotals.totalSales}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Recent Sales Amount</div>
            <div className="text-2xl font-bold text-gray-900">{salesTotals.totalAmount.toFixed(2)}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Sales Moved</h2>
              <p className="text-sm text-gray-600">View, filter, and review sales from the dedicated page.</p>
            </div>
            <Link
              href={`/outlet-pos/sales${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-md text-sm font-medium hover:from-pink-600 hover:to-rose-600"
            >
              Open Recent Sales
            </Link>
            <Link
              href={`/outlet-pos/cash-drawer${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
              className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100"
            >
              Cash Drawer
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Sale</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name or Phone</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={formInputClass}
                  placeholder="Leave empty for walk-in, or type phone for loyalty"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {!customerName.trim() && (
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-gray-600">
                      Walk-in customer will be used automatically.
                    </span>
                  )}
                  {matchedLoyaltyByCustomerPhone && (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                      Phone matched loyalty: {matchedLoyaltyByCustomerPhone.customer_code} - {matchedLoyaltyByCustomerPhone.name}
                    </span>
                  )}
                  {canQuickCreateLoyaltyFromCustomerPhone && (
                    <button
                      type="button"
                      onClick={quickCreateLoyaltyFromCustomerPhone}
                      disabled={creatingLoyaltyFromCustomerPhone}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {creatingLoyaltyFromCustomerPhone ? 'Adding loyalty...' : 'Add loyalty with this phone'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date & Time</label>
                <input
                  type="datetime-local"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className={formInputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Customer (Optional Manual Search)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={loyaltySearch}
                    onChange={(e) => {
                      setLoyaltySearch(e.target.value);
                      setShowLoyaltySuggestions(true);
                      setSelectedLoyaltyCustomerId(0);
                    }}
                    onFocus={() => setShowLoyaltySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLoyaltySuggestions(false), 120)}
                    placeholder="Search loyalty by code, name or phone"
                    className={formInputClass}
                  />
                  {showLoyaltySuggestions && (
                    <div className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-xl border border-rose-100 bg-white shadow-xl">
                      {filteredLoyaltyCustomers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No loyalty customers found.</div>
                      ) : (
                        filteredLoyaltyCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectLoyaltyCustomer(customer)}
                            className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm text-gray-900 font-medium">{customer.customer_code} - {customer.name}</div>
                            <div className="text-xs text-gray-600">{customer.phone} | Points: {Number(customer.points_balance || 0).toFixed(2)}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedLoyaltyCustomer && (
                  <div className="mt-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <span>
                      Selected: {selectedLoyaltyCustomer.customer_code} - {selectedLoyaltyCustomer.name} | Current Points: {Number(selectedLoyaltyCustomer.points_balance || 0).toFixed(2)}
                    </span>
                    <button type="button" onClick={clearLoyaltyCustomer} className="font-semibold hover:underline">Clear</button>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={formInputClass}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <div className="relative">
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowItemSuggestions(true);
                      setHighlightedSuggestionIndex(0);
                      setSelectedItemId(0);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowItemSuggestions(false), 120);
                    }}
                    onKeyDown={handleItemSearchKeyDown}
                    placeholder="Type code or item name"
                    className={formInputClassCompact}
                  />

                  {showItemSuggestions && (
                    <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-rose-100 bg-white shadow-xl">
                      {filteredStocks.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No matching items.</div>
                      ) : (
                        filteredStocks.map((line) => (
                          <button
                            key={line.inventory_item_id}
                            type="button"
                            onClick={() => selectStockItem(line)}
                            className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                              filteredStocks[highlightedSuggestionIndex]?.inventory_item_id === line.inventory_item_id
                                ? 'bg-rose-100'
                                : 'hover:bg-rose-50'
                            }`}
                          >
                            <div className="text-sm text-gray-900 font-medium">{line.code} - {line.name}</div>
                            <div className="text-xs text-gray-600">
                              Avail: {Number(line.available_qty).toFixed(2)} | Sell: {Number(line.sell_price || 0).toFixed(2)}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  className={formInputClassCompact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className={formInputClassCompact}
                />
              </div>
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={addToCart}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-sm font-medium hover:from-rose-600 hover:to-pink-600"
              >
                Add to Cart
              </button>
            </div>

          </section>

          <section id="stock-section" className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5 scroll-mt-24">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cart Summary</h2>
              <Link
                href={`/outlet-pos/stock${params.get('outlet_code') ? `?outlet_code=${encodeURIComponent(params.get('outlet_code') || '')}` : ''}`}
                className="px-3 py-1.5 text-xs rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                View Stock Page
              </Link>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No items in cart.</td>
                    </tr>
                  ) : (
                    cart.map((line) => (
                      <tr key={line.inventory_item_id}>
                        <td className="px-4 py-2 text-sm text-gray-800">{line.item_code} - {line.item_name}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-700">{line.quantity.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-700">{line.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{(line.quantity * line.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeFromCart(line.inventory_item_id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">Total: {cartTotal.toFixed(2)}</div>
                {selectedLoyaltyCustomerId > 0 && (
                  <div className="text-xs text-amber-700 font-medium">Loyalty points to award: {loyaltyPointsPreview.toFixed(2)}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastCreatedSale && (
                  <button
                    type="button"
                    onClick={() => printCustomerBill(lastCreatedSale)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-teal-700"
                  >
                    Print Last Bill
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving || cart.length === 0 || !cashierSession?.is_open}
                  onClick={submitSale}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
