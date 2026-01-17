import { useState } from 'react';
import { Link } from 'react-router';
import { Zap, Menu, X } from 'lucide-react';
import Hero from '../components/landing/Hero';
import Stats from '../components/landing/Stats';
import ValueProps from '../components/landing/ValueProps';
import RoleFeatures from '../components/landing/RoleFeatures';
import AnalyticsShowcase from '../components/landing/AnalyticsShowcase';
import ProcessSteps from '../components/landing/ProcessSteps';
import Integrations from '../components/landing/Integrations';
import SecurityGrid from '../components/landing/SecurityGrid';
import PlatformCapabilities from '../components/landing/PlatformCapabilities';
import PlatformMetrics from '../components/landing/PlatformMetrics';

export default function LandingPageEnhanced() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* NAVIGATION - Exact Vivid-Canvas Style */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/30 transition-all group-hover:scale-105">
                <Zap className="text-white text-lg" fill="currentColor" />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="font-bold text-xl tracking-tighter text-gray-900 group-hover:text-blue-600 transition-colors">
                DashoExams
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-gray-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#process" className="hover:text-blue-600 transition-colors">Process</a>
              <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
              <a href="#platform" className="hover:text-blue-600 transition-colors">Platform</a>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-[13px] font-bold text-gray-900 hover:text-blue-600 px-3 py-2 transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 cursor-pointer hover:scale-105 active:scale-95"
              >
                Contact Sales
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden text-gray-600 p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-4 shadow-lg absolute w-full left-0 top-16 overflow-hidden">
            <div className="space-y-2 text-sm font-bold text-gray-600">
              <a href="#features" className="block py-2 border-b border-gray-50" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#process" className="block py-2 border-b border-gray-50" onClick={() => setMobileMenuOpen(false)}>Process</a>
              <a href="#security" className="block py-2 border-b border-gray-50" onClick={() => setMobileMenuOpen(false)}>Security</a>
              <a href="#platform" className="block py-2" onClick={() => setMobileMenuOpen(false)}>Platform</a>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link 
                to="/register" 
                className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Sales
              </Link>
              <Link 
                to="/login" 
                className="w-full text-center text-sm font-bold text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <Hero />

      {/* TRUSTED BY SECTION */}
      <Stats />

      {/* VALUE PROPS - 3 PILLARS */}
      <div id="features">
        <ValueProps />
      </div>

      {/* ROLE FEATURES */}
      <RoleFeatures />

      {/* ANALYTICS SHOWCASE */}
      <AnalyticsShowcase />

      {/* PROCESS STEPS SECTION */}
      <div id="process">
        <ProcessSteps />
      </div>

      {/* INTEGRATIONS SECTION */}
      <Integrations />

      {/* SECURITY GRID SECTION */}
      <div id="security">
        <SecurityGrid />
      </div>

      {/* PLATFORM CAPABILITIES SECTION */}
      <div id="platform">
        <PlatformCapabilities />
      </div>

      {/* PLATFORM METRICS SECTION */}
      <PlatformMetrics />

      {/* CTA SECTION */}
      <section className="py-32 bg-white text-center border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-gray-900 mb-8">
            Ready to transform <br /> your exam management?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 w-full sm:w-auto cursor-pointer"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-600 border border-gray-200 px-8 py-3 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all w-full sm:w-auto cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER - Exact Vivid-Canvas Style */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="font-bold text-xl mb-4 text-gray-900 tracking-tight">DashoExams</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The infrastructure for global assessments.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 bg-gray-50 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"></div>
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
          <div className="flex items-center gap-2">
            <span>© 2025 DashoExams.</span>
            <span>Made by</span>
            <a 
              href="https://diracai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
            >
              DiracAI
            </a>
          </div>
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
