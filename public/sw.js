const CACHE_NAME = 'scheme-saathi-v1';
const STATIC_CACHE = 'scheme-saathi-static-v1';
const DYNAMIC_CACHE = 'scheme-saathi-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/government_schemes/,
  /^\/api\/schemes/,
  /^\/api\/user\/stats/,
  /^\/api\/search/
];

// Cache strategies
const CACHE_STRATEGIES = {
  api: 'network-first',
  static: 'cache-first',
  dynamic: 'stale-while-revalidate'
};

// Service Worker Events
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error caching static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const { url } = request;

  try {
    // Handle API requests
    if (isAPIRequest(url)) {
      return await handleAPIRequest(request);
    }

    // Handle static assets
    if (isStaticAsset(url)) {
      return await handleStaticAsset(request);
    }

    // Handle navigation requests
    if (request.mode === 'navigate') {
      return await handleNavigation(request);
    }

    // Handle other dynamic content
    return await handleDynamicContent(request);

  } catch (error) {
    console.error('Fetch handler error:', error);
    return await handleOffline(request);
  }
}

async function handleAPIRequest(request) {
  const { url } = request;
  
  try {
    // Network first strategy for API requests
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('API request failed, trying cache:', url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline API response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Network unavailable',
        offline: true,
        data: getOfflineAPIData(url)
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

async function handleStaticAsset(request) {
  // Cache first strategy for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 404 });
  }
}

async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache the page
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('Navigation request failed, trying cache:', request.url);
    
    // Try cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline page
    return new Response(
      createOfflinePage(),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

async function handleDynamicContent(request) {
  // Stale while revalidate strategy
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  return cachedResponse || await fetchPromise || await handleOffline(request);
}

async function handleOffline(request) {
  // Return appropriate offline response based on request type
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Network unavailable',
        offline: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // For HTML requests, return offline page
  const offlineResponse = await caches.match('/offline');
  if (offlineResponse) {
    return offlineResponse;
  }

  return new Response(
    createOfflinePage(),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'scheme-search-sync') {
    event.waitUntil(syncSearchCache());
  } else if (event.tag === 'user-analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New government scheme available!',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Schemes',
        icon: '/icons/explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Scheme Saathi', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/schemes')
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_SCHEMES') {
    event.waitUntil(cacheSchemes(event.data.schemes));
  }
});

// Utility functions
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
         url.includes('/api/');
}

function isStaticAsset(url) {
  return url.includes('/_next/static/') ||
         url.includes('/favicon.ico') ||
         url.includes('/logo-') ||
         url.includes('/manifest.json') ||
         url.match(/\.(css|js|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/);
}

function getOfflineAPIData(url) {
  // Return cached offline data based on URL
  if (url.includes('/api/schemes')) {
    return {
      schemes: [],
      total: 0,
      message: 'Schemes will be available when connection is restored'
    };
  } else if (url.includes('/api/user/stats')) {
    return {
      schemesViewed: 0,
      applicationsSubmitted: 0,
      favoriteCategories: [],
      message: 'Stats will sync when connection is restored'
    };
  }
  
  return { message: 'Data will be available when connection is restored' };
}

async function syncSearchCache() {
  try {
    console.log('Syncing search cache...');
    
    // Fetch popular schemes to cache
    const response = await fetch('/api/schemes?popular=true&limit=50');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/schemes?popular=true&limit=50', response);
      console.log('Search cache synced successfully');
    }
  } catch (error) {
    console.error('Error syncing search cache:', error);
  }
}

async function syncAnalytics() {
  try {
    console.log('Syncing analytics...');
    
    // Get pending analytics from IndexedDB and sync
    const pendingEvents = await getPendingAnalytics();
    if (pendingEvents.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      });
      
      if (response.ok) {
        await clearPendingAnalytics();
        console.log('Analytics synced successfully');
      }
    }
  } catch (error) {
    console.error('Error syncing analytics:', error);
  }
}

async function cacheSchemes(schemes) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Cache individual scheme details
    for (const scheme of schemes) {
      const schemeUrl = `/api/schemes/${scheme.id}`;
      const schemeResponse = new Response(JSON.stringify(scheme), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(schemeUrl, schemeResponse);
    }
    
    console.log(`Cached ${schemes.length} schemes`);
  } catch (error) {
    console.error('Error caching schemes:', error);
  }
}

function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Scheme Saathi</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .container {
                max-width: 400px;
                padding: 40px 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            .icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            h1 {
                margin: 0 0 20px 0;
                font-size: 2rem;
            }
            p {
                margin: 0 0 30px 0;
                opacity: 0.9;
                line-height: 1.6;
            }
            .retry-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                transition: background 0.3s;
            }
            .retry-btn:hover {
                background: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>Don't worry! Scheme Saathi works offline too. Some features may be limited until you reconnect.</p>
            <button class="retry-btn" onclick="window.location.reload()">
                Try Again
            </button>
        </div>
        <script>
            // Auto-retry when connection is restored
            window.addEventListener('online', () => {
                window.location.reload();
            });
        </script>
    </body>
    </html>
  `;
}

// IndexedDB helpers for offline analytics
async function getPendingAnalytics() {
  return new Promise((resolve) => {
    const request = indexedDB.open('scheme-saathi-analytics', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pending'], 'readonly');
      const store = transaction.objectStore('pending');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => resolve([]);
  });
}

async function clearPendingAnalytics() {
  return new Promise((resolve) => {
    const request = indexedDB.open('scheme-saathi-analytics', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pending'], 'readwrite');
      const store = transaction.objectStore('pending');
      store.clear();
      resolve();
    };
    
    request.onerror = () => resolve();
  });
}

console.log('Service Worker loaded successfully');
