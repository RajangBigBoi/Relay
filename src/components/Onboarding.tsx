import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Utensils, Brush, CheckCircle2, ArrowRight, LogOut } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth, DEFAULT_PERMISSIONS } from '../context/AuthContext';
import { Department, PlatformRole } from '../types';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';

const OPTIONS = [
  {
    id: 'reception',
    label: 'Reception',
    dept: 'Front Office' as Department,
    icon: Building2,
    description: 'Front desk operations, guest check-ins, and key management.'
  },
  {
    id: 'housekeeper',
    label: 'Housekeeper',
    dept: 'Housekeeping' as Department,
    icon: Brush,
    description: 'Room readiness, maintenance logging, and amenities tracking.'
  },
  {
    id: 'fnb',
    label: 'Food and Beverage',
    dept: 'Food & Beverage' as Department,
    icon: Utensils,
    description: 'Restaurant orders, table management, and service coordination.'
  }
];

export function Onboarding() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    if (!selected || !profile) return;
    
    setIsSubmitting(true);
    const option = OPTIONS.find(o => o.id === selected);
    if (!option) return;

    try {
      const role: PlatformRole = 'Staff';
      await updateDoc(doc(db, 'staffMembers', profile.id), {
        department: option.dept,
        role: role,
        permissions: DEFAULT_PERMISSIONS[role],
        updated_at: serverTimestamp()
      });
      // Profiles are listened via snapshot, so it will auto-update
    } catch (err) {
      console.error(err);
      alert("Failed to save selection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-8 font-sans overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-main/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-display font-black tracking-tighter text-white">Welcome to RELAY</h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            To get started, please select your primary operational role. This determines your initial workspace and permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <motion.button
                key={option.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(option.id)}
                className={cn(
                  "group relative bg-header-bg border border-glass-border p-8 rounded-[32px] text-left transition-all duration-500 overflow-hidden",
                  isSelected ? "border-main/50 ring-4 ring-main/5 bg-main/5" : "hover:border-white/20 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                  isSelected ? "bg-main text-black" : "bg-white/5 text-text-muted group-hover:text-white"
                )}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{option.label}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="check"
                    className="absolute top-6 right-6"
                  >
                    <div className="bg-main rounded-full p-1 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleFinish}
            disabled={!selected || isSubmitting}
            className={cn(
              "group px-12 py-5 bg-main text-bg-dark rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 transition-all shadow-[0_20px_40px_rgba(var(--main-rgb),0.1)]",
              (!selected || isSubmitting) ? "opacity-30 cursor-not-allowed grayscale" : "hover:scale-105 active:scale-95 hover:shadow-[0_20px_50px_rgba(var(--main-rgb),0.2)]"
            )}
          >
            {isSubmitting ? "Finalizing..." : "Enter Workspace"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-center">
              Need a manager role? Join as staff and request status from admin.
            </p>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 text-text-muted hover:text-white text-xs font-bold transition-colors mt-4"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
