import "server-only";
import { obtenerSesion } from "@/lib/session";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";
import { uuid } from "@/features/projects/validation";
import { resumenDTO } from "../dto";
import type { ResumenProyecto } from "../types";

/**
 * `consultarResumen` (contratos v1 §6): lectura autorizada y consistente del estado actual
 * del proyecto con la sesión del usuario. La RPC exige participación (QA o Miembro, también
 * con el proyecto cerrado) y calcula conteos, valores vigentes y cumplimiento; aquí no se
 * recalcula nada. Inexistente, ajeno o identificador malformado: NO_DISPONIBLE.
 *
 * CU-06 debe reutilizar esta función para que vista y reporte muestren el mismo resumen.
 */
export async function consultarResumen(
  proyectoId: string,
): Promise<ResumenProyecto> {
  if (!uuid.safeParse(proyectoId).success)
    throw new ErrorOperacion("NO_DISPONIBLE");
  const { supabase } = await obtenerSesion();
  const r = await supabase.rpc("consultar_resumen", {
    p_proyecto_id: proyectoId,
  });
  comprobarError(r.error);
  if (r.data === null) throw new ErrorOperacion("NO_DISPONIBLE");
  return resumenDTO(r.data);
}
