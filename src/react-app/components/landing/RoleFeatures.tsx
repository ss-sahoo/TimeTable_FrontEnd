import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users, GraduationCap, UserCheck, CheckCircle } from "lucide-react";

const roles = [
    {
        id: "creators",
        label: "Exam Creators",
        icon: UserCheck,
        features: [
            { title: "Smart Question Extraction", desc: "Upload PDFs, DOCX, or images and extract questions with 90%+ accuracy." },
            { title: "Rich Question Editor", desc: "LaTeX support, code syntax highlighting, and media embedding." },
            { title: "Bulk Operations", desc: "Import hundreds of questions at once, batch edit, and tag for organization." },
            { title: "Question Bank", desc: "Reusable library with difficulty levels and topic tagging." }
        ]
    },
    {
        id: "admins",
        label: "Administrators",
        icon: Users,
        features: [
            { title: "Multi-tenant Architecture", desc: "Manage multiple institutes and centers from one central platform." },
            { title: "Role-Based Access", desc: "5 distinct roles: Super Admin, Institute Admin, Exam Admin, Teacher, Student." },
            { title: "Real-time Monitoring", desc: "Track exam attempts live with violation dashboards and system health." },
            { title: "Automated Workflows", desc: "Schedule exams, send invites, and auto-grade MCQs instantly." }
        ]
    },
    {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        features: [
            { title: "Seamless Experience", desc: "Clean, distraction-free interface with intuitive navigation." },
            { title: "Auto-save Protection", desc: "Never lose work with 30-second auto-save intervals." },
            { title: "Instant Results", desc: "Immediate feedback on MCQs with detailed explanations." },
            { title: "Performance Analytics", desc: "Track progress, identify strengths, and compare with peers." }
        ]
    },
    {
        id: "proctors",
        label: "Proctors",
        icon: User,
        features: [
            { title: "Advanced Monitoring", desc: "Webcam capture, face detection, multiple person alerts." },
            { title: "Violation Management", desc: "Configurable thresholds and auto-disqualification." },
            { title: "Manual Evaluation", desc: "Grade subjective questions with rubrics and partial marking." },
            { title: "Quality Assurance", desc: "Review flagged attempts and generate audit reports." }
        ]
    }
];

export default function RoleFeatures() {
    const [activeTab, setActiveTab] = useState("creators");

    return (
        <section className="py-24 bg-gray-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built for every stakeholder</h2>
                    <p className="text-gray-500">A unified platform that empowers everyone in the examination lifecycle.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setActiveTab(role.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                                activeTab === role.id 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                        >
                            <role.icon className="w-4 h-4" />
                            {role.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {roles.map((role) => (
                            role.id === activeTab && (
                                <motion.div 
                                    key={role.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid md:grid-cols-2 gap-12 items-center"
                                >
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {role.features.map((feature, idx) => (
                                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                                    <CheckCircle className="w-5 h-5 fill-current" />
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Abstract Visual Representation */}
                                    <div className="hidden md:flex h-full min-h-[300px] bg-blue-600 rounded-2xl p-8 text-white flex-col justify-center relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-bold mb-4">Empowering {role.label}</h3>
                                            <p className="text-blue-100 leading-relaxed mb-8">
                                                Streamlined workflows designed specifically for the needs of modern {role.label.toLowerCase()}.
                                            </p>
                                            <div className="inline-flex items-center gap-2 text-xs font-mono bg-blue-500/30 rounded-lg px-3 py-2 border border-blue-400/30">
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                                Role: {role.id.toUpperCase()}_ACCESS
                                            </div>
                                        </div>
                                        
                                        {/* Decorative Background */}
                                        <div className="absolute right-0 bottom-0 opacity-10">
                                            <role.icon className="w-64 h-64" />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
