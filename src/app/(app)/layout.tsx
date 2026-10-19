import { Suspense } from "react";
import { AppSidebar, AppSidebarCargando } from "@/components/shell/app-sidebar";
import { Logo } from "@/components/shell/logo";
import { PageContainer } from "@/components/shell/page-header";
import { EstadoCargando } from "@/components/states/ui-states";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { obtenerUsuarioActual } from "@/lib/session";

async function SidebarConSesion() {
  const u = await obtenerUsuarioActual();
  return <AppSidebar usuario={{ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol }} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarCargando />}>
        <SidebarConSesion />
      </Suspense>
      <SidebarInset className="min-w-0">
        {/* Barra superior solo en pantallas angostas: abre la navegación como panel lateral. */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <SidebarTrigger aria-label="Abrir navegación" />
          <Logo />
        </header>
        <Suspense
          fallback={
            <PageContainer>
              <EstadoCargando />
            </PageContainer>
          }
        >
          {children}
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
