"use client";

import { useActionState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { iniciarSesion, type EstadoLogin } from "@/lib/session-actions";

const inicial: EstadoLogin = { error: null, correo: "" };

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, inicial);

  return (
    <form action={accion} className="mt-8" noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="correo">Correo</FieldLabel>
          <Input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            required
            defaultValue={estado.correo}
            aria-invalid={!!estado.error}
            className="h-10"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="contrasena">Contraseña</FieldLabel>
          <Input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!estado.error}
            className="h-10"
          />
        </Field>

        {estado.error ? (
          <Alert variant="destructive" role="alert">
            <AlertCircleIcon />
            <AlertDescription>{estado.error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" className="h-10 w-full" disabled={pendiente}>
          {pendiente ? <Spinner /> : null}
          Iniciar sesión
        </Button>
        <FieldDescription className="text-center">
          Demo: <span className="font-mono">david@equipo.dev</span> (QA) o{" "}
          <span className="font-mono">emi@equipo.dev</span> (Miembro), cualquier contraseña.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
