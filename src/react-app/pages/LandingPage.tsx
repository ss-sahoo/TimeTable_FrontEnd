import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import {
  Zap,
  Shield,
  Brain,
  ArrowRight,
  Play,
  Menu,
  X,
  Globe,
  Users,
  Code,
  Plug,
  TrendingUp,
  Lock,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVisual, setActiveVisual] = useState(1);

  // Refs for scroll sections
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);

  const isSection1InView = useInView(section1Ref, { margin: '-45% 0px -45% 0px' });
  const isSection2InView = useInView(section2Ref, { margin: '-45% 0px -45% 0px' });
  const isSection3InView = useInView(section3Ref, { margin: '-45% 0px -45% 0px' });

  useEffect(() => {
    if (isSection1InView) setActiveVisual(1);
    else if (isSection2InView) setActiveVisual(2);
    else if (isSection3InView) setActiveVisual(3);
  }, [isSection1InView, isSection2InView, isSection3InView]);

  return (
    <div className="min-h-screen bg-white text-[#050505] overflow-x-hidden scroll-smooth">
      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-lg">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-black">DashoExams</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-black transition-colors">Platform</a>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#integrations" className="hover:text-black transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <a href="#features" className="block py-2 text-gray-600 hover:text-black" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#integrations" className="block py-2 text-gray-600 hover:text-black" onClick={() => setMobileMenuOpen(false)}>Integrations</a>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/login" className="block py-2 text-gray-600" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="block py-2.5 px-4 bg-black text-white rounded-full text-center" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600 mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            Introducing AI Proctoring 2.0
          </motion.div>

          {/* Big Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter text-black mb-8 leading-[1.05]"
          >
            Assessments, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">
              Reimagined.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The operating system for modern education. Create, secure, and analyze high-stakes exams with the power of Artificial Intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-24"
          >
            <Link
              to="/register"
              className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/20 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5 text-gray-400" fill="currentColor" /> Watch Demo
            </button>
          </motion.div>

          {/* HERO DASHBOARD MOCKUP */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 p-3 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)]">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* App Header */}
                <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-5 w-px bg-gray-200" />
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-gray-400">Analytics</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-black">Final Semester Physics</span>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded flex items-center gap-1.5 border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                  </div>
                </div>

                {/* App Body */}
                <div className="p-8 bg-gray-50/30 min-h-[450px] grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Col: Real-time List */}
                  <div className="md:col-span-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Candidates (142)</h3>
                    </div>
                    <div className="space-y-3">
                      {/* Warning Item */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold">JD</div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">John Doe</p>
                            <p className="text-[10px] text-red-500 font-semibold">Gaze Aversion (12s)</p>
                          </div>
                        </div>
                        <Shield className="w-4 h-4 text-red-500" />
                      </div>
                      {/* Active Items */}
                      {[{ initials: 'AS', name: 'Alex Smith' }, { initials: 'MK', name: 'Mike K.' }].map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{user.initials}</div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{user.name}</p>
                              <p className="text-[10px] text-green-600">Active</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Col: AI Analytics */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 font-bold uppercase">Integrity Score</p>
                        <div className="flex items-end gap-2 mt-1">
                          <h2 className="text-3xl font-extrabold text-black">98.2%</h2>
                          <span className="text-xs text-green-600 font-bold mb-1 bg-green-50 px-1 rounded">↑ 0.4%</span>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <p className="text-xs text-gray-400 font-bold uppercase">AI Flags</p>
                        <h2 className="text-3xl font-extrabold text-black mt-1">3</h2>
                        <div className="absolute right-4 top-4 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <Brain className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    {/* Graph */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-52">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Distribution</h3>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">AI Analysis</span>
                      </div>
                      <div className="flex-1 flex items-end justify-between gap-4 px-2">
                        {[40, 85, 60, 30, 50].map((h, i) => (
                          <div
                            key={i}
                            className={`w-full rounded-t-sm cursor-pointer transition-colors ${i === 1 ? 'bg-indigo-500 shadow-[0_0_60px_-15px_rgba(79,70,229,0.3)]' : 'bg-gray-100 hover:bg-gray-200'}`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STICKY SCROLL STORY SECTION */}
      <section className="bg-gray-50 py-24 border-t border-gray-100" id="features">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 relative">
          {/* LEFT: Sticky Visuals */}
          <div className="hidden lg:block">
            <div className="sticky top-[100px] h-[600px] flex items-center justify-center">
              {/* Visual 1: Creation */}
              <div
                className={`absolute w-full h-full bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden p-10 flex items-center justify-center transition-all duration-700 ${
                  activeVisual === 1 ? 'opacity-100 scale-100 translate-y-0 z-10' : 'opacity-0 scale-95 translate-y-5 z-0 pointer-events-none'
                }`}
              >
                <div className="w-full max-w-sm space-y-6">
                  <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 relative">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg z-10">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Physics_Syllabus.pdf</p>
                        <p className="text-xs text-gray-400">Processing...</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-2 bg-gray-100 rounded-full w-full" />
                      <div className="h-2 bg-gray-100 rounded-full w-5/6" />
                    </div>
                    <div className="flex justify-center my-2">
                      <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-700 mb-2">Generated Question 1:</p>
                      <p className="text-sm text-indigo-900 leading-snug">"Explain the relationship between entropy and time using the second law of thermodynamics..."</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual 2: Security */}
              <div
                className={`absolute w-full h-full bg-black rounded-3xl overflow-hidden transition-all duration-700 ${
                  activeVisual === 2 ? 'opacity-100 scale-100 translate-y-0 z-10' : 'opacity-0 scale-95 translate-y-5 z-0 pointer-events-none'
                }`}
              >
                <div className="absolute inset-0 bg-[#0A0A0A]">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  <div className="absolute w-full h-0.5 bg-green-500 shadow-[0_0_20px_#22c55e] animate-scan z-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full border border-green-500/30 flex items-center justify-center mb-6 relative mx-auto">
                        <Lock className="w-12 h-12 text-green-500" />
                        <div className="absolute inset-0 rounded-full border border-green-500 animate-ping opacity-30" />
                      </div>
                      <h3 className="text-white font-bold text-2xl tracking-tight">Environment Secure</h3>
                      <p className="text-green-500 text-sm font-mono mt-2">NO ANOMALIES DETECTED</p>
                    </div>
                  </div>
                  <div className="absolute top-6 right-6 bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-md text-xs text-white font-mono border border-white/10">
                    <span className="text-green-400">●</span> REC 1080p
                  </div>
                </div>
              </div>

              {/* Visual 3: Insights */}
              <div
                className={`absolute w-full h-full bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden p-10 flex items-center justify-center transition-all duration-700 ${
                  activeVisual === 3 ? 'opacity-100 scale-100 translate-y-0 z-10' : 'opacity-0 scale-95 translate-y-5 z-0 pointer-events-none'
                }`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-black">Knowledge Map</h3>
                      <p className="text-sm text-gray-500">Cohort Weakness Analysis</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {['green-100', 'green-200', 'red-100', 'green-100', 'green-300', 'green-100', 'green-200', 'red-200'].map((color, i) => (
                      <div key={i} className={`aspect-square rounded-lg bg-${color} ${color.includes('red') ? 'border-2 border-red-200 hover:border-red-400 cursor-pointer' : ''} transition-colors`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Scrolling Text */}
          <div className="py-20">
            {/* Text 1 */}
            <div
              ref={section1Ref}
              className={`min-h-screen flex flex-col justify-center pl-0 lg:pl-12 transition-opacity duration-500 ${activeVisual === 1 ? 'opacity-100' : 'opacity-20'}`}
            >
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-lg">
                <Brain className="w-6 h-6" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 tracking-tight">
                Zero to Exam <br />in <span className="text-indigo-600">60 seconds.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                Stop manual data entry. Upload your syllabus or notes, and let our LLM engine extract concepts and generate balanced questions automatically.
              </p>
            </div>

            {/* Text 2 */}
            <div
              ref={section2Ref}
              className={`min-h-screen flex flex-col justify-center pl-0 lg:pl-12 transition-opacity duration-500 ${activeVisual === 2 ? 'opacity-100' : 'opacity-20'}`}
            >
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 tracking-tight">
                Invisible <br /><span className="text-green-600">Security Layer.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                We don't need kernel access to secure an exam. Our browser-native technology detects multiple faces, unauthorized tabs, and suspicious audio instantly.
              </p>
            </div>

            {/* Text 3 */}
            <div
              ref={section3Ref}
              className={`min-h-screen flex flex-col justify-center pl-0 lg:pl-12 transition-opacity duration-500 ${activeVisual === 3 ? 'opacity-100' : 'opacity-20'}`}
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 tracking-tight">
                Close the <br /><span className="text-blue-600">Learning Gap.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                Don't just give a grade. Give insights. Our analytics engine pinpoints exactly which topics a class is struggling with, enabling targeted intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM CAPABILITIES - BENTO GRID */}
      <section className="py-32 px-6 bg-white border-t border-gray-100" id="integrations">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-6">Engineered for Scale.</h2>
            <p className="text-xl text-gray-500">Every tool you need to run high-stakes assessments, built into one cohesive operating system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
            {/* CARD 1: INTEGRATIONS (Span 8) */}
            <div className="md:col-span-6 lg:col-span-8 bg-gray-50 rounded-[2rem] p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 border border-gray-100 min-h-[380px]">
              <div className="relative z-10 max-w-sm h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 text-2xl border border-gray-100">
                    <Plug className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-3">Seamless Integration</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">Stop wrestling with CSVs. We sync natively with Canvas, Blackboard, Moodle, and your corporate HRIS stack in real-time.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-black mt-8 cursor-pointer group/link">
                  View all 50+ integrations <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </div>
              </div>
              {/* Orbiting Icons */}
              <div className="absolute top-1/2 right-12 -translate-y-1/2 w-64 h-64 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 hidden sm:block">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-xl z-10">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '4s' }}>
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '5s' }}>
                  <span className="text-2xl">📚</span>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '3.5s' }}>
                  <span className="text-2xl">🔗</span>
                </div>
              </div>
            </div>

            {/* CARD 2: GLOBAL EDGE (Span 4, Dark) */}
            <div className="md:col-span-6 lg:col-span-4 bg-black rounded-[2rem] p-10 relative overflow-hidden group min-h-[380px]">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-white text-2xl mb-6">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Global Edge</h3>
                  <p className="text-gray-400 text-lg">Exams load in &lt; 50ms worldwide via our distributed edge network.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  <span className="text-sm font-mono text-green-400">156 POPs ACTIVE</span>
                </div>
              </div>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] group-hover:opacity-100 transition-opacity opacity-60" />
            </div>

            {/* CARD 3: ROLE ACCESS (Span 4) */}
            <div className="md:col-span-6 lg:col-span-4 bg-white border border-gray-200 rounded-[2rem] p-10 relative overflow-hidden group hover:border-indigo-300 transition-colors min-h-[380px]">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-2xl mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Role-Based Access</h3>
              <p className="text-gray-500 mb-8">Granular permissions for Admins, Proctors, and Graders.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">SA</div>
                    <span className="text-sm font-bold">Super Admin</span>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">TA</div>
                    <span className="text-sm font-medium">Teaching Asst</span>
                  </div>
                  <Lock className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            {/* CARD 4: API FIRST (Span 8, Code) */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0F0F0F] rounded-[2rem] p-10 relative overflow-hidden flex flex-col md:flex-row gap-10 items-center min-h-[380px]">
              <div className="flex-1 relative z-10">
                <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-white text-2xl mb-6">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">API First</h3>
                <p className="text-gray-400 text-lg mb-6">Build custom assessment workflows. Our entire platform is accessible via a typed, documented REST API.</p>
                <a href="#" className="text-indigo-400 font-bold hover:text-white transition-colors inline-flex items-center gap-2">
                  Read the Docs <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="flex-1 w-full max-w-md bg-[#1A1A1A] rounded-xl border border-white/10 p-5 font-mono text-xs text-gray-300 shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500">
                <div className="flex gap-1.5 mb-4 border-b border-white/5 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="space-y-1">
                  <p><span className="text-purple-400">const</span> exam = <span className="text-purple-400">await</span> dasho.<span className="text-blue-400">create</span>{'({'}</p>
                  <p className="pl-4">name: <span className="text-green-400">"Physics 101"</span>,</p>
                  <p className="pl-4">students: [<span className="text-green-400">"alex@uni.edu"</span>],</p>
                  <p className="pl-4">security: {'{'}</p>
                  <p className="pl-8">browserLock: <span className="text-purple-400">true</span></p>
                  <p className="pl-4">{'}'}</p>
                  <p>{'});'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-10 text-black leading-tight">
            Ready to transform <br /> your assessments?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-indigo-700 transition-colors shadow-2xl shadow-indigo-500/30"
            >
              Get Started Free
            </Link>
            <button className="bg-white text-black border border-gray-200 px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-50 transition-colors">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                <Zap className="w-4 h-4" fill="currentColor" />
              </div>
              <span className="font-bold text-lg">DashoExams</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              The leading platform for secure, intelligent assessments. Built for the future of education.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Enterprise</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Legal</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 mt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">© 2026 DashoExams Inc.</p>
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <a
              href="https://diracai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              DiracAI
            </a>
          </p>
          <div className="flex gap-4 text-gray-400">
            <a href="#" className="hover:text-black transition-colors"><span className="sr-only">Twitter</span>𝕏</a>
            <a href="#" className="hover:text-black transition-colors"><span className="sr-only">LinkedIn</span>in</a>
            <a href="#" className="hover:text-black transition-colors"><span className="sr-only">GitHub</span>⌘</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
