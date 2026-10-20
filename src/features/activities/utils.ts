import type { Actividad, ActividadResumen, Entrega } from "@/lib/domain";

/** Mapa id de usuario → nombre, resuelto en servidor para autores y revisores. */
export type Nombres = Record<string, string>;

type ConEntregas = Pick<Actividad, "entregas">;

/** Intentos ya enviados (inmutables), del más reciente al más antiguo. */
export function intentosEnviados(a: ConEntregas): Entrega[] {
  return a.entregas.filter((e) => e.enviadaEn !== null);
}

/** Intento en preparación (borrador), si existe. */
export function intentoEnPreparacion(a: ConEntregas): Entrega | undefined {
  return a.entregas.find((e) => e.enviadaEn === null);
}

/** Último intento enviado. */
export function ultimoEnviado(a: ConEntregas): Entrega | undefined {
  return intentosEnviados(a)[0];
}

/** Última devolución de QA, si el último intento enviado fue devuelto. */
export function ultimaDevolucion(a: ConEntregas): Entrega | undefined {
  const ultimo = ultimoEnviado(a);
  return ultimo?.revision?.decision === "Devolver" ? ultimo : undefined;
}

/** En progreso cuyo último intento fue devuelto con observaciones. */
export function estaDevuelta(a: Pick<Actividad, "estado" | "entregas">): boolean {
  return a.estado === "En progreso" && ultimaDevolucion(a) !== undefined;
}

/** Fila del tablero En progreso cuyo último intento enviado fue devuelto. */
export function resumenDevuelto(a: Pick<ActividadResumen, "estado" | "ultimoEnvio">): boolean {
  return a.estado === "En progreso" && a.ultimoEnvio?.decision === "Devolver";
}

export function nombreDe(nombres: Nombres, id: string): string {
  return nombres[id] ?? "Usuario";
}

/** Actividad asignada al Miembro, con nombres de proyecto y etapa ya resueltos en servidor. */
export type MiActividad = Actividad & {
  proyectoNombre: string;
  etapaNombre: string;
  proyectoCerrado: boolean;
};

export function conEvento(a: Actividad, fecha: string, texto: string): Actividad {
  return { ...a, eventos: [{ fecha, texto }, ...a.eventos] };
}
