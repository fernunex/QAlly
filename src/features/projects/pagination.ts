import { z } from "zod";
import { uuid } from "./validation";
import { ErrorOperacion } from "@/lib/resultados";
const cursorSchema = z.strictObject({
  fecha: z.iso.datetime({ offset: true }),
  id: uuid,
});
export function leerCursor(cursor: string) {
  try {
    if (cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(cursor))
      throw new Error();
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    throw new ErrorOperacion("DATOS_INVALIDOS", {
      cursor: "El cursor no es válido. Vuelve al inicio del listado.",
    });
  }
}
export function crearCursor(fecha: string, id: string) {
  return Buffer.from(JSON.stringify({ fecha, id })).toString("base64url");
}
