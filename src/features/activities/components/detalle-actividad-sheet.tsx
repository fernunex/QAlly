"use client";

import { useState } from "react";
import { CheckIcon, Undo2Icon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DecisionBadge, EstadoActividadBadge } from "@/components/status/status-badges";
import { Responsable } from "@/features/activities/components/responsable-avatar";
import {
  type Nombres,
  estaDevuelta,
  intentosEnviados,
  nombreDe,
} from "@/features/activities/utils";
import { IntentoCard } from "@/features/evidences/components/intento-card";
import { TIPOS_ACTIVIDAD, nombreEtapa } from "@/lib/catalogs";
import type { Actividad } from "@/lib/domain";
import { formatFecha, formatFechaHora } from "@/lib/format";

type Props = {
  actividad: Actividad | null;
  nombres: Nombres;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** QA participante en proyecto abierto. */
  puedeGestionar: boolean;
  onAsignar: (actividad: Actividad) => void;
  onAprobar: (id: string) => void;
  onDevolver: (id: string, observaciones: string) => void;
};

/** CU-03 SF-02/04/05: detalle de la actividad en Sheet derecho; QA revisa desde el footer fijo. */
export function DetalleActividadSheet({ actividad, open, onOpenChange, ...resto }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {actividad ? <Contenido key={actividad.id} actividad={actividad} {...resto} /> : null}
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
  actividad,
  nombres,
  puedeGestionar,
  onAsignar,
  onAprobar,
  onDevolver,
}: Omit<Props, "actividad" | "open" | "onOpenChange"> & { actividad: Actividad }) {
  const [observaciones, setObservaciones] = useState("");
  const [errorObs, setErrorObs] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  const tipo = TIPOS_ACTIVIDAD.find((t) => t.id === actividad.tipo.id);
  const enviados = intentosEnviados(actividad);
  const vigente = enviados[0];
  const puedeRevisar = puedeGestionar && actividad.estado === "En revisión" && !!vigente;
  const faltaEntrega = !vigente?.resultado || (vigente?.evidencias.length ?? 0) === 0;

  function devolver() {
    if (!observaciones.trim()) {
      setErrorObs("Escribe las observaciones para el responsable antes de devolver.");
      return;
    }
    setErrorObs(null);
    // TODO(funcionalidad): devolverActividad con observaciones y versionEsperada (contratos-v1 §5).
    onDevolver(actividad.id, observaciones.trim());
    toast.success("Actividad devuelta con observaciones");
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
          <p className="text-sm leading-relaxed">{actividad.descripcion}</p>
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
                    <p className="text-muted-foreground">
                      <span className="text-foreground">{nombreDe(nombres, e.revision.qaId)}:</span>{" "}
                      {e.revision.observaciones}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
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
              placeholder="Explica qué falta corregir…"
              value={observaciones}
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
          <Button variant="outline" onClick={devolver}>
            <Undo2Icon />
            Devolver con observaciones
          </Button>
          <Button
            className="bg-success text-success-foreground hover:bg-success/90"
            disabled={faltaEntrega}
            onClick={() => setConfirmar(true)}
          >
            <CheckIcon />
            Aprobar
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
              onClick={() => {
                // TODO(funcionalidad): aprobarActividad con versionEsperada (contratos-v1 §5).
                onAprobar(actividad.id);
                toast.success("Actividad aprobada");
              }}
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
