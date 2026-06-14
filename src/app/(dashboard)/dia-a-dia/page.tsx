"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Droplets, Scissors, FlaskConical, CalendarCheck, CheckCircle, Sprout, MapPin, Sparkles } from "lucide-react";

interface Reminder {
  id: string;
  task_type: string;
  scheduled_at: string;
  status: string;
  source: string;
  parcela_id: string;
  cultivo_id: string | null;
}
interface Parcela { id: string; name: string }
interface Cultivo { id: string; name: string | null; species: string; parcela_id: string }

function taskIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    riego: <Droplets size={16} className="text-blue-500" />,
    poda: <Scissors size={16} className="text-gray-500" />,
    fertilizacion: <FlaskConical size={16} className="text-purple-500" />,
  };
  return icons[type] ?? <CalendarCheck size={16} />;
}

function sameDay(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export default function DiaADiaPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reminders").then((r) => r.json()),
      fetch("/api/parcelas").then((r) => r.json()),
    ]).then(([rem, parc]) => {
      setReminders(rem.data ?? []);
      const list = Array.isArray(parc) ? parc : [];
      setParcelas(list);
      if (list.length > 0) {
        Promise.all(list.map((p: Parcela) => fetch(`/api/parcelas/${p.id}/cultivos`).then((r) => r.json())))
          .then((arr) => setCultivos(arr.flat()));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function complete(id: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: "completed" } : r));
  }

  const parcelaName = (id: string) => parcelas.find((p) => p.id === id)?.name;
  const cultivoName = (id: string | null) => {
    if (!id) return null;
    const c = cultivos.find((x) => x.id === id);
    return c ? (c.name || c.species) : null;
  };

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const pendientes = reminders.filter((r) => r.status !== "completed");
  const tareasHoy = pendientes.filter((r) => sameDay(new Date(r.scheduled_at), today)).sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));
  const tareasManana = pendientes.filter((r) => sameDay(new Date(r.scheduled_at), tomorrow)).sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));

  const fmtFecha = (d: Date) => d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  const renderTarea = (r: Reminder) => {
    const cult = cultivoName(r.cultivo_id);
    const parc = parcelaName(r.parcela_id);
    return (
      <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3 card-hover animate-fade-in-up">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5">{taskIcon(r.task_type)}</span>
          <div className="min-w-0">
            <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
              <span className="capitalize">{r.task_type}</span>
              <span className="text-xs text-gray-500">
                {new Date(r.scheduled_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {r.source === "auto"
                ? <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>
                : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Manual</span>}
            </div>
            {(cult || parc) && (
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3">
                {parc && <span className="flex items-center gap-1"><MapPin size={11} /> {parc}</span>}
                {cult && <span className="flex items-center gap-1 text-green-600"><Sprout size={11} /> {cult}</span>}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => complete(r.id)}
          title="Marcar como completada"
          className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">
          <CheckCircle size={16} />
        </button>
      </div>
    );
  };

  const seccionVacia = (texto: string) => (
    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
      <Sparkles size={32} className="mx-auto text-green-300 mb-2" />
      <p className="text-gray-500 text-sm">{texto}</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sun size={22} className="text-amber-500" /> Día a día
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Tus tareas de hoy y mañana, según tus recordatorios automáticos y manuales.</p>
      </div>

      {/* Hoy */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 capitalize">Hoy · {fmtFecha(today)}</h2>
          <span className="text-xs text-gray-400">{tareasHoy.length} tarea(s)</span>
        </div>
        {tareasHoy.length === 0 ? seccionVacia("No tienes tareas para hoy") : <div className="space-y-3">{tareasHoy.map(renderTarea)}</div>}
      </section>

      {/* Mañana */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 capitalize">Mañana · {fmtFecha(tomorrow)}</h2>
          <span className="text-xs text-gray-400">{tareasManana.length} tarea(s)</span>
        </div>
        {tareasManana.length === 0 ? seccionVacia("No tienes tareas para mañana") : <div className="space-y-3">{tareasManana.map(renderTarea)}</div>}
      </section>

      <Link href="/recordatorios" className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium hover:underline">
        <CalendarCheck size={15} /> Ver todos los recordatorios
      </Link>
    </div>
  );
}
