"use client";

import { useState } from "react";
import { Check, Zap, Building2, Sprout, X, ArrowRight, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modals";

export interface Plan {
  id: "free" | "pro" | "organizacion";
  name: string;
  price: string;
  priceNote?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratis",
    price: "$0",
    priceNote: "para siempre",
    icon: Sprout,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    badgeColor: "bg-gray-100 text-gray-600",
    features: [
      "1 parcela",
      "5 cultivos activos",
      "5 recordatorios con notificaciones",
      "Clima en tiempo real y pronóstico 7 días",
      "Recomendaciones de siembra",
      "Cuaderno de campo y finanzas",
    ],
    cta: "Plan actual",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$2990",
    priceNote: "CLP / mes",
    icon: Zap,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
    badgeColor: "bg-green-100 text-green-700",
    features: [
      "10 parcelas",
      "50 cultivos activos",
      "100 recordatorios con notificaciones",
      "Todo lo del plan Gratis",
      "Recomendación de cultivos según tu suelo",
      "Alertas de heladas y golpe de calor",
      "Grados-día y horas-frío",
    ],
    cta: "Mejorar a Pro",
    popular: true,
  },
  {
    id: "organizacion",
    name: "Institucional",
    price: "$9.990",
    priceNote: "CLP / mes",
    icon: Building2,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    badgeColor: "bg-purple-100 text-purple-700",
    features: [
      "100 parcelas",
      "1.000 cultivos activos",
      "1.000 recordatorios",
      "Múltiples usuarios / trabajadores",
      "Panel de administración",
      "Todo lo del plan Pro",
    ],
    cta: "Mejorar a Institucional",
  },
];

interface PlanesViewProps {
  currentPlan?: "free" | "pro" | "organizacion";
  onClose?: () => void;
  modal?: boolean;
}

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, organizacion: 2 };

export default function PlanesView({ currentPlan = "free", onClose, modal = false }: PlanesViewProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Plan en proceso de confirmación (muestra el popup previo al pago).
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [mpEmail, setMpEmail] = useState("");
  const [showDowngrade, setShowDowngrade] = useState(false);

  // Etiqueta dinámica del botón según el plan actual del usuario.
  const getCtaLabel = (plan: Plan) => {
    if (plan.id === "organizacion") return "Próximamente";
    if (plan.id === currentPlan) return "Plan actual";
    if (plan.id === "free") return "Cambiar a Gratis";
    return PLAN_ORDER[plan.id] > PLAN_ORDER[currentPlan]
      ? `Mejorar a ${plan.name}`
      : `Cambiar a ${plan.name}`;
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setLoadingPlan(planId);
      setError(null);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, payerEmail: mpEmail.trim() || undefined })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al procesar pago');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setLoadingPlan(null);
      setConfirmPlan(null);
    }
  };

  const handleDowngrade = async () => {
    try {
      setLoadingPlan("free");
      setError(null);

      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al cambiar de plan');

      // Recargar para reflejar el nuevo plan actual.
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoadingPlan(null);
      setShowDowngrade(false);
    }
  };

  const handleAction = (plan: Plan) => {
    if (plan.id === currentPlan || plan.id === "organizacion") return;
    if (plan.id === "free") { setError(null); setShowDowngrade(true); return; }
    // Para mejorar a un plan de pago, mostramos primero el popup de confirmación.
    setMpEmail("");
    setError(null);
    setConfirmPlan(plan);
  };

  return (
    <div className={modal ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" : "w-full"}>
      <div className={modal ? "bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90dvh] overflow-y-auto animate-scale-in" : "space-y-6 w-full max-w-6xl mx-auto"}>

        {/* Header */}
        <div className={`${modal ? "p-6 border-b border-gray-100 sticky top-0 bg-white z-10" : ""} flex items-center justify-between`}>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Planes de Agrencia</h2>
            <p className="text-gray-500 text-sm lg:text-base mt-0.5">Elige el plan que mejor se adapta a tu campo</p>
          </div>
          {modal && onClose && (
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Cards */}
        <div className={`${modal ? "p-6" : ""} grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8`}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === currentPlan;
            const isComingSoon = plan.id === "organizacion";

            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all duration-200 card-hover animate-fade-in-up ${
                  plan.popular
                    ? "border-green-400 shadow-lg shadow-green-100"
                    : plan.borderColor
                } ${isCurrent ? "ring-2 ring-offset-2 ring-green-500" : ""}`}>

                {/* Popular badge */}
                {plan.popular && !isComingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className={`w-12 h-12 rounded-xl ${plan.bgColor} flex items-center justify-center mb-4`}>
                  <Icon size={24} className={plan.color} />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                      Actual
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.priceNote && (
                    <span className="text-gray-500 text-sm ml-1">{plan.priceNote}</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleAction(plan)}
                  disabled={isCurrent || loadingPlan !== null || isComingSoon}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                    isCurrent || isComingSoon
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : plan.popular
                      ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                      : `${plan.bgColor} ${plan.color} border-2 ${plan.borderColor} hover:opacity-80`
                  }`}
                >
                  {loadingPlan === plan.id ? <Loader2 size={16} className="animate-spin" /> : getCtaLabel(plan)}
                  {!isCurrent && !isComingSoon && loadingPlan !== plan.id && <ArrowRight size={15} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className={`${modal ? "px-6 pb-6" : ""}`}>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup de confirmación previo al pago */}
      {confirmPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in"
          onClick={() => loadingPlan === null && setConfirmPlan(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${confirmPlan.bgColor} flex items-center justify-center`}>
                    <confirmPlan.icon size={22} className={confirmPlan.color} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">¡Gracias por unirte!</h3>
                    <p className="text-sm text-gray-500">Plan {confirmPlan.name}</p>
                  </div>
                </div>
                {loadingPlan === null && (
                  <button onClick={() => setConfirmPlan(null)}
                    className="text-gray-400 hover:text-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-gray-100">
                    <X size={18} />
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Felicitaciones por dar el paso de potenciar tu campo con Agrencia. Con el plan{" "}
                <strong>{confirmPlan.name}</strong> vas a disfrutar de:
              </p>

              <ul className="space-y-2 mb-5">
                {confirmPlan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Aclaración del correo de Mercado Pago */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 mb-4">
                <p className="font-medium mb-1">Antes de continuar</p>
                <p>
                  El pago se realiza con <strong>Mercado Pago</strong>. Para que se procese correctamente,
                  conviene que el correo de tu cuenta de Mercado Pago sea el mismo con el que te registraste
                  en Agrencia. Si usas otro correo en Mercado Pago, indícalo aquí abajo.
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo de Mercado Pago <span className="text-gray-400">(opcional)</span>
                </label>
                <input type="email" value={mpEmail} onChange={(e) => setMpEmail(e.target.value)}
                  placeholder="Déjalo vacío si es el mismo de tu cuenta"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">{error}</div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setConfirmPlan(null)} disabled={loadingPlan !== null}
                  className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[48px] disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={() => handleUpgrade(confirmPlan.id)} disabled={loadingPlan !== null}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60">
                  {loadingPlan !== null ? <Loader2 size={18} className="animate-spin" /> : <>Continuar al pago <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación para volver al plan Gratis */}
      <ConfirmModal
        open={showDowngrade}
        title="Volver al plan Gratis"
        message="Se cancelará tu suscripción de pago y volverás a los límites del plan Gratis. ¿Quieres continuar?"
        confirmLabel="Sí, volver a Gratis"
        cancelLabel="Cancelar"
        danger
        loading={loadingPlan === "free"}
        onConfirm={handleDowngrade}
        onClose={() => setShowDowngrade(false)}
      />
    </div>
  );
}
