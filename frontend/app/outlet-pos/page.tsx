'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

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

type SaleRow = {
  id: number;
  sale_number: string;
  sale_date: string;
  customer_name?: string;
  total_quantity: number;
  total_amount: number;
};

type CashierSessionStatus = {
  is_open: boolean;
  is_closed: boolean;
  needs_open: boolean;
  session_date?: string;
};

export default function OutletPosDashboardPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [outletName, setOutletName] = useState('');
  const [outletCode, setOutletCode] = useState('');
  const [stocks, setStocks] = useState<StockLine[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [cashierSession, setCashierSession] = useState<CashierSessionStatus | null>(null);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const params = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const getPathWithCode = (path: string) => {
    const outletCode = params.get('outlet_code') || '';
    return `${path}${outletCode ? `?outlet_code=${encodeURIComponent(outletCode)}` : ''}`;
  };

  const authHeaders = (authToken: string) => ({ Authorization: `Bearer ${authToken}` });

  const redirectToLoginWithNext = () => {
    localStorage.removeItem('token');
    router.push(`/?next=${encodeURIComponent(getPathWithCode('/outlet-pos'))}`);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const invalidStoredToken = !storedToken || storedToken === 'undefined' || storedToken === 'null';

    if (invalidStoredToken) {
      router.push(`/?next=${encodeURIComponent(getPathWithCode('/outlet-pos'))}`);
      return;
    }

    setToken(storedToken);
  }, [router, params]);

  const loadData = async (authToken: string) => {
    const profileRes = await axios.get(`${API_URL}/api/outlet-pos/me`, {
      headers: authHeaders(authToken),
      validateStatus: () => true,
    });

    if (profileRes.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (profileRes.status >= 400) {
      setMessage(profileRes.data?.message || 'Failed to load outlet profile.');
      return false;
    }

    const payload = profileRes.data?.data;
    const outlet = payload?.outlet;

    if (!outlet) {
      redirectToLoginWithNext();
      return false;
    }

    setOutletName(outlet.name || 'Outlet');
    setOutletCode(outlet.code || '-');
    setStocks((payload?.stocks || []).filter((line: StockLine) => Number(line.available_qty) > 0));

    const sessionRes = await axios.get(`${API_URL}/api/outlet-pos/cash-drawer-status`, {
      headers: authHeaders(authToken),
      validateStatus: () => true,
    });

    if (sessionRes.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (sessionRes.status < 400) {
      setCashierSession(sessionRes.data?.data?.session || null);
    }

    const salesRes = await axios.get(`${API_URL}/api/outlet-pos/sales`, {
      headers: authHeaders(authToken),
      params: { per_page: 100 },
      validateStatus: () => true,
    });

    if (salesRes.status === 401) {
      redirectToLoginWithNext();
      return false;
    }

    if (salesRes.status >= 400) {
      setMessage(salesRes.data?.message || 'Failed to load outlet sales.');
      setSales([]);
      return false;
    }

    setSales(salesRes.data?.data?.data || []);
    return true;
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        setMessage('');
        await loadData(token);
      } catch (error: any) {
        console.error('Error loading outlet dashboard:', error);
        setMessage(error?.response?.data?.message || 'Failed to load outlet dashboard.');
        if (error?.response?.status === 401) {
          redirectToLoginWithNext();
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, API_URL, params, router]);

  const stockTotals = useMemo(() => {
    const totalItems = stocks.length;
    const totalAvailableQty = stocks.reduce((sum, line) => sum + Number(line.available_qty || 0), 0);
    return { totalItems, totalAvailableQty };
  }, [stocks]);

  const handleLogout = () => {
    if (cashierSession?.is_open) {
      alert('Cashier is still open. Please close cash drawer before logout.');
      router.push(getPathWithCode('/outlet-pos/cash-drawer'));
      return;
    }

    localStorage.removeItem('token');
    router.push('/');
  };

  const salesTotals = useMemo(() => {
    const totalSales = sales.length;
    const totalQty = sales.reduce((sum, sale) => sum + Number(sale.total_quantity || 0), 0);
    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    return { totalSales, totalQty, totalAmount };
  }, [sales]);

  const salesByDay = useMemo(() => {
    const map = new Map<string, number>();

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }

    sales.forEach((sale) => {
      const key = String(sale.sale_date || '').slice(0, 10);
      if (map.has(key)) {
        map.set(key, Number(map.get(key) || 0) + Number(sale.total_amount || 0));
      }
    });

    const max = Math.max(...Array.from(map.values()), 1);
    return Array.from(map.entries()).map(([date, amount]) => ({
      date,
      label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      amount,
      heightPct: Math.max(8, Math.round((amount / max) * 100)),
    }));
  }, [sales]);

  const topStocks = useMemo(() => {
    const top = [...stocks]
      .sort((a, b) => Number(b.available_qty || 0) - Number(a.available_qty || 0))
      .slice(0, 6);

    const max = Math.max(...top.map((line) => Number(line.available_qty || 0)), 1);

    return top.map((line) => ({
      ...line,
      widthPct: Math.max(10, Math.round((Number(line.available_qty || 0) / max) * 100)),
    }));
  }, [stocks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      </div>

      <nav className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Outlet POS Dashboard</h1>
                <p className="text-xs text-gray-600">{outletName} ({outletCode})</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={getPathWithCode('/outlet-pos/create-sale')}
                  className="px-3 py-1.5 text-sm rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  Create Sale
                </Link>
                <Link
                  href={getPathWithCode('/outlet-pos/sales')}
                  className="px-3 py-1.5 text-sm rounded-md border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                >
                  Sales Records
                </Link>
                <Link
                  href={getPathWithCode('/outlet-pos/cash-drawer')}
                  className="px-3 py-1.5 text-sm rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  Cash Drawer
                </Link>
                <Link
                  href={getPathWithCode('/outlet-pos/stock')}
                  className="px-3 py-1.5 text-sm rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  Stock
                </Link>
                <Link
                  href={getPathWithCode('/outlet-pos/loyalty-customers')}
                  className="px-3 py-1.5 text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Loyalty Customers
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

        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Use this dashboard for monitoring and jump into cashier flow when needed.</p>
              <p className={`text-xs mt-1 ${cashierSession?.is_open ? 'text-emerald-700' : 'text-amber-700'}`}>
                Cashier: {cashierSession?.is_open ? 'Open' : 'Not Open'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={getPathWithCode('/outlet-pos/create-sale')}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-sm font-medium hover:from-rose-600 hover:to-pink-600"
              >
                Go To Create Sale
              </Link>
              <Link
                href={getPathWithCode('/outlet-pos/sales')}
                className="px-4 py-2 border border-pink-200 bg-pink-50 text-pink-700 rounded-md text-sm font-medium hover:bg-pink-100"
              >
                Open Sales Records
              </Link>
              <Link
                href={getPathWithCode('/outlet-pos/cash-drawer')}
                className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100"
              >
                Set Cash Drawer
              </Link>
              <Link
                href={getPathWithCode('/outlet-pos/stock')}
                className="px-4 py-2 border border-rose-200 bg-rose-50 text-rose-700 rounded-md text-sm font-medium hover:bg-rose-100"
              >
                View Stock
              </Link>
              <Link
                href={getPathWithCode('/outlet-pos/loyalty-customers')}
                className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-md text-sm font-medium hover:bg-amber-100"
              >
                Loyalty Customers
              </Link>
            </div>
          </div>
        </section>

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

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Sales Trend (Last 7 Days)</h3>
            <p className="text-sm text-gray-600 mb-4">Based on loaded POS sales amounts.</p>
            <div className="h-48 rounded-xl bg-gradient-to-b from-pink-50 to-rose-50 border border-pink-100 px-3 py-4">
              <div className="h-full flex items-end justify-between gap-2">
                {salesByDay.map((point) => (
                  <div key={point.date} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                    <div className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-md" style={{ height: `${point.heightPct}%` }}></div>
                    <div className="text-[11px] text-gray-600">{point.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Available Stock</h3>
            <p className="text-sm text-gray-600 mb-4">Highest available quantities at this outlet.</p>
            <div className="space-y-3">
              {topStocks.length === 0 ? (
                <div className="text-sm text-gray-500">No available stock for this outlet.</div>
              ) : (
                topStocks.map((line) => (
                  <div key={line.inventory_item_id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium">{line.code} - {line.name}</span>
                      <span className="text-rose-700 font-semibold">{Number(line.available_qty).toFixed(2)} {line.unit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-rose-100">
                      <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${line.widthPct}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-lg shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Sales Snapshot</h3>
            <Link
              href={getPathWithCode('/outlet-pos/sales')}
              className="text-sm text-pink-700 hover:text-pink-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
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
                {sales.slice(0, 8).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No sales found.</td>
                  </tr>
                ) : (
                  sales.slice(0, 8).map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 text-sm text-gray-800">{sale.sale_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(sale.sale_date).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{sale.customer_name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700">{Number(sale.total_quantity).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900 font-semibold">{Number(sale.total_amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
