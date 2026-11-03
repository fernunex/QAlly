import { test, expect, type Browser, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { checked, provisionUsers, rpc } from "../../scripts/lib/local.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";
const ETAPAS = ["Especificación de requerimientos", "Diseño del software", "Desarrollo"];

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
/** Proyecto aislado por ejecución con Miembro 1 y 2, M-01 sin medición y M-02 medida. */
async function proyecto() {
  const nombre = `CU-06 ${randomUUID()}`;
  const p = await rpc(qa.client, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: nombre,
    p_descripcion: "Fixture local de CU-06",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [m1.id, m2.id],
    p_metricas: [
      { tipoId: tipoM("M-01"), objetivo: "90", objetivoCritico: "100" },
      { tipoId: tipoM("M-02"), objetivo: "90" },
    ],
  });
  const pid = p.id as string;
  const metrica = checked(
    await qa.client
      .from("metrica_proyecto")
      .select("id")
      .eq("proyecto_id", pid)
      .eq("tipo_metrica_id", tipoM("M-02"))
      .single(),
  ) as { id: string };
  await rpc(qa.client, "registrar_medicion", {
    p_medicion_id: randomUUID(),
    p_metrica_proyecto_id: metrica.id,
    p_medida_en: "2026-10-10T00:00:00Z",
    p_datos_fuente: { integrados_revisados: 19, integrados: 20, fuente_referencia: "https://example.test/qally/cu06" },
  });
  await rpc(qa.client, "agregar_actividad", {
    p_proyecto_id: pid,
    p_tipo_id: tipoA("A-01"),
    p_descripcion: "Actividad A-01 pendiente",
  });
  const a = await rpc(qa.client, "agregar_actividad", {
    p_proyecto_id: pid,
    p_tipo_id: tipoA("A-05"),
    p_descripcion: "Actividad A-05 asignada",
  });
  await rpc(qa.client, "asignar_responsable", {
    p_actividad_id: a.id,
    p_responsable_id: m2.id,
    p_version_esperada: a.version,
  });
  return { id: pid, nombre };
}
async function cerrar(pid: string) {
  const { version } = checked(
    await qa.client.from("proyecto").select("version:version::text").eq("id", pid).single(),
  ) as { version: string };
  await rpc(qa.client, "cerrar_proyecto", { p_proyecto_id: pid, p_version_esperada: version });
}
const reporte = (page: Page) => page.getByRole("article", { name: "Reporte de calidad" });

async function generar(page: Page, pid: string) {
  await page.goto(`/proyectos/${pid}/reportes`);
  await page.getByRole("button", { name: "Generar reporte" }).click();
  await expect(reporte(page)).toBeVisible();
}
/** Exporta desde la UI y devuelve la descarga y el token enviado (solo para pruebas). */
async function exportar(page: Page) {
  const [descarga, peticion, respuesta] = await Promise.all([
    page.waitForEvent("download"),
    page.waitForRequest((r) => r.url().endsWith("/api/reportes/pdf") && r.method() === "POST"),
    page.waitForResponse((r) => r.url().endsWith("/api/reportes/pdf")),
    page.getByRole("button", { name: "Exportar a PDF" }).click(),
  ]);
  return { descarga, respuesta, token: (peticion.postDataJSON() as { capturaToken: string }).capturaToken };
}
async function esPdf(ruta: string) {
  const bytes = await readFile(ruta);
  expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(bytes.subarray(-16).toString("latin1")).toContain("%%EOF");
  expect(bytes.byteLength).toBeLessThan(3 * 1024 * 1024);
}

test("QA genera el reporte con la salud de CU-05, advertencias y Sin medición, lo regenera y descarga un PDF válido", async ({
  page,
}) => {
  const { id: pid, nombre } = await proyecto();
  await login(page);
  await page.getByRole("link", { name: nombre }).click();
  await page.getByRole("navigation", { name: "Secciones del proyecto" }).getByRole("link", { name: "Reportes" }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${pid}/reportes$`));
  // Paso 2: se ofrece la opción; el reporte no se genera hasta solicitarlo.
  await expect(reporte(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Generar reporte" }).click();

  const doc = reporte(page);
  await expect(doc.getByRole("heading", { name: nombre })).toBeVisible();
  await expect(doc).toContainText("Fixture local de CU-06");
  await expect(doc).toContainText("Fecha de generación");
  await expect(doc).toContainText("Estado del proyecto");
  // Métricas: último valor, objetivo, cumplimiento y Sin medición explícito (no 0).
  const m01 = doc.getByRole("row").filter({ hasText: "M-01" });
  await expect(m01).toContainText("Sin medición");
  await expect(m01).toContainText("Sin medición (no equivale a 0)");
  await expect(m01).toContainText("general ≥ 90 % · críticas ≥ 100 %");
  const m02 = doc.getByRole("row").filter({ hasText: "M-02" });
  await expect(m02).toContainText("95.00 %");
  await expect(m02).toContainText("Cumple");
  await expect(m02).toContainText("10 oct 2026");
  await expect(m02).toContainText("1.00 de 1");
  await expect(m01).toContainText("0 (sin datos)");
  // Actividades SQA por las tres etapas.
  for (const etapa of ETAPAS) await expect(doc.getByRole("group", { name: `Actividades de ${etapa}` })).toBeVisible();
  const req = doc.getByRole("group", { name: `Actividades de ${ETAPAS[0]}` });
  await expect(req.getByRole("row").filter({ hasText: "A-01" })).toContainText("Sin responsable");
  await expect(req.getByRole("row").filter({ hasText: "A-01" })).toContainText("Pendiente");
  await expect(doc.getByRole("group", { name: `Actividades de ${ETAPAS[1]}` })).toContainText(
    "Sin actividades SQA en esta etapa.",
  );
  await expect(doc.getByRole("group", { name: `Actividades de ${ETAPAS[2]}` })).toContainText("Miembro 2");
  // Salud general y por etapa (DEC-27/28): misma definición y resultados que CU-05.
  const esperado: Record<string, string> = {
    General: "25.00 % · Malo",
    [ETAPAS[0]!]: "0.00 % · Malo",
    [ETAPAS[1]!]: "Sin evaluar",
    [ETAPAS[2]!]: "33.33 % · Malo",
  };
  const salud = doc.getByRole("table").first();
  for (const [ambito, texto] of Object.entries(esperado))
    await expect(salud.getByRole("row").filter({ hasText: ambito }).first()).toContainText(texto);
  const advertencias = doc.getByRole("list", { name: "Advertencias del reporte" });
  await expect(advertencias).toContainText("General: Evaluación parcial");
  await expect(advertencias).toContainText(`${ETAPAS[1]}: Sin actividades SQA ni métricas`);
  await expect(advertencias).toContainText(`${ETAPAS[0]}: 0 % evaluado`);

  // Regenerar actualiza la vista y su fecha de generación.
  const fecha = doc.getByTestId("fecha-generacion");
  const antes = await fecha.getAttribute("datetime");
  await page.getByRole("button", { name: "Regenerar reporte" }).click();
  await expect(fecha).not.toHaveAttribute("datetime", antes!);

  // SF-01: PDF privado como adjunto, con la fecha emitida de la captura en el nombre.
  const emitida = (await fecha.getAttribute("datetime"))!;
  const { descarga, respuesta, token } = await exportar(page);
  expect(respuesta.status()).toBe(200);
  const h = respuesta.headers();
  expect(h["content-type"]).toBe("application/pdf");
  expect(h["cache-control"]).toBe("private, no-store");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["content-disposition"]).toMatch(/^attachment; filename="reporte-calidad-cu-06-[a-z0-9-]+\.pdf"/);
  // El sello usa la hora de CDMX, como el resto de la presentación (DEC-24).
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(emitida)).map((x) => [x.type, x.value]),
  );
  const sello = `${p.year}${p.month}${p.day}-${p.hour}${p.minute}`;
  expect(descarga.suggestedFilename()).toBe(`reporte-calidad-${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sello}.pdf`);
  await esPdf((await descarga.path())!);
  // El token no aparece en la URL ni en el almacenamiento del navegador.
  expect(page.url()).not.toContain(token.slice(0, 20));
  const almacenado = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(almacenado).not.toContain(token.slice(3, 23));
});

test("token alterado, ajeno, origen inválido o cuerpo excesivo se rechazan en el servidor", async ({
  page,
  browser,
}) => {
  const { id: pid } = await proyecto();
  await login(page);
  await generar(page, pid);
  const { token } = await exportar(page);
  const api = page.context().request;
  const post = (data: unknown, headers: Record<string, string> = { Origin: base }) =>
    api.post("/api/reportes/pdf", { data, headers: { "Content-Type": "application/json", ...headers } });

  // El token íntegro sigue siendo exportable por su QA.
  const ok = await post({ capturaToken: token });
  expect(ok.status()).toBe(200);
  expect((await ok.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // Alterado: un carácter del texto cifrado o del tag.
  const partes = token.split(".");
  const cambiar = (s: string) => s.slice(0, 10) + (s[10] === "A" ? "B" : "A") + s.slice(11);
  for (const alterado of [
    [partes[0], partes[1], cambiar(partes[2]!), partes[3]].join("."),
    [partes[0], partes[1], partes[2], cambiar(partes[3]!)].join("."),
    "v1.no.es.valido",
  ]) {
    const r = await post({ capturaToken: alterado });
    expect(r.status()).toBe(422);
    expect((await r.json()).error.codigo).toBe("DATOS_INVALIDOS");
  }
  // Un resumen libre del navegador nunca se acepta.
  expect((await post({ capturaToken: token, resumen: { proyecto: { nombre: "falso" } } })).status()).toBe(422);

  // Origen ausente o de otro sitio.
  expect((await post({ capturaToken: token }, {})).status()).toBe(403);
  expect((await post({ capturaToken: token }, { Origin: "https://malicioso.example.test" })).status()).toBe(403);

  // Cuerpo mayor de 2 MiB: TAMANO_EXCEDIDO sin procesarlo.
  const grande = await post({ capturaToken: "x".repeat(2 * 1024 * 1024 + 16) });
  expect(grande.status()).toBe(413);
  expect((await grande.json()).error.codigo).toBe("TAMANO_EXCEDIDO");

  // Token de QA A presentado por QA B (otro usuario): mismo rechazo genérico.
  const otro = await contexto(browser, "qa2@qally.example.test");
  const ajeno = await otro.ctx.request.post("/api/reportes/pdf", {
    data: { capturaToken: token },
    headers: { "Content-Type": "application/json", Origin: base },
  });
  expect(ajeno.status()).toBe(422);
  await otro.ctx.close();

  // Sin sesión.
  const invitado = await contexto(browser);
  const anonimo = await invitado.ctx.request.post("/api/reportes/pdf", {
    data: { capturaToken: token },
    headers: { "Content-Type": "application/json", Origin: base },
  });
  expect(anonimo.status()).toBe(401);
  await invitado.ctx.close();
});

test("Miembro del equipo no puede generar ni exportar, tampoco llamando al servidor", async ({ page, browser }) => {
  const { id: pid } = await proyecto();
  await login(page);
  await generar(page, pid);
  const { token } = await exportar(page);

  const miembro = await contexto(browser, "miembro1@qally.example.test");
  await miembro.page.goto(`/proyectos/${pid}`);
  await expect(
    miembro.page.getByRole("navigation", { name: "Secciones del proyecto" }).getByRole("link", { name: "Reportes" }),
  ).toHaveCount(0);
  await miembro.page.goto(`/proyectos/${pid}/reportes`);
  await expect(miembro.page.getByText("Este proyecto no está disponible")).toBeVisible();
  await expect(miembro.page.getByRole("button", { name: "Generar reporte" })).toHaveCount(0);
  const r = await miembro.ctx.request.post("/api/reportes/pdf", {
    data: { capturaToken: token },
    headers: { "Content-Type": "application/json", Origin: base },
  });
  expect(r.status()).toBe(403);
  expect((await r.json()).error.codigo).toBe("PROHIBIDO");
  await miembro.ctx.close();

  // QA no participante tampoco ve la pantalla.
  const ajeno = await contexto(browser, "qa2@qally.example.test");
  await ajeno.page.goto(`/proyectos/${pid}/reportes`);
  await expect(ajeno.page.getByText("Este proyecto no está disponible")).toBeVisible();
  await ajeno.ctx.close();
});

test("proyecto cerrado: QA genera y exporta sin modificar datos", async ({ page }) => {
  const { id: pid } = await proyecto();
  await cerrar(pid);
  await login(page);
  await page.goto(`/proyectos/${pid}/reportes`);
  await expect(page.getByRole("note")).toContainText("Proyecto cerrado");
  await page.getByRole("button", { name: "Generar reporte" }).click();
  await expect(reporte(page)).toContainText(/Cerrado el \d{2} \w{3} \d{4}/);
  await expect(reporte(page).getByRole("row").filter({ hasText: "M-01" })).toContainText("Sin medición");
  const { descarga, respuesta } = await exportar(page);
  expect(respuesta.status()).toBe(200);
  await esPdf((await descarga.path())!);
});

test("FE-01, FE-02 y captura expirada permiten reintentar o regenerar", async ({ page }) => {
  const { id: pid } = await proyecto();
  await login(page);
  await page.goto(`/proyectos/${pid}/reportes`);

  // FE-01: falla la generación (acción de servidor sin respuesta) → mensaje y reintento.
  const ruta = new RegExp(`/proyectos/${pid}/reportes$`);
  await page.route(ruta, (route) =>
    route.request().method() === "POST" ? route.abort("failed") : route.continue(),
  );
  await page.getByRole("button", { name: "Generar reporte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No pudimos generar el reporte" })).toBeVisible();
  await expect(reporte(page)).toHaveCount(0);
  await page.unroute(ruta);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(reporte(page)).toBeVisible();

  // FE-02: falla la exportación → mensaje y reintento de la exportación.
  await page.route("**/api/reportes/pdf", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: { codigo: "FALLO_PERSISTENCIA", mensaje: "No pudimos completar la operación. Inténtalo de nuevo." } }),
    }),
  );
  await page.getByRole("button", { name: "Exportar a PDF" }).click();
  const alerta = page.getByRole("alert").filter({ hasText: "No pudimos exportar el PDF" });
  await expect(alerta).toBeVisible();
  await page.unroute("**/api/reportes/pdf");
  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    alerta.getByRole("button", { name: "Reintentar exportación" }).click(),
  ]);
  await esPdf((await descarga.path())!);
  await expect(alerta).toHaveCount(0);

  // Captura expirada (410): la UI pide regenerar y actualiza vista y fecha.
  await page.route("**/api/reportes/pdf", (route) =>
    route.fulfill({
      status: 410,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: { codigo: "CAPTURA_EXPIRADA", mensaje: "La captura del reporte venció." } }),
    }),
  );
  await page.getByRole("button", { name: "Exportar a PDF" }).click();
  const vencida = page.getByRole("alert").filter({ hasText: "La captura del reporte venció" });
  await expect(vencida).toBeVisible();
  const fecha = reporte(page).getByTestId("fecha-generacion");
  const antes = await fecha.getAttribute("datetime");
  await page.unroute("**/api/reportes/pdf");
  await vencida.getByRole("button", { name: "Regenerar reporte" }).click();
  await expect(fecha).not.toHaveAttribute("datetime", antes!);
  await expect(vencida).toHaveCount(0);
});
