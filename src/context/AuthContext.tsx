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

const DEFAULT_PERMISSIONS: Record<PlatformRole, PermissionFlags> = {
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile changes
        const unsubscribeProfile = onSnapshot(doc(db, 'staffMembers', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as Staff);
          } else {
            const role: PlatformRole = 'Admin';
            const dept: Department = 'Management';
            const newProfile: Staff = {
              id: firebaseUser.uid, // Match type
              name: firebaseUser.displayName || 'System Administrator',
              email: firebaseUser.email || '',
              role: role,
              department: dept,
              permissions: DEFAULT_PERMISSIONS[role],
              created_at: new Date() as any, // Placeholder for state, server version will come in next snapshot
            };
            try {
              const { id, ...docData } = newProfile;
              await setDoc(doc(db, 'staffMembers', firebaseUser.uid), {
                ...docData,
                created_at: serverTimestamp()
              });
              setProfile(newProfile); // Eagerly set to avoid null gap
            } catch (err) {
              console.error("Critical: Failed to bootstrap staff profile:", err);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile Listener Error:", error);
          console.log("Current Auth State:", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous
          });
          setLoading(false); // Escape hatch to avoid infinite loading
        });
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
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
