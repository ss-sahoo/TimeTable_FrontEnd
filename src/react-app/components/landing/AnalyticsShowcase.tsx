import { motion } from "framer-motion";
import { BarChart3, FileText, FileSpreadsheet, Mail, TrendingUp, AlertTriangle, CheckSquare } from "lucide-react";

const metrics = [
    { label: "Real-time Monitoring", desc: "Live attempt tracking & completion rates" },
    { label: "Score Distribution", desc: "Percentile rankings & cohort trends" },
    { label: "Item Analysis", desc: "Question-wise difficulty breakdown" },
    { label: "Predictive Analytics", desc: "Identify at-risk students early" },
];

const exports = [
    { icon: FileText, label: "PDF Reports" },
    { icon: FileSpreadsheet, label: "Excel/CSV Data" },
    { icon: Mail, label: "Email Automation" },
];

export default function AnalyticsShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        <div className="order-2 lg:order-1">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-2 shadow-2xl transform-gpu perspective-1000"
            >
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/50">
                        <span className="text-xs font-bold text-gray-500">Analytics Dashboard</span>
                        <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                             <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        </div>
                    </div>
                    <div className="p-6">
                        {/* Mock Chart */}
                        <div className="flex items-end gap-2 h-40 mb-8 px-4 border-b border-gray-100 pb-4">
                             {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                                    className="flex-1 bg-blue-50 hover:bg-blue-100 transition-colors rounded-t-sm relative group"
                                 >
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                         Score: {h}
                                     </div>
                                 </motion.div>
                             ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-3 bg-red-50 rounded-lg border border-red-100"
                            >
                                <div className="flex items-center gap-2 text-red-600 mb-1">
                                    <AlertTriangle className="w-4 h-4 fill-current" />
                                    <span className="text-xs font-bold">At Risk</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">12</div>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="p-3 bg-green-50 rounded-lg border border-green-100"
                            >
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-xs font-bold">Avg Score</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">84%</div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        <div className="order-1 lg:order-2">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-6"
            >
                <BarChart3 className="w-3 h-3" /> Data Intelligence
            </motion.div>
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold text-gray-900 mb-6"
            >
                Deep analytics for better decisions.
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-lg mb-8 leading-relaxed"
            >
                Go beyond simple scores. Our analytics engine provides granular insights into student performance, question quality, and institutional trends.
            </motion.p>

            <ul className="space-y-4 mb-10">
                {metrics.map((m, i) => (
                    <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        className="flex items-start gap-3"
                    >
                        <CheckSquare className="shrink-0 mt-0.5 text-blue-600 w-5 h-5 fill-current" />
                        <div>
                            <div className="font-bold text-gray-900 text-sm">{m.label}</div>
                            <div className="text-xs text-gray-500">{m.desc}</div>
                        </div>
                    </motion.li>
                ))}
            </ul>

            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="border-t border-gray-100 pt-8"
            >
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Export Reports As</div>
                <div className="flex gap-4">
                    {exports.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <e.icon className="w-4 h-4 text-gray-400" />
                            {e.label}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>

      </div>
    </section>
  );
}
