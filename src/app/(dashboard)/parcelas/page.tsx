"use client";

import { useEffect, useState, useRef } from "react";
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
  { value: "#16a34a", label: "Verde" },
  { value: "#2563eb", label: "Azul" },
  { value: "#dc2626", label: "Rojo" },
  { value: "#d97706", label: "Naranja" },
  { value: "#7c3aed", label: "Violeta" },
  { value: "#0891b2", label: "Celeste" },
  { value: "#db2777", label: "Rosa" },
  { value: "#65a30d", label: "Lima" },
];

function LocationBadge({ lat, lon }: { lat: number; lon: number }) {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      { headers: { "User-Agent": "Agrencia/1.0" } }
    )
      .then((r) => r.json())
      .then((d) => {
        const a = d.address;
        const parts = [a.village || a.town || a.city || a.municipality, a.state].filter(Boolean);
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

// Color picker flotante con position:fixed para que nunca se corte
function ColorPickerPopup({
  parcelaId,
  currentColor,
  anchorRef,
  onSelect,
  onClose,
}: {
  parcelaId: string;
  currentColor: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onSelect: (id: string, color: string) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = 232;
    let left = rect.right - popupWidth;
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 8, left });
  }, [anchorRef]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Popup */}
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-scale-in"
        style={{ top: pos.top, left: pos.left, width: 232 }}
      >
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Color de parcela</p>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onSelect(parcelaId, value)}
              title={label}
              className={`w-12 h-12 rounded-xl transition-all hover:scale-110 shadow-sm ${
                currentColor === value
                  ? "ring-4 ring-offset-1 ring-gray-700 scale-110"
                  : "ring-2 ring-transparent hover:ring-gray-300"
              }`}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
        <div className="h-8 skeleton w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton" />)}
        </div>
      </div>
    );
  }

  const editingParcela = parcelas.find((p) => p.id === editingColor);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Parcelas</h1>
        <Link href="/parcelas/new"
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] flex items-center gap-2">
          <Plus size={18} /> Nueva
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
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover transition-all duration-200 animate-fade-in-up">
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

                    {/* Botón de color — sin relative/overflow */}
                    <button
                      ref={(el) => { buttonRefs.current[p.id] = el; }}
                      onClick={() => setEditingColor(editingColor === p.id ? null : p.id)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 hover:scale-110 transition-transform flex-shrink-0"
                      style={{ backgroundColor: color }}
                      title="Cambiar color"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Color picker flotante — renderizado fuera de las tarjetas */}
      {editingColor && editingParcela && (
        <ColorPickerPopup
          parcelaId={editingColor}
          currentColor={editingParcela.color ?? "#16a34a"}
          anchorRef={{ current: buttonRefs.current[editingColor] }}
          onSelect={updateColor}
          onClose={() => setEditingColor(null)}
        />
      )}
    </div>
  );
}
