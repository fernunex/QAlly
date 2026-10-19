import { PageContainer } from "@/components/shell/page-header";
import { AvisoSoloLectura, EstadoNoDisponible } from "@/components/states/ui-states";
import { SaludProyecto } from "@/features/health/components/salud-proyecto";
import { obtenerContextoProyecto } from "@/lib/project-context";
import { consultarResumen } from "@/lib/mock/queries";

// CU-05: salud del proyecto, visible para todos los participantes.
export default async function Page({ params }: PageProps<"/proyectos/[proyectoId]">) {
  const { proyectoId } = await params;
  const { proyecto, cerrado } = await obtenerContextoProyecto(proyectoId);
  if (!proyecto) {
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  }
  const resumen = consultarResumen(proyecto);
  return (
    <PageContainer className="space-y-6">
      {cerrado ? <AvisoSoloLectura /> : null}
      <SaludProyecto resumen={resumen} />
    </PageContainer>
  );
}
