"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Snowflake, Flame, MapPin, CheckCircle } from "lucide-react";
import {
  analyzeClimate, frostLevel, heatLevel, FROST_RISK, HEAT_RISK,
  type DailyPoint, type ClimateAnalysis,
} from "@/lib/utils/climate-analytics";

interface Parcela { id: string; name: string }
interface ParcelaAnalysis { parcela: Parcela; analysis: ClimateAnalysis | null; forecast: DailyPoint[] }

export default function HeladasPage() {
  const [items, setItems] = useState<ParcelaAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parcelas")
      .then((r) => r.json())
      .then(async (parc) => {
        const list: Parcela[] = Array.isArray(parc) ? parc : [];
        const results = await Promise.all(
          list.map(async (p) => {
            try {
              const res = await fetch(`/api/parcelas/${p.id}/climate/history`).then((r) => r.json());
              const data: DailyPoint[] = res?.data ?? [];
              const forecast = data.filter((d) => !d.isPast);
              return { parcela: p, analysis: data.length ? analyzeClimate(data) : null, forecast };
            } catch {
              return { parcela: p, analysis: null, forecast: [] };
            }
          })
        );
        setItems(results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Link href="/alertas" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Alertas
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Snowflake size={22} className="text-sky-600" /> Heladas y golpe de calor
      </h1>

      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-sky-900">
        <p className="font-medium mb-1">¿Para qué sirve?</p>
        <p>
          Las heladas (temperaturas muy bajas) y el golpe de calor (temperaturas muy altas) pueden dañar
          flores, frutos y plantas completas. Aquí revisamos el <strong>pronóstico real de 7 días</strong> de
          cada parcela (datos de Open-Meteo según su ubicación) y marcamos los días con riesgo, para que
          tomes medidas a tiempo (riego, mallas, cobertores, cosecha anticipada).
        </p>
        <p className="mt-2 text-xs text-sky-700">
          Riesgo de helada: mínima ≤ {FROST_RISK}°C · Riesgo de calor: máxima ≥ {HEAT_RISK}°C
        </p>
      </div>

      {loading ? (
        <div className="h-40 skeleton rounded-xl" />
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No tienes parcelas registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ parcela, analysis, forecast }) => {
            const hasRisk = analysis && (analysis.frostDays.length > 0 || analysis.heatDays.length > 0);
            return (
              <div key={parcela.id} className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in-up">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-medium text-gray-800 flex items-center gap-1.5"><MapPin size={15} className="text-gray-400" /> {parcela.name}</span>
                  {!analysis ? (
                    <span className="text-xs text-gray-400">Sin datos</span>
                  ) : hasRisk ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Riesgo detectado</span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={11} /> Sin riesgo</span>
                  )}
                </div>

                {analysis && forecast.length > 0 ? (
                  <>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${forecast.length}, 1fr)` }}>
                      {forecast.map((d) => {
                        const fl = frostLevel(d.tempMin);
                        const hl = heatLevel(d.tempMax);
                        const day = new Date(d.date + "T00:00:00");
                        const label = day.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "");
                        const danger = fl !== "none" || hl !== "none";
                        return (
                          <div key={d.date} className={`flex flex-col items-center rounded-lg py-2 ${danger ? (fl !== "none" ? "bg-sky-50" : "bg-orange-50") : "bg-gray-50"}`}>
                            <span className="text-[10px] text-gray-500">{label}</span>
                            <span className="text-[10px] text-gray-400">{day.getDate()}</span>
                            <span className="text-xs font-semibold text-red-500 mt-1">{d.tempMax != null ? `${Math.round(d.tempMax)}°` : "—"}</span>
                            <span className="text-xs font-semibold text-blue-500">{d.tempMin != null ? `${Math.round(d.tempMin)}°` : "—"}</span>
                            <div className="h-4 flex items-center">
                              {fl !== "none" && <Snowflake size={13} className={fl === "severe" ? "text-sky-700" : "text-sky-400"} />}
                              {hl !== "none" && <Flame size={13} className={hl === "severe" ? "text-orange-700" : "text-orange-400"} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {hasRisk && (
                      <div className="mt-3 text-xs space-y-1">
                        {analysis.frostDays.length > 0 && (
                          <p className="text-sky-700 flex items-center gap-1.5">
                            <Snowflake size={12} /> {analysis.frostDays.length} día(s) con riesgo de helada (mínima de {Math.round(analysis.worstFrost ?? 0)}°C).
                          </p>
                        )}
                        {analysis.heatDays.length > 0 && (
                          <p className="text-orange-600 flex items-center gap-1.5">
                            <Flame size={12} /> {analysis.heatDays.length} día(s) con riesgo de calor extremo (máxima de {Math.round(analysis.worstHeat ?? 0)}°C).
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No se pudo cargar el pronóstico de esta parcela.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
