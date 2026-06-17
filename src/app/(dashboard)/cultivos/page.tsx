"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, MapPin, ArrowRight, Layers } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import EmptyState from "@/components/ui/EmptyState";

interface Parcela { id: string; name: string; color: string | null }
interface Cultivo {
  id: string;
  name: string | null;
  species: string;
  variety: string | null;
  status: string;
  parcela_id: string;
  planting_date: string;
}

const statusInfo: Record<string, { label: string; cls: string }> = {
  active: { label: "Activo", cls: "bg-green-100 text-green-700" },
  harvested: { label: "Cosechado", cls: "bg-blue-100 text-blue-700" },
  lost: { label: "Perdido", cls: "bg-red-100 text-red-700" },
};

export default function CultivosOverviewPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  usePageTitle("Cultivos");

  useEffect(() => {
    fetch("/api/parcelas")
      .then((r) => r.json())
      .then(async (parc) => {
        const list: Parcela[] = Array.isArray(parc) ? parc : [];
        setParcelas(list);
        if (list.length > 0) {
          const arrays = await Promise.all(
            list.map((p) => fetch(`/api/parcelas/${p.id}/cultivos`).then((r) => r.json()))
          );
          setCultivos(arrays.flat().filter(Boolean));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sprout size={22} className="text-green-600" /> Cultivos
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen de los cultivos de cada parcela.</p>
      </div>

      {parcelas.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aún no tienes parcelas"
          description="Crea una parcela para empezar a registrar y ver tus cultivos."
          actionLabel="Crear primera parcela"
          onAction={() => { window.location.href = "/parcelas/new"; }}
        />
      ) : (
        <div className="space-y-4">
          {parcelas.map((p) => {
            const delParcela = cultivos.filter((c) => c.parcela_id === p.id);
            const activos = delParcela.filter((c) => c.status === "active").length;
            const color = p.color ?? "#16a34a";
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: color }} />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Link href={`/parcelas/${p.id}`} className="flex items-center gap-1.5 font-semibold text-gray-800 hover:text-green-700 min-w-0">
                      <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activos} activo(s)</span>
                  </div>

                  {delParcela.length === 0 ? (
                    <p className="text-sm text-gray-400 mb-3">Sin cultivos registrados</p>
                  ) : (
                    <ul className="space-y-2 mb-3">
                      {delParcela.map((c) => {
                        const si = statusInfo[c.status] ?? statusInfo.active;
                        return (
                          <li key={c.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                            <span className="text-gray-700 flex items-center gap-1.5 min-w-0">
                              <Sprout size={13} className="text-green-500 flex-shrink-0" />
                              <span className="truncate capitalize">{c.name || c.species}{c.variety ? ` · ${c.variety}` : ""}</span>
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${si.cls}`}>{si.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <Link href={`/cultivos/${p.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline">
                    Gestionar cultivos <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
