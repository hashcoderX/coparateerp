'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProductionArea = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  features: string[];
  path?: string;
};

export default function ProductionPage() {
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const productionAreas: ProductionArea[] = useMemo(
    () => [
      {
        id: 'formula-management-bom',
        code: '01',
        title: 'Formula Management - BOM',
        subtitle: 'Create and control product recipes with full costing and revision control.',
        icon: '🧪',
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'from-emerald-50 to-teal-50',
        features: [
          'Create product recipe',
          'Define ingredients and quantities',
          'Standard production batch size',
          'Cost calculation per item',
          'Version control for recipes',
        ],
        path: '/dashboard/production/bom',
      },
      {
        id: 'production-planning',
        code: '02',
        title: 'Production Planning',
        subtitle: 'Plan what to produce, when to produce, and how much to produce.',
        icon: '🗓️',
        color: 'from-cyan-500 to-blue-500',
        bgColor: 'from-cyan-50 to-blue-50',
        features: [
          'Production schedule',
          'Batch planning',
          'Production target',
          'Daily production plan',
          'Production order creation',
        ],
        path: '/dashboard/production/planning',
      },
      {
        id: 'production-execution',
        code: '03',
        title: 'Production Execution',
        subtitle: 'Track live manufacturing with consumption, assignments, and progress visibility.',
        icon: '🏭',
        color: 'from-amber-500 to-orange-500',
        bgColor: 'from-amber-50 to-orange-50',
        features: [
          'Start production batch',
          'Raw material consumption',
          'Machine / workstation assignment',
          'Worker assignment',
          'Production status tracking',
          'Wastage recording',
        ],
        path: '/dashboard/production/execution',
      },
      {
        id: 'quality-control',
        code: '04',
        title: 'Quality Control',
        subtitle: 'Ensure consistent product quality and food safety across every batch.',
        icon: '✅',
        color: 'from-violet-500 to-purple-500',
        bgColor: 'from-violet-50 to-purple-50',
        features: [
          'Quality inspection',
          'Batch approval',
          'Rejected product tracking',
          'Food safety checklist',
          'QC reports',
        ],
        path: '/dashboard/production/quality-control',
      },
      {
        id: 'packaging-management',
        code: '05',
        title: 'Packaging Management',
        subtitle: 'Control packing flow, labels, and finished packed output.',
        icon: '📦',
        color: 'from-rose-500 to-pink-500',
        bgColor: 'from-rose-50 to-pink-50',
        features: [
          'Packaging material tracking',
          'Packaging batch',
          'Label printing',
          'Barcode / QR generation',
          'Packed quantity tracking',
        ],
        path: '/dashboard/production/packaging',
      },
    ],
    []
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center justify-between sm:justify-start">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Production Module Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  PR
                </div>
                <span className="font-medium text-gray-900 text-sm sm:text-base">Production</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block p-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-6">
            <div className="bg-white rounded-full p-4">
              <span className="text-4xl">🏭</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Production <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Management</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-1">
            Plan, execute, and control manufacturing operations from formula setup to quality and packaging.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Core Areas</div>
            <div className="text-2xl font-bold text-gray-900">{productionAreas.length}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">BOM & Formula</div>
            <div className="text-2xl font-bold text-gray-900">Ready</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Planning</div>
            <div className="text-2xl font-bold text-gray-900">Ready</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Execution & QC</div>
            <div className="text-2xl font-bold text-gray-900">Ready</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/85 backdrop-blur-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Packaging</div>
            <div className="text-2xl font-bold text-gray-900">Ready</div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {productionAreas.map((area) => (
            <div
              key={area.id}
              className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${area.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${area.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {area.icon}
                  </div>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                    {area.code}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{area.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{area.subtitle}</p>

                <ul className="space-y-2 mb-5">
                  {area.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  {area.path ? (
                    <Link
                      href={area.path}
                      className={`px-4 py-2 bg-gradient-to-r ${area.color} text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity`}
                    >
                      Open {area.code}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`${area.title} module will be implemented next.`)}
                      className={`px-4 py-2 bg-gradient-to-r ${area.color} text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity`}
                    >
                      Open {area.code}
                    </button>
                  )}
                  <span className="text-xs text-gray-500">{area.path ? 'Live module' : 'Planned next'}</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-500"></div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
