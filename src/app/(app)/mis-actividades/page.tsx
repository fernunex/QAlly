import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { NotaPendiente } from "@/components/states/ui-states";
import { obtenerUsuarioActual } from "@/lib/session";
export default async function Page() {
  await obtenerUsuarioActual();
  return (
    <PageContainer>
      <PageHeader titulo="Mis actividades" />
      <NotaPendiente>
        La entrega de actividades estará disponible en una próxima versión. Por
        ahora puedes consultar tus proyectos y sus actividades configuradas.
      </NotaPendiente>
    </PageContainer>
  );
}
