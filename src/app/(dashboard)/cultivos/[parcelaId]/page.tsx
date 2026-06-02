"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  const [formError, setFormError] = useState("");

  // Especies únicas disponibles
  const species = Array.from(new Set(cropParams.map((c) => c.species))).sort();
  // Variedades disponibles para la especie seleccionada
  const varieties = cropParams
    .filter((c) => c.species === selectedSpecies && c.variety !== null)
    .map((c) => c.variety as string);

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
      setSelectedSpecies(""); setSelectedVariety(""); setPlantingDate("");
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

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Cultivos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={addCultivo} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
            <select
              value={selectedSpecies}
              onChange={(e) => { setSelectedSpecies(e.target.value); setSelectedVariety(""); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 capitalize"
            >
              <option value="">— Selecciona una especie —</option>
              {species.map((s) => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {varieties.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variedad <span className="text-gray-400">(opcional)</span></label>
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Sin variedad específica —</option>
                {varieties.map((v) => (
                  <option key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de siembra</label>
            <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
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
            <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800 capitalize">{c.species} {c.variety && `(${c.variety})`}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Siembra: {new Date(c.planting_date).toLocaleDateString("es-CL")}
                  {c.estimated_harvest_date && ` | Cosecha est.: ${new Date(c.estimated_harvest_date).toLocaleDateString("es-CL")}`}
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
                    <option value="" disabled>Cambiar</option>
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
