import { PageContainer } from "@/components/shell/page-header";
import { EstadoNoDisponible } from "@/components/states/ui-states";
import { MetricasVista } from "@/features/metrics/components/metricas-vista";
import { obtenerContextoProyecto } from "@/lib/project-context";
import { listarMetricas, nombreUsuario } from "@/lib/mock/queries";

/** CU-02 · Métricas del proyecto. Lectura para ambos roles; escritura solo QA en proyecto abierto. */
export default async function MetricasPage({ params }: PageProps<"/proyectos/[proyectoId]/metricas">) {
  const { proyectoId } = await params;
  const { proyecto, esQA, cerrado } = await obtenerContextoProyecto(proyectoId);
  if (!proyecto) {
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  }

  const metricas = listarMetricas(proyecto.id);
  const ids = new Set(metricas.flatMap((m) => m.mediciones.flatMap((md) => md.revisiones.map((r) => r.autorId))));
  const autores = Object.fromEntries([...ids].map((id) => [id, nombreUsuario(id)]));

  return (
    <PageContainer>
      <MetricasVista metricas={metricas} autores={autores} esQA={esQA} cerrado={cerrado} />
    </PageContainer>
  );
}
