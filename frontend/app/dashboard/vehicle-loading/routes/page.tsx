'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type RouteStatus = 'active' | 'inactive';
type RouteType = 'local' | 'inter_city' | 'highway';

type Route = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_duration_hours: number;
  status: RouteStatus;
  route_type: RouteType;
  toll_charges: number;
  fuel_estimate_liters: number;
  description: string;
  waypoints: string[];
};

const PAGE_SIZE = 10;

export default function RoutesPage() {
  const [token, setToken] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RouteStatus>('all');
  const [routeTypeFilter, setRouteTypeFilter] = useState<'all' | RouteType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance_km: '',
    estimated_duration_hours: '',
    status: 'active' as RouteStatus,
    route_type: 'local' as RouteType,
    toll_charges: '',
    fuel_estimate_liters: '',
    description: '',
    waypoints: '',
  });

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
      router.push('/');
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      await fetchRoutes(token);
    };

    load();
  }, [token]);

  const parseWaypoints = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.map((point) => String(point || '').trim()).filter(Boolean);
    }

    const raw = String(input || '').trim();
    if (!raw) return [];

    if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((point) => String(point || '').trim()).filter(Boolean);
        }
      } catch {
        // Fall back to CSV parsing below.
      }
    }

    return raw
      .split(',')
      .map((point) => point.trim())
      .filter(Boolean);
  };

  const fetchRoutes = async (authToken: string) => {
    try {
      setLoading(true);
      setMessage('');

      const response = await axios.get('http://localhost:8000/api/vehicle-loading/routes', {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      if (response.status >= 400) {
        setRoutes([]);
        setMessage(response.data?.message || 'Failed to load routes.');
        return;
      }

      const payload = response.data;
      const sourceRows: any[] = Array.isArray(payload)
        ? payload
        : (payload?.data?.data || payload?.data || []);

      const normalized: Route[] = sourceRows.map((route) => {
        const status: RouteStatus = String(route?.status || '').toLowerCase() === 'inactive' ? 'inactive' : 'active';
        const routeTypeRaw = String(route?.route_type || '').toLowerCase();
        const routeType: RouteType = routeTypeRaw === 'highway'
          ? 'highway'
          : routeTypeRaw === 'inter_city'
            ? 'inter_city'
            : 'local';

        return {
          id: Number(route?.id || 0),
          name: String(route?.name || '-'),
          origin: String(route?.origin || '-'),
          destination: String(route?.destination || '-'),
          distance_km: Number(route?.distance_km || 0),
          estimated_duration_hours: Number(route?.estimated_duration_hours || 0),
          status,
          route_type: routeType,
          toll_charges: Number(route?.toll_charges || 0),
          fuel_estimate_liters: Number(route?.fuel_estimate_liters || 0),
          description: String(route?.description || ''),
          waypoints: parseWaypoints(route?.waypoints),
        };
      }).filter((route) => route.id > 0);

      setRoutes(normalized);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
      setMessage('Unable to load routes right now.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      origin: '',
      destination: '',
      distance_km: '',
      estimated_duration_hours: '',
      status: 'active',
      route_type: 'local',
      toll_charges: '',
      fuel_estimate_liters: '',
      description: '',
      waypoints: '',
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoute(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const routeData = {
        name: formData.name,
        origin: formData.origin,
        destination: formData.destination,
        distance_km: parseFloat(formData.distance_km),
        estimated_duration_hours: parseFloat(formData.estimated_duration_hours),
        status: formData.status,
        route_type: formData.route_type,
        toll_charges: parseFloat(formData.toll_charges) || 0,
        fuel_estimate_liters: parseFloat(formData.fuel_estimate_liters) || 0,
        description: formData.description,
        waypoints: formData.waypoints,
      };

      if (editingRoute) {
        await axios.put(`http://localhost:8000/api/vehicle-loading/routes/${editingRoute.id}`, routeData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('http://localhost:8000/api/vehicle-loading/routes', routeData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      closeModal();
      await fetchRoutes(token);
    } catch (error) {
      console.error('Error saving route:', error);
      setMessage('Failed to save route. Please check values and try again.');
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      distance_km: route.distance_km.toString(),
      estimated_duration_hours: route.estimated_duration_hours.toString(),
      status: route.status,
      route_type: route.route_type,
      toll_charges: route.toll_charges.toString(),
      fuel_estimate_liters: route.fuel_estimate_liters.toString(),
      description: route.description,
      waypoints: route.waypoints.join(', '),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await axios.delete(`http://localhost:8000/api/vehicle-loading/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRoutes(token);
    } catch (error) {
      console.error('Error deleting route:', error);
      setMessage('Failed to delete route.');
    }
  };

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const haystack = `${route.name} ${route.origin} ${route.destination} ${route.description} ${route.waypoints.join(' ')}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
      const matchesType = routeTypeFilter === 'all' || route.route_type === routeTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [routes, searchTerm, statusFilter, routeTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, routeTypeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRoutes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRoutes.slice(start, start + PAGE_SIZE);
  }, [filteredRoutes, currentPage]);

  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const rowStart = filteredRoutes.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(currentPage * PAGE_SIZE, filteredRoutes.length);

  const activeCount = routes.filter((route) => route.status === 'active').length;
  const inactiveCount = routes.filter((route) => route.status === 'inactive').length;
  const totalDistance = routes.reduce((sum, route) => sum + Number(route.distance_km || 0), 0);
  const averageDuration = routes.length
    ? routes.reduce((sum, route) => sum + Number(route.estimated_duration_hours || 0), 0) / routes.length
    : 0;

  const getStatusClass = (status: RouteStatus): string => {
    if (status === 'active') return 'border border-emerald-200 bg-emerald-100 text-emerald-700';
    return 'border border-slate-200 bg-slate-100 text-slate-700';
  };

  const getRouteTypeClass = (type: RouteType): string => {
    if (type === 'local') return 'border border-cyan-200 bg-cyan-100 text-cyan-700';
    if (type === 'inter_city') return 'border border-amber-200 bg-amber-100 text-amber-700';
    return 'border border-indigo-200 bg-indigo-100 text-indigo-700';
  };

  const getRouteTypeIcon = (type: RouteType): string => {
    if (type === 'local') return '??';
    if (type === 'inter_city') return '??';
    return '???';
  };

  const modalInputClass = 'w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100';
  const modalSectionClass = 'rounded-2xl border border-white/70 bg-gradient-to-br from-white to-emerald-50/45 p-4 shadow-sm';
  const modalLabelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f0fdf4_0%,_#eff6ff_100%)]">
        <div className="h-14 w-14 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f0fdf4_0%,_#eff6ff_55%,_#f8fafc_100%)]" />

      <section className="rounded-[28px] border border-white/70 bg-white/85 px-6 py-6 shadow-[0_26px_90px_-45px_rgba(16,185,129,0.5)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Routes Management</h1>
            <p className="mt-1 text-sm text-slate-600">Plan and manage delivery paths with costs, duration, and waypoints in one table view.</p>
          </div>
          <button
            onClick={() => {
              setEditingRoute(null);
              resetForm();
              setShowModal(true);
            }}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition hover:from-emerald-700 hover:to-teal-700"
          >
            Add New Route
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</div>
      )}

      <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-[0_18px_65px_-35px_rgba(30,64,175,0.45)] backdrop-blur-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Search Routes</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, origin, destination or waypoints"
              className="w-full rounded-xl border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/40 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | RouteStatus)}
              className="w-full rounded-xl border border-blue-200 bg-gradient-to-b from-white to-blue-50/35 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Route Type</label>
            <select
              value={routeTypeFilter}
              onChange={(e) => setRouteTypeFilter(e.target.value as 'all' | RouteType)}
              className="w-full rounded-xl border border-cyan-200 bg-gradient-to-b from-white to-cyan-50/35 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
            >
              <option value="all">All Types</option>
              <option value="local">Local</option>
              <option value="inter_city">Inter City</option>
              <option value="highway">Highway</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_65px_-35px_rgba(16,185,129,0.45)] backdrop-blur-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Routes Table</h2>
          <div className="text-sm text-slate-600">Showing {rowStart} to {rowEnd} of {filteredRoutes.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Route</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Path</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Type</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Distance</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Duration</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Toll</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fuel</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Waypoints</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedRoutes.map((route) => (
                <tr key={route.id} className="transition hover:bg-emerald-50/35">
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{route.name}</div>
                    <div className="text-xs text-slate-500">{route.description || '-'}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700">
                    {route.origin} ? {route.destination}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getRouteTypeClass(route.route_type)}`}>
                      {getRouteTypeIcon(route.route_type)} {route.route_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-slate-700">{route.distance_km.toFixed(1)} km</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-slate-700">{route.estimated_duration_hours.toFixed(1)} h</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-slate-700">{route.toll_charges.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-slate-700">{route.fuel_estimate_liters.toFixed(1)} L</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusClass(route.status)}`}>
                      {route.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-5 py-3.5 text-xs text-slate-600">
                    {route.waypoints.length > 0 ? route.waypoints.join(' ? ') : '-'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-medium">
                    <button onClick={() => handleEdit(route)} className="mr-3 text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(route.id)} className="text-rose-600 hover:text-rose-900">Delete</button>
                  </td>
                </tr>
              ))}

              {paginatedRoutes.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center">
                    <div className="text-base font-medium text-slate-800">No Routes Found</div>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm || statusFilter !== 'all' || routeTypeFilter !== 'all'
                        ? 'Try adjusting your filters.'
                        : 'Create your first route to start planning deliveries.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {visiblePages.map((pageNo) => (
              <button
                key={pageNo}
                type="button"
                onClick={() => setCurrentPage(pageNo)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  currentPage === pageNo
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNo}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Routes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Inactive Routes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{inactiveCount}</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Distance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalDistance.toFixed(1)} km</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Duration</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{averageDuration.toFixed(1)} h</p>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_30px_120px_-50px_rgba(16,185,129,0.55)] backdrop-blur-xl">
              <div className="flex items-start justify-between border-b border-white/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Route Planner</p>
                  <h3 className="mt-1 text-2xl font-bold">{editingRoute ? 'Edit Route' : 'Create New Route'}</h3>
                  <p className="mt-1 text-sm text-emerald-50/90">Define route path, cost profile, and waypoints for delivery operations.</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/30"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-5 overflow-y-auto px-6 py-6">
                <div className={modalSectionClass}>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={modalLabelClass}>Route Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={modalInputClass}
                        placeholder="Colombo Route"
                        required
                      />
                    </div>
                    <div>
                      <label className={modalLabelClass}>Route Type</label>
                      <select
                        value={formData.route_type}
                        onChange={(e) => setFormData({ ...formData, route_type: e.target.value as RouteType })}
                        className={modalInputClass}
                      >
                        <option value="local">Local</option>
                        <option value="inter_city">Inter City</option>
                        <option value="highway">Highway</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={modalLabelClass}>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as RouteStatus })}
                        className={modalInputClass}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={modalSectionClass}>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">Route Details</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={modalLabelClass}>Origin</label>
                      <input
                        type="text"
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={modalLabelClass}>Destination</label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={modalLabelClass}>Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distance_km}
                        onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={modalLabelClass}>Duration (hours)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.estimated_duration_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_duration_hours: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={modalSectionClass}>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">Cost Information</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={modalLabelClass}>Toll Charges (LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.toll_charges}
                        onChange={(e) => setFormData({ ...formData, toll_charges: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={modalLabelClass}>Fuel Estimate (L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.fuel_estimate_liters}
                        onChange={(e) => setFormData({ ...formData, fuel_estimate_liters: e.target.value })}
                        className={modalInputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={modalSectionClass}>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">Route Path</h4>
                  <label className={modalLabelClass}>Waypoints (comma separated)</label>
                  <input
                    type="text"
                    value={formData.waypoints}
                    onChange={(e) => setFormData({ ...formData, waypoints: e.target.value })}
                    className={modalInputClass}
                    placeholder="Stop 1, Stop 2, Stop 3"
                  />
                  <p className="mt-1 text-xs text-slate-500">Enter intermediate stops separated by commas.</p>
                </div>

                <div className={modalSectionClass}>
                  <h4 className="mb-4 text-base font-semibold text-slate-900">Additional Information</h4>
                  <label className={modalLabelClass}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={modalInputClass}
                    placeholder="Enter detailed description of the route..."
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition hover:from-emerald-700 hover:to-teal-700"
                  >
                    {editingRoute ? 'Update Route' : 'Create Route'}
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
