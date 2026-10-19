"use client";

import { useState } from "react";
import { ListChecksIcon, MessageSquareTextIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { EstadoVacio } from "@/components/states/ui-states";
import { EstadoActividadIcon } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgregarActividadDialog } from "@/features/activities/components/agregar-actividad-dialog";
import {
  AsignarResponsableDialog,
  type Participante,
} from "@/features/activities/components/asignar-responsable-dialog";
import { DetalleActividadSheet } from "@/features/activities/components/detalle-actividad-sheet";
import { Responsable } from "@/features/activities/components/responsable-avatar";
import { type Nombres, conEvento, estaDevuelta, ultimoEnviado } from "@/features/activities/utils";
import { ETAPAS, TIPOS_ACTIVIDAD, nombreEtapa } from "@/lib/catalogs";
import { ESTADOS_ACTIVIDAD, type Actividad, type EstadoActividad } from "@/lib/domain";
import { formatFechaCorta } from "@/lib/format";

function fechaRelevante(a: Actividad): string | null {
  const ult = ultimoEnviado(a);
  if (a.estado === "En revisión" && ult?.enviadaEn) return `Enviada ${formatFechaCorta(ult.enviadaEn)}`;
  if (a.estado === "Aprobada" && ult?.revision) return `Aprobada ${formatFechaCorta(ult.revision.revisadaEn)}`;
  return null;
}

/**
 * CU-03: actividades agrupadas por estado.
 * xl+: tablero de 4 columnas. < xl: secciones apiladas por estado (todo el contenido visible y con conteos
 * a la vista, sin esconder estados tras pestañas).
 */
export function TableroActividades({
  actividades: iniciales,
  participantes,
  nombres,
  puedeGestionar,
  usuarioId,
  usuarioNombre,
  etapaInicial = "todas",
}: {
  actividades: Actividad[];
  participantes: Participante[];
  nombres: Nombres;
  puedeGestionar: boolean;
  usuarioId: string;
  usuarioNombre: string;
  /** Filtro de etapa inicial (p. ej. desde «Ver actividades de la etapa» en Salud). */
  etapaInicial?: string;
}) {
  const [actividades, setActividades] = useState(iniciales);
  const [etapa, setEtapa] = useState(etapaInicial);
  const [responsable, setResponsable] = useState("todos");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [contador, setContador] = useState(0);

  const visibles = actividades.filter(
    (a) =>
      (etapa === "todas" || a.tipo.etapaCodigo === etapa) &&
      (responsable === "todos" ||
        (responsable === "sin" ? a.responsable === null : a.responsable?.usuarioId === responsable)),
  );
  const actual = actividades.find((a) => a.id === seleccion) ?? null;
  const aAsignar = actividades.find((a) => a.id === asignando) ?? null;

  function actualizar(id: string, fn: (a: Actividad) => Actividad) {
    setActividades((l) => l.map((a) => (a.id === id ? fn(a) : a)));
  }

  function agregar(tipoId: string, descripcion: string) {
    const t = TIPOS_ACTIVIDAD.find((x) => x.id === tipoId)!;
    const ahora = new Date().toISOString();
    // TODO(funcionalidad): agregarActividad (contratos-v1 §5).
    const nueva: Actividad = {
      id: `nueva-${contador + 1}`,
      proyectoId: actividades[0]?.proyectoId ?? "",
      tipo: { id: t.id, codigo: t.codigo, nombre: t.nombre, etapaCodigo: t.etapaCodigo },
      descripcion,
      responsable: null,
      estado: "Pendiente",
      version: "1",
      entregas: [],
      eventos: [{ fecha: ahora, texto: `${usuarioNombre} (QA) agregó la actividad` }],
    };
    setContador((c) => c + 1);
    setActividades((l) => [nueva, ...l]);
    setAgregando(false);
    toast.success("Actividad agregada en estado Pendiente");
  }

  function asignar(id: string, usuario: string) {
    const p = participantes.find((x) => x.usuarioId === usuario)!;
    const ahora = new Date().toISOString();
    // TODO(funcionalidad): asignarResponsable con versionEsperada (contratos-v1 §5).
    actualizar(id, (a) =>
      conEvento(
        { ...a, responsable: { usuarioId: p.usuarioId, nombre: p.nombre } },
        ahora,
        `${usuarioNombre} (QA) asignó la actividad a ${p.nombre}`,
      ),
    );
    setAsignando(null);
    toast.success(`Responsable asignado: ${p.nombre}`);
  }

  function revisar(id: string, decision: "Aprobar" | "Devolver", observaciones: string | null) {
    const ahora = new Date().toISOString();
    actualizar(id, (a) => {
      const entregas = a.entregas.map((e, i) =>
        i === a.entregas.findIndex((x) => x.enviadaEn !== null)
          ? { ...e, revision: { decision, observaciones, qaId: usuarioId, revisadaEn: ahora } }
          : e,
      );
      const n = entregas.find((e) => e.enviadaEn !== null)?.numeroIntento ?? 1;
      return conEvento(
        { ...a, entregas, estado: decision === "Aprobar" ? "Aprobada" : "En progreso" },
        ahora,
        decision === "Aprobar"
          ? `${usuarioNombre} (QA) aprobó la actividad (intento ${n})`
          : `${usuarioNombre} (QA) devolvió con observaciones (intento ${n})`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Select value={etapa} onValueChange={setEtapa}>
            <SelectTrigger aria-label="Filtrar por etapa" className="w-auto min-w-0 max-w-full">
              <span className="text-muted-foreground">Etapa:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {ETAPAS.map((e) => (
                <SelectItem key={e.codigo} value={e.codigo}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={responsable} onValueChange={setResponsable}>
            <SelectTrigger aria-label="Filtrar por responsable" className="w-auto min-w-0 max-w-full">
              <span className="text-muted-foreground">Responsable:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {participantes.map((p) => (
                <SelectItem key={p.usuarioId} value={p.usuarioId}>
                  {p.nombre}
                </SelectItem>
              ))}
              <SelectItem value="sin">Sin responsable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {puedeGestionar ? (
          <Button onClick={() => setAgregando(true)}>
            <PlusIcon />
            Agregar actividad
          </Button>
        ) : null}
      </div>

      {actividades.length === 0 ? (
        <EstadoVacio
          icon={ListChecksIcon}
          titulo="Este proyecto aún no tiene actividades SQA"
          descripcion={
            puedeGestionar
              ? "Agrega una actividad del catálogo para empezar a dar seguimiento a la calidad."
              : "Cuando QA agregue actividades aparecerán aquí."
          }
        >
          {puedeGestionar ? (
            <Button onClick={() => setAgregando(true)}>
              <PlusIcon />
              Agregar actividad
            </Button>
          ) : null}
        </EstadoVacio>
      ) : (
        <div className="grid gap-6 xl:grid-cols-4 xl:items-start xl:gap-4">
          {ESTADOS_ACTIVIDAD.map((estado) => (
            <Columna
              key={estado}
              estado={estado}
              actividades={visibles.filter((a) => a.estado === estado)}
              puedeGestionar={puedeGestionar}
              onAbrir={(id) => {
                setSeleccion(id);
                setDetalleAbierto(true);
              }}
              onAsignar={setAsignando}
            />
          ))}
        </div>
      )}

      <DetalleActividadSheet
        actividad={actual}
        nombres={nombres}
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
        puedeGestionar={puedeGestionar}
        onAsignar={(a) => setAsignando(a.id)}
        onAprobar={(id) => revisar(id, "Aprobar", null)}
        onDevolver={(id, obs) => revisar(id, "Devolver", obs)}
      />
      {puedeGestionar ? (
        <>
          <AgregarActividadDialog open={agregando} onOpenChange={setAgregando} onAgregar={agregar} />
          <AsignarResponsableDialog
            actividad={aAsignar}
            participantes={participantes}
            onOpenChange={(o) => !o && setAsignando(null)}
            onAsignar={asignar}
          />
        </>
      ) : null}
    </div>
  );
}

function Columna({
  estado,
  actividades,
  puedeGestionar,
  onAbrir,
  onAsignar,
}: {
  estado: EstadoActividad;
  actividades: Actividad[];
  puedeGestionar: boolean;
  onAbrir: (id: string) => void;
  onAsignar: (id: string) => void;
}) {
  return (
    <section aria-labelledby={`col-${estado}`} className="min-w-0 space-y-3 xl:rounded-xl xl:bg-muted/40 xl:p-3">
      <h2 id={`col-${estado}`} className="flex items-center gap-2 text-sm font-semibold">
        <EstadoActividadIcon estado={estado} />
        {estado}
        <span className="font-normal text-muted-foreground tabular-nums">{actividades.length}</span>
      </h2>
      {actividades.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Sin actividades</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          {actividades.map((a) => (
            <li key={a.id} className="min-w-0">
              <Tarjeta
                actividad={a}
                puedeAsignar={puedeGestionar && a.estado === "Pendiente" && a.responsable === null}
                onAbrir={() => onAbrir(a.id)}
                onAsignar={() => onAsignar(a.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Tarjeta({
  actividad: a,
  puedeAsignar,
  onAbrir,
  onAsignar,
}: {
  actividad: Actividad;
  puedeAsignar: boolean;
  onAbrir: () => void;
  onAsignar: () => void;
}) {
  const fecha = fechaRelevante(a);
  return (
    <article className="rounded-lg border bg-card transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={onAbrir}
        className="block w-full space-y-2 rounded-lg p-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="block font-mono text-xs text-muted-foreground">
          {a.tipo.codigo} · {a.tipo.nombre}
        </span>
        <span className="block font-medium text-balance">{a.descripcion}</span>
        <span className="inline-flex h-5 max-w-full items-center rounded-md bg-muted px-1.5 text-xs text-muted-foreground">
          <span className="truncate">{nombreEtapa(a.tipo.etapaCodigo)}</span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {a.responsable ? (
            <Responsable nombre={a.responsable.nombre} />
          ) : (
            <span className="text-sm text-muted-foreground">Sin responsable</span>
          )}
          {fecha ? <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{fecha}</span> : null}
        </span>
        {estaDevuelta(a) ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <MessageSquareTextIcon aria-hidden className="size-3.5 shrink-0" />
            Devuelta con observaciones
          </span>
        ) : null}
      </button>
      {puedeAsignar ? (
        <div className="px-3.5 pb-3.5">
          <Button variant="outline" size="sm" className="w-full" onClick={onAsignar}>
            Asignar responsable
          </Button>
        </div>
      ) : null}
    </article>
  );
}
