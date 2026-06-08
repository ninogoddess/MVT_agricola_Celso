"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CloudSun, Wheat, CalendarCheck, Mail, TriangleAlert,
  CloudRain, Thermometer, Wind, CheckCircle, ArrowRight,
  Clock, MapPin, Bell, Sprout
} from "lucide-react";

// ─── Feature data ────────────────────────────────────────
const features = [
  {
    icon: CloudSun,
    title: "Clima en tiempo real",
    desc: "Temperatura, humedad, viento y probabilidad de lluvia actualizados diariamente para cada parcela.",
  },
  {
    icon: Wheat,
    title: "Recomendaciones de siembra y cosecha",
    desc: "Ventanas óptimas calculadas para el hemisferio sur según el clima actual y los parámetros de cada cultivo.",
  },
  {
    icon: CalendarCheck,
    title: "Recordatorios automáticos",
    desc: "Riego, poda y fertilización sugeridos automáticamente según el estado del suelo y el ciclo productivo.",
  },
];

// ─── Pain points ─────────────────────────────────────────
const pains = [
  { icon: CloudRain, text: "¿Cuándo llueve esta semana en tu parcela?" },
  { icon: Thermometer, text: "¿Hace frío suficiente para sembrar el cultivo?" },
  { icon: Wind, text: "¿Debería regar hoy o esperar la lluvia?" },
  { icon: Clock, text: "¿Cuándo debo fertilizar para maximizar el rendimiento?" },
];

// ─── How it works ─────────────────────────────────────────
const steps = [
  { icon: MapPin, title: "Registra tus parcelas", desc: "Detectamos tu ubicación automáticamente y comenzamos a monitorear el clima." },
  { icon: Sprout, title: "Agrega tus cultivos", desc: "Selecciona especie y variedad. Te sugerimos la fecha óptima de siembra." },
  { icon: Bell, title: "Recibe alertas y recordatorios", desc: "El sistema te avisa cuándo regar, podar, fertilizar o cosechar." },
  { icon: CheckCircle, title: "Toma decisiones con datos", desc: "Clima actual, historial de suelo y recomendaciones agronómicas en tu celular." },
];

export default function Home() {
  const router = useRouter();
  const [authPanel, setAuthPanel] = useState<"login" | "register" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales inválidas"); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fields ? data.fields.map((f: { message: string }) => f.message).join(", ") : data.error);
        return;
      }
      setRegisterSuccess(true);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  function openPanel(mode: "login" | "register") {
    setError(""); setEmail(""); setPassword(""); setTenantName("");
    setRegisterSuccess(false); setAuthPanel(mode);
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-green-100">
              <Image src="/assets/logo_principal.png" alt="" fill className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <span className="font-bold text-green-800 text-lg tracking-tight">AgroInteligencia</span>
          </div>
          <button onClick={() => openPanel("login")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm min-h-[40px] shadow-sm">
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-600 text-white pt-28 pb-20 px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Plataforma agrícola inteligente
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Cultiva con inteligencia,<br />cosecha con certeza
            </h1>
            <p className="text-green-100 text-lg leading-relaxed max-w-xl">
              Deja de adivinar cuándo regar, sembrar o cosechar. AgroInteligencia centraliza el clima,
              el estado de tu suelo y los ciclos de tus cultivos para que tomes decisiones basadas en datos,
              no en intuición.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={() => openPanel("register")}
                className="px-7 py-3.5 bg-white text-green-800 rounded-xl font-bold text-base hover:bg-green-50 min-h-[48px] shadow-lg flex items-center justify-center gap-2">
                Comenzar Gratis <ArrowRight size={18} />
              </button>
              <button onClick={() => openPanel("login")}
                className="px-7 py-3.5 bg-white/10 border border-white/25 text-white rounded-xl font-semibold text-base hover:bg-white/20 min-h-[48px]">
                Ya tengo cuenta
              </button>
            </div>
          </div>

          {/* Feature cards right */}
          <div className="space-y-3 animate-fade-in-up-2">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex gap-4 hover:bg-white/15 transition-colors">
                <div className="bg-white/20 rounded-xl p-2.5 flex-shrink-0 h-fit">
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">{title}</h3>
                  <p className="text-green-100 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL DOLOR ── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            El agricultor moderno no debería perderse en incertidumbre
          </h2>
          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
            Cada temporada, los productores enfrentan las mismas preguntas sin respuesta rápida.
            Eso cuesta tiempo, cosechas y dinero.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pains.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 card-hover shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-red-400" />
                </div>
                <p className="text-gray-700 font-medium text-left">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-green-700 font-semibold text-lg">
            AgroInteligencia responde todas esas preguntas automáticamente.
          </p>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tres minutos para empezar</h2>
            <p className="text-gray-500 text-lg">Sin configuraciones complejas. Sin papeles. Sin adivinar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Icon size={20} className="text-green-700" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full px-2 py-0.5">Paso {i + 1}</span>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-5 bg-green-900 text-white text-center">
        <div className="max-w-2xl mx-auto animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tu campo merece decisiones inteligentes
          </h2>
          <p className="text-green-200 text-lg mb-8">
            Gratis para empezar. Sin tarjeta de crédito. Sin letra chica.
          </p>
          <button onClick={() => openPanel("register")}
            className="px-8 py-4 bg-white text-green-800 rounded-xl font-bold text-lg hover:bg-green-50 min-h-[52px] shadow-xl inline-flex items-center gap-2">
            Crear cuenta gratis <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── AUTH PANEL ── */}
      {authPanel && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={() => setAuthPanel(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="relative w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {authPanel === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </h2>
              <button onClick={() => setAuthPanel(null)}
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">
                ✕
              </button>
            </div>

            <div className="p-6 flex-1">
              {registerSuccess ? (
                <div className="space-y-4 text-center animate-scale-in">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={28} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">¡Revisa tu correo!</h3>
                  <p className="text-gray-600 text-sm">Enviamos un enlace a <strong>{email}</strong>.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                    <TriangleAlert size={15} className="flex-shrink-0 mt-0.5" />
                    Revisa también la carpeta de spam.
                  </div>
                  <button onClick={() => openPanel("login")} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 min-h-[44px]">
                    Ir a Iniciar Sesión
                  </button>
                </div>
              ) : authPanel === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up">
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                      placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                      placeholder="••••••" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 min-h-[48px]">
                    {loading ? "Ingresando..." : "Ingresar"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Sin cuenta?{" "}
                    <button type="button" onClick={() => openPanel("register")} className="text-green-600 font-semibold hover:underline">Regístrate gratis</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 animate-fade-in-up">
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu campo / organización</label>
                    <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                      placeholder="Ej: Fundo Los Aromos" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                      placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (mín. 6 caracteres)</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                      placeholder="••••••" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 min-h-[48px]">
                    {loading ? "Creando cuenta..." : "Crear Cuenta Gratis"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => openPanel("login")} className="text-green-600 font-semibold hover:underline">Inicia sesión</button>
                  </p>
                </form>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
