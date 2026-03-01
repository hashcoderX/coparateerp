'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockLevels() {
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
            Stock Levels
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Monitor current stock levels and reorder points.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-sm">
              Stock levels monitoring interface will be implemented here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}