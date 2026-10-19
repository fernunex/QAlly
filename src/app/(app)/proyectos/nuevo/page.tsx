import Link from "next/link";
import type { Metadata } from "next";
import { BanIcon } from "lucide-react";
import { PageContainer } from "@/components/shell/page-header";
import { EstadoVacio } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";
import { AsistenteNuevoProyecto } from "@/features/projects/components/nuevo-proyecto/asistente-nuevo-proyecto";
import { miembrosElegibles } from "@/lib/mock/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export const metadata: Metadata = { title: "Nuevo proyecto" };

/** CU-01 SF-01 — Registrar proyecto. Solo QA. */
export default async function NuevoProyectoPage() {
  const usuario = await obtenerUsuarioActual();

  if (usuario.rol !== "QA") {
    return (
      <PageContainer>
        <EstadoVacio
          icon={BanIcon}
          titulo="Operación no permitida"
          descripcion="Solo el rol QA puede registrar proyectos. Puedes consultar los proyectos en los que participas."
        >
          <Button asChild>
            <Link href="/proyectos">Volver a Proyectos</Link>
          </Button>
        </EstadoVacio>
      </PageContainer>
    );
  }

  const elegibles = miembrosElegibles().map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo }));
  return (
    <AsistenteNuevoProyecto
      creador={{ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo }}
      elegibles={elegibles}
    />
  );
}
