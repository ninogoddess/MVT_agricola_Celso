"use client";

import { useEffect, useState } from "react";

interface Reminder {
  id: string;
  task_type: string;
  scheduled_at: string;
  status: string;
  source: string;
  reasoning: string | null;
  parcela_id: string;
}

interface Parcela {
  id: string;
  name: string;
}

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [formData, setFormData] = useState({ parcelaId: "", taskType: "", scheduledAt: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/reminders").then((r) => r.json()),
      fetch("/api/parcelas").then((r) => r.json()),
    ])
      .then(([rem, parc]) => {
        setReminders(rem.data ?? []);
        setParcelas(Array.isArray(parc) ? parc : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function markComplete(id: string) {
    await fetch(`/api/reminders/${id}/complete`, { method: "PATCH" });
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: "completed" } : r));
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function createManual(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.parcelaId || !formData.taskType || !formData.scheduledAt) {
      setFormError("Completa todos los campos"); return;
    }
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelaId: formData.parcelaId,
        taskType: formData.taskType,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        source: "manual",
      }),
    });
    if (res.ok) {
      const newReminder = await res.json();
      setReminders((prev) => [newReminder, ...prev]);
      setShowForm(false);
      setFormData({ parcelaId: "", taskType: "", scheduledAt: "" });
    } else {
      const d = await res.json();
      setFormError(d.error || "Error al crear recordatorio");
    }
  }

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  const pending = reminders.filter((r) => r.status !== "completed");
  const completed = reminders.filter((r) => r.status === "completed");
  const displayed = tab === "pending" ? pending : completed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Recordatorios</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
          + Manual
        </button>
      </div>

      {/* Formulario manual */}
      {showForm && (
        <form onSubmit={createManual} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-gray-800">Nuevo Recordatorio Manual</h3>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parcela</label>
            <select value={formData.parcelaId} onChange={(e) => setFormData(d => ({...d, parcelaId: e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Selecciona una parcela —</option>
              {parcelas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tarea</label>
            <select value={formData.taskType} onChange={(e) => setFormData(d => ({...d, taskType: e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Selecciona un tipo —</option>
              <option value="riego">💧 Riego</option>
              <option value="poda">✂️ Poda</option>
              <option value="fertilizacion">🧪 Fertilización</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
            <input type="datetime-local" value={formData.scheduledAt}
              onChange={(e) => setFormData(d => ({...d, scheduledAt: e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]">
              Crear Recordatorio
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setTab("pending")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "pending" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}>
          Pendientes ({pending.length})
        </button>
        <button onClick={() => setTab("completed")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "completed" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}>
          Completados ({completed.length})
        </button>
      </div>

      {/* Lista */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">{tab === "pending" ? "📋" : "✅"}</div>
          <p className="text-gray-500">
            {tab === "pending" ? "No hay recordatorios pendientes" : "No hay recordatorios completados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((reminder) => (
            <div key={reminder.id}
              className={`bg-white rounded-lg border p-4 flex items-center justify-between ${
                reminder.status === "upcoming" ? "border-amber-300 bg-amber-50" :
                reminder.status === "completed" ? "border-gray-100 opacity-75" : "border-gray-200"
              }`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                  <span>{taskIcon(reminder.task_type)}</span>
                  <span className="capitalize">{reminder.task_type}</span>
                  {reminder.status === "upcoming" && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Próximo</span>}
                  {reminder.status === "completed" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Completado</span>}
                  {reminder.source === "auto" && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>}
                  {reminder.source === "manual" && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Manual</span>}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  📅 {new Date(reminder.scheduled_at).toLocaleString("es-CL")}
                </div>
                {reminder.reasoning && <div className="text-xs text-gray-400 mt-1 truncate">{reminder.reasoning}</div>}
              </div>

              <div className="flex gap-2 ml-3 flex-shrink-0">
                {reminder.status !== "completed" && (
                  <button onClick={() => markComplete(reminder.id)}
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 min-h-[44px] min-w-[44px]">
                    ✓
                  </button>
                )}
                {reminder.source === "manual" && (
                  <button onClick={() => deleteReminder(reminder.id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100 min-h-[44px] min-w-[44px]">
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function taskIcon(type: string) {
  const icons: Record<string, string> = { riego: "💧", poda: "✂️", fertilizacion: "🧪" };
  return icons[type] ?? "📋";
}
