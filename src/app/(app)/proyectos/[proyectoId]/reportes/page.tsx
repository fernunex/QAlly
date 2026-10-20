import { PageContainer, PageHeader } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
} from "@/components/states/ui-states";
import { GeneradorReporte } from "@/features/reports/components/generador-reporte";
import { obtenerContextoProyecto } from "@/lib/project-context";

/**
 * CU-06: solo QA participante genera y exporta, también con el proyecto cerrado. Ocultar la
 * pantalla es solo presentación: `generarReporte` y POST /api/reportes/pdf vuelven a
 * autorizar en el servidor.
 */
export default async function Page({
  params,
}: PageProps<"/proyectos/[proyectoId]/reportes">) {
  const { proyectoId } = await params;
  const { proyecto, esQA, cerrado } = await obtenerContextoProyecto(proyectoId);
  if (!proyecto || !esQA)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  return (
    <PageContainer className="space-y-6">
      {cerrado ? <AvisoSoloLectura /> : null}
      <PageHeader
        titulo="Reportes"
        descripcion="Genera el reporte de calidad con el estado actual del proyecto y expórtalo a PDF. No se guarda un historial de reportes."
      />
      <GeneradorReporte proyectoId={proyecto.id} />
    </PageContainer>
  );
}
