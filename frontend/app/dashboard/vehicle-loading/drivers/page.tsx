'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Driver {
  id: number;
  name: string;
  employee_id: string;
  license_number: string;
  license_type: 'light' | 'heavy' | 'special';
  license_expiry: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  experience_years: number;
  emergency_contact: string;
  emergency_phone: string;
  department?: string;
  designation?: string;
}

export default function DriversPage() {
  const [token, setToken] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
      fetchDrivers();
    }
  }, [token]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      // Fetch drivers from HRM system
      const response = await axios.get('http://localhost:8000/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 1000, department: 'transport,logistics,drivers' } // Filter for transport/logistics staff
      });

      if (response.data.success) {
        const employeesData = response.data.data.data || [];
        // Transform employee data to driver format
        const driversData: Driver[] = employeesData.map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          employee_id: emp.employee_id,
          license_number: emp.driving_license || 'Not Assigned',
          license_type: emp.license_type || 'heavy',
          license_expiry: emp.license_expiry || '2025-12-31',
          phone: emp.phone,
          email: emp.email,
          status: emp.status === 'active' ? 'active' : 'inactive',
          experience_years: emp.experience_years || 0,
          emergency_contact: emp.emergency_contact || 'Not Provided',
          emergency_phone: emp.emergency_phone || 'Not Provided',
          department: emp.department?.name || 'Not Assigned',
          designation: emp.designation?.name || 'Not Assigned'
        }));
        setDrivers(driversData);
      } else {
        setDrivers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Mock data for development
      const mockDrivers: Driver[] = [
        {
          id: 1,
          name: 'John Doe',
          employee_id: 'EMP001',
          license_number: 'DL-12345',
          license_type: 'heavy',
          license_expiry: '2026-03-15',
          phone: '+94 77 123 4567',
          email: 'john.doe@company.com',
          status: 'active',
          experience_years: 8,
          emergency_contact: 'Jane Doe',
          emergency_phone: '+94 77 987 6543',
          department: 'Transport',
          designation: 'Senior Driver'
        },
        {
          id: 2,
          name: 'Jane Smith',
          employee_id: 'EMP002',
          license_number: 'DL-67890',
          license_type: 'light',
          license_expiry: '2025-11-22',
          phone: '+94 77 234 5678',
          email: 'jane.smith@company.com',
          status: 'active',
          experience_years: 5,
          emergency_contact: 'Bob Smith',
          emergency_phone: '+94 77 876 5432',
          department: 'Logistics',
          designation: 'Delivery Driver'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          employee_id: 'EMP003',
          license_number: 'DL-54321',
          license_type: 'heavy',
          license_expiry: '2024-12-10',
          phone: '+94 77 345 6789',
          email: 'mike.johnson@company.com',
          status: 'suspended',
          experience_years: 12,
          emergency_contact: 'Sarah Johnson',
          emergency_phone: '+94 77 765 4321',
          department: 'Transport',
          designation: 'Fleet Manager'
        }
      ];
      setDrivers(mockDrivers);
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'light': return 'bg-blue-100 text-blue-800';
      case 'heavy': return 'bg-orange-100 text-orange-800';
      case 'special': return 'bg-purple-100 text-purple-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <span className="font-medium">Note:</span> Drivers are managed through HRM system
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Drivers</label>
            <input
              type="text"
              placeholder="Search by name, employee ID, or license number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-lg">👨‍🚗</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">{driver.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {driver.employee_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.license_number}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLicenseTypeColor(driver.license_type)}`}>
                        {driver.license_type}
                      </span>
                      <span className={`text-xs ${new Date(driver.license_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        Exp: {new Date(driver.license_expiry).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{driver.phone}</div>
                    <div className="text-xs">{driver.email}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">👨‍🚗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No drivers are currently assigned to transport/logistics departments.'}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => d.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">License Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => {
                  const expiryDate = new Date(d.license_expiry);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired Licenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => new Date(d.license_expiry) < new Date()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Experience</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.length > 0
                  ? Math.round(drivers.reduce((sum, d) => sum + d.experience_years, 0) / drivers.length)
                  : 0} yrs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}