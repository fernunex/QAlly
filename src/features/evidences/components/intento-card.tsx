import { MessageSquareTextIcon } from "lucide-react";
import { DecisionBadge } from "@/components/status/status-badges";
import type { Entrega } from "@/lib/domain";
import { formatFecha, formatFechaHora } from "@/lib/format";
import type { Nombres } from "@/features/activities/utils";
import { nombreDe } from "@/features/activities/utils";
import { EvidenciaItem } from "@/features/evidences/components/evidencia-item";

/** Observaciones de QA: teñido suave, no bloque rojo. */
export function ObservacionesQA({
  autor,
  fecha,
  texto,
  titulo = "Observaciones de QA",
}: {
  autor: string;
  fecha: string;
  texto: string;
  titulo?: string;
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm"
    >
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium text-destructive">
        <MessageSquareTextIcon aria-hidden className="size-4 shrink-0" />
        <span>{titulo}</span>
        <span className="font-normal text-muted-foreground">
          · {autor} · {formatFechaHora(fecha)}
        </span>
      </p>
      <p className="mt-1.5 leading-relaxed whitespace-pre-line">{texto}</p>
    </section>
  );
}

/** Intento enviado (inmutable) con resultado, evidencias y decisión de QA. */
export function IntentoCard({
  entrega,
  nombres,
  mostrarNotaInmutable = false,
  titulo,
}: {
  entrega: Entrega;
  nombres: Nombres;
  mostrarNotaInmutable?: boolean;
  titulo?: string;
}) {
  const { revision } = entrega;
  return (
    <article className="space-y-3 rounded-lg border bg-card p-3.5">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h4 className="text-sm font-semibold">
          {titulo ?? `Intento ${entrega.numeroIntento}`}
          {entrega.enviadaEn ? (
            <span className="font-normal text-muted-foreground"> · enviado {formatFecha(entrega.enviadaEn)}</span>
          ) : null}
        </h4>
        <DecisionBadge decision={revision?.decision ?? null} />
      </header>
      <p className="text-xs text-muted-foreground">Entregado por {nombreDe(nombres, entrega.autorId)}</p>
      {entrega.resultado ? (
        <p className="rounded-md bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-line">{entrega.resultado}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Sin resultado registrado.</p>
      )}
      {entrega.evidencias.length > 0 ? (
        <ul className="space-y-2">
          {entrega.evidencias.map((ev) => (
            <EvidenciaItem key={ev.id} evidencia={ev} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin evidencias.</p>
      )}
      {revision?.decision === "Devolver" && revision.observaciones ? (
        <ObservacionesQA
          autor={nombreDe(nombres, revision.qaId)}
          fecha={revision.revisadaEn}
          texto={revision.observaciones}
        />
      ) : revision?.decision === "Aprobar" ? (
        <p className="text-xs text-muted-foreground">
          Aprobado por {nombreDe(nombres, revision.qaId)} · {formatFechaHora(revision.revisadaEn)}
        </p>
      ) : null}
      {mostrarNotaInmutable ? (
        <p className="text-xs text-muted-foreground">
          Este intento es inmutable: el reenvío crea un intento nuevo.
        </p>
      ) : null}
    </article>
  );
}
