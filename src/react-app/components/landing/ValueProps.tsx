import { motion } from "framer-motion";
import { Bot, ShieldCheck, TrendingUp } from "lucide-react";

const pillars = [
    {
        icon: Bot,
        title: "AI-Powered Efficiency",
        desc: "Save 90% of question creation time. Our Gemini AI extracts questions from PDFs, Word docs, and images automatically.",
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        icon: ShieldCheck,
        title: "Uncompromising Security",
        desc: "Multi-layer proctoring with webcam monitoring, tab-switch detection, and fullscreen enforcement ensures integrity.",
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    {
        icon: TrendingUp,
        title: "Actionable Insights",
        desc: "Deep analytics with predictive modeling and performance forecasting to identify at-risk students early.",
        color: "text-cyan-600",
        bg: "bg-cyan-50"
    }
];

export default function ValueProps() {
  return (
    <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
            <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.2
                        }
                    }
                }}
                className="grid md:grid-cols-3 gap-8"
            >
                {pillars.map((pillar, idx) => (
                    <motion.div 
                        key={idx}
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
                        }}
                        whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
                        className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-blue-100 transition-all duration-300 group"
                    >
                        <motion.div 
                            whileHover={{ rotate: [0, 5, -5, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className={`w-14 h-14 ${pillar.bg} rounded-xl flex items-center justify-center ${pillar.color} mb-6`}
                        >
                            <pillar.icon className="w-8 h-8" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{pillar.title}</h3>
                        <p className="text-gray-500 leading-relaxed">
                            {pillar.desc}
                        </p>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    </section>
  );
}
