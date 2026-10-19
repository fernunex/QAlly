import {
  CheckIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  ContrastIcon,
  InfoIcon,
  MinusIcon,
  Undo2Icon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecisionRevision, EstadoActividad, EstadoCumplimiento } from "@/lib/domain";

/*
 * Regla del design system: el color nunca va solo; cada estado lleva icono y texto.
 * No existen colores de salud (semáforo) porque la clasificación está pendiente.
 */

const base =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5";

type Def = { icon: LucideIcon; label: string; className: string };

export const ESTADO_ACTIVIDAD_DEF: Record<EstadoActividad, Def> = {
  Pendiente: {
    icon: CircleDashedIcon,
    label: "Pendiente",
    className: "border-border bg-muted text-muted-foreground",
  },
  "En progreso": {
    icon: ContrastIcon,
    label: "En progreso",
    className: "border-progress/25 bg-progress/10 text-progress",
  },
  "En revisión": {
    icon: CircleDotIcon,
    label: "En revisión",
    className: "border-review/25 bg-review/10 text-review",
  },
  Aprobada: {
    icon: CircleCheckIcon,
    label: "Aprobada",
    className: "border-success/25 bg-success/10 text-success",
  },
};

export function EstadoActividadIcon({ estado, className }: { estado: EstadoActividad; className?: string }) {
  const { icon: Icon, className: tone } = ESTADO_ACTIVIDAD_DEF[estado];
  // Solo el color del texto; sin fondo.
  const color = tone.split(" ").find((c) => c.startsWith("text-"));
  return <Icon aria-hidden className={cn("size-4 shrink-0", color, className)} />;
}

export function EstadoActividadBadge({ estado, className }: { estado: EstadoActividad; className?: string }) {
  const { icon: Icon, label, className: tone } = ESTADO_ACTIVIDAD_DEF[estado];
  return (
    <span className={cn(base, tone, className)}>
      <Icon aria-hidden />
      {label}
    </span>
  );
}

const CUMPLIMIENTO_DEF: Record<EstadoCumplimiento, Def> = {
  Cumple: { icon: CheckIcon, label: "Cumple", className: "border-success/25 bg-success/10 text-success" },
  Incumple: {
    icon: XIcon,
    label: "No cumple",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  "No evaluable": {
    icon: MinusIcon,
    label: "No evaluable",
    className: "border-border bg-muted text-muted-foreground",
  },
  "Sin medición": {
    icon: CircleDashedIcon,
    label: "Sin medición",
    className: "border-dashed border-border text-muted-foreground",
  },
};

export function CumplimientoIcon({ estado, className }: { estado: EstadoCumplimiento; className?: string }) {
  const { icon: Icon, className: tone } = CUMPLIMIENTO_DEF[estado];
  const color = tone.split(" ").find((c) => c.startsWith("text-"));
  return <Icon aria-hidden className={cn("size-4 shrink-0", color, className)} />;
}

/** Cumplimiento de una métrica contra su objetivo. No es salud. */
export function CumplimientoBadge({ estado, className }: { estado: EstadoCumplimiento; className?: string }) {
  const { icon: Icon, label, className: tone } = CUMPLIMIENTO_DEF[estado];
  return (
    <span className={cn(base, tone, className)}>
      <Icon aria-hidden />
      {label}
    </span>
  );
}

export function cumplimientoEtiqueta(estado: EstadoCumplimiento) {
  return CUMPLIMIENTO_DEF[estado].label;
}

/** Salud general o por etapa. Algoritmo pendiente: siempre «Sin evaluar», sin puntaje. */
export function SaludBadge({ prefijo, className }: { prefijo?: string; className?: string }) {
  return (
    <span
      className={cn(base, "border-dashed border-border text-muted-foreground", className)}
      title="El algoritmo y la clasificación de salud están pendientes de aprobación."
    >
      <InfoIcon aria-hidden />
      {prefijo ? `${prefijo}: Sin evaluar` : "Sin evaluar"}
    </span>
  );
}

/** Decisión de QA sobre un intento de entrega. */
export function DecisionBadge({
  decision,
  className,
}: {
  decision: DecisionRevision | null;
  className?: string;
}) {
  if (decision === null) {
    return (
      <span className={cn(base, "border-review/25 bg-review/10 text-review", className)}>
        <CircleDotIcon aria-hidden />
        Sin decisión de QA
      </span>
    );
  }
  if (decision === "Devolver") {
    return (
      <span className={cn(base, "border-destructive/25 bg-destructive/10 text-destructive", className)}>
        <Undo2Icon aria-hidden />
        Devuelto con observaciones
      </span>
    );
  }
  return (
    <span className={cn(base, "border-success/25 bg-success/10 text-success", className)}>
      <CheckIcon aria-hidden />
      Aprobado
    </span>
  );
}
