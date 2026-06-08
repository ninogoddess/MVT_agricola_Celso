"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sprout, CheckCircle2, Lightbulb, CalendarDays } from "lucide-react";

interface Cultivo {
  id: string;
  species: string;
  variety: string | null;
  planting_date: string;
  estimated_harvest_date: string | null;
  status: string;
}

interface CropParam {
  species: string;
  variety: string | null;
  hemisferio_sur_meses_siembra: number[];
  dias_a_cosecha: number;
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getSuggestedPlantingDate(months: number[]): string {
  if (!months?.length) return "";
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const sorted = [...months].sort((a, b) => a - b);
  const next = sorted.find((m) => m >= currentMonth) ?? sorted[0];
  const year = next >= currentMonth ? now.getFullYear() : now.getFullYear() + 1;
  const date = new Date(year, next - 1, 15);
  return date.toISOString().split("T")[0];
}

function getOptimalWindowText(months: number[]): string {
  if (!months?.length) return "";
  return months.map((m) => MONTH_NAMES[m - 1]).join(", ");
}

export default function CultivosPage() {
  const { parcelaId } = useParams<{ parcelaId: string }>();
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [cropParams, setCropParams] = useState<CropParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [isAlreadyPlanted, setIsAlreadyPlanted] = useState(false);
  const [formError, setFormError] = useState("");

  const species = Array.from(new Set(cropParams.map((c) => c.species))).sort();
  const varieties = cropParams
    .filter((c) => c.species === selectedSpecies && c.variety !== null)
    .map((c) => c.variety as string);

  // Datos del cultivo seleccionado para sugerencias
  const selectedParams = cropParams.find(
    (c) => c.species === selectedSpecies && (selectedVariety ? c.variety === selectedVariety : true)
  ) ?? cropParams.find((c) => c.species === selectedSpecies);

  function handleSpeciesChange(s: string) {
    setSelectedSpecies(s);
    setSelectedVariety("");
    setPlantingDate("");
    // Auto-sugerir fecha si no está ya cultivado
    if (!isAlreadyPlanted && s) {
      const params = cropParams.find((c) => c.species === s);
      if (params) {
        setPlantingDate(getSuggestedPlantingDate(params.hemisferio_sur_meses_siembra));
      }
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/parcelas/${parcelaId}/cultivos`).then((r) => r.json()),
      fetch("/api/crop-parameters").then((r) => r.json()),
    ])
      .then(([cult, params]) => {
        setCultivos(Array.isArray(cult) ? cult : []);
        setCropParams(Array.isArray(params) ? params : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parcelaId]);

  async function addCultivo(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!selectedSpecies) { setFormError("Selecciona una especie"); return; }
    if (!plantingDate) { setFormError("Ingresa la fecha de siembra"); return; }

    // Status inicial: si ya está cultivado → active, si es futuro → pending (pero usamos active de igual forma)
    const res = await fetch(`/api/parcelas/${parcelaId}/cultivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        species: selectedSpecies,
        variety: selectedVariety || undefined,
        plantingDate,
      }),
    });
    if (res.ok) {
      const newCultivo = await res.json();
      setCultivos((prev) => [newCultivo, ...prev]);
      setShowForm(false);
      setSelectedSpecies(""); setSelectedVariety(""); setPlantingDate(""); setIsAlreadyPlanted(false);
    } else {
      const d = await res.json();
      setFormError(d.error || "Error al agregar cultivo");
    }
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/cultivos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCultivos((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  }

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Cultivos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={addCultivo} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          {/* ¿Ya está cultivado? */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setIsAlreadyPlanted(false); if (selectedSpecies) setPlantingDate(getSuggestedPlantingDate(selectedParams?.hemisferio_sur_meses_siembra ?? [])); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
                !isAlreadyPlanted ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
              }`}
            >
              <Sprout size={15} /> Planificar siembra
            </button>
            <button
              type="button"
              onClick={() => { setIsAlreadyPlanted(true); setPlantingDate(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
                isAlreadyPlanted ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
              }`}
            >
              <CheckCircle2 size={15} /> Ya está cultivado
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
            <select value={selectedSpecies} onChange={(e) => handleSpeciesChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Selecciona una especie —</option>
              {species.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {varieties.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variedad <span className="text-gray-400">(opcional)</span></label>
              <select value={selectedVariety} onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Sin variedad específica —</option>
                {varieties.map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sugerencia de fecha */}
          {!isAlreadyPlanted && selectedParams && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-green-700 font-medium mb-1 flex items-center gap-1.5">
                <Lightbulb size={14} /> Ventana óptima para Chile (hemisferio sur)
              </p>
              <p className="text-green-600">Meses recomendados: <strong>{getOptimalWindowText(selectedParams.hemisferio_sur_meses_siembra)}</strong></p>
              <p className="text-green-600">Días a cosecha: ~<strong>{selectedParams.dias_a_cosecha} días</strong></p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {isAlreadyPlanted ? "Fecha de siembra (real)" : "Fecha de siembra (planificada)"}
              </span>
            </label>
            <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            {!isAlreadyPlanted && plantingDate && (
              <p className="text-xs text-gray-400 mt-1">Fecha sugerida basada en la ventana óptima de siembra</p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]">
              Agregar Cultivo
            </button>
          </div>
        </form>
      )}

      {cultivos.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Sin cultivos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cultivos.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between card-hover animate-fade-in-up">
              <div>
                <div className="font-medium text-gray-800 capitalize">{c.species}{c.variety ? ` — ${c.variety}` : ""}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(c.planting_date) > new Date() ? "Siembra planificada" : "Sembrado"}: {new Date(c.planting_date).toLocaleDateString("es-CL")}
                  {c.estimated_harvest_date && ` · Cosecha est.: ${new Date(c.estimated_harvest_date).toLocaleDateString("es-CL")}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  c.status === "active" ? "bg-green-100 text-green-700" :
                  c.status === "harvested" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                }`}>{c.status === "active" ? "Activo" : c.status === "harvested" ? "Cosechado" : "Perdido"}</span>
                {c.status === "active" && (
                  <select onChange={(e) => { if (e.target.value) changeStatus(c.id, e.target.value); e.target.value = ""; }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 min-h-[44px]" defaultValue="">
                    <option value="" disabled>Cambiar estado</option>
                    <option value="harvested">Cosechado</option>
                    <option value="lost">Perdido</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
