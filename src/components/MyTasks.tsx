import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User as UserIcon,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import { DutyLog } from '../types';
import { User } from 'firebase/auth';

export function MyTasks({ logs, user }: { logs: DutyLog[], user: User }) {
  const openTasks = logs.filter(l => l.status !== 'Resolved');
  const resolvedTasks = logs.filter(l => l.status === 'Resolved');

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto text-main">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main transition-all">My Tasks</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Assignments for {user.displayName?.split(' ')[0]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-main uppercase tracking-[0.25em] flex items-center gap-3">
              <span className="w-2 h-2 bg-high rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              Current Jobs ({openTasks.length})
            </h3>
          </div>
          <div className="grid gap-6">
            {openTasks.map((log) => (
              <div key={log.id} className="bg-glass backdrop-blur-md border border-glass-border rounded-[28px] p-8 space-y-6 hover:border-glass-border/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-8 -mt-8" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-main/30 uppercase tracking-[0.2em]">#{log.case_id}</span>
                    <h4 className="text-2xl font-bold text-main tracking-tight leading-tight group-hover:translate-x-1 transition-transform">{log.issue_type}</h4>
                    <p className="text-sm text-text-muted line-clamp-2 max-w-lg mt-2">{log.description}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border",
                    log.priority === 'Critical' ? "bg-critical/20 text-critical border-critical/30" : "bg-glass border-glass-border text-text-muted"
                  )}>
                    {log.priority}
                  </div>
                </div>
                
                <div className="flex items-center gap-8 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-glass border border-glass-border flex items-center justify-center text-text-muted">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mb-1">LOCATION</p>
                      <p className="text-sm font-bold text-main/90 leading-none">Room {log.room_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-glass border border-glass-border flex items-center justify-center text-text-muted">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mb-1">LOGGED</p>
                      <p className="text-sm font-bold text-main/90 leading-none">{log.created_at ? formatTime(log.created_at.toDate()) : 'Now'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-glass-border flex gap-3 relative z-10">
                  <button className="flex-1 bg-main text-bg-dark py-4 rounded-[14px] text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl">
                    Update Progress
                  </button>
                  <button className="px-6 py-4 bg-glass border border-glass-border text-main rounded-[14px] hover:bg-glass-border/10 transition-all">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {openTasks.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-glass-border rounded-[32px] space-y-6 bg-white/[0.01] backdrop-blur-sm">
                <div className="w-16 h-16 rounded-3xl bg-low/10 border border-low/20 flex items-center justify-center mx-auto shadow-2xl shadow-low/5">
                  <CheckCircle2 className="w-8 h-8 text-low" />
                </div>
                <div>
                  <p className="text-main font-black text-sm uppercase tracking-[0.2em] mb-2">No Active Tasks</p>
                  <p className="text-text-muted font-bold text-[10px] uppercase tracking-widest opacity-50">You have no pending jobs at this time</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.25em]">Resolved Log</h3>
            <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest">{resolvedTasks.length} ITEMS</span>
          </div>
          <div className="space-y-3">
            {resolvedTasks.slice(0, 8).map((log) => (
              <div key={log.id} className="p-5 bg-white/[0.02] border border-glass-border rounded-[20px] flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-low/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-low opacity-60" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white/60 line-through decoration-white/20 group-hover:text-white/80 transition-colors uppercase tracking-tight">{log.issue_type}</p>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">ROOM {log.room_number}</p>
                  </div>
                </div>
              </div>
            ))}
            {resolvedTasks.length === 0 && (
              <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.2em] text-center py-8">No Recent History</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
