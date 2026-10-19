"use client";

import { useId, useState } from "react";
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
import type { Medicion, MetricaVista } from "@/lib/domain";
import { formatFecha } from "@/lib/format";
import {
  MAX_FUENTE,
  calcularVistaPrevia,
  seraVigente,
  validarDatosFuente,
  validarFuente,
  type DatosTexto,
} from "@/features/metrics/lib/calculo";
import { valorActualTexto } from "@/features/metrics/lib/formato";

/** Fecha local de hoy como AAAA-MM-DD; solo se invoca al abrir el diálogo (interacción, no render del servidor). */
function hoy() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * CU-02 SF-02 Registrar medición (medicion = null) y SF-04 Corregir medición.
 * En corregir la fecha de medición es fija.
 */
export function MedicionDialog({
  metrica,
  medicion,
  onOpenChange,
}: {
  metrica: MetricaVista;
  medicion: Medicion | null;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const { tipo } = metrica;
  const corrigiendo = medicion !== null;
  const actual = medicion?.revisiones[medicion.revisiones.length - 1];

  const [datos, setDatos] = useState<DatosTexto>(() =>
    Object.fromEntries(tipo.campos.map((c) => [c.clave, actual ? String(actual.datosFuente[c.clave] ?? "") : ""])),
  );
  const [fecha, setFecha] = useState(() => (medicion ? medicion.medidaEn : hoy()));
  const [fuente, setFuente] = useState(actual?.fuenteReferencia ?? "");
  const [intentado, setIntentado] = useState(false);

  const erroresDatos = validarDatosFuente(tipo.codigo, tipo.campos, datos);
  const errorFuente = validarFuente(fuente);
  const errorFecha = !corrigiendo && !fecha ? "Indica la fecha de medición." : null;
  const hayErrores = Object.keys(erroresDatos).length > 0 || !!errorFuente || !!errorFecha;
  const vista = hayErrores && Object.keys(erroresDatos).length > 0 ? null : calcularVistaPrevia(tipo, datos);

  const verError = (clave: string) =>
    erroresDatos[clave] && (intentado || (datos[clave] ?? "") !== "") ? erroresDatos[clave] : undefined;

  function guardar() {
    setIntentado(true);
    if (hayErrores || !vista) return;
    const nuevo = vista.principal ?? "No evaluable";
    if (corrigiendo) {
      // TODO(funcionalidad): corregirMedicion(medicionId, revisionEsperada, datosFuente) — QA, proyecto abierto; manejar CONFLICTO.
      const esVigente = metrica.medicionVigente?.id === medicion.id;
      toast.success(
        esVigente
          ? `Corrección guardada · valor actual ${nuevo}`
          : `Corrección guardada · el valor actual no cambia (${valorActualTexto(metrica)})`,
      );
    } else {
      // TODO(funcionalidad): registrarMedicion(medicionId, metricaProyectoId, medidaEn, datosFuente) — QA, proyecto abierto.
      toast.success(
        seraVigente(metrica, fecha)
          ? `Medición guardada · valor actual ${nuevo}`
          : `Medición guardada · el valor actual no cambia (${valorActualTexto(metrica)})`,
      );
    }
    onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {corrigiendo ? `Corregir medición del ${formatFecha(medicion.medidaEn)}` : "Registrar medición"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono">{tipo.codigo}</span> · {tipo.nombre}.{" "}
            {corrigiendo
              ? "Se conserva la captura anterior con autor y fecha; la fecha de medición no cambia."
              : "Una medición nueva no reemplaza las anteriores."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            {tipo.campos.map((c) => {
              const err = verError(c.clave);
              return (
                <Field key={c.clave} data-invalid={!!err}>
                  <FieldLabel htmlFor={`${id}-${c.clave}`}>{c.etiqueta}</FieldLabel>
                  <Input
                    id={`${id}-${c.clave}`}
                    inputMode="numeric"
                    className="tabular-nums"
                    value={datos[c.clave] ?? ""}
                    aria-invalid={!!err}
                    onChange={(e) => setDatos({ ...datos, [c.clave]: e.target.value })}
                  />
                  {err ? <FieldError>{err}</FieldError> : null}
                </Field>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errorFecha && intentado}>
              <FieldLabel htmlFor={`${id}-fecha`}>Fecha de medición</FieldLabel>
              {corrigiendo ? (
                <p id={`${id}-fecha`} className="flex h-8 items-center text-sm tabular-nums">
                  {formatFecha(medicion.medidaEn)}
                </p>
              ) : (
                <Input
                  id={`${id}-fecha`}
                  type="date"
                  value={fecha}
                  aria-invalid={!!errorFecha && intentado}
                  onChange={(e) => setFecha(e.target.value)}
                />
              )}
              {errorFecha && intentado ? <FieldError>{errorFecha}</FieldError> : null}
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm leading-snug font-medium">Valor calculado</span>
              <div
                aria-live="polite"
                className="min-h-8 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-sm tabular-nums"
              >
                {vista === null ? (
                  <span className="text-muted-foreground">No disponible hasta corregir</span>
                ) : vista.principal === null ? (
                  <span className="text-muted-foreground">No evaluable: denominador 0</span>
                ) : (
                  <span className="font-semibold whitespace-nowrap">{vista.principal}</span>
                )}
                {vista?.criticas ? (
                  <span className="block text-xs whitespace-nowrap text-muted-foreground">
                    críticas: {vista.criticas}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <Field data-invalid={!!errorFuente && (intentado || fuente !== "")}>
            <FieldLabel htmlFor={`${id}-fuente`}>
              Fuente <span className="font-normal text-muted-foreground">(texto o URL, 1–{MAX_FUENTE} caracteres)</span>
            </FieldLabel>
            <Input
              id={`${id}-fuente`}
              value={fuente}
              aria-invalid={!!errorFuente && (intentado || fuente !== "")}
              placeholder="https://github.com/equipo/proyecto/pulls"
              onChange={(e) => setFuente(e.target.value)}
            />
            {errorFuente && (intentado || fuente !== "") ? (
              <FieldError>{errorFuente}</FieldError>
            ) : (
              <FieldDescription>Referencia de dónde salen los conteos; no es un archivo.</FieldDescription>
            )}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>{corrigiendo ? "Guardar corrección" : "Guardar medición"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
