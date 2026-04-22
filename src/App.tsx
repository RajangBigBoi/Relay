import React, { useState, useEffect } from 'react';
import { 
  QueryClient, 
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Bell,
  LogOut,
  ChevronRight,
  AlertCircle,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, signIn, signOut } from './lib/firebase';
import { cn, formatTime, formatDate } from './lib/utils';
import { DutyLog, Shift, Priority, Status, ShiftChecklist } from './types';
import { DutyLogList, LogEntryModal } from './components/DutyLogList';
import { Checklist } from './components/Checklist';
import { Handover } from './components/Handover';
import { MyTasks } from './components/MyTasks';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { StaffList } from './components/StaffList';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

const queryClient = new QueryClient();

const STATUS_COLORS = {
  Open: 'bg-red-500',
  'In Progress': 'bg-yellow-500',
  Pending: 'bg-blue-500',
  Resolved: 'bg-green-500',
};

function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-6 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      
      <div className="max-w-md w-full bg-glass backdrop-blur-3xl border border-glass-border p-12 rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] text-center space-y-10 relative z-10">
        <div className="space-y-3">
          <h1 className="text-6xl font-display font-black tracking-tighter text-white">RELAY</h1>
          <p className="text-text-muted uppercase text-[11px] font-black tracking-[0.4em]">Operations Ledger</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={signIn}
            className="w-full bg-white text-black py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-2xl flex items-center justify-center gap-4 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/5 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="G" />
            <span className="relative z-10">Authenticate via Google</span>
          </button>
          
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-loose">
            Secure high-speed access for<br/>Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ logs }: { logs: DutyLog[] }) {
  const openCases = logs.filter(l => l.status !== 'Resolved');
  const criticalCases = openCases.filter(l => l.priority === 'Critical');

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Operations Dashboard</h1>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.15em] mt-1">Relay | Real-time Visibility</p>
        </div>
      </div>

      {/* Critical Alerts */}
      <AnimatePresence>
        {criticalCases.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 backdrop-blur-md border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 group"
          >
            <div className="w-2.5 h-2.5 bg-critical rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
            <div className="flex-1 text-sm">
              <span className="font-bold text-white mr-2">Critical Issue:</span>
              <span className="text-white/80">{criticalCases[0].issue_type} in Room {criticalCases[0].room_number}. </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Cases', value: openCases.length, color: 'text-white' },
          { label: 'Critical Today', value: criticalCases.length, color: 'text-critical' },
          { label: 'Resolution Rate', value: `${logs.length > 0 ? Math.round((logs.filter(l => l.status === 'Resolved').length / logs.length) * 100) : 0}%`, color: 'text-white' },
          { label: 'Shift Handover', value: 'Ready', color: 'text-low' },
        ].map((stat, i) => (
          <div key={i} className="bg-glass backdrop-blur-[10px] border border-glass-border p-6 rounded-2xl">
            <p className="text-text-muted text-[11px] uppercase tracking-widest font-bold mb-3">{stat.label}</p>
            <p className={cn("text-3xl font-bold tracking-tighter", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold tracking-widest text-text-muted uppercase">Recent Activity</h2>
          </div>
          <div className="bg-glass backdrop-blur-[10px] border border-glass-border rounded-[20px] overflow-hidden">
            <div className="grid grid-cols-[100px_1fr_100px_120px] px-6 py-4 border-b border-glass-border text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <div>Case ID</div>
              <div>Description</div>
              <div>Room</div>
              <div className="text-right">Status</div>
            </div>
            <div className="divide-y divide-white/5">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="grid grid-cols-[100px_1fr_100px_120px] px-6 py-4 items-center hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">#{log.case_id}</div>
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:translate-x-1 transition-transform">{log.issue_type}</h4>
                    <p className="text-xs text-text-muted line-clamp-1">{log.description}</p>
                  </div>
                  <div className="text-sm font-bold text-white/70">R-{log.room_number}</div>
                  <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-tighter">
                    <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[log.status as keyof typeof STATUS_COLORS])} />
                    {log.status === 'In Progress' ? 'Active' : log.status}
                  </div>
                </div>
              ))}
            </div>
            {logs.length === 0 && (
              <div className="p-16 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-white/10 mx-auto" />
                <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]">Clear Operations</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-text-muted uppercase">Operational Status</h2>
          <div className="bg-glass border border-glass-border rounded-3xl p-6 space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted uppercase font-bold tracking-widest">System Health</span>
                <span className="text-[10px] text-low font-bold">STABLE</span>
             </div>
             <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-low w-[98%]" />
                </div>
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">All units operational | Latency: 42ms</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Theme Persistence Hook
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

// Sidebar & Bottom Nav Components
function Navigation({ activeView, setActiveView, unreadCount }: { activeView: string, setActiveView: (v: string) => void, unreadCount: number }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckCircle2 },
    { id: 'logs', label: 'Duty Log', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'handovers', label: 'Handovers', icon: Clock },
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[72px] bg-sidebar-bg border-r border-glass-border flex-col h-full py-6 items-center gap-8 z-20 backdrop-blur-xl">
        <div className="mb-4">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xs tracking-tighter">RLY</div>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={item.label}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all group relative",
                activeView === item.id 
                  ? "bg-white/10 text-white border border-glass-border shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                  : "text-text-muted hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {activeView === item.id && (
                <motion.div layoutId="sidebar-active" className="absolute -left-4 w-1 h-4 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-glass-border">
          <button 
            onClick={signOut}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-dark/80 backdrop-blur-2xl border-t border-glass-border flex items-center justify-around px-4 z-[50]">
        {[menuItems[0], menuItems[1], menuItems[2], menuItems[3], menuItems[6]].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeView === item.id ? "text-white" : "text-text-muted"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.id === 'dashboard' ? 'Home' : item.id.split('-')[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MainLayout({ user }: { user: User }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logs, setLogs] = useState<DutyLog[]>([]);
  const { addNotification, unreadCount } = useNotifications();
  const theme = useTheme();

  // RT Notification Listener for Critical Cases
  useEffect(() => {
    const q = query(collection(db, 'duty_logs'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data() as DutyLog;
            // Prevent notifying self-created logs or old logs on load
            const createdAt = data.created_at?.toDate() || new Date();
            const isRecent = (new Date().getTime() - createdAt.getTime()) < 5000;
            
            if (isRecent && data.priority === 'Critical') {
              addNotification(
                'Critical Alert Detected',
                `${data.issue_type} in Room ${data.room_number}`,
                'critical'
              );
            }
        }
      });
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DutyLog)));
    });
    return () => unsubscribe();
  }, [addNotification]);

  useEffect(() => {
    const q = query(collection(db, 'checklists'));
    const unsubscribe = onSnapshot(q, (s) => {
      if (s.empty) {
        const defaultTasks = [
          { task_name: 'Float Count & Handover', category: 'Front Desk', shift: 'AM', required: true, completed: false },
          { task_name: 'Safety Walkthrough', category: 'Security', shift: 'AM', required: true, completed: false },
          { task_name: 'Key Audit', category: 'Front Desk', shift: 'AM', required: true, completed: false },
          { task_name: 'Pending Trace Review', category: 'Operations', shift: 'AM', required: true, completed: false },
        ];
        defaultTasks.forEach(t => addDoc(collection(db, 'checklists'), t));
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-bg-dark text-white font-sans selection:bg-white/10">
      <Navigation activeView={activeView} setActiveView={setActiveView} unreadCount={unreadCount} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent pb-16 lg:pb-0">
        <header className="h-20 border-b border-glass-border flex items-center justify-between px-6 lg:px-10 bg-header-bg backdrop-blur-xl sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-white tracking-widest uppercase">Relay</p>
              <div className="w-1 h-1 bg-text-muted rounded-full hidden sm:block" />
              <p className="text-[11px] text-text-muted font-black uppercase tracking-widest hidden sm:block">{activeView.replace('-', ' ')}</p>
            </div>
            <div className="h-4 w-[1px] bg-glass-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-low shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] hidden xs:block">Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="bg-white text-black px-4 lg:px-6 py-2 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Log</span>
              </button>
              
              <div className="relative group cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-critical rounded-full border-2 border-bg-dark flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">{unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4 border-l border-glass-border pl-4 lg:pl-8">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-tight">{user.displayName || 'Staff'}</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Duty Manager</p>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl border border-glass-border shadow-lg" 
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
          {activeView === 'dashboard' && <Dashboard logs={logs} />}
          {activeView === 'my-tasks' && <MyTasks logs={logs.filter(l => l.owner === user.displayName)} user={user} />}
          {activeView === 'logs' && <DutyLogList logs={logs} />}
          {activeView === 'analytics' && <Analytics logs={logs} />}
          {activeView === 'handovers' && <Handover openLogs={logs.filter(l => l.status !== 'Resolved')} />}
          {activeView === 'checklist' && <Checklist />}
          {activeView === 'settings' && <Settings />}
          {activeView === 'staff' && <StaffList />}
        </main>
      </div>

      <LogEntryModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl font-display font-black tracking-tighter text-white animate-pulse">RELAY</h1>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
          <motion.div 
            className="h-full bg-white"
            animate={{ x: [-200, 200] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {!user ? <LoginScreen /> : <MainLayout user={user} />}
      </NotificationProvider>
    </QueryClientProvider>
  );
}
