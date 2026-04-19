'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { createApiClient } from '../../../../lib/apiClient';

type CompanyChequeAccount = {
  id: number;
  bank_name?: string;
  account_no?: string;
  current_balance?: number;
};

type CompanyRow = {
  id: number;
  name: string;
  cheque_accounts?: CompanyChequeAccount[];
};

type ChequeRegistryEntry = {
  id: number;
  direction: 'received' | 'issued';
  lifecycle_status: 'registered' | 'deposited' | 'cleared' | 'bounced' | 'issued';
  source_module: 'manual' | 'distribution' | 'supplier_payment';
  cheque_no: string;
  cheque_date?: string;
  deposit_date?: string | null;
  amount: number;
  bank_name?: string | null;
  account_no?: string | null;
  counterparty_name?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  company?: { id: number; name: string };
  company_id?: number;
  distribution_payment_id?: number | null;
};

type DistributionCheque = {
  id: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  reference_no?: string | null;
  bank_name?: string | null;
  status?: string | null;
  customer_name?: string;
  customer_code?: string;
  sales_person_name?: string;
};

const money = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ChequeRegistryPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [depositingId, setDepositingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [entries, setEntries] = useState<ChequeRegistryEntry[]>([]);
  const [distributionCheques, setDistributionCheques] = useState<DistributionCheque[]>([]);

  const [registerForm, setRegisterForm] = useState({
    companyId: '',
    chequeNo: '',
    chequeDate: new Date().toISOString().split('T')[0],
    amount: '',
    bankName: '',
    accountNo: '',
    counterpartyName: '',
    sourceModule: 'manual' as 'manual' | 'distribution',
    distributionPaymentId: '',
    referenceNo: '',
    notes: '',
  });

  const [depositForm, setDepositForm] = useState({
    entryId: '',
    chequeAccountId: '',
    depositDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [issueForm, setIssueForm] = useState({
    companyId: '',
    chequeAccountId: '',
    supplierName: '',
    chequeNo: '',
    chequeDate: new Date().toISOString().split('T')[0],
    amount: '',
    bankName: '',
    accountNo: '',
    referenceNo: '',
    notes: '',
  });

  const router = useRouter();
  const api = useMemo(() => createApiClient(token), [token]);

  const selectedRegisterCompany = useMemo(
    () => companies.find((company) => String(company.id) === registerForm.companyId) || null,
    [companies, registerForm.companyId]
  );

  const selectedDepositEntry = useMemo(
    () => entries.find((entry) => String(entry.id) === depositForm.entryId) || null,
    [entries, depositForm.entryId]
  );

  const selectedDepositCompany = useMemo(() => {
    if (!selectedDepositEntry?.company_id) return null;
    return companies.find((company) => company.id === selectedDepositEntry.company_id) || null;
  }, [companies, selectedDepositEntry]);

  const selectedIssueCompany = useMemo(
    () => companies.find((company) => String(company.id) === issueForm.companyId) || null,
    [companies, issueForm.companyId]
  );

  const registeredReceivedCheques = useMemo(
    () => entries.filter((entry) => entry.direction === 'received' && entry.lifecycle_status === 'registered'),
    [entries]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesRes, registryRes] = await Promise.all([
        api.get('/companies'),
        api.get('/cheque-registry', { params: { per_page: 200 } }),
      ]);

      const companyRows = Array.isArray(companiesRes.data) ? companiesRes.data : (companiesRes.data?.data || []);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);

      const registryPayload = registryRes.data;
      const registryRows = registryPayload?.data?.data || registryPayload?.data || [];
      setEntries(Array.isArray(registryRows) ? registryRows : []);

      const distRows = registryPayload?.distribution_cheques || [];
      setDistributionCheques(Array.isArray(distRows) ? distRows : []);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        router.push('/');
        return;
      }
      setError('Failed to load cheque registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  useEffect(() => {
    if (!companies.length) return;

    setRegisterForm((prev) => (prev.companyId ? prev : { ...prev, companyId: String(companies[0].id) }));
    setIssueForm((prev) => (prev.companyId ? prev : { ...prev, companyId: String(companies[0].id) }));
  }, [companies]);

  const submitRegister = async () => {
    setError('');
    setSuccess('');

    const amount = Number(registerForm.amount || 0);
    if (!registerForm.companyId || !registerForm.chequeNo || !registerForm.chequeDate || amount <= 0 || !registerForm.counterpartyName) {
      setError('Please complete required register cheque fields.');
      return;
    }

    if (registerForm.sourceModule === 'distribution' && !registerForm.distributionPaymentId) {
      setError('Please select a distribution cheque when source is distribution.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/cheque-registry/register', {
        company_id: Number(registerForm.companyId),
        cheque_no: registerForm.chequeNo,
        cheque_date: registerForm.chequeDate,
        amount,
        bank_name: registerForm.bankName || null,
        account_no: registerForm.accountNo || null,
        counterparty_name: registerForm.counterpartyName,
        source_module: registerForm.sourceModule,
        distribution_payment_id: registerForm.sourceModule === 'distribution' ? Number(registerForm.distributionPaymentId) : null,
        reference_no: registerForm.referenceNo || null,
        notes: registerForm.notes || null,
      });

      setRegisterForm((prev) => ({
        ...prev,
        chequeNo: '',
        amount: '',
        bankName: '',
        accountNo: '',
        counterpartyName: '',
        distributionPaymentId: '',
        referenceNo: '',
        notes: '',
      }));
      setSuccess('Cheque registered successfully.');
      await loadData();
    } catch (err) {
      const message = (isAxiosError(err) && (err.response?.data?.message as string)) || 'Failed to register cheque.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitDeposit = async () => {
    setError('');
    setSuccess('');

    if (!depositForm.entryId || !depositForm.chequeAccountId || !depositForm.depositDate) {
      setError('Please select cheque, cheque account, and deposit date.');
      return;
    }

    try {
      const id = Number(depositForm.entryId);
      setDepositingId(id);
      await api.post(`/cheque-registry/${id}/deposit`, {
        company_cheque_account_id: Number(depositForm.chequeAccountId),
        deposit_date: depositForm.depositDate,
        notes: depositForm.notes || null,
      });

      setDepositForm((prev) => ({
        ...prev,
        entryId: '',
        chequeAccountId: '',
        notes: '',
      }));
      setSuccess('Cheque deposited successfully.');
      await loadData();
    } catch (err) {
      const message = (isAxiosError(err) && (err.response?.data?.message as string)) || 'Failed to deposit cheque.';
      setError(message);
    } finally {
      setDepositingId(null);
    }
  };

  const submitIssue = async () => {
    setError('');
    setSuccess('');

    const amount = Number(issueForm.amount || 0);
    if (!issueForm.companyId || !issueForm.chequeAccountId || !issueForm.supplierName || !issueForm.chequeNo || !issueForm.chequeDate || amount <= 0) {
      setError('Please complete required issued cheque fields.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/cheque-registry/issue', {
        company_id: Number(issueForm.companyId),
        company_cheque_account_id: Number(issueForm.chequeAccountId),
        supplier_name: issueForm.supplierName,
        cheque_no: issueForm.chequeNo,
        cheque_date: issueForm.chequeDate,
        amount,
        bank_name: issueForm.bankName || null,
        account_no: issueForm.accountNo || null,
        reference_no: issueForm.referenceNo || null,
        notes: issueForm.notes || null,
      });

      setIssueForm((prev) => ({
        ...prev,
        supplierName: '',
        chequeNo: '',
        amount: '',
        bankName: '',
        accountNo: '',
        referenceNo: '',
        notes: '',
      }));
      setSuccess('Issued cheque saved successfully.');
      await loadData();
    } catch (err) {
      const message = (isAxiosError(err) && (err.response?.data?.message as string)) || 'Failed to save issued cheque.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!token || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center h-auto sm:h-16 py-3 gap-3">
            <Link href="/dashboard/accounts" className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600">
              <span>←</span>
              <span className="font-medium text-sm sm:text-base">Back to Accounts</span>
            </Link>
            <div className="text-sm text-gray-600">Cheque Registry Operations</div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Cheque Registry</h1>
          <p className="text-sm text-gray-600 mt-1">Register received cheques, deposit cheques, track distribution salesperson cheques, and save issued supplier cheques.</p>
        </div>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div> : null}

        <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900">Register Received Cheque</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
            <select value={registerForm.companyId} onChange={(e) => setRegisterForm((p) => ({ ...p, companyId: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm">
              <option value="">Select Company</option>
              {companies.map((company) => <option key={company.id} value={String(company.id)}>{company.name}</option>)}
            </select>
            <input value={registerForm.counterpartyName} onChange={(e) => setRegisterForm((p) => ({ ...p, counterpartyName: e.target.value }))} placeholder="Received From" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={registerForm.chequeNo} onChange={(e) => setRegisterForm((p) => ({ ...p, chequeNo: e.target.value }))} placeholder="Cheque No" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input type="date" value={registerForm.chequeDate} onChange={(e) => setRegisterForm((p) => ({ ...p, chequeDate: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input type="number" min="0" step="0.01" value={registerForm.amount} onChange={(e) => setRegisterForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />

            <input value={registerForm.bankName} onChange={(e) => setRegisterForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Bank Name" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={registerForm.accountNo} onChange={(e) => setRegisterForm((p) => ({ ...p, accountNo: e.target.value }))} placeholder="Account No" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <select value={registerForm.sourceModule} onChange={(e) => setRegisterForm((p) => ({ ...p, sourceModule: e.target.value as 'manual' | 'distribution', distributionPaymentId: '' }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm">
              <option value="manual">Source: Manual</option>
              <option value="distribution">Source: Distribution</option>
            </select>
            {registerForm.sourceModule === 'distribution' ? (
              <select value={registerForm.distributionPaymentId} onChange={(e) => setRegisterForm((p) => ({ ...p, distributionPaymentId: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm md:col-span-2">
                <option value="">Select Distribution Cheque</option>
                {distributionCheques.map((row) => (
                  <option key={row.id} value={String(row.id)}>
                    {`${row.payment_number} | ${row.customer_name || '-'} | ${money(Number(row.amount || 0))}`}
                  </option>
                ))}
              </select>
            ) : <div className="md:col-span-2"></div>}

            <input value={registerForm.referenceNo} onChange={(e) => setRegisterForm((p) => ({ ...p, referenceNo: e.target.value }))} placeholder="Reference" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={registerForm.notes} onChange={(e) => setRegisterForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm md:col-span-3" />
            <button type="button" onClick={submitRegister} disabled={saving} className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold px-5 py-2.5 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Register Cheque'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900">Deposit Received Cheque</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <select value={depositForm.entryId} onChange={(e) => setDepositForm((p) => ({ ...p, entryId: e.target.value, chequeAccountId: '' }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm md:col-span-2">
              <option value="">Select Registered Cheque</option>
              {registeredReceivedCheques.map((entry) => (
                <option key={entry.id} value={String(entry.id)}>
                  {`${entry.cheque_no} | ${entry.counterparty_name || '-'} | ${money(Number(entry.amount || 0))}`}
                </option>
              ))}
            </select>
            <select value={depositForm.chequeAccountId} onChange={(e) => setDepositForm((p) => ({ ...p, chequeAccountId: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm">
              <option value="">Select Company Cheque Account</option>
              {(selectedDepositCompany?.cheque_accounts || selectedRegisterCompany?.cheque_accounts || []).map((acc) => (
                <option key={acc.id} value={String(acc.id)}>
                  {`${acc.bank_name || 'Cheque Account'} (${acc.account_no || '-'}) - ${money(Number(acc.current_balance || 0))}`}
                </option>
              ))}
            </select>
            <input type="date" value={depositForm.depositDate} onChange={(e) => setDepositForm((p) => ({ ...p, depositDate: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={depositForm.notes} onChange={(e) => setDepositForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Deposit Notes" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm md:col-span-3" />
            <button type="button" onClick={submitDeposit} disabled={!depositForm.entryId || depositingId !== null} className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-semibold px-5 py-2.5 hover:from-sky-700 hover:to-cyan-700 disabled:opacity-60">
              {depositingId ? 'Depositing...' : 'Deposit Cheque'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900">Issued Cheque (Company to Supplier)</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
            <select value={issueForm.companyId} onChange={(e) => setIssueForm((p) => ({ ...p, companyId: e.target.value, chequeAccountId: '' }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm">
              <option value="">Select Company</option>
              {companies.map((company) => <option key={company.id} value={String(company.id)}>{company.name}</option>)}
            </select>
            <select value={issueForm.chequeAccountId} onChange={(e) => setIssueForm((p) => ({ ...p, chequeAccountId: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm">
              <option value="">Select Cheque Account</option>
              {(selectedIssueCompany?.cheque_accounts || []).map((acc) => (
                <option key={acc.id} value={String(acc.id)}>
                  {`${acc.bank_name || 'Cheque Account'} (${acc.account_no || '-'}) - ${money(Number(acc.current_balance || 0))}`}
                </option>
              ))}
            </select>
            <input value={issueForm.supplierName} onChange={(e) => setIssueForm((p) => ({ ...p, supplierName: e.target.value }))} placeholder="Supplier Name" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={issueForm.chequeNo} onChange={(e) => setIssueForm((p) => ({ ...p, chequeNo: e.target.value }))} placeholder="Cheque No" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input type="date" value={issueForm.chequeDate} onChange={(e) => setIssueForm((p) => ({ ...p, chequeDate: e.target.value }))} className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />

            <input type="number" min="0" step="0.01" value={issueForm.amount} onChange={(e) => setIssueForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={issueForm.bankName} onChange={(e) => setIssueForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Bank Name" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={issueForm.accountNo} onChange={(e) => setIssueForm((p) => ({ ...p, accountNo: e.target.value }))} placeholder="Account No" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={issueForm.referenceNo} onChange={(e) => setIssueForm((p) => ({ ...p, referenceNo: e.target.value }))} placeholder="Reference" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />
            <input value={issueForm.notes} onChange={(e) => setIssueForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm" />

            <button type="button" onClick={submitIssue} disabled={saving} className="rounded-full bg-gradient-to-r from-rose-600 to-orange-600 text-white text-sm font-semibold px-5 py-2.5 hover:from-rose-700 hover:to-orange-700 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Save Issued Cheque'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/90 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 className="text-base font-semibold text-gray-900">Cheque Registry Entries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Direction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cheque No</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Counterparty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">No cheque registry records found.</td>
                  </tr>
                ) : entries.map((entry, idx) => (
                  <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-4 py-3 text-sm text-gray-700">{entry.cheque_date ? new Date(entry.cheque_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{entry.direction}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{entry.lifecycle_status}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{entry.company?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{entry.cheque_no}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{money(Number(entry.amount || 0))}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{entry.counterparty_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{entry.source_module}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/90 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-sky-50">
            <h2 className="text-base font-semibold text-gray-900">Distribution Cheques (Salesperson Added)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Payment No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Salesperson</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Bank</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {distributionCheques.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No distribution cheque records found.</td>
                  </tr>
                ) : distributionCheques.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.payment_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.payment_date ? new Date(row.payment_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.sales_person_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.bank_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-sky-700">{money(Number(row.amount || 0))}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{row.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
