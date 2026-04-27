import React, { useState } from 'react';
import { DutyLog } from '../types';
import { 
  Search, 
  Filter, 
  History, 
  ChevronRight,
  User as UserIcon,
  Calendar
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { LogDetailModal } from './DutyLogList';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { recordAuditLog } from '../lib/auditService';

export function CaseHistory({ logs }: { logs: DutyLog[] }) {
  const { profile, hasPermission, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedLog, setSelectedLog] = useState<DutyLog | null>(null);

  // Filter for Resolved cases only
  const resolvedLogs = logs.filter(l => l.status === 'Resolved');

  const filteredLogs = resolvedLogs.filter(log => {
    const matchesSearch = 
      log.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.issue_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || log.issue_type === filterType;
    
    // Visibility Check
    const isOwner = log.owner_id === user?.uid;
    const sameDept = log.department === profile?.department;
    const canView = hasPermission('view_all_cases') || (hasPermission('view_department_cases') && sameDept) || isOwner;
    
    return matchesSearch && matchesType && canView;
  });

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

  const issueTypes = Array.from(new Set(resolvedLogs.map(l => l.issue_type)));

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main font-display">Case History</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Archived Incidents & Resolutions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="bg-glass border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-glass-border/40 transition-all w-64 text-main"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-glass border border-glass-border rounded-xl pl-11 pr-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-muted appearance-none cursor-pointer focus:outline-none focus:border-glass-border/40"
            >
              <option value="All">All Types</option>
              {issueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-glass border border-glass-border rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-glass-border">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Ref #</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Incident</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Location</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Resolved On</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Staff</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-8 py-6 whitespace-nowrap text-xs font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                    #{log.case_id}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-main">{log.issue_type}</span>
                      <span className="text-[11px] text-text-muted line-clamp-1">{log.description}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="text-xs font-bold text-main/80">Room {log.room_number}</span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-2 text-text-muted">
                        <Calendar className="w-3 h-3" />
                        {formatDate(log.created_at)}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-glass flex items-center justify-center border border-glass-border">
                        <UserIcon className="w-3 h-3 text-text-muted" />
                      </div>
                      <span className="text-xs font-bold text-text-muted">{log.owner}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-24 text-center">
              <History className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-xs font-black uppercase text-text-muted tracking-widest">No resolved cases found</p>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
          onUpdate={(updates) => handleUpdateLog(selectedLog.id, updates)}
        />
      )}
    </div>
  );
}
