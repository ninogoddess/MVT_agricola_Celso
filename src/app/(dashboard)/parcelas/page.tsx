"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Layers, Plus } from "lucide-react";

interface Parcela {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  area_hectares: string;
  is_active: boolean;
  color: string | null;
}

const PRESET_COLORS = [
  "#16a34a", "#2563eb", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
];

function LocationBadge({ lat, lon }: { lat: number; lon: number }) {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      { headers: { "User-Agent": "AgroInteligencia/1.0" } }
    )
      .then((r) => r.json())
      .then((d) => {
        const a = d.address;
        const parts = [
          a.village || a.town || a.city || a.municipality,
          a.state,
        ].filter(Boolean);
        setLocation(parts.join(", ") || null);
      })
      .catch(() => null);
  }, [lat, lon]);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <MapPin size={13} />
      <span className="truncate">{location ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`}</span>
    </div>
  );
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColor, setEditingColor] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parcelas")
      .then((r) => r.json())
      .then(setParcelas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateColor(id: string, color: string) {
    await fetch(`/api/parcelas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    setParcelas((prev) => prev.map((p) => p.id === id ? { ...p, color } : p));
    setEditingColor(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Parcelas</h1>
        <Link href="/parcelas/new"
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] flex items-center gap-2">
          <Plus size={18} />
          Nueva
        </Link>
      </div>

      {parcelas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Layers size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">No tienes parcelas registradas</p>
          <Link href="/parcelas/new" className="text-green-600 font-medium hover:underline">Crear primera parcela</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parcelas.map((p) => {
            const color = p.color ?? "#16a34a";
            return (
              <div key={p.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: color }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/parcelas/${p.id}`} className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                      <LocationBadge lat={Number(p.latitude)} lon={Number(p.longitude)} />
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Layers size={12} />
                        <span>{p.area_hectares} ha</span>
                      </div>
                    </Link>

                    {/* Color picker */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setEditingColor(editingColor === p.id ? null : p.id)}
                        className="w-7 h-7 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title="Cambiar color"
                      />
                    {/* Color picker - dropdown más amplio */}
                      {editingColor === p.id && (
                        <div className="absolute right-0 top-10 z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-56">
                          <p className="text-xs font-medium text-gray-500 mb-3">Elige un color</p>
                          <div className="grid grid-cols-4 gap-3">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => updateColor(p.id, c)}
                                className={`w-10 h-10 rounded-xl border-4 hover:scale-110 transition-transform shadow-sm ${
                                  color === c ? "border-gray-800 scale-110" : "border-transparent"
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cerrar color picker al clickar fuera */}
      {editingColor && (
        <div className="fixed inset-0 z-0" onClick={() => setEditingColor(null)} />
      )}
    </div>
  );
}
