// Firebase Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Parse Firebase configuration from the query parameters passed during registration
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const messagingSenderId = params.get('messagingSenderId');
const projectId = params.get('projectId');
const authDomain = params.get('authDomain');
const appId = params.get('appId');

// Only initialize if we have at least apiKey and messagingSenderId
if (apiKey && messagingSenderId) {
  try {
    firebase.initializeApp({
      apiKey,
      authDomain,
      projectId,
      messagingSenderId,
      appId
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || "FUTMinna Clinic Update";
      const notificationOptions = {
        body: payload.notification?.body || "You have a new update regarding your appointment.",
        icon: 'https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png',
        data: payload.data || {}
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('Firebase Service Worker Initialization Error:', error);
  }
} else {
  console.warn('[firebase-messaging-sw.js] Missing config parameters; background messaging is disabled.');
}

// Handle notification click to navigate to the deep link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const pathOrUrl = event.notification.data?.url || '/dashboard';
  // Ensure we have a valid absolute URL for navigation & openWindow
  const targetUrl = new URL(pathOrUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open on this domain
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one with the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
