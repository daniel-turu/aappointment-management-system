import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/"/g, ""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/"/g, ""),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/"/g, ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/"/g, ""),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/"/g, ""),
};

// Initialize Firebase only on the client side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
  try {
    messagingInstance = getMessaging(app);
  } catch (error) {
    console.warn("Firebase messaging is not supported in this browser:", error.message || error);
  }
}

export const messaging = messagingInstance;

export const requestForToken = async () => {
  if (typeof window !== "undefined" && messaging) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            return currentToken;
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
      } else {
          console.log('Notification permission denied.');
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && messaging) {
        onMessage(messaging, (payload) => {
            console.log("payload", payload)
            resolve(payload);
        });
    }
  });

export default app;
