"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nombreEtapa } from "@/lib/catalogs";
import type { TipoMetrica } from "@/lib/domain";
import type { ErrorPublico } from "@/lib/resultados";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { agregarMetricaAction } from "@/features/metrics/actions";
import type { MetricaProyecto } from "@/features/metrics/types";
import {
  ObjetivoCampos,
  validarObjetivos,
  type ObjetivosTexto,
} from "@/features/metrics/components/objetivo-campos";

function iniciales(t: TipoMetrica): ObjetivosTexto {
  return { objetivo: t.objetivoInicial, critico: t.objetivoCriticoInicial ?? "" };
}

/** CU-02 · Agregar métrica: solo tipos del catálogo aún no configurados en el proyecto. */
export function AgregarMetricaDialog({
  proyectoId,
  disponibles,
  open,
  onOpenChange,
  onAgregada,
}: {
  proyectoId: string;
  disponibles: TipoMetrica[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgregada: (metrica: MetricaProyecto) => void;
}) {
  const id = useId();
  const [tipoId, setTipoId] = useState<string>(disponibles[0]?.id ?? "");
  const tipo = disponibles.find((t) => t.id === tipoId) ?? disponibles[0];
  const [valores, setValores] = useState<ObjetivosTexto>(tipo ? iniciales(tipo) : { objetivo: "", critico: "" });
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);

  if (!tipo) return null;
  const errores = intentado ? validarObjetivos(tipo, valores) : {};

  function elegir(id: string) {
    const t = disponibles.find((x) => x.id === id);
    if (!t) return;
    setTipoId(id);
    setValores(iniciales(t));
    setIntentado(false);
  }

  async function guardar() {
    if (!tipo || enviando) return;
    setIntentado(true);
    if (Object.keys(validarObjetivos(tipo, valores)).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await agregarMetricaAction({
        proyectoId,
        tipoId: tipo.id,
        objetivo: valores.objetivo,
        objetivoCritico: tipo.objetivoCriticoInicial !== null ? valores.critico : null,
      });
      if (!r.ok) return setError(r.error);
      onAgregada(r.datos);
    } catch {
      // Un reintento no duplica: el tipo es único por proyecto y se informaría como ya configurado.
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje: "No recibimos la confirmación. Recarga para comprobar si la métrica se agregó.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar métrica</DialogTitle>
          <DialogDescription>
            Solo aparecen los tipos del catálogo que aún no están configurados en este proyecto.
          </DialogDescription>
        </DialogHeader>
        {error ? <ErrorAccion error={error} /> : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-tipo`}>Tipo de métrica</FieldLabel>
            <Select value={tipo.id} onValueChange={elegir}>
              <SelectTrigger id={`${id}-tipo`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {disponibles.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.codigo} · {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">Etapa: {nombreEtapa(tipo.etapaCodigo)}</p>
            <p className="font-mono text-xs break-words">{tipo.formula}</p>
          </div>
          <ObjetivoCampos
            idBase={id}
            tipo={tipo}
            valores={valores}
            errores={errores}
            onChange={setValores}
          />
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={enviando}>
            {enviando ? "Agregando…" : "Agregar métrica"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
