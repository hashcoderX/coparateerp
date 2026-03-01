'use client';

import { useState, useEffect } from 'react';
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
  route?: {
    id: number;
    name: string;
    origin: string;
    destination: string;
  };
}

export default function LoadsPage() {
  const [token, setToken] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState({
    load_number: '',
    vehicle_id: '',
    driver_id: '',
    route_id: '',
    load_date: '',
    total_weight: '',
    notes: ''
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
      setDrivers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
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
      route_id: load.route_id.toString(),
      load_date: load.load_date,
      total_weight: load.total_weight.toString(),
      notes: load.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this load?')) {
      try {
        await axios.delete(`http://localhost:8000/api/vehicle-loading/loads/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchLoads(); // Refresh the list
      } catch (error) {
        console.error('Error deleting load:', error);
      }
    }
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
                      onClick={() => handleEdit(load)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(load.id)}
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