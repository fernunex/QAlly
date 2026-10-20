import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(
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
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure:
                process.env.NODE_ENV === "production" &&
                process.env.SUPABASE_URL?.startsWith("https://"),
            });
        },
      },
    },
  );
  // Renovar y verificar; cada lectura/acción vuelve a verificar identidad y autorización.
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/proyectos/:path*",
    "/mis-actividades/:path*",
    "/api/evidencias/:path*",
    "/login",
  ],
};
