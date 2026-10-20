import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import {
  CumplimientoBadge,
  EstadoActividadBadge,
  SaludBadge,
} from "@/components/status/status-badges";
import { NotaPendiente } from "@/components/states/ui-states";
import { SectionTitle } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPOS_METRICA } from "@/lib/catalogs";
import type { EstadoSalud } from "@/lib/domain";
import { formatFecha, formatFechaHora } from "@/lib/format";
import {
  conteoGeneral,
  contarCumplimiento,
  metricasDeEtapa,
  NOTA_SALUD,
  resumenCumplimiento,
} from "@/features/health/lib";
import {
  ConteoEstadosTiles,
  CumplimientoTiles,
  totalActividades,
} from "@/features/health/components/conteo-tiles";
import { objetivoLineas, valorActualTexto } from "@/features/metrics/lib/formato";
import type { MetricaProyecto } from "@/features/metrics/types";
import type { EtapaResumen, ResumenProyecto } from "@/features/health/types";

/** Estado y motivo tal como los entrega el resumen (hoy siempre «Sin evaluar»). */
function Salud({ salud, prefijo }: { salud: EstadoSalud; prefijo?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SaludBadge prefijo={prefijo} />
      <span className="text-xs text-muted-foreground">Motivo: {salud.motivo}</span>
    </div>
  );
}

/** SF-02: actividades de la etapa con su estado y responsable. */
function ActividadesEtapa({ etapa, total }: { etapa: EtapaResumen; total: number }) {
  if (total === 0)
    return <p className="text-sm text-muted-foreground">Sin actividades SQA en esta etapa.</p>;
  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        Ver actividades ({total})
        <ChevronDownIcon
          aria-hidden
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <ul aria-label={`Actividades de ${etapa.nombre}`} className="divide-y border-t">
        {etapa.actividades.map((a) => (
          <li key={a.id} className="space-y-1 px-3 py-2 text-sm">
            <p className="min-w-0">
              <span className="font-mono text-xs text-muted-foreground">{a.tipoCodigo}</span>{" "}
              {a.tipoNombre}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {a.responsableNombre ?? "Sin responsable"}
              </span>
              <EstadoActividadBadge estado={a.estado} />
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function EstadoMedicion({ m }: { m: MetricaProyecto }) {
  if (!m.medidaEn) return <p>Estado de medición: Sin medición (no equivale a 0)</p>;
  const causas = [m.causa, m.causaCritica].filter(Boolean).join(" · ");
  return (
    <p>
      Estado de medición: {m.condicionPrincipal}
      {causas ? ` · ${causas}` : null}
    </p>
  );
}

/** SF-01: valor actual, objetivo, cumplimiento y estado de la medición vigente. */
function MetricaTarjeta({ m, urlMetricas }: { m: MetricaProyecto; urlMetricas: string }) {
  const sinValor = !m.medidaEn || m.valorActual === null;
  return (
    <li>
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-medium">
              <span className="font-mono text-muted-foreground">{m.tipo.codigo}</span> · {m.tipo.nombre}
            </p>
            <CumplimientoBadge estado={m.cumplimiento} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor actual</p>
            <p
              className={
                sinValor
                  ? "text-2xl font-semibold text-muted-foreground"
                  : "text-3xl font-semibold tabular-nums whitespace-nowrap"
              }
            >
              {valorActualTexto(m)}
            </p>
            {m.valorCritico ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                Críticas: {Number(m.valorCritico).toFixed(2)} %
              </p>
            ) : null}
          </div>
          <div className="mt-auto space-y-0.5 border-t pt-3 text-xs text-muted-foreground">
            <p className="tabular-nums">
              Objetivo:{" "}
              {objetivoLineas(m)
                .map((l) => (l.etiqueta ? `${l.etiqueta} ${l.texto}` : l.texto))
                .join(" · ")}
            </p>
            <EstadoMedicion m={m} />
            <p>{m.medidaEn ? `Medido el ${formatFecha(m.medidaEn)}` : "Sin fecha de medición"}</p>
            <Link href={urlMetricas} className="inline-block pt-1 font-medium text-foreground underline-offset-4 hover:underline">
              Ver historial en Métricas
            </Link>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

/** Vista de salud (CU-05) con datos reales del resumen; solo lectura. */
export function SaludProyecto({ resumen }: { resumen: ResumenProyecto }) {
  const id = resumen.proyecto.id;
  const conteos = conteoGeneral(resumen);
  const total = totalActividades(conteos);
  const cumplimiento = contarCumplimiento(resumen.metricas);
  const urlMetricas = `/proyectos/${id}/metricas`;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Datos actuales consultados el {formatFechaHora(resumen.generadoEn)} (UTC).
      </p>

      {total === 0 && resumen.metricas.length === 0 ? (
        <NotaPendiente>
          Este proyecto todavía no tiene actividades SQA ni métricas configuradas. La salud seguirá «Sin evaluar»
          mientras el algoritmo esté pendiente.
        </NotaPendiente>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card role="region" aria-label="Salud general">
          <CardHeader>
            <CardTitle>Salud general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Salud salud={resumen.salud} />
            <NotaPendiente>
              {NOTA_SALUD} Cumplir una métrica no es lo mismo que tener buena salud.
            </NotaPendiente>
            <div>
              <p className="mb-2 text-sm font-medium">
                Actividades SQA · <span className="tabular-nums">{total}</span> en total
              </p>
              <ConteoEstadosTiles conteos={conteos} />
            </div>
          </CardContent>
        </Card>

        <Card role="region" aria-label="Resumen de métricas">
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
        <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumen.etapas.map((etapa) => {
            const metricas = metricasDeEtapa(resumen.metricas, etapa.codigo);
            return (
              <Card key={etapa.codigo} role="region" aria-label={etapa.nombre}>
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">{etapa.nombre}</CardTitle>
                  <Salud salud={etapa.salud} />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <ConteoEstadosTiles conteos={etapa.conteos} compacto />
                  <p className="text-sm text-muted-foreground">
                    {metricas.length === 0
                      ? "Esta etapa no tiene métricas, solo actividades SQA."
                      : `Métricas: ${resumenCumplimiento(metricas)}`}
                  </p>
                  <ActividadesEtapa etapa={etapa} total={totalActividades(etapa.conteos)} />
                  <Link
                    href={`/proyectos/${id}/actividades?etapa=${etapa.codigo}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Abrir en Actividades SQA
                  </Link>
                </CardContent>
              </Card>
            );
          })}
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
          <ul aria-label="Métricas del proyecto" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumen.metricas.map((m) => (
              <MetricaTarjeta key={m.id} m={m} urlMetricas={urlMetricas} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
