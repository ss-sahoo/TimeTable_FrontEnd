import { motion } from "framer-motion";
import { Building2, Users, Layers, ArrowRight, CheckCircle, Repeat } from "lucide-react";

const features = [
    {
        title: "Institute Management",
        icon: Building2,
        color: "text-blue-600",
        bg: "bg-blue-50",
        items: [
            "Multi-tenant architecture",
            "Institute & center management",
            "Domain-based authentication",
            "Role-based access control (5 roles)"
        ]
    },
    {
        title: "User Management",
        icon: Users,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        items: [
            "Bulk user creation (teachers & students)",
            "Email domain validation",
            "JWT-based authentication",
            "Profile management"
        ]
    },
    {
        title: "Batch & Program",
        icon: Layers,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        items: [
            "Program and batch creation",
            "Student-batch assignments",
            "Teacher-batch assignments",
            "Batch-wise analytics"
        ]
    }
];

export default function Integrations() {
  return (
    <section className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
           <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-6"
            >
                <Repeat className="w-3 h-3" /> Seamless Integration
            </motion.div>
            
           <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
             Works with your <span className="text-blue-600">existing workflow.</span>
           </h2>
           <p className="text-lg text-gray-500 leading-relaxed">
             No need to rip and replace. DashoExams integrates with your current systems through our flexible architecture and secure REST API.
           </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-100 transition-all duration-300 group"
                >
                    <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-6">{feature.title}</h3>
                    
                    <ul className="space-y-4">
                        {feature.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                <CheckCircle className={`shrink-0 mt-0.5 ${feature.color} opacity-60 group-hover:opacity-100 transition-opacity w-4 h-4 fill-current`} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            ))}
        </div>

        {/* API CTA */}
        <div className="mt-16 text-center">
            <button className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors group">
                Explore the Management API <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

      </div>
    </section>
  );
}
