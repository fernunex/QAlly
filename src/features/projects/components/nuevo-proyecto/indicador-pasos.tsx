"use client";

import { CheckIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PASOS, type PasoId } from "./estado";

/** Lista vertical (lg+). Solo se puede volver a pasos ya visitados. */
export function PasosLista({
  actual,
  maxVisto,
  resumenes,
  onIr,
}: {
  actual: PasoId;
  maxVisto: PasoId;
  resumenes: Record<PasoId, string>;
  onIr: (p: PasoId) => void;
}) {
  return (
    <nav aria-label="Pasos del registro" className="hidden lg:block">
      <ol className="flex flex-col gap-1">
        {PASOS.map((p) => {
          const hecho = p.id < actual;
          const activo = p.id === actual;
          const accesible = p.id <= maxVisto;
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={!accesible}
                aria-current={activo ? "step" : undefined}
                onClick={() => onIr(p.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  activo ? "bg-accent" : accesible && "hover:bg-accent/60",
                  !accesible && "cursor-default",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                    activo && "border-primary bg-primary text-primary-foreground",
                    hecho && "border-success bg-success text-success-foreground",
                    !activo && !hecho && "text-muted-foreground",
                  )}
                >
                  {hecho ? <CheckIcon className="size-3.5" /> : p.id}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", !accesible && "text-muted-foreground")}>
                    {p.titulo}
                  </span>
                  {accesible && p.id !== 4 ? (
                    <span className="block text-xs text-muted-foreground">{resumenes[p.id]}</span>
                  ) : null}
                  <span className="sr-only">
                    {hecho ? " (completado)" : activo ? " (paso actual)" : accesible ? "" : " (pendiente)"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Indicador compacto para móvil y tablet. */
export function PasosCompacto({ actual }: { actual: PasoId }) {
  const paso = PASOS[actual - 1]!;
  return (
    <div className="lg:hidden" role="group" aria-label="Progreso del registro">
      <p className="text-sm font-medium tabular-nums">
        Paso {actual} de {PASOS.length} <span className="text-muted-foreground">· {paso.corto}</span>
      </p>
      <Progress
        value={(actual / PASOS.length) * 100}
        className="mt-2"
        aria-label={`Paso ${actual} de ${PASOS.length}`}
      />
    </div>
  );
}
