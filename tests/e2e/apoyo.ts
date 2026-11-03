/*
 * Apoyo compartido de las specs de caminata (@caminata) y revisión entre pares (@pares).
 * Las specs por CU (cuNN.spec.ts) conservan sus propios helpers. Plan y responsables:
 * docs/equipo/plan-pruebas-dec25-28.md.
 */
import { expect, test, type Browser, type Page, type TestDetails } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { checked, provisionUsers, rpc } from "../../scripts/lib/local.mjs";

loadEnvFile(".env.local");
export const clave = process.env.QALLY_DEV_PASSWORD!;
export const base = "http://127.0.0.1:3100";
export const ETAPAS = ["Especificación de requerimientos", "Diseño del software", "Desarrollo"] as const;

/** Integrantes según el registro de commits de cada CU (git log). */
export const EQUIPO = {
  fernando: "Fer (fernunex)",
  emi: "Emi (emidsm)",
  daniela: "Daniela Hernández",
  joss: "Josuu (Root_Joss)",
  jdsc: "David (JDSC21)",
} as const;

/** Etiquetas y responsable de una prueba: `test(titulo, detalle("@pares", "CU-05", EQUIPO.fernando), …)`. */
export function detalle(tecnica: "@caminata" | "@pares", cu: string, responsable: string): TestDetails {
  return {
    tag: [tecnica, `@${cu.toLowerCase()}`],
    annotation: [
      { type: "responsable", description: responsable },
      { type: "caso de uso", description: cu },
    ],
  };
}

export type Usuario = Awaited<ReturnType<typeof provisionUsers>>[number];
export type Contexto = {
  qa: Usuario;
  m1: Usuario;
  m2: Usuario;
  tipoA: (codigo: string) => string;
  tipoM: (codigo: string) => string;
};

export async function preparar(): Promise<Contexto> {
  const users = await provisionUsers();
  const [qa, , m1, m2] = users;
  const tiposA: { id: string; codigo: string }[] = checked(await qa!.client.from("tipo_actividad").select("id,codigo"));
  const tiposM: { id: string; codigo: string }[] = checked(await qa!.client.from("tipo_metrica").select("id,codigo"));
  return {
    qa: qa!,
    m1: m1!,
    m2: m2!,
    tipoA: (c) => tiposA.find((t) => t.codigo === c)!.id,
    tipoM: (c) => tiposM.find((t) => t.codigo === c)!.id,
  };
}

export async function login(page: Page, email = "qa1@qally.example.test") {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
}

export async function contexto(browser: Browser, email?: string) {
  const ctx = await browser.newContext({ baseURL: base });
  const page = await ctx.newPage();
  if (email) await login(page, email);
  return { ctx, page };
}

/** Proyecto por RPC con Miembro 1 y 2, sin actividades iniciales y con las métricas {codigo: objetivo}. */
export async function proyecto(c: Contexto, metricas: Record<string, string> = {}, prefijo = "E2E") {
  const nombre = `${prefijo} ${randomUUID()}`;
  const p = await rpc(c.qa.client, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: nombre,
    p_descripcion: "Fixture de caminata / revisión entre pares",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [c.m1.id, c.m2.id],
    p_metricas: Object.entries(metricas).map(([codigo, objetivo]) => ({
      tipoId: c.tipoM(codigo),
      objetivo,
      ...(codigo === "M-01" ? { objetivoCritico: "100" } : {}),
    })),
  });
  return { id: p.id as string, nombre };
}

type Estado = "Pendiente" | "En progreso" | "En revisión" | "Aprobada";

/** Agrega una instancia y la lleva por RPC hasta el estado indicado (flujos de CU-03/CU-04). */
export async function actividad(c: Contexto, pid: string, codigo: string, estado: Estado, url = "https://example.test/evidencia") {
  let a = await rpc(c.qa.client, "agregar_actividad", { p_proyecto_id: pid, p_tipo_id: c.tipoA(codigo), p_descripcion: `${codigo} ${estado}` });
  if (estado === "Pendiente") return a.id as string;
  a = await rpc(c.qa.client, "asignar_responsable", { p_actividad_id: a.id, p_responsable_id: c.m1.id, p_version_esperada: a.version });
  a = await rpc(c.m1.client, "iniciar_actividad", { p_actividad_id: a.id, p_version_esperada: a.version });
  if (estado === "En progreso") return a.id as string;
  const e = await rpc(c.m1.client, "preparar_entrega", { p_actividad_id: a.id, p_version_esperada: a.version });
  a = await rpc(c.m1.client, "guardar_resultado", { p_entrega_id: e.id, p_resultado: "Resultado", p_version_esperada: e.version });
  a = await rpc(c.m1.client, "agregar_enlace", { p_entrega_id: e.id, p_url: url, p_version_esperada: a.version });
  a = await rpc(c.m1.client, "enviar_entrega", { p_entrega_id: e.id, p_version_esperada: a.version });
  if (estado === "Aprobada")
    await rpc(c.qa.client, "revisar_entrega", { p_entrega_id: e.id, p_decision: "Aprobar", p_version_esperada: a.version });
  return a.id as string;
}

export async function medir(c: Contexto, pid: string, codigo: string, datos: Record<string, number>, fecha = "2026-10-10") {
  const m = checked(
    await c.qa.client.from("metrica_proyecto").select("id").eq("proyecto_id", pid).eq("tipo_metrica_id", c.tipoM(codigo)).single(),
  ) as { id: string };
  await rpc(c.qa.client, "registrar_medicion", {
    p_medicion_id: randomUUID(),
    p_metrica_proyecto_id: m.id,
    p_medida_en: `${fecha}T00:00:00Z`,
    p_datos_fuente: datos,
  });
}

/** Adjunta una captura de página completa al reporte de la prueba (evidencia para la bitácora). */
export async function evidencia(page: Page, titulo: string) {
  await test.info().attach(titulo, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

/** Texto «NN.NN % · Clase» o «Sin evaluar» de la región de salud indicada en CU-05. */
export async function saludEnDashboard(page: Page, region: string) {
  const texto = (await page.getByRole("region", { name: region, exact: true }).innerText()).replace(/\s+/g, " ");
  return texto.match(/\d+\.\d{2} % · (Malo|Regular|Bueno|Excelente)|Sin evaluar/)?.[0] ?? null;
}
