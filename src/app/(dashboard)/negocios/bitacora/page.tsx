"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookText, Plus, Trash2, ArrowLeft, Sprout, MapPin } from "lucide-react";

interface FieldLog {
  id: string;
  parcela_id: string;
  cultivo_id: string | null;
  log_date: string;
  category: string;
  title: string;
  notes: string | null;
}
interface Parcela { id: string; name: string }
interface Cultivo { id: string; name: string | null; species: string; parcela_id: string; status?: string }

const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "siembra", label: "Siembra", emoji: "🌱" },
  { value: "cosecha", label: "Cosecha", emoji: "🌾" },
  { value: "riego", label: "Riego", emoji: "💧" },
  { value: "fertilizacion", label: "Fertilización", emoji: "🧪" },
  { value: "poda", label: "Poda", emoji: "✂️" },
  { value: "fitosanitario", label: "Fitosanitario", emoji: "🛡️" },
  { value: "labor", label: "Labor general", emoji: "🚜" },
  { value: "observacion", label: "Observación", emoji: "👀" },
  { value: "otro", label: "Otro", emoji: "📝" },
];

const catInfo = (v: string) => CATEGORIES.find((c) => c.value === v) ?? CATEGORIES[CATEGORIES.length - 1];

export default function BitacoraPage() {
  const [logs, setLogs] = useState<FieldLog[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    parcelaId: "", cultivoId: "", logDate: new Date().toISOString().slice(0, 10), category: "labor", title: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/business/logs").then((r) => r.json()),
      fetch("/api/parcelas").then((r) => r.json()),
    ]).then(([l, parc]) => {
      setLogs(l.data ?? []);
      const list = Array.isArray(parc) ? parc : [];
      setParcelas(list);
      if (list.length > 0) {
        Promise.all(list.map((p: Parcela) => fetch(`/api/parcelas/${p.id}/cultivos`).then((r) => r.json())))
          .then((arr) => setCultivos(arr.flat()));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cultivosFiltrados = form.parcelaId
    ? cultivos.filter((c) => c.parcela_id === form.parcelaId && c.status !== "harvested" && c.status !== "lost")
    : [];

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.parcelaId || !form.title || !form.logDate) {
      setFormError("Completa parcela, título y fecha"); return;
    }
    const res = await fetch("/api/business/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelaId: form.parcelaId,
        cultivoId: form.cultivoId || undefined,
        logDate: form.logDate,
        category: form.category,
        title: form.title,
        notes: form.notes || undefined,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setLogs((prev) => [nuevo, ...prev]);
      setShowForm(false);
      setForm({ parcelaId: "", cultivoId: "", logDate: new Date().toISOString().slice(0, 10), category: "labor", title: "", notes: "" });
    } else {
      const d = await res.json();
      setFormError(d.error || "Error al guardar");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/business/logs/${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const cultivoName = (id: string | null) => {
    if (!id) return null;
    const c = cultivos.find((x) => x.id === id);
    return c ? (c.name || c.species) : null;
  };
  const parcelaName = (id: string) => parcelas.find((p) => p.id === id)?.name;

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Link href="/negocios" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Negocios
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookText size={22} className="text-emerald-600" /> Cuaderno de campo
        </h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px] flex items-center gap-2">
          <Plus size={18} /> Registro
        </button>
      </div>

      {/* Explicación */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-900">
        Anota cada labor que realizas en tus parcelas. Tener un historial ordenado te ayuda con la trazabilidad,
        a recordar qué hiciste y cuándo, y a respaldar certificaciones. Cada registro queda asociado a una parcela
        y, opcionalmente, a un cultivo.
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parcela</label>
              <select value={form.parcelaId} onChange={(e) => setForm((f) => ({ ...f, parcelaId: e.target.value, cultivoId: "" }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Selecciona —</option>
                {parcelas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {cultivosFiltrados.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cultivo <span className="text-gray-400">(opcional)</span></label>
                <select value={form.cultivoId} onChange={(e) => setForm((f) => ({ ...f, cultivoId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— Sin cultivo específico —</option>
                  {cultivosFiltrados.map((c) => <option key={c.id} value={c.id}>{c.name || c.species}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={form.logDate} onChange={(e) => setForm((f) => ({ ...f, logDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={form.title} maxLength={160} placeholder="Ej: Aplicación de fungicida"
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas <span className="text-gray-400">(opcional)</span></label>
            <textarea value={form.notes} rows={3} placeholder="Detalles, productos usados, dosis, condiciones…"
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]">Guardar</button>
          </div>
        </form>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aún no hay registros en tu cuaderno de campo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const info = catInfo(log.category);
            const cult = cultivoName(log.cultivo_id);
            return (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3 card-hover animate-fade-in-up">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{info.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                      {log.title}
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{info.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>{new Date(log.log_date + "T00:00:00").toLocaleDateString("es-CL")}</span>
                      {parcelaName(log.parcela_id) && <span className="flex items-center gap-1"><MapPin size={11} /> {parcelaName(log.parcela_id)}</span>}
                      {cult && <span className="flex items-center gap-1 text-green-600"><Sprout size={11} /> {cult}</span>}
                    </div>
                    {log.notes && <p className="text-sm text-gray-500 mt-1.5 whitespace-pre-wrap">{log.notes}</p>}
                  </div>
                </div>
                <button onClick={() => remove(log.id)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
