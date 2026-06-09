"use client";

import { useEffect, useState } from "react";
import {
  BellRing, Smartphone, ChevronRight, X, CheckCircle,
  MonitorSmartphone, Home, EyeOff
} from "lucide-react";
import { useBannerState } from "@/hooks/useBannerState";

// ─── Tutorial Android Modal ─────────────────────────────────────
const NOTIF_STEPS = [
  { step: 1, text: "Abre Chrome en tu Android y entra a la app." },
  { step: 2, text: "Toca los 3 puntos (⋮) arriba a la derecha." },
  { step: 3, text: 'Selecciona "Configuración del sitio".' },
  { step: 4, text: 'Toca "Notificaciones" y activa el permiso.' },
  { step: 5, text: 'Vuelve al dashboard y toca "Activar notificaciones".' },
  { step: 6, text: "Listo. Recibirás recordatorios aunque tengas el navegador minimizado." },
];

const INSTALL_STEPS = [
  { step: 1, text: 'En Chrome Android, toca los 3 puntos (⋮) arriba a la derecha.' },
  { step: 2, text: '"Añadir a pantalla de inicio" o "Instalar aplicación".' },
  { step: 3, text: 'Confirma tocando "Añadir".' },
  { step: 4, text: 'El ícono de AgroInteligencia aparecerá en tu pantalla de inicio.' },
  { step: 5, text: 'En iPhone: toca el botón Compartir (□↑) en Safari y elige "Añadir a pantalla de inicio".' },
];

function TutorialModal({
  title, steps, onClose,
}: {
  title: string;
  steps: { step: number; text: string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90dvh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Smartphone size={17} className="text-green-600" /> {title}
          </span>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {steps.map(({ step, text }) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {step}
              </div>
              <p className="text-sm text-gray-700 pt-0.5">{text}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 min-h-[44px]">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Banner ────────────────────────────────────────
export function NotificationBanner() {
  const { visible, dismiss, neverShow } = useBannerState("banner_notifications");
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  async function requestPermission() {
    const r = await Notification.requestPermission();
    setPermission(r);
  }

  if (!visible || permission === "granted" || permission === "unknown") return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <BellRing size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-800 text-sm">Activa las notificaciones</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Recibe avisos de riego, poda y fertilización directamente en tu celular, incluso con el navegador minimizado.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {permission === "default" && (
                <button onClick={requestPermission}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 min-h-[36px]">
                  Activar notificaciones
                </button>
              )}
              {permission === "denied" && (
                <span className="text-xs text-red-500 self-center">Permiso denegado. Actívalo en ajustes del navegador.</span>
              )}
              <button onClick={() => setShowTutorial(true)}
                className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 min-h-[36px] flex items-center gap-1">
                <Smartphone size={13} /> Ver tutorial <ChevronRight size={13} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={dismiss} title="Cerrar"
              className="text-blue-400 hover:text-blue-600 min-w-[32px] min-h-[32px] flex items-center justify-center">
              <X size={15} />
            </button>
            <button onClick={neverShow} title="No volver a mostrar"
              className="text-blue-300 hover:text-blue-500 min-w-[32px] min-h-[32px] flex items-center justify-center">
              <EyeOff size={13} />
            </button>
          </div>
        </div>
        <button onClick={neverShow}
          className="mt-2 text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1">
          <EyeOff size={11} /> No volver a mostrar
        </button>
      </div>
      {showTutorial && (
        <TutorialModal title="Activar notificaciones en Android" steps={NOTIF_STEPS} onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}

// ─── Install App Banner ─────────────────────────────────────────
export function InstallAppBanner() {
  const { visible, dismiss, neverShow } = useBannerState("banner_install");
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!deferredPrompt) { setShowTutorial(true); return; }
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") { setInstalled(true); neverShow(); }
    setDeferredPrompt(null);
  }

  if (!visible || installed) return null;

  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <MonitorSmartphone size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 text-sm">Agrega AgroInteligencia a tu pantalla de inicio</p>
            <p className="text-green-700 text-xs mt-0.5">
              Accede con un solo toque, como una app nativa. Sin tienda, sin instalación lenta. Siempre a mano en tu celular.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={installApp}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 min-h-[36px] flex items-center gap-1.5">
                <Home size={13} /> Agregar a pantalla de inicio
              </button>
              <button onClick={() => setShowTutorial(true)}
                className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 min-h-[36px] flex items-center gap-1">
                <Smartphone size={13} /> Cómo hacerlo <ChevronRight size={13} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={dismiss} title="Cerrar"
              className="text-green-400 hover:text-green-600 min-w-[32px] min-h-[32px] flex items-center justify-center">
              <X size={15} />
            </button>
          </div>
        </div>
        <button onClick={neverShow}
          className="mt-2 text-xs text-green-400 hover:text-green-600 flex items-center gap-1">
          <EyeOff size={11} /> No volver a mostrar
        </button>
      </div>
      {showTutorial && (
        <TutorialModal title="Agregar a pantalla de inicio" steps={INSTALL_STEPS} onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}

// ─── Inline status components (para Ajustes) ────────────────────
export function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  async function request() {
    const r = await Notification.requestPermission();
    setPermission(r);
  }

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  return (
    <>
      <div className={`rounded-2xl border p-4 ${isGranted ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGranted ? "bg-green-100" : "bg-gray-100"}`}>
              <BellRing size={18} className={isGranted ? "text-green-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Notificaciones</p>
              <p className={`text-xs mt-0.5 ${isGranted ? "text-green-600" : isDenied ? "text-red-500" : "text-gray-500"}`}>
                {isGranted ? "✓ Activadas" : isDenied ? "Denegadas por el navegador" : "No activadas aún"}
              </p>
            </div>
          </div>
          {!isGranted && !isDenied && (
            <button onClick={request}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 min-h-[40px]">
              Activar
            </button>
          )}
          {isGranted && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
        </div>
        {!isGranted && (
          <button onClick={() => setShowTutorial(true)}
            className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Smartphone size={12} /> Ver tutorial paso a paso
          </button>
        )}
      </div>
      {showTutorial && (
        <TutorialModal title="Activar notificaciones en Android" steps={NOTIF_STEPS} onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}

export function InstallAppStatus() {
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) { setInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) { setShowTutorial(true); return; }
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 ${installed ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${installed ? "bg-green-100" : "bg-gray-100"}`}>
              <MonitorSmartphone size={18} className={installed ? "text-green-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">App en pantalla de inicio</p>
              <p className={`text-xs mt-0.5 ${installed ? "text-green-600" : "text-gray-500"}`}>
                {installed ? "✓ Ya instalada" : "Acceso rápido desde tu celular"}
              </p>
            </div>
          </div>
          {!installed && (
            <button onClick={install}
              className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 min-h-[40px] flex items-center gap-1.5">
              <Home size={13} /> Instalar
            </button>
          )}
          {installed && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
        </div>
        {!installed && (
          <button onClick={() => setShowTutorial(true)}
            className="mt-3 text-xs text-green-600 hover:underline flex items-center gap-1">
            <Smartphone size={12} /> Cómo hacerlo manualmente
          </button>
        )}
      </div>
      {showTutorial && (
        <TutorialModal title="Agregar a pantalla de inicio" steps={INSTALL_STEPS} onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}

// Tipo global para el evento de instalación
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
