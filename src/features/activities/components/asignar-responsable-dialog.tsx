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
import { Responsable } from "@/features/activities/components/responsable-avatar";
import type { Actividad } from "@/lib/domain";

export type Participante = { usuarioId: string; nombre: string };

/** CU-03 SF-03: asignar responsable a una actividad Pendiente (QA, proyecto abierto). */
export function AsignarResponsableDialog({
  actividad,
  participantes,
  onOpenChange,
  onAsignar,
}: {
  /** null = cerrado. */
  actividad: Actividad | null;
  participantes: Participante[];
  onOpenChange: (open: boolean) => void;
  onAsignar: (actividadId: string, usuarioId: string) => void;
}) {
  return (
    <Dialog open={actividad !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {actividad ? (
          <Contenido
            key={actividad.id}
            actividad={actividad}
            participantes={participantes}
            onCancelar={() => onOpenChange(false)}
            onAsignar={onAsignar}
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
  onAsignar,
}: {
  actividad: Actividad;
  participantes: Participante[];
  onCancelar: () => void;
  onAsignar: (actividadId: string, usuarioId: string) => void;
}) {
  const [elegido, setElegido] = useState(actividad.responsable?.usuarioId ?? "");
  const [intentado, setIntentado] = useState(false);
  const permitido = actividad.estado === "Pendiente";

  return (
    <>
      <DialogHeader>
        <DialogTitle>Asignar responsable</DialogTitle>
        <DialogDescription>
          <span className="font-mono text-xs">{actividad.tipo.codigo}</span> · {actividad.descripcion}
        </DialogDescription>
      </DialogHeader>

      {permitido ? (
        <div className="space-y-2">
          <Label id="ar-etiqueta">Miembros participantes del proyecto</Label>
          <RadioGroup aria-labelledby="ar-etiqueta" value={elegido} onValueChange={setElegido}>
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
        </div>
      ) : (
        <p role="alert" className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3.5 text-sm">
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Operación no permitida: solo se puede asignar un responsable mientras la actividad está Pendiente.
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancelar}>
          {permitido ? "Cancelar" : "Cerrar"}
        </Button>
        {permitido ? (
          <Button
            onClick={() => {
              setIntentado(true);
              if (elegido) onAsignar(actividad.id, elegido);
            }}
          >
            Asignar
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}
