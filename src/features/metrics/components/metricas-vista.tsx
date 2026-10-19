"use client";

import { useState } from "react";
import { GaugeIcon, PlusIcon } from "lucide-react";
import { SectionTitle } from "@/components/shell/page-header";
import { AvisoSoloLectura, EstadoVacio } from "@/components/states/ui-states";
import { CumplimientoBadge, CumplimientoIcon, cumplimientoEtiqueta } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIPOS_METRICA, nombreEtapa } from "@/lib/catalogs";
import type { EstadoCumplimiento, Medicion, MetricaVista } from "@/lib/domain";
import { AgregarMetricaDialog } from "@/features/metrics/components/agregar-metrica-dialog";
import { MedicionDialog } from "@/features/metrics/components/medicion-dialog";
import { MetricaDetalleSheet } from "@/features/metrics/components/metrica-detalle-sheet";
import { objetivoLineas, valorActualTexto } from "@/features/metrics/lib/formato";

const ORDEN: EstadoCumplimiento[] = ["Cumple", "Incumple", "No evaluable", "Sin medición"];

function Objetivo({ m }: { m: MetricaVista }) {
  return (
    <div className="space-y-0.5 tabular-nums">
      {objetivoLineas(m).map((l) => (
        <p key={l.texto + l.etiqueta} className="text-sm whitespace-nowrap">
          {l.etiqueta ? <span className="text-xs text-muted-foreground">{l.etiqueta} </span> : null}
          {l.texto}
        </p>
      ))}
    </div>
  );
}

function Valor({ m }: { m: MetricaVista }) {
  const sinValor = !m.medicionVigente || m.valorActual === null;
  return (
    <div className="tabular-nums">
      <p className={sinValor ? "text-sm whitespace-nowrap text-muted-foreground" : "text-sm font-bold whitespace-nowrap"}>
        {valorActualTexto(m)}
      </p>
      {m.valorCritico ? (
        <p className="text-xs whitespace-nowrap text-muted-foreground">críticas {Number(m.valorCritico).toFixed(2)} %</p>
      ) : null}
    </div>
  );
}

export function MetricasVista({
  metricas,
  autores,
  esQA,
  cerrado,
}: {
  metricas: MetricaVista[];
  /** id de usuario → nombre. */
  autores: Record<string, string>;
  esQA: boolean;
  cerrado: boolean;
}) {
  const puedeGestionar = esQA && !cerrado;
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [agregar, setAgregar] = useState(false);
  const [dialogo, setDialogo] = useState<{ metricaId: string; medicion: Medicion | null } | null>(null);

  const configurados = new Set(metricas.map((m) => m.tipoId));
  const disponibles = TIPOS_METRICA.filter((t) => !configurados.has(t.id));
  const conteo = Object.fromEntries(ORDEN.map((e) => [e, metricas.filter((m) => m.cumplimiento === e).length])) as Record<
    EstadoCumplimiento,
    number
  >;
  const seleccionada = metricas.find((m) => m.id === seleccion) ?? null;
  const metricaDialogo = dialogo ? (metricas.find((m) => m.id === dialogo.metricaId) ?? null) : null;

  const registrar = (m: MetricaVista) => setDialogo({ metricaId: m.id, medicion: null });

  return (
    <div className="space-y-6">
      {cerrado ? <AvisoSoloLectura /> : null}

      <div>
        <SectionTitle
          className="mb-0"
          accion={
            puedeGestionar && disponibles.length > 0 ? (
              <Button onClick={() => setAgregar(true)}>
                <PlusIcon /> Agregar métrica
              </Button>
            ) : null
          }
        >
          <span className="text-xl font-bold tracking-tight">Métricas del proyecto</span>
        </SectionTitle>
      </div>

      {metricas.length === 0 ? (
        <EstadoVacio
          icon={GaugeIcon}
          titulo="Aún no hay métricas"
          descripcion="Agrega una métrica del catálogo para empezar a medir."
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen por cumplimiento">
            {ORDEN.map((e) => (
              <li key={e} className="rounded-xl border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CumplimientoIcon estado={e} />
                  {cumplimientoEtiqueta(e)}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{conteo[e]}</p>
              </li>
            ))}
          </ul>

          {/* Tabla en md+ */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Métrica</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Valor actual</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Cumplimiento</TableHead>
                  <TableHead className="pr-4">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => setSeleccion(m.id)}
                    data-state={seleccion === m.id ? "selected" : undefined}
                  >
                    <TableCell className="pl-4">
                      <button
                        type="button"
                        className="flex items-baseline gap-2 text-left outline-none focus-visible:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSeleccion(m.id);
                        }}
                      >
                        <span className="font-mono text-xs text-muted-foreground">{m.tipo.codigo}</span>
                        <span className="font-medium">{m.tipo.nombre}</span>
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {nombreEtapa(m.tipo.etapaCodigo)}
                    </TableCell>
                    <TableCell>
                      <Valor m={m} />
                    </TableCell>
                    <TableCell>
                      <Objetivo m={m} />
                    </TableCell>
                    <TableCell>
                      <CumplimientoBadge estado={m.cumplimiento} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {puedeGestionar ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            registrar(m);
                          }}
                        >
                          Registrar medición
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Tarjetas en móvil */}
          <ul className="space-y-3 md:hidden">
            {metricas.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-xl border bg-card">
                <button
                  type="button"
                  onClick={() => setSeleccion(m.id)}
                  className="block w-full space-y-3 p-4 text-left outline-none focus-visible:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {m.tipo.codigo} · {nombreEtapa(m.tipo.etapaCodigo)}
                      </p>
                      <p className="font-medium">{m.tipo.nombre}</p>
                    </div>
                    <CumplimientoBadge estado={m.cumplimiento} />
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor actual</p>
                      <Valor m={m} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Objetivo</p>
                      <Objetivo m={m} />
                    </div>
                  </div>
                </button>
                {puedeGestionar ? (
                  <div className="border-t px-4 py-2.5">
                    <Button variant="outline" size="sm" onClick={() => registrar(m)}>
                      Registrar medición
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            {configurados.size} de {TIPOS_METRICA.length} métricas del catálogo configuradas
            {disponibles.length > 0
              ? ` · disponible${disponibles.length > 1 ? "s" : ""} para agregar: ${disponibles
                  .map((t) => `${t.codigo} ${t.nombre}`)
                  .join(", ")}`
              : ""}
            . Cada tipo de métrica aparece una sola vez por proyecto.
          </p>
        </>
      )}

      <MetricaDetalleSheet
        key={seleccionada?.id ?? "ninguna"}
        metrica={seleccionada}
        autores={autores}
        puedeGestionar={puedeGestionar}
        onCerrar={() => setSeleccion(null)}
        onRegistrar={registrar}
        onCorregir={(m, medicion) => setDialogo({ metricaId: m.id, medicion })}
      />

      {puedeGestionar && agregar && disponibles.length > 0 ? (
        <AgregarMetricaDialog disponibles={disponibles} open onOpenChange={setAgregar} />
      ) : null}

      {puedeGestionar && dialogo && metricaDialogo ? (
        <MedicionDialog
          key={`${dialogo.metricaId}-${dialogo.medicion?.id ?? "nueva"}`}
          metrica={metricaDialogo}
          medicion={dialogo.medicion}
          onOpenChange={(o) => !o && setDialogo(null)}
        />
      ) : null}
    </div>
  );
}
