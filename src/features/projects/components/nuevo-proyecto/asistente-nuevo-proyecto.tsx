"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/shell/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCatalogosProyecto } from "../catalogos-context";
import { crearProyectoAction } from "../../actions";
import { ErrorAccion } from "../error-accion";
import type { ErrorPublico } from "@/lib/resultados";
import { PasosCompacto, PasosLista } from "./indicador-pasos";
import { PasoActividades } from "./paso-actividades";
import { PasoConfirmacion } from "./paso-confirmacion";
import { PasoGeneral } from "./paso-general";
import { PasoMetricas } from "./paso-metricas";
import {
  PASOS,
  erroresDelPaso,
  estadoInicial,
  type EstadoAsistente,
  type PasoId,
  type PersonaElegible,
} from "./estado";

const DESCRIPCIONES: Record<PasoId, string> = {
  1: "Captura los datos del proyecto y elige quiénes lo integran.",
  2: "Elige las actividades SQA con las que arranca el proyecto. Después podrás agregar más instancias desde Actividades SQA.",
  3: "Elige las métricas aplicables y define el objetivo de cada una. Los objetivos se pueden editar después.",
  4: "Revisa la configuración antes de registrar el proyecto.",
};

/** CU-01 SF-01 — Registrar proyecto (QA). Registro atómico e idempotente. */
export function AsistenteNuevoProyecto({
  creador,
  elegibles,
  siguienteCursor,
}: {
  creador: PersonaElegible;
  elegibles: PersonaElegible[];
  siguienteCursor: string | null;
}) {
  const catalogos = useCatalogosProyecto();
  const { actividades: TIPOS_ACTIVIDAD, metricas: TIPOS_METRICA } = catalogos;
  const [personas, setPersonas] = useState(elegibles);
  const onConocer = useCallback(
    (items: PersonaElegible[]) =>
      setPersonas((prev) => [
        ...new Map([...prev, ...items].map((p) => [p.id, p])).values(),
      ]),
    [],
  );
  const [error, setError] = useState<ErrorPublico | null>(null);
  const [ambiguo, setAmbiguo] = useState(false);
  const enCurso = useRef(false);
  const router = useRouter();
  // solicitudId estable: se genera en el primer envío y se reutiliza en reintentos (idempotencia de crearProyecto).
  const solicitudId = useRef<string | null>(null);
  const [inicial] = useState(() => estadoInicial(catalogos));
  const [estado, setEstado] = useState<EstadoAsistente>(inicial);
  const [paso, setPaso] = useState<PasoId>(1);
  const [maxVisto, setMaxVisto] = useState<PasoId>(1);
  const [intentados, setIntentados] = useState<Record<PasoId, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [cancelando, setCancelando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [foco, setFoco] = useState(0);
  const contenido = useRef<HTMLFieldSetElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  const sucio = JSON.stringify(estado) !== JSON.stringify(inicial);

  // Tras cambiar de paso o intentar avanzar: foco al primer campo inválido o al título del paso.
  useEffect(() => {
    if (foco === 0) return;
    const invalido = contenido.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    (invalido ?? titulo.current)?.focus();
  }, [foco]);

  function ir(p: PasoId) {
    setPaso(p);
    setMaxVisto((m) => (p > m ? p : m));
    setFoco((f) => f + 1);
    window.scrollTo({ top: 0 });
  }

  function continuar() {
    if (erroresDelPaso(paso, estado, TIPOS_METRICA) > 0) {
      setIntentados((i) => ({ ...i, [paso]: true }));
      setFoco((f) => f + 1);
      return;
    }
    ir((paso + 1) as PasoId);
  }

  async function registrar() {
    if (enCurso.current) return;
    const primerInvalido = ([1, 3] as PasoId[]).find(
      (p) => erroresDelPaso(p, estado, TIPOS_METRICA) > 0,
    );
    if (primerInvalido) {
      setIntentados((i) => ({ ...i, [primerInvalido]: true }));
      toast.error("Hay campos por corregir antes de registrar el proyecto.");
      ir(primerInvalido);
      setFoco((f) => f + 1);
      return;
    }
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    solicitudId.current ??= crypto.randomUUID();
    try {
      const r = await crearProyectoAction({
        solicitudId: solicitudId.current,
        ...estado.general,
        miembrosIds: estado.miembros,
        actividadesTiposIds: estado.actividades,
        metricas: TIPOS_METRICA.filter(
          (t) => estado.metricas[t.id]?.activa,
        ).map((t) => ({
          tipoId: t.id,
          objetivo: estado.metricas[t.id].objetivo,
          ...(t.objetivoCriticoInicial !== null
            ? { objetivoCritico: estado.metricas[t.id].critico }
            : {}),
        })),
      });
      if (!r.ok) {
        setError(r.error);
        setAmbiguo(r.error.codigo === "FALLO_PERSISTENCIA");
        return;
      }
      toast.success(`Proyecto «${r.datos.nombre}» registrado`);
      router.push(`/proyectos/${r.datos.id}`);
      router.refresh();
    } catch {
      setError({
        codigo: "FALLO_PERSISTENCIA",
        mensaje:
          "No recibimos la confirmación. Reintenta con los mismos datos.",
      });
      setAmbiguo(true);
    } finally {
      setEnviando(false);
      enCurso.current = false;
    }
  }

  function cancelar() {
    if (sucio) setCancelando(true);
    else router.push("/proyectos");
  }

  const nErrores = erroresDelPaso(paso, estado, TIPOS_METRICA);
  const mostrarErrores = paso === 3 || intentados[paso];
  const resumenPaso = (p: PasoId): string => {
    if (p === 1)
      return `${estado.miembros.length + 1} ${estado.miembros.length === 0 ? "participante" : "participantes"}`;
    if (p === 2)
      return `${estado.actividades.length} de ${TIPOS_ACTIVIDAD.length} seleccionadas`;
    if (p === 3) {
      const n = TIPOS_METRICA.filter(
        (t) => estado.metricas[t.id]?.activa,
      ).length;
      return `${n} de ${TIPOS_METRICA.length} seleccionadas`;
    }
    return "";
  };
  const resumenes = {
    1: resumenPaso(1),
    2: resumenPaso(2),
    3: resumenPaso(3),
    4: "",
  } as Record<PasoId, string>;
  const resumenBarra =
    paso === 1
      ? `${resumenPaso(1)}`
      : paso === 2
        ? `${estado.actividades.length} de ${TIPOS_ACTIVIDAD.length} actividades seleccionadas`
        : paso === 3
          ? `${resumenPaso(3).replace("seleccionadas", "métricas seleccionadas")}`
          : "Todo listo para registrar";
  const textoErrores =
    nErrores > 0 && mostrarErrores
      ? ` · corrige ${nErrores} ${nErrores === 1 ? "campo" : "campos"} para continuar`
      : "";

  return (
    <PageContainer>
      {error ? <ErrorAccion error={error} /> : null}
      {ambiguo ? (
        <p role="status" className="my-3 text-sm">
          La respuesta es incierta. Se conservan los datos y la solicitud para
          reintentar sin duplicar el proyecto.
        </p>
      ) : null}
      <PageHeader
        titulo="Nuevo proyecto"
        descripcion="Registra un proyecto y define su configuración inicial de calidad."
        acciones={
          <Button variant="ghost" onClick={cancelar} disabled={enviando}>
            <XIcon />
            Cancelar
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <PasosCompacto actual={paso} />
          <PasosLista
            actual={paso}
            maxVisto={maxVisto}
            resumenes={resumenes}
            onIr={ir}
          />
        </aside>

        <div className="min-w-0">
          <fieldset
            disabled={enviando || ambiguo}
            ref={contenido}
            className="max-w-3xl min-w-0"
          >
            <p className="text-sm font-medium text-muted-foreground tabular-nums">
              Paso {paso} de {PASOS.length}
            </p>
            <h2
              ref={titulo}
              tabIndex={-1}
              className="mt-1 text-xl font-semibold tracking-tight outline-none sm:text-2xl"
            >
              {PASOS[paso - 1]!.titulo}
            </h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              {DESCRIPCIONES[paso]}
            </p>

            {paso === 1 ? (
              <PasoGeneral
                estado={estado}
                onChange={setEstado}
                intentado={intentados[1]}
                elegibles={elegibles}
                creador={creador}
                siguienteCursor={siguienteCursor}
                onConocer={onConocer}
              />
            ) : null}
            {paso === 2 ? (
              <PasoActividades estado={estado} onChange={setEstado} />
            ) : null}
            {paso === 3 ? (
              <PasoMetricas estado={estado} onChange={setEstado} />
            ) : null}
            {paso === 4 ? (
              <PasoConfirmacion
                estado={estado}
                creador={creador}
                elegibles={personas}
                onIr={ir}
              />
            ) : null}
          </fieldset>

          <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => ir((paso - 1) as PasoId)}
                disabled={paso === 1 || enviando || ambiguo}
              >
                <ArrowLeftIcon />
                Atrás
              </Button>
              <p
                className="order-last w-full text-sm text-muted-foreground tabular-nums sm:order-none sm:w-auto sm:flex-1 sm:text-right"
                aria-live="polite"
              >
                {resumenBarra}
                {textoErrores}
              </p>
              {paso < 4 ? (
                <Button size="lg" onClick={continuar}>
                  Continuar
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button size="lg" onClick={registrar} disabled={enviando}>
                  {enviando ? <Spinner /> : <CheckIcon />}
                  {ambiguo ? "Reintentar registro" : "Registrar proyecto"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={cancelando} onOpenChange={setCancelando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ambiguo ? "¿Volver al listado?" : "¿Descartar el registro?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ambiguo
                ? "La solicitud puede haberse guardado. Revisa el listado antes de intentar un registro nuevo; el formulario se descartará."
                : "Los datos capturados se perderán y no se creará el proyecto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => router.push("/proyectos")}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
