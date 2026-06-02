"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CloudSun, Wheat, CalendarCheck, Mail, TriangleAlert } from "lucide-react";

const features = [
  {
    icon: CloudSun,
    title: "Clima en tiempo real",
    desc: "Temperatura, humedad, viento y probabilidad de lluvia actualizados diariamente para cada parcela.",
  },
  {
    icon: Wheat,
    title: "Recomendaciones agrícolas",
    desc: "Ventanas óptimas de siembra y cosecha calculadas según el clima actual y los ciclos del hemisferio sur.",
  },
  {
    icon: CalendarCheck,
    title: "Recordatorios de tareas",
    desc: "Riego, poda y fertilización sugeridos automáticamente según el estado de tu cultivo y el suelo.",
  },
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
    <div className="min-h-dvh bg-gradient-to-br from-green-900 via-green-800 to-green-600 text-white relative overflow-hidden">

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            <Image src="/assets/logo_principal.png" alt="AgroInteligencia" fill className="object-contain p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className="font-bold text-xl tracking-tight">AgroInteligencia</span>
        </div>
        <button onClick={() => openPanel("login")}
          className="px-5 py-2.5 bg-white text-green-800 rounded-lg font-semibold hover:bg-green-50 transition-colors min-h-[44px] shadow-lg">
          Iniciar Sesión
        </button>
      </header>

      {/* Main: two-column layout on desktop */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Hero */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Cultiva con inteligencia,<br />cosecha con certeza
            </h1>
            <p className="text-green-100 text-lg leading-relaxed">
              AgroInteligencia es la plataforma digital para pequeños y medianos productores
              agrícolas de Chile. Conecta tus parcelas con datos climáticos en tiempo real,
              recibe recomendaciones precisas de siembra y cosecha, y nunca olvides una tarea importante.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => openPanel("register")}
                className="px-8 py-3.5 bg-white text-green-800 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors min-h-[44px] shadow-lg">
                Comenzar Gratis →
              </button>
              <button onClick={() => openPanel("login")}
                className="px-8 py-3.5 bg-white/10 border border-white/30 text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors min-h-[44px]">
                Ya tengo cuenta
              </button>
            </div>
          </div>

          {/* Right: Feature cards */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 flex gap-4 items-start hover:bg-white/15 transition-colors">
                <div className="bg-white/20 rounded-lg p-2.5 flex-shrink-0">
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-green-100 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Auth slide-in panel */}
      {authPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setAuthPanel(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="relative w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {authPanel === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </h2>
              <button onClick={() => setAuthPanel(null)}
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="p-6 flex-1">
              {registerSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={28} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">¡Revisa tu correo!</h3>
                  <p className="text-gray-600 text-sm">Hemos enviado un enlace de confirmación a <strong>{email}</strong>.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                    <TriangleAlert size={15} className="flex-shrink-0 mt-0.5" />
                    Revisa también la carpeta de spam.
                  </div>
                  <button onClick={() => openPanel("login")} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
                    Ir a Iniciar Sesión
                  </button>
                </div>
              ) : authPanel === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="••••••" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 min-h-[44px]">
                    {loading ? "Ingresando..." : "Ingresar"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Sin cuenta?{" "}
                    <button type="button" onClick={() => openPanel("register")} className="text-green-600 font-medium hover:underline">Regístrate</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu campo / organización</label>
                    <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Ej: Fundo Los Aromos" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (mín. 6 caracteres)</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="••••••" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 min-h-[44px]">
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => openPanel("login")} className="text-green-600 font-medium hover:underline">Inicia sesión</button>
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
