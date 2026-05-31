"use client";

import { useEffect, useState } from "react";

interface Reminder {
  id: string;
  task_type: string;
  scheduled_at: string;
  status: string;
  source: string;
  reasoning: string | null;
}

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => setReminders(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function markComplete(id: string) {
    await fetch(`/api/reminders/${id}/complete`, { method: "PATCH" });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  const pending = reminders.filter((r) => r.status !== "completed");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Recordatorios</h1>

      {pending.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No hay recordatorios pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white rounded-lg border p-4 flex items-center justify-between ${
                reminder.status === "upcoming" ? "border-amber-300 bg-amber-50" : "border-gray-200"
              }`}
            >
              <div>
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {taskIcon(reminder.task_type)}
                  <span className="capitalize">{reminder.task_type}</span>
                  {reminder.status === "upcoming" && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Próximo</span>
                  )}
                  {reminder.source === "auto" && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  📅 {new Date(reminder.scheduled_at).toLocaleString("es-CL")}
                </div>
                {reminder.reasoning && (
                  <div className="text-xs text-gray-400 mt-1">{reminder.reasoning}</div>
                )}
              </div>
              <button
                onClick={() => markComplete(reminder.id)}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 min-h-[44px] min-w-[44px]"
              >
                ✓
              </button>
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
