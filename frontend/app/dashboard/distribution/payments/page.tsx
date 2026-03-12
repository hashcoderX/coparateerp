'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function DistributionPaymentsPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [form, setForm] = useState({
    payment_number: '',
    distribution_invoice_id: '',
    customer_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    reference_no: '',
    bank_name: '',
    status: 'received',
    notes: '',
  });

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) router.push('/');
    else setToken(storedToken);
  }, [router]);

  useEffect(() => { if (token) fetchData(); }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, customersRes, invoicesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/distribution/payments', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 100 } }),
        axios.get('http://localhost:8000/api/distribution/customers', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 1000 } }),
        axios.get('http://localhost:8000/api/distribution/invoices', { headers: { Authorization: `Bearer ${token}` }, params: { per_page: 1000 } }),
      ]);

      setPayments(paymentsRes.data?.data?.data || []);
      setCustomers(customersRes.data?.data?.data || []);
      setInvoices(invoicesRes.data?.data?.data || []);
      setForm((prev) => ({ ...prev, payment_number: `PAY-${Date.now()}` }));
    } catch (error) {
      console.error('Error loading payments data:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.post('http://localhost:8000/api/distribution/payments', {
        ...form,
        distribution_invoice_id: form.distribution_invoice_id ? Number(form.distribution_invoice_id) : null,
        customer_id: Number(form.customer_id),
        amount: Number(form.amount || 0),
      }, { headers: { Authorization: `Bearer ${token}` } });

      setForm({
        payment_number: `PAY-${Date.now()}`,
        distribution_invoice_id: '',
        customer_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        bank_name: '',
        status: 'received',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Distribution Payments</h1>
          <p className="text-sm text-gray-500">Register check, cash, and bank transfer payments.</p>
        </div>
        <Link href="/dashboard/distribution" className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Back</Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={createPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={form.payment_number} onChange={(e) => setForm({ ...form, payment_number: e.target.value })} placeholder="Payment Number" className="rounded-md border-gray-300 text-black" required />
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="rounded-md border-gray-300 text-black" required>
            <option value="">Select Customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.shop_name}</option>)}
          </select>
          <select value={form.distribution_invoice_id} onChange={(e) => setForm({ ...form, distribution_invoice_id: e.target.value })} className="rounded-md border-gray-300 text-black">
            <option value="">Linked Invoice (Optional)</option>
            {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number}</option>)}
          </select>
          <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className="rounded-md border-gray-300 text-black" required />

          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="rounded-md border-gray-300 text-black" required />
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="rounded-md border-gray-300 text-black">
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} placeholder="Reference No" className="rounded-md border-gray-300 text-black" />
          <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Bank Name" className="rounded-md border-gray-300 text-black" />

          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-md border-gray-300 text-black">
            <option value="received">Received</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
            <option value="bounced">Bounced</option>
          </select>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="rounded-md border-gray-300 text-black md:col-span-2" />
          <button type="submit" disabled={saving} className="bg-green-600 text-white rounded-md px-4 py-2 hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving...' : 'Register Payment'}</button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-900">Payment Records</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Method</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr> : payments.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No payments yet.</td></tr> : payments.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.payment_number}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.customer?.shop_name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.payment_method.replace('_',' ')}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(row.payment_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{Number(row.amount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
