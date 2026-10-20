import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Adaptador privilegiado de archivos (ADR-002). Solo se usa después de verificar
 * identidad y autorización con la sesión del usuario; la credencial nunca sale del servidor.
 */
export function crearClienteAdministrativo() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error("FALLO_PERSISTENCIA");
  return createClient<Database>(process.env.SUPABASE_URL!, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // La transferencia tiene un plazo de 60 s, menor que la reserva de 30 minutos.
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(60000),
        }),
    },
  });
}
