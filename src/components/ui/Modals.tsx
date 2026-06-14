"use client";

import { useRouter } from "next/navigation";
import { X, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

/**
 * Popup para invitar a mejorar de plan cuando se alcanza un límite.
 * Reemplaza los mensajes de error planos con un llamado a la acción en verde.
 */
export function UpgradeModal({
  open,
  resource,
  message,
  onClose,
}: {
  open: boolean;
  resource?: string;
  message?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Sparkles size={24} className="text-green-600" />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Alcanzaste el límite de tu plan</h3>
          <p className="text-sm text-gray-600 mb-5">
            {message ?? `Llegaste al máximo de ${resource ?? "recursos"} de tu plan actual. Mejora tu plan para seguir creciendo con Agrencia.`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[48px]">
              Ahora no
            </button>
            <button onClick={() => router.push("/planes")}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 min-h-[48px] flex items-center justify-center gap-2">
              Ver planes <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Popup de confirmación genérico (reemplaza window.confirm).
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => !loading && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-amber-50"}`}>
              <AlertTriangle size={22} className={danger ? "text-red-500" : "text-amber-500"} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">{message}</p>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[48px] disabled:opacity-50">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 py-3 rounded-xl font-semibold text-white min-h-[48px] disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
              {loading ? "Procesando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
