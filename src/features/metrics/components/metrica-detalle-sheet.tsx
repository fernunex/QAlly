"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, HistoryIcon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { CumplimientoBadge } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { nombreEtapa } from "@/lib/catalogs";
import type { Medicion, MetricaVista } from "@/lib/domain";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ObjetivoCampos,
  validarObjetivos,
  type ObjetivosTexto,
} from "@/features/metrics/components/objetivo-campos";
import {
  datosLegibles,
  esUrl,
  fuenteCorta,
  objetivoLineas,
  valorActualTexto,
  valorRevisionTexto,
} from "@/features/metrics/lib/formato";

function EditarObjetivo({ metrica, onCerrar }: { metrica: MetricaVista; onCerrar: () => void }) {
  const id = useId();
  const [valores, setValores] = useState<ObjetivosTexto>({
    objetivo: metrica.objetivo,
    critico: metrica.objetivoCritico ?? "",
  });
  const [intentado, setIntentado] = useState(false);
  const errores = intentado ? validarObjetivos(metrica.tipo, valores) : {};

  function guardar() {
    setIntentado(true);
    if (Object.keys(validarObjetivos(metrica.tipo, valores)).length > 0) return;
    // TODO(funcionalidad): configurarObjetivo(metricaProyectoId, configuradaEnEsperada, objetivo, objetivoCritico) — QA, proyecto abierto.
    toast.success("Objetivo actualizado · se reevalúa el valor actual");
    onCerrar();
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <ObjetivoCampos
        idBase={id}
        tipo={metrica.tipo}
        valores={valores}
        errores={errores}
        onChange={setValores}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button size="sm" onClick={guardar}>
          Guardar objetivo
        </Button>
      </div>
    </div>
  );
}

function Correcciones({
  medicion,
  unidad,
  autores,
}: {
  medicion: Medicion;
  unidad: MetricaVista["tipo"]["unidad"];
  autores: Record<string, string>;
}) {
  const revs = medicion.revisiones;
  const original = valorRevisionTexto(revs[0]!, unidad);
  const correcciones = revs.slice(1).reverse();
  return (
    <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Correcciones de la medición del {formatFecha(medicion.medidaEn)}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Corregir una medición anterior no cambia el valor actual: sigue siendo la de la fecha de medición más
        reciente.
      </p>
      <ol className="divide-y">
        {correcciones.map((r) => {
          const previa = revs[r.numero - 2]!;
          return (
            <li key={r.numero} className="space-y-1 py-2 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold">Corrección {r.numero - 1}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {autores[r.autorId] ?? "Usuario"} · {formatFechaHora(r.registradaEn)}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Valor original <b className="font-medium whitespace-nowrap text-foreground tabular-nums">{original}</b>
                {" · "}anterior{" "}
                <b className="font-medium whitespace-nowrap text-foreground tabular-nums">
                  {valorRevisionTexto(previa, unidad)}
                </b>
                {" · "}nuevo{" "}
                <b className="font-medium whitespace-nowrap text-foreground tabular-nums">
                  {valorRevisionTexto(r, unidad)}
                </b>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** CU-02 SF-01 Consultar métrica + SF-03 Editar objetivo; historial y trazas de SF-04. */
export function MetricaDetalleSheet({
  metrica,
  autores,
  puedeGestionar,
  onCerrar,
  onRegistrar,
  onCorregir,
}: {
  metrica: MetricaVista | null;
  autores: Record<string, string>;
  puedeGestionar: boolean;
  onCerrar: () => void;
  onRegistrar: (m: MetricaVista) => void;
  onCorregir: (m: MetricaVista, medicion: Medicion) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);

  return (
    <Sheet open={metrica !== null} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        {metrica ? (
          <>
            <SheetHeader className="border-b p-4 pr-12">
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{metrica.tipo.codigo}</span> · {nombreEtapa(metrica.tipo.etapaCodigo)}
              </p>
              <SheetTitle className="text-lg font-semibold">{metrica.tipo.nombre}</SheetTitle>
              <SheetDescription className="sr-only">
                Detalle, objetivo e historial de mediciones de la métrica.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              <p className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed break-words">
                Valor = {metrica.tipo.formula}
              </p>

              <section aria-label="Valor actual y objetivo" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Valor actual
                      {metrica.medicionVigente ? ` · medición del ${formatFecha(metrica.medicionVigente.medidaEn)}` : null}
                    </p>
                    <p
                      className={cn(
                        "text-4xl font-bold tracking-tight whitespace-nowrap tabular-nums",
                        !metrica.medicionVigente && "text-2xl font-semibold text-muted-foreground",
                      )}
                    >
                      {valorActualTexto(metrica)}
                    </p>
                    {metrica.valorCritico ? (
                      <p className="text-sm text-muted-foreground tabular-nums">
                        críticas {Number(metrica.valorCritico).toFixed(2)} %
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    {objetivoLineas(metrica).map((l) => (
                      <p key={l.texto + l.etiqueta} className="text-sm font-semibold whitespace-nowrap tabular-nums">
                        {l.etiqueta ? <span className="font-normal text-muted-foreground">{l.etiqueta} </span> : null}
                        {l.texto}
                      </p>
                    ))}
                  </div>
                  <CumplimientoBadge estado={metrica.cumplimiento} />
                </div>
                {puedeGestionar && !editando ? (
                  <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
                    <PencilIcon /> Editar objetivo
                  </Button>
                ) : null}
                {editando ? <EditarObjetivo metrica={metrica} onCerrar={() => setEditando(false)} /> : null}
              </section>

              <section aria-label="Historial de mediciones" className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">Mediciones</h3>
                  <span className="text-xs text-muted-foreground">Las anteriores se conservan</span>
                </div>
                {metrica.mediciones.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    Sin medición. Aún no se registra ningún valor para esta métrica.
                  </p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {metrica.mediciones.map((md) => {
                      const rev = md.revisiones[md.revisiones.length - 1]!;
                      const vigente = md.id === metrica.medicionVigente?.id;
                      const corregida = md.revisiones.length > 1;
                      const abierta = expandida === md.id;
                      return (
                        <li key={md.id} className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                                {formatFecha(md.medidaEn)}
                              </span>
                              {vigente ? (
                                <span className="rounded-md border border-progress/25 bg-progress/10 px-1.5 py-0.5 text-xs font-medium text-progress">
                                  Actual
                                </span>
                              ) : null}
                              {corregida ? (
                                <span className="rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  Corregida
                                </span>
                              ) : null}
                            </div>
                            <span className="text-sm font-bold whitespace-nowrap tabular-nums">
                              {valorRevisionTexto(rev, metrica.tipo.unidad)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="whitespace-nowrap tabular-nums">
                              {datosLegibles(metrica.tipo.codigo, rev.datosFuente)}
                            </span>
                            {" · "}
                            <span title={esUrl(rev.fuenteReferencia) ? rev.fuenteReferencia : undefined}>
                              {fuenteCorta(rev.fuenteReferencia)}
                            </span>
                            {" · "}
                            {autores[rev.autorId] ?? "Usuario"}
                          </p>
                          {puedeGestionar || corregida ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {corregida ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  aria-expanded={abierta}
                                  onClick={() => setExpandida(abierta ? null : md.id)}
                                >
                                  <HistoryIcon /> {abierta ? "Ocultar" : "Ver"} correcciones
                                  <ChevronDownIcon className={cn("transition-transform", abierta && "rotate-180")} />
                                </Button>
                              ) : null}
                              {puedeGestionar ? (
                                <Button variant="ghost" size="xs" onClick={() => onCorregir(metrica, md)}>
                                  <PencilIcon /> Corregir
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                          {abierta ? (
                            <Correcciones medicion={md} unidad={metrica.tipo.unidad} autores={autores} />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            {puedeGestionar ? (
              <SheetFooter className="border-t bg-popover sm:flex-row sm:justify-end">
                <Button onClick={() => onRegistrar(metrica)}>
                  <PlusIcon /> Registrar medición
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
