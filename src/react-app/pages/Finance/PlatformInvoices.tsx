import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../hooks/useApi';
import {
    IndianRupee, CheckCircle2, AlertCircle, Calendar, Download, XCircle,
    Sliders, Building2, Plus, RefreshCw, ChevronRight, ArrowLeft, Save,
    Users, BarChart2, Zap, HardDrive, RepeatIcon, FileText, X, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';

// ── Types ──────────────────────────────────────────────
interface Institute { id: number | string; name: string; email?: string; contact_email?: string; }
interface LineItem { id: string; description: string; quantity: number; unit_price: string; total_price: string; }
interface Invoice {
    id: string; invoice_number: string; institute: number | string;
    institute_name: string; institute_email: string;
    billing_period_start: string; billing_period_end: string;
    subtotal: string; tax_amount: string; total_amount: string;
    is_paid: boolean; paid_at: string | null; due_date: string;
    line_items: LineItem[]; status: 'PAID' | 'SENT'; created_at: string;
}
interface Pricing {
    id?: string; institute: number | string;
    per_student_onboarding_fee: string;
    per_active_student_monthly_fee: string;
    per_exam_session_fee: string;
    per_re_exam_fee: string;
    platform_commission_percentage: string;
    per_proctoring_session_fee: string;
    storage_per_gb_fee: string;
}

type Tab = 'invoices' | 'pricing' | 'generate';

// ── Helper ─────────────────────────────────────────────
const fmt = (n?: string | number) =>
    n !== undefined && n !== null
        ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';

// ── Main Component ─────────────────────────────────────
export default function PlatformInvoices() {
    const [activeTab, setActiveTab] = useState<Tab>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [globalPricing, setGlobalPricing] = useState<Pricing | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Pricing editor
    const [pricingForm, setPricingForm] = useState<Partial<Pricing>>({});

    // Invoice Generator
    const [genInstituteId, setGenInstituteId] = useState('');
    const [gstRate, setGstRate] = useState('18');
    const [extraRows, setExtraRows] = useState<{ label: string; amount: string }[]>([]);

    const addExtraRow = () => setExtraRows([...extraRows, { label: '', amount: '0' }]);
    const removeExtraRow = (idx: number) => setExtraRows(extraRows.filter((_, i) => i !== idx));
    const updateExtraRow = (idx: number, field: 'label' | 'amount', val: string) => {
        const next = [...extraRows];
        next[idx][field] = val;
        setExtraRows(next);
    };

    // ── Fetch helpers ──
    const fetchInvoices = useCallback(async () => {
        try {
            const res = await api.get('/billing/platform-invoices/');
            const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setInvoices(list);
            if (list.length > 0 && !selectedInvoice) setSelectedInvoice(list[0]);
        } catch { toast.error('Failed to fetch invoices'); }
    }, []);

    const fetchInstitutes = useCallback(async () => {
        try {
            const res = await api.get('/auth/platform/institutes/');
            const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setInstitutes(list);
        } catch (e: any) {
            console.error('Failed to fetch institutes:', e?.response?.status, e?.response?.data);
        }
    }, []);

    const fetchGlobalPricing = useCallback(async () => {
        try {
            const res = await api.get('/billing/global-pricing/current/');
            setGlobalPricing(res.data);
            setPricingForm(res.data);
        } catch { toast.error('Failed to fetch global pricing'); }
    }, []);

    useEffect(() => {
        Promise.all([fetchInvoices(), fetchInstitutes(), fetchGlobalPricing()]).finally(() => setLoading(false));
    }, []);

    // ── Pricing Editor ──
    const saveGlobalPricing = async () => {
        setSaving(true);
        try {
            await api.patch('/billing/global-pricing/current/', pricingForm);
            toast.success('Global pricing updated successfully!');
            await fetchGlobalPricing();
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Failed to save pricing');
        } finally { setSaving(false); }
    };

    // ── Generate Invoice ──
    const generateInvoice = async () => {
        if (!genInstituteId) return;
        setGenerating(true);
        try {
            const res = await api.post('/billing/platform-invoices/generate_invoice/', {
                institute_id: genInstituteId,
                gst_rate: gstRate,
                extra_rows: extraRows.filter(r => r.label && Number(r.amount) !== 0)
            });
            toast.success('Invoice generated successfully!');
            await fetchInvoices();
            setSelectedInvoice(res.data);
            setActiveTab('invoices');
            // Reset
            setExtraRows([]);
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to generate invoice');
        } finally { setGenerating(false); }
    };

    // ── Mark Paid / Unpaid ──
    const handleMarkPaid = async () => {
        if (!selectedInvoice) return;
        try {
            await api.post(`/billing/platform-invoices/${selectedInvoice.id}/mark_paid/`);
            toast.success('Invoice marked as paid');
            await fetchInvoices();
            setSelectedInvoice(prev => prev ? { ...prev, status: 'PAID', is_paid: true } : null);
        } catch { toast.error('Failed to update invoice'); }
    };

    const handleMarkUnpaid = async () => {
        if (!selectedInvoice) return;
        try {
            await api.post(`/billing/platform-invoices/${selectedInvoice.id}/mark_unpaid/`);
            toast.success('Invoice marked as unpaid');
            await fetchInvoices();
            setSelectedInvoice(prev => prev ? { ...prev, status: 'SENT', is_paid: false } : null);
        } catch { toast.error('Failed to update invoice'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
        { key: 'pricing', label: 'Global Platform Rates', icon: Sliders },
        { key: 'generate', label: 'Generate Invoice', icon: Plus },
    ];

    return (
        <div className="space-y-0">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Billing & Finance</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage global rates and invoices for all institutes</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchInvoices(); fetchGlobalPricing(); fetchInstitutes(); }}
                        className="px-3 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button
                        onClick={() => setActiveTab('generate')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Generate Invoice
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 mb-6 gap-1">
                {tabs.map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === key
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {count !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                }`}>{count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB: INVOICES ── */}
            {activeTab === 'invoices' && (
                <div className="flex gap-5" style={{ height: 'calc(100vh - 260px)' }}>
                    {/* Left: Invoice List */}
                    <div className="w-80 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{invoices.length} Invoices</p>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm">No invoices yet</p>
                                </div>
                            ) : invoices.map(inv => (
                                <button
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${selectedInvoice?.id === inv.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-900">{inv.invoice_number || '---'}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>{inv.status || 'SENT'}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium truncate">{inv.institute_name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {inv.due_date || 'N/A'}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 flex items-center">
                                            <IndianRupee className="w-3 h-3" />{fmt(inv.total_amount)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Invoice Detail */}
                    {selectedInvoice ? (
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            {/* Action Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{selectedInvoice.invoice_number}</h2>
                                    <p className="text-xs text-slate-500">{selectedInvoice.institute_name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedInvoice.status === 'PAID' ? (
                                        <button onClick={handleMarkUnpaid} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <XCircle className="w-3.5 h-3.5" />Cancel Payment
                                        </button>
                                    ) : (
                                        <button onClick={handleMarkPaid} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5" />Mark Paid
                                        </button>
                                    )}
                                    <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                                        <Download className="w-3.5 h-3.5" />Save PDF
                                    </button>
                                </div>
                            </div>

                            {/* Summary strip */}
                            <div className="flex items-center gap-8 px-6 py-2.5 border-b border-slate-100 bg-white text-xs font-semibold">
                                <div className="text-slate-500">Period: <span className="text-slate-800">{selectedInvoice.billing_period_start} – {selectedInvoice.billing_period_end}</span></div>
                                <div className="text-slate-500">Due: <span className="text-slate-800">{selectedInvoice.due_date || 'N/A'}</span></div>
                                <div className="ml-auto flex items-center gap-6">
                                    <div className="text-slate-500">Paid: <span className="text-emerald-600 font-bold">₹{selectedInvoice.status === 'PAID' ? fmt(selectedInvoice.total_amount) : '0.00'}</span></div>
                                    <div className="text-slate-500">Due: <span className="text-red-500 font-bold">₹{selectedInvoice.status !== 'PAID' ? fmt(selectedInvoice.total_amount) : '0.00'}</span></div>
                                    <div className="text-slate-900 font-bold text-sm">TOTAL: ₹{fmt(selectedInvoice.total_amount)}</div>
                                </div>
                            </div>

                            {/* Invoice Paper */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                                <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-md p-10 rounded-sm">
                                    {/* Invoice Header */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <div className="text-xl font-black text-indigo-600 tracking-tight mb-1">DashoExams Global</div>
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                <p>HIG 306, K5, kalinga Vihar, Bhubaneswar, Khordha</p>
                                                <p>GSTIN: 29ABCD1234F1Z5</p>
                                                <p>billing@dashoexams.com</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-light text-slate-300 tracking-widest mb-2">TAX INVOICE</div>
                                            {selectedInvoice.status === 'PAID' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                                                    <AlertCircle className="w-3.5 h-3.5" /> UNPAID
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bill To + Details */}
                                    <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
                                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                            <div className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1.5">Bill To</div>
                                            <p className="font-bold text-slate-800 text-sm">{selectedInvoice.institute_name || '---'}</p>
                                            <p className="text-slate-500 mt-0.5">{selectedInvoice.institute_email || '---'}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                            <div className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1.5">Invoice Details</div>
                                            <table className="w-full">
                                                <tbody className="text-slate-600 space-y-1">
                                                    <tr><td className="py-0.5">Invoice #:</td><td className="text-right font-semibold text-slate-900">{selectedInvoice.invoice_number}</td></tr>
                                                    <tr><td className="py-0.5">Date:</td><td className="text-right font-semibold text-slate-900">{selectedInvoice.billing_period_start}</td></tr>
                                                    <tr><td className="py-0.5">Due Date:</td><td className="text-right font-semibold text-slate-900">{selectedInvoice.due_date}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Line Items Table */}
                                    <table className="w-full text-xs mb-6">
                                        <thead>
                                            <tr className="bg-slate-900 text-white rounded-t">
                                                <th className="py-2.5 px-3 text-left font-semibold rounded-tl">#</th>
                                                <th className="py-2.5 px-3 text-left font-semibold">Description</th>
                                                <th className="py-2.5 px-3 text-right font-semibold">Qty</th>
                                                <th className="py-2.5 px-3 text-right font-semibold">Rate (₹)</th>
                                                <th className="py-2.5 px-3 text-right font-semibold rounded-tr">Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedInvoice.line_items || []).length > 0 ? (
                                                selectedInvoice.line_items.map((item, i) => (
                                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-semibold text-slate-900">{(item.description || '').split('\n')[0]}</div>
                                                            {(item.description || '').split('\n').slice(1).join(' ') && (
                                                                <div className="text-slate-400 text-[10px] mt-0.5">{(item.description || '').split('\n').slice(1).join(' ')}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td>
                                                        <td className="py-3 px-3 text-right text-slate-600">{fmt(item.unit_price)}</td>
                                                        <td className="py-3 px-3 text-right font-semibold text-slate-900">{fmt(item.total_price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-6 text-center text-slate-400 italic text-xs">No line items</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Totals */}
                                    <div className="flex justify-end">
                                        <div className="w-56">
                                            <div className="flex justify-between py-1.5 text-xs border-b border-slate-100">
                                                <span className="text-slate-500">Subtotal</span>
                                                <span className="font-medium text-slate-900">₹{fmt(selectedInvoice.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between py-1.5 text-xs border-b border-slate-100">
                                                <span className="text-slate-500">GST (18%)</span>
                                                <span className="font-medium text-slate-900">₹{fmt(selectedInvoice.tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between py-2.5 text-sm font-bold bg-slate-900 text-white px-3 rounded mt-1">
                                                <span>Total Due</span>
                                                <span>₹{fmt(selectedInvoice.total_amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="font-medium">Select an invoice to preview</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: PRICING ── */}
            {activeTab === 'pricing' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Global Platform Pricing</h3>
                            <p className="text-xs text-slate-400">These rates apply to all institutes across the platform</p>
                        </div>
                        <button
                            onClick={saveGlobalPricing}
                            disabled={saving}
                            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving…' : 'Update All Rates'}
                        </button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { key: 'per_student_onboarding_fee', label: 'Onboarding Fee (Per Student)', icon: Users, desc: 'Charged once for each new student registered' },
                            { key: 'per_active_student_monthly_fee', label: 'Active Fee (Per Student/Month)', icon: BarChart2, desc: 'Per student appearing in ≥1 exam per month' },
                            { key: 'per_exam_session_fee', label: 'Exam Fee (Per Session)', icon: Zap, desc: 'Cost per standard subject exam attempt' },
                            { key: 'per_re_exam_fee', label: 'Re-Exam Fee (Per Attempt)', icon: RepeatIcon, desc: 'Cost per re-exam session attempt' },
                            { key: 'per_proctoring_session_fee', label: 'AI Proctoring (Per Session)', icon: FileText, desc: 'Cost per proctored exam session' },
                            { key: 'storage_per_gb_fee', label: 'Cloud Storage (Per GB/Month)', icon: HardDrive, desc: 'Cloud storage used by snapshots, PDFs, etc.' },
                            { key: 'platform_commission_percentage', label: 'Revenue Share Commission (%)', icon: IndianRupee, desc: 'Platform\'s cut from student course fees' },
                        ].map(({ key, label, icon: Icon, desc }) => (
                            <div key={key} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                        <Icon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{label}</p>
                                        <p className="text-[11px] text-slate-400 leading-tight">{desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center border-2 border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-indigo-400 transition-colors">
                                    <span className="px-4 py-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 font-bold">
                                        {key === 'platform_commission_percentage' ? '%' : '₹'}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={(pricingForm as any)[key] ?? '0.00'}
                                        onChange={e => setPricingForm(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="flex-1 px-4 py-3 text-base text-slate-900 font-bold focus:outline-none bg-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-8 py-5 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Note:</strong> Updating these rates will affect all <strong>future</strong> invoices generated for every institute on the platform. Existing invoices will not be modified.
                        </p>
                    </div>
                </div>
            )}

            {/* ── TAB: GENERATE INVOICE ── */}
            {activeTab === 'generate' && (
                <div className="max-w-lg mx-auto">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-base">Generate Institute Invoice</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Scans all un-billed usage metrics for the selected institute and applies the global rates.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Institute *</label>
                                    <select
                                        value={genInstituteId}
                                        onChange={e => setGenInstituteId(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    >
                                        <option value="">— Choose —</option>
                                        {institutes.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Rate (%)</label>
                                    <input
                                        type="number"
                                        value={gstRate}
                                        onChange={e => setGstRate(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Extra Rows */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-700">Custom Charges / Discounts</label>
                                    <button
                                        onClick={addExtraRow}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Row
                                    </button>
                                </div>
                                {extraRows.map((row, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            placeholder="Description (e.g. Setup Fee)"
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                                            value={row.label}
                                            onChange={e => updateExtraRow(i, 'label', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                                            value={row.amount}
                                            onChange={e => updateExtraRow(i, 'amount', e.target.value)}
                                        />
                                        <button onClick={() => removeExtraRow(i)} className="text-slate-300 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {globalPricing && (
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800">
                                    <p className="font-bold mb-3 flex items-center gap-2 text-sm text-emerald-900">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        Current Global Rates
                                    </p>
                                    <div className="grid grid-cols-2 gap-y-2 text-emerald-700">
                                        <span>Onboarding Price:</span><span className="font-bold text-right text-emerald-900">₹{fmt(globalPricing.per_student_onboarding_fee)} / student</span>
                                        <span>Monthly Active Price:</span><span className="font-bold text-right text-emerald-900">₹{fmt(globalPricing.per_active_student_monthly_fee)} / student</span>
                                        <span>Exam Session Price:</span><span className="font-bold text-right text-emerald-900">₹{fmt(globalPricing.per_exam_session_fee)} / session</span>
                                        <span>Re-Exam Price:</span><span className="font-bold text-right text-emerald-900">₹{fmt(globalPricing.per_re_exam_fee)} / session</span>
                                        <span>AI Proctoring Price:</span><span className="font-bold text-right text-emerald-900">₹{fmt(globalPricing.per_proctoring_session_fee)} / session</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={generateInvoice}
                                disabled={generating || !genInstituteId}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {generating ? 'Generating Invoice…' : 'Generate Invoice Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
