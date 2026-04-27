import React, { useState } from 'react';
import { DutyLog } from '../types';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { LogDetailModal } from './DutyLogList';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { recordAuditLog } from '../lib/auditService';

const STATUS_COLORS = {
  Open: 'bg-red-500',
  'In Progress': 'bg-yellow-500',
  Pending: 'bg-blue-500',
  Resolved: 'bg-green-500',
};

export function Dashboard({ logs }: { logs: DutyLog[] }) {
  const { profile, hasPermission, user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<DutyLog | null>(null);

  const openCases = logs.filter(l => l.status !== 'Resolved');
  const urgentCases = openCases.filter(l => l.priority === 'Critical');

  const handleUpdateLog = async (logId: string, updates: Partial<DutyLog>) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const isOnlyStatusUpdate = Object.keys(updates).length === 1 && updates.status;
    const isOwner = log.owner_id === user?.uid;
    const canEdit = hasPermission('edit_all_cases') || (hasPermission('edit_own_cases') && isOwner);
    const canPerformAction = canEdit || (isOnlyStatusUpdate && hasPermission('resolve_cases'));

    if (!canPerformAction) {
      alert("Insufficient permissions to update this case.");
      return;
    }

    const changes = Object.entries(updates).map(([field, new_value]) => ({
      field,
      old_value: (log as any)[field],
      new_value
    })).filter(c => c.old_value !== c.new_value);

    try {
      await updateDoc(doc(db, 'duty_logs', logId), updates);
      if (changes.length > 0) {
        await recordAuditLog(logId, 'duty_logs', 'update', changes);
      }
    } catch (err) {
      console.error("Error updating log:", err);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-main">Duty Management</h1>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.15em] mt-1">Relay | Shift Overview</p>
        </div>
      </div>

      {/* Urgent Alerts */}
      <AnimatePresence>
        {urgentCases.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-critical/10 backdrop-blur-md border border-critical/30 p-4 rounded-2xl flex items-center gap-4 group"
          >
            <div className="w-2.5 h-2.5 bg-critical rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
            <div className="flex-1 text-sm text-main">
              <span className="font-bold mr-2">Urgent Case:</span>
              <span className="opacity-80">{urgentCases[0].issue_type} in Room {urgentCases[0].room_number}. </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Cases', value: openCases.length, color: 'text-main' },
          { label: 'Urgent Alerts', value: urgentCases.length, color: 'text-critical' },
          { label: 'Resolution Rate', value: `${logs.length > 0 ? Math.round((logs.filter(l => l.status === 'Resolved').length / logs.length) * 100) : 0}%`, color: 'text-main' },
          { label: 'Shift Status', value: 'Ready', color: 'text-low' },
        ].map((stat, i) => (
          <div key={i} className="bg-glass backdrop-blur-[10px] border border-glass-border p-6 rounded-2xl shadow-sm">
            <p className="text-text-muted text-[11px] uppercase tracking-widest font-bold mb-3">{stat.label}</p>
            <p className={cn("text-3xl font-bold tracking-tighter", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold tracking-widest text-text-muted uppercase">Recent Incidents</h2>
          </div>
          <div className="bg-glass backdrop-blur-[10px] border border-glass-border rounded-[20px] overflow-hidden shadow-lg">
            <div className="grid grid-cols-[100px_1fr_100px_120px] px-6 py-4 border-b border-glass-border text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <div>Log ID</div>
              <div>Details</div>
              <div>Location</div>
              <div className="text-right">Status</div>
            </div>
            <div className="divide-y divide-glass-border">
              {logs.slice(0, 8).map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="grid grid-cols-[100px_1fr_100px_120px] px-6 py-4 items-center hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="text-[12px] font-bold opacity-50 group-hover:opacity-100 transition-opacity text-main">#{log.case_id}</div>
                  <div>
                    <h4 className="text-sm font-medium group-hover:translate-x-1 transition-transform text-main">{log.issue_type}</h4>
                    <p className="text-xs text-text-muted line-clamp-1">{log.description}</p>
                  </div>
                  <div className="text-sm font-bold opacity-70 text-main">Room {log.room_number}</div>
                  <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-tighter text-main">
                    <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[log.status as keyof typeof STATUS_COLORS])} />
                    {log.status === 'In Progress' ? 'Active' : log.status}
                  </div>
                </div>
              ))}
            </div>
            {logs.length === 0 && (
              <div className="p-16 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 opacity-10 mx-auto text-main" />
                <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]">No Active Incidents</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-text-muted uppercase">Operational Status</h2>
          <div className="bg-glass border border-glass-border rounded-3xl p-6 space-y-6 shadow-md">
             <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted uppercase font-bold tracking-widest">System Health</span>
                <span className="text-[10px] text-low font-bold">STABLE</span>
             </div>
             <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-low w-[98%]" />
                </div>
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Operational workflows are fully functional</p>
             </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {selectedLog && (
          <LogDetailModal 
            log={selectedLog} 
            onClose={() => setSelectedLog(null)} 
            onUpdate={(updates) => handleUpdateLog(selectedLog.id, updates)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
