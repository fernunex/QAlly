"use client";
import Link from "next/link";
import { PageContainer } from "@/components/shell/page-header";
import { EstadoError } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";

/** FE-03: fallo al cargar el resumen; reintentar vuelve a consultar en el servidor. */
export default function ErrorSalud({ retry }: { retry: () => void }) {
  return (
    <PageContainer>
      <EstadoError
        titulo="No pudimos cargar la salud del proyecto"
        descripcion="No se muestran datos parciales. Vuelve a intentarlo en unos momentos."
        accion={
          <>
            <Button onClick={() => retry()}>Reintentar</Button>
            <Button variant="outline" asChild>
              <Link href="/proyectos">Volver al listado</Link>
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}
