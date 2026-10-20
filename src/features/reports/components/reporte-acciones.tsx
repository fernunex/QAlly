"use client";

import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatFechaHora, ROTULO_ZONA } from "@/lib/format";

/** Barra de acciones del reporte generado: regenerar (vista + captura) y exportar a PDF. */
export function ReporteAcciones({
  venceEn,
  generando,
  exportando,
  onRegenerar,
  onExportar,
}: {
  venceEn: string;
  generando: boolean;
  exportando: boolean;
  onRegenerar: () => void;
  onExportar: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="text-sm text-muted-foreground">
        El PDF se exporta con esta misma captura, vigente hasta el {formatFechaHora(venceEn)} ({ROTULO_ZONA}). Si vence, regenera el
        reporte: se actualizan juntos la vista, su fecha y el PDF.
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="outline" onClick={onRegenerar} disabled={generando || exportando}>
          {generando ? <Spinner aria-hidden /> : <RefreshCwIcon />}
          Regenerar reporte
        </Button>
        <Button onClick={onExportar} disabled={generando || exportando}>
          {exportando ? <Spinner aria-hidden /> : <DownloadIcon />}
          Exportar a PDF
        </Button>
      </div>
    </div>
  );
}
