"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ETAPAS } from "@/lib/catalogs";
import { useCatalogosProyecto } from "../catalogos-context";
import { cn } from "@/lib/utils";
import type { EstadoAsistente } from "./estado";

export function PasoActividades({
  estado,
  onChange,
}: {
  estado: EstadoAsistente;
  onChange: (e: EstadoAsistente) => void;
}) {
  const { actividades: TIPOS_ACTIVIDAD } = useCatalogosProyecto();
  function alternar(id: string, marcado: boolean) {
    onChange({
      ...estado,
      actividades: marcado
        ? [...estado.actividades, id]
        : estado.actividades.filter((a) => a !== id),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {ETAPAS.map((etapa) => {
        const tipos = TIPOS_ACTIVIDAD.filter(
          (t) => t.etapaCodigo === etapa.codigo,
        );
        const elegidas = tipos.filter((t) =>
          estado.actividades.includes(t.id),
        ).length;
        return (
          <fieldset key={etapa.codigo} className="min-w-0">
            <legend className="mb-2 flex w-full items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                {etapa.orden}. {etapa.nombre}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {elegidas} de {tipos.length}
              </span>
            </legend>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {tipos.map((t) => {
                const marcada = estado.actividades.includes(t.id);
                const id = `actividad-${t.id}`;
                return (
                  <li key={t.id}>
                    <label
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40",
                        !marcada && "text-muted-foreground",
                      )}
                    >
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={marcada}
                        onCheckedChange={(v) => alternar(t.id, v === true)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono text-xs font-medium whitespace-nowrap">
                            {t.codigo}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              marcada && "text-foreground",
                            )}
                          >
                            {t.nombre}
                          </span>
                          {t.inicial ? (
                            <Badge variant="outline">Sugerida</Badge>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Evidencia admisible: {t.evidencia}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}
