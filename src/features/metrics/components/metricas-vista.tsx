"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GaugeIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/shell/page-header";
import { AvisoSoloLectura, EstadoVacio } from "@/components/states/ui-states";
import { CumplimientoBadge, CumplimientoIcon, cumplimientoEtiqueta } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nombreEtapa } from "@/lib/catalogs";
import type { EstadoCumplimiento, TipoMetrica } from "@/lib/domain";
import { listarMedicionesAction } from "@/features/metrics/actions";
import { AgregarMetricaDialog } from "@/features/metrics/components/agregar-metrica-dialog";
import { MedicionDialog } from "@/features/metrics/components/medicion-dialog";
import {
  MetricaDetalleSheet,
  type EstadoHistorial,
} from "@/features/metrics/components/metrica-detalle-sheet";
import { objetivoLineas, valorActualTexto } from "@/features/metrics/lib/formato";
import type { Medicion, MetricaProyecto } from "@/features/metrics/types";

const ORDEN: EstadoCumplimiento[] = ["Cumple", "Incumple", "No evaluable", "Sin medición"];

function Objetivo({ m }: { m: MetricaProyecto }) {
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

function Valor({ m }: { m: MetricaProyecto }) {
  const sinValor = !m.medidaEn || m.valorActual === null;
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
  proyectoId,
  metricas: recibidas,
  catalogo,
  esQA,
  cerrado,
}: {
  proyectoId: string;
  metricas: MetricaProyecto[];
  /** Tipos vigentes del catálogo, con IDs de la BD. */
  catalogo: TipoMetrica[];
  esQA: boolean;
  cerrado: boolean;
}) {
  const router = useRouter();
  const puedeGestionar = esQA && !cerrado;
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [historial, setHistorial] = useState<EstadoHistorial | null>(null);
  const actual = useRef<string | null>(null);
  const [agregar, setAgregar] = useState(false);
  const [dialogo, setDialogo] = useState<{ metricaId: string; medicion: Medicion | null } | null>(null);
  // Respuesta de la última mutación por métrica, válida hasta que llegue la lista refrescada del servidor.
  const [locales, setLocales] = useState<Record<string, { base: MetricaProyecto; metrica: MetricaProyecto }>>({});
  const metricas = recibidas.map((m) => (locales[m.id]?.base === m ? locales[m.id]!.metrica : m));

  const configurados = new Set(metricas.map((m) => m.tipo.id));
  const disponibles = catalogo.filter((t) => !configurados.has(t.id));
  const conteo = Object.fromEntries(ORDEN.map((e) => [e, metricas.filter((m) => m.cumplimiento === e).length])) as Record<
    EstadoCumplimiento,
    number
  >;
  const seleccionada = metricas.find((m) => m.id === seleccion) ?? null;
  const metricaDialogo = dialogo ? (metricas.find((m) => m.id === dialogo.metricaId) ?? null) : null;

  const registrar = (m: MetricaProyecto) => setDialogo({ metricaId: m.id, medicion: null });

  async function cargarHistorial(id: string, cursor?: string) {
    try {
      const r = await listarMedicionesAction({ metricaProyectoId: id, ...(cursor ? { cursor } : {}) });
      if (actual.current !== id) return;
      setHistorial((h) => {
        if (!r.ok) return { id, tipo: "error", error: r.error };
        const previos = cursor && h?.id === id && h.tipo === "ok" ? h.items : [];
        return { id, tipo: "ok", items: [...previos, ...r.datos.items], siguienteCursor: r.datos.siguienteCursor };
      });
    } catch {
      if (actual.current === id)
        setHistorial({
          id,
          tipo: "error",
          error: { codigo: "FALLO_PERSISTENCIA", mensaje: "No pudimos cargar las mediciones. Inténtalo de nuevo." },
        });
    }
  }
  function abrir(id: string) {
    actual.current = id;
    setSeleccion(id);
    setHistorial({ id, tipo: "cargando" });
    void cargarHistorial(id);
  }
  function cerrar() {
    actual.current = null;
    setSeleccion(null);
  }
  function recargarHistorial() {
    if (!seleccion) return;
    setHistorial({ id: seleccion, tipo: "cargando" });
    void cargarHistorial(seleccion);
  }
  function cargarMas() {
    if (historial?.tipo !== "ok" || !historial.siguienteCursor) return;
    setHistorial({ ...historial, cargandoMas: true });
    void cargarHistorial(historial.id, historial.siguienteCursor);
  }
  /** Tras guardar: refleja la respuesta, refresca la ruta y el historial abierto. */
  function actualizada(m: MetricaProyecto, historialCambia: boolean) {
    const base = recibidas.find((x) => x.id === m.id);
    if (base) setLocales((l) => ({ ...l, [m.id]: { base, metrica: m } }));
    router.refresh();
    if (historialCambia && actual.current === m.id) void cargarHistorial(m.id);
  }

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
                    onClick={() => abrir(m.id)}
                    data-state={seleccion === m.id ? "selected" : undefined}
                  >
                    <TableCell className="pl-4">
                      <button
                        type="button"
                        className="flex items-baseline gap-2 text-left outline-none focus-visible:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrir(m.id);
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
                  onClick={() => abrir(m.id)}
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
            {configurados.size} de {configurados.size + disponibles.length} métricas del catálogo configuradas
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
        historial={historial?.id === seleccionada?.id ? historial : null}
        puedeGestionar={puedeGestionar}
        onCerrar={cerrar}
        onRegistrar={registrar}
        onCorregir={(m, medicion) => setDialogo({ metricaId: m.id, medicion })}
        onCargarMas={cargarMas}
        onRecargar={recargarHistorial}
        onObjetivoGuardado={(m) => {
          toast.success(`Objetivo actualizado · ${cumplimientoEtiqueta(m.cumplimiento)}`);
          actualizada(m, false);
        }}
      />

      {puedeGestionar && agregar && disponibles.length > 0 ? (
        <AgregarMetricaDialog
          proyectoId={proyectoId}
          disponibles={disponibles}
          open
          onOpenChange={setAgregar}
          onAgregada={(m) => {
            toast.success(`Métrica ${m.tipo.codigo} agregada · Sin medición`);
            setAgregar(false);
            router.refresh();
          }}
        />
      ) : null}

      {puedeGestionar && dialogo && metricaDialogo ? (
        <MedicionDialog
          key={`${dialogo.metricaId}-${dialogo.medicion?.id ?? "nueva"}`}
          metrica={metricaDialogo}
          medicion={dialogo.medicion}
          esVigente={
            historial?.tipo === "ok" && historial.id === dialogo.metricaId && historial.items[0]?.id === dialogo.medicion?.id
          }
          onOpenChange={(o) => !o && setDialogo(null)}
          onGuardada={(m) => {
            setDialogo(null);
            actualizada(m, true);
          }}
        />
      ) : null}
    </div>
  );
}
