"use client";

import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ETAPAS } from "@/lib/catalogs";
import { useCatalogosProyecto } from "../catalogos-context";
import { formatRango } from "@/lib/format";
import type { EstadoAsistente, PasoId, PersonaElegible } from "./estado";

function Seccion({
  titulo,
  paso,
  onIr,
  children,
}: {
  titulo: string;
  paso: PasoId;
  onIr: (p: PasoId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <Button variant="ghost" size="sm" onClick={() => onIr(paso)}>
          <PencilIcon />
          Editar<span className="sr-only"> {titulo}</span>
        </Button>
      </div>
      <div className="px-4 py-3 text-sm">{children}</div>
    </section>
  );
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 py-1.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function PasoConfirmacion({
  estado,
  creador,
  elegibles,
  onIr,
}: {
  estado: EstadoAsistente;
  creador: PersonaElegible;
  elegibles: PersonaElegible[];
  onIr: (p: PasoId) => void;
}) {
  const { actividades: TIPOS_ACTIVIDAD, metricas: TIPOS_METRICA } =
    useCatalogosProyecto();
  const g = estado.general;
  const miembros = [
    creador.nombre + " (QA, creador)",
    ...elegibles
      .filter((p) => estado.miembros.includes(p.id))
      .map((p) => p.nombre),
  ];
  const metricas = TIPOS_METRICA.filter((t) => estado.metricas[t.id]?.activa);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Revisa la configuración. Al registrar, las actividades SQA elegidas se
        crean en estado Pendiente.
      </p>

      <Seccion titulo="Información general" paso={1} onIr={onIr}>
        <dl className="divide-y">
          <Dato etiqueta="Nombre">{g.nombre}</Dato>
          <Dato etiqueta="Descripción">{g.descripcion}</Dato>
          <Dato etiqueta="Periodo académico">
            {g.periodoAcademico || "No indicado"}
          </Dato>
          <Dato etiqueta="Fechas">
            <span className="tabular-nums">
              {g.fechaInicio
                ? formatRango(g.fechaInicio, g.fechaFinPrevista)
                : "—"}
            </span>
          </Dato>
        </dl>
      </Seccion>

      <Seccion titulo={`Miembros (${miembros.length})`} paso={1} onIr={onIr}>
        <ul className="flex flex-wrap gap-2">
          {miembros.map((m) => (
            <li key={m}>
              <Badge variant="secondary">{m}</Badge>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion
        titulo={`Actividades SQA (${estado.actividades.length})`}
        paso={2}
        onIr={onIr}
      >
        {estado.actividades.length === 0 ? (
          <p className="text-muted-foreground">
            Sin actividades iniciales. Podrás agregarlas después.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {ETAPAS.map((e) => {
              const items = TIPOS_ACTIVIDAD.filter(
                (t) =>
                  t.etapaCodigo === e.codigo &&
                  estado.actividades.includes(t.id),
              );
              if (items.length === 0) return null;
              return (
                <div key={e.codigo}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {e.nombre}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {items.map((t) => (
                      <li key={t.id}>
                        <span className="font-mono text-xs whitespace-nowrap">
                          {t.codigo}
                        </span>{" "}
                        · {t.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Seccion>

      <Seccion titulo={`Métricas (${metricas.length})`} paso={3} onIr={onIr}>
        {metricas.length === 0 ? (
          <p className="text-muted-foreground">
            Sin métricas iniciales. Podrás agregarlas después.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {metricas.map((t) => {
              const c = estado.metricas[t.id]!;
              const u = t.unidad === "%" ? " %" : ` ${t.unidad}`;
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                >
                  <span>
                    <span className="font-mono text-xs whitespace-nowrap">
                      {t.codigo}
                    </span>{" "}
                    · {t.nombre}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    Objetivo {t.comparador} {c.objetivo.trim()}
                    {u}
                    {t.objetivoCriticoInicial !== null
                      ? ` · críticas ${t.comparador} ${c.critico.trim()}${u}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
