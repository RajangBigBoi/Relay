import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  ChevronDown,
  User as UserIcon,
  MessageSquare,
  Paperclip,
  ImageIcon,
  FileIcon,
  Trash2,
  ExternalLink,
  Download,
  X,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { recordAuditLog } from '../lib/auditService';
import { useAuth } from '../context/AuthContext';
import { cn, formatTime, formatDate } from '../lib/utils';
import { DutyLog, Priority, Status, Shift, Department } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_COLORS = {
  Critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  High: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  Medium: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
  Low: 'text-green-500 bg-green-500/10 border-green-500/20',
};

const STATUS_INDICATORS = {
  Open: 'bg-red-500',
  'In Progress': 'bg-yellow-500',
  Pending: 'bg-blue-500',
  Resolved: 'bg-green-500',
};

const Timer = ({ createdAt }: { createdAt: any }) => {
  const [timeLeft, setTimeLeft] = React.useState<number>(1800); // 30 mins
  const [isUrgent, setIsUrgent] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const start = createdAt?.toDate?.() || new Date(createdAt);
      const diff = Math.floor((new Date().getTime() - start.getTime()) / 1000);
      const remaining = Math.max(0, 1800 - diff);
      setTimeLeft(remaining);
      setIsUrgent(remaining <= 300); // 5 mins
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (timeLeft === 0) return <span className="text-critical font-black">OVERDUE</span>;

  return (
    <div className={cn(
      "flex flex-col items-end",
      isUrgent ? "text-critical animate-pulse" : "opacity-50"
    )}>
      <p className="text-[10px] font-black tracking-widest uppercase">Target Time</p>
      <p className="text-sm font-mono font-bold leading-none mt-1">
        {mins}:{secs.toString().padStart(2, '0')}
      </p>
    </div>
  );
};

export function DutyLogList({ logs }: { logs: DutyLog[] }) {
  const { profile, hasPermission, user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<DutyLog | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this operational record? This action cannot be undone.")) return;
    try {
      await updateDoc(doc(db, 'duty_logs', logId), { is_deleted: true }); // Prefer soft delete
      await recordAuditLog(logId, 'duty_logs', 'delete', [{ field: 'status', old_value: 'Active', new_value: 'Deleted' }]);
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  };

  const handleUpdateLog = async (logId: string, updates: Partial<DutyLog>) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    if (updates.status === 'Resolved' && !window.confirm("Marking this incident as resolved will finalize the record. Proceed?")) return;

    // RBAC check
    if (updates.status === 'Resolved' && !hasPermission('resolve_cases')) {
      alert("Insufficient permissions to resolve incidents.");
      return;
    }

    // RBAC: Check edit permission
    const isOwner = log.owner_id === user?.uid;
    const canEdit = hasPermission('edit_all_cases') || (hasPermission('edit_own_cases') && isOwner);
    
    // Exception: Resolve-only permission might allow status change even if general edit is restricted
    const isOnlyStatusUpdate = Object.keys(updates).length === 1 && updates.status;
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

  const filteredLogs = logs.filter(log => {
    // Visibility Check
    const isOwner = log.owner_id === user?.uid;
    const sameDept = log.department === profile?.department;
    const canView = hasPermission('view_all_cases') || (hasPermission('view_department_cases') && sameDept) || isOwner;
    
    if (!canView) return false;

    const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
    const matchesSearch = log.room_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.issue_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.case_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main font-display">Incident Log</h2>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">Operational Incident Records</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              className="bg-glass border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-glass-border/40 transition-all w-72 text-main"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-glass border border-glass-border rounded-xl px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-glass-border/40 transition-all cursor-pointer appearance-none min-w-[160px] text-text-muted"
          >
            <option value="All">All Items</option>
            <option value="Open">Status: Open</option>
            <option value="In Progress">Status: Active</option>
            <option value="Pending">Status: Pending</option>
            <option value="Resolved">Status: Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-glass backdrop-blur-[10px] border border-glass-border rounded-[24px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-border bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Case ID</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Incident Details</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Location</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Assigned To</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {filteredLogs.map((log) => {
                const isOwner = log.owner_id === user?.uid;
                const canModify = hasPermission('edit_all_cases') || (hasPermission('edit_own_cases') && isOwner) || hasPermission('resolve_cases');

                return (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/[0.03] transition-all group cursor-pointer relative"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-[12px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">#{log.case_id}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-semibold mb-0.5">{log.issue_type}</div>
                      <div className="text-xs text-text-muted line-clamp-1 max-w-xs">{log.description}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold opacity-80">Room {log.room_number}</div>
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{log.guest_name}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-glass border border-glass-border flex items-center justify-center">
                          <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">{log.owner.split(' ')[0]}</p>
                          <p className="text-[9px] text-text-muted uppercase font-black">{log.shift}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap border-l border-glass-border/50">
                      <div className="flex items-center justify-between gap-8">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full", log.status === 'Resolved' ? 'bg-low' : 'bg-high')} />
                             <span className="text-[11px] font-black uppercase tracking-wider">{log.status}</span>
                          </div>
                          {log.status !== 'Resolved' && <Timer createdAt={log.created_at} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right relative">
                      {canModify && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === log.id ? null : log.id); }}
                          className="p-2 -mr-2 text-text-muted hover:text-inherit transition-colors rounded-lg hover:bg-glass"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                      
                      <AnimatePresence>
                        {activeMenu === log.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-8 top-12 w-48 bg-bg-dark/95 backdrop-blur-3xl border border-glass-border rounded-xl shadow-2xl z-20 py-2"
                            >
                               <div className="px-4 py-2 border-b border-glass-border mb-2">
                                 <p className="text-[9px] font-black uppercase text-text-muted tracking-widest">Case Actions</p>
                               </div>
                               
                               <button 
                                 onClick={() => { setSelectedLog(log); setActiveMenu(null); }}
                                 className="w-full px-4 py-2 text-xs font-bold flex items-center gap-3 hover:bg-white/5 transition-colors"
                               >
                                 <ExternalLink className="w-4 h-4 text-text-muted" />
                                 View Details
                               </button>

                               {log.status !== 'Resolved' && hasPermission('resolve_cases') && (
                                 <button 
                                   onClick={() => { handleUpdateLog(log.id, { status: 'Resolved' }); setActiveMenu(null); }}
                                   className="w-full px-4 py-2 text-xs font-bold flex items-center gap-3 hover:bg-low/10 text-low transition-colors"
                                 >
                                   <CheckCircle2 className="w-4 h-4" />
                                   Resolve Incident
                                 </button>
                               )}

                               {hasPermission('manage_staff') && (
                                 <button 
                                   onClick={() => { handleDeleteLog(log.id); setActiveMenu(null); }}
                                   className="w-full px-4 py-2 text-xs font-bold flex items-center gap-3 hover:bg-critical/10 text-critical transition-colors"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                   Delete Record
                                 </button>
                               )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export function LogDetailModal({ log, onClose, onUpdate }: { log: DutyLog, onClose: () => void, onUpdate: (updates: Partial<DutyLog>) => void }) {
  const { hasPermission, user } = useAuth();
  const [description, setDescription] = useState(log.description);
  const [actionTaken, setActionTaken] = useState(log.action_taken || '');
  const [followUpAction, setFollowUpAction] = useState(log.follow_up_action || '');
  const [handoverTo, setHandoverTo] = useState(log.handover_to || '');
  const [status, setStatus] = useState(log.status);

  const isOwner = log.owner_id === user?.uid;
  const canEdit = hasPermission('edit_all_cases') || (hasPermission('edit_own_cases') && isOwner);
  const canResolve = hasPermission('resolve_cases');

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] overflow-y-auto bg-bg-dark/60 backdrop-blur-3xl border border-glass-border rounded-[32px] z-[101] shadow-2xl p-10 space-y-8 text-main"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-main">#{log.case_id} — {log.issue_type}</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.25em] font-black">Location: Room {log.room_number} | {log.department || 'Unassigned'}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                log.priority === 'Critical' ? "bg-critical/20 text-critical" : "bg-glass-border/50 text-text-muted"
             )}>
                {log.priority} Priority
             </div>
             <button onClick={onClose} className="p-2 text-text-muted hover:text-main"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-glass-border">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-text-muted tracking-widest">Guest Account</p>
            <p className="text-sm font-bold text-main">{log.guest_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-text-muted tracking-widest">Creation Date</p>
            <p className="text-sm font-bold text-main">{formatDate(log.created_at)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-text-muted tracking-widest">Case Owner</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-glass flex items-center justify-center border border-glass-border">
                <UserIcon className="w-3 h-3 text-text-muted" />
              </div>
              <p className="text-sm font-bold text-main">{log.owner}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Incident Description</label>
            <div className="p-5 rounded-2xl bg-glass border border-glass-border text-sm text-main/80 leading-loose shadow-inner">
              {log.description}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Actions Taken</label>
              <textarea 
                rows={3}
                readOnly={!canEdit && !canResolve}
                className={cn(
                  "w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-glass-border/40 transition-all placeholder-text-muted/30 resize-none text-main",
                  !(canEdit || canResolve) && "opacity-50"
                )}
                placeholder="What was done to address this..."
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
                onBlur={() => (canEdit || canResolve) && onUpdate({ action_taken: actionTaken })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Follow-up Required</label>
              <textarea 
                rows={3}
                readOnly={!canEdit && !canResolve}
                className={cn(
                  "w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-glass-border/40 transition-all placeholder-text-muted/30 resize-none text-main",
                  !(canEdit || canResolve) && "opacity-50"
                )}
                placeholder="What needs to happen next..."
                value={followUpAction}
                onChange={e => setFollowUpAction(e.target.value)}
                onBlur={() => (canEdit || canResolve) && onUpdate({ follow_up_action: followUpAction })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Handover Ownership</label>
              <input 
                type="text"
                readOnly={!canEdit}
                className={cn(
                  "w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-glass-border/40 transition-all placeholder-text-muted/30 text-main",
                  !canEdit && "opacity-50"
                )}
                placeholder="Assign to next person/shift..."
                value={handoverTo}
                onChange={e => setHandoverTo(e.target.value)}
                onBlur={() => canEdit && onUpdate({ handover_to: handoverTo })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Status</label>
              <div className="flex gap-2">
                {(['Open', 'In Progress', 'Pending', 'Resolved'] as Status[]).map((st) => {
                  const canSet = st === 'Resolved' ? canResolve : canEdit;
                  return (
                    <button
                      key={st}
                      disabled={!canSet}
                      onClick={() => { setStatus(st); onUpdate({ status: st }); }}
                      className={cn(
                        "flex-1 py-3 text-[9px] font-black uppercase rounded-lg border transition-all relative",
                        status === st 
                          ? "bg-main text-bg-dark border-main shadow-sm" 
                          : "border-glass-border text-text-muted hover:border-glass-border/40",
                        !canSet && "opacity-30 cursor-not-allowed border-transparent"
                      )}
                    >
                      {st === 'In Progress' ? 'Active' : st}
                      {!canSet && <Lock className="absolute top-1 right-1 w-2 h-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-transparent border border-glass-border rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-glass transition-colors text-text-muted"
          >
            Close Incident
          </button>
          {status !== 'Resolved' && canResolve && (
            <button 
              onClick={() => { onUpdate({ status: 'Resolved' }); onClose(); }}
              className="flex-1 py-4 bg-low text-bg-dark rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-low/20"
            >
              Mark as Resolved
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

const ISSUE_TYPE_DEPT: Record<string, Department> = {
  'Maintenance': 'Maintenance',
  'Housekeeping': 'Housekeeping',
  'Front Office': 'Front Office',
  'Guest Request': 'Front Office',
  'Security': 'Security',
  'F&B': 'Front Office' // Simplified
};

export function LogEntryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    room_number: '',
    guest_name: '',
    issue_type: '',
    priority: 'Low' as Priority,
    description: '',
    shift: 'AM' as Shift,
  });
  const [attachments, setAttachments] = useState<{name: string, url: string, type: string, size: number}[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [...prev, {
          name: file.name,
          url: event.target?.result as string,
          type: file.type,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const case_id = `RLY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const department = ISSUE_TYPE_DEPT[formData.issue_type] || profile?.department || 'Front Office';

      await addDoc(collection(db, 'duty_logs'), {
        ...formData,
        case_id,
        department,
        created_at: serverTimestamp(),
        status: 'Open',
        owner: profile?.name || user?.displayName || 'Unknown',
        owner_id: user?.uid,
        follow_up_required: false,
        action_taken: '',
        attachments: attachments
      });
      onClose();
      setFormData({
        room_number: '',
        guest_name: '',
        issue_type: '',
        priority: 'Low',
        description: '',
        shift: 'AM',
      });
      setAttachments([]);
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] overflow-y-auto bg-bg-dark/60 backdrop-blur-3xl border border-glass-border rounded-[32px] z-[101] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">Create Duty Log</h3>
                <p className="text-[11px] text-text-muted uppercase tracking-[0.25em] font-black">Departmental Entry Module</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Room Number</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30"
                      placeholder="Room number..."
                      value={formData.room_number}
                      onChange={e => setFormData({...formData, room_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Guest Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30"
                      placeholder="Guest name..."
                      value={formData.guest_name}
                      onChange={e => setFormData({...formData, guest_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Issue Category</label>
                  <select 
                    required
                    className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white/80 appearance-none cursor-pointer"
                    value={formData.issue_type}
                    onChange={e => setFormData({...formData, issue_type: e.target.value})}
                  >
                    <option value="" disabled className="text-bg-dark">Select category...</option>
                    <option value="Maintenance" className="text-bg-dark">Maintenance</option>
                    <option value="Housekeeping" className="text-bg-dark">Housekeeping</option>
                    <option value="Front Office" className="text-bg-dark">Front Office</option>
                    <option value="Guest Request" className="text-bg-dark">Guest Request</option>
                    <option value="Security" className="text-bg-dark">Security</option>
                    <option value="F&B" className="text-bg-dark">F&B</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Priority</label>
                    <div className="flex gap-2">
                      {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, priority: p})}
                          className={cn(
                            "flex-1 py-3 text-[9px] font-black uppercase rounded-lg border transition-all",
                            formData.priority === p 
                              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                              : "border-glass-border text-text-muted hover:border-white/10"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Shift</label>
                    <div className="flex gap-2">
                      {(['AM', 'PM', 'Night'] as Shift[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, shift: s})}
                          className={cn(
                            "flex-1 py-3 text-[9px] font-black uppercase rounded-lg border transition-all",
                            formData.shift === s 
                              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                              : "border-glass-border text-text-muted hover:border-white/10"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Incident Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30 resize-none shadow-inner"
                    placeholder="Provide full context for shift handover..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Evidence & Attachments</label>
                    <label className="text-[9px] font-black uppercase text-white/40 cursor-pointer hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md border border-glass-border">
                      <input type="file" multiple className="hidden" onChange={handleFileChange} />
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3 h-3" />
                        Attach Files
                      </div>
                    </label>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {attachments.map((file, i) => (
                        <div key={i} className="bg-white/5 border border-glass-border rounded-xl p-3 flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                              {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-text-muted" /> : <FileIcon className="w-4 h-4 text-text-muted" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">{file.name}</p>
                              <p className="text-[9px] text-text-muted uppercase font-black tracking-tighter">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="p-2 text-text-muted/40 hover:text-critical opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 text-[11px] font-black uppercase text-text-muted hover:text-white transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-white text-black py-4 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:bg-neutral-200 transition-all tracking-widest overflow-hidden relative group"
                  >
                    Commit to Ledger
                    <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

