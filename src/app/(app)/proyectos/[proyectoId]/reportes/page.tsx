import { BanIcon } from "lucide-react";
import { PageContainer } from "@/components/shell/page-header";
import { EstadoNoDisponible, EstadoVacio } from "@/components/states/ui-states";
import { ReporteAcciones } from "@/features/reports/components/reporte-acciones";
import { ReporteDocumento } from "@/features/reports/components/reporte-documento";
import { formatFechaHora } from "@/lib/format";
import { consultarResumen } from "@/lib/mock/queries";
import { obtenerContextoProyecto } from "@/lib/project-context";

// CU-06: solo QA. Un proyecto cerrado sí permite reporte (es lectura).
export default async function Page({ params }: PageProps<"/proyectos/[proyectoId]/reportes">) {
  const { proyectoId } = await params;
  const { proyecto, esQA, usuario } = await obtenerContextoProyecto(proyectoId);
  if (!proyecto) {
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  }
  if (!esQA) {
    return (
      <PageContainer>
        <EstadoVacio
          icon={BanIcon}
          titulo="Operación no permitida"
          descripcion="Solo el rol QA puede generar y exportar el reporte de calidad del proyecto."
        />
      </PageContainer>
    );
  }
  // Mismas cifras que la pestaña Salud (CU-05).
  const resumen = consultarResumen(proyecto);
  return (
    <PageContainer className="space-y-6">
      <ReporteAcciones capturadoEn={formatFechaHora(resumen.generadoEn)} />
      <ReporteDocumento resumen={resumen} generadoPor={`${usuario.nombre} (${usuario.rol})`} />
    </PageContainer>
  );
}
