'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function VehicleLoading() {
  const [token, setToken] = useState('');
  const [activeLoads, setActiveLoads] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [activeRoutes, setActiveRoutes] = useState(0);
  const [pendingLoads, setPendingLoads] = useState(0);
  const [completedLoads, setCompletedLoads] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [loading, setLoading] = useState(true);
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
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data for now - replace with actual API calls when backend is ready
      setActiveLoads(12);
      setTotalVehicles(25);
      setAvailableVehicles(8);
      setTotalDrivers(20);
      setActiveRoutes(15);
      setPendingLoads(5);
      setCompletedLoads(47);
      setTotalCapacity(1250); // tons

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'Active Loads',
      value: activeLoads,
      icon: '📦',
      color: 'bg-blue-500',
      description: 'Currently in transit'
    },
    {
      name: 'Total Vehicles',
      value: totalVehicles,
      icon: '🚛',
      color: 'bg-green-500',
      description: `${availableVehicles} available`
    },
    {
      name: 'Total Drivers',
      value: totalDrivers,
      icon: '👨‍🚗',
      color: 'bg-yellow-500',
      description: 'Active drivers'
    },
    {
      name: 'Active Routes',
      value: activeRoutes,
      icon: '🗺️',
      color: 'bg-purple-500',
      description: 'Routes in operation'
    },
    {
      name: 'Pending Loads',
      value: pendingLoads,
      icon: '⏳',
      color: 'bg-orange-500',
      description: 'Awaiting dispatch'
    },
    {
      name: 'Completed Loads',
      value: completedLoads,
      icon: '✅',
      color: 'bg-indigo-500',
      description: 'This month'
    },
    {
      name: 'Total Capacity',
      value: `${totalCapacity}t`,
      icon: '⚖️',
      color: 'bg-red-500',
      description: 'Maximum load capacity'
    },
    {
      name: 'Efficiency Rate',
      value: '94%',
      icon: '📈',
      color: 'bg-teal-500',
      description: 'On-time delivery'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Loading Dashboard</h1>
        <p className="text-gray-600">Manage your fleet, loads, and logistics operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/vehicle-loading/loads"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl mr-3">📦</span>
            <div>
              <p className="font-medium text-gray-900">Create New Load</p>
              <p className="text-sm text-gray-600">Schedule a new delivery</p>
            </div>
          </Link>

          <Link
            href="/dashboard/vehicle-loading/vehicles"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl mr-3">🚛</span>
            <div>
              <p className="font-medium text-gray-900">Add Vehicle</p>
              <p className="text-sm text-gray-600">Register new vehicle</p>
            </div>
          </Link>

          <Link
            href="/dashboard/vehicle-loading/drivers"
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-2xl mr-3">👨‍🚗</span>
            <div>
              <p className="font-medium text-gray-900">Add Driver</p>
              <p className="text-sm text-gray-600">Register new driver</p>
            </div>
          </Link>

          <Link
            href="/dashboard/vehicle-loading/routes"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-2xl mr-3">🗺️</span>
            <div>
              <p className="font-medium text-gray-900">Plan Route</p>
              <p className="text-sm text-gray-600">Create delivery route</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-xl mr-3">🚛</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Load #VL-2024-001 dispatched</p>
              <p className="text-sm text-gray-600">Vehicle TRK-001 en route to Colombo • 2 hours ago</p>
            </div>
            <span className="text-sm text-green-600 font-medium">In Transit</span>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-xl mr-3">✅</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Load #VL-2024-002 delivered</p>
              <p className="text-sm text-gray-600">Successfully delivered to Kandy warehouse • 4 hours ago</p>
            </div>
            <span className="text-sm text-blue-600 font-medium">Completed</span>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Vehicle TRK-005 maintenance due</p>
              <p className="text-sm text-gray-600">Scheduled maintenance in 2 days • 6 hours ago</p>
            </div>
            <span className="text-sm text-orange-600 font-medium">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}