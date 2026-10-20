"use client";

import { useState } from "react";
import { CheckIcon, SearchXIcon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EstadoVacio } from "@/components/states/ui-states";
import { DecisionBadge, EstadoActividadBadge } from "@/components/status/status-badges";
import { aprobarEntregaAction, devolverEntregaAction } from "@/features/activities/actions";
import { Responsable } from "@/features/activities/components/responsable-avatar";
import type { ActividadDetalle } from "@/features/activities/server/queries";
import { estaDevuelta, intentosEnviados, nombreDe } from "@/features/activities/utils";
import { IntentoCard } from "@/features/evidences/components/intento-card";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { nombreEtapa } from "@/lib/catalogs";
import type { Actividad, TipoActividad } from "@/lib/domain";
import type { ErrorPublico, Resultado } from "@/lib/resultados";
import { formatFecha, formatFechaHora } from "@/lib/format";

export type EstadoDetalle = { id: string } & (
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: ActividadDetalle; cargandoMas?: boolean }
  | { tipo: "error"; error: ErrorPublico }
);

type Props = {
  detalle: EstadoDetalle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** QA participante en proyecto abierto. */
  puedeGestionar: boolean;
  /** Catálogo vigente: criterio y evidencia esperada por tipo. */
  tipos: TipoActividad[];
  onAsignar: (actividad: Actividad) => void;
  onActualizada: (detalle: ActividadDetalle) => void;
  onRecargar: () => void;
  onCargarMas: () => void;
};

/** CU-03 SF-02/04/05: detalle de la actividad en Sheet derecho; QA revisa desde el footer fijo. */
export function DetalleActividadSheet({ detalle, open, onOpenChange, onRecargar, ...resto }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {detalle?.tipo === "ok" ? (
          <Contenido
            key={`${detalle.datos.actividad.id}:${detalle.datos.actividad.version}`}
            datos={detalle.datos}
            cargandoMas={!!detalle.cargandoMas}
            onRecargar={onRecargar}
            {...resto}
          />
        ) : detalle?.tipo === "error" ? (
          <>
            <SheetHeader className="border-b p-4 pr-12">
              <SheetTitle>Actividad SQA</SheetTitle>
              <SheetDescription className="sr-only">No se pudo cargar la actividad</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              {detalle.error.codigo === "NO_DISPONIBLE" ? (
                <EstadoVacio
                  icon={SearchXIcon}
                  titulo="Esta actividad no está disponible"
                  descripcion="No se encuentra o no tienes acceso. Vuelve al listado de actividades."
                >
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Volver al listado
                  </Button>
                </EstadoVacio>
              ) : (
                <>
                  <ErrorAccion error={detalle.error} onRecargar={onRecargar} />
                  <Button variant="outline" onClick={onRecargar}>
                    Reintentar
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="gap-2 border-b p-4 pr-12">
              <SheetTitle className="sr-only">Cargando actividad</SheetTitle>
              <SheetDescription className="sr-only">Cargando el detalle de la actividad SQA</SheetDescription>
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-6 w-64 max-w-full" />
            </SheetHeader>
            <div role="status" className="space-y-3 p-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-40" />
              <span className="sr-only">Cargando información…</span>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Contenido({
  datos,
  cargandoMas,
  puedeGestionar,
  tipos,
  onAsignar,
  onActualizada,
  onRecargar,
  onCargarMas,
}: Omit<Props, "detalle" | "open" | "onOpenChange"> & { datos: ActividadDetalle; cargandoMas: boolean }) {
  const { actividad, nombres, siguienteCursorIntentos } = datos;
  const [observaciones, setObservaciones] = useState("");
  const [errorObs, setErrorObs] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [pendiente, setPendiente] = useState<"Aprobar" | "Devolver" | null>(null);
  const [error, setError] = useState<ErrorPublico | null>(null);

  const tipo = tipos.find((t) => t.codigo === actividad.tipo.codigo);
  const enviados = intentosEnviados(actividad);
  const vigente = enviados[0];
  const puedeRevisar = puedeGestionar && actividad.estado === "En revisión" && !!vigente && !vigente.revision;
  const faltaEntrega = !vigente?.resultado || (vigente?.evidencias.length ?? 0) === 0;

  async function ejecutar(decision: "Aprobar" | "Devolver") {
    if (!vigente || pendiente) return;
    setPendiente(decision);
    setError(null);
    try {
      const entrada = { entregaId: vigente.id, versionEsperada: actividad.version };
      const r: Resultado<ActividadDetalle> =
        decision === "Aprobar"
          ? await aprobarEntregaAction({ ...entrada, observaciones: observaciones.trim() || null })
          : await devolverEntregaAction({ ...entrada, observaciones: observaciones.trim() });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast.success(decision === "Aprobar" ? "Actividad aprobada" : "Actividad devuelta con observaciones");
      onActualizada(r.datos);
    } catch {
      // Con versión esperada, una decisión repetida no se duplica: recibe CONFLICTO.
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje: "No recibimos confirmación. Recarga para comprobar el estado de la actividad.",
      });
    } finally {
      setPendiente(null);
    }
  }

  function devolver() {
    if (!observaciones.trim()) {
      setErrorObs("Escribe las observaciones para el responsable antes de devolver.");
      return;
    }
    if ([...observaciones.trim()].length > 10000) {
      setErrorObs("Máximo 10000 caracteres.");
      return;
    }
    setErrorObs(null);
    void ejecutar("Devolver");
  }

  return (
    <>
      <SheetHeader className="gap-1 border-b p-4 pr-12">
        <p className="font-mono text-xs text-muted-foreground">
          {actividad.tipo.codigo} · {nombreEtapa(actividad.tipo.etapaCodigo)}
        </p>
        <SheetTitle className="text-lg leading-snug">{actividad.descripcion}</SheetTitle>
        <SheetDescription className="sr-only">Detalle de la actividad SQA</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <dl className="space-y-2.5">
          <Dato etiqueta="Estado">
            <span className="inline-flex flex-wrap items-center gap-2">
              <EstadoActividadBadge estado={actividad.estado} />
              {estaDevuelta(actividad) ? (
                <span className="text-xs text-destructive">Devuelta con observaciones</span>
              ) : null}
            </span>
          </Dato>
          <Dato etiqueta="Tipo">
            <span className="font-mono text-xs">{actividad.tipo.codigo}</span> {actividad.tipo.nombre}
          </Dato>
          <Dato etiqueta="Etapa">{nombreEtapa(actividad.tipo.etapaCodigo)}</Dato>
          <Dato etiqueta="Responsable">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {actividad.responsable ? (
                <Responsable nombre={actividad.responsable.nombre} />
              ) : (
                <span className="text-muted-foreground">Sin responsable</span>
              )}
              {puedeGestionar && actividad.estado === "Pendiente" ? (
                <Button variant="outline" size="xs" onClick={() => onAsignar(actividad)}>
                  {actividad.responsable ? "Cambiar responsable" : "Asignar responsable"}
                </Button>
              ) : null}
            </span>
          </Dato>
        </dl>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">Descripción</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line">{actividad.descripcion}</p>
        </section>

        {tipo ? (
          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold">Criterio de aprobación</h3>
            <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">{tipo.criterio}</p>
            <p className="text-xs text-muted-foreground">Evidencia esperada: {tipo.evidencia}</p>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Intento vigente</h3>
          {vigente ? (
            <IntentoCard entrega={vigente} nombres={nombres} />
          ) : (
            <p className="rounded-lg border border-dashed p-3.5 text-sm text-muted-foreground">
              Aún no hay un intento enviado. Aparecerá aquí cuando el responsable envíe su resultado y evidencia.
            </p>
          )}
        </section>

        {enviados.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Historial de intentos</h3>
            <ol className="space-y-2">
              {enviados.map((e) => (
                <li key={e.id} className="space-y-1.5 rounded-lg border bg-card p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      Intento {e.numeroIntento}
                      <span className="font-normal text-muted-foreground"> · enviado {formatFecha(e.enviadaEn!)}</span>
                    </span>
                    <DecisionBadge decision={e.revision?.decision ?? null} />
                  </div>
                  {e.revision?.decision === "Devolver" && e.revision.observaciones ? (
                    <p className="whitespace-pre-line text-muted-foreground">
                      <span className="text-foreground">{nombreDe(nombres, e.revision.qaId)}:</span>{" "}
                      {e.revision.observaciones}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
            {siguienteCursorIntentos ? (
              <Button variant="outline" size="sm" className="w-full" disabled={cargandoMas} onClick={onCargarMas}>
                {cargandoMas ? "Cargando…" : "Cargar intentos anteriores"}
              </Button>
            ) : null}
          </section>
        ) : null}

        {puedeRevisar ? (
          <Field data-invalid={!!errorObs}>
            <FieldLabel htmlFor="obs-qa">
              Observaciones para el responsable{" "}
              <span className="font-normal text-muted-foreground">(obligatorias al devolver)</span>
            </FieldLabel>
            <Textarea
              id="obs-qa"
              rows={4}
              maxLength={10000}
              placeholder="Explica qué falta corregir…"
              value={observaciones}
              disabled={pendiente !== null}
              aria-invalid={!!errorObs}
              onChange={(e) => {
                setObservaciones(e.target.value);
                if (errorObs) setErrorObs(null);
              }}
            />
            <FieldError>{errorObs}</FieldError>
            {faltaEntrega ? (
              <FieldDescription className="text-xs text-destructive">
                No se puede aprobar: falta el resultado o la evidencia del intento.
              </FieldDescription>
            ) : null}
          </Field>
        ) : null}

        {error ? <ErrorAccion error={error} onRecargar={onRecargar} /> : null}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Línea de tiempo</h3>
          {actividad.eventos.length > 0 ? (
            <ol className="space-y-1.5 border-l pl-4 text-sm">
              {actividad.eventos.map((ev, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className="absolute top-2 -left-[1.28rem] size-1.5 rounded-full bg-border" />
                  <span className="text-muted-foreground tabular-nums">{formatFechaHora(ev.fecha)}</span>
                  <span className="block">{ev.texto}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
          )}
        </section>
      </div>

      {puedeRevisar ? (
        <SheetFooter className="flex-col-reverse border-t sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={pendiente !== null} onClick={devolver}>
            <Undo2Icon />
            {pendiente === "Devolver" ? "Devolviendo…" : "Devolver con observaciones"}
          </Button>
          <Button
            className="bg-success text-success-foreground hover:bg-success/90"
            disabled={faltaEntrega || pendiente !== null}
            onClick={() => setConfirmar(true)}
          >
            <CheckIcon />
            {pendiente === "Aprobar" ? "Aprobando…" : "Aprobar"}
          </Button>
        </SheetFooter>
      ) : null}

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar esta actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Pasará a Aprobada y quedará cerrada para cambios ordinarios. Se registrarán tu nombre y la fecha de
              aprobación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={() => void ejecutar("Aprobar")}
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
