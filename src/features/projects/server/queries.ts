import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { Proyecto, Rol, TipoActividad, TipoMetrica } from "@/lib/domain";
import { TIPOS_ACTIVIDAD, TIPOS_METRICA } from "@/lib/catalogs";
import { obtenerSesion } from "@/lib/session";
import { leerCursor, crearCursor } from "../pagination";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";
import {
  uuid,
  validar,
  paginaSchema,
  buscarMiembrosSchema,
  version,
} from "../validation";

export type Pagina<T> = { items: T[]; siguienteCursor: string | null };
export type PersonaElegible = {
  id: string;
  nombre: string;
  rol: "Miembro del equipo";
};
export type CatalogosProyecto = {
  actividades: TipoActividad[];
  metricas: TipoMetrica[];
};
export type ProyectoListado = Proyecto & {
  totalActividades: number;
  aprobadas: number;
};
const participante = z.object({
  usuario_id: uuid,
  perfil: z.object({
    nombre: z.string(),
    rol: z.enum(["QA", "Miembro del equipo"]),
  }),
});
const proyectoRow = z.object({
  id: uuid,
  nombre: z.string(),
  descripcion: z.string(),
  periodo_academico: z.string().nullable(),
  fecha_inicio: z.string(),
  fecha_fin_prevista: z.string().nullable(),
  creado_en: z.string(),
  actualizado_en: z.string(),
  cerrado_en: z.string().nullable(),
  version,
  participantes: z.array(participante),
  actividades: z.array(z.object({ count: z.number() })),
  aprobadas: z.array(z.object({ count: z.number() })),
});
// PostgREST convierte bigint a texto antes de serializar JSON; no se pierde precisión.
const seleccion =
  "id,nombre,descripcion,periodo_academico,fecha_inicio,fecha_fin_prevista,creado_en,actualizado_en,cerrado_en,version:version::text,participantes:participacion_proyecto(usuario_id,perfil(nombre,rol)),actividades:actividad_sqa(count),aprobadas:actividad_sqa(count)" as const;
function proyectoDTO(raw: unknown): ProyectoListado {
  const p = proyectoRow.parse(raw);
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    periodoAcademico: p.periodo_academico,
    fechaInicio: p.fecha_inicio,
    fechaFinPrevista: p.fecha_fin_prevista,
    creadoEn: p.creado_en,
    actualizadoEn: p.actualizado_en,
    cerradoEn: p.cerrado_en,
    version: p.version,
    participantes: p.participantes.map((m) => ({
      usuarioId: m.usuario_id,
      nombre: m.perfil.nombre,
      rol: (m.perfil.rol === "QA" ? "QA" : "Miembro") as Rol,
    })),
    totalActividades: p.actividades[0]?.count ?? 0,
    aprobadas: p.aprobadas[0]?.count ?? 0,
  };
}

export async function listarProyectos(entrada: unknown = {}) {
  const { supabase } = await obtenerSesion();
  const { limite, cursor } = validar(paginaSchema, entrada);
  let query = supabase
    .from("proyecto")
    .select(seleccion)
    .eq("aprobadas.estado", "Aprobada")
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(limite + 1);
  if (cursor) {
    const c = leerCursor(cursor);
    query = query.or(
      `creado_en.lt.${c.fecha},and(creado_en.eq.${c.fecha},id.lt.${c.id})`,
    );
  }
  const result = await query;
  comprobarError(result.error);
  const rows = (result.data ?? []).map(proyectoDTO),
    items = rows.slice(0, limite),
    last = items.at(-1);
  return {
    items,
    siguienteCursor:
      rows.length > limite && last ? crearCursor(last.creadoEn, last.id) : null,
  } satisfies Pagina<ProyectoListado>;
}

export async function consultarProyecto(
  id: string,
): Promise<ProyectoListado | null> {
  const { supabase } = await obtenerSesion();
  if (!uuid.safeParse(id).success) return null;
  const result = await supabase
    .from("proyecto")
    .select(seleccion)
    .eq("id", id)
    .eq("aprobadas.estado", "Aprobada")
    .maybeSingle();
  comprobarError(result.error);
  return result.data ? proyectoDTO(result.data) : null;
}

export async function exigirProyecto(id: string, gestion = false) {
  const { usuario } = await obtenerSesion();
  const proyecto = await consultarProyecto(id);
  if (!proyecto) throw new ErrorOperacion("NO_DISPONIBLE");
  if (gestion && usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
  if (gestion && proyecto.cerradoEn)
    throw new ErrorOperacion("PROYECTO_CERRADO");
  return proyecto;
}

function etapaUI(codigo: string) {
  const etapa = z
    .enum(["requerimientos", "diseno", "desarrollo"])
    .parse(codigo);
  return etapa === "requerimientos" ? "requisitos" : etapa;
}

export const listarCatalogos = cache(async (): Promise<CatalogosProyecto> => {
  const { supabase } = await obtenerSesion();
  const [a, m] = await Promise.all([
    supabase
      .from("tipo_actividad")
      .select("*")
      .eq("activa", true)
      .order("codigo"),
    supabase
      .from("tipo_metrica")
      .select("*")
      .eq("activa", true)
      .order("codigo"),
  ]);
  comprobarError(a.error);
  comprobarError(m.error);
  return {
    actividades: (a.data ?? []).map((t) => {
      const meta = TIPOS_ACTIVIDAD.find((v) => v.codigo === t.codigo);
      if (!meta)
        throw new Error("Catálogo no compatible con las definiciones v1");
      return {
        ...meta,
        id: t.id,
        nombre: t.nombre,
        inicial: t.preseleccionada,
        etapaCodigo: etapaUI(t.etapa_codigo),
      };
    }),
    metricas: (m.data ?? []).map((t) => {
      const meta = TIPOS_METRICA.find((v) => v.codigo === t.codigo);
      if (!meta)
        throw new Error("Catálogo no compatible con las definiciones v1");
      return {
        ...meta,
        id: t.id,
        nombre: t.nombre,
        etapaCodigo: etapaUI(t.etapa_codigo),
        unidad: z.enum(["%", "defectos"]).parse(t.unidad),
      };
    }),
  };
});

export async function buscarMiembros(
  entrada: unknown = {},
): Promise<Pagina<PersonaElegible>> {
  const { supabase, usuario } = await obtenerSesion();
  if (usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
  const p = validar(buscarMiembrosSchema, entrada);
  const r = await supabase.rpc("buscar_miembros_elegibles", {
    p_texto: p.texto,
    p_limite: Math.min(p.limite + 1, 100),
    p_cursor: p.cursor,
  });
  comprobarError(r.error);
  const rows = z
    .array(
      z.object({
        usuarioId: uuid,
        nombre: z.string(),
        rol: z.literal("Miembro del equipo"),
      }),
    )
    .parse(r.data);
  const items = rows
    .slice(0, p.limite)
    .map((x) => ({ id: x.usuarioId, nombre: x.nombre, rol: x.rol }));
  return {
    items,
    siguienteCursor:
      rows.length > p.limite || (p.limite === 100 && rows.length === 100)
        ? items.at(-1)!.id
        : null,
  };
}

export async function listarActividadesIniciales(
  proyectoId: string,
  entrada: unknown = {},
) {
  await exigirProyecto(proyectoId);
  const { supabase } = await obtenerSesion();
  const p = validar(paginaSchema, entrada);
  let query = supabase
    .from("actividad_sqa")
    .select(
      "id,descripcion,estado,creado_en,tipo:tipo_actividad(codigo,nombre,etapa_codigo),responsable_id",
    )
    .eq("proyecto_id", proyectoId)
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(p.limite + 1);
  if (p.cursor) {
    const c = leerCursor(p.cursor);
    query = query.or(
      `creado_en.lt.${c.fecha},and(creado_en.eq.${c.fecha},id.lt.${c.id})`,
    );
  }
  const r = await query;
  comprobarError(r.error);
  const rows = r.data ?? [],
    items = rows.slice(0, p.limite),
    last = items.at(-1);
  return {
    items,
    siguienteCursor:
      rows.length > p.limite && last
        ? crearCursor(last.creado_en, last.id)
        : null,
  };
}

export async function listarMetricasIniciales(proyectoId: string) {
  await exigirProyecto(proyectoId);
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("metrica_proyecto")
    .select(
      "id,objetivo:objetivo::text,objetivo_critico:objetivo_critico::text,operador,tipo:tipo_metrica(codigo,nombre,etapa_codigo,unidad)",
    )
    .eq("proyecto_id", proyectoId);
  comprobarError(r.error);
  return (r.data ?? []).sort((a, b) =>
    a.tipo.codigo.localeCompare(b.tipo.codigo),
  );
}
