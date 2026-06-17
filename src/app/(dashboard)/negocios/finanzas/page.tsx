"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Plus, Trash2, ArrowLeft, TrendingUp, TrendingDown, Scale, Sprout, MapPin } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modals";
import { useToast } from "@/components/ui/Toast";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Totals { income: number; expense: number; balance: number }
interface CultivoSummary { cultivoId: string; cultivoName: string; totals: Totals }
interface ParcelaSummary { parcelaId: string; parcelaName: string; totals: Totals; cultivos: CultivoSummary[] }
interface Summary { general: Totals; byParcela: ParcelaSummary[] }

interface Transaction {
  id: string; parcela_id: string; cultivo_id: string | null;
  type: "income" | "expense"; category: string; amount: string;
  description: string | null; transaction_date: string;
}
interface Parcela { id: string; name: string }
interface Cultivo { id: string; name: string | null; species: string; parcela_id: string; status?: string }

const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

const EXPENSE_CATS = ["Semillas", "Fertilizantes", "Fitosanitarios", "Mano de obra", "Riego/Agua", "Maquinaria", "Combustible", "Otro"];
const INCOME_CATS = ["Venta cosecha", "Subsidio", "Otro"];

export default function FinanzasPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();
  usePageTitle("Finanzas");
  const [form, setForm] = useState({
    parcelaId: "", cultivoId: "", type: "expense" as "income" | "expense",
    category: "Semillas", amount: "", description: "", transactionDate: new Date().toISOString().slice(0, 10),
  });

  function reload() {
    return Promise.all([
      fetch("/api/business/summary").then((r) => r.json()),
      fetch("/api/business/transactions").then((r) => r.json()),
    ]).then(([s, t]) => {
      setSummary(s);
      setTransactions(t.data ?? []);
    });
  }

  useEffect(() => {
    Promise.all([
      reload(),
      fetch("/api/parcelas").then((r) => r.json()).then((parc) => {
        const list = Array.isArray(parc) ? parc : [];
        setParcelas(list);
        if (list.length > 0) {
          return Promise.all(list.map((p: Parcela) => fetch(`/api/parcelas/${p.id}/cultivos`).then((r) => r.json())))
            .then((arr) => setCultivos(arr.flat()));
        }
      }),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cultivosFiltrados = form.parcelaId
    ? cultivos.filter((c) => c.parcela_id === form.parcelaId && c.status !== "harvested" && c.status !== "lost")
    : [];
  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const amount = Number(form.amount);
    if (!form.parcelaId || !form.amount || Number.isNaN(amount) || amount < 0) {
      setFormError("Completa parcela y un monto válido"); return;
    }
    const res = await fetch("/api/business/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelaId: form.parcelaId,
        cultivoId: form.cultivoId || undefined,
        type: form.type,
        category: form.category,
        amount,
        description: form.description || undefined,
        transactionDate: form.transactionDate,
      }),
    });
    if (res.ok) {
      await reload();
      setShowForm(false);
      setForm({ parcelaId: "", cultivoId: "", type: "expense", category: "Semillas", amount: "", description: "", transactionDate: new Date().toISOString().slice(0, 10) });
      toast.success(form.type === "income" ? "Ingreso registrado" : "Gasto registrado");
    } else {
      const d = await res.json();
      setFormError(d.error || "Error al guardar");
    }
  }

  async function remove() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    await fetch(`/api/business/transactions/${id}`, { method: "DELETE" });
    await reload();
    toast.success("Movimiento eliminado");
  }

  const parcelaName = (id: string) => parcelas.find((p) => p.id === id)?.name;
  const cultivoName = (id: string | null) => {
    if (!id) return null;
    const c = cultivos.find((x) => x.id === id);
    return c ? (c.name || c.species) : null;
  };

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  const g = summary?.general ?? { income: 0, expense: 0, balance: 0 };
  const hasData = transactions.length > 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Link href="/negocios" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Negocios
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet size={22} className="text-green-600" /> Finanzas
        </h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px] flex items-center gap-2">
          <Plus size={18} /> Movimiento
        </button>
      </div>

      {/* Explicación */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-900">
        Registra tus <strong>ingresos</strong> (ventas) y <strong>gastos</strong> (insumos, mano de obra, etc.) asociándolos
        a una parcela y, si quieres, a un cultivo. El sistema calcula automáticamente la rentabilidad por cultivo,
        por parcela y el total de tu campo, para que sepas qué te conviene producir.
      </div>

      {/* Resumen general */}
      {hasData && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1"><TrendingUp size={16} /><span className="text-xs font-medium text-gray-500">Ingresos totales</span></div>
          <div className="text-xl font-bold text-gray-800">{clp(g.income)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1"><TrendingDown size={16} /><span className="text-xs font-medium text-gray-500">Gastos totales</span></div>
          <div className="text-xl font-bold text-gray-800">{clp(g.expense)}</div>
        </div>
        <div className={`rounded-xl border p-4 ${g.balance >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className={`flex items-center gap-2 mb-1 ${g.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}><Scale size={16} /><span className="text-xs font-medium text-gray-500">Balance general</span></div>
          <div className={`text-xl font-bold ${g.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{clp(g.balance)}</div>
        </div>
      </div>
      )}

      {/* Estado vacío */}
      {!hasData && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Wallet size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Aún no se registran datos en finanzas</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Agrega tu primer ingreso o gasto para ver la rentabilidad de tu campo.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 min-h-[44px]">
            <Plus size={16} /> Registrar movimiento
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={create} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          {/* Tipo */}
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, category: t === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 min-h-[44px] transition-all ${
                  form.type === t
                    ? t === "income" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                {t === "income" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>

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
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP)</label>
              <input type="number" min="0" step="1" value={form.amount} placeholder="0"
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400">(opcional)</span></label>
              <input value={form.description} maxLength={200} placeholder="Detalle del movimiento"
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]">Guardar</button>
          </div>
        </form>
      )}

      {/* Rentabilidad por parcela y cultivo */}
      {hasData && summary && summary.byParcela.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">Rentabilidad por parcela</h2>
          {summary.byParcela.map((p) => (
            <div key={p.parcelaId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-2 border-b border-gray-100">
                <span className="font-medium text-gray-800 flex items-center gap-1.5"><MapPin size={15} className="text-gray-400" /> {p.parcelaName}</span>
                <span className={`text-sm font-bold ${p.totals.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{clp(p.totals.balance)}</span>
              </div>
              <div className="px-4 py-2 flex gap-4 text-xs text-gray-500">
                <span className="text-emerald-600">+ {clp(p.totals.income)}</span>
                <span className="text-red-500">− {clp(p.totals.expense)}</span>
              </div>
              {p.cultivos.length > 0 && (
                <ul className="divide-y divide-gray-50">
                  {p.cultivos.map((c) => (
                    <li key={c.cultivoId} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1.5 capitalize"><Sprout size={13} className="text-green-500" /> {c.cultivoName}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">+{clp(c.totals.income)} / −{clp(c.totals.expense)}</span>
                        <span className={`font-medium ${c.totals.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{clp(c.totals.balance)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Movimientos recientes */}
      {hasData && (
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800">Movimientos recientes</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
            <Wallet size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Aún no registras movimientos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center justify-between gap-3 card-hover">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {t.type === "income" ? "Ingreso" : "Gasto"}
                    </span>
                    <span>{t.category}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3">
                    <span>{new Date(t.transaction_date + "T00:00:00").toLocaleDateString("es-CL")}</span>
                    {parcelaName(t.parcela_id) && <span>📍 {parcelaName(t.parcela_id)}</span>}
                    {cultivoName(t.cultivo_id) && <span className="text-green-600">🌱 {cultivoName(t.cultivo_id)}</span>}
                  </div>
                  {t.description && <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-semibold ${t.type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "−"}{clp(Number(t.amount))}
                  </span>
                  <button onClick={() => setDeleteId(t.id)}
                    className="px-2.5 py-2 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Eliminar movimiento"
        message="¿Seguro que quieres eliminar este movimiento? Se actualizarán los totales de tu campo."
        confirmLabel="Sí, eliminar"
        danger
        onConfirm={remove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
