// Service Worker - AgroInteligencia
// Maneja notificaciones push y background sync

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Recibe mensajes desde la app para programar notificaciones
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, scheduledAt } = event.data;
    const delay = new Date(scheduledAt).getTime() - Date.now();

    if (delay <= 0) return;

    // Programar con setTimeout (funciona mientras el SW está activo)
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/assets/logo_principal.png",
        badge: "/assets/logo_principal.png",
        tag: id,
        requireInteraction: false,
        data: { url: "/recordatorios" },
      });
    }, Math.min(delay, 2147483647)); // max setTimeout ~24.8 días
  }

  if (event.data?.type === "CANCEL_NOTIFICATION") {
    // No podemos cancelar un setTimeout desde SW fácilmente,
    // pero podemos cerrar notificaciones mostradas
    self.registration.getNotifications({ tag: event.data.id })
      .then((notifications) => notifications.forEach((n) => n.close()));
  }
});

// Al tocar una notificación, abrir la app en /recordatorios
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/recordatorios";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      clients.openWindow(self.location.origin + url);
    })
  );
});
