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
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [noIssues, setNoIssues] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Select all cases by default for convenience
    setSelectedCaseIds(openLogs.map(l => l.case_id));
  }, [openLogs]);

  const getNextShift = (current: Shift): Shift => {
    if (current === 'AM') return 'PM';
    if (current === 'PM') return 'Night';
    return 'AM';
  };

  useEffect(() => {
    if (!profile) return;
    
    // Set default TO shift based on current shift logic if we had current shift
    // For now we use the state 'toShift' and cycle it after submit.
  }, [profile]);

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
      
      // Auto-detect last shift to set current one
      if (!snapshot.empty) {
          const lastHandover = snapshot.docs[0].data() as HandoverNote;
          setToShift(getNextShift(lastHandover.to_shift));
      }
    }, (error) => {
      console.error("Handover History Error:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCaseIds(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId) 
        : [...prev, caseId]
    );
  };

  const handleSubmit = async () => {
    if (!hasPermission('submit_handover')) {
      alert("Insufficient permissions to submit handover notes.");
      return;
    }
    if (!confirmed) {
      alert("Please confirm the shift information sharing by clicking the confirmation checkbox.");
      return;
    }
    if (!noIssues && !notes.trim()) {
      alert("Please provide handover notes or confirm 'No Issues Reported'.");
      return;
    }

    try {
      // Determine the 'FROM' shift - usually it's the one BEFORE toShift
      const getFromShift = (to: Shift): Shift => {
          if (to === 'PM') return 'AM';
          if (to === 'Night') return 'PM';
          return 'Night';
      };

      await addDoc(collection(db, 'handover_notes'), {
        date: new Date().toISOString().split('T')[0],
        from_shift: getFromShift(toShift), 
        to_shift: toShift,
        notes: noIssues ? "No issues reported during shift." : notes,
        unresolved_case_ids: selectedCaseIds,
        department: profile?.department || 'Front Office',
        created_at: serverTimestamp(),
        author: profile?.name || auth.currentUser?.displayName
      });
      
      // Cycle to the next shift after successful submission
      setToShift(prev => getNextShift(prev));
      setNotes('');
      setNoIssues(false);
      setConfirmed(false);
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
          <h2 className="text-3xl font-bold tracking-tight text-main font-display">Shift Handover</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">
            {profile?.role === 'Admin' ? 'Management Overview' : `${profile?.department} Handover`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-glass backdrop-blur-[10px] border border-glass-border rounded-[32px] p-10 space-y-8 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="px-5 py-2.5 bg-white/5 border border-glass-border rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-text-muted">Handing Over To</div>
              <div className="w-8 h-8 rounded-full border border-glass-border flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </div>
              <div className="relative">
                <select 
                  value={toShift}
                  onChange={(e) => setToShift(e.target.value as any)}
                  className="pl-5 pr-10 py-2.5 bg-glass border border-glass-border text-main rounded-xl font-black uppercase text-[10px] tracking-[0.2em] cursor-pointer shadow-lg appearance-none focus:outline-none focus:border-glass-border/40"
                >
                  <option value="AM">AM Shift</option>
                  <option value="PM">PM Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.25em]">Handover Notes</label>
                <button 
                  onClick={() => setNoIssues(!noIssues)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest",
                    noIssues ? "bg-low/20 text-low border-low/30" : "bg-glass border-glass-border text-text-muted hover:border-glass-border/40"
                  )}
                >
                  {noIssues ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                  No Issues Reported
                </button>
              </div>
              <div className="relative">
                <textarea 
                  rows={8}
                  disabled={noIssues || !hasPermission('submit_handover')}
                  className={cn(
                    "w-full bg-white/[0.02] border border-glass-border rounded-[24px] p-8 text-sm focus:outline-none transition-all resize-none shadow-inner text-main placeholder-text-muted/30",
                    !noIssues && hasPermission('submit_handover') ? "focus:border-glass-border/40" : "opacity-50 cursor-not-allowed"
                  )}
                  placeholder={noIssues ? "Quiet shift - nothing to report." : "Describe active cases, VIP arrivals, or specific items for the next shift leader..."}
                  value={noIssues ? "" : notes}
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-glass-border">
              <button 
                onClick={() => setConfirmed(!confirmed)}
                className={cn(
                    "flex-1 flex items-center gap-6 group cursor-pointer text-left p-4 rounded-2xl transition-all border-2",
                    confirmed ? "bg-low/10 border-low text-main shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-glass border-glass-border text-text-muted hover:border-glass-border/60"
                )}
              >
                <div className={cn(
                    "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 shadow-lg",
                    confirmed ? "bg-low border-low text-bg-dark" : "border-glass-border group-hover:border-glass-border/60"
                )}>
                  {confirmed && <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-black uppercase tracking-widest leading-none">Official Confirmation</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-relaxed">
                    I confirm that all relevant shift information<br/>has been accurately shared with the incoming team.
                  </p>
                </div>
              </button>
              
              <button 
                onClick={handleSubmit}
                disabled={!hasPermission('submit_handover') || !confirmed}
                className={cn(
                  "bg-white text-bg-dark px-12 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 overflow-hidden group relative w-full md:w-auto justify-center min-w-[280px]",
                  (!hasPermission('submit_handover') || !confirmed || (!noIssues && !notes.trim())) && "opacity-30 cursor-not-allowed grayscale"
                )}
              >
                <span className="relative z-10 flex items-center gap-3">
                  Complete Handover
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-glass border border-glass-border rounded-[28px] p-8 space-y-6">
            <h3 className="text-main font-black flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border-b border-glass-border pb-4">
              <AlertTriangle className="w-4 h-4 text-high" />
              Active Cases ({filteredLogs.length})
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => toggleCaseSelection(log.case_id)}
                  className={cn(
                    "p-5 border rounded-[20px] group transition-all cursor-pointer relative",
                    selectedCaseIds.includes(log.case_id) 
                      ? "bg-white/[0.05] border-glass-border/40" 
                      : "bg-transparent border-glass-border opacity-40 hover:opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">#{log.case_id}</span>
                    {selectedCaseIds.includes(log.case_id) && <CheckCircle2 className="w-3 h-3 text-low" />}
                  </div>
                  <p className="text-sm font-semibold text-main mb-1">{log.issue_type}</p>
                  <p className="text-[11px] text-text-muted font-bold tracking-wider">ROOM {log.room_number}</p>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-10 space-y-3 opacity-30">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-low" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Active Cases</p>
                </div>
              )}
            </div>
            {filteredLogs.length > 0 && (
              <p className="text-[9px] text-text-muted text-center pt-2 italic">Select cases to include in briefing</p>
            )}
          </div>

          <div className="bg-glass border border-glass-border rounded-[28px] p-8 space-y-6">
            <h3 className="text-main font-black flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
              <History className="w-4 h-4 text-text-muted" />
              Previous Briefings
            </h3>
            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="text-[10px] text-text-muted group cursor-pointer border-b border-glass-border pb-4 last:border-0 last:pb-0">
                  <div className="font-black flex justify-between uppercase tracking-widest text-text-muted mb-2">
                    <span>{h.from_shift} → {h.to_shift}</span>
                    <span>{h.date}</span>
                  </div>
                  <p className="line-clamp-2 italic opacity-60 group-hover:opacity-100 transition-opacity">"{h.notes}"</p>
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
