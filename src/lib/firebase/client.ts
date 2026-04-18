import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBD9v-c2TSrUynVeW2PGIWhZumhdYx8yj4",
  authDomain: "velvet-complete.firebaseapp.com",
  projectId: "velvet-complete",
  storageBucket: "velvet-complete.firebasestorage.app",
  messagingSenderId: "976685753395",
  appId: "1:976685753395:web:dec8f3da0942271507af46",
  measurementId: "G-PYH4ZE5EF0"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, storage, googleProvider };
