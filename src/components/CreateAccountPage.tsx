import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, updateProfile } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, User, AlertCircle, Loader2, X, Building2, Briefcase } from 'lucide-react';
import { PlatformRole, Department, PermissionFlags } from '../types';

const DEFAULT_PERMISSIONS: Record<PlatformRole, PermissionFlags> = {
  Admin: {
    view_all_cases: true, view_department_cases: true, create_cases: true, edit_own_cases: true, edit_all_cases: true,
    resolve_cases: true, assign_cases: true, submit_handover: true, complete_checklist: true, manage_staff: true,
    manage_checklists: true, view_audit_logs: true, manage_settings: true,
  },
  'Duty Manager': {
    view_all_cases: true, view_department_cases: true, create_cases: true, edit_own_cases: true, edit_all_cases: true,
    resolve_cases: true, assign_cases: true, submit_handover: true, complete_checklist: true, manage_staff: false,
    manage_checklists: true, view_audit_logs: false, manage_settings: false,
  },
  'Department Lead': {
    view_all_cases: false, view_department_cases: true, create_cases: true, edit_own_cases: true, edit_all_cases: true,
    resolve_cases: true, assign_cases: true, submit_handover: false, complete_checklist: true, manage_staff: false,
    manage_checklists: true, view_audit_logs: false, manage_settings: false,
  },
  Staff: {
    view_all_cases: false, view_department_cases: true, create_cases: true, edit_own_cases: true, edit_all_cases: false,
    resolve_cases: false, assign_cases: false, submit_handover: false, complete_checklist: true, manage_staff: false,
    manage_checklists: false, view_audit_logs: false, manage_settings: false,
  },
  Viewer: {
    view_all_cases: true, view_department_cases: true, create_cases: false, edit_own_cases: false, edit_all_cases: false,
    resolve_cases: false, assign_cases: false, submit_handover: false, complete_checklist: false, manage_staff: false,
    manage_checklists: false, view_audit_logs: false, manage_settings: false,
  },
};

export function CreateAccountPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<PlatformRole>('Staff');
  const [department, setDepartment] = useState<Department>('Front Office');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Manually create profile to bypass AuthProvider's default bootstrapping
      await setDoc(doc(db, 'staffMembers', userCredential.user.uid), {
        name,
        email,
        role,
        department,
        permissions: DEFAULT_PERMISSIONS[role],
        created_at: serverTimestamp()
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white border border-slate-200 p-8 lg:p-12 rounded-3xl shadow-xl shadow-slate-200/50 relative"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="text-slate-500 text-sm">Set up your Relay access.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                  placeholder="name@hotel.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                placeholder="Choose a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Department</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  value={department}
                  onChange={e => setDepartment(e.target.value as Department)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-10 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value as PlatformRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-10 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="Staff">Staff</option>
                  <option value="Department Lead">Department Lead</option>
                  <option value="Duty Manager">Duty Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed h-14 flex items-center justify-center mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-10">
          Already have an account? <Link to="/login" className="text-slate-900 font-bold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
