import { cn } from "@/lib/utils";

/** Encabezado de página: título, descripción y acciones; apila en móvil. */
export function PageHeader({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{titulo}</h1>
        {descripcion ? <p className="text-sm text-muted-foreground sm:text-base">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div> : null}
    </div>
  );
}

/** Contenedor de página con gutter responsivo y ancho máximo legible. */
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8", className)}>{children}</div>
  );
}

/** Título de sección dentro de una página. */
export function SectionTitle({
  children,
  accion,
  className,
}: {
  children: React.ReactNode;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <h2 className="text-base font-semibold">{children}</h2>
      {accion}
    </div>
  );
}
