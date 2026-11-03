import { test, expect, type Browser, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { checked, provisionUsers, rpc } from "../../scripts/lib/local.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";

type Usuario = Awaited<ReturnType<typeof provisionUsers>>[number];
let qa: Usuario, m1: Usuario, m2: Usuario;
let tiposA: { id: string; codigo: string }[];
let tiposM: { id: string; codigo: string }[];
test.beforeAll(async () => {
  const users = await provisionUsers();
  [qa, , m1, m2] = users;
  tiposA = checked(await qa.client.from("tipo_actividad").select("id,codigo").order("codigo"));
  tiposM = checked(await qa.client.from("tipo_metrica").select("id,codigo").order("codigo"));
});
const tipoA = (codigo: string) => tiposA.find((t) => t.codigo === codigo)!.id;
const tipoM = (codigo: string) => tiposM.find((t) => t.codigo === codigo)!.id;

async function login(page: Page, email = "qa1@qally.example.test") {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
}
async function contexto(browser: Browser, email?: string) {
  const ctx = await browser.newContext({ baseURL: base });
  const page = await ctx.newPage();
  if (email) await login(page, email);
  return { ctx, page };
}
/** Proyecto aislado por ejecución con Miembro 1 y 2 y las métricas indicadas. */
async function proyecto(metricas: { codigo: string; objetivo: string }[] = []) {
  const nombre = `CU-05 ${randomUUID()}`;
  const p = await rpc(qa.client, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: nombre,
    p_descripcion: "Fixture local de CU-05",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [m1.id, m2.id],
    p_metricas: metricas.map((m) => ({
      tipoId: tipoM(m.codigo),
      objetivo: m.objetivo,
      ...(m.codigo === "M-01" ? { objetivoCritico: "100" } : {}),
    })),
  });
  return { id: p.id as string, nombre };
}
async function metricaId(pid: string, codigo: string) {
  return (
    checked(
      await qa.client
        .from("metrica_proyecto")
        .select("id")
        .eq("proyecto_id", pid)
        .eq("tipo_metrica_id", tipoM(codigo))
        .single(),
    ) as { id: string }
  ).id;
}
async function medir(pid: string, codigo: string, datos: Record<string, number>, fecha: string) {
  await rpc(qa.client, "registrar_medicion", {
    p_medicion_id: randomUUID(),
    p_metrica_proyecto_id: await metricaId(pid, codigo),
    p_medida_en: `${fecha}T00:00:00Z`,
    p_datos_fuente: { ...datos, fuente_referencia: "https://example.test/qally/cu05" },
  });
}
/** Actividad llevada por RPC hasta el estado indicado (flujos CU-03/CU-04). */
async function actividad(
  pid: string,
  codigo: string,
  estado: "Pendiente" | "En progreso" | "En revisión" | "Aprobada",
  responsable?: Usuario,
) {
  let a = await rpc(qa.client, "agregar_actividad", {
    p_proyecto_id: pid,
    p_tipo_id: tipoA(codigo),
    p_descripcion: `Actividad ${codigo} ${estado}`,
  });
  if (estado === "Pendiente") return;
  const r = responsable ?? m1;
  a = await rpc(qa.client, "asignar_responsable", {
    p_actividad_id: a.id,
    p_responsable_id: r.id,
    p_version_esperada: a.version,
  });
  a = await rpc(r.client, "iniciar_actividad", { p_actividad_id: a.id, p_version_esperada: a.version });
  if (estado === "En progreso") return;
  const e = await rpc(r.client, "preparar_entrega", { p_actividad_id: a.id, p_version_esperada: a.version });
  a = await rpc(r.client, "guardar_resultado", {
    p_entrega_id: e.id,
    p_resultado: "Resultado de la actividad",
    p_version_esperada: e.version,
  });
  a = await rpc(r.client, "agregar_enlace", {
    p_entrega_id: e.id,
    p_url: "https://example.test/qally/cu05",
    p_version_esperada: a.version,
  });
  a = await rpc(r.client, "enviar_entrega", { p_entrega_id: e.id, p_version_esperada: a.version });
  if (estado === "En revisión") return;
  await rpc(qa.client, "revisar_entrega", {
    p_entrega_id: e.id,
    p_decision: "Aprobar",
    p_version_esperada: a.version,
  });
}

const ETAPAS = ["Especificación de requerimientos", "Diseño del software", "Desarrollo"];
const etapa = (page: Page, nombre: string) => page.getByRole("region", { name: nombre, exact: true });
const conteo = (region: Locator, estado: string) =>
  region
    .getByRole("list", { name: "Actividades SQA por estado" })
    .getByRole("listitem")
    .filter({ hasText: estado });
const metrica = (page: Page, codigo: string) =>
  page.getByRole("list", { name: "Métricas del proyecto" }).getByRole("listitem").filter({ hasText: codigo });

/** Ámbito sin elementos: «Sin evaluar», sin porcentaje ni clasificación (DEC-27). */
async function sinEvaluar(region: Locator) {
  await expect(region).toContainText("Sin evaluar");
  // La nota explicativa menciona las clasificaciones; lo que no debe aparecer es un resultado.
  await expect(region).not.toContainText(/\d+\.\d{2} % · (Malo|Regular|Bueno|Excelente)/);
}

test("QA consulta salud calculada general y por etapa, conteos, actividades, aportes y Sin medición", async ({
  page,
}) => {
  const { id: pid, nombre } = await proyecto([
    { codigo: "M-01", objetivo: "90" },
    { codigo: "M-02", objetivo: "90" },
    { codigo: "M-04", objetivo: "0" },
  ]);
  await actividad(pid, "A-01", "Pendiente");
  await actividad(pid, "A-02", "Aprobada");
  await actividad(pid, "A-03", "En progreso", m2);
  await actividad(pid, "A-05", "En revisión");
  await medir(pid, "M-02", { integrados_revisados: 19, integrados: 20 }, "2026-10-10");

  await login(page);
  await page.getByRole("link", { name: nombre }).click();
  await page.getByRole("navigation", { name: "Secciones del proyecto" }).getByRole("link", { name: "Salud" }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${pid}/salud$`));

  // DEC-27: 100 × (1 Aprobada + aporte 1 de M-02) / (4 actividades + 3 métricas) = 28.57 %.
  const general = page.getByRole("region", { name: "Salud general" });
  await expect(general.getByTestId("salud-porcentaje")).toHaveText("28.57 %");
  await expect(general).toContainText("28.57 % · Malo");
  await expect(general).toContainText("2 de 7 puntos");
  await expect(general).toContainText("1 de 4 actividades Aprobadas · 3 métricas");
  await expect(general.getByRole("list", { name: "Advertencias de salud" })).toContainText("Evaluación parcial: 2 métricas");
  await expect(conteo(general, "Pendiente")).toHaveText(/Pendiente\s*1$/);
  await expect(conteo(general, "En progreso")).toHaveText(/En progreso\s*1$/);
  await expect(conteo(general, "En revisión")).toHaveText(/En revisión\s*1$/);
  await expect(conteo(general, "Aprobada")).toHaveText(/Aprobada\s*1$/);

  // Tres etapas en orden fijo.
  const regiones = await page.getByRole("region").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(regiones.filter((n) => ETAPAS.includes(n ?? ""))).toEqual(ETAPAS);
  await expect(etapa(page, ETAPAS[0]!)).toContainText("50.00 % · Regular");
  await expect(etapa(page, ETAPAS[1]!)).toContainText("0.00 % · Malo");
  await expect(etapa(page, ETAPAS[1]!)).toContainText("0 % evaluado");
  await expect(etapa(page, ETAPAS[2]!)).toContainText("25.00 % · Malo");
  await expect(etapa(page, ETAPAS[2]!)).toContainText("Evaluación parcial");
  const req = etapa(page, ETAPAS[0]!);
  await expect(conteo(req, "Pendiente")).toHaveText(/Pendiente\s*1$/);
  await expect(conteo(req, "Aprobada")).toHaveText(/Aprobada\s*1$/);
  await expect(conteo(req, "En revisión")).toHaveText(/En revisión\s*0$/);
  await expect(req).toContainText("Esta etapa no tiene métricas, solo actividades SQA.");
  await expect(conteo(etapa(page, ETAPAS[1]!), "En progreso")).toHaveText(/En progreso\s*1$/);
  await expect(etapa(page, ETAPAS[2]!)).toContainText("Métricas: 1 Cumple · 2 Sin medición");

  // SF-02: actividades de la etapa con estado y responsable.
  await req.getByText("Ver actividades (2)").click();
  const lista = req.getByRole("list", { name: `Actividades de ${ETAPAS[0]}` }).getByRole("listitem");
  await expect(lista).toHaveCount(2);
  await expect(lista.filter({ hasText: "A-01" })).toContainText("Sin responsable");
  await expect(lista.filter({ hasText: "A-01" })).toContainText("Pendiente");
  await expect(lista.filter({ hasText: "A-02" })).toContainText("Miembro 1");
  await expect(lista.filter({ hasText: "A-02" })).toContainText("Aprobada");
  const dis = etapa(page, ETAPAS[1]!);
  await dis.getByText("Ver actividades (1)").click();
  await expect(dis.getByRole("list", { name: `Actividades de ${ETAPAS[1]}` })).toContainText("Miembro 2");
  await expect(dis.getByRole("link", { name: "Abrir en Actividades SQA" })).toHaveAttribute(
    "href",
    `/proyectos/${pid}/actividades?etapa=diseno`,
  );

  // SF-01 y FE-01: valor actual, objetivo, cumplimiento y estado; sin medición no es cero.
  await expect(page.getByRole("region", { name: "Resumen de métricas" })).toContainText(
    "3 de las 4 métricas del catálogo",
  );
  await expect(metrica(page, "M-02")).toContainText("95.00 %");
  await expect(metrica(page, "M-02")).toContainText("Cumple");
  await expect(metrica(page, "M-02")).toContainText("Objetivo: ≥ 90 %");
  await expect(metrica(page, "M-02")).toContainText("Estado de medición: Evaluable");
  await expect(metrica(page, "M-02")).toContainText("Medido el 10 oct 2026");
  await expect(metrica(page, "M-02")).toContainText("Aporte a la salud: 1.00 de 1");
  for (const codigo of ["M-01", "M-04"]) {
    await expect(metrica(page, codigo)).toContainText("Sin medición (no equivale a 0)");
    await expect(metrica(page, codigo)).toContainText("Sin fecha de medición");
    await expect(metrica(page, codigo)).not.toContainText("Medido el");
    await expect(metrica(page, codigo)).toContainText("Aporte a la salud: 0 (sin datos)");
  }
  await expect(metrica(page, "M-01")).toContainText("Objetivo: general ≥ 90 % · críticas ≥ 100 %");
  await expect(metrica(page, "M-04")).not.toContainText(/Valor actual\s*0/);

  // Solo lectura: la vista no ofrece acciones de gestión.
  await expect(page.getByRole("button", { name: /Registrar|Agregar|Asignar|Aprobar|Devolver/ })).toHaveCount(0);
});

test("Miembro participante consulta la salud; sin acceso o inexistente no muestra datos", async ({ page, browser }) => {
  const { id: pid } = await proyecto();
  await login(page, "miembro1@qally.example.test");
  await page.goto(`/proyectos/${pid}/salud`);
  const tabs = page.getByRole("navigation", { name: "Secciones del proyecto" });
  await expect(tabs.getByRole("link", { name: "Salud" })).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link", { name: "Reportes" })).toHaveCount(0);
  await sinEvaluar(page.getByRole("region", { name: "Salud general" }));
  await expect(page.getByText("todavía no tiene actividades SQA ni métricas configuradas")).toBeVisible();
  for (const nombreEtapa of ETAPAS) {
    await expect(etapa(page, nombreEtapa)).toContainText("Sin actividades SQA en esta etapa.");
    await sinEvaluar(etapa(page, nombreEtapa));
  }
  await expect(page.getByText("Este proyecto aún no tiene métricas configuradas.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumen de métricas" })).toContainText(
    "0 de las 4 métricas del catálogo",
  );

  // FE-02: QA ajeno, Miembro sin participación, inexistente y malformado se tratan igual.
  for (const email of ["qa2@qally.example.test", "miembro3@qally.example.test"]) {
    const otro = await contexto(browser, email);
    await otro.page.goto(`/proyectos/${pid}/salud`);
    await expect(otro.page.getByText("Este proyecto no está disponible")).toBeVisible();
    await expect(otro.page.getByText("Sin evaluar")).toHaveCount(0);
    await expect(otro.page.getByRole("navigation", { name: "Secciones del proyecto" })).toHaveCount(0);
    await otro.ctx.close();
  }
  for (const id of [randomUUID(), "no-es-un-uuid"]) {
    await page.goto(`/proyectos/${id}/salud`);
    await expect(page.getByText("Este proyecto no está disponible")).toBeVisible();
  }
  await page.getByRole("link", { name: "Volver al listado" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);

  // Sin sesión: redirige al inicio de sesión sin mostrar datos.
  const invitado = await contexto(browser);
  await invitado.page.goto(`/proyectos/${pid}/salud`);
  await expect(invitado.page).toHaveURL(/\/login/);
  await invitado.ctx.close();
});

test("medición No evaluable y proyecto cerrado consultable por QA y Miembro", async ({ page, browser }) => {
  const { id: pid } = await proyecto([{ codigo: "M-03", objetivo: "100" }]);
  await actividad(pid, "A-05", "Aprobada");
  await medir(pid, "M-03", { requisitos_probados: 0, requisitos_definidos: 0 }, "2026-10-05");
  const { version } = checked(
    await qa.client.from("proyecto").select("version:version::text").eq("id", pid).single(),
  ) as { version: string };
  await rpc(qa.client, "cerrar_proyecto", { p_proyecto_id: pid, p_version_esperada: version });

  await login(page);
  const miembro = await contexto(browser, "miembro1@qally.example.test");
  for (const p of [page, miembro.page]) {
    await p.goto(`/proyectos/${pid}/salud`);
    await expect(p.getByRole("note")).toContainText("Proyecto cerrado");
    // (1 Aprobada + 0 de M-03 No evaluable) / 2 = 50 %, con evaluación parcial.
    await expect(p.getByRole("region", { name: "Salud general" })).toContainText("50.00 % · Regular");
    await expect(p.getByRole("region", { name: "Salud general" })).toContainText("Evaluación parcial");
    await expect(conteo(etapa(p, "Desarrollo"), "Aprobada")).toHaveText(/Aprobada\s*1$/);
    await expect(metrica(p, "M-03")).toContainText("No disponible");
    await expect(metrica(p, "M-03")).toContainText("No evaluable");
    await expect(metrica(p, "M-03")).toContainText("Estado de medición: No evaluable");
    await expect(metrica(p, "M-03")).toContainText("Medido el 05 oct 2026");
    await expect(metrica(p, "M-03")).not.toContainText("Sin medición");
    await expect(metrica(p, "M-03")).toContainText("Aporte a la salud: 0 (sin datos)");
  }
  await miembro.ctx.close();
});
