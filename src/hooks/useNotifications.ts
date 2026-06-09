"use client";

import { useEffect, useRef } from "react";

let swReg: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js");
    return swReg;
  } catch { return null; }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const reg = swReg ?? await registerServiceWorker();
  if (!reg) return null;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pub) return null;
  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pub).buffer as ArrayBuffer,
    });
    // Guardar en BD
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64(sub.getKey("p256dh")), auth: arrayBufferToBase64(sub.getKey("auth")) } }),
    });
    return sub;
  } catch { return null; }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function useNotifications() {
  const ready = useRef(false);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    if (Notification.permission === "granted") {
      registerServiceWorker().then(() => subscribeToPush());
    }
  }, []);

  function scheduleReminder(params: { id: string; taskType: string; parcelaName?: string; cultivoName?: string; scheduledAt: string }) {
    if (Notification.permission !== "granted") return;
    const labels: Record<string, string> = { riego: "💧 Hora de regar", poda: "✂️ Hora de podar", fertilizacion: "🧪 Hora de fertilizar" };
    const title = labels[params.taskType] ?? "Recordatorio agrícola";
    const bodyParts: string[] = [];
    if (params.cultivoName) bodyParts.push(`Cultivo: ${params.cultivoName}`);
    if (params.parcelaName) bodyParts.push(`Parcela: ${params.parcelaName}`);
    const body = bodyParts.length > 0 ? bodyParts.join(" · ") : "Tienes una tarea agrícola pendiente";
    const delay = new Date(params.scheduledAt).getTime() - Date.now();
    if (delay <= 0) return;

    swReg?.active?.postMessage({ type: "SCHEDULE_NOTIFICATION", id: params.id, title, body, scheduledAt: params.scheduledAt });

    if (!swReg && delay < 24 * 3600 * 1000) {
      setTimeout(() => { new Notification(title, { body, icon: "/assets/logo_principal.png", tag: params.id }); }, delay);
    }
  }

  return { scheduleReminder };
}
