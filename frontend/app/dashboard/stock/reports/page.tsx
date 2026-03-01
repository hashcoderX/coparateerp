'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockReports() {
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
    } else {
      setToken(storedToken);
    }
  }, [router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Stock Reports
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Generate and view detailed stock reports and analytics.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-sm">
              Stock reports and analytics will be implemented here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}