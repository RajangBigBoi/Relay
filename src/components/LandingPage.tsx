import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, LayoutDashboard, Clock, ClipboardCheck, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../lib/firebase';

export function LandingPage() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="h-20 border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">R</div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Relay</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/app/dashboard" className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 px-1">Dashboard</Link>
              <button 
                onClick={() => signOut()}
                className="text-sm font-semibold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
              <Link 
                to="/create-account" 
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          {user && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full mb-4"
            >
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-slate-500" />
              </div>
              <span className="text-xs font-bold text-slate-600 tracking-tight">
                Signed in as <span className="text-slate-900">{profile?.name || user.email}</span>
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Relay
            </h1>
            <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed font-medium">
              Hotel operations, handovers, and incident tracking made simple.
            </p>
            <p className="text-slate-500 max-w-xl mx-auto">
              Built for front office teams, duty managers, and hotel staff to synchronize daily tasks and high-priority logistics.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {user ? (
              <Link 
                to="/app/dashboard" 
                className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Go to Workspace
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/create-account" 
                  className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto bg-slate-50 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-200"
                >
                  Staff Sign In
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Value Props */}
        <div className="mt-32 grid md:grid-cols-3 gap-12 border-t border-slate-100 pt-20">
          {[
            { 
              icon: Clock, 
              title: "Smart Handovers", 
              desc: "Effortlessly bridge communication gaps between shifts with automated logs and summaries." 
            },
            { 
              icon: LayoutDashboard, 
              title: "Incident Tracking", 
              desc: "Real-time visibility into operational issues, guest requests, and maintenance status." 
            },
            { 
              icon: ClipboardCheck, 
              title: "Digital Checklists", 
              desc: "Standardize quality across every department with structured, verifiable daily workflows." 
            }
          ].map((feature, i) => (
            <div key={i} className="space-y-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Simple Statistics */}
        <div className="mt-32 bg-slate-900 rounded-[32px] p-8 lg:p-16 text-white grid grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: 'Operational Uptime', val: '99.9%' },
             { label: 'Hotel Clusters', val: 'Global' },
             { label: 'Task Throughput', val: 'Real-time' },
             { label: 'Data Integrity', val: 'Enterprise' }
           ].map((stat, i) => (
             <div key={i} className="space-y-1 text-center lg:text-left">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
               <p className="text-3xl font-bold tracking-tight">{stat.val}</p>
             </div>
           ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 px-6 lg:px-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-[10px]">R</div>
            <span className="text-sm font-bold tracking-tight">Relay Operations</span>
          </div>
          <p className="text-xs text-slate-400">© 2024 Relay. All rights reserved for hospitality professionals.</p>
        </div>
      </footer>
    </div>
  );
}
