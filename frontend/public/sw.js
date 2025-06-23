// Service Worker for Video Downloader PWA
const CACHE_NAME = 'video-downloader-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for downloads
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-download') {
    event.waitUntil(doBackgroundDownload());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Download completed!',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Downloads',
        icon: '/manifest-icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/manifest-icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Video Downloader', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/history')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background download simulation
async function doBackgroundDownload() {
  try {
    // This would handle actual background downloads
    console.log('Performing background download sync');
    
    // Simulate download completion notification
    self.registration.showNotification('Download Complete', {
      body: 'Your video has been downloaded successfully!',
      icon: '/manifest-icon-192.png',
      tag: 'download-complete'
    });
  } catch (error) {
    console.error('Background download failed:', error);
  }
}

// Handle URL sharing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHARE_URL') {
    // Handle shared URLs for downloading
    const url = event.data.url;
    console.log('Received shared URL:', url);
    
    // Notify the main app about the shared URL
    event.ports[0].postMessage({
      type: 'URL_RECEIVED',
      url: url
    });
  }
});