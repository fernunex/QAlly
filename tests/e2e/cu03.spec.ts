import {
  test,
  expect,
  type Browser,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import {
  clients,
  checked,
  provisionUsers,
  rpc,
} from "../../scripts/lib/local.mjs";
import { uploadPdf } from "../../scripts/lib/files.server.mjs";
import { samplePdf } from "../../scripts/lib/fixtures.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";

type Usuario = Awaited<ReturnType<typeof provisionUsers>>[number];
let qa: Usuario, m1: Usuario, m2: Usuario;
let tipos: { id: string; codigo: string }[];
test.beforeAll(async () => {
  const users = await provisionUsers();
  [qa, , m1, m2] = users;
  tipos = checked(
    await qa.client.from("tipo_actividad").select("id,codigo").order("codigo"),
  );
});
const tipo = (codigo: string) => tipos.find((t) => t.codigo === codigo)!.id;

async function login(page: Page, email = "qa1@qally.example.test") {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos$/);
}
async function contexto(browser: Browser, email?: string) {
  const ctx = await browser.newContext({ baseURL: base });
  const page = await ctx.newPage();
  if (email) await login(page, email);
  return { ctx, page };
}
/** Proyecto aislado por ejecución, con Miembro 1 y 2 y sin actividades iniciales. */
async function proyecto() {
  const nombre = `CU-03 ${randomUUID()}`;
  const p = await rpc(qa.client, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: nombre,
    p_descripcion: "Fixture local de CU-03",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [m1.id, m2.id],
  });
  return { id: p.id as string, nombre };
}
const leer = async (id: string) =>
  checked(
    await qa.client
      .from("actividad_sqa")
      .select("estado,responsable_id,version:version::text")
      .eq("id", id)
      .single(),
  ) as { estado: string; responsable_id: string | null; version: string };
/** Actividad En revisión preparada por RPC como responsable (flujo CU-04). */
async function enRevision(pid: string, descripcion: string, pdf = false) {
  let a = await rpc(qa.client, "agregar_actividad", {
    p_proyecto_id: pid,
    p_tipo_id: tipo("A-03"),
    p_descripcion: descripcion,
  });
  a = await rpc(qa.client, "asignar_responsable", {
    p_actividad_id: a.id,
    p_responsable_id: m1.id,
    p_version_esperada: a.version,
  });
  a = await rpc(m1.client, "iniciar_actividad", {
    p_actividad_id: a.id,
    p_version_esperada: a.version,
  });
  const e = await rpc(m1.client, "preparar_entrega", {
    p_actividad_id: a.id,
    p_version_esperada: a.version,
  });
  a = await rpc(m1.client, "guardar_resultado", {
    p_entrega_id: e.id,
    p_resultado: `Resultado de ${descripcion}`,
    p_version_esperada: e.version,
  });
  let v = a.version as string;
  if (pdf) {
    v = (
      await uploadPdf({
        accessToken: m1.token,
        entregaId: e.id,
        versionEsperada: v,
        nombre: "informe-revisión.pdf",
        bytes: samplePdf(),
      })
    ).version;
  } else {
    v = (
      await rpc(m1.client, "agregar_enlace", {
        p_entrega_id: e.id,
        p_url: "https://example.test/qally/cu03",
        p_version_esperada: v,
      })
    ).version;
  }
  await rpc(m1.client, "enviar_entrega", {
    p_entrega_id: e.id,
    p_version_esperada: v,
  });
  return { id: a.id as string, entregaId: e.id as string };
}
const columna = (page: Page, estado: string) =>
  page.getByRole("region", { name: new RegExp(`^${estado}`) });
const tarjeta = (page: Page, estado: string, texto: string) =>
  columna(page, estado).getByRole("button", { name: new RegExp(texto) });

type PeticionAccion = { id: string; body: string; type: string; url: string };
async function capturarAccion(
  page: Page,
  disparar: () => Promise<unknown>,
): Promise<PeticionAccion> {
  const request = page.waitForRequest(
    (r) => !!r.headers()["next-action"] && r.method() === "POST",
  );
  await disparar();
  const r = await request;
  return {
    id: r.headers()["next-action"],
    type: r.headers()["content-type"],
    body: r.postData()!,
    url: r.url(),
  };
}
async function repetir(request: APIRequestContext, accion: PeticionAccion) {
  const response = await request.post(accion.url, {
    headers: {
      "Next-Action": accion.id,
      "Content-Type": accion.type,
      Origin: base,
    },
    data: accion.body,
  });
  return response.text();
}

test("QA agrega actividades repetibles y asigna responsable sin cambiar el estado", async ({
  page,
  browser,
}) => {
  const p = await proyecto();
  await login(page);
  await page.goto(`/proyectos/${p.id}/actividades`);
  await expect(
    page.getByText("Este proyecto aún no tiene actividades SQA"),
  ).toBeVisible();
  const agregar = async (descripcion: string) => {
    await page
      .getByRole("button", { name: "Agregar actividad", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Tipo de actividad", { exact: true }).click();
    await page.getByRole("option", { name: /^A-02 · / }).click();
    await dialog.getByLabel("Descripción", { exact: true }).fill(descripcion);
    return capturarAccion(page, () =>
      dialog
        .getByRole("button", { name: "Agregar actividad", exact: true })
        .click(),
    );
  };
  // Validación local: sin tipo ni descripción no se envía.
  await page
    .getByRole("button", { name: "Agregar actividad", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Agregar actividad", exact: true })
    .click();
  await expect(
    page.getByText("Elige un tipo de actividad del catálogo."),
  ).toBeVisible();
  await expect(page.getByText("La descripción es obligatoria.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();

  const altaAccion = await agregar("Trazabilidad del módulo de login");
  await expect(page.getByText("Actividad agregada en estado Pendiente")).toBeVisible();
  await agregar("Trazabilidad del módulo de reportes");
  await expect(tarjeta(page, "Pendiente", "módulo de login")).toBeVisible();
  await expect(tarjeta(page, "Pendiente", "módulo de reportes")).toBeVisible();
  await expect(columna(page, "Pendiente")).toContainText("Sin responsable");

  const login1 = columna(page, "Pendiente")
    .getByRole("listitem")
    .filter({ hasText: "módulo de login" });
  await login1.getByRole("button", { name: "Asignar responsable" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Miembro 1", { exact: true }).click();
  const asignarAccion = await capturarAccion(page, () =>
    dialog.getByRole("button", { name: "Asignar", exact: true }).click(),
  );
  await expect(page.getByText("Responsable asignado: Miembro 1")).toBeVisible();
  await page.reload();
  await expect(
    columna(page, "Pendiente")
      .getByRole("listitem")
      .filter({ hasText: "módulo de login" }),
  ).toContainText("Miembro 1");
  const filas: {
    estado: string;
    responsable_id: string | null;
    tipo_actividad_id: string;
  }[] = checked(
    await qa.client
      .from("actividad_sqa")
      .select("estado,responsable_id,tipo_actividad_id")
      .eq("proyecto_id", p.id),
  );
  expect(filas).toHaveLength(2);
  expect(filas.every((f) => f.estado === "Pendiente")).toBe(true);
  expect(filas.every((f) => f.tipo_actividad_id === tipo("A-02"))).toBe(true);
  expect(filas.filter((f) => f.responsable_id === m1.id)).toHaveLength(1);

  // RNF-02/03: llamadas directas se vuelven a autorizar en servidor.
  const miembro = await contexto(browser, "miembro1@qally.example.test");
  await miembro.page.goto(`/proyectos/${p.id}/actividades`);
  await expect(tarjeta(miembro.page, "Pendiente", "módulo de login")).toBeVisible();
  await expect(
    miembro.page.getByRole("button", { name: "Agregar actividad" }),
  ).toHaveCount(0);
  await expect(
    miembro.page.getByRole("button", { name: "Asignar responsable" }),
  ).toHaveCount(0);
  expect(await repetir(miembro.page.request, altaAccion)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  expect(await repetir(miembro.page.request, asignarAccion)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  const ajeno = await contexto(browser, "qa2@qally.example.test");
  expect(await repetir(ajeno.page.request, altaAccion)).toContain(
    '"codigo":"NO_DISPONIBLE"',
  );
  expect(await repetir(ajeno.page.request, asignarAccion)).toContain(
    '"codigo":"NO_DISPONIBLE"',
  );
  const guest = await contexto(browser);
  expect(await repetir(guest.page.request, altaAccion)).toContain(
    '"codigo":"SIN_SESION"',
  );
  // Versión obsoleta: repetir la asignación ya confirmada no sobrescribe.
  expect(await repetir(page.request, asignarAccion)).toContain(
    '"codigo":"CONFLICTO"',
  );
  // Proyecto cerrado: solo consulta.
  const { admin } = clients();
  const cerrado = checked(
    await admin
      .from("proyecto")
      .select("id")
      .eq("nombre", "QAlly demo cerrado")
      .single(),
  );
  const [entrada] = JSON.parse(altaAccion.body);
  expect(
    await repetir(page.request, {
      ...altaAccion,
      body: JSON.stringify([{ ...entrada, proyectoId: cerrado.id }]),
    }),
  ).toContain('"codigo":"PROYECTO_CERRADO"');
  await page.goto(`/proyectos/${cerrado.id}/actividades`);
  await expect(page.getByRole("note")).toContainText("Proyecto cerrado");
  await expect(
    page.getByRole("button", { name: "Agregar actividad" }),
  ).toHaveCount(0);
  for (const c of [miembro, ajeno, guest]) await c.ctx.close();
});

test("QA devuelve con observaciones obligatorias y aprueba un intento En revisión", async ({
  page,
  browser,
}) => {
  const p = await proyecto();
  const dev = await enRevision(p.id, "Revisión para devolver");
  const apr = await enRevision(p.id, "Revisión para aprobar");
  await login(page);
  await page.goto(`/proyectos/${p.id}/actividades`);
  await expect(columna(page, "En revisión")).toContainText("2");

  await tarjeta(page, "En revisión", "Revisión para devolver").click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Resultado de Revisión para devolver");
  await expect(sheet).toContainText("https://example.test/qally/cu03");
  await sheet
    .getByRole("button", { name: "Devolver con observaciones" })
    .click();
  await expect(
    sheet.getByText("Escribe las observaciones para el responsable antes de devolver."),
  ).toBeVisible();
  expect((await leer(dev.id)).estado).toBe("En revisión");
  await sheet
    .getByLabel(/Observaciones para el responsable/)
    .fill("Adjuntar la matriz de hallazgos completa.");
  const devolverAccion = await capturarAccion(page, () =>
    sheet.getByRole("button", { name: "Devolver con observaciones" }).click(),
  );
  await expect(
    page.getByText("Actividad devuelta con observaciones"),
  ).toBeVisible();
  await expect(sheet.getByText("En progreso").first()).toBeVisible();
  await expect(sheet).toContainText("Adjuntar la matriz de hallazgos completa.");
  await page.keyboard.press("Escape");
  await expect(
    tarjeta(page, "En progreso", "Revisión para devolver"),
  ).toContainText("Devuelta con observaciones");

  await tarjeta(page, "En revisión", "Revisión para aprobar").click();
  await sheet.getByRole("button", { name: "Aprobar", exact: true }).click();
  const confirmar = page.getByRole("alertdialog");
  await expect(confirmar).toContainText("¿Aprobar esta actividad?");
  const aprobarAccion = await capturarAccion(page, () =>
    confirmar.getByRole("button", { name: "Aprobar", exact: true }).click(),
  );
  await expect(page.getByText("Actividad aprobada", { exact: true })).toBeVisible();
  await expect(sheet).toContainText("Aprobado por QA de desarrollo A");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(tarjeta(page, "Aprobada", "Revisión para aprobar")).toBeVisible();
  await expect(columna(page, "En revisión")).toContainText("Sin actividades");

  const revisiones: { entrega_id: string }[] = checked(
    await qa.client
      .from("revision_entrega")
      .select("entrega_id,decision,observaciones,qa_id")
      .in("entrega_id", [dev.entregaId, apr.entregaId]),
  );
  expect(revisiones).toHaveLength(2);
  expect(revisiones.find((r) => r.entrega_id === dev.entregaId)).toMatchObject({
    decision: "Devolver",
    observaciones: "Adjuntar la matriz de hallazgos completa.",
    qa_id: qa.id,
  });
  expect(revisiones.find((r) => r.entrega_id === apr.entregaId)).toMatchObject({
    decision: "Aprobar",
    qa_id: qa.id,
  });
  expect((await leer(dev.id)).estado).toBe("En progreso");
  expect((await leer(apr.id)).estado).toBe("Aprobada");

  // Una decisión repetida no se confirma dos veces; Miembro no puede revisar.
  expect(await repetir(page.request, aprobarAccion)).toContain(
    '"codigo":"CONFLICTO"',
  );
  expect(await repetir(page.request, devolverAccion)).toContain(
    '"codigo":"CONFLICTO"',
  );
  const miembro = await contexto(browser, "miembro1@qally.example.test");
  expect(await repetir(miembro.page.request, aprobarAccion)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  await miembro.page.goto(`/proyectos/${p.id}/actividades`);
  await tarjeta(miembro.page, "Aprobada", "Revisión para aprobar").click();
  await expect(miembro.page.getByRole("dialog")).toContainText("Aprobado por");
  await expect(
    miembro.page.getByRole("button", { name: "Aprobar", exact: true }),
  ).toHaveCount(0);
  expect(
    checked(
      await qa.client
        .from("revision_entrega")
        .select("id")
        .in("entrega_id", [dev.entregaId, apr.entregaId]),
    ),
  ).toHaveLength(2);
  await miembro.ctx.close();
});

test("asignaciones concurrentes: la versión obsoleta recibe conflicto y no sobrescribe", async ({
  page,
}) => {
  const p = await proyecto();
  const a = await rpc(qa.client, "agregar_actividad", {
    p_proyecto_id: p.id,
    p_tipo_id: tipo("A-05"),
    p_descripcion: "Análisis estático concurrente",
  });
  await login(page);
  const otra = await page.context().newPage();
  for (const x of [page, otra]) {
    await x.goto(`/proyectos/${p.id}/actividades`);
    await x.getByRole("button", { name: "Asignar responsable" }).click();
  }
  await page.getByRole("dialog").getByText("Miembro 1", { exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Asignar", exact: true })
    .click();
  await expect(page.getByText("Responsable asignado: Miembro 1")).toBeVisible();
  await otra.getByRole("dialog").getByText("Miembro 2", { exact: true }).click();
  await otra
    .getByRole("dialog")
    .getByRole("button", { name: "Asignar", exact: true })
    .click();
  await expect(otra.getByRole("dialog")).toContainText(
    "El registro cambió",
  );
  expect((await leer(a.id)).responsable_id).toBe(m1.id);
  await otra
    .getByRole("button", { name: "Recargar información", exact: true })
    .click();
  await otra.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    tarjeta(otra, "Pendiente", "Análisis estático concurrente"),
  ).toContainText("Miembro 1");
  await otra.close();
});

test("tablero pagina por estado y filtra por etapa y responsable en servidor", async ({
  page,
}) => {
  const { admin } = clients();
  const a = checked(
    await admin
      .from("proyecto")
      .select("id")
      .eq("nombre", "Actividades paginadas CU-01")
      .single(),
  );
  await login(page);
  await page.goto(`/proyectos/${a.id}/actividades`);
  const pendiente = columna(page, "Pendiente");
  await expect(pendiente.getByRole("listitem")).toHaveCount(25);
  await pendiente
    .getByRole("button", { name: "Mostrar más (25 de 30)" })
    .click();
  await expect(pendiente.getByRole("listitem")).toHaveCount(30);
  await expect(pendiente.getByRole("button", { name: /^Mostrar más/ })).toHaveCount(0);
  const textos = await pendiente.getByRole("listitem").allInnerTexts();
  expect(new Set(textos).size).toBe(30);

  await page.getByRole("combobox", { name: "Filtrar por etapa" }).click();
  await page.getByRole("option", { name: "Diseño del software" }).click();
  await expect(page).toHaveURL(/etapa=diseno/);
  await expect(pendiente).toContainText("Sin actividades");
  await page.goto(`/proyectos/${a.id}/actividades?etapa=requisitos&responsable=sin`);
  await expect(pendiente.getByRole("listitem")).toHaveCount(25);
  // Filtros desconocidos se ignoran sin revelar datos.
  await page.goto(`/proyectos/${a.id}/actividades?etapa=x&responsable=${randomUUID()}`);
  await expect(pendiente.getByRole("listitem")).toHaveCount(25);
});

test("evidencia PDF se descarga solo por participantes y con cabeceras privadas", async ({
  page,
  browser,
}) => {
  const p = await proyecto();
  await enRevision(p.id, "Revisión con PDF", true);
  await login(page);
  await page.goto(`/proyectos/${p.id}/actividades`);
  await tarjeta(page, "En revisión", "Revisión con PDF").click();
  const enlace = page.getByRole("dialog").getByRole("link", { name: "Descargar" });
  await expect(page.getByRole("dialog")).toContainText("informe-revisión.pdf");
  const href = (await enlace.getAttribute("href"))!;
  expect(href).toMatch(/^\/api\/evidencias\/[0-9a-f-]{36}\/archivo$/);
  const r = await page.request.get(href);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["content-disposition"]).toContain("attachment;");
  expect(r.headers()["content-disposition"]).toContain(
    encodeURIComponent("informe-revisión.pdf"),
  );
  expect((await r.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const ajeno = await contexto(browser, "qa2@qally.example.test");
  expect((await ajeno.page.request.get(href)).status()).toBe(404);
  expect(
    (await ajeno.page.request.get(`/api/evidencias/${randomUUID()}/archivo`)).status(),
  ).toBe(404);
  const guest = await contexto(browser);
  expect((await guest.page.request.get(href)).status()).toBe(401);
  for (const c of [ajeno, guest]) await c.ctx.close();
});
