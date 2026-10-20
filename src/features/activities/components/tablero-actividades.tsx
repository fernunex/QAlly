"use client";

import { useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ListChecksIcon, MessageSquareTextIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { EstadoVacio } from "@/components/states/ui-states";
import { EstadoActividadIcon } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { consultarActividadAction, listarActividadesAction } from "@/features/activities/actions";
import { AgregarActividadDialog } from "@/features/activities/components/agregar-actividad-dialog";
import {
  AsignarResponsableDialog,
  type Participante,
} from "@/features/activities/components/asignar-responsable-dialog";
import { DetalleActividadSheet, type EstadoDetalle } from "@/features/activities/components/detalle-actividad-sheet";
import { Responsable } from "@/features/activities/components/responsable-avatar";
import type { ActividadDetalle, ColumnaActividades, TableroDatos } from "@/features/activities/server/queries";
import { resumenDevuelto } from "@/features/activities/utils";
import { ErrorAccion } from "@/features/projects/components/error-accion";
import { ETAPAS, nombreEtapa } from "@/lib/catalogs";
import {
  ESTADOS_ACTIVIDAD,
  type Actividad,
  type ActividadResumen,
  type EstadoActividad,
  type TipoActividad,
} from "@/lib/domain";
import { formatFechaCorta } from "@/lib/format";
import type { ErrorPublico } from "@/lib/resultados";

type Asignable = Pick<Actividad, "id" | "tipo" | "descripcion" | "responsable" | "estado" | "version">;
export type FiltrosTablero = { etapa: string; responsable: string };

function fechaRelevante(a: ActividadResumen): string | null {
  const ult = a.ultimoEnvio;
  if (a.estado === "En revisión" && ult) return `Enviada ${formatFechaCorta(ult.enviadaEn)}`;
  if (a.estado === "Aprobada" && ult?.revisadaEn) return `Aprobada ${formatFechaCorta(ult.revisadaEn)}`;
  return null;
}

/**
 * CU-03: actividades agrupadas por estado, paginadas por columna y filtradas en servidor.
 * xl+: tablero de 4 columnas. < xl: secciones apiladas por estado (todo el contenido visible y con conteos
 * a la vista, sin esconder estados tras pestañas).
 */
export function TableroActividades({
  proyectoId,
  tablero,
  filtros,
  participantes,
  tipos,
  puedeGestionar,
}: {
  proyectoId: string;
  tablero: TableroDatos;
  filtros: FiltrosTablero;
  participantes: Participante[];
  tipos: TipoActividad[];
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtrando, startFiltro] = useTransition();
  const [detalle, setDetalle] = useState<EstadoDetalle | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [asignando, setAsignando] = useState<Asignable | null>(null);
  // Evita que una respuesta tardía reemplace el detalle de otra actividad abierta después.
  const actual = useRef<string | null>(null);

  const total = ESTADOS_ACTIVIDAD.reduce((n, e) => n + tablero[e].total, 0);
  const filtrado = filtros.etapa !== "todas" || filtros.responsable !== "todos";

  function filtrar(cambio: Partial<FiltrosTablero>) {
    const f = { ...filtros, ...cambio };
    const q = new URLSearchParams();
    if (f.etapa !== "todas") q.set("etapa", f.etapa);
    if (f.responsable !== "todos") q.set("responsable", f.responsable);
    startFiltro(() => router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false }));
  }

  async function cargar(id: string) {
    actual.current = id;
    try {
      const r = await consultarActividadAction({ actividadId: id });
      if (actual.current !== id) return;
      setDetalle(r.ok ? { id, tipo: "ok", datos: r.datos } : { id, tipo: "error", error: r.error });
    } catch {
      if (actual.current !== id) return;
      setDetalle({
        id,
        tipo: "error",
        error: { codigo: "FALLO_PERSISTENCIA", mensaje: "No pudimos cargar la actividad. Inténtalo de nuevo." },
      });
    }
  }

  function abrir(id: string) {
    setDetalle({ id, tipo: "cargando" });
    setDetalleAbierto(true);
    void cargar(id);
  }

  async function cargarMasIntentos() {
    if (detalle?.tipo !== "ok" || !detalle.datos.siguienteCursorIntentos) return;
    const previo = detalle.datos;
    setDetalle({ ...detalle, cargandoMas: true });
    try {
      const r = await consultarActividadAction({
        actividadId: previo.actividad.id,
        cursorIntentos: previo.siguienteCursorIntentos,
      });
      if (actual.current !== previo.actividad.id) return;
      if (!r.ok) {
        setDetalle({ id: previo.actividad.id, tipo: "error", error: r.error });
        return;
      }
      // Si la actividad cambió entretanto, se recarga completa para no mezclar versiones.
      if (r.datos.actividad.version !== previo.actividad.version) return void cargar(previo.actividad.id);
      const vistos = new Set(previo.actividad.eventos.map((e) => `${e.fecha}|${e.texto}`));
      setDetalle({
        id: previo.actividad.id,
        tipo: "ok",
        datos: {
          ...r.datos,
          actividad: {
            ...previo.actividad,
            entregas: [...previo.actividad.entregas, ...r.datos.actividad.entregas],
            eventos: [
              ...previo.actividad.eventos,
              ...r.datos.actividad.eventos.filter((e) => !vistos.has(`${e.fecha}|${e.texto}`)),
            ].sort((x, y) => y.fecha.localeCompare(x.fecha)),
          },
          nombres: { ...previo.nombres, ...r.datos.nombres },
        },
      });
    } catch {
      setDetalle({ id: previo.actividad.id, tipo: "ok", datos: previo });
      toast.error("No pudimos cargar los intentos anteriores.");
    }
  }

  function actualizada(d: ActividadDetalle) {
    if (actual.current === d.actividad.id) setDetalle({ id: d.actividad.id, tipo: "ok", datos: d });
    router.refresh();
  }

  const vacio = total === 0 && !filtrado;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3" aria-busy={filtrando}>
          <Select value={filtros.etapa} onValueChange={(v) => filtrar({ etapa: v })}>
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
          <Select value={filtros.responsable} onValueChange={(v) => filtrar({ responsable: v })}>
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
          {filtrando ? <span className="text-xs text-muted-foreground">Actualizando…</span> : null}
        </div>
        {puedeGestionar ? (
          <Button onClick={() => setAgregando(true)}>
            <PlusIcon />
            Agregar actividad
          </Button>
        ) : null}
      </div>

      {vacio ? (
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
              columna={tablero[estado]}
              consulta={{ proyectoId, estado, filtros }}
              puedeGestionar={puedeGestionar}
              onAbrir={abrir}
              onAsignar={setAsignando}
            />
          ))}
        </div>
      )}

      <DetalleActividadSheet
        detalle={detalle}
        open={detalleAbierto}
        onOpenChange={(o) => {
          setDetalleAbierto(o);
          if (!o) actual.current = null;
        }}
        puedeGestionar={puedeGestionar}
        tipos={tipos}
        onAsignar={setAsignando}
        onActualizada={actualizada}
        onRecargar={() => detalle && abrir(detalle.id)}
        onCargarMas={() => void cargarMasIntentos()}
      />
      {puedeGestionar ? (
        <>
          <AgregarActividadDialog
            proyectoId={proyectoId}
            tipos={tipos}
            open={agregando}
            onOpenChange={setAgregando}
            onAgregada={() => {
              setAgregando(false);
              toast.success("Actividad agregada en estado Pendiente");
              router.refresh();
            }}
          />
          <AsignarResponsableDialog
            actividad={asignando}
            participantes={participantes}
            onOpenChange={(o) => !o && setAsignando(null)}
            onAsignada={(d) => {
              setAsignando(null);
              toast.success(`Responsable asignado: ${d.actividad.responsable?.nombre ?? ""}`);
              actualizada(d);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function Columna({
  estado,
  columna,
  consulta,
  puedeGestionar,
  onAbrir,
  onAsignar,
}: {
  estado: EstadoActividad;
  columna: ColumnaActividades;
  consulta: { proyectoId: string; estado: EstadoActividad; filtros: FiltrosTablero };
  puedeGestionar: boolean;
  onAbrir: (id: string) => void;
  onAsignar: (a: ActividadResumen) => void;
}) {
  // Páginas adicionales; se descartan cuando el servidor entrega datos nuevos (refresco o filtro).
  const [origen, setOrigen] = useState(columna);
  const [extra, setExtra] = useState<ActividadResumen[]>([]);
  const [cursor, setCursor] = useState(columna.siguienteCursor);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<ErrorPublico | null>(null);
  // Un id con espacios («En revisión») rompería aria-labelledby, que es una lista de ids.
  const tituloId = useId();
  if (origen !== columna) {
    setOrigen(columna);
    setExtra([]);
    setCursor(columna.siguienteCursor);
    setError(null);
  }
  const ids = new Set(columna.items.map((a) => a.id));
  const actividades = [...columna.items, ...extra.filter((a) => !ids.has(a.id))];

  async function cargarMas() {
    if (!cursor || cargando) return;
    setCargando(true);
    setError(null);
    try {
      const { etapa, responsable } = consulta.filtros;
      const r = await listarActividadesAction({
        proyectoId: consulta.proyectoId,
        estado: consulta.estado,
        cursor,
        ...(etapa !== "todas" ? { etapa } : {}),
        ...(responsable !== "todos" ? { responsable } : {}),
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setExtra((l) => [...l, ...r.datos.items]);
      setCursor(r.datos.siguienteCursor);
    } catch {
      setError({ codigo: "FALLO_PERSISTENCIA", mensaje: "No pudimos cargar más actividades. Inténtalo de nuevo." });
    } finally {
      setCargando(false);
    }
  }

  return (
    <section aria-labelledby={tituloId} className="min-w-0 space-y-3 xl:rounded-xl xl:bg-muted/40 xl:p-3">
      <h2 id={tituloId} className="flex items-center gap-2 text-sm font-semibold">
        <EstadoActividadIcon estado={estado} />
        {estado}
        <span className="font-normal text-muted-foreground tabular-nums">{columna.total}</span>
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
                onAsignar={() => onAsignar(a)}
              />
            </li>
          ))}
        </ul>
      )}
      {error ? <ErrorAccion error={error} /> : null}
      {cursor ? (
        <Button variant="outline" size="sm" className="w-full" disabled={cargando} onClick={cargarMas}>
          {cargando ? "Cargando…" : `Mostrar más (${actividades.length} de ${columna.total})`}
        </Button>
      ) : null}
    </section>
  );
}

function Tarjeta({
  actividad: a,
  puedeAsignar,
  onAbrir,
  onAsignar,
}: {
  actividad: ActividadResumen;
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
        <span className="block font-medium text-balance break-words">{a.descripcion}</span>
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
        {resumenDevuelto(a) ? (
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
