'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createApiClient } from '../../../../lib/apiClient';

type LocalLedgerEntry = {
  id: string | number;
  date: string;
  type: 'in' | 'out';
  amount: number;
  note?: string;
  reference?: string;
};

type DistributionPayment = {
  id: number;
  payment_number?: string;
  payment_date?: string;
  amount?: number;
  payment_method?: 'check' | 'cash' | 'bank_transfer';
  reference_no?: string;
  bank_name?: string;
  status?: string;
  notes?: string;
  customer?: { shop_name?: string; customer_code?: string };
};

type DistributionReturn = {
  id: number;
  return_number?: string;
  return_date?: string;
  status?: string;
  settlement_type?: 'bill_deduction' | 'cash_refund' | 'item_exchange';
  settlement_amount?: number;
  total_amount?: number;
  reason?: string;
  notes?: string;
  customer?: { shop_name?: string; customer_code?: string };
};

type UnifiedTransaction = {
  id: string;
  date: string;
  transaction_type: string;
  source: string;
  reference: string;
  note: string;
  credit: number;
  debit: number;
  balance?: number;
};

const money = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safeDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
};

const includesAny = (text: string, terms: string[]) => {
  const lowered = text.toLowerCase();
  return terms.some((term) => lowered.includes(term));
};

const inferLedgerTransactionType = (entry: LocalLedgerEntry, fallbackIn: string, fallbackOut: string) => {
  const text = `${entry.note || ''} ${entry.reference || ''}`.toLowerCase();

  if (includesAny(text, ['donation', 'donate'])) return 'Donation';
  if (includesAny(text, ['expense', 'expence'])) return 'Expense';
  if (includesAny(text, ['cheque deposit', 'check deposit'])) return 'Cheque Deposit';
  if (includesAny(text, ['cheque withdraw', 'check withdraw', 'withdrawal'])) return 'Cheque Withdrawal';
  if (includesAny(text, ['bank payment', 'bank transfer'])) return 'Bank Payment';
  if (includesAny(text, ['cash payment'])) return 'Cash Payment';

  return entry.type === 'in' ? fallbackIn : fallbackOut;
};

export default function TransactionBookPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);

  const router = useRouter();
  const api = useMemo(() => createApiClient(token), [token]);

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

    const load = async () => {
      try {
        setLoading(true);

        const [mainCashRes, pettyCashRes, deliveryCashRes] = await Promise.all([
          api.get('/main-cash-transactions', { params: { per_page: 500 } }),
          api.get('/petty-cash-transactions', { params: { per_page: 500 } }),
          api.get('/delivery-cash-transactions', { params: { per_page: 500 } }),
        ]);

        const cashBook = Array.isArray(mainCashRes.data)
          ? mainCashRes.data
          : (mainCashRes.data?.data?.data || mainCashRes.data?.data || []);

        const pettyCash = Array.isArray(pettyCashRes.data)
          ? pettyCashRes.data
          : (pettyCashRes.data?.data?.data || pettyCashRes.data?.data || []);

        const deliveryCash = Array.isArray(deliveryCashRes.data)
          ? deliveryCashRes.data
          : (deliveryCashRes.data?.data?.data || deliveryCashRes.data?.data || []);

        const [paymentsRes, returnsRes] = await Promise.all([
          api.get('/distribution/payments?per_page=200'),
          api.get('/distribution/returns?per_page=200'),
        ]);

        const payments: DistributionPayment[] =
          paymentsRes?.data?.data?.data || paymentsRes?.data?.data || paymentsRes?.data || [];

        const returns: DistributionReturn[] =
          returnsRes?.data?.data?.data || returnsRes?.data?.data || returnsRes?.data || [];

        const localRows: UnifiedTransaction[] = [
          ...cashBook.map((entry: LocalLedgerEntry) => ({
            id: `cash-${entry.id}`,
            date: entry.date,
            transaction_type: inferLedgerTransactionType(entry, 'Cash Receipt', 'Cash Payment'),
            source: 'Cash Ledger',
            reference: entry.reference || '-',
            note: entry.note || '-',
            credit: entry.type === 'in' ? Number(entry.amount || 0) : 0,
            debit: entry.type === 'out' ? Number(entry.amount || 0) : 0,
          })),
          ...pettyCash.map((entry: LocalLedgerEntry) => ({
            id: `petty-${entry.id}`,
            date: entry.date,
            transaction_type: inferLedgerTransactionType(entry, 'Petty Cash Funding', 'Petty Cash Payment'),
            source: 'Petty Cash Ledger',
            reference: entry.reference || '-',
            note: entry.note || '-',
            credit: entry.type === 'in' ? Number(entry.amount || 0) : 0,
            debit: entry.type === 'out' ? Number(entry.amount || 0) : 0,
          })),
          ...deliveryCash.map((entry: LocalLedgerEntry) => ({
            id: `delivery-${entry.id}`,
            date: entry.date,
            transaction_type: inferLedgerTransactionType(entry, 'Delivery Cash Collection', 'Delivery Cash Payment'),
            source: 'Delivery Cash Ledger',
            reference: entry.reference || '-',
            note: entry.note || '-',
            credit: entry.type === 'in' ? Number(entry.amount || 0) : 0,
            debit: entry.type === 'out' ? Number(entry.amount || 0) : 0,
          })),
        ];

        const paymentRows: UnifiedTransaction[] = (Array.isArray(payments) ? payments : [])
          .filter((payment) => {
            const status = String(payment.status || '').toLowerCase();
            // Only accepted/realized collections should hit the running balance.
            return status === 'received' || status === 'cleared';
          })
          .map((payment) => {
          const method = String(payment.payment_method || '').toLowerCase();
          const transactionType =
            method === 'cash'
              ? 'Cash Payment'
              : method === 'bank_transfer'
                ? 'Bank Payment'
                : method === 'check'
                  ? 'Cheque Deposit'
                  : 'Payment';

          return {
            id: `pay-${payment.id}`,
            date: payment.payment_date || '',
            transaction_type: transactionType,
            source: 'Distribution Payment',
            reference: payment.payment_number || payment.reference_no || '-',
            note:
              `${payment.customer?.shop_name || ''} ${payment.bank_name || ''} ${payment.notes || ''} ${payment.status || ''}`.trim() || '-',
            credit: Number(payment.amount || 0),
            debit: 0,
          };
        });

        const returnRows: UnifiedTransaction[] = (Array.isArray(returns) ? returns : [])
          .filter((ret) => {
            const settlementType = String(ret.settlement_type || '').toLowerCase();
            const status = String(ret.status || '').toLowerCase();
            // Only approved cash refunds are true cash outflows.
            return settlementType === 'cash_refund' && status === 'approved';
          })
          .map((ret) => {
          const text = `${ret.reason || ''} ${ret.notes || ''}`.toLowerCase();
          const amount = Number(ret.settlement_amount || ret.total_amount || 0);
          const transactionType = includesAny(text, ['cheque', 'check'])
            ? 'Cheque Return'
            : ret.settlement_type === 'cash_refund'
              ? 'Cash Refund Return'
              : ret.settlement_type === 'item_exchange'
                ? 'Item Exchange Return'
                : 'Bill Deduction Return';

          return {
            id: `ret-${ret.id}`,
            date: ret.return_date || '',
            transaction_type: transactionType,
            source: 'Distribution Return',
            reference: ret.return_number || '-',
            note: `${ret.customer?.shop_name || ''} ${ret.reason || ''} ${ret.notes || ''}`.trim() || '-',
            credit: 0,
            debit: amount,
          };
        });

        const merged = [...localRows, ...paymentRows, ...returnRows].filter((row) => !!safeDate(row.date));

        const chronological = [...merged].sort((a, b) => safeDate(a.date).localeCompare(safeDate(b.date)));
        let running = 0;
        const withBalance = chronological.map((row) => {
          running += Number(row.credit || 0) - Number(row.debit || 0);
          return {
            ...row,
            balance: typeof row.balance === 'number' ? row.balance : running,
          };
        });

        setTransactions(withBalance.reverse());
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token');
          setToken('');
          router.push('/');
          return;
        }

        console.error('Failed to load transaction book data:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, api, router]);

  const typeOptions = useMemo(() => {
    const map = new Set<string>();
    transactions.forEach((row) => map.add(row.transaction_type));
    return Array.from(map).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter((row) => {
      if (typeFilter !== 'all' && row.transaction_type !== typeFilter) return false;
      if (!term) return true;

      const text = [row.transaction_type, row.source, row.reference, row.note, row.date].join(' ').toLowerCase();
      return text.includes(term);
    });
  }, [transactions, search, typeFilter]);

  const summary = useMemo(() => {
    const totalCredit = filteredRows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
    const totalDebit = filteredRows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    return {
      totalCredit,
      totalDebit,
      net: totalCredit - totalDebit,
    };
  }, [filteredRows]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, pageSize]);

  const totalPages = useMemo(() => {
    const pages = Math.ceil(filteredRows.length / pageSize);
    return pages > 0 ? pages : 1;
  }, [filteredRows.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const exportRows = filteredRows;

  const downloadCsv = () => {
    const escapeCsv = (value: unknown) => {
      const str = String(value ?? '');
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = ['Date', 'Transaction Type', 'Source', 'Reference', 'Note', 'Credit', 'Debit', 'Balance'];
    const rows = exportRows.map((row) => [
      formatDateTime(row.date),
      row.transaction_type,
      row.source,
      row.reference,
      row.note,
      Number(row.credit || 0).toFixed(2),
      Number(row.debit || 0).toFixed(2),
      typeof row.balance === 'number' ? Number(row.balance).toFixed(2) : '',
    ]);

    const csvContent = [header, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-book-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Transaction Book', 40, 34);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 52);

    autoTable(doc, {
      startY: 64,
      head: [['Date', 'Type', 'Source', 'Reference', 'Note', 'Credit', 'Debit', 'Balance']],
      body: exportRows.map((row) => [
        formatDateTime(row.date),
        row.transaction_type,
        row.source,
        row.reference,
        row.note,
        Number(row.credit || 0).toFixed(2),
        Number(row.debit || 0).toFixed(2),
        typeof row.balance === 'number' ? Number(row.balance).toFixed(2) : '',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [14, 116, 144],
      },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index === 5) {
          data.cell.styles.textColor = [5, 150, 105];
        }
        if (data.column.index === 6) {
          data.cell.styles.textColor = [190, 24, 93];
        }
      },
    });

    doc.save(`transaction-book-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!token || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_26%),linear-gradient(180deg,_#f0f9ff_0%,_#ecfeff_45%,_#f0fdfa_100%)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.2),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,_#f0f9ff_0%,_#ecfeff_48%,_#f0fdfa_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute top-16 left-16 h-72 w-72 rounded-full bg-sky-200 mix-blend-multiply blur-2xl"></div>
        <div className="absolute top-28 right-12 h-80 w-80 rounded-full bg-cyan-200 mix-blend-multiply blur-2xl"></div>
        <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-emerald-200 mix-blend-multiply blur-2xl"></div>
      </div>

      <nav className="relative z-10 bg-white/75 backdrop-blur-xl shadow-lg border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center h-auto sm:h-16 py-3 gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <Link href="/dashboard/accounts" className="flex items-center space-x-2 text-gray-700 hover:text-sky-600">
                <span>←</span>
                <span className="font-medium text-sm sm:text-base">Back to Accounts</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
              <span>Transaction Book Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-7">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_24px_90px_-42px_rgba(14,116,144,0.55)] backdrop-blur-xl">
          <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                Unified finance journal
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">Transaction Book</h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
                Unified view for cash payments, bank payments, petty cash, delivery cash, cheque deposits and returns, withdrawals, donations, expenses, and related transactions.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Live backend table data only
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-sky-300/70 bg-gradient-to-br from-sky-500 to-cyan-500 p-5 text-white shadow-lg shadow-sky-300/45">
                <p className="text-xs uppercase tracking-[0.2em] text-white/85">Records</p>
                <p className="mt-2 text-3xl font-bold">{filteredRows.length}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Total Credit</p>
                <p className="mt-2 text-lg font-bold text-emerald-800">{money(summary.totalCredit)}</p>
              </div>
              <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm sm:col-span-3 lg:col-span-1">
                <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Total Debit</p>
                <p className="mt-2 text-lg font-bold text-rose-800">{money(summary.totalDebit)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs text-emerald-700 uppercase font-semibold">Total Credit</p>
            <p className="text-2xl font-bold text-emerald-800">{money(summary.totalCredit)}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs text-rose-700 uppercase font-semibold">Total Debit</p>
            <p className="text-2xl font-bold text-rose-800">{money(summary.totalDebit)}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs text-cyan-700 uppercase font-semibold">Net Balance</p>
            <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-cyan-800' : 'text-rose-800'}`}>{money(summary.net)}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/70 bg-white/90 backdrop-blur-lg shadow-[0_18px_65px_-35px_rgba(14,116,144,0.45)] overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-cyan-50 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction, ref, note"
              className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm"
            >
              <option value="all">All Transaction Types</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value || 25))}
              className="rounded-xl border border-gray-300 text-sm text-black px-3 py-2.5 shadow-sm"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-full border border-amber-300 bg-amber-50 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-100"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                className="rounded-full border border-sky-300 bg-sky-50 text-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-100"
              >
                Download PDF
              </button>
            </div>

            <div className="text-sm text-slate-600 flex items-center md:justify-end">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5">
                Transactions: <span className="font-semibold ml-1">{filteredRows.length}</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-b-2xl">
            <table className="min-w-[1200px] divide-y divide-gray-200">
              <thead className="bg-slate-100/90">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Transaction Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Note</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No transactions found.</td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/45'} transition hover:bg-sky-50/45`}>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(row.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700">{row.transaction_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.source}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.reference || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.note || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{row.credit > 0 ? money(row.credit) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-rose-700">{row.debit > 0 ? money(row.debit) : '-'}</td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${(row.balance || 0) >= 0 ? 'text-cyan-700' : 'text-rose-700'}`}>
                        {typeof row.balance === 'number' ? money(row.balance) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
