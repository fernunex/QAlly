"use client";

import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReporteAcciones({ capturadoEn }: { capturadoEn: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="text-sm text-muted-foreground">
        Datos capturados el {capturadoEn} · vigencia de 15 minutos: al vencer, la vista y el PDF se regeneran juntos
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // TODO(funcionalidad): regenerarReporte (contratos-v1 §6) — nueva captura y token.
            toast.success("Reporte regenerado con los datos actuales");
          }}
        >
          <RefreshCwIcon />
          Generar reporte
        </Button>
        <Button
          onClick={() => {
            // TODO(funcionalidad): POST /api/reportes/pdf con capturaToken
            toast.success("Exportación a PDF iniciada");
          }}
        >
          <DownloadIcon />
          Exportar a PDF
        </Button>
      </div>
    </div>
  );
}
