import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app;

if (getApps().length === 0) {
  try {
    // Only initialize if we have the service account credentials configured
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle escaped newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin Initialized Successfully');
    } else {
      console.warn('Firebase Admin credentials not fully configured in env; push notifications are disabled.');
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
} else {
  app = getApps()[0];
}

export const messaging = app ? getMessaging(app) : null;
export default app;
