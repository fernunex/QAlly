"use client";

import { useRef, useState } from "react";
import { LinkIcon, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LIMITE_PDF_BYTES, LIMITE_URL_CARACTERES } from "@/lib/catalogs";
import type { Evidencia } from "@/lib/domain";
import { EvidenciaItem } from "@/features/evidences/components/evidencia-item";

export const ERR_PDF = "El archivo no es un PDF válido o supera 3 MiB.";
export const ERR_ENLACE =
  "El enlace no es válido: debe ser una URL http:// o https:// de hasta 2048 caracteres.";
export const ERR_FALTA_EVIDENCIA = "Falta la evidencia: adjunta un PDF o agrega un enlace.";
export const ERR_FALTA_RESULTADO = "Falta el resultado de la actividad.";

export function validarPdf(archivo: { type: string; size: number }): boolean {
  return archivo.type === "application/pdf" && archivo.size > 0 && archivo.size <= LIMITE_PDF_BYTES;
}

export function validarEnlace(valor: string): boolean {
  const url = valor.trim();
  if (url.length === 0 || url.length > LIMITE_URL_CARACTERES) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Evidencias del intento en preparación: lista con quitar, adjuntar PDF y agregar enlace. */
export function EvidenciasEditor({
  evidencias,
  onChange,
  error,
  nuevoId,
}: {
  evidencias: Evidencia[];
  onChange: (e: Evidencia[]) => void;
  /** Error de «falta evidencia» enviado por el formulario padre. */
  error?: string;
  nuevoId: () => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [agregandoEnlace, setAgregandoEnlace] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);

  function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!validarPdf(archivo)) {
      setErrorPdf(ERR_PDF);
      return;
    }
    setErrorPdf(null);
    // TODO(funcionalidad): reservarArchivoEvidencia + subida a Storage privado (contratos-v1 §5).
    onChange([...evidencias, { id: nuevoId(), tipo: "pdf", nombreArchivo: archivo.name, tamanoBytes: archivo.size }]);
  }

  function agregarEnlace() {
    if (!validarEnlace(enlace)) {
      setErrorEnlace(ERR_ENLACE);
      return;
    }
    setErrorEnlace(null);
    onChange([...evidencias, { id: nuevoId(), tipo: "enlace", url: enlace.trim() }]);
    setEnlace("");
    setAgregandoEnlace(false);
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
              onQuitar={() => onChange(evidencias.filter((x) => x.id !== ev.id))}
            />
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar archivo PDF"
          onChange={alElegirArchivo}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <PaperclipIcon />
          Adjuntar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
              aria-invalid={!!errorEnlace}
              onChange={(e) => setEnlace(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarEnlace();
                }
              }}
            />
            <FieldError>{errorEnlace}</FieldError>
          </Field>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={agregarEnlace}>
              Agregar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
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
