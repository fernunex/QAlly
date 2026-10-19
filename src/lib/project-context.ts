import "server-only";
import type { Proyecto, Usuario } from "@/lib/domain";
import { consultarProyecto } from "@/lib/mock/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export type ContextoProyecto = {
  usuario: Usuario;
  /** null = NO_DISPONIBLE (inexistente o sin participación). */
  proyecto: Proyecto | null;
  esQA: boolean;
  cerrado: boolean;
  /** QA participante en proyecto abierto. La UI solo oculta; el servidor vuelve a autorizar. */
  puedeGestionar: boolean;
};

export async function obtenerContextoProyecto(proyectoId: string): Promise<ContextoProyecto> {
  const usuario = await obtenerUsuarioActual();
  const proyecto = consultarProyecto(proyectoId, usuario.id);
  const esQA = usuario.rol === "QA";
  const cerrado = proyecto?.cerradoEn != null;
  return { usuario, proyecto, esQA, cerrado, puedeGestionar: esQA && !!proyecto && !cerrado };
}
