"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, Bell, CalendarCheck, Settings, LogOut, Menu, X
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parcelas", label: "Parcelas", icon: Map },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/recordatorios", label: "Recordatorios", icon: CalendarCheck },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <Image
        src="/assets/logo_principal.png"
        alt="AgroInteligencia"
        fill
        className="object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Header mobile */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold text-green-800">AgroInteligencia</span>
        </Link>
        <button onClick={() => setOpen(!open)}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Menú">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <nav className="absolute top-[57px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 min-h-[44px] border-b border-gray-100 ${
                  pathname.startsWith(href) ? "bg-green-50 text-green-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            <button onClick={logout}
              className="flex items-center gap-3 px-4 py-3 min-h-[44px] w-full text-left text-red-600 hover:bg-red-50">
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-bold text-green-800 text-lg">AgroInteligencia</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] ${
                pathname.startsWith(href) ? "bg-green-50 text-green-700 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] w-full text-left text-red-600 hover:bg-red-50">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
