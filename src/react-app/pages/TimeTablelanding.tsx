import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function TimeTableLanding() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const features = [
    {
      number: 1,
      icon: "fas fa-network-wired",
      title: "Hierarchical Admin System",
      description: "Central HQ control with branch-level autonomy. Scalable multi-institute management with role-based permissions.",
      gradient: "from-cyan-500 to-blue-600",
      delay: 0
    },
    {
      number: 2,
      icon: "fas fa-user-graduate",
      title: "Smart Batch Management",
      description: "Dynamic batch creation with custom constraints. Set min/max classes per day/week for optimized learning schedules.",
      gradient: "from-violet-500 to-purple-600",
      delay: 0
    },
    {
      number: 3,
      icon: "fas fa-sliders-h",
      title: "Flexible Time Configuration",
      description: "Create unlimited time slots across custom date ranges. 30-day schedules or any duration with intelligent slot allocation.",
      gradient: "from-emerald-500 to-teal-600",
      delay: 0
    },
    {
      number: 4,
      icon: "fas fa-user-check",
      title: "Teacher Availability AI",
      description: "Smart availability tracking with conflict detection. Real-time teacher scheduling with preferences and constraints.",
      gradient: "from-rose-500 to-pink-600",
      delay: 0
    },
    {
      number: 5,
      icon: "fas fa-lock",
      title: "Fixed Session Locking",
      description: "Pin critical classes, exams, and free periods. Unbreakable schedule integrity with priority allocation.",
      gradient: "from-amber-500 to-orange-600",
      delay: 0
    },
    {
      number: 6,
      icon: "fas fa-dna",
      title: "Genetic Algorithm Engine",
      description: "Advanced AI optimization with 99.9% efficiency. Evolves perfect timetables through intelligent mutation and crossover.",
      gradient: "from-fuchsia-500 to-purple-600",
      delay: 0
    },
    {
      number: 7,
      icon: "fas fa-search-check",
      title: "Feasibility Intelligence",
      description: "Pre-generation conflict analysis. Instant error detection with actionable resolution suggestions.",
      gradient: "from-sky-500 to-cyan-600",
      delay: 0
    },
    {
      number: 8,
      icon: "fas fa-robot",
      title: "Auto-Generation AI",
      description: "One-click perfect timetable creation. Generates schedules for all batches, teachers simultaneously.",
      gradient: "from-green-500 to-emerald-600",
      delay: 0
    },
    {
      number: 9,
      icon: "fas fa-share-alt",
      title: "Multi-Channel Distribution",
      description: "Instant email/WhatsApp delivery. Print-ready formats with individual and group communication.",
      gradient: "from-indigo-500 to-blue-600",
      delay: 0
    },
    {
      number: 10,
      icon: "fas fa-sync-alt",
      title: "Dynamic Updates",
      description: "Real-time schedule modifications. Change specific dates/slots with automatic conflict resolution.",
      gradient: "from-red-500 to-orange-600",
      delay: 0
    },
  ];

  const stats = [
    { value: "99.9%", label: "Optimization Success", icon: "fas fa-chart-line", change: "+2.3%" },
    { value: "50K+", label: "Timetables Generated", icon: "fas fa-calendar-check", change: "+12%" },
    { value: "10K+", label: "Institutes Using", icon: "fas fa-university", change: "+25%" },
    { value: "2M+", label: "Teachers Scheduled", icon: "fas fa-chalkboard-teacher", change: "+18%" },
    { value: "24/7", label: "Support Coverage", icon: "fas fa-headset", change: "99.9%" },
    { value: "0", label: "Manual Conflicts", icon: "fas fa-times-circle", change: "-100%" },
  ];

  const aiProcess = [
    {
      step: "01",
      title: "Constraint Definition",
      description: "Input all parameters, teacher availability, batch requirements, and fixed sessions.",
      color: "from-cyan-500 to-blue-500",
      icon: "fas fa-cogs"
    },
    {
      step: "02",
      title: "Feasibility Analysis",
      description: "AI validates all constraints and identifies potential conflicts before generation.",
      color: "from-violet-500 to-purple-500",
      icon: "fas fa-search"
    },
    {
      step: "03",
      title: "Genetic Optimization",
      description: "AI evolves perfect schedules through intelligent algorithm iterations.",
      color: "from-emerald-500 to-teal-500",
      icon: "fas fa-dna"
    },
    {
      step: "04",
      title: "Distribution & Sync",
      description: "Instant sharing across all channels with real-time updates and notifications.",
      color: "from-amber-500 to-orange-500",
      icon: "fas fa-share-alt"
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Dean, Stanford University",
      content: "Our scheduling time reduced from 3 weeks to 30 minutes. The AI optimization is nothing short of magical.",
      rating: 5,
      avatar: "SD",
      company: "Stanford University"
    },
    {
      name: "Rajesh Kumar",
      role: "Director, IIT Mumbai",
      content: "Managing 50+ departments was impossible before IntelliSchedule. Now it's flawless and automated.",
      rating: 5,
      avatar: "RK",
      company: "IIT Mumbai"
    },
    {
      name: "Emma Watson",
      role: "Principal, Oxford Academy",
      content: "The genetic algorithm produces better schedules than our best human schedulers ever could.",
      rating: 5,
      avatar: "EW",
      company: "Oxford Academy"
    },
  ];

  const FloatingParticles = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white overflow-hidden" ref={containerRef}>
      {/* Enhanced Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Enhanced Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.05 - 250,
            y: mousePosition.y * 0.05 - 250,
          }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        />
        <motion.div
          className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        
        {/* Animated Grid Pattern */}
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"
          animate={{
            backgroundPosition: ["0px 0px", "50px 50px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <FloatingParticles />
      </div>

      {/* Enhanced Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 z-40"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all duration-300">
                <i className="fas fa-calendar-alt text-white text-xl"></i>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-white to-blue-400 bg-clip-text text-transparent">
                IntelliSchedule
              </span>
              <motion.div 
                className="text-xs text-cyan-300 font-medium mt-1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                AI TIMETABLE SYSTEM
              </motion.div>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            {["Features", "AI Process", "Testimonials", "Pricing"].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="relative text-slate-300 hover:text-white transition-all group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <span className="font-semibold">{item}</span>
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-300"
                  layoutId="underline"
                />
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/login"
                className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-all"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="relative px-6 py-3 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full hover:shadow-2xl hover:shadow-cyan-500/30 transition-all group overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Animated Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 backdrop-blur-sm mb-8"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-semibold text-cyan-300">
                  WORLD'S MOST ADVANCED TIMETABLE AI
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-6xl lg:text-7xl xl:text-7xl font-black mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  Stop Scheduling
                </span>
                <br />
                <motion.span
                  className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  Start Optimizing
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-8 leading-relaxed"
              >
                The world's first AI-powered timetable system that uses genetic algorithms to create
                <motion.span
                  className="text-cyan-300 font-semibold ml-2"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  perfect schedules in minutes
                </motion.span>
                , not weeks.
              </motion.p>

              {/* Animated Stats Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10"
              >
                {stats.slice(0, 3).map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-white/10"
                    whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`${stat.icon} text-cyan-400`}></i>
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <motion.span
                        className="text-xs text-emerald-400 font-bold"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {stat.change}
                      </motion.span>
                    </div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Start Free Trial
                    </motion.span>
                    <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-lg rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center gap-3 group">
                    <motion.i
                      className="fas fa-play"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>Watch Demo</span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Enhanced Interactive Timetable Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative h-[600px] hidden lg:block"
            >
              {/* Main Timetable Card */}
              <motion.div
                className="absolute top-0 right-0 w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl shadow-cyan-500/10"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Generated Timetable</h3>
                    <p className="text-sm text-cyan-400">Computer Science - Week 1</p>
                  </div>
                  <motion.div
                    className="px-3 py-1 bg-cyan-500/20 rounded-full"
                    animate={{ backgroundColor: ["rgba(6, 182, 212, 0.2)", "rgba(6, 182, 212, 0.4)", "rgba(6, 182, 212, 0.2)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-sm font-semibold text-cyan-300">Optimized</span>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  {[
                    { time: "09:00", subject: "Data Structures", teacher: "Prof. Smith", room: "Lab A", color: "bg-cyan-500/20", delay: 0 },
                    { time: "10:30", subject: "Algorithms", teacher: "Dr. Johnson", room: "304", color: "bg-violet-500/20", delay: 0.1 },
                    { time: "13:00", subject: "AI & ML", teacher: "Dr. Williams", room: "401", color: "bg-emerald-500/20", delay: 0.2 },
                    { time: "15:00", subject: "Database Systems", teacher: "Prof. Davis", room: "Lab B", color: "bg-amber-500/20", delay: 0.3 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className={`${item.color} rounded-lg p-4 border border-white/5 hover:border-white/20 transition-all duration-300`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay }}
                      whileHover={{ scale: 1.02, borderColor: "rgba(255, 255, 255, 0.3)" }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{item.time}</div>
                          <div className="text-sm text-slate-300">{item.subject}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">{item.teacher}</div>
                          <div className="text-xs text-slate-400">{item.room}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-6 pt-4 border-t border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">AI Confidence:</span>
                    <motion.span
                      className="text-emerald-400 font-bold"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      98.7%
                    </motion.span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "98.7%" }}
                      transition={{ duration: 2, delay: 1 }}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Animated Floating Elements */}
              <motion.div
                className="absolute top-1/4 -left-4 w-64 bg-gradient-to-br from-violet-800/40 to-purple-800/40 backdrop-blur-lg rounded-xl p-4 border border-white/10 shadow-xl rotate-3"
                animate={{
                  y: [0, -15, 0],
                  rotate: [3, -1, 3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
              >
                <div className="text-sm font-medium text-white mb-2">Genetic Algorithm</div>
                <div className="text-xs text-slate-300">Generation: 
                  <motion.span
                    className="ml-1 text-cyan-300 font-bold"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    245
                  </motion.span>
                </div>
                <div className="text-xs text-slate-300">Fitness: 
                  <motion.span
                    className="ml-1 text-emerald-300 font-bold"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  >
                    98.2%
                  </motion.span>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 left-1/4 w-56 bg-gradient-to-br from-emerald-800/40 to-teal-800/40 backdrop-blur-lg rounded-xl p-4 border border-white/10 shadow-xl -rotate-6"
                animate={{
                  y: [0, 15, 0],
                  rotate: [-6, 2, -6],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <div className="text-sm font-medium text-white mb-2">Teacher Schedule</div>
                <div className="text-xs text-slate-300">Dr. Johnson: 4 Classes</div>
                <div className="text-xs text-slate-300 flex items-center gap-1">
                  No Conflicts 
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ✓
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Banner */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 border-y border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  {stat.label}
                </div>
                <motion.div
                  className="text-xs text-emerald-400 mt-1"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stat.change}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <motion.i
                className="fas fa-bolt text-cyan-400"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-cyan-300">POWERFUL FEATURES</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              <motion.span
                className="bg-gradient-to-r from-cyan-400 via-white to-blue-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Everything You Need
              </motion.span>
              <br />
              <span className="text-2xl sm:text-3xl text-slate-400 mt-4 block">
                For Perfect Schedule Management
              </span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)"
                }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-xs font-bold"
                  animate={{
                    rotate: hoveredFeature === index ? 360 : 0,
                    scale: hoveredFeature === index ? 1.2 : 1
                  }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {feature.number}
                </motion.div>
                
                <motion.div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                  animate={{
                    scale: hoveredFeature === index ? 1.2 : 1,
                    rotate: hoveredFeature === index ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ 
                    scale: { type: "spring", stiffness: 300 },
                    rotate: { duration: 0.5 }
                  }}
                >
                  <i className={`${feature.icon} text-white text-2xl`}></i>
                </motion.div>
                
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredFeature === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced AI Process Section */}
      <section id="ai-process" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full border border-violet-500/30 mb-6">
              <motion.i
                className="fas fa-brain text-violet-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-violet-300">AI-POWERED PROCESS</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              <motion.span
                className="bg-gradient-to-r from-violet-400 via-white to-purple-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                How Our AI Works
              </motion.span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Advanced genetic algorithms evolve perfect timetables through intelligent optimization
            </p>
          </motion.div>

          <div className="relative">
            {/* Animated Connection Line */}
            <motion.div
              className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 transform -translate-y-1/2 overflow-hidden"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {aiProcess.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <motion.div
                    className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 group"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 25px 50px rgba(139, 92, 246, 0.2)"
                    }}
                  >
                    <motion.div
                      className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-xl font-bold shadow-lg`}
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                    >
                      {step.step}
                    </motion.div>
                    
                    <motion.div
                      className={`w-16 h-16 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                      whileHover={{ scale: 1.2, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <i className={`${step.icon} text-white text-2xl`}></i>
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-white text-center mb-4">{step.title}</h3>
                    <p className="text-sm text-slate-400 text-center leading-relaxed">{step.description}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full border border-emerald-500/30 mb-6">
              <motion.i
                className="fas fa-star text-emerald-400"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-emerald-300">TRUSTED BY LEADERS</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              <motion.span
                className="bg-gradient-to-r from-emerald-400 via-white to-teal-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Loved by Educators
              </motion.span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ 
                  scale: 1.05,
                  borderColor: "rgba(6, 182, 212, 0.5)",
                  boxShadow: "0 20px 40px rgba(6, 182, 212, 0.1)"
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold"
                    whileHover={{ scale: 1.2 }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-cyan-400">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
                
                <motion.p
                  className="text-slate-300 italic mb-6 leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  "{testimonial.content}"
                </motion.p>
                
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.i
                      key={i}
                      className="fas fa-star text-amber-400"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: i * 0.1, duration: 1, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 lg:p-16 border border-white/10 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <div className="relative z-10 text-center">
              <motion.h2
                className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <motion.span
                  className="bg-gradient-to-r from-cyan-400 via-white to-blue-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  Ready to Revolutionize
                </motion.span>
                <br />
                <span className="text-2xl sm:text-3xl text-slate-400">
                  Your Timetable Management?
                </span>
              </motion.h2>
              
              <motion.p
                className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Join thousands of institutions using IntelliSchedule to create perfect schedules with AI.
                Start your free trial today — no credit card required.
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Start Free Trial →
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button className="px-10 py-5 bg-white/10 backdrop-blur-lg rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 group">
                    <motion.span
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Schedule Demo
                    </motion.span>
                  </button>
                </motion.div>
              </motion.div>
              
              <motion.div
                className="mt-8 text-sm text-slate-500"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                Free 14-day trial • No setup fees • Cancel anytime
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-white/10 bg-slate-900/50 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <motion.div
              className="col-span-2 lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 mb-6 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-white"></i>
                </div>
                <span className="text-2xl font-bold text-white">IntelliSchedule</span>
              </motion.div>
              <p className="text-slate-400 mb-6">
                World's most advanced AI-powered timetable management system.
              </p>
              <div className="flex gap-4">
                {["twitter", "linkedin", "github"].map((social) => (
                  <motion.a
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className={`fab fa-${social}`}></i>
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            {['Product', 'Company', 'Resources', 'Legal'].map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className="font-bold text-white mb-4">{category}</h4>
                <ul className="space-y-2">
                  {['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'].map((link, linkIndex) => (
                    <motion.li
                      key={link}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + linkIndex * 0.05 }}
                    >
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            className="border-t border-white/10 pt-8 text-center text-slate-500 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>© {new Date().getFullYear()} IntelliSchedule. All rights reserved.</div>
              <div className="flex gap-6">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((policy, index) => (
                  <motion.a
                    key={policy}
                    href="#"
                    className="hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                  >
                    {policy}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.footer>

      {/* Enhanced Floating Chat Widget */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/30 z-40"
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.2, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.i
          className="fas fa-comment text-white text-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
}