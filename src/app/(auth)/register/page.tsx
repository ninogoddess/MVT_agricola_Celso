"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fields ? data.fields.map((f: { message: string }) => f.message).join(", ") : data.error || "Error al crear cuenta");
        return;
      }
      setSuccess(true);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-sm w-full text-center space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail size={28} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Revisa tu correo</h2>
          <p className="text-gray-600 text-sm">Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Haz click en él para activar tu cuenta.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            No podrás iniciar sesión hasta confirmar tu email. Revisa también spam.
          </div>
          <Link href="/login" className="block w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <Image src="/assets/logo_principal.png" alt="Agrencia" fill className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <h1 className="text-2xl font-bold text-green-800">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Registra tu organización agrícola en Agrencia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu campo / organización</label>
            <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Ej: Fundo Los Aromos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (mín. 6 caracteres)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 min-h-[44px]">
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
