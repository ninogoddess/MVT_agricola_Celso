"use client";

import { useEffect, useRef } from "react";

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registra el Service Worker y expone funciones para programar
 * notificaciones locales de recordatorios.
 */
export function useNotifications() {
  const ready = useRef(false);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;

    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => { swRegistration = reg; })
      .catch(console.error);
  }, []);

  /**
   * Programa una notificación local para un recordatorio.
   * Funciona aunque la app esté en segundo plano (via SW).
   */
  function scheduleReminder(params: {
    id: string;
    taskType: string;
    parcelaName?: string;
    scheduledAt: string; // ISO datetime
  }) {
    if (Notification.permission !== "granted") return;

    const labels: Record<string, string> = {
      riego: "💧 Hora de regar",
      poda: "✂️ Hora de podar",
      fertilizacion: "🧪 Hora de fertilizar",
    };

    const title = labels[params.taskType] ?? "Recordatorio agrícola";
    const body = params.parcelaName
      ? `Tarea pendiente en ${params.parcelaName}`
      : "Tienes una tarea agrícola pendiente";

    const delay = new Date(params.scheduledAt).getTime() - Date.now();
    if (delay <= 0) return;

    // Si el SW está registrado, le mandamos el mensaje
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        id: params.id,
        title,
        body,
        scheduledAt: params.scheduledAt,
      });
      return;
    }

    // Fallback: usar el Notification API directamente cuando la app está abierta
    if (delay < 24 * 60 * 60 * 1000) { // solo si es en menos de 24h
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/assets/logo_principal.png",
            tag: params.id,
          });
        }
      }, delay);
    }
  }

  function cancelReminder(id: string) {
    swRegistration?.active?.postMessage({ type: "CANCEL_NOTIFICATION", id });
  }

  return { scheduleReminder, cancelReminder };
}

/**
 * Registra el SW al cargar la app (llamar en el layout o dashboard).
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.error("SW registration failed:", e);
  }
}
