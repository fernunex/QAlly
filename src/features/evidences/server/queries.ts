import "server-only";
import { z } from "zod";
import type { Entrega, Evidencia } from "@/lib/domain";
import { nombreEtapa } from "@/lib/catalogs";
import { obtenerSesion } from "@/lib/session";
import { comprobarError } from "@/lib/resultados";
import { uuid, version } from "@/features/projects/validation";
import type { MiActividad, Nombres } from "@/features/activities/utils";

export type MisActividades = { actividades: MiActividad[]; nombres: Nombres };

// Sugerencias de FK explícitas: evidencia también relaciona entrega y archivo_evidencia.
const seleccion =
  "id,proyecto_id,descripcion,estado,creado_en,version:version::text,responsable_id," +
  "tipo:tipo_actividad!actividad_sqa_tipo_actividad_id_fkey(id,codigo,nombre,etapa_codigo)," +
  "proyecto:proyecto!actividad_sqa_proyecto_id_fkey(nombre,cerrado_en)," +
  "entregas:entrega!entrega_actividad_id_fkey(id,numero_intento,resultado,autor_id,creada_en,enviada_en," +
  "evidencias:evidencia!evidencia_entrega_id_fkey(id,tipo,url,creada_en,archivo:archivo_evidencia!evidencia_archivo_id_fkey(nombre_archivo,tamano_bytes))," +
  "revision:revision_entrega!revision_entrega_entrega_id_fkey(decision,observaciones,qa_id,revisada_en))";

const uno = <T extends z.ZodType>(s: T) =>
  z.union([s, z.array(s)]).transform((v) => (Array.isArray(v) ? v[0] : v));
const evidenciaRow = z.object({
  id: uuid,
  tipo: z.enum(["PDF", "Enlace"]),
  url: z.string().nullable(),
  creada_en: z.string(),
  archivo: uno(
    z.object({ nombre_archivo: z.string(), tamano_bytes: z.number() }),
  ).nullable(),
});
const entregaRow = z.object({
  id: uuid,
  numero_intento: z.number(),
  resultado: z.string().nullable(),
  autor_id: uuid,
  creada_en: z.string(),
  enviada_en: z.string().nullable(),
  evidencias: z.array(evidenciaRow),
  revision: uno(
    z.object({
      decision: z.enum(["Aprobar", "Devolver"]),
      observaciones: z.string().nullable(),
      qa_id: uuid,
      revisada_en: z.string(),
    }),
  ).nullable(),
});
const actividadRow = z.object({
  id: uuid,
  proyecto_id: uuid,
  descripcion: z.string(),
  estado: z.enum(["Pendiente", "En progreso", "En revisión", "Aprobada"]),
  version,
  responsable_id: uuid.nullable(),
  tipo: uno(
    z.object({
      id: uuid,
      codigo: z.string(),
      nombre: z.string(),
      etapa_codigo: z.enum(["requerimientos", "diseno", "desarrollo"]),
    }),
  ),
  proyecto: uno(
    z.object({ nombre: z.string(), cerrado_en: z.string().nullable() }),
  ),
  entregas: z.array(entregaRow),
});

function evidenciaDTO(e: z.infer<typeof evidenciaRow>): Evidencia {
  if (e.tipo === "PDF")
    return {
      id: e.id,
      tipo: "pdf",
      nombreArchivo: e.archivo?.nombre_archivo ?? "evidencia.pdf",
      tamanoBytes: e.archivo?.tamano_bytes ?? 0,
    };
  return { id: e.id, tipo: "enlace", url: e.url ?? "" };
}

function entregaDTO(
  actividadId: string,
  e: z.infer<typeof entregaRow>,
): Entrega {
  return {
    id: e.id,
    actividadId,
    numeroIntento: e.numero_intento,
    resultado: e.resultado,
    autorId: e.autor_id,
    creadaEn: e.creada_en,
    enviadaEn: e.enviada_en,
    // Mismo orden en que se agregaron; no expone rutas privadas.
    evidencias: [...e.evidencias]
      .sort((a, b) => a.creada_en.localeCompare(b.creada_en) || a.id.localeCompare(b.id))
      .map(evidenciaDTO),
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

function actividadDTO(raw: unknown): MiActividad {
  const a = actividadRow.parse(raw);
  const etapa =
    a.tipo.etapa_codigo === "requerimientos" ? "requisitos" : a.tipo.etapa_codigo;
  return {
    id: a.id,
    proyectoId: a.proyecto_id,
    tipo: {
      id: a.tipo.id,
      codigo: a.tipo.codigo,
      nombre: a.tipo.nombre,
      etapaCodigo: etapa,
    },
    descripcion: a.descripcion,
    responsable: null,
    estado: a.estado,
    version: a.version,
    // Intentos por número descendente (contratos-v1 §2).
    entregas: a.entregas
      .map((e) => entregaDTO(a.id, e))
      .sort((x, y) => y.numeroIntento - x.numeroIntento),
    eventos: [],
    proyectoNombre: a.proyecto.nombre,
    etapaNombre: nombreEtapa(etapa),
    proyectoCerrado: a.proyecto.cerrado_en !== null,
  };
}

/** Nombres de autores y revisores; RLS solo devuelve perfiles de proyectos compartidos. */
async function resolverNombres(actividades: MiActividad[]): Promise<Nombres> {
  const { supabase, usuario } = await obtenerSesion();
  const ids = new Set<string>();
  for (const a of actividades)
    for (const e of a.entregas) {
      ids.add(e.autorId);
      if (e.revision) ids.add(e.revision.qaId);
    }
  ids.delete(usuario.id);
  const nombres: Nombres = { [usuario.id]: usuario.nombre };
  if (ids.size === 0) return nombres;
  const r = await supabase
    .from("perfil")
    .select("usuario_id,nombre")
    .in("usuario_id", [...ids]);
  comprobarError(r.error);
  for (const p of r.data ?? []) nombres[p.usuario_id] = p.nombre;
  return nombres;
}

/** CU-04 pasos 1–2: actividades asignadas al usuario en proyectos donde participa. */
export async function listarMisActividades(): Promise<MisActividades> {
  const { supabase, usuario } = await obtenerSesion();
  if (usuario.rol !== "Miembro") return { actividades: [], nombres: {} };
  const r = await supabase
    .from("actividad_sqa")
    .select(seleccion)
    .eq("responsable_id", usuario.id)
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false });
  comprobarError(r.error);
  const actividades = ((r.data ?? []) as unknown[]).map(actividadDTO);
  return { actividades, nombres: await resolverNombres(actividades) };
}

/** null = NO_DISPONIBLE: inexistente, ajena o no asignada al usuario (mismo trato). */
export async function consultarMiActividad(
  actividadId: string,
): Promise<MisActividades & { actividad: MiActividad | null }> {
  const { supabase, usuario } = await obtenerSesion();
  if (!uuid.safeParse(actividadId).success || usuario.rol !== "Miembro")
    return { actividad: null, actividades: [], nombres: {} };
  const r = await supabase
    .from("actividad_sqa")
    .select(seleccion)
    .eq("id", actividadId)
    .eq("responsable_id", usuario.id)
    .maybeSingle();
  comprobarError(r.error);
  const actividad = r.data ? actividadDTO(r.data) : null;
  const actividades = actividad ? [actividad] : [];
  return { actividad, actividades, nombres: await resolverNombres(actividades) };
}

/** Actividad propia de una entrega o evidencia, leída con RLS antes de mutar. */
export async function actividadDeEntrega(
  entregaId: string,
): Promise<string | null> {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("entrega")
    .select("actividad_id")
    .eq("id", entregaId)
    .maybeSingle();
  comprobarError(r.error);
  return r.data?.actividad_id ?? null;
}

export async function entregaDeEvidencia(
  evidenciaId: string,
): Promise<string | null> {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("evidencia")
    .select("entrega_id")
    .eq("id", evidenciaId)
    .maybeSingle();
  comprobarError(r.error);
  return r.data?.entrega_id ?? null;
}
