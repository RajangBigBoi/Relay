import React, { useEffect, useState } from 'react';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Globe, 
  Shield, 
  Database,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function Settings() {
  const { profile } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const sections = [
    {
      title: 'Appearance',
      subtitle: 'Customize the visual experience',
      icon: Monitor,
      items: [
        { 
          label: 'Interface Theme', 
          description: 'Switch between light and dark operational modes.',
          action: (
            <div className="flex bg-white/5 p-1 rounded-xl border border-glass-border">
              <button 
                onClick={() => setTheme('light')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  theme === 'light' ? "bg-white text-black shadow-lg" : "text-text-muted hover:text-white"
                )}
              >
                <Sun className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  theme === 'dark' ? "bg-white text-black shadow-lg" : "text-text-muted hover:text-white"
                )}
              >
                <Moon className="w-5 h-5" />
              </button>
            </div>
          )
        }
      ]
    },
    {
      title: 'Communications',
      subtitle: 'System alert & notification management',
      icon: Bell,
      items: [
        { 
          label: 'Desktop Notifications', 
          description: 'Enable real-time operational alerts in your browser.',
          action: <Toggle enabled={true} />
        },
        { 
          label: 'Critical Alert Sound', 
          description: 'Trigger audible alerts for Priority 1 cases.',
          action: <Toggle enabled={false} />
        }
      ]
    },
    {
      title: 'Data & Security',
      subtitle: 'Access logs & system integrity',
      icon: Shield,
      items: [
        { 
          label: 'Operational Role', 
          description: `Assigned to ${profile?.department} as ${profile?.role}.`,
          action: <span className="text-[10px] font-bold text-text-muted italic">Contact Admin to Change</span>
        },
        { 
          label: '2FA Verification', 
          description: 'Multi-factor requirement for operational commitments.',
          action: (
            <TwoFactorToggle 
              enabled={profile?.two_factor_enabled || false} 
              userId={profile?.id || ''} 
            />
          )
        },
        { 
          label: 'Data Retention', 
          description: 'Current ledger archive policy set to 24 months.',
          action: <button className="text-[10px] font-black text-white hover:underline uppercase tracking-widest">Update</button>
        }
      ]
    }
  ];

  return (
    <div className="p-10 space-y-10 max-w-4xl mx-auto custom-scrollbar">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-sans">Settings</h2>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">System configuration & preferences</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-glass border border-glass-border rounded-[32px] overflow-hidden">
            <div className="p-8 border-b border-glass-border flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-glass-border">
                <section.icon className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">{section.title}</h3>
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{section.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-glass-border">
              {section.items.map((item, i) => (
                <div key={i} className="p-8 flex items-center justify-between hover:bg-glass transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-text-muted max-w-[400px]">{item.description}</p>
                  </div>
                  <div>{item.action}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 flex border-t border-glass-border">
         <div className="flex items-center gap-4 text-text-muted/40">
           <Database className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">RELAY CORE v2.4.0 (Build 9045)</span>
         </div>
      </div>
    </div>
  );
}

function TwoFactorToggle({ enabled, userId }: { enabled: boolean, userId: string }) {
  const [showSetup, setShowSetup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggle = async () => {
    if (!userId) return;
    
    if (!enabled) {
      setShowSetup(true);
      return;
    }

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'staffMembers', userId), {
        two_factor_enabled: false
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update 2FA status");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmSetup = async () => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'staffMembers', userId), {
        two_factor_enabled: true
      });
      setShowSetup(false);
    } catch (err) {
      console.error(err);
      alert("Failed to enable 2FA");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border",
          enabled ? "bg-low/10 text-low border-low/20" : "bg-white/5 text-text-muted border-white/10"
        )}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        <button 
          onClick={toggle}
          disabled={isUpdating}
          className={cn(
            "w-12 h-6 rounded-full transition-all relative p-1",
            enabled ? "bg-low shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "bg-white/10",
            isUpdating && "opacity-50 cursor-wait"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded-full transition-all shadow-md transform",
            enabled ? "translate-x-6 bg-white" : "translate-x-0 bg-text-muted"
          )} />
        </button>
      </div>

      <AnimatePresence>
        {showSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-header-bg border border-glass-border rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 rounded-2xl border border-glass-border">
                  <Smartphone className="w-6 h-6 text-main" />
                </div>
                <button onClick={() => setShowSetup(false)} className="text-text-muted hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Setup Authenticator</h3>
                <p className="text-sm text-text-muted">Enhance your account security by linking your mobile authenticator app.</p>
              </div>

              <div className="bg-glass border border-glass-border p-8 rounded-3xl flex items-center justify-center">
                <div className="p-4 bg-white rounded-2xl">
                  <QrCode className="w-32 h-32 text-black" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-glass-border rounded-2xl">
                  <div className="w-8 h-8 rounded-lg bg-main/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-main" />
                  </div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-relaxed">
                    Scan the code above in Google Authenticator or Microsoft Authenticator.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowSetup(false)}
                    className="flex-1 px-6 py-4 bg-white/5 border border-glass-border text-text-muted rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmSetup}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-4 bg-main text-bg-dark rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-main/10"
                  >
                    {isUpdating ? 'Enabling...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  const [active, setActive] = useState(enabled);
  return (
    <button 
      onClick={() => setActive(!active)}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative p-1",
        active ? "bg-low shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "bg-white/10"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full transition-all shadow-md transform",
        active ? "translate-x-6 bg-white" : "translate-x-0 bg-text-muted"
      )} />
    </button>
  );
}
