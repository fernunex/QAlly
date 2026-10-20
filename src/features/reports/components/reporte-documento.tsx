import { CumplimientoBadge, EstadoActividadBadge, SaludBadge } from "@/components/status/status-badges";
import { ConteoEstadosTiles } from "@/features/health/components/conteo-tiles";
import type { ConteoEstados } from "@/lib/domain";
import type { ConteoFila, ModeloReporte } from "../lib/modelo";

/*
 * Vista web del reporte de calidad (CU-06 paso 5). Recibe el mismo modelo que el PDF
 * (`modeloReporte`), construido desde la captura vigente: ambos muestran el mismo contenido
 * y la misma fecha de generación. Salud siempre según el resumen («Sin evaluar»).
 */

const th = "h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";
const td = "px-3 py-2.5 align-top";

function Meta({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-end">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function aConteos(filas: ConteoFila[]): ConteoEstados {
  return Object.fromEntries(filas.map((f) => [f.estado, f.cantidad])) as ConteoEstados;
}

export function ReporteDocumento({ modelo }: { modelo: ModeloReporte }) {
  const { proyecto } = modelo;
  return (
    <article
      aria-label="Reporte de calidad"
      className="mx-auto w-full max-w-4xl rounded-lg border bg-card p-5 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none"
    >
      <header className="border-b pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Reporte de calidad</p>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">{proyecto.nombre}</h2>
            {proyecto.descripcion ? <p className="text-sm text-muted-foreground">{proyecto.descripcion}</p> : null}
          </div>
          <dl className="space-y-1 text-sm sm:min-w-64">
            <Meta k="Fecha de generación">
              <time dateTime={modelo.emitidaEn} data-testid="fecha-generacion">
                {modelo.fechaGeneracion}
              </time>
            </Meta>
            {proyecto.periodoAcademico ? <Meta k="Periodo académico">{proyecto.periodoAcademico}</Meta> : null}
            <Meta k="Fechas del proyecto">{proyecto.fechas}</Meta>
            <Meta k="Estado del proyecto">{proyecto.estado}</Meta>
          </dl>
        </div>
      </header>

      <section aria-labelledby="reporte-metricas" className="mt-8">
        <h3 id="reporte-metricas" className="mb-3 font-serif text-xl font-semibold">
          1. Métricas
        </h3>
        {modelo.metricas.length === 0 ? (
          <p className="text-sm text-muted-foreground">El proyecto no tiene métricas configuradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className={th}>Métrica</th>
                  <th className={th}>Último valor</th>
                  <th className={th}>Objetivo</th>
                  <th className={th}>Cumplimiento</th>
                  <th className={th}>Estado de medición</th>
                  <th className={th}>Medición</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modelo.metricas.map((m) => (
                  <tr key={m.id}>
                    <td className={td}>
                      <span className="font-mono text-xs text-muted-foreground">{m.codigo}</span> {m.nombre}
                      <span className="block text-xs text-muted-foreground">{m.etapa}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>
                      <span className={m.ultimoValor === "Sin medición" ? "text-muted-foreground" : undefined}>
                        {m.ultimoValor}
                      </span>
                      {m.valorCritico ? (
                        <span className="block text-xs text-muted-foreground">{m.valorCritico}</span>
                      ) : null}
                    </td>
                    <td className={`${td} tabular-nums`}>{m.objetivo}</td>
                    <td className={td}>
                      <CumplimientoBadge estado={m.cumplimiento} />
                    </td>
                    <td className={`${td} text-muted-foreground`}>{m.estadoMedicion}</td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>{m.fechaMedicion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="reporte-actividades" className="mt-8">
        <h3 id="reporte-actividades" className="mb-3 font-serif text-xl font-semibold">
          2. Actividades SQA
        </h3>
        <ConteoEstadosTiles conteos={aConteos(modelo.actividades.conteos)} />
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{modelo.actividades.total}</span> actividades SQA en total, distribuidas en las
          tres etapas del proyecto.
        </p>
        <div className="mt-4 space-y-5">
          {modelo.etapas.map((etapa) => (
            <div key={etapa.codigo} role="group" aria-label={`Actividades de ${etapa.nombre}`}>
              <h4 className="mb-2 text-sm font-semibold">
                {etapa.nombre} <span className="font-normal text-muted-foreground tabular-nums">({etapa.total})</span>
              </h4>
              {etapa.actividades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividades SQA en esta etapa.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className={th}>Actividad</th>
                        <th className={th}>Responsable</th>
                        <th className={th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {etapa.actividades.map((a) => (
                        <tr key={a.id}>
                          <td className={td}>
                            <span className="font-mono text-xs text-muted-foreground">{a.codigo}</span> {a.nombre}
                          </td>
                          <td className={`${td} whitespace-nowrap`}>{a.responsable}</td>
                          <td className={td}>
                            <EstadoActividadBadge estado={a.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="reporte-salud" className="mt-8">
        <h3 id="reporte-salud" className="mb-3 font-serif text-xl font-semibold">
          3. Salud general y por etapa
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Ámbito</th>
                <th className={th}>Salud</th>
                <th className={th}>Motivo</th>
                {modelo.actividades.conteos.map((c) => (
                  <th key={c.estado} className={`${th} text-right`}>
                    {c.estado}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { nombre: "General", salud: modelo.salud.general, conteos: modelo.actividades.conteos },
                ...modelo.etapas,
              ].map((f) => (
                <tr key={f.nombre}>
                  <td className={`${td} ${f.nombre === "General" ? "font-semibold" : ""}`}>{f.nombre}</td>
                  <td className={td}>
                    <SaludBadge />
                  </td>
                  <td className={`${td} text-muted-foreground`}>{f.salud.motivo}</td>
                  {f.conteos.map((c) => (
                    <td key={c.estado} className={`${td} text-right tabular-nums`}>
                      {c.cantidad}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{modelo.salud.nota}</p>
      </section>

      <footer className="mt-10 flex justify-between gap-4 border-t pt-4 text-xs text-muted-foreground">
        <span>Generado con QAlly</span>
        <span>{modelo.fechaGeneracion}</span>
      </footer>
    </article>
  );
}
