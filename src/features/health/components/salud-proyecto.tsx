import Link from "next/link";
import { ActivityIcon } from "lucide-react";
import { CumplimientoBadge, SaludBadge } from "@/components/status/status-badges";
import { EstadoVacio, NotaPendiente } from "@/components/states/ui-states";
import { SectionTitle } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contarCumplimiento, type Resumen } from "@/lib/mock/queries";
import { TIPOS_METRICA } from "@/lib/catalogs";
import { formatFecha, formatValor } from "@/lib/format";
import { datosFuenteTexto, objetivoTexto, resumenCumplimiento } from "@/features/health/lib";
import { ConteoEstadosTiles, CumplimientoTiles, totalActividades } from "@/features/health/components/conteo-tiles";

export const NOTA_SALUD =
  "La salud aún no se calcula: el algoritmo y su clasificación están pendientes de aprobación. Se muestran solo los datos reales del proyecto.";

export function SaludProyecto({ resumen }: { resumen: Resumen }) {
  const id = resumen.proyecto.id;
  const total = totalActividades(resumen.conteos);
  const cumplimiento = contarCumplimiento(resumen.metricas);
  const urlMetricas = `/proyectos/${id}/metricas`;

  if (total === 0 && resumen.metricas.length === 0) {
    return (
      <EstadoVacio
        icon={ActivityIcon}
        titulo="Aún no hay datos para mostrar"
        descripcion="Este proyecto todavía no tiene actividades SQA ni métricas configuradas. La salud seguirá «Sin evaluar» mientras el algoritmo esté pendiente."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Salud general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SaludBadge className="h-8 px-3 text-sm [&_svg]:size-4" />
            <NotaPendiente>
              {NOTA_SALUD} Cumplir una métrica no es lo mismo que tener buena salud.
            </NotaPendiente>
            <div>
              <p className="mb-2 text-sm font-medium">
                Actividades SQA · <span className="tabular-nums">{total}</span> en total
              </p>
              <ConteoEstadosTiles conteos={resumen.conteos} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de métricas</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{resumen.metricas.length}</span> de las{" "}
              {TIPOS_METRICA.length} métricas del catálogo configuradas en este proyecto.
            </p>
            <CumplimientoTiles conteos={cumplimiento} />
            <Button variant="outline" size="sm" asChild className="mt-auto self-start">
              <Link href={urlMetricas}>Ver métricas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section>
        <SectionTitle>Salud por etapa</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumen.etapas.map((etapa) => (
            <Card key={etapa.codigo}>
              <CardHeader>
                <CardTitle className="text-base">{etapa.nombre}</CardTitle>
                <div>
                  <SaludBadge />
                </div>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-3">
                <ConteoEstadosTiles conteos={etapa.conteos} compacto />
                <p className="text-sm text-muted-foreground">
                  {etapa.metricas.length === 0
                    ? "Esta etapa no tiene métricas, solo actividades SQA."
                    : `Métricas: ${resumenCumplimiento(etapa.metricas)}`}
                </p>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link
                    href={`/proyectos/${id}/actividades?etapa=${etapa.codigo}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    Ver actividades de la etapa
                  </Link>
                  <Link href={urlMetricas} className="font-medium underline-offset-4 hover:underline">
                    Ver métricas
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          accion={
            <Link href={urlMetricas} className="text-sm font-medium underline-offset-4 hover:underline">
              Ir a Métricas
            </Link>
          }
        >
          Métricas del proyecto
        </SectionTitle>
        {resumen.metricas.length === 0 ? (
          <NotaPendiente>Este proyecto aún no tiene métricas configuradas.</NotaPendiente>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumen.metricas.map((m) => {
              const objetivo = objetivoTexto(m);
              const datos = datosFuenteTexto(m);
              return (
                <Card key={m.id}>
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium">
                        <span className="font-mono text-muted-foreground">{m.tipo.codigo}</span> · {m.tipo.nombre}
                      </p>
                      <CumplimientoBadge estado={m.cumplimiento} />
                    </div>
                    {m.valorActual === null ? (
                      <div>
                        <p className="text-2xl font-semibold text-muted-foreground">Sin medición</p>
                        <p className="text-xs text-muted-foreground">Sin medición no equivale a 0.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-semibold tabular-nums whitespace-nowrap">
                          {formatValor(m.valorActual, m.tipo.unidad)}
                        </p>
                        {m.valorCritico ? (
                          <p className="text-xs tabular-nums text-muted-foreground">
                            Críticas: {formatValor(m.valorCritico, m.tipo.unidad)}
                          </p>
                        ) : null}
                        {datos ? <p className="mt-1 text-xs text-muted-foreground">{datos}</p> : null}
                      </div>
                    )}
                    <div className="space-y-0.5 border-t pt-3 text-xs text-muted-foreground">
                      <p>
                        Objetivo: <span className="tabular-nums">{objetivo.principal}</span>
                        {objetivo.critico ? <span className="tabular-nums"> · {objetivo.critico}</span> : null}
                      </p>
                      <p>
                        {m.medicionVigente ? `Medido el ${formatFecha(m.medicionVigente.medidaEn)}` : "Sin fecha de medición"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
