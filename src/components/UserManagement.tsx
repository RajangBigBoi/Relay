import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Staff, PlatformRole, Department, PermissionFlags } from '../types';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PERMISSIONS } from '../lib/permissions';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Building2, 
  Trash2, 
  Check, 
  X, 
  MoreVertical,
  Mail,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function UserManagement() {
  const { can } = useAuth();
  const [users, setUsers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    if (!can('manage_staff')) {
      setLoading(false);
      setUsers([]);
      return;
    }

    const q = query(collection(db, 'staffMembers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, [can]);

  if (!can('manage_staff')) {
    return (
      <div className="p-8 lg:p-12">
        <div className="rounded-2xl border border-glass-border bg-header-bg p-6 text-sm text-text-muted">
          You do not have permission to manage user profiles.
        </div>
      </div>
    );
  }

  const handleUpdateUser = async (user: Staff, updates: Partial<Staff>) => {
    try {
      if (updates.role) {
        updates.permissions = DEFAULT_PERMISSIONS[updates.role as PlatformRole];
      }
      await updateDoc(doc(db, 'staffMembers', user.id), {
        ...updates,
        updated_at: serverTimestamp()
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'staffMembers', userId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-black tracking-tighter">User Management</h1>
          <p className="text-text-muted">Control platform access, assign departments, and manage operational roles.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-main text-bg-dark px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-main/10"
        >
          <UserPlus className="w-4 h-4" />
          Create Staff Account
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.sort((a,b) => (a.role === 'Admin' ? -1 : 1)).map((staff) => (
          <UserRow 
            key={staff.id} 
            staff={staff} 
            onUpdate={handleUpdateUser} 
            onDelete={handleDeleteUser}
          />
        ))}
        {loading && (
           <div className="p-20 text-center animate-pulse text-text-muted font-bold uppercase tracking-widest text-xs">
             Loading Registry...
           </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface UserRowProps {
  staff: Staff;
  onUpdate: (user: Staff, updates: Partial<Staff>) => void;
  onDelete: (id: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ staff, onUpdate, onDelete }) => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ role: staff.role, department: staff.department });
  const isSelf = profile?.id === staff.id;

  const roles: PlatformRole[] = ['Admin', 'Duty Manager', 'Department Lead', 'Staff', 'Viewer'];
  const departments: Department[] = ['Front Office', 'Housekeeping', 'Maintenance', 'Security', 'Management', 'Food & Beverage'];

  return (
    <motion.div 
      layout
      className={cn(
        "bg-header-bg border border-glass-border p-6 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all",
        isEditing ? "ring-2 ring-main/50" : "hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-glass-border flex items-center justify-center font-black text-main">
          {staff.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white tracking-tight">{staff.name}</h3>
            {isSelf && <span className="bg-main/10 text-main text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">You</span>}
          </div>
          <p className="text-xs text-text-muted">{staff.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 md:gap-8">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Role</p>
          {isEditing ? (
            <select 
              value={editData.role}
              onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value as PlatformRole }))}
              className="bg-bg-dark border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-main"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-main" />
              <span className="text-xs font-bold text-white">{staff.role}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Department</p>
          {isEditing ? (
            <select 
              value={editData.department}
              onChange={(e) => setEditData(prev => ({ ...prev, department: e.target.value as Department }))}
              className="bg-bg-dark border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-main"
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-text-muted" />
              <span className="text-xs font-bold text-white">{staff.department || 'Unassigned'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <button 
              onClick={() => {
                onUpdate(staff, editData);
                setIsEditing(false);
              }}
              className="bg-main text-black p-2 rounded-xl hover:scale-110 transition-all"
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-white/5 text-text-muted p-2 rounded-xl hover:scale-110 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setIsEditing(true)}
              disabled={isSelf && staff.role === 'Admin'}
              className="bg-white/5 text-text-muted p-2 rounded-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-30"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(staff.id)}
              disabled={isSelf}
              className="bg-white/5 text-text-muted p-2 rounded-xl hover:bg-error/20 hover:text-error transition-all disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('Staff');
  const [department, setDepartment] = useState<Department>('Front Office');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note: This only creates the PROFILE in Firestore.
  // The user would still need to register via Email/Password with this email
  // or the admin creates them via server-side auth (not possible in client-only Firebase)
  // So we'll frame it as "Pre-registering staff access"
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In a real system we'd use Firebase Admin to create the user,
      // here we just seed the profile. When they sign up, they will match this record.
      const id = email.toLowerCase().replace(/[^a-z0-9]/g, '_'); // Mock ID
      await setDoc(doc(db, 'staffMembers', id), {
        name,
        email: email.toLowerCase(),
        role,
        department,
        permissions: DEFAULT_PERMISSIONS[role],
        created_at: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create user entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-header-bg border border-glass-border rounded-[40px] p-10 max-w-lg w-full shadow-2xl space-y-8"
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter">Create Staff</h2>
          <p className="text-sm text-text-muted">Seed a new staff profile for automatic role assignment.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-glass-border rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-main transition-all"
                placeholder="Staff Member Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-glass-border rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-main transition-all"
                placeholder="staff@hotel.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value as PlatformRole)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-main appearance-none bg-black"
                >
                  <option value="Staff">Staff</option>
                  <option value="Department Lead">Department Lead</option>
                  <option value="Duty Manager">Duty Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Department</label>
                <select 
                  value={department}
                  onChange={e => setDepartment(e.target.value as Department)}
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-main appearance-none bg-black"
                >
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security</option>
                  <option value="Management">Management</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white/5 text-text-muted py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={isSubmitting}
              type="submit"
              className="flex-1 bg-main text-bg-dark py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-main/10"
            >
              {isSubmitting ? "Creating..." : "Confirm Creation"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
