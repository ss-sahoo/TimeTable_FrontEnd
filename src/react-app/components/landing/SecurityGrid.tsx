import { motion } from "framer-motion";
import { 
    Maximize2, 
    Copy, 
    Layout, 
    Video, 
    Wifi, 
    ClipboardList,
    CheckCircle
} from "lucide-react";

const securityFeatures = [
    { icon: Maximize2, title: "Fullscreen Enforcement", desc: "Mandatory fullscreen mode with exit detection." },
    { icon: Copy, title: "Copy-Paste Prevention", desc: "Complete clipboard blocking and clearing." },
    { icon: Layout, title: "Tab Switch Detection", desc: "Track and log every focus loss event." },
    { icon: Video, title: "Webcam Proctoring", desc: "AI face recognition & attention tracking." },
    { icon: Wifi, title: "Network Monitoring", desc: "Connection status tracking with offline detection." },
    { icon: ClipboardList, title: "Violation Logging", desc: "Comprehensive audit trail with timestamps." },
];

const questionTypes = [
    "Single Correct MCQ",
    "Multiple Correct MCQ",
    "Numerical Answer",
    "Subjective Text",
    "True/False",
    "Fill in the Blanks"
];

export default function SecurityGrid() {
  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Security Section */}
        <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Uncompromising Security</h2>
                <p className="text-gray-400">Enterprise-grade protection for high-stakes assessments.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {securityFeatures.map((feat, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -5 }}
                        className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <feat.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold">{feat.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400 pl-14">
                            {feat.desc}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Question Types Banner */}
        <div className="border-t border-gray-800 pt-16">
            <div className="text-center mb-10">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Supported Formats</span>
                <h3 className="text-2xl font-bold mt-2">Flexible Question Types</h3>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
                {questionTypes.map((type, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 text-green-500 fill-current" />
                        {type}
                    </div>
                ))}
            </div>
        </div>

      </div>
    </section>
  );
}
