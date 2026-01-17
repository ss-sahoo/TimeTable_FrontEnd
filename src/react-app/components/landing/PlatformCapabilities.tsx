import { motion } from "framer-motion";
import { 
    Sparkle, 
    TreeStructure, 
    Monitor, 
    ChartPieSlice, 
    ArrowRight 
} from "@phosphor-icons/react";

const stages = [
    {
        title: "CREATE",
        icon: Sparkle,
        features: ["AI Extract", "Pattern Builder", "Question Bank"],
        metric: "30-60s Extraction",
        color: "blue"
    },
    {
        title: "CONDUCT",
        icon: TreeStructure,
        features: ["Secure Delivery", "Proctoring", "Auto-save"],
        metric: "99.9% Uptime",
        color: "indigo"
    },
    {
        title: "MONITOR",
        icon: Monitor,
        features: ["Real-time Tracking", "Violation Detection", "Live Logs"],
        metric: "Real-time Updates",
        color: "violet"
    },
    {
        title: "ANALYZE",
        icon: ChartPieSlice,
        features: ["Deep Analytics", "Predictive Insights", "Reports"],
        metric: "15+ Metrics Tracked",
        color: "cyan"
    }
];

export default function PlatformCapabilities() {
  return (
    <section className="py-24 bg-blue-50/20 overflow-hidden border-b border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
        >
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter text-gray-900 mb-6">
                Platform Architecture
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
                End-to-end exam management powered by modern technology.
            </p>
        </motion.div>

        <div className="relative">
            {/* Connecting Line (Desktop) */}
            <motion.div 
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200/60 -translate-y-1/2 -z-10"
            ></motion.div>

            <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.2 }
                    }
                }}
                className="grid md:grid-cols-4 gap-8"
            >
                {stages.map((stage, idx) => (
                    <motion.div 
                        key={idx}
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60 } }
                        }}
                        className="relative group"
                    >
                        {/* Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 h-full flex flex-col items-center text-center z-10 transform-gpu hover:-translate-y-2">
                            
                            {/* Icon Header */}
                            <div className={`w-16 h-16 rounded-2xl bg-${stage.color}-50 flex items-center justify-center text-${stage.color}-600 mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                                <stage.icon weight="duotone" size={32} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">{stage.title}</h3>

                            <ul className="space-y-3 mb-8 flex-1 w-full text-left pl-4">
                                {stage.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${stage.color}-500 shrink-0`}></div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            {/* Metric Footer */}
                            <div className={`w-full py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-${stage.color}-600 uppercase tracking-wider`}>
                                {stage.metric}
                            </div>
                        </div>

                        {/* Arrow (Desktop) */}
                        {idx < stages.length - 1 && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + idx * 0.2 }}
                                className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400"
                            >
                                <ArrowRight weight="bold" size={14} />
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </div>

        <div className="mt-16 text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full text-xs font-bold text-green-700 shadow-sm"
            >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                All Systems Operational
            </motion.div>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
    </section>
  );
}
