// listen to message event from window
self.addEventListener('message', event => {
  // HOW TO TEST THIS?
  // Run this in your browser console:
  //     window.navigator.serviceWorker.controller.postMessage({command: 'log', message: 'hello world'})
  // OR use next-pwa injected workbox object
  //     window.workbox.messageSW({command: 'log', message: 'hello world'})
  console.log(event?.data);
});

self.addEventListener('push',  (event) => {
  if (!event.data) {
    return
  }
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return
  }

  const data = event.data.json() ?? {
    title: "Something Has Happened",
    body: "Here's something you might want to check out.",
    image: "/logo.png",
    badge: "/logo.png",
    icon: "/android-192x192.png",
    url: "/",
  }
  const { body, icon, image, badge, url, title } = data;
  
  const notificationOptions = {
    body,
    icon,
    image,
    data: {
      url,
    },
    badge,
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  )
})

self.addEventListener('notificationclick',  (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then( (clientList) => {
      const url = event.notification.data.url;

      if (!url) return;

      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  )
})