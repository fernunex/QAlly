"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisIcon, FolderOpenIcon, LockIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditarProyectoDialog } from "@/features/projects/components/editar-proyecto-dialog";
import type { Proyecto } from "@/lib/domain";

type ProyectoAccionable = Pick<
  Proyecto,
  "id" | "nombre" | "descripcion" | "periodoAcademico" | "fechaInicio" | "fechaFinPrevista" | "cerradoEn"
>;

/**
 * Menú «···» de proyecto para QA (CU-01 SF-03 / SF-04).
 * En proyectos cerrados solo ofrece «Abrir proyecto». El Miembro no lo ve.
 */
export function ProyectoAcciones({
  proyecto,
  mostrarAbrir = false,
}: {
  proyecto: ProyectoAccionable;
  mostrarAbrir?: boolean;
}) {
  const [editar, setEditar] = useState(false);
  const [cerrar, setCerrar] = useState(false);
  const cerrado = proyecto.cerradoEn !== null;

  if (cerrado && !mostrarAbrir) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Acciones de ${proyecto.nombre}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {mostrarAbrir ? (
            <DropdownMenuItem asChild>
              <Link href={`/proyectos/${proyecto.id}`}>
                <FolderOpenIcon />
                Abrir proyecto
              </Link>
            </DropdownMenuItem>
          ) : null}
          {!cerrado ? (
            <>
              <DropdownMenuItem onSelect={() => setEditar(true)}>
                <PencilIcon />
                Editar información general
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setCerrar(true)}>
                <LockIcon />
                Cerrar proyecto…
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {!cerrado ? (
        <>
          <EditarProyectoDialog proyecto={proyecto} open={editar} onOpenChange={setEditar} />
          <AlertDialog open={cerrar} onOpenChange={setCerrar}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar el proyecto «{proyecto.nombre}»?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      El proyecto quedará en <strong className="text-foreground">solo lectura</strong>: no se podrá
                      modificar nada (actividades, métricas, mediciones ni evidencias). Seguirás pudiendo consultar su
                      información, evidencias, salud y reportes, y exportar el reporte.
                    </p>
                    <p>
                      <strong className="text-foreground">Esta acción no se puede deshacer.</strong> Los proyectos
                      cerrados no se reabren.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => toast.success(`Proyecto «${proyecto.nombre}» cerrado`)}
                >
                  Cerrar proyecto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </>
  );
}
