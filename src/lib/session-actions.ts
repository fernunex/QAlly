"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USUARIOS } from "@/lib/mock/data";
import { COOKIE_SESION_DEMO } from "@/lib/session";

export type EstadoLogin = { error: string | null; correo: string };

/** Demo: cualquier contraseña no vacía con un correo semilla inicia sesión. */
export async function iniciarSesion(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(formData.get("contrasena") ?? "");
  const usuario = USUARIOS.find((u) => u.correo === correo);
  if (!usuario || contrasena.length === 0) {
    return { error: "Correo o contraseña incorrectos. Verifica tus datos.", correo };
  }
  (await cookies()).set(COOKIE_SESION_DEMO, usuario.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(usuario.rol === "QA" ? "/proyectos" : "/mis-actividades");
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE_SESION_DEMO);
  redirect("/login");
}

/** Solo demo: alterna entre la cuenta QA y una cuenta Miembro para revisar ambas vistas. */
export async function cambiarCuentaDemo(usuarioId: string) {
  if (!USUARIOS.some((u) => u.id === usuarioId)) return;
  (await cookies()).set(COOKIE_SESION_DEMO, usuarioId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/proyectos");
}
