import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { LockKeyhole } from "lucide-react";
import { Link } from "react-router";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

export default function Hero() {
  return (
    <section className="pt-32 pb-24 bg-white relative overflow-hidden flex flex-col items-center">
      {/* Detailed Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Animated Background Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500/20 blur-[100px]"
      ></motion.div>
      <motion.div 
        animate={{ 
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute right-[20%] top-[10%] -z-10 h-[200px] w-[200px] rounded-full bg-cyan-400/20 opacity-20 blur-[80px]"
      ></motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-6 text-center relative z-10 mb-16"
      >
        <motion.div 
          variants={item}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 mb-8 shadow-sm hover:border-blue-200 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="uppercase tracking-widest">Powered by Gemini AI</span>
        </motion.div>

        <motion.h1 
          variants={item}
          className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-gray-900 mb-6 leading-[0.95] px-4"
        >
          Transform Your Exam <br className="hidden sm:block" /> Management with <br className="hidden sm:block" />
          <span className="text-blue-600">AI-Powered Intelligence</span>
        </motion.h1>

        <motion.p 
          variants={item}
          className="text-sm sm:text-base text-gray-500 mb-10 leading-relaxed max-w-xl mx-auto font-medium px-4"
        >
          End-to-end digital examination platform for educational institutions, corporate training centers, and online learning platforms. Create, conduct, and analyze exams with cutting-edge technology.
        </motion.p>

        <motion.div 
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
        >
          <Link to="/register" className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 cursor-pointer">
            Start Building <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="w-full sm:w-auto bg-white text-gray-600 border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Play className="w-4 h-4 text-gray-400 fill-current" /> Documentation
          </button>
        </motion.div>
      </motion.div>

      {/* COMPLEX DASHBOARD VISUAL */}
      <motion.div 
        initial={{ opacity: 0, y: 100, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.6, duration: 1, type: "spring" }}
        className="relative w-full max-w-6xl mx-auto px-4 hidden md:block perspective-1000"
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden transform-gpu hover:translate-y-[-5px] transition-transform duration-500">
            
            {/* Browser Toolbar */}
            <div className="h-9 border-b border-gray-100 bg-gray-50/50 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300"></div>
                </div>
                <div className="bg-white border border-gray-200 rounded px-3 py-0.5 text-[10px] font-mono text-gray-400 flex items-center gap-2">
                    <LockKeyhole className="w-3 h-3 text-blue-500" />
                    dasho.com/console/exams/live
                </div>
                <div className="w-10"></div>
            </div>

            {/* App Layout */}
            <div className="flex h-[500px]">
                
                {/* Sidebar */}
                <div className="w-56 border-r border-gray-100 bg-gray-50/30 p-4 flex flex-col gap-6">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Platform</div>
                        {['Overview', 'Exam Sessions', 'Candidates', 'Analytics', 'Settings'].map((item, i) => (
                            <div key={i} className={`px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer ${i === 1 ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-blue-700">System Normal</span>
                            </div>
                            <div className="text-[10px] text-blue-400">Latency: 24ms</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white p-6 md:p-8 overflow-hidden flex flex-col">
                    
                    {/* Header */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-gray-900">Physics 101 - Final</h2>
                                <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Live</span>
                            </div>
                            <p className="text-xs text-gray-500">Session ID: #EX-2024-892 • Started 42m ago</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">Pause All</button>
                            <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-bold shadow-sm hover:bg-black transition-colors">Export Report</button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Active Users", value: "1,248", change: "+12%", color: "text-gray-900" },
                            { label: "Avg Score", value: "82.4%", change: "+2.1%", color: "text-gray-900" },
                            { label: "Completion", value: "64%", change: "Running", color: "text-blue-600" },
                            { label: "Alerts", value: "3", change: "Action Req", color: "text-red-600" },
                        ].map((stat, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/20">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{stat.label}</div>
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] font-medium text-gray-400 mt-1">{stat.change}</div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Data Table */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden flex-1">
                        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="w-8">#</div>
                            <div className="w-32">Student</div>
                            <div className="w-24">Status</div>
                            <div className="w-24">Progress</div>
                            <div className="w-32">Integrity</div>
                            <div className="flex-1 text-right">Last Event</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                { id: "01", name: "Alex Smith", status: "Active", progress: "45%", integrity: "98%", event: "Answered Q14", warn: false },
                                { id: "02", name: "Sarah Jones", status: "Active", progress: "42%", integrity: "99%", event: "Answered Q12", warn: false },
                                { id: "03", name: "John Doe", status: "Flagged", progress: "38%", integrity: "65%", event: "Tab Switch (2s)", warn: true },
                                { id: "04", name: "Mike Chen", status: "Active", progress: "48%", integrity: "97%", event: "Answered Q15", warn: false },
                                { id: "05", name: "Emily Davis", status: "Finished", progress: "100%", integrity: "99%", event: "Submitted", warn: false },
                            ].map((row, i) => (
                                <div key={i} className={`px-4 py-3 flex gap-4 items-center text-xs ${row.warn ? 'bg-red-50/30' : 'bg-white'}`}>
                                    <div className="w-8 text-gray-400 font-mono">{row.id}</div>
                                    <div className="w-32 font-bold text-gray-900">{row.name}</div>
                                    <div className="w-24">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${row.warn ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {row.status}
                                        </span>
                                    </div>
                                    <div className="w-24 font-mono text-gray-500">{row.progress}</div>
                                    <div className="w-32 flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${row.warn ? 'bg-red-500' : 'bg-blue-500'}`} 
                                                style={{ width: row.integrity }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className={`flex-1 text-right font-mono ${row.warn ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                                        {row.event}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </motion.div>
    </section>
  );
}
