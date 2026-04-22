import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Circle,
  Plus,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { ShiftChecklist, Shift } from '../types';

export function Checklist() {
  const [tasks, setTasks] = useState<ShiftChecklist[]>([]);
  const [activeShift, setActiveShift] = useState<Shift>('AM');

  useEffect(() => {
    const q = query(collection(db, 'checklists'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShiftChecklist)));
    });
    return () => unsubscribe();
  }, []);

  const toggleTask = async (task: ShiftChecklist) => {
    try {
      const taskRef = doc(db, 'checklists', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        completed_by: !task.completed ? auth.currentUser?.displayName : null,
        completed_at: !task.completed ? serverTimestamp() : null
      });
    } catch (e) {
      console.error(e);
    }
  };

  const shiftTasks = tasks.filter(t => t.shift === activeShift);

  return (
    <div className="p-10 space-y-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Shift Checklist</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Operational Compliance Registry</p>
        </div>
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
                : "bg-glass border-glass-border hover:border-white/20 active:scale-[0.98]"
            )}
          >
            {task.completed && (
              <div className="absolute top-0 right-0 w-32 h-full bg-low/10 blur-3xl rounded-full translate-x-16" />
            )}
            
            <div className={cn(
              "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shadow-inner",
              task.completed ? "bg-low border-low text-black" : "border-glass-border text-transparent group-hover:border-white/20"
            )}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h4 className={cn("font-bold text-xl tracking-tight transition-all", task.completed ? "text-white/30 line-through" : "text-white")}>
                {task.task_name}
              </h4>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-[11px] uppercase font-black text-text-muted tracking-[0.1em]">{task.category}</span>
                {task.completed && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-low/30" />
                    <span className="text-[10px] uppercase font-black text-low/50 tracking-wider">
                      Verified {task.completed_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {task.completed_by?.split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {task.required && !task.completed && (
              <span className="text-[10px] font-black text-critical border border-critical/30 bg-critical/10 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl shadow-critical/5">
                Mandatory
              </span>
            )}
          </div>
        ))}
        {shiftTasks.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-glass-border rounded-[32px] space-y-5 bg-white/[0.01]">
            <ClipboardCheck className="w-16 h-16 text-white/5 mx-auto" />
            <p className="text-text-muted font-bold text-xs uppercase tracking-[0.4em]">No Tasks Assigned</p>
          </div>
        )}
      </div>
    </div>
  );
}
