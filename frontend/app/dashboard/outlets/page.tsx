'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Outlet {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

interface OutletStockLine {
  inventory_item_id: number;
  name: string;
  code: string;
  unit: string;
  available_quantity: number;
}

export default function OutletsPage() {
  const [token, setToken] = useState('');
  const [outletCount, setOutletCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [stockLines, setStockLines] = useState<OutletStockLine[]>([]);
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
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/outlets', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 100 }
      });

      const outlets = response.data.success ? (response.data.data.data || response.data.data || []) : [];
      setOutlets(outlets);
      setOutletCount(outlets.length);
      setActiveCount(outlets.filter((outlet: any) => outlet.status === 'active').length);
    } catch (error) {
      console.error('Error fetching outlet stats:', error);
      setOutlets([]);
      setOutletCount(0);
      setActiveCount(0);
    }
  };

  const openStockReport = async (outlet: Outlet) => {
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
      console.error('Error fetching outlet stock report:', error);
      setStockLines([]);
    } finally {
      setStockLoading(false);
    }
  };

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
                <h1 className="text-lg font-semibold text-gray-900">Outlets Module</h1>
                <p className="text-xs text-gray-500">Outlet operations and records</p>
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

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Outlets Module</h2>
            <p className="text-xl text-gray-600 max-w-3xl">
              Manage your outlet network with clean CRUD operations and real-time records.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => router.push('/dashboard/outlets/sales')}
              className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Outlet Sales Tracking
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-violet-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-violet-700"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href="/dashboard/outlets/management"
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                🏪
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Outlets Management</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create, edit, and delete outlet records from a single management screen.
              </p>
              <div className="mt-4 flex items-center text-sm text-violet-600 group-hover:text-violet-700">
                <span>Open Management</span>
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Outlets Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-violet-600 mb-2">{outletCount}</div>
                <div className="text-sm text-gray-600">Total Outlets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{activeCount}</div>
                <div className="text-sm text-gray-600">Active Outlets</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Outlet Stock Reports</h2>
          <p className="text-sm text-gray-600 mb-4">Click an outlet to view available outlet stock transferred from central inventory.</p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outlets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No outlets found.</td>
                  </tr>
                ) : (
                  outlets.map((outlet) => (
                    <tr key={outlet.id}>
                      <td className="px-4 py-2 text-sm text-gray-800">{outlet.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{outlet.code}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{outlet.status}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => openStockReport(outlet)}
                          className="px-3 py-1 bg-violet-100 text-violet-700 rounded-md text-sm hover:bg-violet-200"
                        >
                          View Stock Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {stockModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Outlet Stock Report - {selectedOutlet?.name}
              </h3>
              <button
                onClick={() => {
                  setStockModalOpen(false);
                  setSelectedOutlet(null);
                  setStockLines([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {stockLoading ? (
              <div className="py-8 text-center text-gray-500">Loading stock report...</div>
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
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No stock transferred to this outlet yet.</td>
                      </tr>
                    ) : (
                      stockLines.map((line) => (
                        <tr key={line.inventory_item_id}>
                          <td className="px-4 py-2 text-sm text-gray-800">{line.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{line.code}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{line.unit}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{Number(line.available_quantity).toFixed(2)}</td>
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
    </div>
  );
}
