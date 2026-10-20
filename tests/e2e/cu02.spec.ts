import {
  test,
  expect,
  type Browser,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { checked, provisionUsers, rpc } from "../../scripts/lib/local.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";

type Usuario = Awaited<ReturnType<typeof provisionUsers>>[number];
let qa: Usuario, m1: Usuario;
let tipos: { id: string; codigo: string }[];
test.beforeAll(async () => {
  const users = await provisionUsers();
  [qa, , m1] = users;
  tipos = checked(
    await qa.client.from("tipo_metrica").select("id,codigo").order("codigo"),
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
/** Proyecto aislado por ejecución con Miembro 1 y las métricas indicadas. */
async function proyecto(metricas: { codigo: string; objetivo: string }[] = []) {
  const p = await rpc(qa.client, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: `CU-02 ${randomUUID()}`,
    p_descripcion: "Fixture local de CU-02",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [m1.id],
    p_metricas: metricas.map((m) => ({
      tipoId: tipo(m.codigo),
      objetivo: m.objetivo,
      ...(m.codigo === "M-01" ? { objetivoCritico: "100" } : {}),
    })),
  });
  return p.id as string;
}
async function metricaDe(pid: string, codigo: string) {
  return checked(
    await qa.client
      .from("metrica_proyecto")
      .select("id,objetivo:objetivo::text,configurada_en")
      .eq("proyecto_id", pid)
      .eq("tipo_metrica_id", tipo(codigo))
      .single(),
  ) as { id: string; objetivo: string; configurada_en: string };
}
const mediciones = async (metricaId: string) =>
  checked(
    await qa.client
      .from("medicion")
      .select("id,revisiones:revision_medicion(numero_revision,valor:valor::text)")
      .eq("metrica_proyecto_id", metricaId),
  ) as { id: string; revisiones: { numero_revision: number; valor: string | null }[] }[];

type PeticionAccion = { id: string; body: string; type: string; url: string };
async function capturarAccion(
  page: Page,
  disparar: () => Promise<unknown>,
): Promise<PeticionAccion> {
  const request = page.waitForRequest((r) => !!r.headers()["next-action"]);
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
const fila = (page: Page, codigo: string) =>
  page.locator("table tbody tr").filter({ hasText: codigo });
async function registrar(
  page: Page,
  codigo: string,
  conteos: Record<string, string>,
  fecha: string,
  fuente = "https://example.test/qally/cu02",
) {
  await fila(page, codigo)
    .getByRole("button", { name: "Registrar medición" })
    .click();
  const dialogo = page.getByRole("dialog", { name: "Registrar medición" });
  for (const [etiqueta, valor] of Object.entries(conteos))
    await dialogo.getByLabel(etiqueta, { exact: true }).fill(valor);
  await dialogo.getByLabel("Fecha de medición").fill(fecha);
  await dialogo.getByLabel(/^Fuente/).fill(fuente);
  const accion = await capturarAccion(page, () =>
    dialogo.getByRole("button", { name: "Guardar medición" }).click(),
  );
  await expect(dialogo).toBeHidden();
  return accion;
}

test("agregar métrica del catálogo, validación, duplicado y permisos por rol y proyecto", async ({
  page,
  browser,
}) => {
  const pid = await proyecto();
  await login(page);
  await page.goto(`/proyectos/${pid}/metricas`);
  await expect(page.getByText("Aún no hay métricas")).toBeVisible();

  await page.getByRole("button", { name: "Agregar métrica" }).click();
  const dialogo = page.getByRole("dialog", { name: "Agregar métrica" });
  await dialogo.getByLabel("Tipo de métrica").click();
  await page
    .getByRole("option", { name: "M-02 · Porcentaje de PR revisados" })
    .click();
  await dialogo.getByLabel("Objetivo", { exact: true }).fill("100.5");
  await dialogo.getByRole("button", { name: "Agregar métrica" }).click();
  await expect(dialogo).toContainText("El objetivo debe estar entre 0 y 100.");
  expect(
    checked(
      await qa.client.from("metrica_proyecto").select("id").eq("proyecto_id", pid),
    ),
  ).toHaveLength(0);
  await dialogo.getByLabel("Objetivo", { exact: true }).fill("95");
  const accion = await capturarAccion(page, () =>
    dialogo.getByRole("button", { name: "Agregar métrica" }).click(),
  );
  await expect(dialogo).toBeHidden();
  await expect(fila(page, "M-02")).toContainText("Sin medición");
  await expect(fila(page, "M-02")).toContainText("≥ 95 %");
  expect((await metricaDe(pid, "M-02")).objetivo).toBe("95.00000000");

  // FE-02: el tipo ya configurado no se ofrece y una llamada repetida no duplica.
  await page.getByRole("button", { name: "Agregar métrica" }).click();
  await dialogo.getByLabel("Tipo de métrica").click();
  await expect(page.getByRole("option", { name: /M-02/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  expect(await repetir(page.request, accion)).toContain('"codigo":"CONFLICTO"');
  expect(
    checked(
      await qa.client.from("metrica_proyecto").select("id").eq("proyecto_id", pid),
    ),
  ).toHaveLength(1);

  // Miembro participante: consulta sin controles de gestión; el servidor rechaza escrituras.
  const miembro = await contexto(browser, "miembro1@qally.example.test");
  await miembro.page.goto(`/proyectos/${pid}/metricas`);
  await expect(fila(miembro.page, "M-02")).toContainText("Sin medición");
  await expect(
    miembro.page.getByRole("button", { name: /Agregar métrica|Registrar medición/ }),
  ).toHaveCount(0);
  await fila(miembro.page, "M-02").getByRole("button", { name: /Porcentaje de PR/ }).click();
  const hoja = miembro.page.getByRole("dialog", { name: "Porcentaje de PR revisados" });
  await expect(hoja).toContainText("Aún no se registra ningún valor");
  await expect(hoja.getByRole("button", { name: /Editar objetivo|Registrar/ })).toHaveCount(0);
  expect(await repetir(miembro.page.request, accion)).toContain('"codigo":"PROHIBIDO"');
  await miembro.ctx.close();

  // QA ajeno al proyecto e invitado sin sesión.
  const ajeno = await contexto(browser, "qa2@qally.example.test");
  expect(await repetir(ajeno.page.request, accion)).toContain('"codigo":"NO_DISPONIBLE"');
  await ajeno.page.goto(`/proyectos/${pid}/metricas`);
  await expect(ajeno.page.getByText("Este proyecto no está disponible")).toBeVisible();
  await ajeno.ctx.close();
  const invitado = await contexto(browser);
  expect(await repetir(invitado.page.request, accion)).toContain('"codigo":"SIN_SESION"');
  await invitado.ctx.close();
});

test("registro, vigencia por fecha, objetivo con conflicto y corrección trazable", async ({
  page,
  browser,
}) => {
  const pid = await proyecto([{ codigo: "M-02", objetivo: "100" }]);
  const metrica = await metricaDe(pid, "M-02");
  await login(page);
  await page.goto(`/proyectos/${pid}/metricas`);
  // Segunda pestaña abierta antes del cambio de objetivo: su token queda obsoleto.
  const otra = await contexto(browser, "qa1@qally.example.test");
  await otra.page.goto(`/proyectos/${pid}/metricas`);

  // FE-01: datos incoherentes no se guardan.
  await fila(page, "M-02").getByRole("button", { name: "Registrar medición" }).click();
  const dialogo = page.getByRole("dialog", { name: "Registrar medición" });
  await dialogo.getByLabel("PR integrados revisados", { exact: true }).fill("5");
  await dialogo.getByLabel("PR integrados", { exact: true }).fill("4");
  await dialogo.getByRole("button", { name: "Guardar medición" }).click();
  await expect(dialogo).toContainText("Los revisados no pueden ser más que los integrados.");
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  expect(await mediciones(metrica.id)).toHaveLength(0);

  await registrar(
    page,
    "M-02",
    { "PR integrados revisados": "3", "PR integrados": "4" },
    "2026-10-10",
  );
  await expect(page.getByText("Medición guardada · valor actual 75.00 %")).toBeVisible();
  await expect(fila(page, "M-02")).toContainText("75.00 %");
  await expect(fila(page, "M-02")).toContainText("No cumple");

  // Una medición con fecha anterior se conserva pero no reemplaza el valor actual.
  await registrar(
    page,
    "M-02",
    { "PR integrados revisados": "4", "PR integrados": "4" },
    "2026-10-01",
    "Registro manual del tablero",
  );
  await expect(page.getByText(/el valor actual no cambia \(75\.00 %\)/)).toBeVisible();
  await expect(fila(page, "M-02")).toContainText("75.00 %");

  await fila(page, "M-02").getByRole("button", { name: /Porcentaje de PR/ }).click();
  const hoja = page.getByRole("dialog", { name: "Porcentaje de PR revisados" });
  const items = hoja.getByRole("list", { name: "Mediciones registradas" }).getByRole("listitem");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("10 oct 2026");
  await expect(items.first()).toContainText("Actual");
  await expect(items.nth(1)).toContainText("01 oct 2026");
  await expect(items.nth(1)).toContainText("Registro manual del tablero");

  // SF-03: objetivo reevalúa el cumplimiento sin tocar mediciones.
  await hoja.getByRole("button", { name: "Editar objetivo" }).click();
  await hoja.getByLabel("Objetivo", { exact: true }).fill("70");
  await hoja.getByRole("button", { name: "Guardar objetivo" }).click();
  await expect(hoja).toContainText("≥ 70 %");
  await expect(hoja).toContainText("Cumple");
  await expect(fila(page, "M-02")).toContainText("Cumple");
  expect((await metricaDe(pid, "M-02")).objetivo).toBe("70.00000000");

  // La pestaña con la configuración anterior recibe CONFLICTO y no sobrescribe.
  await fila(otra.page, "M-02").getByRole("button", { name: /Porcentaje de PR/ }).click();
  const hojaOtra = otra.page.getByRole("dialog", { name: "Porcentaje de PR revisados" });
  await hojaOtra.getByRole("button", { name: "Editar objetivo" }).click();
  await hojaOtra.getByLabel("Objetivo", { exact: true }).fill("90");
  await hojaOtra.getByRole("button", { name: "Guardar objetivo" }).click();
  await expect(hojaOtra.getByRole("alert")).toContainText("El registro cambió");
  expect((await metricaDe(pid, "M-02")).objetivo).toBe("70.00000000");
  await otra.ctx.close();

  // SF-04: corregir la antigua no cambia el valor actual.
  await hoja.getByRole("button", { name: "Corregir medición del 01 oct 2026" }).click();
  const correccion = page.getByRole("dialog", { name: "Corregir medición del 01 oct 2026" });
  await expect(correccion.getByLabel("PR integrados revisados", { exact: true })).toHaveValue("4");
  await correccion.getByLabel("PR integrados revisados", { exact: true }).fill("2");
  await correccion.getByRole("button", { name: "Guardar corrección" }).click();
  await expect(page.getByText(/Corrección guardada · el valor actual no cambia \(75\.00 %\)/)).toBeVisible();
  await expect(items.nth(1)).toContainText("Corregida");
  await expect(items.first()).toContainText("75.00 %");

  // Corregir la vigente recalcula valor y cumplimiento; el original se conserva.
  await hoja.getByRole("button", { name: "Corregir medición del 10 oct 2026" }).click();
  const vigente = page.getByRole("dialog", { name: "Corregir medición del 10 oct 2026" });
  await vigente.getByLabel("PR integrados revisados", { exact: true }).fill("2");
  const corregirAccion = await capturarAccion(page, () =>
    vigente.getByRole("button", { name: "Guardar corrección" }).click(),
  );
  await expect(page.getByText("Corrección guardada · valor actual 50.00 %")).toBeVisible();
  await expect(fila(page, "M-02")).toContainText("50.00 %");
  await expect(fila(page, "M-02")).toContainText("No cumple");
  await items.first().getByRole("button", { name: "Ver correcciones" }).click();
  await expect(items.first()).toContainText("Corrección 1");
  await expect(items.first()).toContainText("Valor original 75.00 % · anterior 75.00 % · nuevo 50.00 %");
  await expect(items.first()).toContainText("QA de desarrollo A");

  // Una corrección repetida con la revisión ya superada no crea otra revisión.
  expect(await repetir(page.request, corregirAccion)).toContain('"codigo":"CONFLICTO"');
  const guardadas = await mediciones(metrica.id);
  expect(guardadas).toHaveLength(2);
  for (const m of guardadas) {
    expect(m.revisiones).toHaveLength(2);
    expect(m.revisiones.find((r) => r.numero_revision === 1)!.valor).toMatch(/^(75|100)\.0+$/);
  }
});

test("reintento idempotente, denominador cero y proyecto cerrado en solo lectura", async ({
  page,
}) => {
  const pid = await proyecto([{ codigo: "M-03", objetivo: "100" }]);
  const metrica = await metricaDe(pid, "M-03");
  await login(page);
  await page.goto(`/proyectos/${pid}/metricas`);
  const accion = await registrar(
    page,
    "M-03",
    { "Requisitos probados": "0", "Requisitos definidos": "0" },
    "2026-10-05",
  );
  await expect(fila(page, "M-03")).toContainText("No disponible");
  await expect(fila(page, "M-03")).toContainText("No evaluable");

  // Respuesta perdida: reenviar la misma identidad y datos devuelve la medición guardada.
  const repetida = await repetir(page.request, accion);
  expect(repetida).toContain('"ok":true');
  expect(repetida).toContain('"reutilizada":true');
  // Misma identidad con otros datos: CONFLICTO, sin sobrescribir.
  expect(
    await repetir(page.request, {
      ...accion,
      body: accion.body.replace("https://example.test/qally/cu02", "otra fuente"),
    }),
  ).toContain('"codigo":"CONFLICTO"');
  expect(await mediciones(metrica.id)).toHaveLength(1);

  const { version } = checked(
    await qa.client.from("proyecto").select("version:version::text").eq("id", pid).single(),
  ) as { version: string };
  await rpc(qa.client, "cerrar_proyecto", {
    p_proyecto_id: pid,
    p_version_esperada: version,
  });
  await page.reload();
  await expect(page.getByRole("note")).toContainText("Proyecto cerrado");
  await expect(fila(page, "M-03")).toContainText("No evaluable");
  await expect(
    page.getByRole("button", { name: /Agregar métrica|Registrar medición/ }),
  ).toHaveCount(0);
  await fila(page, "M-03").getByRole("button", { name: /Cobertura de requisitos/ }).click();
  const hoja = page.getByRole("dialog", { name: "Cobertura de requisitos probados" });
  await expect(hoja.getByRole("list", { name: "Mediciones registradas" })).toContainText("05 oct 2026");
  await expect(hoja.getByRole("button", { name: /Editar objetivo|Corregir/ })).toHaveCount(0);
  expect(
    await repetir(page.request, {
      ...accion,
      body: accion.body.replace(/"medicionId":"[^"]+"/, `"medicionId":"${randomUUID()}"`),
    }),
  ).toContain('"codigo":"PROYECTO_CERRADO"');
  expect(await mediciones(metrica.id)).toHaveLength(1);
});

test("historial de mediciones paginado en orden de vigencia", async ({ page }) => {
  const pid = await proyecto([{ codigo: "M-04", objetivo: "0" }]);
  const metrica = await metricaDe(pid, "M-04");
  for (let i = 1; i <= 27; i++)
    await rpc(qa.client, "registrar_medicion", {
      p_medicion_id: randomUUID(),
      p_metrica_proyecto_id: metrica.id,
      p_medida_en: `2026-09-${String(i).padStart(2, "0")}T00:00:00Z`,
      p_datos_fuente: {
        criticos_abiertos: 0,
        altos_abiertos: i,
        fuente_referencia: `Corte ${i}`,
      },
    });
  await login(page);
  await page.goto(`/proyectos/${pid}/metricas`);
  await expect(fila(page, "M-04")).toContainText("27 defectos");
  await fila(page, "M-04").getByRole("button", { name: /Defectos de alta/ }).click();
  const hoja = page.getByRole("dialog", { name: "Defectos de alta severidad abiertos" });
  const items = hoja.getByRole("list", { name: "Mediciones registradas" }).getByRole("listitem");
  await expect(items).toHaveCount(25);
  await expect(items.first()).toContainText("27 sep 2026");
  await expect(items.first()).toContainText("Actual");
  await hoja.getByRole("button", { name: "Ver mediciones anteriores" }).click();
  await expect(items).toHaveCount(27);
  await expect(items.last()).toContainText("01 sep 2026");
  await expect(items.last()).toContainText("Corte 1");
  await expect(hoja.getByRole("button", { name: "Ver mediciones anteriores" })).toHaveCount(0);
});
