import {
  CheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  ThumbsUpIcon,
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
import type {
  ClasificacionSalud,
  DecisionRevision,
  EstadoActividad,
  EstadoCumplimiento,
  EstadoSalud,
} from "@/lib/domain";

/*
 * Regla del design system: el color nunca va solo; cada estado lleva icono y texto.
 * La salud usa la clasificación aprobada (DEC-27) con icono, porcentaje y nombre.
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

const SALUD_DEF: Record<ClasificacionSalud, Def> = {
  Excelente: { icon: CircleCheckIcon, label: "Excelente", className: "border-success/25 bg-success/10 text-success" },
  Bueno: { icon: ThumbsUpIcon, label: "Bueno", className: "border-progress/25 bg-progress/10 text-progress" },
  Regular: { icon: CircleAlertIcon, label: "Regular", className: "border-review/25 bg-review/10 text-review" },
  Malo: { icon: CircleXIcon, label: "Malo", className: "border-destructive/25 bg-destructive/10 text-destructive" },
};

/**
 * Salud general o por etapa: «68.57 % · Regular». «Sin evaluar» (borde discontinuo) solo cuando
 * el ámbito no tiene elementos o el dato no está disponible; 0 % con elementos sí es evaluación.
 */
export function SaludBadge({
  salud,
  prefijo,
  className,
}: {
  salud: EstadoSalud | null;
  prefijo?: string;
  className?: string;
}) {
  const p = prefijo ? `${prefijo}: ` : "";
  if (!salud || salud.estado === "Sin evaluar" || !salud.clasificacion)
    return (
      <span
        className={cn(base, "border-dashed border-border text-muted-foreground", className)}
        title="Sin actividades SQA ni métricas que evaluar."
      >
        <InfoIcon aria-hidden />
        {p}Sin evaluar
      </span>
    );
  const { icon: Icon, label, className: tone } = SALUD_DEF[salud.clasificacion];
  return (
    <span className={cn(base, tone, className)}>
      <Icon aria-hidden />
      {p}
      <span className="tabular-nums">{salud.porcentaje} %</span> · {label}
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
