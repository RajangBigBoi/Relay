import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Staff, PermissionFlags, PlatformRole } from '../types';
import { DEFAULT_PERMISSIONS, can as canPermission } from '../lib/permissions';

interface AuthContextType {
  user: User | null;
  profile: Staff | null;
  profileError: string | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (flag: keyof PermissionFlags) => boolean;
  can: (flag: keyof PermissionFlags) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  profileError: null,
  loading: true,
  isAdmin: false,
  hasPermission: () => false,
  can: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Staff | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    let didReceiveAuthState = false;
    const authInitTimeout = setTimeout(() => {
      if (!didReceiveAuthState) {
        console.error('Firebase auth initialization timed out. Falling back to unauthenticated state.');
        setUser(null);
        setProfile(null);
        setProfileError('Auth initialization timed out');
        setLoading(false);
      }
    }, 10000);

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      didReceiveAuthState = true;
      clearTimeout(authInitTimeout);
      setUser(firebaseUser);
      setProfileError(null);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Listen to profile changes
        unsubscribeProfile = onSnapshot(doc(db, 'staffMembers', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as Staff);
            setProfileError(null);
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
               setProfile(null);
               setProfileError('Failed to create staff profile');
               setLoading(false);
             }
          }
        }, (error) => {
          console.error("Profile Listener Error:", error);
          setProfile(null);
          setProfileError(error?.message || 'Unable to read staff profile');
          setLoading(false);
        });
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(authInitTimeout);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const hasPermission = React.useCallback((flag: keyof PermissionFlags) => {
    return canPermission(profile?.permissions, flag);
  }, [profile]);

  const can = hasPermission;
  const isAdmin = React.useMemo(() => profile?.role === 'Admin', [profile]);

  return (
    <AuthContext.Provider value={{ user, profile, profileError, loading, isAdmin, hasPermission, can }}>
      {children}
    </AuthContext.Provider>
  );
};
