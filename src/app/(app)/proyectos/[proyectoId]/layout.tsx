import { Suspense } from "react";
import Link from "next/link";
import { FileTextIcon, LockIcon } from "lucide-react";
import { PageContainer } from "@/components/shell/page-header";
import { SaludBadge } from "@/components/status/status-badges";
import { EstadoCargando } from "@/components/states/ui-states";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProyectoAcciones } from "@/features/projects/components/proyecto-acciones";
import { ProyectoTabs } from "@/features/projects/components/proyecto-tabs";
import { formatRango } from "@/lib/format";
import { obtenerContextoProyecto } from "@/lib/project-context";

async function EncabezadoProyecto({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const { proyecto, esQA, cerrado } = await obtenerContextoProyecto(proyectoId);
  // Sin acceso: la página hija muestra el estado NO_DISPONIBLE; aquí no se revela nada.
  if (!proyecto) return null;

  return (
    <div className="border-b bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-7">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/proyectos">Proyectos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[16rem] truncate">{proyecto.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{proyecto.nombre}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <SaludBadge prefijo="Salud general" />
              {cerrado ? (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-md border bg-muted px-2 text-xs font-medium">
                  <LockIcon className="size-3.5" aria-hidden />
                  Cerrado · solo lectura
                </span>
              ) : null}
              <span>
                {proyecto.periodoAcademico ? `${proyecto.periodoAcademico} · ` : null}
                {formatRango(proyecto.fechaInicio, proyecto.fechaFinPrevista)}
              </span>
            </div>
          </div>
          {esQA ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/proyectos/${proyecto.id}/reportes`}>
                  <FileTextIcon />
                  Generar reporte
                </Link>
              </Button>
              <ProyectoAcciones proyecto={proyecto} />
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <ProyectoTabs proyectoId={proyecto.id} mostrarReportes={esQA} />
        </div>
      </div>
    </div>
  );
}

function EncabezadoCargando() {
  return (
    <div className="border-b">
      <div className="mx-auto w-full max-w-7xl space-y-3 px-4 pt-5 pb-4 sm:px-6 lg:px-10 lg:pt-7">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="mt-4 h-8 w-80 max-w-full" />
      </div>
    </div>
  );
}

export default function ProyectoLayout({ children, params }: LayoutProps<"/proyectos/[proyectoId]">) {
  return (
    <>
      <Suspense fallback={<EncabezadoCargando />}>
        <EncabezadoProyecto params={params} />
      </Suspense>
      <Suspense
        fallback={
          <PageContainer>
            <EstadoCargando />
          </PageContainer>
        }
      >
        {children}
      </Suspense>
    </>
  );
}
