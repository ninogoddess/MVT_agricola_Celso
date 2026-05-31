"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SoilData {
  id: string;
  measurement_date: string;
  ph: string;
  humidity_percent: string;
  nitrogen_level: string | null;
  phosphorus_level: string | null;
  potassium_level: string | null;
}

export default function SueloPage() {
  const { parcelaId } = useParams<{ parcelaId: string }>();
  const [soilData, setSoilData] = useState<SoilData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/parcelas/${parcelaId}/soil`)
      .then((r) => r.json())
      .then((d) => setSoilData(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parcelaId]);

  async function addSoilData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/parcelas/${parcelaId}/soil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        measurementDate: form.get("measurementDate"),
        ph: Number(form.get("ph")),
        humidityPercent: Number(form.get("humidityPercent")),
        nitrogenLevel: form.get("nitrogen") ? Number(form.get("nitrogen")) : undefined,
        phosphorusLevel: form.get("phosphorus") ? Number(form.get("phosphorus")) : undefined,
        potassiumLevel: form.get("potassium") ? Number(form.get("potassium")) : undefined,
      }),
    });
    if (res.ok) {
      const newData = await res.json();
      setSoilData((prev) => [newData, ...prev]);
      setShowForm(false);
    }
  }

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Datos de Suelo</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
          + Registro
        </button>
      </div>

      {showForm && (
        <form onSubmit={addSoilData} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="measurementDate" type="date" required
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="ph" type="number" step="0.1" min="0" max="14" required placeholder="pH (0-14)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="humidityPercent" type="number" step="0.1" min="0" max="100" required placeholder="Humedad % (0-100)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input name="nitrogen" type="number" step="0.1" placeholder="N (opcional)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="phosphorus" type="number" step="0.1" placeholder="P (opcional)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            <input name="potassium" type="number" step="0.1" placeholder="K (opcional)"
              className="px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 min-h-[44px]">
            Guardar Registro
          </button>
        </form>
      )}

      {soilData.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Sin registros de suelo</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left text-gray-600">pH</th>
                <th className="px-4 py-3 text-left text-gray-600">Humedad %</th>
                <th className="px-4 py-3 text-left text-gray-600">N</th>
                <th className="px-4 py-3 text-left text-gray-600">P</th>
                <th className="px-4 py-3 text-left text-gray-600">K</th>
              </tr>
            </thead>
            <tbody>
              {soilData.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{new Date(s.measurement_date).toLocaleDateString("es-CL")}</td>
                  <td className="px-4 py-3">{s.ph}</td>
                  <td className="px-4 py-3">{s.humidity_percent}%</td>
                  <td className="px-4 py-3">{s.nitrogen_level ?? "—"}</td>
                  <td className="px-4 py-3">{s.phosphorus_level ?? "—"}</td>
                  <td className="px-4 py-3">{s.potassium_level ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
