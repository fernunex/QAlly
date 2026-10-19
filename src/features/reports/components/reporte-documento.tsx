import { CumplimientoBadge, EstadoActividadBadge, SaludBadge } from "@/components/status/status-badges";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import { formatFecha, formatFechaHora, formatRango, formatValor } from "@/lib/format";
import type { Resumen } from "@/lib/mock/queries";
import { nombreEtapa } from "@/lib/catalogs";
import { objetivoTexto } from "@/features/health/lib";
import { ConteoEstadosTiles, totalActividades } from "@/features/health/components/conteo-tiles";
import { NOTA_SALUD } from "@/features/health/components/salud-proyecto";

const th = "h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";
const td = "px-3 py-2.5 align-top";

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-end">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}

export function ReporteDocumento({ resumen, generadoPor }: { resumen: Resumen; generadoPor: string }) {
  const { proyecto } = resumen;
  const total = totalActividades(resumen.conteos);
  return (
    <article className="mx-auto w-full max-w-4xl rounded-lg border bg-card p-5 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Reporte de calidad</p>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">{proyecto.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {proyecto.periodoAcademico ? `Periodo académico: ${proyecto.periodoAcademico} · ` : null}
              {formatRango(proyecto.fechaInicio, proyecto.fechaFinPrevista)}
            </p>
          </div>
          <dl className="space-y-1 text-sm sm:min-w-56">
            <Meta k="Fecha de generación" v={formatFechaHora(resumen.generadoEn)} />
            <Meta k="Generado por" v={generadoPor} />
            <Meta k="Participantes" v={String(proyecto.participantes.length)} />
          </dl>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-xl font-semibold">1. Métricas</h2>
        {resumen.metricas.length === 0 ? (
          <p className="text-sm text-muted-foreground">El proyecto no tiene métricas configuradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className={th}>Métrica</th>
                  <th className={th}>Etapa</th>
                  <th className={th}>Último valor</th>
                  <th className={th}>Objetivo</th>
                  <th className={th}>Cumplimiento</th>
                  <th className={th}>Medición</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resumen.metricas.map((m) => {
                  const o = objetivoTexto(m);
                  return (
                    <tr key={m.id}>
                      <td className={td}>
                        <span className="font-mono text-xs text-muted-foreground">{m.tipo.codigo}</span>{" "}
                        {m.tipo.nombre}
                      </td>
                      <td className={td}>{nombreEtapa(m.tipo.etapaCodigo)}</td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        {m.valorActual === null ? (
                          <span className="text-muted-foreground">Sin medición</span>
                        ) : (
                          <>
                            {formatValor(m.valorActual, m.tipo.unidad)}
                            {m.valorCritico ? (
                              <span className="block text-xs text-muted-foreground">
                                críticas {formatValor(m.valorCritico, m.tipo.unidad)}
                              </span>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        {o.principal}
                        {o.critico ? <span className="block text-xs text-muted-foreground">{o.critico}</span> : null}
                      </td>
                      <td className={td}>
                        <CumplimientoBadge estado={m.cumplimiento} />
                      </td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        {m.medicionVigente ? formatFecha(m.medicionVigente.medidaEn) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-xl font-semibold">2. Actividades SQA</h2>
        <ConteoEstadosTiles conteos={resumen.conteos} />
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{total}</span> actividades SQA en total, distribuidas en las tres etapas del
          proyecto.
        </p>
        <div className="mt-4 space-y-5">
          {resumen.etapas.map((etapa) => (
            <div key={etapa.codigo}>
              <h3 className="mb-2 text-sm font-semibold">{etapa.nombre}</h3>
              {etapa.actividades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividades SQA en esta etapa.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[40rem] text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className={th}>Actividad</th>
                        <th className={th}>Descripción</th>
                        <th className={th}>Responsable</th>
                        <th className={th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {etapa.actividades.map((a) => (
                        <tr key={a.id}>
                          <td className={td}>
                            <span className="font-mono text-xs text-muted-foreground">{a.tipoCodigo}</span>{" "}
                            {a.tipoNombre}
                          </td>
                          <td className={`${td} text-muted-foreground`}>{a.descripcion}</td>
                          <td className={`${td} whitespace-nowrap`}>
                            {a.responsableNombre ?? <span className="text-muted-foreground">Sin responsable</span>}
                          </td>
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

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-xl font-semibold">3. Salud general y por etapa</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Etapa</th>
                <th className={th}>Salud</th>
                {ESTADOS_ACTIVIDAD.map((e) => (
                  <th key={e} className={`${th} text-right`}>
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[{ nombre: "General", conteos: resumen.conteos, fuerte: true }, ...resumen.etapas.map((e) => ({ nombre: e.nombre, conteos: e.conteos, fuerte: false }))].map(
                (f) => (
                  <tr key={f.nombre}>
                    <td className={`${td} ${f.fuerte ? "font-semibold" : ""}`}>{f.nombre}</td>
                    <td className={td}>
                      <SaludBadge />
                    </td>
                    {ESTADOS_ACTIVIDAD.map((e) => (
                      <td key={e} className={`${td} text-right tabular-nums`}>
                        {f.conteos[e]}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {NOTA_SALUD} Cumplir una métrica no es lo mismo que tener buena salud.
        </p>
      </section>

      <footer className="mt-10 flex justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>Generado con QAlly</span>
        <span>Página 1 de 1</span>
      </footer>
    </article>
  );
}
