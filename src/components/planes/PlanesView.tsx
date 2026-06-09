"use client";

import { useState } from "react";
import { Check, Zap, Building2, Sprout, X, ArrowRight } from "lucide-react";

export interface Plan {
  id: "gratis" | "pro" | "organizacion";
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
    id: "gratis",
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
      "3 cultivos activos",
      "6 recordatorios",
      "Datos climáticos diarios",
      "Recomendaciones de siembra",
    ],
    cta: "Plan actual",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$1990",
    priceNote: "CLP / mes",
    icon: Zap,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
    badgeColor: "bg-green-100 text-green-700",
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
      "Alertas climáticas avanzadas",
      "Exportación y reportes",
      "Soporte dedicado",
    ],
    cta: "Próximamente",
  },
];

interface PlanesViewProps {
  currentPlan?: "gratis" | "pro" | "organizacion";
  onClose?: () => void;
  modal?: boolean;
}

export default function PlanesView({ currentPlan = "gratis", onClose, modal = false }: PlanesViewProps) {
  const [selected, setSelected] = useState<string | null>(null);

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
            const isSelected = selected === plan.id;
            const isComingSoon = plan.id === "organizacion";

            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all duration-200 card-hover animate-fade-in-up ${
                  plan.popular
                    ? "border-green-400 shadow-lg shadow-green-100"
                    : plan.borderColor
                } ${isCurrent ? "ring-2 ring-offset-2 ring-green-500" : ""} ${isComingSoon ? "opacity-60 grayscale-[30%] pointer-events-none" : ""}`}>

                {/* Popular / Próximamente badge */}
                {plan.popular && !isComingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}
                
                {isComingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Próximamente
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
                  onClick={() => { if (!isCurrent && !isComingSoon) setSelected(plan.id); }}
                  disabled={isCurrent || isComingSoon}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                    isCurrent || isComingSoon
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : plan.popular
                      ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                      : `${plan.bgColor} ${plan.color} border-2 ${plan.borderColor} hover:opacity-80`
                  }`}
                >
                  {isCurrent ? "Plan actual" : plan.cta}
                  {!isCurrent && !isComingSoon && <ArrowRight size={15} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Coming soon notice */}
        <div className={`${modal ? "px-6 pb-6" : ""}`}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center">
            💳 Los pagos en línea están próximamente disponibles. Para actualizar tu plan contáctanos en{" "}
            <a href="mailto:hola@agrencia.cl" className="font-semibold underline">hola@agrencia.cl</a>
          </div>
        </div>

        {/* Selected feedback (para cuando se implementen pagos) */}
        {selected && (
          <div className={`${modal ? "px-6 pb-6" : ""}`}>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center justify-between">
              <span>Seleccionaste el plan <strong>{PLANS.find(p => p.id === selected)?.name}</strong>. Los pagos estarán disponibles próximamente.</span>
              <button onClick={() => setSelected(null)} className="text-green-400 hover:text-green-600 ml-3">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
