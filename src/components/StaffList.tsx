import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreHorizontal,
  Award,
  Edit2,
  Trash2,
  X,
  Building2,
  Lock
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Staff, PlatformRole, Department, PermissionFlags } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { recordAuditLog } from '../lib/auditService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { DEFAULT_PERMISSIONS } from '../lib/permissions';

const ROLES: PlatformRole[] = ['Admin', 'Duty Manager', 'Department Lead', 'Staff', 'Viewer'];
const DEPARTMENTS: Department[] = ['Front Office', 'Housekeeping', 'Maintenance', 'Security', 'Management'];

export function StaffList() {
  const { profile, hasPermission } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'Staff' as PlatformRole, 
    department: 'Front Office' as Department,
    email: '',
    uid: '' // Only for new staff pairing
  });

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'staffMembers'));
    const unsubscribe = onSnapshot(q, (s) => {
      setStaff(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    }, (error) => {
      console.error("Staff Members List Listener Error:", error);
    });
    return () => unsubscribe();
  }, [profile]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uid) {
      alert("A valid User UID is required for access provisioning.");
      return;
    }
    try {
      const permissions = DEFAULT_PERMISSIONS[formData.role];
      const payload = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        email: formData.email,
        permissions,
        created_at: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'staffMembers', formData.uid), payload);
      
      await recordAuditLog(formData.uid, 'staffMembers', 'create', [
        { field: 'all', old_value: null, new_value: payload }
      ]);
      
      setIsAddModalOpen(false);
      setFormData({ name: '', role: 'Staff', department: 'Front Office', email: '', uid: '' });
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const permissions = DEFAULT_PERMISSIONS[formData.role];
      const payload = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        email: formData.email,
        permissions,
      };

      const auditChanges = [
        { field: 'name', old_value: editingStaff.name, new_value: payload.name },
        { field: 'role', old_value: editingStaff.role, new_value: payload.role },
        { field: 'department', old_value: editingStaff.department, new_value: payload.department },
        { field: 'email', old_value: editingStaff.email, new_value: payload.email }
      ].filter(c => c.old_value !== c.new_value);

      await updateDoc(doc(db, 'staffMembers', editingStaff.id), payload);
      
      if (auditChanges.length > 0) {
        await recordAuditLog(editingStaff.id, 'staffMembers', 'update', auditChanges);
      }

      setEditingStaff(null);
      setFormData({ name: '', role: 'Staff', department: 'Front Office', email: '', uid: '' });
    } catch (err) {
      console.error("Error updating staff:", err);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      await deleteDoc(doc(db, 'staffMembers', deletingStaff.id));
      await recordAuditLog(deletingStaff.id, 'staffMembers', 'delete', [
        { field: 'all', old_value: deletingStaff, new_value: null }
      ]);
      setDeletingStaff(null);
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const openEditModal = (person: Staff) => {
    setEditingStaff(person);
    setFormData({ 
      name: person.name, 
      role: person.role, 
      department: person.department, 
      email: person.email,
      uid: person.id
    });
    setActiveMenu(null);
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto min-h-screen text-main">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main font-display">Staff List</h2>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Hotel Team Members</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="bg-glass border border-glass-border rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-glass-border/40 transition-all w-64 text-main"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasPermission('manage_staff') && (
            <button 
              onClick={() => { setIsAddModalOpen(true); setFormData({ name: '', role: 'Staff', department: 'Front Office', email: '', uid: '' }); }}
              className="bg-main text-bg-dark px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((person) => (
          <div key={person.id} className="bg-glass backdrop-blur-md border border-glass-border p-8 rounded-[32px] group hover:bg-white/[0.03] transition-all relative overflow-visible">
            {hasPermission('manage_staff') && (
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setActiveMenu(activeMenu === person.id ? null : person.id)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {activeMenu === person.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-36 bg-bg-dark/95 backdrop-blur-3xl border border-glass-border rounded-xl shadow-2xl z-20 py-1"
                      >
                        <button 
                          onClick={() => openEditModal(person)}
                          className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white flex items-center gap-3 hover:bg-white/5 transition-all text-left"
                        >
                          <Edit2 className="w-3 h-3 text-medium" />
                          Edit details
                        </button>
                        <button 
                          onClick={() => { setDeletingStaff(person); setActiveMenu(null); }}
                          className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-critical/70 hover:text-critical flex items-center gap-3 hover:bg-critical/5 transition-all text-left"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-glass-border flex items-center justify-center relative shadow-inner">
                <Users className="w-8 h-8 text-white/20 group-hover:text-white/50 transition-colors" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-low rounded-full border-4 border-bg-dark" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">{person.name}</h3>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest flex items-center gap-2">
                  <Shield className="w-3 h-3 text-blue-400" />
                  {person.role}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-white/50 group/link">
                <div className="p-2 bg-white/5 rounded-lg border border-glass-border group-hover/link:bg-white/10 transition-colors">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">{person.department}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 group/link">
                <div className="p-2 bg-white/5 rounded-lg border border-glass-border group-hover/link:bg-white/10 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold truncate max-w-[180px]">{person.email}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                     {Object.entries(person.permissions || {})
                       .filter(([_, val]) => val === true)
                       .slice(0, 3)
                       .map(([key, _]) => (
                        <div key={key} title={key.replace(/_/g, ' ')} className="w-6 h-6 rounded-full bg-white/10 border border-bg-dark flex items-center justify-center">
                           <Award className="w-3 h-3 text-white/40" />
                        </div>
                     ))}
                  </div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">
                    {person.role === 'Admin' ? 'FULL PERMISSIONS' : 'SECURED ACCESS'}
                  </span>
               </div>
               <button className="text-[9px] font-black uppercase text-white bg-white/5 px-4 py-2 rounded-lg border border-glass-border hover:bg-white/10 transition-colors">
                  ID: #{person.id.slice(0, 4)}
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editingStaff) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setEditingStaff(null); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-bg-dark/60 backdrop-blur-3xl border border-glass-border rounded-[32px] z-[101] shadow-2xl p-10 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-white">{editingStaff ? 'Edit Personnel' : 'Add Personnel'}</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.25em] font-black">{editingStaff ? 'Update record ID: ' + editingStaff.id : 'New Authorized Entry'}</p>
                </div>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setEditingStaff(null); }}
                  className="p-2 text-text-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30"
                      placeholder="Staff name..."
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Contact Email</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30"
                      placeholder="Email address..."
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Operational Role</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as PlatformRole})}
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white appearance-none"
                    >
                      {ROLES.map(r => <option key={r} value={r} className="bg-bg-dark">{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1">Department</label>
                    <select 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value as Department})}
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white appearance-none"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-dark">{d}</option>)}
                    </select>
                  </div>
                </div>

                {!editingStaff && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-1 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      FIREBASE USER UID (MANDATORY)
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-5 py-4 text-xs font-mono focus:outline-none focus:border-white/20 transition-all text-white placeholder-text-muted/30"
                      placeholder="Auth UID from Firebase console..."
                      value={formData.uid}
                      onChange={e => setFormData({...formData, uid: e.target.value})}
                    />
                    <p className="text-[9px] text-text-muted px-1 italic">Note: Staff must first log in once or you must provide their UID from Firebase Auth.</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setEditingStaff(null); }}
                    className="flex-1 py-4 text-[11px] font-black uppercase text-text-muted hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-white text-black py-4 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:bg-neutral-200 transition-all tracking-widest"
                  >
                    {editingStaff ? 'Update Profile' : 'Register Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingStaff && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingStaff(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-bg-dark/60 backdrop-blur-3xl border border-glass-border rounded-[32px] z-[101] shadow-2xl p-8 space-y-6 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-[20px] bg-critical/10 flex items-center justify-center border border-critical/20 mb-2">
                <Trash2 className="w-8 h-8 text-critical" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Revoke Access</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to remove <span className="text-white font-bold">{deletingStaff.name}</span>? This will permanently revoke their access credentials.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingStaff(null)}
                  className="flex-1 py-3 text-[10px] font-black uppercase text-text-muted hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStaff}
                  className="flex-1 bg-critical text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-xl hover:bg-red-600 transition-all tracking-widest"
                >
                  Confirm Revoke
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
