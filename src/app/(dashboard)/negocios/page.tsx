import Link from "next/link";
import { BookText, Wallet, ArrowRight } from "lucide-react";

export const metadata = { title: "Negocios · Agrencia" };

export default function NegociosPage() {
  const cards = [
    {
      href: "/negocios/bitacora",
      title: "Cuaderno de campo",
      icon: BookText,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      desc: "Registra cada labor que haces en tus parcelas: siembras, cosechas, riegos, podas, aplicaciones y observaciones.",
      bullets: [
        "Lleva un historial ordenado por fecha y parcela.",
        "Útil para trazabilidad y certificaciones.",
        "Asocia cada registro a una parcela y, si quieres, a un cultivo.",
      ],
    },
    {
      href: "/negocios/finanzas",
      title: "Finanzas",
      icon: Wallet,
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      desc: "Anota tus gastos e ingresos por cultivo y revisa la rentabilidad de cada parcela y de todo tu campo.",
      bullets: [
        "Calcula el balance por cultivo, por parcela y total general.",
        "Clasifica cada movimiento como ingreso o gasto.",
        "Toma mejores decisiones sobre qué cultivar.",
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Negocios</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gestiona la información productiva y económica de tu campo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {cards.map(({ href, title, icon: Icon, color, bg, border, desc, bullets }) => (
          <Link key={href} href={href}
            className={`group bg-white rounded-2xl border-2 ${border} p-6 flex flex-col card-hover transition-all animate-fade-in-up`}>
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon size={24} className={color} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-600 mb-4">{desc}</p>
            <ul className="space-y-2 flex-1 mb-5">
              {bullets.map((b) => (
                <li key={b} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color.replace("text", "bg")} flex-shrink-0`} />
                  {b}
                </li>
              ))}
            </ul>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${color}`}>
              Abrir <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
