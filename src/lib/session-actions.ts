"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { comprobarError } from "@/lib/resultados";
export type EstadoLogin = { error: string | null; correo: string };
const loginSchema = z.strictObject({
  correo: z.email().max(254),
  contrasena: z.string().min(1).max(1024),
});

export async function iniciarSesion(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const correo = String(formData.get("correo") ?? "")
    .trim()
    .toLowerCase();
  const contrasena = String(formData.get("contrasena") ?? "");
  if (!loginSchema.safeParse({ correo, contrasena }).success)
    return { error: "Indica un correo válido y tu contraseña.", correo };
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });
    if (error || !data.user)
      return {
        error:
          "Correo o contraseña incorrectos, o servicio temporalmente no disponible.",
        correo,
      };
    const perfil = await supabase
      .from("perfil")
      .select("usuario_id")
      .eq("usuario_id", data.user.id)
      .maybeSingle();
    if (perfil.error || !perfil.data) {
      await supabase.auth.signOut();
      return {
        error: "No pudimos verificar el acceso de esta cuenta.",
        correo,
      };
    }
  } catch {
    return { error: "No pudimos iniciar sesión. Inténtalo de nuevo.", correo };
  }
  redirect("/proyectos");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  comprobarError((await supabase.auth.signOut({ scope: "local" })).error);
  redirect("/login");
}
