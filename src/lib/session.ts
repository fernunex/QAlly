import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Usuario } from "@/lib/domain";
import { USUARIOS } from "@/lib/mock/data";

/**
 * SESIÓN DE DEMOSTRACIÓN — sin autenticación real.
 * Al conectar Supabase Auth se sustituye por la sesión verificada en servidor
 * (rol y participación se comprueban siempre en el servidor y con RLS).
 */
export const COOKIE_SESION_DEMO = "qally_demo_usuario";

export async function obtenerUsuarioActual(): Promise<Usuario> {
  const id = (await cookies()).get(COOKIE_SESION_DEMO)?.value;
  const usuario = USUARIOS.find((u) => u.id === id);
  if (!usuario) redirect("/login");
  return usuario;
}
