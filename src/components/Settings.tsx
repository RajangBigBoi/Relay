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
  Smartphone
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
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
          label: '2FA Verification', 
          description: 'Requirement for shift-lead operational commitment.',
          action: <span className="text-[10px] font-black text-low uppercase tracking-widest bg-low/10 px-3 py-1.5 rounded-lg border border-low/20">Active</span>
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
        <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Settings</h2>
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
                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">{section.title}</h3>
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{section.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-glass-border">
              {section.items.map((item, i) => (
                <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{item.label}</p>
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
