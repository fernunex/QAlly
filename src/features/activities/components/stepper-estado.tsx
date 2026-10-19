import { cn } from "@/lib/utils";
import { ESTADOS_ACTIVIDAD, type EstadoActividad } from "@/lib/domain";
import { ESTADO_ACTIVIDAD_DEF } from "@/components/status/status-badges";

/** Avance de la actividad: Pendiente → En progreso → En revisión → Aprobada. */
export function StepperEstado({ estado, className }: { estado: EstadoActividad; className?: string }) {
  const actual = ESTADOS_ACTIVIDAD.indexOf(estado);
  return (
    <ol aria-label="Avance de la actividad" className={cn("grid grid-cols-4 gap-2", className)}>
      {ESTADOS_ACTIVIDAD.map((e, i) => {
        const hecho = i < actual || (estado === "Aprobada" && i === actual);
        const esActual = i === actual;
        const tono = ESTADO_ACTIVIDAD_DEF[e].className.split(" ").find((c) => c.startsWith("text-"));
        return (
          <li key={e} aria-current={esActual ? "step" : undefined} className="min-w-0 space-y-1.5">
            <span
              aria-hidden
              className={cn(
                "block h-1 rounded-full",
                esActual || hecho ? "bg-current" : "bg-muted",
                esActual ? tono : hecho ? "text-foreground/40" : "",
              )}
            />
            <span
              className={cn(
                "block truncate text-xs",
                esActual ? cn("font-semibold", tono) : "text-muted-foreground",
              )}
            >
              {e}
              <span className="sr-only">{esActual ? " (estado actual)" : hecho ? " (completado)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
