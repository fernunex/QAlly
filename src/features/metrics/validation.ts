import { z } from "zod";
import { ErrorOperacion } from "@/lib/resultados";
import type { TipoMetrica } from "@/lib/domain";
import { objetivoSchema, uuid } from "@/features/projects/validation";
import { validarDatosFuente, validarFuente } from "./lib/calculo";

// Los objetivos llegan como texto y se validan por tipo; no se convierten a Number.
const objetivoTexto = z.string().max(32);
const captura = {
  conteos: z.record(z.string().max(64), z.string().max(32)),
  fuenteReferencia: z.string().max(4096),
};
const limite = z.number().int().min(1).max(100).default(25);

export const agregarMetricaSchema = z.strictObject({
  proyectoId: uuid,
  tipoId: uuid,
  objetivo: objetivoTexto,
  objetivoCritico: objetivoTexto.nullable(),
});
export const configurarObjetivoSchema = z.strictObject({
  metricaProyectoId: uuid,
  // Token exacto devuelto por la BD (microsegundos y zona); se reenvía sin reformatear.
  configuradaEnEsperada: z.iso.datetime({ offset: true }),
  objetivo: objetivoTexto,
  objetivoCritico: objetivoTexto.nullable(),
});
export const registrarMedicionSchema = z.strictObject({
  medicionId: uuid,
  metricaProyectoId: uuid,
  medidaEn: z.iso.date("Indica una fecha válida."),
  ...captura,
});
export const corregirMedicionSchema = z.strictObject({
  medicionId: uuid,
  revisionEsperada: z.number().int().min(1).max(2147483647),
  ...captura,
});
export const listarMedicionesSchema = z.strictObject({
  metricaProyectoId: uuid,
  limite,
  cursor: z.string().max(1024).optional(),
});
export const listarCorreccionesSchema = z.strictObject({
  medicionId: uuid,
  limite,
  /** Número de revisión desde el que continuar (exclusivo). */
  cursor: z.number().int().min(2).max(2147483647).optional(),
});

/** Objetivos permitidos por tipo: M-01 conserva su objetivo crítico (criterio independiente); el resto no lo admite. */
export function objetivosDeTipo(
  tipo: Pick<TipoMetrica, "codigo" | "unidad">,
  objetivo: string,
  objetivoCritico: string | null,
) {
  const campos: Record<string, string> = {};
  const principal = objetivoSchema(tipo.unidad).safeParse(objetivo);
  if (!principal.success) campos.objetivo = principal.error.issues[0]!.message;
  let critico: string | null = null;
  if (tipo.codigo === "M-01") {
    const r = objetivoSchema("%", true).safeParse(objetivoCritico ?? "");
    if (r.success) critico = r.data;
    else campos.objetivoCritico = "Revisa el objetivo de flujos críticos.";
  } else if (objetivoCritico !== null)
    campos.objetivoCritico = "Esta métrica no tiene objetivo crítico.";
  if (Object.keys(campos).length)
    throw new ErrorOperacion("DATOS_INVALIDOS", campos);
  return { objetivo: principal.data!, objetivoCritico: critico };
}

/** datos_fuente exactos del catálogo v1: conteos enteros y fuente_referencia opcional (DEC-26). */
export function datosFuenteDeTipo(
  tipo: Pick<TipoMetrica, "codigo" | "campos">,
  conteos: Record<string, string>,
  fuenteReferencia: string,
) {
  const claves = tipo.campos.map((c) => c.clave);
  const campos: Record<string, string> = validarDatosFuente(
    tipo.codigo,
    tipo.campos,
    conteos,
  );
  if (Object.keys(conteos).some((k) => !claves.includes(k)))
    campos.formulario = "Los datos no corresponden a la métrica.";
  const errorFuente = validarFuente(fuenteReferencia);
  if (errorFuente) campos.fuenteReferencia = errorFuente;
  if (Object.keys(campos).length)
    throw new ErrorOperacion("DATOS_INVALIDOS", campos);
  const fuente = fuenteReferencia.trim();
  return {
    ...Object.fromEntries(claves.map((k) => [k, Number(conteos[k]!.trim())])),
    ...(fuente ? { fuente_referencia: fuente } : {}),
  } as Record<string, number | string>;
}

/** Fecha de medición capturada como día: se guarda a las 00:00 UTC y se muestra con formatDia. */
export function medidaEnISO(fecha: string) {
  return `${fecha}T00:00:00Z`;
}

const cursorSchema = z.strictObject({
  fecha: z.iso.datetime({ offset: true }),
  orden: z.string().regex(/^[1-9]\d{0,18}$/),
});
export function crearCursorMediciones(fecha: string, orden: string) {
  return Buffer.from(JSON.stringify({ fecha, orden })).toString("base64url");
}
export function leerCursorMediciones(cursor: string) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    throw new ErrorOperacion("DATOS_INVALIDOS", {
      cursor: "El cursor no es válido. Vuelve a abrir la métrica.",
    });
  }
}
