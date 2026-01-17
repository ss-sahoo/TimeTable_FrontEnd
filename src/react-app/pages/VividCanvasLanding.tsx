// EXACT REPLICA OF VIVID-CANVAS LANDING PAGE
// This is the original design from Vivid-Canvas without any exam app modifications

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import { 
  Zap, Menu, X, ChevronDown, Hexagon, 
  Bot, ShieldCheck, TrendingUp, User, Users, 
  GraduationCap, UserCheck, CheckCircle, BarChart3, 
  FileText, FileSpreadsheet, Mail, AlertTriangle,
  Sparkle, TreeStructure, Monitor, ChartPieSlice,
  ArrowRight, Play, LockKeyhole, Building2, Layers,
  Repeat, Maximize2, Copy, Layout, Video, Wifi,
  ClipboardList, Lightning, ArrowsUpDown
} from 'lucide-react';

// This page is an EXACT replica of Vivid-Canvas design
// Use this as the landing page to show the original design

export default function VividCanvasLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("creators");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* NAVBAR - Exact from Vivid-Canvas */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all"
      >
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-12">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="relative flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/30 transition-all group-hover:scale-105">
                  <Hexagon className="text-white text-lg fill-current" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="font-bold text-xl tracking-tighter text-gray-900 group-hover:text-blue-600 transition-colors">
                  DashoExams
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-gray-600">
                <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                  Products <ChevronDown size={12} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                  Solutions <ChevronDown size={12} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                  Developers <ChevronDown size={12} className="text-gray-400" />
                </div>
                <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
              </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-[13px] font-bold text-gray-900 hover:text-blue-600 px-3 py-2 transition-colors">Log in</Link>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 cursor-pointer hover:scale-105 active:scale-95">
                Contact Sales
              </button>
            </div>

            <button 
              className="md:hidden text-gray-600 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-4 shadow-lg absolute w-full left-0 top-16 overflow-hidden"
          >
              <div className="space-y-2 text-sm font-bold text-gray-600">
                  <div className="py-2 border-b border-gray-50">Products</div>
                  <div className="py-2 border-b border-gray-50">Solutions</div>
                  <div className="py-2 border-b border-gray-50">Developers</div>
                  <a href="#" className="block py-2">Pricing</a>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                  <button className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">
                      Contact Sales
                  </button>
                  <Link to="/login" className="w-full text-center text-sm font-bold text-gray-900 py-2">Log in</Link>
              </div>
          </motion.div>
        )}
      </motion.nav>

      <main className="pt-16">
        {/* All sections will be added here - this is just the structure */}
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4">Vivid-Canvas Design</h1>
            <p className="text-xl text-gray-600 mb-8">Exact replica of the original landing page</p>
            <p className="text-gray-500">Components are being loaded...</p>
          </div>
        </div>

      </main>

      {/* FOOTER - Exact from Vivid-Canvas */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
              <div className="font-bold text-xl mb-4 text-gray-900 tracking-tight">DashoExams</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  The infrastructure for global assessments.
              </p>
              <div className="flex gap-4">
                  <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors"></div>
                  <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors"></div>
                  <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors"></div>
              </div>
          </div>
          
          <div>
              <h4 className="font-bold text-gray-900 mb-6 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Proctoring</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Grading</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Analytics</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">API Keys</a></li>
              </ul>
          </div>

          <div>
              <h4 className="font-bold text-gray-900 mb-6 text-sm">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Status</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Support</a></li>
              </ul>
          </div>

          <div>
              <h4 className="font-bold text-gray-900 mb-6 text-sm">Company</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium">
          <div>© 2024 DashoExams Inc.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Security</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
