"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { EstadoError, EstadoVacio } from "@/components/states/ui-states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { mensajes, type ErrorPublico } from "@/lib/resultados";
import { generarReporte } from "../actions";
import { modeloReporte, nombreArchivoReporte } from "../lib/modelo";
import type { ReporteGenerado } from "../types";
import { ReporteAcciones } from "./reporte-acciones";
import { ReporteDocumento } from "./reporte-documento";

const FALLO: ErrorPublico = { codigo: "FALLO_PERSISTENCIA", mensaje: mensajes.FALLO_PERSISTENCIA };

/**
 * Flujo de CU-06 en pantalla: Generar reporte → vista → Exportar a PDF (SF-01).
 * El token de captura vive solo en el estado de este componente (sin URL, logs ni
 * localStorage) y se descarta al salir o regenerar. El servidor vuelve a autorizar todo.
 */
export function GeneradorReporte({ proyectoId }: { proyectoId: string }) {
  const [reporte, setReporte] = useState<ReporteGenerado | null>(null);
  const [errorGenerar, setErrorGenerar] = useState<ErrorPublico | null>(null);
  const [errorExportar, setErrorExportar] = useState<ErrorPublico | null>(null);
  const [generando, iniciarGeneracion] = useTransition();
  const [exportando, setExportando] = useState(false);
  const modelo = useMemo(
    () => (reporte ? modeloReporte(reporte.resumen, reporte.emitidaEn) : null),
    [reporte],
  );

  function generar() {
    setErrorExportar(null);
    iniciarGeneracion(async () => {
      let r: Awaited<ReturnType<typeof generarReporte>>;
      try {
        r = await generarReporte(proyectoId);
      } catch {
        r = { ok: false, error: FALLO };
      }
      if (r.ok) {
        setErrorGenerar(null);
        setReporte(r.datos);
      } else {
        // FE-01: sin datos parciales; la vista anterior se retira junto con su captura.
        setReporte(null);
        setErrorGenerar(r.error);
      }
    });
  }

  async function exportar() {
    if (!reporte) return;
    setErrorExportar(null);
    setExportando(true);
    try {
      const res = await fetch("/api/reportes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capturaToken: reporte.capturaToken }),
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const cuerpo = (await res.json().catch(() => null)) as { error?: ErrorPublico } | null;
        setErrorExportar(cuerpo?.error?.codigo ? cuerpo.error : FALLO);
        return;
      }
      const pdf = await res.blob();
      const url = URL.createObjectURL(pdf);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivoReporte(reporte.resumen.proyecto.nombre, reporte.emitidaEn);
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("PDF del reporte descargado");
    } catch {
      setErrorExportar(FALLO);
    } finally {
      setExportando(false);
    }
  }

  if (errorGenerar && !reporte)
    return (
      <EstadoError
        titulo="No pudimos generar el reporte"
        descripcion={`${errorGenerar.mensaje} No se muestran datos parciales.`}
        accion={
          errorGenerar.codigo === "SIN_SESION" ? (
            <Button asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          ) : (
            <Button onClick={generar} disabled={generando}>
              {generando ? <Spinner aria-hidden /> : null}
              Reintentar
            </Button>
          )
        }
      />
    );

  if (!reporte || !modelo)
    return (
      <EstadoVacio
        icon={FileTextIcon}
        titulo="Reporte de calidad del proyecto"
        descripcion="Reúne las métricas con su último valor y cumplimiento, el resumen de actividades SQA por etapa y la salud disponible, con los datos actuales. Después podrás exportarlo a PDF."
      >
        <Button onClick={generar} disabled={generando}>
          {generando ? <Spinner aria-hidden /> : <FileTextIcon />}
          Generar reporte
        </Button>
      </EstadoVacio>
    );

  const expirada = errorExportar?.codigo === "CAPTURA_EXPIRADA";
  return (
    <div className="space-y-4">
      <ReporteAcciones
        venceEn={reporte.venceEn}
        generando={generando}
        exportando={exportando}
        onRegenerar={generar}
        onExportar={exportar}
      />
      {errorExportar ? (
        <Alert variant="destructive">
          <AlertTitle>{expirada ? "La captura del reporte venció" : "No pudimos exportar el PDF"}</AlertTitle>
          <AlertDescription>
            <p>
              {expirada
                ? "Pasaron más de 15 minutos desde la generación. Regenera el reporte para actualizar la vista y exportar el PDF con la misma información."
                : errorExportar.mensaje}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {errorExportar.codigo === "SIN_SESION" ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              ) : expirada ? (
                <Button variant="outline" size="sm" onClick={generar} disabled={generando}>
                  Regenerar reporte
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={exportar} disabled={exportando}>
                  Reintentar exportación
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      <ReporteDocumento modelo={modelo} />
    </div>
  );
}
