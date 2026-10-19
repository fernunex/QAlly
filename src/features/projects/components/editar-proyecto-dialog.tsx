"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Proyecto } from "@/lib/domain";

export type DatosGenerales = Pick<
  Proyecto,
  "nombre" | "descripcion" | "periodoAcademico" | "fechaInicio" | "fechaFinPrevista"
>;

export function validarDatosGenerales(d: DatosGenerales): Partial<Record<keyof DatosGenerales, string>> {
  const errores: Partial<Record<keyof DatosGenerales, string>> = {};
  if (!d.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
  if (!d.descripcion.trim()) errores.descripcion = "La descripción es obligatoria.";
  if (!d.fechaInicio) errores.fechaInicio = "La fecha de inicio es obligatoria.";
  if ((d.periodoAcademico ?? "").length > 40) errores.periodoAcademico = "Máximo 40 caracteres.";
  if (d.fechaFinPrevista && d.fechaInicio && d.fechaFinPrevista < d.fechaInicio)
    errores.fechaFinPrevista = "El fin previsto no puede ser anterior al inicio.";
  return errores;
}

/** Campos generales compartidos por alta (CU-01 SF-01) y edición (SF-03). */
export function CamposGenerales({
  valores,
  onChange,
  errores,
}: {
  valores: DatosGenerales;
  onChange: (v: DatosGenerales) => void;
  errores: Partial<Record<keyof DatosGenerales, string>>;
}) {
  const set = <K extends keyof DatosGenerales>(k: K, v: DatosGenerales[K]) => onChange({ ...valores, [k]: v });
  return (
    <FieldGroup>
      <Field data-invalid={!!errores.nombre}>
        <FieldLabel htmlFor="pg-nombre">Nombre del proyecto</FieldLabel>
        <Input
          id="pg-nombre"
          value={valores.nombre}
          aria-invalid={!!errores.nombre}
          onChange={(e) => set("nombre", e.target.value)}
        />
        <FieldError>{errores.nombre}</FieldError>
      </Field>
      <Field data-invalid={!!errores.descripcion}>
        <FieldLabel htmlFor="pg-descripcion">Descripción</FieldLabel>
        <Textarea
          id="pg-descripcion"
          rows={3}
          value={valores.descripcion}
          aria-invalid={!!errores.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
        />
        <FieldError>{errores.descripcion}</FieldError>
      </Field>
      <Field data-invalid={!!errores.periodoAcademico}>
        <FieldLabel htmlFor="pg-periodo">
          Periodo académico <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <Input
          id="pg-periodo"
          maxLength={40}
          placeholder="Ago–Dic 2026"
          value={valores.periodoAcademico ?? ""}
          aria-invalid={!!errores.periodoAcademico}
          onChange={(e) => set("periodoAcademico", e.target.value || null)}
        />
        <FieldDescription>Informativo, hasta 40 caracteres.</FieldDescription>
        <FieldError>{errores.periodoAcademico}</FieldError>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errores.fechaInicio}>
          <FieldLabel htmlFor="pg-inicio">Fecha de inicio</FieldLabel>
          <Input
            id="pg-inicio"
            type="date"
            value={valores.fechaInicio}
            aria-invalid={!!errores.fechaInicio}
            onChange={(e) => set("fechaInicio", e.target.value)}
          />
          <FieldError>{errores.fechaInicio}</FieldError>
        </Field>
        <Field data-invalid={!!errores.fechaFinPrevista}>
          <FieldLabel htmlFor="pg-fin">
            Fin previsto <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <Input
            id="pg-fin"
            type="date"
            value={valores.fechaFinPrevista ?? ""}
            aria-invalid={!!errores.fechaFinPrevista}
            onChange={(e) => set("fechaFinPrevista", e.target.value || null)}
          />
          <FieldError>{errores.fechaFinPrevista}</FieldError>
        </Field>
      </div>
    </FieldGroup>
  );
}

/** CU-01 SF-03: editar información general (QA, proyecto abierto). */
export function EditarProyectoDialog({
  proyecto,
  open,
  onOpenChange,
}: {
  proyecto: Pick<Proyecto, "nombre" | "descripcion" | "periodoAcademico" | "fechaInicio" | "fechaFinPrevista">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [valores, setValores] = useState<DatosGenerales>(proyecto);
  const [intentado, setIntentado] = useState(false);
  const errores = intentado ? validarDatosGenerales(valores) : {};

  function guardar() {
    setIntentado(true);
    if (Object.keys(validarDatosGenerales(valores)).length > 0) return;
    // TODO(funcionalidad): editarProyecto con versionEsperada; manejar CONFLICTO.
    toast.success("Información general actualizada");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar información general</DialogTitle>
          <DialogDescription>
            Los cambios no afectan actividades, métricas ni evidencias del proyecto.
          </DialogDescription>
        </DialogHeader>
        <CamposGenerales valores={valores} onChange={setValores} errores={errores} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
