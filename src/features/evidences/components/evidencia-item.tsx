"use client";

import { ExternalLinkIcon, FileTextIcon, LinkIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Evidencia } from "@/lib/domain";
import { formatBytes } from "@/lib/format";

/** Evidencia PDF o enlace. Con `onQuitar` es editable (intento en preparación); sin él, solo lectura. */
export function EvidenciaItem({
  evidencia,
  detalle,
  onQuitar,
}: {
  evidencia: Evidencia;
  /** Texto adicional (p. ej. autor y fecha). */
  detalle?: string;
  onQuitar?: () => void;
}) {
  const esPdf = evidencia.tipo === "pdf";
  const titulo = esPdf ? evidencia.nombreArchivo : evidencia.url;
  const meta = esPdf
    ? `PDF privado · ${formatBytes(evidencia.tamanoBytes)}`
    : "Enlace · no se descarga el destino";

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        {esPdf ? <FileTextIcon className="size-4" /> : <LinkIcon className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-all">{titulo}</p>
        <p className="text-xs text-muted-foreground">
          {meta}
          {detalle ? ` · ${detalle}` : ""}
        </p>
      </div>
      {onQuitar ? (
        <Button variant="ghost" size="icon-sm" onClick={onQuitar} aria-label={`Quitar ${titulo}`}>
          <XIcon />
        </Button>
      ) : esPdf ? (
        <Button variant="outline" size="sm" asChild>
          {/* Descarga autorizada en servidor con la identidad del usuario (contratos-v1 §5). */}
          <a href={`/api/evidencias/${evidencia.id}/archivo`} download>
            Descargar
          </a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <a href={evidencia.url} target="_blank" rel="noopener noreferrer">
            Abrir
            <ExternalLinkIcon />
          </a>
        </Button>
      )}
    </li>
  );
}
