"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronsUpDownIcon,
  FolderIcon,
  ListChecksIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserRoundCogIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/shell/logo";
import type { Rol } from "@/lib/domain";
import { ROL_ETIQUETA } from "@/lib/domain";
import { iniciales } from "@/lib/format";
import { cambiarCuentaDemo, cerrarSesion } from "@/lib/session-actions";

export type UsuarioSidebar = { id: string; nombre: string; correo: string; rol: Rol };

const NAV = [
  { href: "/proyectos", label: "Proyectos", icon: FolderIcon, roles: ["QA", "Miembro"] as Rol[] },
  { href: "/mis-actividades", label: "Mis actividades", icon: ListChecksIcon, roles: ["Miembro"] as Rol[] },
];

function SidebarMarco({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        <Link href="/proyectos" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <Logo compacto className="hidden group-data-[collapsible=icon]:inline-flex" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ usuario }: { usuario: UsuarioSidebar }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMarco footer={<MenuUsuario usuario={usuario} />}>
      {NAV.filter((item) => item.roles.includes(usuario.rol)).map((item) => {
        const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={activo} tooltip={item.label} size="lg">
              <Link href={item.href} onClick={() => setOpenMobile(false)}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMarco>
  );
}

export function AppSidebarCargando() {
  return (
    // Ancho fijo: SidebarMenuSkeleton usa Math.random(), incompatible con el prerender.
    <SidebarMarco footer={<Skeleton className="h-12 w-full" />}>
      <SidebarMenuItem>
        <Skeleton className="h-10 w-full" />
      </SidebarMenuItem>
    </SidebarMarco>
  );
}

function MenuUsuario({ usuario }: { usuario: UsuarioSidebar }) {
  const { theme, setTheme } = useTheme();
  const otraCuenta = usuario.rol === "QA" ? { id: "u-emi", label: "Miembro del equipo (Emi)" } : { id: "u-david", label: "QA (David S.)" };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/15 text-xs font-semibold text-primary">
                  {iniciales(usuario.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">{usuario.nombre}</span>
                <span className="truncate text-xs text-muted-foreground">{ROL_ETIQUETA[usuario.rol]}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-muted-foreground">{usuario.correo}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Tema</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <SunIcon /> Claro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon /> Oscuro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon /> Sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => cambiarCuentaDemo(otraCuenta.id)}>
                <UserRoundCogIcon />
                Ver como {otraCuenta.label}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => cerrarSesion()}>
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
