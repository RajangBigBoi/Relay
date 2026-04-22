import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreHorizontal,
  Phone,
  Award
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { Staff } from '../types';
import { cn } from '../lib/utils';

export function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (s) => {
      if (s.empty) {
        // Initial Mock Data
        const initialStaff = [
          { name: 'Sarah Miller', role: 'Front Office Manager', email: 's.miller@relay.com' },
          { name: 'James Wilson', role: 'Duty Manager', email: 'j.wilson@relay.com' },
          { name: 'Elena Rodriguez', role: 'Guest Relations', email: 'e.rodriguez@relay.com' },
          { name: 'Michael Chen', role: 'Maintenance Lead', email: 'm.chen@relay.com' },
        ];
        initialStaff.forEach(st => addDoc(collection(db, 'staff'), st));
      }
      setStaff(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    return () => unsubscribe();
  }, []);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Personnel Registry</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Authorized Operational Staff</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              className="bg-white/5 border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20 transition-all w-64 backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((person) => (
          <div key={person.id} className="bg-glass backdrop-blur-md border border-glass-border p-8 rounded-[32px] group hover:bg-white/[0.03] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-text-muted hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-glass-border flex items-center justify-center relative shadow-inner">
                <Users className="w-8 h-8 text-white/20 group-hover:text-white/50 transition-colors" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-low rounded-full border-4 border-bg-dark" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">{person.name}</h3>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  {person.role}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-white/50 hover:text-white transition-colors cursor-pointer group/link">
                <div className="p-2 bg-white/5 rounded-lg border border-glass-border group-hover/link:bg-white/10 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">{person.email}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 hover:text-white transition-colors cursor-pointer group/link">
                <div className="p-2 bg-white/5 rounded-lg border border-glass-border group-hover/link:bg-white/10 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">+1 (555) 012-34{person.id.slice(0, 2)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                     {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-bg-dark flex items-center justify-center">
                           <Award className="w-3 h-3 text-white/40" />
                        </div>
                     ))}
                  </div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Top Responder</span>
               </div>
               <button className="text-[9px] font-black uppercase text-white bg-white/5 px-3 py-1.5 rounded-lg border border-glass-border hover:bg-white/10 transition-colors">
                  Profile
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
