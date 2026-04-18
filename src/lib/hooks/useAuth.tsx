'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AppUser, UserRole } from '@/types';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ayazhussain.cs@gmail.com';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function createOrFetchUserDoc(user: User): Promise<AppUser> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  // Hardcoded admin for testing
  const isHardcodedAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!snap.exists()) {
    const newUser: Omit<AppUser, 'uid'> = {
      email: user.email!,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || undefined,
      role: isHardcodedAdmin ? 'admin' : 'buyer',
      addresses: [],
      wishlist: [],
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      totalOrders: 0,
      totalSpent: 0,
    };
    await setDoc(ref, { ...newUser, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    return { uid: user.uid, ...newUser };
  }

  const data = snap.data() as Omit<AppUser, 'uid'>;
  // Ensure hardcoded admin always has admin role
  if (isHardcodedAdmin && data.role !== 'admin') {
    await setDoc(ref, { role: 'admin' }, { merge: true });
    data.role = 'admin';
  }
  await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
  return { uid: user.uid, ...data };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const au = await createOrFetchUserDoc(firebaseUser);
        setAppUser(au);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createOrFetchUserDoc({ ...cred.user, displayName: name });
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createOrFetchUserDoc(result.user);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAppUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const role: UserRole = appUser?.role || 'buyer';
  const isAdmin = role === 'admin' || role === 'seller';

  return (
    <AuthContext.Provider value={{ user, appUser, role, isAdmin, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
