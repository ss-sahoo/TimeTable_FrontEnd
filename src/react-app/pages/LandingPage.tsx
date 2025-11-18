import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  ArrowRight,
  Award,
  Brain,
  Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Proctored',
      description: 'Advanced AI-powered proctoring ensures exam integrity with real-time monitoring and violation detection.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Create and manage exams in minutes. Auto-grading and instant results for seamless experience.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics',
      description: 'Comprehensive insights into student performance, question difficulty, and exam patterns.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Scalable Platform',
      description: 'Support unlimited students, exams, and institutes. Built to grow with your needs.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Smart question generation, automated evaluation, and intelligent insights to enhance learning.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Award,
      title: 'Professional Results',
      description: 'Generate detailed answer sheets, PDF reports, and comprehensive grading with professional formatting.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const benefits = [
    {
      title: 'Save Time',
      description: 'Automate grading and evaluation, reducing hours of manual work to minutes.',
      stat: '90%'
    },
    {
      title: 'Increase Accuracy',
      description: 'Eliminate human errors in grading with consistent, objective evaluation.',
      stat: '100%'
    },
    {
      title: 'Better Insights',
      description: 'Understand student performance patterns and identify areas for improvement.',
      stat: 'Real-time'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#094fb5] to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#094fb5] to-blue-600 bg-clip-text text-transparent">
                ExamFlow
              </span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-[#094fb5] transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-gradient-to-r from-[#094fb5] to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#094fb5]" />
              <span className="text-sm font-medium text-gray-700">
                The Future of Online Examinations
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-[#094fb5] to-blue-600 bg-clip-text text-transparent leading-tight">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-[#094fb5] to-blue-600 bg-clip-text text-transparent">
                Exam Experience
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create, manage, and evaluate exams with ease. Powered by AI-driven proctoring,
              instant grading, and comprehensive analytics.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-[#094fb5] to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:shadow-xl border-2 border-gray-200 hover:border-[#094fb5] transition-all duration-300">
                Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make exam management effortless and effective
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                  <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#094fb5] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Why Choose ExamFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our comprehensive exam management platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-[#094fb5] to-blue-600 bg-clip-text text-transparent mb-4">
                  {benefit.stat}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#094fb5] to-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by Educators Worldwide
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Active Users' },
              { number: '50K+', label: 'Exams Conducted' },
              { number: '1M+', label: 'Questions Evaluated' },
              { number: '99.9%', label: 'Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#094fb5]/20 to-blue-600/20" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Exams?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of educators who are already using ExamFlow to create better exam experiences.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 bg-transparent text-white rounded-xl font-semibold text-lg hover:bg-white/10 border-2 border-white/30 transition-all duration-300">
                  Contact Sales
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#094fb5] to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <span className="text-xl font-bold text-white">ExamFlow</span>
              </div>
              <p className="text-gray-400 text-sm">
                The modern platform for online examinations and assessments.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} ExamFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

