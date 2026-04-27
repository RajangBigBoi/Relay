import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter,
  User as UserIcon,
  Database,
  ArrowRight,
  Clock,
  ChevronDown
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { AuditLog } from '../types';
import { cn, formatDate, formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function AuditLogViewer() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('All');

  useEffect(() => {
    if (!hasPermission('view_audit_logs')) return;

    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    }, (error) => {
      console.error("Audit Logs Listener Error:", error);
    });

    return () => unsubscribe();
  }, [hasPermission]);

  if (!hasPermission('view_audit_logs')) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-critical/10 rounded-full flex items-center justify-center mx-auto border border-critical/20">
            <Database className="w-10 h-10 text-critical" />
          </div>
          <h2 className="text-2xl font-bold text-main tracking-tight">Access Restricted</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            System logs are restricted to Administrative personnel. 
            Contact your manager if you require access to this history.
          </p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
      const matchesSearch = log.target_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.changed_by.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = filterAction === 'All' || log.action === filterAction;
      return matchesSearch && matchesAction;
  });

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main font-display">System Logs</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Operational History</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by ID or User..." 
              className="bg-glass border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-glass-border/40 transition-all w-64 text-main"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-glass border border-glass-border rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-muted appearance-none cursor-pointer focus:outline-none focus:border-glass-border/40"
          >
            <option value="All">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
        </div>
      </div>

      <div className="bg-glass border border-glass-border rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-glass-border">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Timestamp</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">User</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Action</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Category</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-text-muted">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-[11px] font-bold text-main/50">{formatDate(log.timestamp)}</div>
                    <div className="text-[9px] text-text-muted font-black mt-0.5">{formatTime(log.timestamp)}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-glass border border-glass-border flex items-center justify-center">
                        <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                      <span className="text-xs font-bold text-main/80">{log.changed_by}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={cn(
                      "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider",
                      log.action === 'create' ? "bg-low/20 text-low border border-low/10" :
                      log.action === 'update' ? "bg-high/20 text-high border border-high/10" :
                      "bg-critical/20 text-critical border border-critical/10"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-main/40 tracking-wider mb-1">{log.collection}</span>
                      <code className="text-[10px] font-mono text-text-muted bg-glass px-2 py-0.5 rounded border border-glass-border w-fit">{log.target_id}</code>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2 max-w-sm text-main">
                      {log.changes.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-[10px]">
                          <span className="font-black uppercase text-text-muted tracking-tighter min-w-[60px]">{change.field}</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-text-muted/40 truncate line-through italic">{String(change.old_value)}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-text-muted/20 shrink-0" />
                            <span className="text-main/80 font-semibold truncate bg-glass px-2 py-0.5 rounded">{String(change.new_value)}</span>
                          </div>
                        </div>
                      ))}
                      {log.action === 'create' && (
                        <span className="text-[10px] text-low/60 italic">New record created</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-32 text-center">
              <History className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-xs font-black uppercase text-text-muted tracking-widest">No matching activities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
