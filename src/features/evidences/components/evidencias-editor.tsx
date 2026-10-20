"use client";

import { useRef, useState } from "react";
import { LinkIcon, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { LIMITE_PDF_BYTES } from "@/lib/catalogs";
import type { Evidencia } from "@/lib/domain";
import { EvidenciaItem } from "@/features/evidences/components/evidencia-item";
import {
  enlaceValido,
  MSJ_ENLACE,
  MSJ_FALTA_EVIDENCIA,
  MSJ_FALTA_RESULTADO,
  MSJ_PDF,
  nombrePdfValido,
} from "@/features/evidences/validation";

export const ERR_PDF = MSJ_PDF;
export const ERR_ENLACE = MSJ_ENLACE;
export const ERR_FALTA_EVIDENCIA = MSJ_FALTA_EVIDENCIA;
export const ERR_FALTA_RESULTADO = MSJ_FALTA_RESULTADO;

/** Validación previa en el navegador; el servidor vuelve a validar tamaño, formato y nombre. */
export function validarPdf(archivo: { name: string; type: string; size: number }): boolean {
  return (
    archivo.type === "application/pdf" &&
    archivo.size > 0 &&
    archivo.size <= LIMITE_PDF_BYTES &&
    nombrePdfValido(archivo.name)
  );
}

export function validarEnlace(valor: string): boolean {
  return enlaceValido(valor.trim());
}

/** Respuesta de una operación de evidencia: null si se guardó, o el mensaje del rechazo. */
type Operacion = Promise<string | null>;

/** Evidencias del intento en preparación. Cada alta o baja se guarda en el servidor antes de mostrarse. */
export function EvidenciasEditor({
  evidencias,
  error,
  deshabilitado = false,
  onAdjuntarPdf,
  onAgregarEnlace,
  onQuitar,
}: {
  evidencias: Evidencia[];
  /** Error de «falta evidencia» o de rechazo enviado por el formulario padre. */
  error?: string;
  deshabilitado?: boolean;
  onAdjuntarPdf: (archivo: File) => Operacion;
  onAgregarEnlace: (url: string) => Operacion;
  onQuitar: (evidenciaId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [agregandoEnlace, setAgregandoEnlace] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);
  const bloqueado = deshabilitado || subiendo !== null || guardandoEnlace;

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!validarPdf(archivo)) {
      setErrorPdf(ERR_PDF);
      return;
    }
    setErrorPdf(null);
    setSubiendo(archivo.name);
    try {
      setErrorPdf(await onAdjuntarPdf(archivo));
    } finally {
      setSubiendo(null);
    }
  }

  async function agregarEnlace() {
    if (!validarEnlace(enlace)) {
      setErrorEnlace(ERR_ENLACE);
      return;
    }
    setErrorEnlace(null);
    setGuardandoEnlace(true);
    try {
      const rechazo = await onAgregarEnlace(enlace.trim());
      if (rechazo) {
        setErrorEnlace(rechazo);
        return;
      }
      setEnlace("");
      setAgregandoEnlace(false);
    } finally {
      setGuardandoEnlace(false);
    }
  }

  const mensaje = errorPdf ?? error;

  return (
    <Field data-invalid={!!mensaje}>
      <FieldLabel>
        Evidencias <span className="font-normal text-muted-foreground">· PDF o enlace, puedes adjuntar varias</span>
      </FieldLabel>
      {evidencias.length > 0 ? (
        <ul className="space-y-2">
          {evidencias.map((ev) => (
            <EvidenciaItem
              key={ev.id}
              evidencia={ev}
              onQuitar={bloqueado ? undefined : () => onQuitar(ev.id)}
            />
          ))}
        </ul>
      ) : null}
      {subiendo ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Subiendo {subiendo}…
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar archivo PDF"
          disabled={bloqueado}
          onChange={alElegirArchivo}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={bloqueado}
          onClick={() => inputRef.current?.click()}
        >
          <PaperclipIcon />
          Adjuntar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={bloqueado}
          aria-expanded={agregandoEnlace}
          onClick={() => setAgregandoEnlace((v) => !v)}
        >
          <LinkIcon />
          Agregar enlace
        </Button>
      </div>

      {agregandoEnlace ? (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <Field data-invalid={!!errorEnlace}>
            <FieldLabel htmlFor="evidencia-enlace">Enlace de la evidencia</FieldLabel>
            <Input
              id="evidencia-enlace"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={enlace}
              disabled={guardandoEnlace}
              aria-invalid={!!errorEnlace}
              onChange={(e) => setEnlace(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void agregarEnlace();
                }
              }}
            />
            <FieldError>{errorEnlace}</FieldError>
          </Field>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={bloqueado} onClick={() => void agregarEnlace()}>
              {guardandoEnlace ? <Spinner /> : null}
              Agregar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={guardandoEnlace}
              onClick={() => {
                setAgregandoEnlace(false);
                setEnlace("");
                setErrorEnlace(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <FieldDescription className="text-xs">PDF hasta 3 MiB · enlace http/https hasta 2048 caracteres</FieldDescription>
      <FieldError>{mensaje}</FieldError>
    </Field>
  );
}
