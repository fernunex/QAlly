import "server-only";
import { createServerClient } from "@supabase/ssr";
import { connection } from "next/server";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function crearClienteServidor() {
  // El SDK consulta el reloj incluso en tareas de sesión: no ejecutarlo al prerenderizar.
  await connection();
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          }),
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          // El proxy renueva cookies cuando se está renderizando un Server Component.
          try {
            for (const { name, value, options } of values)
              jar.set(name, value, {
                ...options,
                httpOnly: true,
                sameSite: "lax",
                secure:
                  process.env.NODE_ENV === "production" &&
                  process.env.SUPABASE_URL?.startsWith("https://"),
              });
          } catch {
            /* Durante render cookies es de solo lectura. */
          }
        },
      },
    },
  );
}
