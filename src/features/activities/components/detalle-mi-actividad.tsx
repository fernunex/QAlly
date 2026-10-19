"use client";

import { useRef, useState } from "react";
import { LockIcon, PlayIcon, SendIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Evidencia } from "@/lib/domain";
import { formatFecha } from "@/lib/format";
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

type Props = {
  actividad: MiActividad | null;
  nombres: Nombres;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIniciar: (id: string) => void;
  onGuardar: (id: string, resultado: string, evidencias: Evidencia[]) => void;
  onEnviar: (id: string, resultado: string, evidencias: Evidencia[]) => void;
};

/** CU-04: detalle de la actividad asignada, en Sheet derecho con footer fijo. */
export function DetalleMiActividad({ actividad, open, onOpenChange, ...acciones }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {actividad ? <Contenido key={actividad.id} actividad={actividad} {...acciones} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function Contenido({
  actividad,
  nombres,
  onIniciar,
  onGuardar,
  onEnviar,
}: Omit<Props, "actividad" | "open" | "onOpenChange"> & { actividad: MiActividad }) {
  const borrador = intentoEnPreparacion(actividad);
  const [resultado, setResultado] = useState(borrador?.resultado ?? "");
  const [evidencias, setEvidencias] = useState<Evidencia[]>(borrador?.evidencias ?? []);
  const [errores, setErrores] = useState<{ resultado?: string; evidencia?: string }>({});
  const contador = useRef(0);
  const nuevoId = () => `local-${++contador.current}`;

  const enviados = intentosEnviados(actividad);
  const devolucion = ultimaDevolucion(actividad);
  const editable = actividad.estado === "En progreso" && !actividad.proyectoCerrado;
  const numeroBorrador = borrador?.numeroIntento ?? enviados.length + 1;
  const ultimoEnviado = enviados[0];

  function enviar() {
    const nuevos = {
      resultado: resultado.trim() ? undefined : ERR_FALTA_RESULTADO,
      evidencia: evidencias.length === 0 ? ERR_FALTA_EVIDENCIA : undefined,
    };
    setErrores(nuevos);
    if (nuevos.resultado || nuevos.evidencia) return;
    onEnviar(actividad.id, resultado, evidencias);
    toast.success("Actividad enviada a revisión");
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

        {estaDevuelta(actividad) && devolucion?.revision?.observaciones ? (
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

        {editable ? (
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
                className="bg-background"
                value={resultado}
                aria-invalid={!!errores.resultado}
                onChange={(e) => setResultado(e.target.value)}
              />
              <FieldError>{errores.resultado}</FieldError>
            </Field>
            <EvidenciasEditor
              evidencias={evidencias}
              onChange={setEvidencias}
              error={errores.evidencia}
              nuevoId={nuevoId}
            />
          </section>
        ) : null}
      </div>

      {actividad.estado === "Pendiente" && !actividad.proyectoCerrado ? (
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            onClick={() => {
              // TODO(funcionalidad): iniciarActividad con versionEsperada (contratos-v1 §5).
              onIniciar(actividad.id);
              toast.success("Actividad iniciada");
            }}
          >
            <PlayIcon />
            Iniciar actividad
          </Button>
        </SheetFooter>
      ) : null}

      {editable ? (
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              // TODO(funcionalidad): guardarBorradorEntrega (contratos-v1 §5).
              onGuardar(actividad.id, resultado, evidencias);
              toast.success("Resultado guardado");
            }}
          >
            Guardar resultado
          </Button>
          <Button onClick={enviar}>
            {/* TODO(funcionalidad): enviarEntrega con versionEsperada; confirma recién al guardar. */}
            <SendIcon />
            Enviar a revisión
          </Button>
        </SheetFooter>
      ) : null}
    </>
  );
}
