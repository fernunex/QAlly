"use client";

import { useId, useState } from "react";
import { ChevronRightIcon, ClipboardCheckIcon, LockIcon, MessageSquareTextIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";
import { EstadoActividadIcon } from "@/components/status/status-badges";
import { EstadoVacio } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { DetalleMiActividad } from "@/features/activities/components/detalle-mi-actividad";
import {
  type MiActividad,
  type Nombres,
  estaDevuelta,
  ultimaDevolucion,
  ultimoEnviado,
} from "@/features/activities/utils";
import { iniciarActividadAction, type ActividadActualizada } from "@/features/evidences/actions";
import { ESTADOS_ACTIVIDAD, type EstadoActividad } from "@/lib/domain";
import { formatFechaCorta } from "@/lib/format";

/** Orden de lectura: primero lo que requiere acción del Miembro. */
const ORDEN: EstadoActividad[] = ["En progreso", "Pendiente", "En revisión", "Aprobada"];
type Filtro = "todas" | EstadoActividad;

export function MisActividadesLista({
  actividades: iniciales,
  nombres: nombresIniciales,
}: {
  actividades: MiActividad[];
  nombres: Nombres;
}) {
  const grupoId = useId();
  const [actividades, setActividades] = useState(iniciales);
  const [nombres, setNombres] = useState(nombresIniciales);
  const [previas, setPrevias] = useState(iniciales);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [iniciando, setIniciando] = useState<string | null>(null);

  // Al revalidar la ruta llegan datos del servidor: prevalecen sobre el estado local, salvo que
  // sean anteriores a la última confirmación (la revalidación de una acción puede aplicarse
  // después de subir un PDF por el Route Handler y no debe ocultarlo).
  if (iniciales !== previas) {
    setPrevias(iniciales);
    setActividades((locales) => {
      const porId = new Map(locales.map((a) => [a.id, a]));
      return iniciales.map((s) => {
        const local = porId.get(s.id);
        return local && BigInt(local.version) > BigInt(s.version) ? local : s;
      });
    });
    setNombres((n) => ({ ...n, ...nombresIniciales }));
  }

  const conteo = Object.fromEntries(
    ESTADOS_ACTIVIDAD.map((e) => [e, actividades.filter((a) => a.estado === e).length]),
  ) as Record<EstadoActividad, number>;

  const actual = actividades.find((a) => a.id === seleccion) ?? null;

  /** Sustituye la actividad por la versión confirmada por el servidor. */
  function actualizada({ actividad, nombres: nuevos }: ActividadActualizada) {
    setActividades((lista) => lista.map((a) => (a.id === actividad.id ? actividad : a)));
    setNombres((n) => ({ ...n, ...nuevos }));
  }

  function abrir(id: string) {
    setSeleccion(id);
    setAbierto(true);
  }

  async function iniciar(a: MiActividad) {
    setIniciando(a.id);
    try {
      const r = await iniciarActividadAction({ actividadId: a.id, versionEsperada: a.version });
      if (!r.ok) {
        toast.error(r.error.mensaje);
        return;
      }
      actualizada(r.datos);
      toast.success("Actividad iniciada");
      abrir(a.id);
    } finally {
      setIniciando(null);
    }
  }

  if (actividades.length === 0) {
    return (
      <EstadoVacio
        icon={ClipboardCheckIcon}
        titulo="No tienes actividades asignadas"
        descripcion="Cuando QA te asigne una actividad SQA en un proyecto donde participas, aparecerá aquí."
      />
    );
  }

  const visibles = ORDEN.filter((e) => filtro === "todas" || filtro === e);

  return (
    <div className="space-y-6">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ToggleGroup
          type="single"
          variant="outline"
          value={filtro}
          onValueChange={(v) => v && setFiltro(v as Filtro)}
          aria-label="Filtrar por estado"
          className="w-max"
        >
          <ToggleGroupItem value="todas" className="rounded-full tabular-nums">
            Todas · {actividades.length}
          </ToggleGroupItem>
          {ESTADOS_ACTIVIDAD.map((e) => (
            <ToggleGroupItem key={e} value={e} className="rounded-full tabular-nums">
              {e} · {conteo[e]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visibles.map((estado) => {
        const lista = actividades.filter((a) => a.estado === estado);
        if (lista.length === 0 && filtro === "todas") return null;
        return (
          <section key={estado} aria-labelledby={`${grupoId}-${ORDEN.indexOf(estado)}`} className="space-y-2.5">
            <h2 id={`${grupoId}-${ORDEN.indexOf(estado)}`} className="flex items-center gap-2 text-sm font-semibold">
              <EstadoActividadIcon estado={estado} />
              {estado}
              <span className="font-normal text-muted-foreground tabular-nums">{lista.length}</span>
            </h2>
            {lista.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No tienes actividades en este estado.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {lista.map((a) => (
                  <Fila
                    key={a.id}
                    actividad={a}
                    iniciando={iniciando === a.id}
                    onAbrir={() => abrir(a.id)}
                    onIniciar={() => void iniciar(a)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <DetalleMiActividad
        actividad={actual}
        nombres={nombres}
        open={abierto}
        onOpenChange={setAbierto}
        onActualizada={actualizada}
      />
    </div>
  );
}

function Fila({
  actividad: a,
  iniciando,
  onAbrir,
  onIniciar,
}: {
  actividad: MiActividad;
  iniciando: boolean;
  onAbrir: () => void;
  onIniciar: () => void;
}) {
  const enviado = ultimoEnviado(a);
  const devolucion = ultimaDevolucion(a);
  let derecha: React.ReactNode = null;
  if (a.proyectoCerrado) {
    derecha = <Nota icono={<LockIcon />}>Proyecto cerrado · solo lectura</Nota>;
  } else if (a.estado === "Pendiente") {
    derecha = (
      <Button size="sm" variant="outline" disabled={iniciando} onClick={onIniciar}>
        {iniciando ? <Spinner /> : <PlayIcon />}
        Iniciar
      </Button>
    );
  } else if (estaDevuelta(a) && devolucion?.revision) {
    derecha = (
      <Nota icono={<MessageSquareTextIcon />} tono="text-destructive">
        Devuelta con observaciones · {formatFechaCorta(devolucion.revision.revisadaEn)}
      </Nota>
    );
  } else if (a.estado === "En revisión" && enviado?.enviadaEn) {
    derecha = <Nota icono={<LockIcon />}>Solo lectura · enviada {formatFechaCorta(enviado.enviadaEn)}</Nota>;
  } else if (a.estado === "Aprobada" && enviado?.revision) {
    derecha = <Nota icono={<LockIcon />}>Solo lectura · aprobada {formatFechaCorta(enviado.revision.revisadaEn)}</Nota>;
  }

  return (
    <li className="flex flex-col rounded-lg border bg-card transition-colors hover:bg-muted/30 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onAbrir}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-balance">{a.descripcion}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            <span className="font-mono text-xs">{a.tipo.codigo}</span> {a.tipo.nombre} · {a.proyectoNombre} ·{" "}
            {a.etapaNombre}
          </span>
        </span>
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground sm:hidden" />
      </button>
      {derecha ? <div className="px-4 pb-4 sm:py-4 sm:pr-4 sm:pl-0">{derecha}</div> : null}
    </li>
  );
}

function Nota({
  icono,
  tono = "text-muted-foreground",
  children,
}: {
  icono: React.ReactNode;
  tono?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm [&_svg]:size-3.5 [&_svg]:shrink-0 ${tono}`}>
      {icono}
      <span className="sm:whitespace-nowrap">{children}</span>
    </span>
  );
}
