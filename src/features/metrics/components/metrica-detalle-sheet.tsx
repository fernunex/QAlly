"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, HistoryIcon, PencilIcon, PlusIcon } from "lucide-react";
import { CumplimientoBadge } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { nombreEtapa } from "@/lib/catalogs";
import { formatDia, formatFechaHora } from "@/lib/format";
import type { ErrorPublico } from "@/lib/resultados";
import { cn } from "@/lib/utils";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { configurarObjetivoAction, listarCorreccionesAction } from "@/features/metrics/actions";
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
import type { HistorialCorrecciones, Medicion, MetricaProyecto } from "@/features/metrics/types";

export type EstadoHistorial = { id: string } & (
  | { tipo: "cargando" }
  | { tipo: "ok"; items: Medicion[]; siguienteCursor: string | null; cargandoMas?: boolean }
  | { tipo: "error"; error: ErrorPublico }
);

const FALLO_RED: ErrorPublico = {
  codigo: "FALLO_PERSISTENCIA",
  mensaje: "No recibimos la confirmación. Recarga para comprobar si se guardó.",
};

/** «90.00000000» → «90»; «97.50000000» → «97.5». Sin pasar por Number. */
function decimalCorto(v: string) {
  return v.includes(".") ? v.replace(/0+$/, "").replace(/\.$/, "") : v;
}

function EditarObjetivo({
  metrica,
  onCerrar,
  onGuardado,
}: {
  metrica: MetricaProyecto;
  onCerrar: () => void;
  onGuardado: (m: MetricaProyecto) => void;
}) {
  const id = useId();
  const [valores, setValores] = useState<ObjetivosTexto>({
    objetivo: decimalCorto(metrica.objetivo),
    critico: metrica.objetivoCritico === null ? "" : decimalCorto(metrica.objetivoCritico),
  });
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  const errores = intentado ? validarObjetivos(metrica.tipo, valores) : {};

  async function guardar() {
    setIntentado(true);
    if (enviando || Object.keys(validarObjetivos(metrica.tipo, valores)).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await configurarObjetivoAction({
        metricaProyectoId: metrica.id,
        configuradaEnEsperada: metrica.configuradaEn,
        objetivo: valores.objetivo,
        objetivoCritico: metrica.tipo.objetivoCriticoInicial !== null ? valores.critico : null,
      });
      if (!r.ok) return setError(r.error);
      onGuardado(r.datos);
      onCerrar();
    } catch {
      setError(FALLO_RED);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      {error ? <ErrorAccion error={error} /> : null}
      <ObjetivoCampos
        idBase={id}
        tipo={metrica.tipo}
        valores={valores}
        errores={errores}
        onChange={setValores}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button size="sm" onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar objetivo"}
        </Button>
      </div>
    </div>
  );
}

type EstadoCorrecciones =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: HistorialCorrecciones; cargandoMas?: boolean }
  | { tipo: "error"; error: ErrorPublico };

function Correcciones({
  medicion,
  unidad,
  estado,
  onReintentar,
  onCargarMas,
}: {
  medicion: Medicion;
  unidad: MetricaProyecto["tipo"]["unidad"];
  estado: EstadoCorrecciones;
  onReintentar: () => void;
  onCargarMas: () => void;
}) {
  return (
    <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Correcciones de la medición del {formatDia(medicion.medidaEn)}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Corregir una medición anterior no cambia el valor actual: sigue siendo la de la fecha de medición más
        reciente.
      </p>
      {estado.tipo === "cargando" ? (
        <div role="status" className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <span className="sr-only">Cargando correcciones…</span>
        </div>
      ) : estado.tipo === "error" ? (
        <div className="space-y-2">
          <ErrorAccion error={estado.error} />
          <Button variant="outline" size="sm" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <ol className="divide-y">
            {estado.datos.items.map((r) => (
              <li key={r.numero} className="space-y-1 py-2 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-semibold">Corrección {r.numero - 1}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {r.autorNombre} · {formatFechaHora(r.registradaEn)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Valor original{" "}
                  <b className="font-medium whitespace-nowrap text-foreground tabular-nums">
                    {valorRevisionTexto(estado.datos.original, unidad)}
                  </b>
                  {" · "}anterior{" "}
                  <b className="font-medium whitespace-nowrap text-foreground tabular-nums">
                    {valorRevisionTexto({ valor: r.valorAnterior }, unidad)}
                  </b>
                  {" · "}nuevo{" "}
                  <b className="font-medium whitespace-nowrap text-foreground tabular-nums">
                    {valorRevisionTexto(r, unidad)}
                  </b>
                </p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">
            Captura original: {estado.datos.original.autorNombre} ·{" "}
            {formatFechaHora(estado.datos.original.registradaEn)}
          </p>
          {estado.datos.siguienteCursor ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={estado.cargandoMas}
              onClick={onCargarMas}
            >
              {estado.cargandoMas ? "Cargando…" : "Ver correcciones anteriores"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

function Historial({
  metrica,
  historial,
  puedeGestionar,
  onCorregir,
  onCargarMas,
  onRecargar,
}: {
  metrica: MetricaProyecto;
  historial: EstadoHistorial | null;
  puedeGestionar: boolean;
  onCorregir: (m: MetricaProyecto, medicion: Medicion) => void;
  onCargarMas: () => void;
  onRecargar: () => void;
}) {
  const [expandida, setExpandida] = useState<string | null>(null);
  const [correcciones, setCorrecciones] = useState<Record<string, EstadoCorrecciones>>({});

  /** Carga (o continúa) las correcciones de una medición; la clave incluye la revisión vista. */
  async function cargarCorrecciones(md: Medicion, previo?: HistorialCorrecciones) {
    const clave = `${md.id}:${md.revision.numero}`;
    const poner = (e: EstadoCorrecciones) => setCorrecciones((c) => ({ ...c, [clave]: e }));
    poner(previo ? { tipo: "ok", datos: previo, cargandoMas: true } : { tipo: "cargando" });
    try {
      const r = await listarCorreccionesAction({
        medicionId: md.id,
        ...(previo?.siguienteCursor ? { cursor: previo.siguienteCursor } : {}),
      });
      if (!r.ok) return poner({ tipo: "error", error: r.error });
      poner({
        tipo: "ok",
        datos: previo ? { ...r.datos, items: [...previo.items, ...r.datos.items] } : r.datos,
      });
    } catch {
      poner({ tipo: "error", error: { ...FALLO_RED, mensaje: "No pudimos cargar las correcciones." } });
    }
  }
  function alternar(md: Medicion) {
    if (expandida === md.id && correcciones[`${md.id}:${md.revision.numero}`]) return setExpandida(null);
    setExpandida(md.id);
    const e = correcciones[`${md.id}:${md.revision.numero}`];
    if (!e || e.tipo === "error") void cargarCorrecciones(md);
  }

  if (!historial || historial.tipo === "cargando")
    return (
      <div role="status" className="space-y-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <span className="sr-only">Cargando mediciones…</span>
      </div>
    );
  if (historial.tipo === "error")
    return (
      <div className="space-y-2">
        <ErrorAccion error={historial.error} />
        <Button variant="outline" size="sm" onClick={onRecargar}>
          Reintentar
        </Button>
      </div>
    );
  if (historial.items.length === 0)
    return (
      <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
        Sin medición. Aún no se registra ningún valor para esta métrica.
      </p>
    );
  return (
    <>
      <ul className="divide-y rounded-lg border" aria-label="Mediciones registradas">
        {historial.items.map((md, i) => {
          const rev = md.revision;
          // El orden del historial es el de vigencia: la primera es la medición actual.
          const vigente = i === 0;
          const corregida = rev.numero > 1;
          const clave = `${md.id}:${rev.numero}`;
          // Una corrección nueva cambia la clave: el panel se cierra hasta volver a consultarlo.
          const abierta = expandida === md.id && !!correcciones[clave];
          return (
            <li key={md.id} className="px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap tabular-nums">{formatDia(md.medidaEn)}</span>
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
                <span className="whitespace-nowrap tabular-nums">{datosLegibles(metrica.tipo.codigo, rev.datosFuente)}</span>
                {" · "}
                {esUrl(rev.fuenteReferencia) ? (
                  <a
                    href={rev.fuenteReferencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={rev.fuenteReferencia}
                    className="underline underline-offset-2"
                  >
                    {fuenteCorta(rev.fuenteReferencia)}
                  </a>
                ) : (
                  <span className="break-words">{fuenteCorta(rev.fuenteReferencia)}</span>
                )}
                {" · "}
                {rev.autorNombre}
              </p>
              {puedeGestionar || corregida ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {corregida ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-expanded={abierta}
                      onClick={() => alternar(md)}
                    >
                      <HistoryIcon /> {abierta ? "Ocultar" : "Ver"} correcciones
                      <ChevronDownIcon className={cn("transition-transform", abierta && "rotate-180")} />
                    </Button>
                  ) : null}
                  {puedeGestionar ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-label={`Corregir medición del ${formatDia(md.medidaEn)}`}
                      onClick={() => onCorregir(metrica, md)}
                    >
                      <PencilIcon /> Corregir
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {abierta ? (
                <Correcciones
                  medicion={md}
                  unidad={metrica.tipo.unidad}
                  estado={correcciones[clave]!}
                  onReintentar={() => void cargarCorrecciones(md)}
                  onCargarMas={() => {
                    const e = correcciones[clave];
                    if (e?.tipo === "ok") void cargarCorrecciones(md, e.datos);
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {historial.siguienteCursor ? (
        <Button variant="outline" size="sm" onClick={onCargarMas} disabled={historial.cargandoMas}>
          {historial.cargandoMas ? "Cargando…" : "Ver mediciones anteriores"}
        </Button>
      ) : null}
    </>
  );
}

/** CU-02 SF-01 Consultar métrica + SF-03 Editar objetivo; historial y trazas de SF-04. */
export function MetricaDetalleSheet({
  metrica,
  historial,
  puedeGestionar,
  onCerrar,
  onRegistrar,
  onCorregir,
  onCargarMas,
  onRecargar,
  onObjetivoGuardado,
}: {
  metrica: MetricaProyecto | null;
  historial: EstadoHistorial | null;
  puedeGestionar: boolean;
  onCerrar: () => void;
  onRegistrar: (m: MetricaProyecto) => void;
  onCorregir: (m: MetricaProyecto, medicion: Medicion) => void;
  onCargarMas: () => void;
  onRecargar: () => void;
  onObjetivoGuardado: (m: MetricaProyecto) => void;
}) {
  const [editando, setEditando] = useState(false);

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
                      {metrica.medidaEn ? ` · medición del ${formatDia(metrica.medidaEn)}` : null}
                    </p>
                    <p
                      className={cn(
                        "text-4xl font-bold tracking-tight whitespace-nowrap tabular-nums",
                        metrica.valorActual === null && "text-2xl font-semibold text-muted-foreground",
                      )}
                    >
                      {valorActualTexto(metrica)}
                    </p>
                    {metrica.valorCritico ? (
                      <p className="text-sm text-muted-foreground tabular-nums">
                        críticas {Number(metrica.valorCritico).toFixed(2)} %
                      </p>
                    ) : null}
                    {metrica.causa || metrica.causaCritica ? (
                      <p className="text-xs text-muted-foreground">
                        No evaluable: {[metrica.causa, metrica.causaCritica].filter(Boolean).join(" · ")}
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
                {puedeGestionar && editando ? (
                  <EditarObjetivo
                    metrica={metrica}
                    onCerrar={() => setEditando(false)}
                    onGuardado={onObjetivoGuardado}
                  />
                ) : null}
              </section>

              <section aria-label="Historial de mediciones" className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">Mediciones</h3>
                  <span className="text-xs text-muted-foreground">Las anteriores se conservan</span>
                </div>
                <Historial
                  metrica={metrica}
                  historial={historial}
                  puedeGestionar={puedeGestionar}
                  onCorregir={onCorregir}
                  onCargarMas={onCargarMas}
                  onRecargar={onRecargar}
                />
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
