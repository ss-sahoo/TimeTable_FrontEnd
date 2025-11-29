import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Users,
  TrendingUp,
  Lock,
  Cpu,
  Eye,
  FileText,
  BarChart3,
  Clock,
  Award,
  Globe,
  Rocket
} from 'lucide-react';
import ExamCardsStack from '../components/ExamCardsStack';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Extraction',
      description: 'Automatically extract questions from PDFs using advanced AI technology',
      gradient: 'from-sky-500 to-blue-600'
    },
    {
      icon: Shield,
      title: 'Advanced Proctoring',
      description: 'Real-time monitoring with AI-based cheating detection',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Deep insights into student performance and exam patterns',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Create and deploy exams in minutes, not hours',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Lock,
      title: 'Bank-Grade Security',
      description: 'Enterprise-level encryption and data protection',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Globe,
      title: 'Accessible Anywhere',
      description: 'Cloud-based platform accessible from any device',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '1M+', label: 'Exams Conducted', icon: FileText },
    { value: '99.9%', label: 'Uptime', icon: TrendingUp },
    { value: '24/7', label: 'Support', icon: Clock }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'University Professor',
      content: 'DashoExams has revolutionized how we conduct assessments. The AI features save us hours of work!',
      avatar: '👩‍🏫'
    },
    {
      name: 'Michael Chen',
      role: 'Education Director',
      content: 'The proctoring features are incredibly robust. We\'ve seen a significant improvement in exam integrity.',
      avatar: '👨‍💼'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Institute Administrator',
      content: 'Best investment we\'ve made. The analytics help us understand student performance like never before.',
      avatar: '👩‍💻'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x - 200,
            y: mousePosition.y - 200,
          }}
          transition={{ type: 'spring', damping: 30 }}
        />
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-40 border-b border-white/10 backdrop-blur-xl bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center shadow-lg shadow-sky-500/50"
              >
                <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                DashoExams
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#features" className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-block px-4 lg:px-6 py-2 lg:py-2.5 text-sm lg:text-base text-white hover:text-sky-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-5 lg:px-6 py-2 lg:py-2.5 text-sm lg:text-base bg-gradient-to-r from-sky-500 to-violet-500 rounded-full font-semibold hover:shadow-lg hover:shadow-sky-500/50 transition-all hover:scale-105 whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-sky-500/20 to-violet-500/20 rounded-full border border-sky-500/30 mb-6 sm:mb-8"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
                <span className="text-xs sm:text-sm font-medium text-sky-300">AI-Powered Examination Platform</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-sky-200 to-violet-200 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Examination Process
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
                Create, manage, and analyze exams with cutting-edge AI technology. 
                Save time, enhance security, and gain deeper insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-base sm:text-lg hover:bg-white/20 transition-all border border-white/20">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 mt-8 sm:mt-12">
                {stats.slice(0, 2).map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block relative h-[550px] w-full"
            >
              {/* Interactive Exam Cards Stack */}
              <ExamCardsStack />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-500/20 to-violet-500/20 rounded-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              Everything you need to create, manage, and analyze exams with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-violet-500/10 rounded-2xl sm:rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all">
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg`}>
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              Get started in minutes with our simple three-step process
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {[
              { step: '01', title: 'Upload & Extract', description: 'Upload your PDF and let AI extract questions automatically', icon: FileText },
              { step: '02', title: 'Customize & Deploy', description: 'Configure exam settings and deploy to students instantly', icon: Cpu },
              { step: '03', title: 'Monitor & Analyze', description: 'Track progress in real-time and analyze results with AI', icon: BarChart3 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-sky-500/10 absolute -top-4 sm:-top-6 lg:-top-8 -left-2 sm:-left-4">{item.step}</div>
                <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-500 to-violet-500 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg">
                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">{item.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Loved by Educators
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              See what our users have to say about DashoExams
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10"
              >
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">{testimonial.avatar}</div>
                <p className="text-sm sm:text-base text-slate-300 mb-4 sm:mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-sm sm:text-base">{testimonial.name}</div>
                  <div className="text-xs sm:text-sm text-slate-400">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-sky-500 to-violet-500 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-white">
                Ready to Transform Your Exams?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
                Join thousands of educators who are already using DashoExams to create better assessments
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-sky-600 rounded-full font-bold text-base sm:text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <button className="px-8 sm:px-10 py-4 sm:py-5 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold text-base sm:text-lg hover:bg-white/30 transition-all border-2 border-white/30">
                  Schedule Demo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-violet-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold">DashoExams</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                AI-powered examination platform for modern education
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-slate-400">
              © {new Date().getFullYear()} DashoExams. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              Powered by{' '}
              <a 
                href="https://diracai.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                DiracAI
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
