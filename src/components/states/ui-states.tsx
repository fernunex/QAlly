import Link from "next/link";
import { AlertCircleIcon, LockIcon, RefreshCwIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Estados de UI que contempla cada pantalla (design system §10):
 * vacío, cargando, error con reintentar, sin acceso, operación no permitida,
 * error al guardar y conflicto de concurrencia.
 */

export function EstadoVacio({
  icon: Icon,
  titulo,
  descripcion,
  children,
  className,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("border bg-card", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}

export function EstadoCargando({ etiqueta = "Cargando información…" }: { etiqueta?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 py-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="mt-2 h-64" />
      <span className="sr-only">{etiqueta}</span>
    </div>
  );
}

/** Error de carga o de guardado. Fondo apenas teñido, no bloque rojo saturado. */
export function EstadoError({
  titulo = "No pudimos cargar la información",
  descripcion = "Revisa tu conexión e inténtalo de nuevo.",
  accion,
  className,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty role="alert" className={cn("border border-destructive/30 bg-destructive/5", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertCircleIcon />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      {accion ? <EmptyContent>{accion}</EmptyContent> : null}
    </Empty>
  );
}

/** NO_DISPONIBLE: inexistente o sin acceso se tratan igual, sin revelar información. */
export function EstadoNoDisponible() {
  return (
    <EstadoVacio
      icon={LockIcon}
      titulo="Este proyecto no está disponible"
      descripcion="No tienes acceso o ya no existe. No se muestra información del proyecto."
    >
      <Button variant="outline" asChild>
        <Link href="/proyectos">Volver al listado</Link>
      </Button>
    </EstadoVacio>
  );
}

export function EstadoConflicto({ onRecargar }: { onRecargar?: () => void }) {
  return (
    <EstadoVacio
      icon={RefreshCwIcon}
      titulo="Otro usuario cambió este registro"
      descripcion="Estás viendo una versión desactualizada. Recarga para ver los cambios y vuelve a intentarlo."
    >
      <Button variant="outline" onClick={onRecargar}>
        Recargar
      </Button>
    </EstadoVacio>
  );
}

/** Aviso de proyecto cerrado: toda escritura de negocio está bloqueada. */
export function AvisoSoloLectura({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-muted/60 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold text-foreground">Proyecto cerrado · solo lectura.</span> Puedes consultar
        información, evidencias, salud y reportes; no se puede modificar nada.
      </p>
    </div>
  );
}

/** Nota neutral para lo que depende de una decisión pendiente (p. ej. algoritmo de salud). */
export function NotaPendiente({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "rounded-md border border-dashed px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
