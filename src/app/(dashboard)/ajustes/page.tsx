"use client";

import { useState } from "react";

export default function AjustesPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount() {
    if (deleteInput !== "ELIMINAR") {
      setError('Escribe "ELIMINAR" para confirmar');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const d = await res.json();
        setError(d.error || "Error al eliminar la cuenta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ajustes de Cuenta</h1>

      {/* Sección eliminar cuenta */}
      <div className="bg-white rounded-lg border border-red-200 p-5">
        <h2 className="font-semibold text-red-700 mb-2">⚠️ Zona de Peligro</h2>
        <p className="text-sm text-gray-600 mb-4">
          Eliminar tu cuenta borrará de forma permanente todos tus datos: parcelas, cultivos, registros de suelo,
          datos climáticos, alertas y recordatorios. Esta acción <strong>no se puede deshacer</strong>.
          Tu correo quedará libre para registrarse nuevamente.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 min-h-[44px]"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Escribe <span className="font-mono bg-gray-100 px-1 rounded">ELIMINAR</span> para confirmar:
            </p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2.5 border border-red-300 rounded-lg outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setError(""); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
              >
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
