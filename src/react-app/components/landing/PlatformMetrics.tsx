import { motion } from "framer-motion";
import { 
    Sparkle, 
    ShieldCheck, 
    BarChart3, 
    Building2, 
    Zap, 
    RefreshCw 
} from "lucide-react";

const metrics = [
    {
        icon: Sparkle,
        title: "AI-Powered",
        value: "90%+",
        subtitle: "Extraction accuracy",
        color: "blue",
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        icon: ShieldCheck,
        title: "Secure",
        value: "8",
        subtitle: "Security layers",
        color: "green",
        gradient: "from-green-500 to-emerald-500"
    },
    {
        icon: BarChart3,
        title: "Analytics",
        value: "15+",
        subtitle: "Metrics tracked",
        color: "purple",
        gradient: "from-purple-500 to-pink-500"
    },
    {
        icon: Building2,
        title: "Multi-tenant",
        value: "5",
        subtitle: "User roles",
        color: "indigo",
        gradient: "from-indigo-500 to-blue-500"
    },
    {
        icon: Zap,
        title: "Fast",
        value: "30-60s",
        subtitle: "Processing time",
        color: "yellow",
        gradient: "from-yellow-500 to-orange-500"
    },
    {
        icon: RefreshCw,
        title: "Auto-save",
        value: "30s",
        subtitle: "Save interval",
        color: "cyan",
        gradient: "from-cyan-500 to-blue-500"
    }
];

export default function PlatformMetrics() {
  return (
    <section className="py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 uppercase tracking-widest mb-6"
            >
                <Sparkle className="w-4 h-4" />
                Platform Capabilities
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Platform at a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Glance</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                Powerful features for modern exam management with intelligent automation and enterprise-grade security.
            </p>
        </motion.div>

        <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {metrics.map((metric, idx) => (
                <motion.div 
                    key={idx}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="group relative"
                >
                    {/* Card */}
                    <div className="relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-transparent hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 h-full overflow-hidden">
                        
                        {/* Gradient Background on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        
                        {/* Icon with Gradient Background */}
                        <div className="relative mb-6">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${metric.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                                    <metric.icon className={`w-8 h-8 text-${metric.color}-600`} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                {metric.title}
                            </h3>
                            
                            <div className={`text-5xl font-extrabold bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent mb-3 group-hover:scale-105 transition-transform duration-300`}>
                                {metric.value}
                            </div>
                            
                            <p className="text-sm text-gray-600 font-medium">
                                {metric.subtitle}
                            </p>
                        </div>

                        {/* Decorative Corner */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-300 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                    </div>
                </motion.div>
            ))}
        </motion.div>

        {/* Bottom Badge */}
        <div className="mt-20 text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-lg shadow-gray-900/5"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-gray-700">Production-ready</span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <span className="text-sm font-medium text-gray-500">Scalable</span>
                <div className="w-px h-4 bg-gray-200"></div>
                <span className="text-sm font-medium text-gray-500">Secure</span>
            </motion.div>
        </div>
      </div>
    </section>
  );
}
