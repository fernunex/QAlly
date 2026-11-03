import "server-only";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";
import { exigirProyecto } from "@/features/projects/server/queries";
import { uuid, validar } from "@/features/projects/validation";
import type {
  CorreccionMedicion,
  HistorialCorrecciones,
  Medicion,
  MetricaProyecto,
  PaginaMediciones,
  RevisionMedicion,
} from "../types";
import { metricaDTO } from "../dto";
import {
  crearCursorMediciones,
  leerCursorMediciones,
  listarCorreccionesSchema,
  listarMedicionesSchema,
} from "../validation";

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

/** Proyecto de una métrica visible por RLS; inexistente o ajena se tratan igual. */
export async function proyectoDeMetrica(metricaProyectoId: string) {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("metrica_proyecto")
    .select("proyecto_id")
    .eq("id", metricaProyectoId)
    .maybeSingle();
  comprobarError(r.error);
  if (!r.data) throw new ErrorOperacion("NO_DISPONIBLE");
  return r.data.proyecto_id;
}

/** Métrica de una medición visible por RLS. */
export async function metricaDeMedicion(medicionId: string) {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("medicion")
    .select("metrica_proyecto_id")
    .eq("id", medicionId)
    .maybeSingle();
  comprobarError(r.error);
  if (!r.data) throw new ErrorOperacion("NO_DISPONIBLE");
  return r.data.metrica_proyecto_id;
}

/** SF-01: métricas del proyecto con valor actual y cumplimiento (también si está cerrado). */
export async function listarMetricas(
  proyectoId: string,
): Promise<MetricaProyecto[]> {
  await exigirProyecto(proyectoId);
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("metrica_proyecto")
    .select("id")
    .eq("proyecto_id", proyectoId);
  comprobarError(r.error);
  // Como máximo una por tipo del catálogo (cuatro en v1): una consulta por métrica.
  const metricas = await Promise.all(
    (r.data ?? []).map((m) => consultarMetrica(m.id)),
  );
  return metricas.sort((a, b) => a.tipo.codigo.localeCompare(b.tipo.codigo));
}

export async function consultarMetrica(
  metricaProyectoId: string,
): Promise<MetricaProyecto> {
  const { supabase } = await obtenerSesion();
  const r = await supabase.rpc("consultar_metrica", {
    p_metrica_proyecto_id: metricaProyectoId,
  });
  comprobarError(r.error);
  return metricaDTO(r.data);
}

const revisionRow = z.object({
  numero_revision: z.number().int(),
  datos_fuente: z.record(z.string(), z.union([z.number(), z.string()])),
  valor: decimal.nullable(),
  causa_no_evaluable: z.string().nullable(),
  registrada_en: z.string(),
  autor: z.object({ nombre: z.string() }).nullable(),
});
function revisionDTO(raw: unknown): RevisionMedicion {
  const r = revisionRow.parse(raw);
  const { fuente_referencia, ...conteos } = r.datos_fuente;
  return {
    numero: r.numero_revision,
    datosFuente: z.record(z.string(), z.number()).parse(conteos),
    fuenteReferencia: z.string().nullable().parse(fuente_referencia ?? null),
    valor: r.valor,
    causa: r.causa_no_evaluable,
    // Un autor siempre participa del proyecto; el respaldo solo evita romper la vista.
    autorNombre: r.autor?.nombre ?? "Usuario",
    registradaEn: r.registrada_en,
  };
}
const columnasRevision =
  "numero_revision,datos_fuente,valor:valor::text,causa_no_evaluable,registrada_en,autor:perfil(nombre)";

/** Historial por medida_en DESC, orden_registro DESC; cada medición con su última revisión. */
export async function listarMediciones(
  entrada: unknown,
): Promise<PaginaMediciones> {
  const p = validar(listarMedicionesSchema, entrada);
  await proyectoDeMetrica(p.metricaProyectoId);
  const { supabase } = await obtenerSesion();
  let query = supabase
    .from("medicion")
    .select(
      `id,medida_en,orden_registro:orden_registro::text,revisiones:revision_medicion(${columnasRevision})`,
    )
    .eq("metrica_proyecto_id", p.metricaProyectoId)
    .order("medida_en", { ascending: false })
    .order("orden_registro", { ascending: false })
    .order("numero_revision", {
      referencedTable: "revisiones",
      ascending: false,
    })
    .limit(1, { referencedTable: "revisiones" })
    .limit(p.limite + 1);
  if (p.cursor) {
    const c = leerCursorMediciones(p.cursor);
    query = query.or(
      `medida_en.lt.${c.fecha},and(medida_en.eq.${c.fecha},orden_registro.lt.${c.orden})`,
    );
  }
  const r = await query;
  comprobarError(r.error);
  const rows = z
    .array(
      z.object({
        id: uuid,
        medida_en: z.string(),
        orden_registro: z.string(),
        revisiones: z.array(z.unknown()).length(1),
      }),
    )
    .parse(r.data ?? []);
  const items: Medicion[] = rows.slice(0, p.limite).map((m) => ({
    id: m.id,
    medidaEn: m.medida_en,
    revision: revisionDTO(m.revisiones[0]),
  }));
  const last = rows[p.limite - 1];
  return {
    items,
    siguienteCursor:
      rows.length > p.limite && last
        ? crearCursorMediciones(last.medida_en, last.orden_registro)
        : null,
  };
}

/** SF-04: correcciones con valor anterior y nuevo, autor y fecha; incluye la captura original. */
export async function listarCorrecciones(
  entrada: unknown,
): Promise<HistorialCorrecciones> {
  const p = validar(listarCorreccionesSchema, entrada);
  await metricaDeMedicion(p.medicionId);
  const { supabase } = await obtenerSesion();
  let query = supabase
    .from("revision_medicion")
    .select(columnasRevision)
    .eq("medicion_id", p.medicionId)
    .order("numero_revision", { ascending: false })
    // Una fila extra aporta el valor anterior de la última corrección de la página.
    .limit(p.limite + 1);
  if (p.cursor) query = query.lt("numero_revision", p.cursor);
  const r = await query;
  comprobarError(r.error);
  const rows = (r.data ?? []).map(revisionDTO);
  let original = rows.find((x) => x.numero === 1);
  if (!original) {
    const o = await supabase
      .from("revision_medicion")
      .select(columnasRevision)
      .eq("medicion_id", p.medicionId)
      .eq("numero_revision", 1)
      .single();
    comprobarError(o.error);
    original = revisionDTO(o.data);
  }
  const items: CorreccionMedicion[] = rows
    .slice(0, p.limite)
    .map((x, i) => ({
      ...x,
      valorAnterior: (x.numero === 2 ? original : rows[i + 1])?.valor ?? null,
    }))
    .filter((x) => x.numero > 1);
  const last = items.at(-1);
  return {
    items,
    original,
    siguienteCursor:
      rows.length > p.limite && last && last.numero > 2 ? last.numero : null,
  };
}
