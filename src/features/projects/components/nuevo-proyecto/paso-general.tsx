"use client";
import { useId, useRef, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CamposGenerales,
  validarDatosGenerales,
} from "../editar-proyecto-dialog";
import { buscarMiembrosAction } from "../../actions";
import type { EstadoAsistente, PersonaElegible } from "./estado";

export function PasoGeneral({
  estado,
  onChange,
  intentado,
  elegibles,
  creador,
  siguienteCursor,
  onConocer,
}: {
  estado: EstadoAsistente;
  onChange: (e: EstadoAsistente) => void;
  intentado: boolean;
  elegibles: PersonaElegible[];
  creador: PersonaElegible;
  siguienteCursor: string | null;
  onConocer: (personas: PersonaElegible[]) => void;
}) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(elegibles);
  const [cursor, setCursor] = useState(siguienteCursor);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const solicitud = useRef(0);
  function buscar(texto: string, cargarMas = false) {
    const turno = ++solicitud.current;
    setError(null);
    startTransition(async () => {
      try {
        const r = await buscarMiembrosAction({
          texto,
          ...(cargarMas && cursor ? { cursor } : {}),
        });
        if (solicitud.current !== turno) return;
        if (!r.ok) {
          setError(r.error.mensaje);
          return;
        }
        setVisibles((v) =>
          cargarMas ? [...v, ...r.datos.items] : r.datos.items,
        );
        setCursor(r.datos.siguienteCursor);
        onConocer(r.datos.items);
      } catch {
        if (solicitud.current === turno)
          setError("No pudimos buscar miembros. Inténtalo de nuevo.");
      }
    });
  }
  function alternar(persona: PersonaElegible, marcado: boolean) {
    onConocer([persona]);
    onChange({
      ...estado,
      miembros: marcado
        ? [...new Set([...estado.miembros, persona.id])]
        : estado.miembros.filter((m) => m !== persona.id),
    });
  }
  return (
    <div className="flex flex-col gap-8">
      <CamposGenerales
        valores={estado.general}
        onChange={(general) => onChange({ ...estado, general })}
        errores={intentado ? validarDatosGenerales(estado.general) : {}}
      />
      <FieldSet>
        <FieldLegend>Miembros del equipo</FieldLegend>
        <FieldDescription>
          Selecciona a quienes tendrán acceso al proyecto. QA se incorpora
          automáticamente.
        </FieldDescription>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <span className="font-medium">{creador.nombre}</span>
            <Badge variant="secondary">QA · creador</Badge>
          </div>
          <label htmlFor={id} className="sr-only">
            Buscar miembros
          </label>
          <div className="flex gap-2 border-b p-3">
            <Input
              id={id}
              type="search"
              maxLength={120}
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                buscar(e.target.value);
              }}
            />
            <Button
              variant="outline"
              onClick={() => buscar(busqueda)}
              disabled={pendiente}
            >
              Buscar
            </Button>
          </div>
          {error ? (
            <p role="alert" className="p-3 text-destructive">
              {error}
            </p>
          ) : null}
          <ul
            className="max-h-72 divide-y overflow-y-auto"
            aria-busy={pendiente}
          >
            {visibles.map((p) => (
              <li key={p.id}>
                <Field
                  orientation="horizontal"
                  className="items-center gap-3 px-4 py-3"
                >
                  <Checkbox
                    id={`miembro-${p.id}`}
                    checked={estado.miembros.includes(p.id)}
                    onCheckedChange={(v) => alternar(p, v === true)}
                  />
                  <FieldLabel
                    htmlFor={`miembro-${p.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    {p.nombre}
                  </FieldLabel>
                </Field>
              </li>
            ))}
            {!visibles.length && !pendiente ? (
              <li className="p-4 text-sm text-muted-foreground">
                No hay miembros que coincidan.
              </li>
            ) : null}
          </ul>
          {cursor ? (
            <Button
              variant="ghost"
              onClick={() => buscar(busqueda, true)}
              disabled={pendiente}
            >
              Cargar más miembros
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {estado.miembros.length + 1}{" "}
          {estado.miembros.length ? "personas" : "persona"} en el proyecto
          (incluye al QA creador).
        </p>
      </FieldSet>
    </div>
  );
}
