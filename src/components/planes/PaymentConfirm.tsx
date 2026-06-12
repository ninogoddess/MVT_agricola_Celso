"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";

/**
 * Se monta en el dashboard (destino del back_url de Mercado Pago).
 * Al volver del pago, verifica con MP el estado de la suscripción y activa el
 * plan, sin depender del webhook. Muestra un aviso del resultado.
 */
export default function PaymentConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "checking" | "success" | "pending">("idle");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;

    const preapprovalId =
      searchParams.get("preapproval_id") || searchParams.get("preapprovalId");
    const cameFromPayment =
      preapprovalId !== null ||
      searchParams.get("payment") === "processing" ||
      searchParams.get("status") === "authorized";

    if (!cameFromPayment) return;

    ran.current = true;
    setState("checking");

    (async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preapprovalId ? { preapprovalId } : {}),
        });
        const data = await res.json();

        if (data.updated) {
          setState("success");
          router.refresh();
        } else {
          setState("pending");
        }
      } catch {
        setState("pending");
      } finally {
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    })();
  }, [searchParams, router]);

  if (state === "idle") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in-up">
      {state === "checking" && (
        <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-green-600" />
          <p className="text-sm text-gray-700">Verificando tu pago...</p>
        </div>
      )}

      {state === "success" && (
        <div className="bg-green-50 border border-green-200 shadow-lg rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">¡Plan activado!</p>
            <p className="text-xs text-green-700">Tu suscripción ya está activa.</p>
          </div>
          <button onClick={() => setState("idle")} className="text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      )}

      {state === "pending" && (
        <div className="bg-amber-50 border border-amber-200 shadow-lg rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Pago en proceso</p>
            <p className="text-xs text-amber-700">
              Estamos confirmando tu pago. Puede tardar unos minutos en activarse.
            </p>
          </div>
          <button onClick={() => setState("idle")} className="text-amber-500 hover:text-amber-700">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
