import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  MessageSquare, 
  History, 
  FileText,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Send,
  Lock
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { DutyLog, Shift, HandoverNote } from '../types';

export function Handover({ openLogs }: { openLogs: DutyLog[] }) {
  const { profile, hasPermission } = useAuth();
  const [notes, setNotes] = useState('');
  const [toShift, setToShift] = useState<Shift>('PM');
  const [history, setHistory] = useState<HandoverNote[]>([]);

  useEffect(() => {
    if (!profile) return;

    let q = query(
      collection(db, 'handover_notes'),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    if (profile.role !== 'Admin') {
      q = query(
        collection(db, 'handover_notes'),
        where('department', '==', profile.department),
        orderBy('created_at', 'desc'),
        limit(5)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (error) => {
      console.error("Handover History Listener Error:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSubmit = async () => {
    if (!hasPermission('submit_handover')) {
      alert("Insufficient permissions to submit handover notes.");
      return;
    }
    if (!notes.trim()) return;
    try {
      await addDoc(collection(db, 'handover_notes'), {
        date: new Date().toISOString().split('T')[0],
        from_shift: 'AM', // Should be dynamic in a full app
        to_shift: toShift,
        notes,
        unresolved_case_ids: openLogs.map(l => l.case_id),
        department: profile?.department || 'Front Office',
        created_at: serverTimestamp(),
        author: profile?.name || auth.currentUser?.displayName
      });
      setNotes('');
      alert("Handover recorded successfully");
    } catch (e) {
      console.error(e);
    }
  };

  const filteredLogs = openLogs.filter(log => {
      if (profile?.role === 'Admin') return true;
      return log.department === profile?.department;
  });

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">Shift Handover</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">
            {profile?.role === 'Admin' ? 'Global Operational Bridge' : `${profile?.department} Operational Bridge`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-glass backdrop-blur-[10px] border border-glass-border rounded-[32px] p-10 space-y-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-6">
              <div className="px-5 py-2.5 bg-white/5 border border-glass-border rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-white/50">CURRENT SHIFT</div>
              <div className="w-8 h-8 rounded-full border border-glass-border flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </div>
              <div className="relative">
                <select 
                  value={toShift}
                  onChange={(e) => setToShift(e.target.value as any)}
                  className="pl-5 pr-10 py-2.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] cursor-pointer shadow-2xl appearance-none"
                >
                  <option value="PM">PM SHIFT</option>
                  <option value="Night">NIGHT SHIFT</option>
                  <option value="AM">AM SHIFT (NEXT)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.25em] block pl-1">Operational Summary & Handover Brief</label>
              <div className="relative">
                <textarea 
                  rows={10}
                  readOnly={!hasPermission('submit_handover')}
                  className={cn(
                    "w-full bg-white/[0.02] border border-glass-border rounded-[24px] p-8 text-sm focus:outline-none transition-all resize-none shadow-inner text-white/90 placeholder-text-muted/30",
                    hasPermission('submit_handover') ? "focus:border-white/20" : "opacity-50 cursor-not-allowed"
                  )}
                  placeholder="Log critical incidents, VIP guest requests, and mandatory follow-ups for the incoming shift lead..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                {!hasPermission('submit_handover') && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-bg-dark/90 px-6 py-4 rounded-2xl border border-glass-border flex items-center gap-3">
                        <Lock className="w-4 h-4 text-text-muted" />
                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Entry Restricted</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3 max-w-[340px]">
                <div className="w-1.5 h-1.5 rounded-full bg-medium animate-pulse" />
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-relaxed">
                  Attestation: I confirm all departmental operational intelligence has been recorded.
                </p>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={!hasPermission('submit_handover')}
                className={cn(
                  "bg-white text-black px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden group relative",
                  !hasPermission('submit_handover') && "opacity-30 cursor-not-allowed"
                )}
              >
                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Commit Handover</span>
                <Send className="w-4 h-4 relative z-10" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-glass/50 backdrop-blur-md border border-glass-border rounded-[28px] p-8 space-y-6">
            <h3 className="text-white font-black flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border-b border-glass-border pb-4">
              <AlertTriangle className="w-4 h-4 text-high" />
              Relayed Cases ({filteredLogs.length})
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-5 bg-white/[0.03] border border-glass-border rounded-[20px] group hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">#{log.case_id}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      log.priority === 'Critical' ? "text-critical border-critical/30 bg-critical/10" : "text-text-muted border-white/10"
                    )}>{log.priority}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1 group-hover:translate-x-1 transition-transform">{log.issue_type}</p>
                  <p className="text-[11px] text-text-muted font-bold tracking-wider">ROOM {log.room_number}</p>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-10 space-y-3 opacity-30">
                  <CheckCircle2 className="w-10 h-10 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Carryover</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-glass/30 backdrop-blur-sm border border-glass-border rounded-[28px] p-8 space-y-6">
            <h3 className="text-white font-black flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
              <History className="w-4 h-4 text-text-muted" />
              Recent Logs
            </h3>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={h.id} className="text-[10px] text-text-muted group cursor-pointer border-b border-glass-border pb-4 last:border-0 last:pb-0">
                  <div className="font-black flex justify-between uppercase tracking-widest text-white/50 group-hover:text-white transition-colors mb-2">
                    <span>{h.from_shift} → {h.to_shift}</span>
                    <span>{h.date}</span>
                  </div>
                  <p className="line-clamp-2 italic opacity-40 group-hover:opacity-60 transition-opacity">"{h.notes}"</p>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-[10px] text-text-muted/40 uppercase font-black text-center py-4">No recent history</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
