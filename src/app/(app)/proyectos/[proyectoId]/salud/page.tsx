import { PageContainer } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
} from "@/components/states/ui-states";
import { SaludProyecto } from "@/features/health/components/salud-proyecto";
import { consultarResumen } from "@/features/health/server/queries";
import type { ResumenProyecto } from "@/features/health/types";
import { ErrorOperacion } from "@/lib/resultados";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function Page({
  params,
}: PageProps<"/proyectos/[proyectoId]/salud">) {
  await obtenerUsuarioActual();
  const { proyectoId } = await params;
  let resumen: ResumenProyecto;
  try {
    resumen = await consultarResumen(proyectoId);
  } catch (error) {
    // FE-02: inexistente o sin acceso se tratan igual. Otros fallos van a error.tsx (FE-03).
    if (error instanceof ErrorOperacion && error.codigo === "NO_DISPONIBLE")
      return (
        <PageContainer>
          <EstadoNoDisponible />
        </PageContainer>
      );
    throw error;
  }
  return (
    <PageContainer className="space-y-6">
      {resumen.proyecto.cerradoEn ? <AvisoSoloLectura /> : null}
      <SaludProyecto resumen={resumen} />
    </PageContainer>
  );
}
