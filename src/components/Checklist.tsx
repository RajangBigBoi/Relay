import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Circle,
  Plus,
  Clock,
  User as UserIcon,
  Trash2,
  Lock
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, addDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn, formatTime } from '../lib/utils';
import { ShiftChecklist, Shift, Department } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export function Checklist() {
  const { profile, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<ShiftChecklist[]>([]);
  const [activeShift, setActiveShift] = useState<Shift>('AM');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', category: 'Operational', required: false, department: profile?.department || 'Front Office' as Department });

  useEffect(() => {
    if (!profile) return;

    // Filter by department if not Admin
    let q = query(collection(db, 'checklists'));
    
    // In a real app we might use server-side filtering, 
    // but for now we'll do basic query and then profile filter if needed.
    // Actually let's try to filter in query if not admin
    if (profile.role !== 'Admin') {
      q = query(collection(db, 'checklists'), where('department', '==', profile.department));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShiftChecklist)));
    }, (error) => {
      console.error("Checklist Tasks Listener Error:", error);
    });
    return () => unsubscribe();
  }, [profile]);

  const toggleTask = async (task: ShiftChecklist) => {
    if (!hasPermission('complete_checklist')) {
      alert("Insufficient permissions to complete checklist tasks.");
      return;
    }
    try {
      const taskRef = doc(db, 'checklists', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        completed_by: !task.completed ? profile?.name || auth.currentUser?.displayName : null,
        completed_at: !task.completed ? serverTimestamp() : null
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_checklists')) return;
    try {
      await addDoc(collection(db, 'checklists'), {
        task_name: newTask.name,
        category: newTask.category,
        required: newTask.required,
        shift: activeShift,
        completed: false,
        department: newTask.department,
        created_at: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewTask({ name: '', category: 'Operational', required: false, department: profile?.department || 'Front Office' as Department });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!hasPermission('manage_checklists')) return;
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, 'checklists', taskId));
    }
  };

  const shiftTasks = tasks.filter(t => t.shift === activeShift);

  return (
    <div className="p-10 space-y-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">Shift Checklist</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">
            {profile?.role === 'Admin' ? 'Global Verification Registry' : `${profile?.department} Operational Compliance`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-glass-border backdrop-blur-md">
            {(['AM', 'PM', 'Night'] as Shift[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveShift(s)}
                className={cn(
                  "px-8 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all",
                  activeShift === s ? "bg-white text-black shadow-2xl" : "text-text-muted hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {hasPermission('manage_checklists') && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-all shadow-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {shiftTasks.map((task) => (
          <div 
            key={task.id}
            onClick={() => toggleTask(task)}
            className={cn(
              "p-6 rounded-[24px] border backdrop-blur-md transition-all cursor-pointer flex items-center gap-8 group relative overflow-hidden",
              task.completed 
                ? "bg-low/5 border-low/20" 
                : "bg-glass border-glass-border hover:border-white/20 active:scale-[0.98]",
              !hasPermission('complete_checklist') && "cursor-not-allowed"
            )}
          >
            {!hasPermission('complete_checklist') && <Lock className="absolute top-2 right-2 w-3 h-3 text-white/20" />}
            
            {task.completed && (
              <div className="absolute top-0 right-0 w-32 h-full bg-low/10 blur-3xl rounded-full translate-x-16" />
            )}
            
            <div className={cn(
              "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shadow-inner relative",
              task.completed ? "bg-low border-low text-black" : "border-glass-border text-transparent group-hover:border-white/20"
            )}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className={cn("font-bold text-xl tracking-tight transition-all", task.completed ? "text-white/30 line-through" : "text-white")}>
                  {task.task_name}
                </h4>
                {profile?.role === 'Admin' && <span className="px-2 py-0.5 bg-white/5 border border-glass-border rounded-md text-[9px] font-black uppercase text-text-muted tracking-widest">{task.department}</span>}
              </div>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-[11px] uppercase font-black text-text-muted tracking-[0.1em]">{task.category}</span>
                {task.completed && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-low/30" />
                    <span className="text-[10px] uppercase font-black text-low/50 tracking-wider">
                      Verified {formatTime(task.completed_at)} by {task.completed_by?.split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {task.required && !task.completed && (
                <span className="text-[10px] font-black text-critical border border-critical/30 bg-critical/10 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl shadow-critical/5">
                  Mandatory
                </span>
              )}
              {hasPermission('manage_checklists') && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="p-2 text-text-muted hover:text-critical transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {shiftTasks.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-glass-border rounded-[32px] space-y-5 bg-white/[0.01]">
            <ClipboardCheck className="w-16 h-16 text-white/5 mx-auto" />
            <p className="text-text-muted font-bold text-xs uppercase tracking-[0.4em]">No Tasks Assigned</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-bg-dark/60 backdrop-blur-3xl border border-glass-border rounded-[32px] z-[201] shadow-2xl p-10"
            >
              <h3 className="text-2xl font-bold text-white mb-8">Add Checklist Task</h3>
              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Task Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20"
                    placeholder="Task details..."
                    value={newTask.name}
                    onChange={e => setNewTask({...newTask, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Category</label>
                    <select 
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-4 text-xs text-white appearance-none"
                      value={newTask.category}
                      onChange={e => setNewTask({...newTask, category: e.target.value})}
                    >
                      <option value="Operational">Operational</option>
                      <option value="Safety">Safety</option>
                      <option value="Audit">Audit</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Department</label>
                    <select 
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-4 text-xs text-white appearance-none"
                      value={newTask.department}
                      onChange={e => setNewTask({...newTask, department: e.target.value as Department})}
                    >
                      {['Front Office', 'Housekeeping', 'Maintenance', 'Security', 'Management'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="mandatory"
                    checked={newTask.required}
                    onChange={e => setNewTask({...newTask, required: e.target.checked})}
                    className="w-4 h-4 rounded bg-white/5 border-glass-border"
                  />
                  <label htmlFor="mandatory" className="text-xs text-white/70">Mandatory Task</label>
                </div>
                <button type="submit" className="w-full py-4 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest mt-4 shadow-2xl">
                  Create Task
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
