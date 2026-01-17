import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, CaretRight } from "@phosphor-icons/react";
import { Sparkle, TreeStructure, ChartLineUp } from "@phosphor-icons/react";

const steps = [
    {
        id: 1,
        title: "Create & Extract",
        desc: "Upload PDFs, Word docs, or images. Our Gemini AI automatically extracts questions, detects subjects, and classifies types.",
        icon: Sparkle,
        details: {
            headline: "AI-Powered Extraction Engine",
            items: [
                "Drag-and-drop file upload (PDF, DOCX, Images)",
                "AI extracts questions in 30-60 seconds",
                "Automatic subject detection (Physics, Chem, Math)",
                "Question type classification (MCQ, Numerical)",
                "Real-time progress monitoring"
            ]
        }
    },
    {
        id: 2,
        title: "Map & Validate",
        desc: "Review extracted questions and map them to your exam sections. Intelligent tracking prevents overflow or shortages.",
        icon: TreeStructure,
        details: {
            headline: "Intelligent Pattern Mapping",
            items: [
                "Pattern structure tree with capacity indicators",
                "Subject-wise question grouping & reasoning",
                "Drag-and-drop mapping interface",
                "Overflow/shortage detection alerts",
                "Bulk assignment capabilities"
            ]
        }
    },
    {
        id: 3,
        title: "Conduct & Analyze",
        desc: "Launch secure exams with full proctoring. Track attempts live and get instant, predictive analytics.",
        icon: ChartLineUp,
        details: {
            headline: "Secure Delivery & Analytics",
            items: [
                "Secure exam delivery (Authenticated/Public)",
                "Real-time proctoring with violation tracking",
                "Auto-save every 30 seconds",
                "Instant MCQ grading & feedback",
                "Export reports (CSV, Excel, PDF)"
            ]
        }
    }
];

export default function ProcessSteps() {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <section className="py-24 bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 text-center md:text-left">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Our process</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple steps, powerful results.</h2>
                    <p className="text-gray-500 max-w-xl">
                        We've simplified exam management into three clear steps that take you from question creation to actionable insights.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left: Interactive Steps List */}
                    <div className="space-y-4">
                        {steps.map((step) => (
                            <div 
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group ${
                                    activeStep === step.id 
                                    ? "bg-blue-50 border-blue-600 shadow-sm" 
                                    : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50"
                                }`}
                            >
                                <div className="flex gap-6 items-start relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        activeStep === step.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-blue-500"
                                    }`}>
                                        <step.icon weight="fill" size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${
                                                activeStep === step.id ? "text-blue-600" : "text-gray-400"
                                            }`}>Step 0{step.id}</span>
                                        </div>
                                        <h3 className={`text-xl font-bold mb-2 transition-colors ${
                                            activeStep === step.id ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"
                                        }`}>{step.title}</h3>
                                        <p className={`text-sm leading-relaxed transition-colors ${
                                            activeStep === step.id ? "text-gray-600" : "text-gray-400"
                                        }`}>
                                            {step.desc}
                                        </p>
                                    </div>
                                    
                                    {activeStep === step.id && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-600 pr-6 hidden sm:block">
                                            <CaretRight weight="bold" size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Dynamic Details Panel */}
                    <div className="relative h-full min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {steps.map((step) => (
                                activeStep === step.id && (
                                    <motion.div 
                                        key={step.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-gray-900 rounded-2xl p-8 h-full shadow-2xl relative overflow-hidden text-white flex flex-col"
                                    >
                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2"></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <step.icon weight="duotone" size={20} />
                                                </div>
                                                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">What happens</div>
                                            </div>

                                            <h3 className="text-2xl font-bold mb-8 text-white">
                                                {step.details.headline}
                                            </h3>

                                            <ul className="space-y-4">
                                                {step.details.items.map((item, i) => (
                                                    <motion.li 
                                                        key={i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="flex items-start gap-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
                                                    >
                                                        <CheckCircle weight="fill" className="text-green-500 mt-1 shrink-0" size={16} />
                                                        <span className="text-sm font-medium text-gray-300">{item}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            Process_ID: {step.id}_ACTIVE
                                        </div>
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
