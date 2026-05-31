import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🌱</div>
        <h1 className="text-3xl font-bold text-green-800">AgroSmart</h1>
        <p className="text-gray-600">
          Gestión de cosechas inteligentes para productores agrícolas de Chile.
          Datos climáticos en tiempo real, recomendaciones de siembra y cosecha,
          y recordatorios de tareas.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium text-center hover:bg-green-700 transition-colors min-h-[44px]"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-4 border-2 border-green-600 text-green-700 rounded-lg font-medium text-center hover:bg-green-50 transition-colors min-h-[44px]"
          >
            Crear Cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
