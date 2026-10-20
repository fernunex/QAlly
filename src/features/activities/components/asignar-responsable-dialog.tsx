"use client";

import { useState } from "react";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { asignarResponsableAction } from "@/features/activities/actions";
import { Responsable } from "@/features/activities/components/responsable-avatar";
import type { ActividadDetalle } from "@/features/activities/server/queries";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import type { Actividad } from "@/lib/domain";
import type { ErrorPublico } from "@/lib/resultados";

export type Participante = { usuarioId: string; nombre: string };
type ActividadAsignable = Pick<Actividad, "id" | "tipo" | "descripcion" | "responsable" | "estado" | "version">;

/** CU-03 SF-03: asignar responsable a una actividad Pendiente (QA, proyecto abierto). */
export function AsignarResponsableDialog({
  actividad,
  participantes,
  onOpenChange,
  onAsignada,
}: {
  /** null = cerrado. */
  actividad: ActividadAsignable | null;
  participantes: Participante[];
  onOpenChange: (open: boolean) => void;
  onAsignada: (detalle: ActividadDetalle) => void;
}) {
  return (
    <Dialog open={actividad !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {actividad ? (
          <Contenido
            key={`${actividad.id}:${actividad.version}`}
            actividad={actividad}
            participantes={participantes}
            onCancelar={() => onOpenChange(false)}
            onAsignada={onAsignada}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  actividad,
  participantes,
  onCancelar,
  onAsignada,
}: {
  actividad: ActividadAsignable;
  participantes: Participante[];
  onCancelar: () => void;
  onAsignada: (detalle: ActividadDetalle) => void;
}) {
  const [elegido, setElegido] = useState(actividad.responsable?.usuarioId ?? "");
  const [intentado, setIntentado] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  const permitido = actividad.estado === "Pendiente";
  const sinCambio = elegido !== "" && elegido === actividad.responsable?.usuarioId;

  async function asignar() {
    setIntentado(true);
    if (!elegido || pendiente) return;
    if (sinCambio) {
      onCancelar();
      return;
    }
    setPendiente(true);
    setError(null);
    try {
      const r = await asignarResponsableAction({
        actividadId: actividad.id,
        responsableId: elegido,
        versionEsperada: actividad.version,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onAsignada(r.datos);
    } catch {
      // Con versión esperada, reintentar no duplica: una versión obsoleta devuelve CONFLICTO.
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje: "No recibimos confirmación. Recarga para comprobar el responsable guardado.",
      });
    } finally {
      setPendiente(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Asignar responsable</DialogTitle>
        <DialogDescription>
          <span className="font-mono text-xs">{actividad.tipo.codigo}</span> · {actividad.descripcion}
        </DialogDescription>
      </DialogHeader>

      {!permitido ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3.5 text-sm">
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Operación no permitida: solo se puede asignar un responsable mientras la actividad está Pendiente.
        </p>
      ) : participantes.length === 0 ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3.5 text-sm">
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Este proyecto no tiene miembros del equipo que puedan ser responsables.
        </p>
      ) : (
        <fieldset disabled={pendiente} className="min-w-0 space-y-2">
          <Label id="ar-etiqueta">Miembros participantes del proyecto</Label>
          <RadioGroup
            aria-labelledby="ar-etiqueta"
            value={elegido}
            onValueChange={(v) => {
              setElegido(v);
              setError(null);
            }}
          >
            {participantes.map((p) => (
              <Label
                key={p.usuarioId}
                htmlFor={`ar-${p.usuarioId}`}
                className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50 has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
              >
                <RadioGroupItem id={`ar-${p.usuarioId}`} value={p.usuarioId} />
                <Responsable nombre={p.nombre} />
              </Label>
            ))}
          </RadioGroup>
          {intentado && !elegido ? <FieldError>Elige un miembro del proyecto.</FieldError> : null}
          <p className="text-xs text-muted-foreground">
            La asignación no cambia el estado: la actividad sigue Pendiente hasta que el responsable la inicie.
          </p>
        </fieldset>
      )}

      {error ? <ErrorAccion error={error} /> : null}

      <DialogFooter>
        <Button variant="outline" onClick={onCancelar}>
          {permitido ? "Cancelar" : "Cerrar"}
        </Button>
        {permitido && participantes.length > 0 ? (
          <Button disabled={pendiente} onClick={asignar}>
            {pendiente ? "Asignando…" : "Asignar"}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}
