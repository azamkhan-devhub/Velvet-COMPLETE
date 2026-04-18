import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  adminApp = initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

export const adminApp_  = getAdminApp();
export const adminDb    = getFirestore(getAdminApp());
export const adminAuth  = getAuth(getAdminApp());
export const adminStorage = getStorage(getAdminApp());

// Seed the hardcoded admin role on first use
export async function ensureAdminRole() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ayazhussain.cs@gmail.com';
  try {
    const user = await adminAuth.getUserByEmail(adminEmail);
    const claims = (await adminAuth.getUser(user.uid)).customClaims;
    if (!claims?.role || claims.role !== 'admin') {
      await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });
      await adminDb.collection('users').doc(user.uid).set(
        { role: 'admin', email: adminEmail },
        { merge: true }
      );
      console.log(`Admin role assigned to ${adminEmail}`);
    }
  } catch {
    // User hasn't registered yet — role set on first login via trigger
  }
}
