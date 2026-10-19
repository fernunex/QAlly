import { z } from "zod";
import { ErrorOperacion } from "@/lib/resultados";

z.config(z.locales.es());

export const uuid = z.uuid();
export const version = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine(
    (v) =>
      /^[1-9]\d*$/.test(v) &&
      v.length <= 19 &&
      BigInt(v) <= 9223372036854775807n,
  );
const texto = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio.")
    .refine((v) => [...v].length <= max, `Máximo ${max} caracteres.`);
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => [...v].length <= max, `Máximo ${max} caracteres.`)
    .nullable()
    .transform((v) => v || null);
const generales = {
  nombre: texto(200),
  descripcion: texto(5000),
  periodoAcademico: opcional(40),
  fechaInicio: z.iso.date("Indica una fecha válida."),
  fechaFinPrevista: z.iso.date("Indica una fecha válida.").nullable(),
};
function fechas(v: { fechaInicio: string; fechaFinPrevista: string | null }) {
  return !v.fechaFinPrevista || v.fechaFinPrevista >= v.fechaInicio;
}
const reglaFechas = {
  message: "El fin previsto no puede ser anterior al inicio.",
  path: ["fechaFinPrevista"],
};
export const datosGeneralesSchema = z
  .strictObject(generales)
  .refine(fechas, reglaFechas);
const ids = z
  .array(uuid)
  .refine(
    (v) => new Set(v).size === v.length,
    "No se permiten elementos repetidos.",
  );
// No pasar decimales por Number: objetivos y versiones conservan su representación exacta.
const decimal = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,4})?$/,
    "Escribe un decimal sin exponente, con hasta cuatro decimales.",
  );
export function objetivoSchema(unidad: "%" | "defectos") {
  return z
    .string()
    .trim()
    .refine(
      (v) => {
        const normal = v.replace(/^0+(?=\d)/, "");
        if (unidad === "defectos")
          return (
            /^\d+$/.test(normal) &&
            normal.length <= 10 &&
            BigInt(normal) <= 2000000000n
          );
        if (!/^\d{1,3}(\.\d{1,4})?$/.test(normal)) return false;
        const [entero, fraccion = ""] = normal.split(".");
        return (
          BigInt(entero) * 10000n + BigInt(fraccion.padEnd(4, "0")) <= 1000000n
        );
      },
      unidad === "%"
        ? "Usa un porcentaje de 0 a 100 con hasta cuatro decimales."
        : "Usa un entero entre 0 y 2000000000.",
    );
}
export const crearProyectoSchema = z
  .strictObject({
    ...generales,
    solicitudId: uuid,
    miembrosIds: ids,
    actividadesTiposIds: ids,
    metricas: z
      .array(
        z.strictObject({
          tipoId: uuid,
          objetivo: decimal,
          objetivoCritico: decimal.optional(),
        }),
      )
      .refine(
        (v) => new Set(v.map((m) => m.tipoId)).size === v.length,
        "Una métrica no puede repetirse.",
      ),
  })
  .refine(fechas, reglaFechas);
export const editarProyectoSchema = z
  .strictObject({ ...generales, proyectoId: uuid, versionEsperada: version })
  .refine(fechas, reglaFechas);
export const cerrarProyectoSchema = z.strictObject({
  proyectoId: uuid,
  versionEsperada: version,
});
export const paginaSchema = z.strictObject({
  limite: z.number().int().min(1).max(100).default(25),
  cursor: z.string().max(1024).optional(),
});
export const buscarMiembrosSchema = z.strictObject({
  texto: z.string().trim().max(120).default(""),
  limite: z.number().int().min(1).max(100).default(25),
  cursor: uuid.optional(),
});

export function validar<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const result = schema.safeParse(entrada);
  if (!result.success) {
    const campos: Record<string, string> = {};
    for (const issue of result.error.issues)
      campos[issue.path.join(".") || "formulario"] ??= issue.message;
    throw new ErrorOperacion("DATOS_INVALIDOS", campos);
  }
  return result.data;
}

export function erroresGenerales(entrada: unknown): Record<string, string> {
  const r = datosGeneralesSchema.safeParse(entrada);
  return r.success
    ? {}
    : Object.fromEntries(
        r.error.issues.map((i) => [i.path.join("."), i.message]),
      );
}
