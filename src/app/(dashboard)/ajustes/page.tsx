"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, Smartphone, CreditCard, Sprout, ArrowRight } from "lucide-react";
import { NotificationStatus, InstallAppStatus } from "@/components/ui/AppBanners";
import PlanesView from "@/components/planes/PlanesView";

type PlanId = "free" | "pro" | "organizacion";

const PLAN_LABELS: Record<PlanId, { name: string; limits: string }> = {
  free: { name: "Plan Gratis", limits: "1 parcela · 3 cultivos · 6 recordatorios" },
  pro: { name: "Plan Pro", limits: "10 parcelas · 100 cultivos · 100 recordatorios" },
  organizacion: { name: "Plan Institucional", limits: "100 parcelas · 1.000 cultivos · trabajadores" },
};

export default function AjustesPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showPlanes, setShowPlanes] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (d?.planId === "pro" || d?.planId === "organizacion") setCurrentPlan(d.planId);
        else setCurrentPlan("free");
      })
      .catch(() => {});
  }, []);

  async function handleDeleteAccount() {
    if (deleteInput !== "ELIMINAR") {
      setError('Escribe "ELIMINAR" para confirmar');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const d = await res.json();
        setError(d.error || "Error al eliminar la cuenta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-800">Ajustes</h1>

      {/* ── Plan actual ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <CreditCard size={14} /> Tu plan
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Sprout size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{PLAN_LABELS[currentPlan].name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{PLAN_LABELS[currentPlan].limits}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPlanes(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 min-h-[40px] flex items-center gap-1.5">
            {currentPlan === "free" ? "Actualizar" : "Cambiar"} <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── Dispositivo móvil ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Smartphone size={14} /> Dispositivo móvil
        </h2>
        <NotificationStatus />
        <InstallAppStatus />
      </section>

      {/* ── Cuenta ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle size={14} /> Zona de peligro
        </h2>

        <div className="bg-white rounded-2xl border border-red-200 p-5">
          <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Eliminar cuenta
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Eliminar tu cuenta borrará de forma permanente todos tus datos: parcelas, cultivos, registros
            de suelo, datos climáticos, alertas y recordatorios. Esta acción <strong>no se puede deshacer</strong>.
            Tu correo quedará libre para registrarse nuevamente.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 min-h-[44px] flex items-center gap-2">
              <Trash2 size={18} /> Eliminar mi cuenta
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Escribe <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">ELIMINAR</span> para confirmar:
              </p>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3 py-2.5 border border-red-300 rounded-xl outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setError(""); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px]">
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]">
                  {deleting ? "Eliminando..." : "Confirmar eliminación"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal de planes */}
      {showPlanes && (
        <PlanesView
          currentPlan={currentPlan}
          modal
          onClose={() => setShowPlanes(false)}
        />
      )}
    </div>
  );
}
