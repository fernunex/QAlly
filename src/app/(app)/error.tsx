"use client";
import { EstadoError } from "@/components/states/ui-states";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function ErrorPagina({ reset }: { reset: () => void }) {
  return (
    <div className="p-8">
      <EstadoError
        descripcion="No pudimos completar la consulta. Comprueba tu sesión y vuelve a intentarlo."
        accion={
          <>
            <Button onClick={() => reset()}>Reintentar</Button>
            <Button variant="outline" asChild>
              <Link href="/proyectos">Volver al listado</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
