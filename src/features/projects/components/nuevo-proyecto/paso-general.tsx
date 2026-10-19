"use client";

import { useId, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CamposGenerales, validarDatosGenerales } from "@/features/projects/components/editar-proyecto-dialog";
import { iniciales } from "@/lib/format";
import type { EstadoAsistente, PersonaElegible } from "./estado";

export function PasoGeneral({
  estado,
  onChange,
  intentado,
  elegibles,
  creador,
}: {
  estado: EstadoAsistente;
  onChange: (e: EstadoAsistente) => void;
  intentado: boolean;
  elegibles: PersonaElegible[];
  creador: PersonaElegible;
}) {
  const [busqueda, setBusqueda] = useState("");
  const idBusqueda = useId();
  const errores = intentado ? validarDatosGenerales(estado.general) : {};
  const q = busqueda.trim().toLowerCase();
  const visibles = elegibles.filter((p) => !q || `${p.nombre} ${p.correo}`.toLowerCase().includes(q));

  function alternar(id: string, marcado: boolean) {
    onChange({
      ...estado,
      miembros: marcado ? [...estado.miembros, id] : estado.miembros.filter((m) => m !== id),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <CamposGenerales valores={estado.general} onChange={(general) => onChange({ ...estado, general })} errores={errores} />

      <FieldSet>
        <FieldLegend>Miembros del equipo</FieldLegend>
        <FieldDescription>
          Solo las personas del proyecto podrán consultarlo. Puedes ajustar los miembros más adelante.
        </FieldDescription>

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Avatar size="default">
              <AvatarFallback>{iniciales(creador.nombre)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{creador.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{creador.correo}</p>
            </div>
            <Badge variant="secondary">QA · creador</Badge>
            <Checkbox checked disabled aria-label={`${creador.nombre} se incorpora automáticamente`} />
          </div>

          <div className="relative border-b">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <label htmlFor={idBusqueda} className="sr-only">
              Buscar miembros
            </label>
            <Input
              id={idBusqueda}
              type="search"
              placeholder="Buscar por nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-11 rounded-none border-0 pl-10 shadow-none focus-visible:ring-0"
            />
          </div>

          <ul className="max-h-72 divide-y overflow-y-auto">
            {visibles.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Ninguna persona coincide con «{busqueda}».
              </li>
            ) : (
              visibles.map((p) => {
                const id = `miembro-${p.id}`;
                return (
                  <li key={p.id}>
                    <Field orientation="horizontal" className="items-center gap-3 px-4 py-3 hover:bg-accent/40">
                      <Checkbox
                        id={id}
                        checked={estado.miembros.includes(p.id)}
                        onCheckedChange={(v) => alternar(p.id, v === true)}
                      />
                      <Avatar size="default">
                        <AvatarFallback>{iniciales(p.nombre)}</AvatarFallback>
                      </Avatar>
                      <FieldLabel htmlFor={id} className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-0">
                        <span className="truncate text-sm font-medium">{p.nombre}</span>
                        <span className="truncate text-xs font-normal text-muted-foreground">{p.correo}</span>
                      </FieldLabel>
                    </Field>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {estado.miembros.length + 1} {estado.miembros.length + 1 === 1 ? "persona" : "personas"} en el proyecto
          (incluye al QA creador).
        </p>
      </FieldSet>
    </div>
  );
}
