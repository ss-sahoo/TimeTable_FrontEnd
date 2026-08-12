import React, { useState, useEffect } from 'react';
import { api } from '../../hooks/useApi';
import { IndianRupee, CreditCard, Clock, FileText, CheckCircle2, AlertCircle, Download, ExternalLink, X, Printer } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SuperAdminBilling() {
    const [billingData, setBillingData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    useEffect(() => {
        fetchBillingInfo();
    }, []);

    const fetchBillingInfo = async () => {
        try {
            const res = await api.get('/billing/my-billing/');
            setBillingData(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch billing information");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading billing details...</div>;

    if (!billingData) return <div className="p-8 text-center text-slate-500">No billing information found for your institute.</div>;

    const { pricing, invoices } = billingData;
    const fmt = (v: any) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Billing & Finance</h1>
                    <p className="text-slate-500">Manage your institute's active pricing plans and view invoice history</p>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                            Active Subscriptions & Pricing
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">These are the rates applied to your usage this month</p>
                    </div>
                </div>

                <div className="p-6">
                    {pricing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <PricingCard title="Student Onboarding" amt={pricing.per_student_onboarding_fee} desc="One-time fee per new student" />
                            <PricingCard title="Monthly Active Student" amt={pricing.per_active_student_monthly_fee} desc="Per active student per month" />
                            <PricingCard title="Exam Session" amt={pricing.per_exam_session_fee} desc="Per standard exam attempt" />
                            <PricingCard title="AI Proctoring" amt={pricing.per_proctoring_session_fee} desc="Per proctored session" />
                            <PricingCard title="Re-exam Session" amt={pricing.per_re_exam_fee} desc="Per re-exam attempt" />
                            <PricingCard title="Storage Space" amt={pricing.storage_per_gb_fee} desc="Per GB of storage used" />
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-50 rounded-lg text-slate-500 border border-slate-200 border-dashed">
                            No active custom pricing plans. Default platform rates apply.
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                            Invoice History
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">View and download your past invoices</p>
                    </div>
                </div>

                {invoices && invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Invoice Details</th>
                                    <th className="px-6 py-4 text-left font-semibold">Period</th>
                                    <th className="px-6 py-4 text-right font-semibold">Amount</th>
                                    <th className="px-6 py-4 text-center font-semibold">Status</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((inv: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{inv.invoice_number || '---'}</div>
                                            <div className="text-xs text-slate-500 flex items-center mt-1">
                                                <Clock className="w-3.5 h-3.5 mr-1" />
                                                Due: {inv.due_date || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {inv.billing_period_start || '---'} to {inv.billing_period_end || '---'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            <div className="flex items-center justify-end">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                {inv.total_amount || '0.00'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {inv.status === 'PAID' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900">No Invoices Yet</p>
                        <p className="max-w-md mt-1">You haven't been billed for any usage yet. Invoices will automatically appear here once generated.</p>
                    </div>
                )}
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Invoice Details</h3>
                                <p className="text-xs text-slate-400 font-bold tracking-widest">{selectedInvoice.invoice_number}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-10 max-h-[75vh] overflow-y-auto">
                            {/* Professional Header */}
                            <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-dashed border-slate-100">
                                <div>
                                    <div className="text-indigo-600 font-black text-2xl mb-1 italic">DashoExams Global</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Digital Assessment Platform</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs px-3 py-1 rounded-full font-black uppercase mb-3 inline-block ${selectedInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {selectedInvoice.status === 'PAID' ? 'Status: PAID' : 'Status: UNPAID'}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">Due: {selectedInvoice.due_date}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8 text-sm">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                                        <p className="font-black text-slate-900 text-lg uppercase">{selectedInvoice.institute_name}</p>
                                        <p className="text-slate-500 font-medium mt-1 leading-relaxed">{selectedInvoice.institute_address || 'Address not listed'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Period</p>
                                        <p className="font-black text-slate-900">{selectedInvoice.billing_period_start} — {selectedInvoice.billing_period_end}</p>
                                    </div>
                                </div>

                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900/5">
                                            <th className="py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Description</th>
                                            <th className="py-4 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedInvoice.line_items?.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-4 whitespace-pre-wrap font-medium text-slate-600 italic leading-snug">{item.description}</td>
                                                <td className="py-4 text-right font-black text-slate-900">₹{fmt(item.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="flex justify-end pt-6">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{fmt(selectedInvoice.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Tax (GST)</span>
                                            <span>₹{fmt(selectedInvoice.tax_amount)}</span>
                                        </div>
                                        <div className="flex justify-between py-4 text-lg font-black bg-slate-900 text-white px-5 rounded-2xl shadow-xl shadow-slate-900/10">
                                            <span>Total Due</span>
                                            <span>₹{fmt(selectedInvoice.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PricingCard({ title, amt, desc }: { title: string, amt: string | number, desc: string }) {
    return (
        <div className="bg-white border text-center border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="font-bold text-slate-800 mb-3 text-sm">{title}</h3>
            <div className="flex items-center justify-center font-bold text-3xl text-slate-900 mb-2">
                <IndianRupee className="w-6 h-6 mr-1 text-slate-400" />
                {amt}
            </div>
            <p className="text-xs text-slate-500 font-medium">{desc}</p>
        </div>
    );
}
