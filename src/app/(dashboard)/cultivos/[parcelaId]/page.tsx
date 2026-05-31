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

export default function CultivosPage() {
  const { parcelaId } = useParams<{ parcelaId: string }>();
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/parcelas/${parcelaId}/cultivos`)
      .then((r) => r.json())
      .then((d) => setCultivos(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parcelaId]);

  async function addCultivo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/parcelas/${parcelaId}/cultivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        species: form.get("species"),
        variety: form.get("variety") || undefined,
        plantingDate: form.get("plantingDate"),
      }),
    });
    if (res.ok) {
      const newCultivo = await res.json();
      setCultivos((prev) => [newCultivo, ...prev]);
      setShowForm(false);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="species" required placeholder="Especie (ej: tomate)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="variety" placeholder="Variedad (opcional)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="plantingDate" type="date" required
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 min-h-[44px]">
            Agregar Cultivo
          </button>
        </form>
      )}

      {cultivos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Sin cultivos registrados</p>
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
                }`}>{c.status}</span>
                {c.status === "active" && (
                  <select
                    onChange={(e) => { if (e.target.value) changeStatus(c.id, e.target.value); e.target.value = ""; }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 min-h-[44px]"
                    defaultValue=""
                  >
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
