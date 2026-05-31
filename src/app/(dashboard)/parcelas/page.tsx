"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Parcela {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  area_hectares: string;
  is_active: boolean;
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parcelas")
      .then((res) => res.json())
      .then(setParcelas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Parcelas</h1>
        <Link
          href="/parcelas/new"
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] flex items-center"
        >
          + Nueva
        </Link>
      </div>

      {parcelas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 mb-3">No tienes parcelas registradas</p>
          <Link href="/parcelas/new" className="text-green-600 font-medium hover:underline">
            Crear primera parcela
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parcelas.map((p) => (
            <Link
              key={p.id}
              href={`/parcelas/${p.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-800">{p.name}</h3>
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <p>📍 {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}</p>
                <p>📐 {p.area_hectares} hectáreas</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
