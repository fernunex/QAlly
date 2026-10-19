import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Usuario } from "@/lib/domain";
import { crearClienteServidor } from "@/lib/supabase/server";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";

// cache de React deduplica dentro de una petición; no comparte sesiones entre usuarios.
export const obtenerSesion = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.status && error.status >= 500)
    throw new ErrorOperacion("FALLO_PERSISTENCIA");
  if (error || !data.user) throw new ErrorOperacion("SIN_SESION");
  const perfil = await supabase
    .from("perfil")
    .select("usuario_id,nombre,rol")
    .eq("usuario_id", data.user.id)
    .maybeSingle();
  comprobarError(perfil.error);
  if (!perfil.data) throw new ErrorOperacion("PROHIBIDO");
  const usuario: Usuario = {
    id: data.user.id,
    nombre: perfil.data.nombre,
    nombreCorto: perfil.data.nombre,
    correo: data.user.email ?? "",
    rol: perfil.data.rol === "QA" ? "QA" : "Miembro",
  };
  return { supabase, usuario };
});

export async function obtenerUsuarioActual() {
  try {
    return (await obtenerSesion()).usuario;
  } catch (error) {
    if (error instanceof ErrorOperacion && error.codigo === "SIN_SESION")
      redirect("/login");
    throw error;
  }
}
