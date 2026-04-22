import React, { useState, useEffect } from 'react';
import { 
  QueryClient, 
  QueryClientProvider,
} from '@tanstack/react-query';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Outlet, 
  NavLink, 
  useLocation 
} from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Users, 
  Plus, 
  Bell,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Database,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, signOut } from './lib/firebase';
import { cn } from './lib/utils';
import { DutyLog } from './types';
import { DutyLogList, LogEntryModal } from './components/DutyLogList';
import { Checklist } from './components/Checklist';
import { Handover } from './components/Handover';
import { MyTasks } from './components/MyTasks';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { StaffList } from './components/StaffList';
import { AuditLogViewer } from './components/AuditLogViewer';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { CreateAccountPage } from './components/CreateAccountPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient();

// Theme Persistence Hook
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

function Navigation({ unreadCount }: { unreadCount: number }) {
  const { hasPermission } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckCircle2, path: '/app/tasks' },
    { id: 'logs', label: 'Duty Log', icon: FileText, path: '/app/logs' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/app/analytics' },
    { id: 'handovers', label: 'Handovers', icon: Clock, path: '/app/handovers' },
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, path: '/app/checklist' },
    ...(hasPermission('view_audit_logs') ? [{ id: 'audit', label: 'Audit Logs', icon: Database, path: '/app/audit' }] : []),
    { id: 'staff', label: 'Staff', icon: Users, path: '/app/staff' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/app/settings' },
  ];

  return (
    <>
      <div className="hidden lg:flex w-[72px] bg-sidebar-bg border-r border-glass-border flex-col h-full py-6 items-center gap-8 z-20 backdrop-blur-xl">
        <div className="mb-4">
          <NavLink to="/app/dashboard" className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xs tracking-tighter">RLY</NavLink>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-5">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.label}
              className={({ isActive }) => cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all group relative",
                isActive 
                  ? "bg-glass-border/10 text-inherit border border-glass-border shadow-sm" 
                  : "text-text-muted hover:text-inherit hover:bg-glass"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute -left-4 w-1 h-4 bg-inherit border-l-2 border-inherit rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-glass-border">
          <button 
            onClick={signOut}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-critical/50 hover:text-critical hover:bg-critical/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-dark/80 backdrop-blur-2xl border-t border-glass-border flex items-center justify-around px-4 z-[50]">
        {menuItems.filter(i => ['dashboard', 'my-tasks', 'logs', 'analytics', 'settings'].includes(i.id)).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-inherit" : "text-text-muted"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.id === 'dashboard' ? 'Home' : item.id.split('-')[0]}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}

function MainLayout() {
  const { user, profile, hasPermission, loading: authLoading } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logs, setLogs] = useState<DutyLog[]>([]);
  const { addNotification, unreadCount } = useNotifications();
  const location = useLocation();
  const theme = useTheme();

  // RT Notification Listener for Critical Cases
  useEffect(() => {
    if (!profile) return;

    const baseRef = collection(db, 'duty_logs');
    let q;

    if (hasPermission('view_all_cases')) {
      q = query(baseRef, orderBy('created_at', 'desc'));
    } else {
      q = query(
        baseRef, 
        where('department', '==', profile.department),
        orderBy('created_at', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data() as DutyLog;
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
    }, (error) => {
      console.error("Firestore Listener Error:", error);
    });
    return () => unsubscribe();
  }, [addNotification, profile, hasPermission]);

  useEffect(() => {
    if (!profile) return;
    
    const q = query(collection(db, 'checklists'));
    const unsubscribe = onSnapshot(q, (s) => {
      if (s.empty) {
        const defaultTasks = [
          { task_name: 'Float Count & Handover', category: 'Front Desk', shift: 'AM', required: true, completed: false, department: 'Management' },
          { task_name: 'Safety Walkthrough', category: 'Security', shift: 'AM', required: true, completed: false, department: 'Security' },
          { task_name: 'Key Audit', category: 'Front Desk', shift: 'AM', required: true, completed: false, department: 'Front Office' },
          { task_name: 'Pending Trace Review', category: 'Operations', shift: 'AM', required: true, completed: false, department: 'Management' },
        ];
        defaultTasks.forEach(t => addDoc(collection(db, 'checklists'), { ...t, created_at: serverTimestamp() }));
      }
    }, (error) => {
      console.error("Checklist Seeding Error:", error);
    });
    return () => unsubscribe();
  }, [profile]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const viewName = location.pathname.split('/').pop() || 'dashboard';

  return (
    <div className="flex h-screen bg-bg-dark font-sans selection:bg-slate-200/50">
      <Navigation unreadCount={unreadCount} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent pb-16 lg:pb-0">
        <header className="h-20 border-b border-glass-border flex items-center justify-between px-6 lg:px-10 bg-header-bg backdrop-blur-xl sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black tracking-widest uppercase">Relay</p>
              <div className="w-1 h-1 bg-text-muted rounded-full hidden sm:block" />
              <p className="text-[11px] text-text-muted font-black uppercase tracking-widest hidden sm:block">{viewName.replace('-', ' ')}</p>
            </div>
            <div className="h-4 w-[1px] bg-glass-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-low shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-[10px] opacity-50 font-black uppercase tracking-[0.2em] hidden xs:block">Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3 lg:gap-4">
              {hasPermission('create_cases') && (
                <button 
                  onClick={() => setIsLogModalOpen(true)}
                  className="bg-inherit border border-glass-border px-4 lg:px-6 py-2 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest hover:bg-glass transition-all flex items-center gap-2 shadow-xl shadow-glass-border/5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Log</span>
                </button>
              )}
              
              <div className="relative group cursor-pointer p-2 hover:bg-glass rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-text-muted group-hover:text-inherit transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-critical rounded-full border-2 border-bg-dark flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">{unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4 border-l border-glass-border pl-4 lg:pl-8">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black leading-tight text-inherit">{profile?.name || user.displayName || 'Staff'}</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{profile?.role || 'Identifying...'}</p>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${profile?.name || user.displayName || 'User'}&background=random`} 
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl border border-glass-border shadow-lg" 
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
          <Outlet context={{ logs, user, profile, hasPermission }} />
        </main>
      </div>

      <LogEntryModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </div>
  );
}

// Wrapper components for nested routes to access context
const DashboardWrapper = () => {
    const { logs, profile, user, hasPermission } = (window as any).routerContext || {}; 
    // This is a bit tricky with Outlet context if we don't use useOutletContext
    // We will use useOutletContext inside the components themselves.
    return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/create-account" element={<CreateAccountPage />} />

              {/* Protected Routes */}
              <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                 <Route index element={<Navigate to="/app/dashboard" replace />} />
                 <Route path="dashboard" element={<DashboardLoader />} />
                 <Route path="tasks" element={<TasksLoader />} />
                 <Route path="logs" element={<LogsLoader />} />
                 <Route path="analytics" element={<AnalyticsLoader />} />
                 <Route path="handovers" element={<HandoversLoader />} />
                 <Route path="checklist" element={<Checklist />} />
                 <Route path="audit" element={<AuditLoader />} />
                 <Route path="staff" element={<StaffLoader />} />
                 <Route path="settings" element={<Settings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Sub-loaders to handle cross-component state passing through useOutletContext
import { useOutletContext } from 'react-router-dom';

type ContextType = { logs: DutyLog[], user: any, profile: any, hasPermission: any };

function DashboardLoader() {
  const { logs, profile, hasPermission, user } = useOutletContext<ContextType>();
  return <Dashboard logs={logs.filter(l => profile?.role === 'Admin' || hasPermission('view_all_cases') || l.department === profile?.department || l.owner_id === user?.uid)} />;
}

function TasksLoader() {
  const { logs, user } = useOutletContext<ContextType>();
  return <MyTasks logs={logs.filter(l => l.owner_id === user?.uid)} user={user} />;
}

function LogsLoader() {
  const { logs } = useOutletContext<ContextType>();
  return <DutyLogList logs={logs} />;
}

function AnalyticsLoader() {
  const { logs, profile, hasPermission } = useOutletContext<ContextType>();
  return <Analytics logs={logs.filter(l => profile?.role === 'Admin' || hasPermission('view_all_cases') || l.department === profile?.department)} />;
}

function HandoversLoader() {
  const { logs, profile, hasPermission } = useOutletContext<ContextType>();
  if (!hasPermission('submit_handover')) return <Navigate to="/app/dashboard" replace />;
  return <Handover openLogs={logs.filter(l => l.status !== 'Resolved' && (profile?.role === 'Admin' || l.department === profile?.department))} />;
}

function StaffLoader() {
  const { hasPermission } = useOutletContext<ContextType>();
  if (!hasPermission('manage_staff')) return <Navigate to="/app/dashboard" replace />;
  return <StaffList />;
}

function AuditLoader() {
  const { hasPermission } = useOutletContext<ContextType>();
  if (!hasPermission('view_audit_logs')) return <Navigate to="/app/dashboard" replace />;
  return <AuditLogViewer />;
}
