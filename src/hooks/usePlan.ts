"use client";

import { useEffect, useState } from "react";

export type PlanId = "free" | "pro" | "organizacion";

/**
 * Obtiene el plan actual del tenant para gatear funciones premium en la UI.
 */
export function usePlan() {
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setPlanId((d?.planId as PlanId) ?? "free"))
      .catch(() => setPlanId("free"))
      .finally(() => setLoading(false));
  }, []);

  const isPaid = planId === "pro" || planId === "organizacion";
  return { planId, isPaid, loading };
}
