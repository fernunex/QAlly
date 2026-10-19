import type { Metadata } from "next";
import { Logo } from "@/components/shell/logo";
import { ETAPAS } from "@/lib/catalogs";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Inicia sesión" };

/** Inicio de sesión: precondición de todos los CU (sin CU propio). */
export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10 sm:py-8">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
            <p className="mt-2 text-muted-foreground">Accede con tu cuenta para consultar tus proyectos.</p>
            <LoginForm />
          </div>
        </main>
        <p className="text-xs text-muted-foreground">QAlly v1 · Proyecto académico</p>
      </div>

      <aside className="hidden flex-col justify-center border-l bg-muted/40 px-10 xl:px-20 lg:flex">
        <div className="max-w-lg">
          <p className="text-2xl leading-snug font-bold tracking-tight text-balance">
            Proyectos de software, actividades SQA, evidencias, métricas y reportes de calidad en un solo lugar.
          </p>
          <ol className="mt-8 space-y-3">
            {ETAPAS.map((etapa) => (
              <li key={etapa.codigo} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular-nums">
                  {etapa.orden}
                </span>
                {etapa.nombre}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
