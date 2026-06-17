"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; type: ToastType; message: string }

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastType, { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bg: "bg-white", border: "border-green-300", text: "text-gray-800", iconColor: "text-green-600" },
  error:   { icon: AlertTriangle, bg: "bg-white", border: "border-red-300", text: "text-gray-800", iconColor: "text-red-500" },
  info:    { icon: Info, bg: "bg-white", border: "border-blue-300", text: "text-gray-800", iconColor: "text-blue-500" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 3800);
  }, [remove]);

  const value: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor de toasts: abajo-centro en móvil, abajo-derecha en escritorio */}
      <div className="fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const c = CONFIG[t.type];
          const Icon = c.icon;
          return (
            <div key={t.id}
              className={`pointer-events-auto flex items-start gap-3 ${c.bg} ${c.text} border-2 ${c.border} rounded-2xl shadow-lg p-4 animate-fade-in-up`}>
              <Icon size={22} className={`${c.iconColor} flex-shrink-0 mt-0.5`} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)}
                className="text-gray-400 hover:text-gray-600 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:bg-gray-100 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Fallback seguro si se usa fuera del provider (no rompe la app).
  if (!ctx) {
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}
