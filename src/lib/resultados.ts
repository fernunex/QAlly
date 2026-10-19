export const mensajes = {
  SIN_SESION: "Tu sesión terminó. Inicia sesión de nuevo.",
  PROHIBIDO: "No tienes permiso para realizar esta operación.",
  NO_DISPONIBLE: "Este proyecto no está disponible.",
  DATOS_INVALIDOS: "Revisa los campos indicados antes de guardar.",
  CONFLICTO:
    "El registro cambió o esta solicitud tiene otro contenido. Recarga antes de volver a intentarlo.",
  PROYECTO_CERRADO: "El proyecto está cerrado y solo permite consultas.",
  TAMANO_EXCEDIDO: "El archivo supera el límite de 3 MiB.",
  FALLO_PERSISTENCIA: "No pudimos completar la operación. Inténtalo de nuevo.",
} as const;
export type CodigoError = keyof typeof mensajes;
export type ErrorPublico = {
  codigo: CodigoError;
  mensaje: string;
  campos?: Record<string, string>;
};
export type Resultado<T> =
  { ok: true; datos: T } | { ok: false; error: ErrorPublico };

export class ErrorOperacion extends Error {
  constructor(
    public codigo: CodigoError,
    public campos?: Record<string, string>,
  ) {
    super(mensajes[codigo]);
  }
}

export function errorPublico(error: unknown): ErrorPublico {
  if (error instanceof ErrorOperacion)
    return {
      codigo: error.codigo,
      mensaje: error.message,
      campos: error.campos,
    };
  // No registrar cuerpos, credenciales ni errores SQL completos.
  console.error("FALLO_PERSISTENCIA", crypto.randomUUID());
  return { codigo: "FALLO_PERSISTENCIA", mensaje: mensajes.FALLO_PERSISTENCIA };
}

export function comprobarError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return;
  const codigo = error.message;
  if (codigo && Object.hasOwn(mensajes, codigo))
    throw new ErrorOperacion(codigo as CodigoError);
  if (error.code === "23505") throw new ErrorOperacion("CONFLICTO");
  if (
    ["23514", "23503", "22001", "22P02", "22003", "22007", "22008"].includes(
      error.code ?? "",
    )
  )
    throw new ErrorOperacion("DATOS_INVALIDOS");
  if (["PGRST301", "PGRST303"].includes(error.code ?? ""))
    throw new ErrorOperacion("SIN_SESION");
  throw new Error("FALLO_PERSISTENCIA");
}
