"use client";

import { useState } from "react";
import { FilePenLineIcon, LockIcon, PlayIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { AvisoSoloLectura } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatFecha } from "@/lib/format";
import type { ErrorPublico, Resultado } from "@/lib/resultados";
import { StepperEstado } from "@/features/activities/components/stepper-estado";
import {
  type MiActividad,
  type Nombres,
  estaDevuelta,
  intentoEnPreparacion,
  intentosEnviados,
  ultimaDevolucion,
  nombreDe,
} from "@/features/activities/utils";
import { IntentoCard, ObservacionesQA } from "@/features/evidences/components/intento-card";
import {
  ERR_FALTA_EVIDENCIA,
  ERR_FALTA_RESULTADO,
  EvidenciasEditor,
} from "@/features/evidences/components/evidencias-editor";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import {
  agregarEnlaceAction,
  enviarEntregaAction,
  guardarResultadoAction,
  iniciarActividadAction,
  prepararEntregaAction,
  quitarEvidenciaAction,
  type ActividadActualizada,
} from "@/features/evidences/actions";

type Props = {
  actividad: MiActividad | null;
  nombres: Nombres;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recibe la actividad confirmada por el servidor tras cada guardado. */
  onActualizada: (datos: ActividadActualizada) => void;
};

/** Transferencia individual de un PDF al Route Handler (contratos-v1 §5). */
async function subirPdf(
  entregaId: string,
  versionEsperada: string,
  archivo: File,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const r = await fetch(`/api/entregas/${entregaId}/evidencias/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "X-Nombre-Archivo": encodeURIComponent(archivo.name),
        "X-Version-Actividad": versionEsperada,
      },
      body: archivo,
    });
    return (await r.json()) as Resultado<ActividadActualizada>;
  } catch {
    // Resultado desconocido: no se presenta como guardado; recargar muestra el estado real.
    return {
      ok: false,
      error: {
        codigo: "FALLO_PERSISTENCIA",
        mensaje: "No pudimos confirmar la subida del PDF. Recarga para ver si quedó adjunto.",
      },
    };
  }
}

/** CU-04: detalle de la actividad asignada, en Sheet derecho con footer fijo. */
export function DetalleMiActividad({ actividad, open, onOpenChange, ...acciones }: Props) {
  const borrador = actividad ? intentoEnPreparacion(actividad) : undefined;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {actividad ? (
          // Un intento nuevo (o copiado tras devolución) reinicia el formulario con sus datos.
          <Contenido key={`${actividad.id}:${borrador?.id ?? "-"}`} actividad={actividad} {...acciones} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Contenido({
  actividad,
  nombres,
  onActualizada,
}: Omit<Props, "actividad" | "open" | "onOpenChange"> & { actividad: MiActividad }) {
  const borrador = intentoEnPreparacion(actividad);
  const [resultado, setResultado] = useState(borrador?.resultado ?? "");
  const [errores, setErrores] = useState<{ resultado?: string; evidencia?: string }>({});
  const [error, setError] = useState<ErrorPublico | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviados = intentosEnviados(actividad);
  const devolucion = ultimaDevolucion(actividad);
  const devuelta = estaDevuelta(actividad);
  const editable = actividad.estado === "En progreso" && !actividad.proyectoCerrado;
  const numeroBorrador = borrador?.numeroIntento ?? (enviados[0]?.numeroIntento ?? 0) + 1;
  const ultimoEnviado = enviados[0];
  const resultadoGuardado = borrador?.resultado ?? "";
  const sinGuardar = resultado.trim() !== resultadoGuardado.trim();

  /** Ejecuta una operación y solo muestra éxito con la confirmación del servidor. */
  async function ejecutar(
    operacion: () => Promise<Resultado<ActividadActualizada>>,
    exito?: string,
  ): Promise<ActividadActualizada | null> {
    setOcupado(true);
    setError(null);
    try {
      const r = await operacion();
      if (!r.ok) {
        setError(r.error);
        setErrores({
          resultado: r.error.campos?.resultado,
          evidencia: r.error.campos?.evidencia ?? r.error.campos?.url,
        });
        return null;
      }
      onActualizada(r.datos);
      if (exito) toast.success(exito);
      return r.datos;
    } finally {
      setOcupado(false);
    }
  }

  async function guardar(): Promise<string | null> {
    if (!borrador) return null;
    const r = await ejecutar(
      () =>
        guardarResultadoAction({
          entregaId: borrador.id,
          resultado,
          versionEsperada: actividad.version,
        }),
      "Resultado guardado",
    );
    return r?.actividad.version ?? null;
  }

  async function enviar() {
    if (!borrador) return;
    // FE-02: indicar qué falta antes de llamar al servidor, que vuelve a validarlo.
    const nuevos = {
      resultado: resultado.trim() ? undefined : ERR_FALTA_RESULTADO,
      evidencia: borrador.evidencias.length === 0 ? ERR_FALTA_EVIDENCIA : undefined,
    };
    setErrores(nuevos);
    if (nuevos.resultado || nuevos.evidencia) return;
    let version: string | null = actividad.version;
    if (sinGuardar) version = await guardar();
    if (!version) return;
    const versionEsperada = version;
    await ejecutar(
      () => enviarEntregaAction({ entregaId: borrador.id, versionEsperada }),
      "Actividad enviada a revisión",
    );
  }

  async function operacionEvidencia(
    operacion: () => Promise<Resultado<ActividadActualizada>>,
    exito: string,
  ): Promise<string | null> {
    const r = await ejecutar(operacion, exito);
    if (r) setErrores((e) => ({ ...e, evidencia: undefined }));
    return null;
  }

  return (
    <>
      <SheetHeader className="gap-1 border-b p-4 pr-12">
        <p className="font-mono text-xs text-muted-foreground">
          {actividad.tipo.codigo} · {actividad.proyectoNombre} · {actividad.etapaNombre}
        </p>
        <SheetTitle className="text-lg leading-snug">{actividad.descripcion}</SheetTitle>
        <SheetDescription>
          {actividad.tipo.codigo} {actividad.tipo.nombre}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <StepperEstado estado={actividad.estado} />

        {actividad.proyectoCerrado ? <AvisoSoloLectura /> : null}

        {error ? <ErrorAccion error={error} /> : null}

        {devuelta && devolucion?.revision?.observaciones ? (
          <ObservacionesQA
            autor={nombreDe(nombres, devolucion.revision.qaId)}
            fecha={devolucion.revision.revisadaEn}
            texto={devolucion.revision.observaciones}
          />
        ) : null}

        {actividad.estado === "Pendiente" ? (
          <p className="rounded-lg border border-dashed p-3.5 text-sm text-muted-foreground">
            Esta actividad está pendiente. Al iniciarla pasa a En progreso y podrás registrar el resultado y adjuntar
            evidencia.
          </p>
        ) : null}

        {actividad.estado === "En revisión" && ultimoEnviado?.enviadaEn ? (
          <p className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3.5 text-sm text-muted-foreground">
            <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Solo lectura · enviada {formatFecha(ultimoEnviado.enviadaEn)}. QA decidirá si la aprueba o la devuelve con
            observaciones.
          </p>
        ) : null}

        {actividad.estado === "Aprobada" && ultimoEnviado?.revision ? (
          <p className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3.5 text-sm text-muted-foreground">
            <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Solo lectura · aprobada {formatFecha(ultimoEnviado.revision.revisadaEn)}. Una actividad aprobada no admite
            cambios.
          </p>
        ) : null}

        {editable && !borrador ? (
          <section
            aria-label={`Intento ${numeroBorrador} sin preparar`}
            className="space-y-3 rounded-lg border border-dashed p-3.5 text-sm"
          >
            <p className="text-muted-foreground">
              {devuelta
                ? `Para corregir la entrega prepara el intento ${numeroBorrador}: se copiarán el resultado y las evidencias del intento anterior para que los ajustes.`
                : `Prepara el intento ${numeroBorrador} para registrar el resultado y adjuntar evidencia.`}
            </p>
            <Button
              size="sm"
              disabled={ocupado}
              onClick={() =>
                void ejecutar(() =>
                  prepararEntregaAction({ actividadId: actividad.id, versionEsperada: actividad.version }),
                )
              }
            >
              {ocupado ? <Spinner /> : <FilePenLineIcon />}
              {devuelta ? "Corregir entrega" : "Registrar entrega"}
            </Button>
          </section>
        ) : null}

        {editable && borrador ? (
          <section
            aria-label={`Intento ${numeroBorrador} en preparación`}
            className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-3.5"
          >
            <h4 className="text-sm font-semibold">Intento {numeroBorrador} · en preparación</h4>
            <Field data-invalid={!!errores.resultado}>
              <FieldLabel htmlFor="mi-resultado">Resultado</FieldLabel>
              <Textarea
                id="mi-resultado"
                rows={5}
                maxLength={20000}
                className="bg-background"
                value={resultado}
                disabled={ocupado}
                aria-invalid={!!errores.resultado}
                onChange={(e) => setResultado(e.target.value)}
              />
              {sinGuardar ? (
                <p className="text-xs text-muted-foreground">Cambios sin guardar.</p>
              ) : null}
              <FieldError>{errores.resultado}</FieldError>
            </Field>
            <EvidenciasEditor
              evidencias={borrador.evidencias}
              error={errores.evidencia}
              deshabilitado={ocupado}
              onAgregarEnlace={async (url) => {
                const r = await ejecutar(
                  () =>
                    agregarEnlaceAction({ entregaId: borrador.id, url, versionEsperada: actividad.version }),
                  "Enlace agregado",
                );
                return r ? null : "No se agregó el enlace.";
              }}
              onAdjuntarPdf={(archivo) =>
                operacionEvidencia(() => subirPdf(borrador.id, actividad.version, archivo), "PDF adjuntado")
              }
              onQuitar={(evidenciaId) =>
                void operacionEvidencia(
                  () => quitarEvidenciaAction({ evidenciaId, versionEsperada: actividad.version }),
                  "Evidencia quitada",
                )
              }
            />
          </section>
        ) : null}

        {enviados.length > 0 ? (
          <div className="space-y-3">
            {enviados.map((e) => (
              <IntentoCard
                key={e.id}
                entrega={e}
                nombres={nombres}
                mostrarNotaInmutable={actividad.estado === "En progreso"}
              />
            ))}
          </div>
        ) : null}
      </div>

      {actividad.estado === "Pendiente" && !actividad.proyectoCerrado ? (
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            disabled={ocupado}
            onClick={() =>
              void ejecutar(
                () => iniciarActividadAction({ actividadId: actividad.id, versionEsperada: actividad.version }),
                "Actividad iniciada",
              )
            }
          >
            {ocupado ? <Spinner /> : <PlayIcon />}
            Iniciar actividad
          </Button>
        </SheetFooter>
      ) : null}

      {editable && borrador ? (
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={ocupado || !sinGuardar} onClick={() => void guardar()}>
            Guardar resultado
          </Button>
          <Button disabled={ocupado} onClick={() => void enviar()}>
            {ocupado ? <Spinner /> : <SendIcon />}
            Enviar a revisión
          </Button>
        </SheetFooter>
      ) : null}
    </>
  );
}
