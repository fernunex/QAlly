import { CumplimientoIcon, EstadoActividadIcon, cumplimientoEtiqueta } from "@/components/status/status-badges";
import { ESTADOS_ACTIVIDAD, type ConteoEstados, type EstadoCumplimiento } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { ESTADOS_CUMPLIMIENTO } from "@/features/health/lib";

function Tile({
  icono,
  etiqueta,
  valor,
  compacto,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: number;
  compacto?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border bg-card", compacto ? "px-2.5 py-2" : "px-3 py-3")}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icono}
        <span className="truncate">{etiqueta}</span>
      </div>
      <p
        className={cn(
          "mt-1 font-semibold tabular-nums whitespace-nowrap",
          compacto ? "text-lg leading-6" : "text-2xl leading-8",
        )}
      >
        {valor}
      </p>
    </div>
  );
}

/** 4 tiles neutros (icono de color + texto) con el conteo de actividades SQA por estado. */
export function ConteoEstadosTiles({
  conteos,
  compacto,
  className,
}: {
  conteos: ConteoEstados;
  compacto?: boolean;
  className?: string;
}) {
  if (compacto) {
    // Variante para tarjetas angostas (salud por etapa): filas etiqueta–conteo, sin truncar.
    return (
      <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5", className)}>
        {ESTADOS_ACTIVIDAD.map((e) => (
          <li key={e} className="flex min-w-0 items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <EstadoActividadIcon estado={e} className="size-3.5" />
              <span className="truncate">{e}</span>
            </span>
            <span className="font-semibold tabular-nums">{conteos[e]}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {ESTADOS_ACTIVIDAD.map((e) => (
        <li key={e} className="min-w-0">
          <Tile
            icono={<EstadoActividadIcon estado={e} className="size-3.5" />}
            etiqueta={e}
            valor={conteos[e]}
          />
        </li>
      ))}
    </ul>
  );
}

/** 4 tiles neutros con el cumplimiento de métricas. No es salud. */
export function CumplimientoTiles({
  conteos,
  className,
}: {
  conteos: Record<EstadoCumplimiento, number>;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {ESTADOS_CUMPLIMIENTO.map((e) => (
        <li key={e} className="min-w-0">
          <Tile
            icono={<CumplimientoIcon estado={e} className="size-3.5" />}
            etiqueta={cumplimientoEtiqueta(e)}
            valor={conteos[e]}
          />
        </li>
      ))}
    </ul>
  );
}

export function totalActividades(conteos: ConteoEstados) {
  return ESTADOS_ACTIVIDAD.reduce((s, e) => s + conteos[e], 0);
}
