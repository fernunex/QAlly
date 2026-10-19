"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { nombreEtapa } from "@/lib/catalogs";
import type { TipoMetrica } from "@/lib/domain";
import { useCatalogosProyecto } from "../catalogos-context";
import { cn } from "@/lib/utils";
import {
  idCampoMetrica,
  validarMetricas,
  type ConfigMetrica,
  type EstadoAsistente,
} from "./estado";

function CampoObjetivo({
  id,
  etiqueta,
  comparador,
  unidad,
  valor,
  error,
  onChange,
}: {
  id: string;
  etiqueta: string;
  comparador: string;
  unidad: string;
  valor: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const idError = `${id}-error`;
  return (
    <Field data-invalid={!!error} className="w-auto gap-1.5">
      <FieldLabel htmlFor={id} className="whitespace-nowrap">
        {etiqueta} {comparador}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          aria-invalid={!!error}
          aria-describedby={error ? idError : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 tabular-nums"
        />
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {unidad}
        </span>
      </div>
      <FieldError id={idError}>{error}</FieldError>
    </Field>
  );
}

function FilaMetrica({
  tipo,
  cfg,
  errores,
  onChange,
}: {
  tipo: TipoMetrica;
  cfg: ConfigMetrica;
  errores: Record<string, string>;
  onChange: (c: ConfigMetrica) => void;
}) {
  const idCheck = `metrica-${tipo.id}`;
  const idObj = idCampoMetrica(tipo.id, "objetivo");
  const idCrit = idCampoMetrica(tipo.id, "critico");
  return (
    <li className={cn("px-4 py-4", !cfg.activa && "bg-muted/40")}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={idCheck}
          className="mt-1"
          checked={cfg.activa}
          onCheckedChange={(v) => onChange({ ...cfg, activa: v === true })}
        />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1",
              !cfg.activa && "opacity-60",
            )}
          >
            <label
              htmlFor={idCheck}
              className="cursor-pointer text-sm font-semibold"
            >
              <span className="font-mono text-xs whitespace-nowrap">
                {tipo.codigo}
              </span>{" "}
              · {tipo.nombre}
            </label>
            <Badge variant="outline">
              Etapa: {nombreEtapa(tipo.etapaCodigo)}
            </Badge>
          </div>
          <p
            className={cn(
              "mt-1 text-sm text-muted-foreground",
              !cfg.activa && "opacity-60",
            )}
          >
            Valor = {tipo.formula}
            {!cfg.activa
              ? ` · objetivo inicial ${tipo.comparador} ${tipo.objetivoInicial} ${tipo.unidad === "%" ? "%" : tipo.unidad}`
              : null}
          </p>
          {cfg.activa ? (
            <div className="mt-3 flex flex-wrap items-start gap-x-8 gap-y-3">
              <CampoObjetivo
                id={idObj}
                etiqueta={
                  tipo.objetivoCriticoInicial !== null
                    ? "Objetivo general"
                    : "Objetivo"
                }
                comparador={tipo.comparador}
                unidad={tipo.unidad}
                valor={cfg.objetivo}
                error={errores[idObj]}
                onChange={(objetivo) => onChange({ ...cfg, objetivo })}
              />
              {tipo.objetivoCriticoInicial !== null ? (
                <CampoObjetivo
                  id={idCrit}
                  etiqueta="Objetivo pruebas críticas"
                  comparador={tipo.comparador}
                  unidad={tipo.unidad}
                  valor={cfg.critico}
                  error={errores[idCrit]}
                  onChange={(critico) => onChange({ ...cfg, critico })}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function PasoMetricas({
  estado,
  onChange,
}: {
  estado: EstadoAsistente;
  onChange: (e: EstadoAsistente) => void;
}) {
  const { metricas: TIPOS_METRICA } = useCatalogosProyecto();
  const errores = validarMetricas(estado.metricas, TIPOS_METRICA);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Las cuatro métricas son de la etapa Desarrollo y se capturan
        manualmente. No se pueden crear métricas nuevas ni editar fórmulas. Un
        tipo de métrica se usa una sola vez por proyecto.
      </p>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {TIPOS_METRICA.map((t) => (
          <FilaMetrica
            key={t.id}
            tipo={t}
            cfg={estado.metricas[t.id]!}
            errores={errores}
            onChange={(c) =>
              onChange({
                ...estado,
                metricas: { ...estado.metricas, [t.id]: c },
              })
            }
          />
        ))}
      </ul>
    </div>
  );
}
