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
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  ExternalLink,
  Download
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn, formatTime, formatDate } from '../lib/utils';
import { DutyLog, Priority, Status, Shift } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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

export function DutyLogList({ logs }: { logs: DutyLog[] }) {
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
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
          <h2 className="text-3xl font-bold tracking-tight text-white">Duty Log</h2>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">Operational Incident Records</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search registry..." 
              className="bg-white/5 border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20 transition-all w-72 backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white/5 border border-glass-border rounded-xl px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all cursor-pointer appearance-none min-w-[160px] text-white/70 backdrop-blur-md"
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
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Description</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Room</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Priority</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Owner</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-[0.25em] text-text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03] transition-all group cursor-pointer">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">#{log.case_id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-semibold text-white mb-0.5">{log.issue_type}</div>
                    <div className="text-xs text-text-muted line-clamp-1 max-w-xs">{log.description}</div>
                    {log.attachments && log.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {log.attachments.map((att, i) => (
                          <div key={i} className="group/att relative">
                            {att.type.startsWith('image/') ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-glass-border">
                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                <a href={att.url} download={att.name} className="absolute inset-0 bg-black/60 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-opacity">
                                  <Download className="w-3 h-3 text-white" />
                                </a>
                              </div>
                            ) : (
                              <a href={att.url} download={att.name} className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-glass-border rounded-lg hover:bg-white/10 transition-colors">
                                <FileIcon className="w-3 h-3 text-text-muted" />
                                <span className="text-[9px] font-bold text-white/50 truncate max-w-[80px]">{att.name}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-white/90">R-{log.room_number}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{log.guest_name}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                      log.priority === 'Critical' ? "bg-critical/20 text-critical" :
                      log.priority === 'High' ? "bg-high/20 text-high" :
                      log.priority === 'Medium' ? "bg-medium/20 text-medium" : "bg-low/20 text-low"
                    )}>
                      {log.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-glass-border flex items-center justify-center">
                        <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                      <span className="text-xs font-semibold text-white/70">{log.owner.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", log.status === 'Open' ? 'text-critical' : log.status === 'Resolved' ? 'text-low' : 'text-medium', STATUS_INDICATORS[log.status])} />
                      <span className="text-[11px] font-black uppercase tracking-wider text-white/80">{log.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-text-muted hover:text-white transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function LogEntryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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

    Array.from(files).forEach(file => {
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
      await addDoc(collection(db, 'duty_logs'), {
        ...formData,
        case_id,
        created_at: serverTimestamp(),
        status: 'Open',
        owner: auth.currentUser?.displayName || 'Unknown',
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
                <p className="text-[11px] text-text-muted uppercase tracking-[0.25em] font-black">Secure Entry Module</p>
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
