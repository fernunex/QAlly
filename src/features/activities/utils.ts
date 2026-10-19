import type { Actividad, ActividadResumen, Entrega, Evidencia } from "@/lib/domain";

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

/** Guarda (o crea) el intento en preparación; con `enviadaEn` lo convierte en intento enviado inmutable. */
export function conBorrador(
  a: Actividad,
  datos: { resultado: string; evidencias: Evidencia[]; autorId: string; ahora: string; enviar: boolean },
): Actividad {
  const borrador = intentoEnPreparacion(a);
  const numero = borrador?.numeroIntento ?? intentosEnviados(a).length + 1;
  const entrega: Entrega = {
    id: borrador?.id ?? `${a.id}-e${numero}`,
    actividadId: a.id,
    numeroIntento: numero,
    resultado: datos.resultado.trim() || null,
    autorId: datos.autorId,
    creadaEn: borrador?.creadaEn ?? datos.ahora,
    enviadaEn: datos.enviar ? datos.ahora : null,
    evidencias: datos.evidencias,
    revision: null,
  };
  return { ...a, entregas: [entrega, ...a.entregas.filter((e) => e.id !== entrega.id)] };
}

export function conEvento(a: Actividad, fecha: string, texto: string): Actividad {
  return { ...a, eventos: [{ fecha, texto }, ...a.eventos] };
}
