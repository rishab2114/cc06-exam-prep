// Minimal Web Push service worker: show the notification, focus/open the app
// on click. No caching/offline strategy — this is push delivery only.
self.addEventListener('push', (event) => {
  let data = { title: 'CampusBuddy', body: '', taskId: undefined, href: undefined };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // non-JSON payload — fall back to the default title
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CampusBuddy', {
      body: data.body || '',
      data: { taskId: data.taskId, href: data.href },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const taskId = event.notification.data?.taskId;
  const href = event.notification.data?.href;
  const url = href || (taskId ? `/app/task/${taskId}` : '/app/notifications');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
