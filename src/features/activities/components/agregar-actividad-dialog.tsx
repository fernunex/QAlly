"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ETAPAS, TIPOS_ACTIVIDAD } from "@/lib/catalogs";

/** CU-03 SF-01: agregar actividad del catálogo con descripción específica (QA, proyecto abierto). */
export function AgregarActividadDialog({
  open,
  onOpenChange,
  onAgregar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgregar: (tipoId: string, descripcion: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* El formulario se remonta al abrir para empezar limpio. */}
        {open ? <Formulario onCancelar={() => onOpenChange(false)} onAgregar={onAgregar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  onCancelar,
  onAgregar,
}: {
  onCancelar: () => void;
  onAgregar: (tipoId: string, descripcion: string) => void;
}) {
  const [tipoId, setTipoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [intentado, setIntentado] = useState(false);
  const tipo = TIPOS_ACTIVIDAD.find((t) => t.id === tipoId);

  const errores = {
    tipo: !tipoId ? "Elige un tipo de actividad del catálogo." : undefined,
    descripcion: !descripcion.trim() ? "La descripción es obligatoria." : undefined,
  };

  function guardar() {
    setIntentado(true);
    if (errores.tipo || errores.descripcion) return;
    onAgregar(tipoId, descripcion.trim());
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar actividad</DialogTitle>
        <DialogDescription>
          Elige una actividad del catálogo y describe cómo se aplica en este proyecto. Se crea en estado Pendiente y un
          mismo tipo puede repetirse.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={intentado && !!errores.tipo}>
          <FieldLabel htmlFor="aa-tipo">Tipo de actividad</FieldLabel>
          <Select value={tipoId} onValueChange={setTipoId}>
            <SelectTrigger id="aa-tipo" className="w-full" aria-invalid={intentado && !!errores.tipo}>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {ETAPAS.map((etapa) => (
                <SelectGroup key={etapa.codigo}>
                  <SelectLabel>{etapa.nombre}</SelectLabel>
                  {TIPOS_ACTIVIDAD.filter((t) => t.etapaCodigo === etapa.codigo).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.codigo} · {t.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {tipo ? (
            <FieldDescription className="text-xs">Criterio de aprobación: {tipo.criterio}</FieldDescription>
          ) : null}
          {intentado ? <FieldError>{errores.tipo}</FieldError> : null}
        </Field>
        <Field data-invalid={intentado && !!errores.descripcion}>
          <FieldLabel htmlFor="aa-descripcion">Descripción</FieldLabel>
          <Textarea
            id="aa-descripcion"
            rows={3}
            placeholder="Ej. Revisión del SDS — arquitectura de datos"
            value={descripcion}
            aria-invalid={intentado && !!errores.descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          {intentado ? <FieldError>{errores.descripcion}</FieldError> : null}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={guardar}>Agregar actividad</Button>
      </DialogFooter>
    </>
  );
}
