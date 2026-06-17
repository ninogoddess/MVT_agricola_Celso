"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Estado vacío consistente y amigable para toda la app.
 * Pensado para usuarios poco familiarizados con interfaces: ícono grande,
 * título claro y un botón de acción opcional.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "success";
}) {
  const iconWrap = tone === "success" ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400";

  return (
    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-200 animate-fade-in-up">
      <div className={`w-16 h-16 rounded-2xl ${iconWrap} flex items-center justify-center mx-auto mb-4`}>
        <Icon size={30} />
      </div>
      <p className="font-semibold text-gray-700">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 min-h-[44px]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
