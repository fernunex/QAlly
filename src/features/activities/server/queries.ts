import "server-only";
import { z } from "zod";
import type {
  Actividad,
  ActividadResumen,
  EtapaCodigo,
  EstadoActividad,
  Evidencia,
  Entrega,
  EventoActividad,
} from "@/lib/domain";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import { obtenerSesion } from "@/lib/session";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";
import {
  exigirProyecto,
  type Pagina,
  type ProyectoListado,
} from "@/features/projects/server/queries";
import { crearCursor, leerCursor } from "@/features/projects/pagination";
import { uuid, validar, version } from "@/features/projects/validation";
import type { Nombres } from "../utils";
import {
  consultarActividadSchema,
  listarActividadesSchema,
} from "../validation";

export type FiltrosActividades = z.infer<typeof listarActividadesSchema>;
export type ColumnaActividades = Pagina<ActividadResumen> & { total: number };
export type TableroDatos = Record<EstadoActividad, ColumnaActividades>;
export type ActividadDetalle = {
  actividad: Actividad;
  nombres: Nombres;
  siguienteCursorIntentos: string | null;
};

// La BD usa «requerimientos»; la UI conserva el código interno «requisitos».
const etapaBD = (e: EtapaCodigo) => (e === "requisitos" ? "requerimientos" : e);
const etapaUI = z
  .enum(["requerimientos", "diseno", "desarrollo"])
  .transform((e): EtapaCodigo => (e === "requerimientos" ? "requisitos" : e));
const estado = z.enum(ESTADOS_ACTIVIDAD);
const decision = z.enum(["Aprobar", "Devolver"]);
const tipoRow = z.object({
  id: uuid,
  codigo: z.string(),
  nombre: z.string(),
  etapa_codigo: etapaUI,
});
/** Revisión 1:1 con entrega; PostgREST la entrega como objeto o lista según la relación detectada. */
function unaOpcional<T extends z.ZodType>(schema: T) {
  return z
    .union([schema, z.array(schema)])
    .nullable()
    .transform((v) => (Array.isArray(v) ? (v[0] ?? null) : v));
}
const actividadRow = z.object({
  id: uuid,
  proyecto_id: uuid,
  descripcion: z.string(),
  estado,
  creado_en: z.string(),
  creado_por: uuid,
  responsable_id: uuid.nullable(),
  version,
  tipo: tipoRow,
});
const resumenRow = actividadRow.extend({
  envios: z.array(
    z.object({
      numero_intento: z.number().int(),
      enviada_en: z.string(),
      revision: unaOpcional(
        z.object({ decision, revisada_en: z.string() }),
      ),
    }),
  ),
});
const entregaRow = z.object({
  id: uuid,
  actividad_id: uuid,
  numero_intento: z.number().int(),
  resultado: z.string().nullable(),
  autor_id: uuid,
  creada_en: z.string(),
  enviada_en: z.string().nullable(),
  evidencias: z.array(
    z.object({
      id: uuid,
      tipo: z.enum(["PDF", "Enlace"]),
      url: z.string().nullable(),
      archivo: unaOpcional(
        z.object({ nombre_archivo: z.string(), tamano_bytes: z.number() }),
      ),
    }),
  ),
  revision: unaOpcional(
    z.object({
      decision,
      observaciones: z.string().nullable(),
      qa_id: uuid,
      revisada_en: z.string(),
    }),
  ),
});

const columnasActividad =
  "id,proyecto_id,descripcion,estado,creado_en,creado_por,responsable_id,version:version::text,tipo:tipo_actividad!inner(id,codigo,nombre,etapa_codigo)";
const seleccionResumen = `${columnasActividad},envios:entrega(numero_intento,enviada_en,revision:revision_entrega(decision,revisada_en))`;
const seleccionEntrega =
  "id,actividad_id,numero_intento,resultado,autor_id,creada_en,enviada_en,evidencias:evidencia(id,tipo,url,archivo:archivo_evidencia(nombre_archivo,tamano_bytes)),revision:revision_entrega(decision,observaciones,qa_id,revisada_en)";

function nombresDe(proyecto: ProyectoListado): Nombres {
  return Object.fromEntries(
    proyecto.participantes.map((p) => [p.usuarioId, p.nombre]),
  );
}

function base(a: z.infer<typeof actividadRow>, nombres: Nombres) {
  return {
    id: a.id,
    proyectoId: a.proyecto_id,
    tipo: {
      id: a.tipo.id,
      codigo: a.tipo.codigo,
      nombre: a.tipo.nombre,
      etapaCodigo: a.tipo.etapa_codigo,
    },
    descripcion: a.descripcion,
    responsable: a.responsable_id
      ? {
          usuarioId: a.responsable_id,
          nombre: nombres[a.responsable_id] ?? "Usuario",
        }
      : null,
    estado: a.estado,
    version: a.version,
  };
}

/** Lectura RLS de un proyecto ya autorizado; orden fijo creado_en/id descendente. */
async function paginaActividades(
  proyecto: ProyectoListado,
  f: FiltrosActividades,
): Promise<ColumnaActividades> {
  const { supabase, usuario } = await obtenerSesion();
  let query = supabase
    .from("actividad_sqa")
    .select(seleccionResumen, { count: "exact" })
    .eq("proyecto_id", proyecto.id)
    .not("envios.enviada_en", "is", null)
    .order("numero_intento", { referencedTable: "envios", ascending: false })
    .limit(1, { referencedTable: "envios" })
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(f.limite + 1);
  if (f.estado) query = query.eq("estado", f.estado);
  if (f.etapa) query = query.eq("tipo.etapa_codigo", etapaBD(f.etapa));
  if (f.soloMias) query = query.eq("responsable_id", usuario.id);
  if (f.responsable === "sin") query = query.is("responsable_id", null);
  else if (f.responsable) query = query.eq("responsable_id", f.responsable);
  if (f.cursor) {
    const c = leerCursor(f.cursor);
    query = query.or(
      `creado_en.lt.${c.fecha},and(creado_en.eq.${c.fecha},id.lt.${c.id})`,
    );
  }
  const r = await query;
  comprobarError(r.error);
  const nombres = nombresDe(proyecto);
  const rows = z.array(resumenRow).parse(r.data ?? []),
    items = rows.slice(0, f.limite),
    last = items.at(-1);
  return {
    items: items.map((a) => {
      const envio = a.envios[0];
      return {
        ...base(a, nombres),
        ultimoEnvio: envio
          ? {
              numeroIntento: envio.numero_intento,
              enviadaEn: envio.enviada_en,
              decision: envio.revision?.decision ?? null,
              revisadaEn: envio.revision?.revisada_en ?? null,
            }
          : null,
      };
    }),
    siguienteCursor:
      rows.length > f.limite && last
        ? crearCursor(last.creado_en, last.id)
        : null,
    // Con cursor, el conteo excluye las páginas anteriores; el total vigente es el de la primera página.
    total: r.count ?? items.length,
  };
}

export async function listarActividades(
  entrada: unknown,
): Promise<ColumnaActividades> {
  const f = validar(listarActividadesSchema, entrada);
  const proyecto = await exigirProyecto(f.proyectoId);
  return paginaActividades(proyecto, f);
}

/** Primera página de cada estado para el tablero, con su total exacto. */
export async function consultarTablero(
  proyecto: ProyectoListado,
  filtros: Pick<FiltrosActividades, "etapa" | "responsable">,
): Promise<TableroDatos> {
  const columnas = await Promise.all(
    ESTADOS_ACTIVIDAD.map((e) =>
      paginaActividades(proyecto, {
        proyectoId: proyecto.id,
        limite: 25,
        soloMias: false,
        estado: e,
        ...filtros,
      }),
    ),
  );
  return Object.fromEntries(
    ESTADOS_ACTIVIDAD.map((e, i) => [e, columnas[i]]),
  ) as TableroDatos;
}

function entregaDTO(e: z.infer<typeof entregaRow>): Entrega {
  return {
    id: e.id,
    actividadId: e.actividad_id,
    numeroIntento: e.numero_intento,
    resultado: e.resultado,
    autorId: e.autor_id,
    creadaEn: e.creada_en,
    enviadaEn: e.enviada_en,
    evidencias: e.evidencias.map(
      (ev): Evidencia =>
        ev.tipo === "PDF"
          ? {
              id: ev.id,
              tipo: "pdf",
              nombreArchivo: ev.archivo?.nombre_archivo ?? "evidencia.pdf",
              tamanoBytes: ev.archivo?.tamano_bytes ?? 0,
            }
          : { id: ev.id, tipo: "enlace", url: ev.url ?? "" },
    ),
    revision: e.revision
      ? {
          decision: e.revision.decision,
          observaciones: e.revision.observaciones,
          qaId: e.revision.qa_id,
          revisadaEn: e.revision.revisada_en,
        }
      : null,
  };
}

/** Línea de tiempo derivada de datos persistidos; no se registran eventos aparte. */
function eventosDe(
  a: z.infer<typeof actividadRow>,
  entregas: Entrega[],
  nombres: Nombres,
): EventoActividad[] {
  const n = (id: string) => nombres[id] ?? "Usuario";
  const eventos: EventoActividad[] = [
    { fecha: a.creado_en, texto: `${n(a.creado_por)} (QA) agregó la actividad` },
  ];
  for (const e of entregas) {
    if (e.enviadaEn)
      eventos.push({
        fecha: e.enviadaEn,
        texto: `${n(e.autorId)} envió el intento ${e.numeroIntento}`,
      });
    if (e.revision)
      eventos.push({
        fecha: e.revision.revisadaEn,
        texto:
          e.revision.decision === "Aprobar"
            ? `${n(e.revision.qaId)} (QA) aprobó la actividad (intento ${e.numeroIntento})`
            : `${n(e.revision.qaId)} (QA) devolvió con observaciones (intento ${e.numeroIntento})`,
      });
  }
  return eventos.sort((x, y) => y.fecha.localeCompare(x.fecha));
}

/**
 * CU-03 SF-02: actividad con intentos enviados (inmutables) paginados por número descendente.
 * El borrador en preparación pertenece al responsable (CU-04) y no se expone aquí.
 */
export async function consultarActividad(
  entrada: unknown,
): Promise<ActividadDetalle> {
  const p = validar(consultarActividadSchema, entrada);
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("actividad_sqa")
    .select(columnasActividad)
    .eq("id", p.actividadId)
    .maybeSingle();
  comprobarError(r.error);
  if (!r.data) throw new ErrorOperacion("NO_DISPONIBLE");
  const a = actividadRow.parse(r.data);
  const proyecto = await exigirProyecto(a.proyecto_id);
  let query = supabase
    .from("entrega")
    .select(seleccionEntrega)
    .eq("actividad_id", a.id)
    .not("enviada_en", "is", null)
    .order("numero_intento", { ascending: false })
    .order("creada_en", { referencedTable: "evidencias" })
    .order("id", { referencedTable: "evidencias" })
    .limit(p.limiteIntentos + 1);
  if (p.cursorIntentos)
    query = query.lt("numero_intento", Number(p.cursorIntentos));
  const e = await query;
  comprobarError(e.error);
  const rows = z.array(entregaRow).parse(e.data ?? []);
  const entregas = rows.slice(0, p.limiteIntentos).map(entregaDTO);
  const nombres = nombresDe(proyecto);
  return {
    actividad: {
      ...base(a, nombres),
      entregas,
      eventos: eventosDe(a, entregas, nombres),
    },
    nombres,
    siguienteCursorIntentos:
      rows.length > p.limiteIntentos
        ? String(entregas.at(-1)!.numeroIntento)
        : null,
  };
}
