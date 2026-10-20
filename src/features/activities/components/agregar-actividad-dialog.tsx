"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { agregarActividadAction } from "@/features/activities/actions";
import type { ActividadDetalle } from "@/features/activities/server/queries";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { ETAPAS } from "@/lib/catalogs";
import type { TipoActividad } from "@/lib/domain";
import type { ErrorPublico } from "@/lib/resultados";

/** CU-03 SF-01: agregar actividad del catálogo con descripción específica (QA, proyecto abierto). */
export function AgregarActividadDialog({
  proyectoId,
  tipos,
  open,
  onOpenChange,
  onAgregada,
}: {
  proyectoId: string;
  /** Tipos vigentes del catálogo, con IDs de BD. */
  tipos: TipoActividad[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgregada: (detalle: ActividadDetalle) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* El formulario se remonta al abrir para empezar limpio. */}
        {open ? (
          <Formulario
            proyectoId={proyectoId}
            tipos={tipos}
            onCancelar={() => onOpenChange(false)}
            onAgregada={onAgregada}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  proyectoId,
  tipos,
  onCancelar,
  onAgregada,
}: {
  proyectoId: string;
  tipos: TipoActividad[];
  onCancelar: () => void;
  onAgregada: (detalle: ActividadDetalle) => void;
}) {
  const router = useRouter();
  const [tipoId, setTipoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  // Respuesta ambigua: el alta pudo guardarse. No se reenvía sin recargar (contratos v1 §5).
  const [incierto, setIncierto] = useState(false);
  const tipo = tipos.find((t) => t.id === tipoId);

  const errores = {
    tipo: !tipoId ? "Elige un tipo de actividad del catálogo." : undefined,
    descripcion: !descripcion.trim()
      ? "La descripción es obligatoria."
      : [...descripcion.trim()].length > 5000
        ? "Máximo 5000 caracteres."
        : undefined,
  };
  const mostrar = {
    tipo: (intentado && errores.tipo) || error?.campos?.tipoId,
    descripcion: (intentado && errores.descripcion) || error?.campos?.descripcion,
  };

  async function guardar() {
    if (pendiente || incierto) return;
    setIntentado(true);
    if (errores.tipo || errores.descripcion) return;
    setPendiente(true);
    setError(null);
    try {
      const r = await agregarActividadAction({ proyectoId, tipoId, descripcion });
      if (!r.ok) {
        if (r.error.codigo === "FALLO_PERSISTENCIA") setIncierto(true);
        setError(r.error);
        return;
      }
      onAgregada(r.datos);
    } catch {
      setIncierto(true);
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje: "No recibimos confirmación.",
      });
    } finally {
      setPendiente(false);
    }
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
      <fieldset disabled={pendiente || incierto} className="min-w-0">
        <FieldGroup>
          <Field data-invalid={!!mostrar.tipo}>
            <FieldLabel htmlFor="aa-tipo">Tipo de actividad</FieldLabel>
            <Select
              value={tipoId}
              onValueChange={(v) => {
                setTipoId(v);
                setError(null);
              }}
            >
              <SelectTrigger id="aa-tipo" className="w-full" aria-invalid={!!mostrar.tipo}>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {ETAPAS.map((etapa) => (
                  <SelectGroup key={etapa.codigo}>
                    <SelectLabel>{etapa.nombre}</SelectLabel>
                    {tipos
                      .filter((t) => t.etapaCodigo === etapa.codigo)
                      .map((t) => (
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
            <FieldError>{mostrar.tipo}</FieldError>
          </Field>
          <Field data-invalid={!!mostrar.descripcion}>
            <FieldLabel htmlFor="aa-descripcion">Descripción</FieldLabel>
            <Textarea
              id="aa-descripcion"
              rows={3}
              maxLength={5000}
              placeholder="Ej. Revisión del SDS — arquitectura de datos"
              value={descripcion}
              aria-invalid={!!mostrar.descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setError(null);
              }}
            />
            <FieldError>{mostrar.descripcion}</FieldError>
          </Field>
        </FieldGroup>
      </fieldset>
      {incierto ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          No recibimos confirmación y la actividad pudo haberse guardado. Recarga el listado para comprobarlo antes de
          volver a agregarla.
        </p>
      ) : error ? (
        <ErrorAccion error={error} />
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onCancelar}>
          {incierto ? "Cerrar" : "Cancelar"}
        </Button>
        {incierto ? (
          <Button
            onClick={() => {
              router.refresh();
              onCancelar();
            }}
          >
            Recargar listado
          </Button>
        ) : (
          <Button disabled={pendiente} onClick={guardar}>
            {pendiente ? "Agregando…" : "Agregar actividad"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
