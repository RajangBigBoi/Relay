import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Staff, PermissionFlags, PlatformRole, Department } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Staff | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (flag: keyof PermissionFlags) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  hasPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const DEFAULT_PERMISSIONS: Record<PlatformRole, PermissionFlags> = {
  Admin: {
    view_all_cases: true,
    view_department_cases: true,
    create_cases: true,
    edit_own_cases: true,
    edit_all_cases: true,
    resolve_cases: true,
    assign_cases: true,
    submit_handover: true,
    complete_checklist: true,
    manage_staff: true,
    manage_checklists: true,
    view_audit_logs: true,
    manage_settings: true,
  },
  'Duty Manager': {
    view_all_cases: true,
    view_department_cases: true,
    create_cases: true,
    edit_own_cases: true,
    edit_all_cases: true,
    resolve_cases: true,
    assign_cases: true,
    submit_handover: true,
    complete_checklist: true,
    manage_staff: false,
    manage_checklists: true,
    view_audit_logs: false,
    manage_settings: false,
  },
  'Department Lead': {
    view_all_cases: false,
    view_department_cases: true,
    create_cases: true,
    edit_own_cases: true,
    edit_all_cases: true,
    resolve_cases: true,
    assign_cases: true,
    submit_handover: false,
    complete_checklist: true,
    manage_staff: false,
    manage_checklists: true,
    view_audit_logs: false,
    manage_settings: false,
  },
  Staff: {
    view_all_cases: false,
    view_department_cases: true,
    create_cases: true,
    edit_own_cases: true,
    edit_all_cases: false,
    resolve_cases: false,
    assign_cases: false,
    submit_handover: false,
    complete_checklist: true,
    manage_staff: false,
    manage_checklists: false,
    view_audit_logs: false,
    manage_settings: false,
  },
  Viewer: {
    view_all_cases: true,
    view_department_cases: true,
    create_cases: false,
    edit_own_cases: false,
    edit_all_cases: false,
    resolve_cases: false,
    assign_cases: false,
    submit_handover: false,
    complete_checklist: false,
    manage_staff: false,
    manage_checklists: false,
    view_audit_logs: false,
    manage_settings: false,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Safety timeout for profile loading
        const profileTimeout = setTimeout(() => {
          setLoading(false);
        }, 10000);

        // Listen to profile changes
        unsubscribeProfile = onSnapshot(doc(db, 'staffMembers', firebaseUser.uid), async (docSnap) => {
          clearTimeout(profileTimeout);
          
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as Staff);
            setLoading(false);
          } else {
             // Universal bootstrap for ANY user missing a profile
             const role: PlatformRole = 'Staff';
             try {
               await setDoc(doc(db, 'staffMembers', firebaseUser.uid), {
                 name: firebaseUser.displayName || 'Relay User',
                 email: firebaseUser.email || '',
                 role: role,
                 department: 'Front Office',
                 permissions: DEFAULT_PERMISSIONS[role],
                 created_at: serverTimestamp()
               }, { merge: true });
             } catch (err) {
               console.error("Critical: Failed to bootstrap staff profile:", err);
               setLoading(false);
             }
          }
        }, (error) => {
          clearTimeout(profileTimeout);
          console.error("Profile Listener Error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const hasPermission = React.useCallback((flag: keyof PermissionFlags) => {
    return profile?.permissions?.[flag] || false;
  }, [profile]);

  const isAdmin = React.useMemo(() => profile?.role === 'Admin', [profile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
