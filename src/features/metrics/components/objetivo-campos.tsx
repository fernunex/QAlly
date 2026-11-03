"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TipoMetrica } from "@/lib/domain";
import { validarObjetivo } from "@/features/metrics/lib/calculo";

export type ObjetivosTexto = { objetivo: string; critico: string };
export type ErroresObjetivo = { objetivo?: string; critico?: string };

export function validarObjetivos(tipo: TipoMetrica, v: ObjetivosTexto): ErroresObjetivo {
  const e: ErroresObjetivo = {};
  const o = validarObjetivo(tipo.unidad, v.objetivo);
  if (o) e.objetivo = o;
  if (tipo.objetivoCriticoInicial !== null) {
    const c = validarObjetivo(tipo.unidad, v.critico, true);
    if (c) e.critico = c;
  }
  return e;
}

/** Campos de objetivo del tipo (M-01 añade el objetivo de flujos críticos). */
export function ObjetivoCampos({
  tipo,
  valores,
  errores,
  onChange,
  idBase,
}: {
  tipo: TipoMetrica;
  valores: ObjetivosTexto;
  errores: ErroresObjetivo;
  onChange: (v: ObjetivosTexto) => void;
  idBase: string;
}) {
  const unidad = tipo.unidad === "%" ? "%" : "defectos";
  const critico = tipo.objetivoCriticoInicial !== null;
  const rango = tipo.unidad === "%" ? "Entre 0 y 100, hasta 4 decimales." : "Entero entre 0 y 2 000 000 000.";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errores.objetivo}>
        <FieldLabel htmlFor={`${idBase}-obj`}>{critico ? "Objetivo general" : "Objetivo"}</FieldLabel>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">{tipo.comparador}</span>
          <Input
            id={`${idBase}-obj`}
            inputMode="decimal"
            className="tabular-nums"
            value={valores.objetivo}
            aria-invalid={!!errores.objetivo}
            onChange={(e) => onChange({ ...valores, objetivo: e.target.value })}
          />
          <span className="text-sm text-muted-foreground">{unidad}</span>
        </div>
        {errores.objetivo ? <FieldError>{errores.objetivo}</FieldError> : <FieldDescription>{rango}</FieldDescription>}
      </Field>
      {critico ? (
        <Field data-invalid={!!errores.critico}>
          <FieldLabel htmlFor={`${idBase}-crit`}>Objetivo de flujos críticos</FieldLabel>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground tabular-nums">{tipo.comparador}</span>
            <Input
              id={`${idBase}-crit`}
              inputMode="decimal"
              className="tabular-nums"
              value={valores.critico}
              aria-invalid={!!errores.critico}
              onChange={(e) => onChange({ ...valores, critico: e.target.value })}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          {errores.critico ? <FieldError>{errores.critico}</FieldError> : <FieldDescription>{rango}</FieldDescription>}
        </Field>
      ) : null}
    </div>
  );
}
