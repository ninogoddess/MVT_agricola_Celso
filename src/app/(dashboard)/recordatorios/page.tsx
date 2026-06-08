"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Droplets, Scissors, FlaskConical, Plus, BellRing, Smartphone, ChevronRight, X, CheckCircle, Trash2 } from "lucide-react";

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

      {/* Notification prompt */}
      <NotificationPrompt />

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
          {displayed.map((reminder) => (
            <div key={reminder.id}
              className={`bg-white rounded-xl border p-4 flex items-center justify-between animate-fade-in-up card-hover ${
                reminder.status === "upcoming" ? "border-amber-300 bg-amber-50" :
                reminder.status === "completed" ? "border-gray-100 opacity-75" : "border-gray-200"
              }`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                  <span>{taskIcon(reminder.task_type)}</span>                  <span className="capitalize">{reminder.task_type}</span>
                  {reminder.status === "upcoming" && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Próximo</span>}
                  {reminder.status === "completed" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Completado</span>}
                  {reminder.source === "auto" && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>}
                  {reminder.source === "manual" && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Manual</span>}
                </div>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <CalendarCheck size={13} className="text-gray-400" />
                  {new Date(reminder.scheduled_at).toLocaleString("es-CL")}
                </div>
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
          ))}
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

const ANDROID_STEPS = [
  { step: 1, text: "Abre Chrome en tu Android y entra a la app." },
  { step: 2, text: "Toca los 3 puntos (⋮) arriba a la derecha." },
  { step: 3, text: 'Selecciona "Configuración del sitio".' },
  { step: 4, text: 'Toca "Notificaciones" y activa el permiso.' },
  { step: 5, text: 'Vuelve y toca "Activar notificaciones" cuando aparezca la solicitud del navegador.' },
  { step: 6, text: "Listo. Recibirás los recordatorios aunque tengas el navegador en segundo plano." },
];

function NotificationPrompt() {
  const [status, setStatus] = useState<NotificationPermission | "unknown">("unknown");
  const [showTutorial, setShowTutorial] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setStatus(Notification.permission);
  }, []);

  async function request() {
    const r = await Notification.requestPermission();
    setStatus(r);
  }

  if (dismissed || status === "granted" || status === "unknown") return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellRing size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-800 text-sm">Activa las notificaciones para no perderte ningún recordatorio</p>
            <p className="text-blue-600 text-xs mt-0.5">Tu celular te avisará de riego, poda y fertilización incluso con el navegador minimizado.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {status === "default" && (
                <button onClick={request}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 min-h-[36px]">
                  Activar notificaciones
                </button>
              )}
              <button onClick={() => setShowTutorial(true)}
                className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 min-h-[36px] flex items-center gap-1">
                <Smartphone size={13} /> Ver tutorial Android <ChevronRight size={13} />
              </button>
              {status === "denied" && (
                <span className="text-xs text-red-500 self-center">Permiso denegado. Actívalo desde ajustes del navegador.</span>
              )}
            </div>
          </div>
          <button onClick={() => setDismissed(true)}
            className="text-blue-400 hover:text-blue-600 min-w-[32px] min-h-[32px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
      </div>

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={() => setShowTutorial(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                <Smartphone size={18} className="text-green-600" />
                Activar notificaciones en Android
              </div>
              <button onClick={() => setShowTutorial(false)}
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {ANDROID_STEPS.map(({ step, text }) => (
                <div key={step} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step}
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">{text}</p>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <strong>iOS (iPhone):</strong> Funciona en Safari desde iOS 16.4. Ve a Configuración → Safari → Notificaciones.
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowTutorial(false)}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
