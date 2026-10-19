"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { erroresGenerales } from "../validation";
import { editarProyectoAction } from "../actions";
import { ErrorAccion } from "./error-accion";
import type { ErrorPublico } from "@/lib/resultados";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Proyecto } from "@/lib/domain";

export type DatosGenerales = Pick<
  Proyecto,
  | "nombre"
  | "descripcion"
  | "periodoAcademico"
  | "fechaInicio"
  | "fechaFinPrevista"
>;

export function validarDatosGenerales(
  d: DatosGenerales,
): Partial<Record<keyof DatosGenerales, string>> {
  return erroresGenerales(d);
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
  const set = <K extends keyof DatosGenerales>(k: K, v: DatosGenerales[K]) =>
    onChange({ ...valores, [k]: v });
  return (
    <FieldGroup>
      <Field data-invalid={!!errores.nombre}>
        <FieldLabel htmlFor="pg-nombre">Nombre del proyecto</FieldLabel>
        <Input
          id="pg-nombre"
          maxLength={200}
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
          maxLength={5000}
          rows={3}
          value={valores.descripcion}
          aria-invalid={!!errores.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
        />
        <FieldError>{errores.descripcion}</FieldError>
      </Field>
      <Field data-invalid={!!errores.periodoAcademico}>
        <FieldLabel htmlFor="pg-periodo">
          Periodo académico{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
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
            Fin previsto{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
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
  proyecto: Pick<
    Proyecto,
    | "id"
    | "version"
    | "nombre"
    | "descripcion"
    | "periodoAcademico"
    | "fechaInicio"
    | "fechaFinPrevista"
  >;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<DatosGenerales>(() => ({
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion,
    periodoAcademico: proyecto.periodoAcademico,
    fechaInicio: proyecto.fechaInicio,
    fechaFinPrevista: proyecto.fechaFinPrevista,
  }));
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  const [intentado, setIntentado] = useState(false);
  const errores = {
    ...(intentado ? validarDatosGenerales(valores) : {}),
    ...error?.campos,
  };

  async function guardar() {
    if (pendiente) return;
    setIntentado(true);
    if (Object.keys(validarDatosGenerales(valores)).length > 0) return;
    setPendiente(true);
    setError(null);
    try {
      const r = await editarProyectoAction({
        ...valores,
        proyectoId: proyecto.id,
        versionEsperada: proyecto.version,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast.success("Información general actualizada");
      onOpenChange(false);
      router.refresh();
    } catch {
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje:
          "No recibimos confirmación. Recarga para comprobar los datos guardados.",
      });
    } finally {
      setPendiente(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar información general</DialogTitle>
          <DialogDescription>
            Los cambios no afectan actividades, métricas ni evidencias del
            proyecto.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={pendiente}>
          <CamposGenerales
            valores={valores}
            onChange={(v) => {
              setValores(v);
              setError(null);
            }}
            errores={errores}
          />
        </fieldset>
        {error ? <ErrorAccion error={error} /> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={pendiente} onClick={guardar}>
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
