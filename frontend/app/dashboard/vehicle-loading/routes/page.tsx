'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Route {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_duration_hours: number;
  status: 'active' | 'inactive';
  route_type: 'local' | 'inter_city' | 'highway';
  toll_charges: number;
  fuel_estimate_liters: number;
  description: string;
  waypoints: string[]; // JSON array of intermediate stops
}

export default function RoutesPage() {
  const [token, setToken] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance_km: '',
    estimated_duration_hours: '',
    status: 'active' as Route['status'],
    route_type: 'local' as Route['route_type'],
    toll_charges: '',
    fuel_estimate_liters: '',
    description: '',
    waypoints: ''
  });
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
      fetchRoutes();
    }
  }, [token]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/vehicle-loading/routes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRoutes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setLoading(false);
    }
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
        waypoints: formData.waypoints
      };

      if (editingRoute) {
        await axios.put(`http://localhost:8000/api/vehicle-loading/routes/${editingRoute.id}`, routeData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/vehicle-loading/routes', routeData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      setShowModal(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes(); // Refresh the list
    } catch (error) {
      console.error('Error saving route:', error);
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
      waypoints: ''
    });
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
      waypoints: Array.isArray(route.waypoints) ? route.waypoints.join(', ') : route.waypoints || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this route?')) {
      try {
        await axios.delete(`http://localhost:8000/api/vehicle-loading/routes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchRoutes(); // Refresh the list
      } catch (error) {
        console.error('Error deleting route:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'local': return 'bg-blue-100 text-blue-800';
      case 'inter_city': return 'bg-orange-100 text-orange-800';
      case 'highway': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'local': return '🏙️';
      case 'inter_city': return '🌆';
      case 'highway': return '🛣️';
      default: return '🗺️';
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
        <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
        <button
          onClick={() => {
            setEditingRoute(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add New Route
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{getRouteTypeIcon(route.route_type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                  <p className="text-sm text-gray-600">{route.origin} → {route.destination}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                {route.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Distance:</span>
                <span className="text-sm font-medium">{route.distance_km} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">{route.estimated_duration_hours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRouteTypeColor(route.route_type)}`}>
                  {route.route_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Toll Charges:</span>
                <span className="text-sm font-medium">LKR {route.toll_charges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fuel Estimate:</span>
                <span className="text-sm font-medium">{route.fuel_estimate_liters} L</span>
              </div>
            </div>

            {route.waypoints && route.waypoints.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Waypoints:</p>
                <p className="text-sm font-medium">{route.waypoints.join(' → ')}</p>
              </div>
            )}

            {route.description && (
              <p className="text-sm text-gray-600 mb-4 italic">"{route.description}"</p>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(route)}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(route.id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingRoute ? 'Edit Route' : 'Create New Route'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoute(null);
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Colombo Route"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
                      <select
                        value={formData.route_type}
                        onChange={(e) => setFormData({ ...formData, route_type: e.target.value as Route['route_type'] })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="local">Local</option>
                        <option value="inter_city">Inter City</option>
                        <option value="highway">Highway</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Route['status'] })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Route Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                      <input
                        type="text"
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Warehouse A, Colombo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Distribution Center, Colombo"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distance_km}
                        onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="25.0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.estimated_duration_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_duration_hours: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="1.5"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Cost Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Toll Charges (LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.toll_charges}
                        onChange={(e) => setFormData({ ...formData, toll_charges: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="450.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Estimate (L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.fuel_estimate_liters}
                        onChange={(e) => setFormData({ ...formData, fuel_estimate_liters: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="35.0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Route Path */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Route Path</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Waypoints (comma separated)</label>
                    <input
                      type="text"
                      value={formData.waypoints}
                      onChange={(e) => setFormData({ ...formData, waypoints: e.target.value })}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Stop 1, Stop 2, Stop 3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter intermediate stops separated by commas</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter detailed description of the route..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRoute(null);
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