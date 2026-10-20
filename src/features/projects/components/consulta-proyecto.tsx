import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaludBadge } from "@/components/status/status-badges";
import { nombreEtapa } from "@/lib/catalogs";
import { ROL_ETIQUETA, type EtapaCodigo } from "@/lib/domain";
import { formatRango } from "@/lib/format";
import type {
  ProyectoListado,
  listarActividadesIniciales,
  listarMetricasIniciales,
} from "../server/queries";

type Actividades = Awaited<ReturnType<typeof listarActividadesIniciales>>;
type Metricas = Awaited<ReturnType<typeof listarMetricasIniciales>>;
function etapa(codigo: string) {
  return nombreEtapa(
    (codigo === "requerimientos" ? "requisitos" : codigo) as EtapaCodigo,
  );
}

export function DatosProyecto({ proyecto: p }: { proyecto: ProyectoListado }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 break-words">
            <div>
              <dt className="text-sm text-muted-foreground">Descripción</dt>
              <dd className="whitespace-pre-wrap">{p.descripcion}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Periodo académico
              </dt>
              <dd>{p.periodoAcademico || "No indicado"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Fechas</dt>
              <dd>{formatRango(p.fechaInicio, p.fechaFinPrevista)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Actividades SQA</dt>
              <dd>
                {p.aprobadas} de {p.totalActividades} Aprobadas
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-sm text-muted-foreground">
                Salud general y por etapa
              </dt>
              <dd>
                <SaludBadge />
                <p className="mt-1 text-xs text-muted-foreground">
                  Algoritmo pendiente de aprobación.
                </p>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Participantes ({p.participantes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {p.participantes.map((m) => (
              <li
                key={m.usuarioId}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>{m.nombre}</span>
                <Badge variant="secondary">{ROL_ETIQUETA[m.rol]}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function ActividadesConfiguradas({
  pagina,
  proyecto,
  base,
  cursor,
}: {
  pagina: Actividades;
  proyecto: ProyectoListado;
  base: string;
  cursor?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Actividades SQA configuradas ({proyecto.totalActividades})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!pagina.items.length ? (
          <p className="text-sm text-muted-foreground">
            No hay actividades iniciales seleccionadas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagina.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium">
                      {a.tipo.codigo} · {a.tipo.nombre}
                    </p>
                    <p className="max-w-xl whitespace-pre-wrap text-xs text-muted-foreground">
                      {a.descripcion}
                    </p>
                  </TableCell>
                  <TableCell>{etapa(a.tipo.etapa_codigo)}</TableCell>
                  <TableCell>
                    {proyecto.participantes.find(
                      (p) => p.usuarioId === a.responsable_id,
                    )?.nombre ?? "Sin asignar"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <nav aria-label="Paginación de actividades" className="mt-4 flex gap-3">
          {cursor ? (
            <Button variant="outline" asChild>
              <Link href={base}>Volver al inicio de actividades</Link>
            </Button>
          ) : null}
          {pagina.siguienteCursor ? (
            <Button variant="outline" asChild>
              <Link
                href={`${base}?cursor=${encodeURIComponent(pagina.siguienteCursor)}`}
              >
                Siguientes actividades
              </Link>
            </Button>
          ) : null}
        </nav>
      </CardContent>
    </Card>
  );
}

export function MetricasConfiguradas({ metricas }: { metricas: Metricas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas configuradas ({metricas.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {!metricas.length ? (
          <p className="text-sm text-muted-foreground">
            No hay métricas iniciales seleccionadas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Objetivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.tipo.codigo} · {m.tipo.nombre}
                  </TableCell>
                  <TableCell>{etapa(m.tipo.etapa_codigo)}</TableCell>
                  <TableCell>
                    {m.operador === ">=" ? "≥" : "≤"} {Number(m.objetivo)}{" "}
                    {m.tipo.unidad}
                    {m.objetivo_critico !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Pruebas críticas ≥ {Number(m.objetivo_critico)} %
                      </p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
