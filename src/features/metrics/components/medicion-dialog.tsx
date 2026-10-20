"use client";

import { useId, useRef, useState } from "react";
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
import { formatFecha } from "@/lib/format";
import type { ErrorPublico } from "@/lib/resultados";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { corregirMedicionAction, registrarMedicionAction } from "@/features/metrics/actions";
import {
  MAX_FUENTE,
  calcularVistaPrevia,
  validarDatosFuente,
  validarFuente,
  type DatosTexto,
} from "@/features/metrics/lib/calculo";
import { valorActualTexto } from "@/features/metrics/lib/formato";
import type { Medicion, MetricaProyecto } from "@/features/metrics/types";

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
  esVigente,
  onOpenChange,
  onGuardada,
}: {
  metrica: MetricaProyecto;
  medicion: Medicion | null;
  /** La medición a corregir es la actual (primera del historial). */
  esVigente: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardada: (metrica: MetricaProyecto) => void;
}) {
  const id = useId();
  const { tipo } = metrica;
  const corrigiendo = medicion !== null;
  const actual = medicion?.revision;

  const [datos, setDatos] = useState<DatosTexto>(() =>
    Object.fromEntries(tipo.campos.map((c) => [c.clave, actual ? String(actual.datosFuente[c.clave] ?? "") : ""])),
  );
  const [fecha, setFecha] = useState(() => (medicion ? medicion.medidaEn.slice(0, 10) : hoy()));
  const [fuente, setFuente] = useState(actual?.fuenteReferencia ?? "");
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  // Respuesta incierta: se conservan identidad y datos para reintentar sin duplicar.
  const [ambiguo, setAmbiguo] = useState(false);
  // medicionId estable del formulario: se genera en el primer envío y se reutiliza en reintentos (ADR-002).
  const medicionId = useRef<string | null>(null);

  const erroresDatos = validarDatosFuente(tipo.codigo, tipo.campos, datos);
  const errorFuente = validarFuente(fuente);
  const errorFecha = !corrigiendo && !fecha ? "Indica la fecha de medición." : null;
  const hayErrores = Object.keys(erroresDatos).length > 0 || !!errorFuente || !!errorFecha;
  const vista = hayErrores && Object.keys(erroresDatos).length > 0 ? null : calcularVistaPrevia(tipo, datos);
  const bloqueado = enviando || ambiguo;

  const verError = (clave: string) =>
    erroresDatos[clave] && (intentado || (datos[clave] ?? "") !== "") ? erroresDatos[clave] : undefined;

  async function guardar() {
    setIntentado(true);
    if (enviando || hayErrores || !vista) return;
    setEnviando(true);
    setError(null);
    try {
      const conteos = Object.fromEntries(tipo.campos.map((c) => [c.clave, datos[c.clave] ?? ""]));
      let r;
      if (corrigiendo) {
        r = await corregirMedicionAction({
          medicionId: medicion.id,
          revisionEsperada: medicion.revision.numero,
          conteos,
          fuenteReferencia: fuente,
        });
      } else {
        medicionId.current ??= crypto.randomUUID();
        r = await registrarMedicionAction({
          medicionId: medicionId.current,
          metricaProyectoId: metrica.id,
          medidaEn: fecha,
          conteos,
          fuenteReferencia: fuente,
        });
      }
      if (!r.ok) {
        setError(r.error);
        // Sin respuesta definitiva del registro: se reintenta con la misma identidad y los mismos datos.
        setAmbiguo(!corrigiendo && r.error.codigo === "FALLO_PERSISTENCIA");
        return;
      }
      const m = r.datos.metrica;
      const cambiaActual = corrigiendo ? esVigente : m.medidaEn?.slice(0, 10) === fecha;
      const prefijo = corrigiendo
        ? "Corrección guardada"
        : r.datos.reutilizada
          ? "La medición ya estaba guardada; no se duplicó"
          : "Medición guardada";
      toast.success(
        cambiaActual
          ? `${prefijo} · valor actual ${valorActualTexto(m)}`
          : `${prefijo} · el valor actual no cambia (${valorActualTexto(m)})`,
      );
      onGuardada(m);
    } catch {
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje: corrigiendo
          ? "No recibimos la confirmación. Recarga para comprobar si la corrección se guardó."
          : "No recibimos la confirmación. Reintenta con los mismos datos.",
      });
      setAmbiguo(!corrigiendo);
    } finally {
      setEnviando(false);
    }
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
        {error ? <ErrorAccion error={error} /> : null}
        {ambiguo ? (
          <p role="status" className="text-sm">
            La respuesta es incierta. Se conservan los datos para reintentar sin duplicar la medición.
          </p>
        ) : null}
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
                    disabled={bloqueado}
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
                  disabled={bloqueado}
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
              disabled={bloqueado}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={enviando}>
            {enviando
              ? "Guardando…"
              : ambiguo
                ? "Reintentar registro"
                : corrigiendo
                  ? "Guardar corrección"
                  : "Guardar medición"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
