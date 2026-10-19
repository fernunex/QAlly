"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorPublico } from "@/lib/resultados";
export function ErrorAccion({ error }: { error: ErrorPublico }) {
  const router = useRouter();
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>
        <p>{error.mensaje}</p>
        {error.campos ? (
          <ul>
            {Object.entries(error.campos).map(([k, v]) => (
              <li key={k}>{v}</li>
            ))}
          </ul>
        ) : null}
        {["CONFLICTO", "PROYECTO_CERRADO"].includes(error.codigo) ? (
          <Button variant="outline" onClick={() => router.refresh()}>
            Recargar información
          </Button>
        ) : null}
        {error.codigo === "SIN_SESION" ? (
          <Button variant="outline" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
