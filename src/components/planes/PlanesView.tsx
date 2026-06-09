"use client";

import { useState } from "react";
import { Check, Zap, Building2, Sprout, X, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id: "gratis",
    name: "Gratis",
    price: "$0",
    priceNote: "para siempre",
    Icon: Sprout,
    accent: "gray",
    features: [
      "1 parcela",
      "3 cultivos activos",
      "6 recordatorios",
      "Datos climáticos diarios",
      "Recomendaciones de siembra",
    ],
    cta: "Plan actual",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$1.990",
    priceNote: "CLP / mes",
    Icon: Zap,
    accent: "green",
    features: [
      "10 parcelas",
      "100 cultivos activos",
      "100 recordatorios",
      "Alertas climáticas avanzadas",
      "Recomendaciones de cosecha",
      "Exportación de datos",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    popular: true,
  },
  {
    id: "organizacion",
    name: "Organización",
    price: "$9.990",
    priceNote: "CLP / mes",
    Icon: Building2,
    accent: "purple",
    features: [
      "100 parcelas",
      "1.000 cultivos activos",
      "1.000 recordatorios",
      "Múltiples usuarios",
      "Panel de administración",
      "Alertas climáticas avanzadas",
      "Exportación y reportes",
      "Soporte dedicado",
    ],
    cta: "Elegir Organización",
    popular: false,
  },
] as const;

type PlanId = "gratis" | "pro" | "organizacion";

const ACCENT: Record<string, { border: string; bg: string; text: string; btn: string; badge: string; ring: string }> = {
  gray:   { border: "border-gray-200",   bg: "bg-gray-50",    text: "text-gray-600",   btn: "bg-gray-100 text-gray-600 hover:bg-gray-200",        badge: "bg-gray-100 text-gray-500",   ring: "" },
  green:  { border: "border-green-400",  bg: "bg-green-50",   text: "text-green-700",  btn: "bg-green-600 text-white hover:bg-green-700 shadow-md", badge: "bg-green-100 text-green-700", ring: "shadow-xl shadow-green-100" },
  purple: { border: "border-purple-300", bg: "bg-purple-50",  text: "text-purple-700", btn: "bg-purple-600 text-white hover:bg-purple-700",        badge: "bg-purple-100 text-purple-700", ring: "" },
};

interface Props {
  currentPlan?: PlanId;
  modal?: boolean;
  onClose?: () => void;
}

export default function PlanesView({ currentPlan = "gratis", modal = false, onClose }: Props) {
  const [selected, setSelected] = useState<PlanId | null>(null);

  const inner = (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className={`flex-shrink-0 px-6 pt-6 pb-4 ${modal ? "border-b border-gray-100" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Planes de Agrencia</h2>
            <p className="text-gray-500 text-sm mt-1">Elige el plan que mejor se adapta a tu campo</p>
          </div>
          {modal && onClose && (
            <button onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
          {PLANS.map((plan) => {
            const a = ACCENT[plan.accent];
            const isCurrent = plan.id === currentPlan;
            const { Icon } = plan;

            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 ${a.border} ${a.ring} flex flex-col p-5 transition-all`}>

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                      Más popular
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center mb-3 mt-1 flex-shrink-0`}>
                  <Icon size={22} className={a.text} />
                </div>

                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.badge}`}>Actual</span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{plan.priceNote}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
                      <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => { if (!isCurrent) setSelected(plan.id as PlanId); }}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                    isCurrent ? "bg-gray-100 text-gray-400 cursor-default" : a.btn
                  }`}>
                  {isCurrent ? "Plan actual" : plan.cta}
                  {!isCurrent && <ArrowRight size={14} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Coming soon */}
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center">
          💳 Los pagos están próximamente disponibles. Para actualizar tu plan escríbenos a{" "}
          <a href="mailto:hola@agrencia.cl" className="font-semibold underline">hola@agrencia.cl</a>
        </div>

        {/* Selected feedback */}
        {selected && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center justify-between">
            <span>Seleccionaste <strong>{PLANS.find(p => p.id === selected)?.name}</strong>. Pronto podrás pagar en línea.</span>
            <button onClick={() => setSelected(null)} className="text-green-400 hover:text-green-600 ml-2 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!modal) {
    return <div className="animate-fade-in-up">{inner}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl animate-scale-in flex flex-col"
        style={{ width: "min(95vw, 860px)", maxHeight: "min(90dvh, 700px)" }}
        onClick={(e) => e.stopPropagation()}>
        {inner}
      </div>
    </div>
  );
}
