// Service Worker - agrencia
// Maneja notificaciones push VAPID reales

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// Push real desde servidor (VAPID)
self.addEventListener("push", (event) => {
  let data = { title: "agrencia", body: "Tienes una tarea pendiente", url: "/recordatorios", icon: "/assets/logo_principal.png" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      tag: "agro-reminder",
      requireInteraction: false,
      data: { url: data.url },
    })
  );
});

// Fallback: notificaciones programadas desde la app (setTimeout)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, scheduledAt } = event.data;
    const delay = new Date(scheduledAt).getTime() - Date.now();
    if (delay <= 0) return;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/assets/logo_principal.png",
        badge: "/assets/logo_principal.png",
        tag: id,
        data: { url: "/recordatorios" },
      });
    }, Math.min(delay, 2147483647));
  }
});

// Click en notificación → abrir app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/recordatorios";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.focus(); c.navigate(url); return;
        }
      }
      clients.openWindow(self.location.origin + url);
    })
  );
});
