"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Droplets, Scissors, FlaskConical, Plus, CheckCircle, Trash2 } from "lucide-react";
import { NotificationBanner } from "@/components/ui/AppBanners";
import { useNotifications } from "@/hooks/useNotifications";

interface Reminder {
  id: string;
  task_type: string;
  scheduled_at: string;
  status: string;
  source: string;
  reasoning: string | null;
  parcela_id: string;
  cultivo_id: string | null;
}

interface Parcela {
  id: string;
  name: string;
}

interface Cultivo {
  id: string;
  name: string | null;
  species: string;
  variety: string | null;
  parcela_id: string;
  status?: string;
}

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [formData, setFormData] = useState({ parcelaId: "", cultivoId: "", taskType: "", scheduledAt: "" });
  const [formError, setFormError] = useState("");
  const { scheduleReminder } = useNotifications();

  useEffect(() => {
    Promise.all([
      fetch("/api/reminders").then((r) => r.json()),
      fetch("/api/parcelas").then((r) => r.json()),
    ])
      .then(([rem, parc]) => {
        setReminders(rem.data ?? []);
        const parcelasList = Array.isArray(parc) ? parc : [];
        setParcelas(parcelasList);
        
        // Cargar cultivos de todas las parcelas
        if (parcelasList.length > 0) {
          Promise.all(
            parcelasList.map((p: Parcela) => 
              fetch(`/api/parcelas/${p.id}/cultivos`).then((r) => r.json())
            )
          ).then((cultivosArrays) => {
            const allCultivos = cultivosArrays.flat();
            setCultivos(allCultivos);
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Cultivos filtrados por parcela seleccionada
  const cultivosFiltrados = formData.parcelaId 
    ? cultivos.filter((c) => c.parcela_id === formData.parcelaId && (c.status === undefined || (c.status !== 'harvested' && c.status !== 'lost')))
    : [];

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
      setFormError("Completa todos los campos obligatorios"); return;
    }
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelaId: formData.parcelaId,
        cultivoId: formData.cultivoId || undefined,
        taskType: formData.taskType,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        source: "manual",
      }),
    });
    if (res.ok) {
      const newReminder = await res.json();
      setReminders((prev) => [newReminder, ...prev]);

      // Programar notificación local en el dispositivo
      const parcela = parcelas.find((p) => p.id === formData.parcelaId);
      const cultivo = formData.cultivoId ? cultivos.find((c) => c.id === formData.cultivoId) : null;
      scheduleReminder({
        id: newReminder.id,
        taskType: formData.taskType,
        parcelaName: parcela?.name,
        cultivoName: cultivo ? (cultivo.name || cultivo.species) : undefined,
        scheduledAt: formData.scheduledAt,
      });

      setShowForm(false);
      setFormData({ parcelaId: "", cultivoId: "", taskType: "", scheduledAt: "" });
    } else {
      const d = await res.json();
      setFormError(d.error || "Error al crear recordatorio");
    }
  }

  function handleParcelaChange(parcelaId: string) {
    setFormData((d) => ({ ...d, parcelaId, cultivoId: "" })); // Reset cultivo al cambiar parcela
  }

  // Obtener nombre del cultivo para mostrar en la lista
  function getCultivoDisplayName(cultivoId: string | null) {
    if (!cultivoId) return null;
    const cultivo = cultivos.find((c) => c.id === cultivoId);
    if (!cultivo) return null;
    return cultivo.name || cultivo.species;
  }

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  const pending = reminders.filter((r) => r.status !== "completed");
  const completed = reminders.filter((r) => r.status === "completed");
  const displayed = tab === "pending" ? pending : completed;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Recordatorios</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px] flex items-center gap-2">
          <Plus size={18} /> Manual
        </button>
      </div>

      {/* Notification + Install banners */}
      <div className="space-y-3">
        <NotificationBanner />
      </div>

      {/* Formulario manual */}
      {showForm && (
        <form onSubmit={createManual} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-gray-800">Nuevo Recordatorio Manual</h3>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parcela</label>
            <select value={formData.parcelaId} onChange={(e) => handleParcelaChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Selecciona una parcela —</option>
              {parcelas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {formData.parcelaId && cultivosFiltrados.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cultivo <span className="text-gray-400">(opcional)</span></label>
              <select value={formData.cultivoId} onChange={(e) => setFormData((d) => ({ ...d, cultivoId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Sin cultivo específico —</option>
                {cultivosFiltrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ? `${c.name} (${c.species})` : c.species.charAt(0).toUpperCase() + c.species.slice(1)}
                    {c.variety ? ` - ${c.variety}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tarea</label>
            <select value={formData.taskType} onChange={(e) => setFormData(d => ({...d, taskType: e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Selecciona un tipo —</option>
              <option value="riego">Riego</option>
              <option value="poda">Poda</option>
              <option value="fertilizacion">Fertilización</option>
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
          <CalendarCheck size={40} className={`mx-auto mb-3 ${tab === "pending" ? "text-gray-300" : "text-green-400"}`} />
          <p className="text-gray-500">
            {tab === "pending" ? "No hay recordatorios pendientes" : "No hay recordatorios completados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((reminder) => {
            const cultivoName = getCultivoDisplayName(reminder.cultivo_id);
            const parcela = parcelas.find((p) => p.id === reminder.parcela_id);
            
            return (
              <div key={reminder.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between animate-fade-in-up card-hover ${
                  reminder.status === "upcoming" ? "border-amber-300 bg-amber-50" :
                  reminder.status === "completed" ? "border-gray-100 opacity-75" : "border-gray-200"
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                    <span>{taskIcon(reminder.task_type)}</span>
                    <span className="capitalize">{reminder.task_type}</span>
                    {reminder.status === "upcoming" && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Próximo</span>}
                    {reminder.status === "completed" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Completado</span>}
                    {reminder.source === "auto" && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>}
                    {reminder.source === "manual" && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Manual</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <CalendarCheck size={13} className="text-gray-400" />
                    {new Date(reminder.scheduled_at).toLocaleString("es-CL")}
                  </div>
                  {(cultivoName || parcela) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {cultivoName && <span className="text-green-600">🌱 {cultivoName}</span>}
                      {cultivoName && parcela && <span className="mx-1">·</span>}
                      {parcela && <span>📍 {parcela.name}</span>}
                    </div>
                  )}
                  {reminder.reasoning && <div className="text-xs text-gray-400 mt-1 truncate">{reminder.reasoning}</div>}
                </div>

                <div className="flex gap-2 ml-3 flex-shrink-0">
                  {reminder.status !== "completed" && (
                    <button onClick={() => markComplete(reminder.id)}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {reminder.source === "manual" && (
                    <button onClick={() => deleteReminder(reminder.id)}
                      className="px-3 py-2 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function taskIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    riego: <Droplets size={16} className="text-blue-500" />,
    poda: <Scissors size={16} className="text-gray-500" />,
    fertilizacion: <FlaskConical size={16} className="text-purple-500" />,
  };
  return icons[type] ?? <CalendarCheck size={16} />;
}
