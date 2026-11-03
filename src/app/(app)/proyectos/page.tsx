import Link from "next/link";
import type { Metadata } from "next";
import { FolderIcon, LockIcon, PlusIcon, UsersIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { SaludBadge } from "@/components/status/status-badges";
import { EstadoVacio } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProyectoAcciones } from "@/features/projects/components/proyecto-acciones";
import { formatRango } from "@/lib/format";
import { listarProyectos } from "@/features/projects/server/queries";
import { consultarSaludProyectos } from "@/features/health/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export const metadata: Metadata = { title: "Proyectos" };

function CerradoBadge() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
      <LockIcon className="size-3" aria-hidden />
      Cerrado · solo lectura
    </span>
  );
}

/** CU-01 — Listado de proyectos autorizados. Punto de entrada de CU-05. */
export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  const esQA = usuario.rol === "QA";
  const { cursor } = await searchParams;
  const pagina = await listarProyectos({ cursor });
  const proyectos = pagina.items;
  const salud = await consultarSaludProyectos(proyectos.map((p) => p.id));

  return (
    <PageContainer>
      <PageHeader
        titulo="Proyectos"
        descripcion="Proyectos en los que participas, abiertos y cerrados"
        acciones={
          esQA ? (
            <Button size="lg" asChild>
              <Link href="/proyectos/nuevo">
                <PlusIcon />
                Nuevo proyecto
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="mt-6">
        {proyectos.length === 0 ? (
          <EstadoVacio
            icon={FolderIcon}
            titulo={
              esQA
                ? "Aún no tienes proyectos"
                : "Aún no participas en proyectos"
            }
            descripcion={
              esQA
                ? "Registra un proyecto para seleccionar actividades SQA y métricas."
                : "Cuando QA te agregue a un proyecto, aparecerá aquí."
            }
          >
            {esQA ? (
              <Button asChild>
                <Link href="/proyectos/nuevo">
                  <PlusIcon />
                  Nuevo proyecto
                </Link>
              </Button>
            ) : null}
          </EstadoVacio>
        ) : (
          <>
            {/* Escritorio y tableta: tabla */}
            <Card className="hidden gap-0 overflow-hidden py-0 md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Proyecto</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Periodo académico
                    </TableHead>
                    <TableHead>Inicio – fin</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">
                      Participantes
                    </TableHead>
                    <TableHead>Actividades SQA</TableHead>
                    <TableHead>Salud general</TableHead>
                    {esQA ? (
                      <TableHead className="w-12 pr-4">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proyectos.map((p) => {
                    const { aprobadas, total } = {
                      aprobadas: p.aprobadas,
                      total: p.totalActividades,
                    };
                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell className="py-3 pl-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/proyectos/${p.id}`}
                              className="font-semibold underline-offset-4 outline-none group-hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {p.nombre}
                            </Link>
                            {p.cerradoEn ? <CerradoBadge /> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {p.descripcion}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {p.periodoAcademico ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatRango(p.fechaInicio, p.fechaFinPrevista)}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums lg:table-cell">
                          {p.participantes.length}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium tabular-nums">
                            {aprobadas}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            de {total} Aprobadas
                          </span>
                        </TableCell>
                        <TableCell>
                          <SaludBadge salud={salud[p.id] ?? null} />
                        </TableCell>
                        {esQA ? (
                          <TableCell className="pr-4 text-right">
                            <ProyectoAcciones proyecto={p} mostrarAbrir />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Móvil: tarjetas */}
            <ul className="grid gap-3 md:hidden">
              {proyectos.map((p) => {
                const { aprobadas, total } = {
                  aprobadas: p.aprobadas,
                  total: p.totalActividades,
                };
                return (
                  <li key={p.id}>
                    <Card className="relative gap-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/proyectos/${p.id}`}
                            className="font-semibold after:absolute after:inset-0 after:content-['']"
                          >
                            {p.nombre}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {p.descripcion}
                          </p>
                        </div>
                        {esQA ? (
                          <div className="relative z-10 -mt-1 -mr-2">
                            <ProyectoAcciones proyecto={p} mostrarAbrir />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SaludBadge salud={salud[p.id] ?? null} />
                        {p.cerradoEn ? <CerradoBadge /> : null}
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <dt className="text-muted-foreground">Periodo</dt>
                        <dd className="text-right">
                          {p.periodoAcademico ?? "—"}
                        </dd>
                        <dt className="text-muted-foreground">Fechas</dt>
                        <dd className="text-right">
                          {formatRango(p.fechaInicio, p.fechaFinPrevista)}
                        </dd>
                        <dt className="text-muted-foreground">
                          Actividades SQA
                        </dt>
                        <dd className="text-right tabular-nums">
                          {aprobadas} de {total} Aprobadas
                        </dd>
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <UsersIcon className="size-3.5" aria-hidden />{" "}
                          Participantes
                        </dt>
                        <dd className="text-right tabular-nums">
                          {p.participantes.length}
                        </dd>
                      </dl>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      <nav aria-label="Paginación de proyectos" className="mt-5 flex gap-3">
        {cursor ? (
          <Button variant="outline" asChild>
            <Link href="/proyectos">Volver al inicio</Link>
          </Button>
        ) : null}
        {pagina.siguienteCursor ? (
          <Button variant="outline" asChild>
            <Link
              href={`/proyectos?cursor=${encodeURIComponent(pagina.siguienteCursor)}`}
            >
              Siguiente página
            </Link>
          </Button>
        ) : null}
      </nav>
    </PageContainer>
  );
}
