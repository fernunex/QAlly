"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Navegación por secciones del proyecto. Desplazable en móvil, sin scroll de página. */
export function ProyectoTabs({ proyectoId, mostrarReportes }: { proyectoId: string; mostrarReportes: boolean }) {
  const pathname = usePathname();
  const base = `/proyectos/${proyectoId}`;
  const tabs = [
    { href: base, label: "Salud" },
    { href: `${base}/metricas`, label: "Métricas" },
    { href: `${base}/actividades`, label: "Actividades SQA" },
    ...(mostrarReportes ? [{ href: `${base}/reportes`, label: "Reportes" }] : []),
  ];

  return (
    <nav aria-label="Secciones del proyecto" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((tab) => {
        const activo = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
