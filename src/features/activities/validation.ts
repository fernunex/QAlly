import { z } from "zod";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import {
  opcional,
  texto,
  uuid,
  version,
} from "@/features/projects/validation";

export const etapaSchema = z.enum(["requisitos", "diseno", "desarrollo"]);
/** Responsable: UUID de Miembro o «sin» para actividades sin asignar. */
export const filtroResponsableSchema = z.union([uuid, z.literal("sin")]);

export const listarActividadesSchema = z.strictObject({
  proyectoId: uuid,
  limite: z.number().int().min(1).max(100).default(25),
  cursor: z.string().max(1024).optional(),
  estado: z.enum(ESTADOS_ACTIVIDAD).optional(),
  soloMias: z.boolean().default(false),
  etapa: etapaSchema.optional(),
  responsable: filtroResponsableSchema.optional(),
});
export const consultarActividadSchema = z.strictObject({
  actividadId: uuid,
  limiteIntentos: z.number().int().min(1).max(100).default(10),
  /** Número de intento a partir del cual continuar (exclusivo). */
  cursorIntentos: z
    .string()
    .regex(/^[1-9]\d{0,9}$/)
    .optional(),
});
export const agregarActividadSchema = z.strictObject({
  proyectoId: uuid,
  tipoId: uuid,
  descripcion: texto(5000),
});
export const asignarResponsableSchema = z.strictObject({
  actividadId: uuid,
  responsableId: uuid,
  versionEsperada: version,
});
export const aprobarEntregaSchema = z.strictObject({
  entregaId: uuid,
  versionEsperada: version,
  observaciones: opcional(10000).default(null),
});
export const devolverEntregaSchema = z.strictObject({
  entregaId: uuid,
  versionEsperada: version,
  observaciones: texto(10000),
});
