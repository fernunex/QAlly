import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { clients, checked } from "../../scripts/lib/local.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";
async function login(page: Page, email = "qa1@qally.example.test") {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos$/);
  await expect(
    page.getByRole("heading", { name: "Proyectos", exact: true }),
  ).toBeVisible();
}
async function prepararAlta(page: Page, nombre: string, miembro = true) {
  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre del proyecto", { exact: true }).fill(nombre);
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Alcance persistente de CU-01");
  await page.getByLabel("Fecha de inicio", { exact: true }).fill("2026-10-01");
  if (miembro) {
    await page
      .getByRole("searchbox", { name: "Buscar miembros" })
      .fill("Miembro 1");
    await page
      .getByRole("checkbox", { name: "Miembro 1", exact: true })
      .check();
  }
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(5);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}
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
async function alta(page: Page, nombre: string) {
  await prepararAlta(page, nombre);
  const accion = await capturarAccion(page, () =>
    page
      .getByRole("button", { name: "Registrar proyecto", exact: true })
      .click(),
  );
  await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { name: nombre, exact: true }),
  ).toBeVisible();
  return { id: page.url().split("/").at(-1)!, accion };
}
async function editar(page: Page, nombre: string) {
  await page.getByRole("button", { name: /^Acciones de / }).click();
  await page
    .getByRole("menuitem", { name: "Editar información general" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre del proyecto", { exact: true })
    .fill(nombre);
}

test("sesión real, contraseña inválida, cookie demo ignorada y logout", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "qally_demo_usuario", value: "u-david", url: base },
  ]);
  await page.goto("/proyectos", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByLabel("Correo", { exact: true })
    .fill("qa1@qally.example.test");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("UnaClaveIncorrecta");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Correo o contraseña incorrectos",
  );
  await login(page);
  const authCookies = (await context.cookies()).filter((c) =>
    c.name.startsWith("sb-"),
  );
  expect(authCookies.length).toBeGreaterThan(0);
  expect(authCookies.every((c) => c.httpOnly)).toBe(true);
  await page.getByRole("button", { name: /QA de desarrollo A/ }).click();
  await expect(page.getByRole("menuitem", { name: /Ver como/ })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
  await page.goto("/proyectos", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/login$/);
});

test("alta, configuración seleccionada, consulta persistente, edición y cierre", async ({
  page,
  browser,
}) => {
  await login(page);
  const nombre = `Proyecto completo ${randomUUID()}`;
  const { id, accion } = await alta(page, nombre);
  await expect(
    page.getByText("Actividades SQA configuradas (5)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Métricas configuradas (4)", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sin asignar", { exact: true })).toHaveCount(5);
  await page.reload();
  await expect(
    page.getByText("Alcance persistente de CU-01", { exact: true }),
  ).toBeVisible();
  const { admin } = clients();
  const rows = checked(
    await admin
      .from("actividad_sqa")
      .select("estado,tipo:tipo_actividad(etapa_codigo)")
      .eq("proyecto_id", id),
  );
  expect(rows).toHaveLength(5);
  expect(rows.every((a: { estado: string }) => a.estado === "Pendiente")).toBe(
    true,
  );
  const [payload] = JSON.parse(accion.body);
  const invalida = (input: unknown) =>
    repetir(page.request, { ...accion, body: JSON.stringify([input]) });
  expect(await invalida({ ...payload, creadoPor: randomUUID() })).toContain(
    '"codigo":"DATOS_INVALIDOS"',
  );
  expect(
    await invalida({
      ...payload,
      metricas: payload.metricas.map((m: { objetivo: string }, i: number) =>
        i === 0 ? { ...m, objetivo: "101" } : m,
      ),
    }),
  ).toContain('"codigo":"DATOS_INVALIDOS"');
  const repetida = await repetir(page.request, accion);
  expect(repetida).toContain('"ok":true');
  expect(
    checked(await admin.from("proyecto").select("id").eq("nombre", nombre)),
  ).toHaveLength(1);
  await editar(page, nombre + " editado");
  const editAction = await capturarAccion(page, () =>
    page.getByRole("button", { name: "Guardar cambios", exact: true }).click(),
  );
  await expect(
    page.getByRole("heading", { name: nombre + " editado", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Acciones de / }).click();
  await page.getByRole("menuitem", { name: "Cerrar proyecto…" }).click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(
    checked(
      await admin.from("proyecto").select("cerrado_en").eq("id", id).single(),
    ).cerrado_en,
  ).toBeNull();
  await page.getByRole("button", { name: /^Acciones de / }).click();
  await page.getByRole("menuitem", { name: "Cerrar proyecto…" }).click();
  const closeAction = await capturarAccion(page, () =>
    page.getByRole("button", { name: "Cerrar proyecto", exact: true }).click(),
  );
  await expect(page.getByRole("note")).toContainText("Proyecto cerrado");
  await page.reload();
  await expect(page.getByRole("button", { name: /^Acciones de / })).toHaveCount(
    0,
  );
  const memberContext = await browser.newContext({ baseURL: base });
  const member = await memberContext.newPage();
  await login(member, "miembro1@qally.example.test");
  await member.goto(`/proyectos/${id}`);
  await expect(
    member.getByRole("heading", { name: nombre + " editado", exact: true }),
  ).toBeVisible();
  await expect(
    member.getByRole("button", { name: /^Acciones de / }),
  ).toHaveCount(0);
  expect(await repetir(member.request, accion)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  expect(await repetir(member.request, editAction)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  expect(await repetir(member.request, closeAction)).toContain(
    '"codigo":"PROHIBIDO"',
  );
  const ajenoContext = await browser.newContext({ baseURL: base });
  const ajeno = await ajenoContext.newPage();
  await login(ajeno, "qa2@qally.example.test");
  expect(await repetir(ajeno.request, editAction)).toContain(
    '"codigo":"NO_DISPONIBLE"',
  );
  await ajenoContext.close();
  const guest = await browser.newContext({ baseURL: base });
  expect(await repetir(guest.request, accion)).toContain(
    '"codigo":"SIN_SESION"',
  );
  await guest.close();
  await memberContext.close();
});

test("versiones obsoletas no sobrescriben y cierre impide posteriores ediciones", async ({
  page,
  context,
}) => {
  await login(page);
  const nombre = `Concurrencia ${randomUUID()}`;
  const { id } = await alta(page, nombre);
  const otra = await context.newPage();
  await otra.goto(`/proyectos/${id}`);
  await editar(page, nombre + " ganador");
  await editar(otra, nombre + " obsoleto");
  const edit = await capturarAccion(page, () =>
    page.getByRole("button", { name: "Guardar cambios", exact: true }).click(),
  );
  await expect(
    page.getByRole("heading", { name: nombre + " ganador", exact: true }),
  ).toBeVisible();
  await otra
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(otra.getByRole("dialog").getByRole("alert")).toContainText(
    "El registro cambió",
  );
  await otra.getByRole("button", { name: "Recargar información" }).click();
  await expect(
    otra.getByRole("dialog").getByLabel("Nombre del proyecto", { exact: true }),
  ).toHaveValue(nombre + " ganador");
  await otra.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    otra.getByRole("heading", { name: nombre + " ganador", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Acciones de / }).click();
  await page.getByRole("menuitem", { name: "Cerrar proyecto…" }).click();
  await page
    .getByRole("button", { name: "Cerrar proyecto", exact: true })
    .click();
  await expect(page.getByRole("note")).toBeVisible();
  expect(await repetir(page.request, edit)).toContain(
    '"codigo":"PROYECTO_CERRADO"',
  );
});

test("proyectos ajenos/inexistentes son indistinguibles y Miembro no registra", async ({
  page,
}) => {
  await login(page, "miembro1@qally.example.test");
  await page.goto("/proyectos/nuevo");
  await expect(
    page.getByText("Operación no permitida", { exact: true }),
  ).toBeVisible();
  const { admin } = clients();
  const b = checked(
    await admin
      .from("proyecto")
      .select("id")
      .eq("nombre", "QAlly demo B")
      .single(),
  );
  for (const id of [b.id, randomUUID(), "id-invalido"]) {
    await page.goto(`/proyectos/${id}`);
    await expect(
      page.getByText("Este proyecto no está disponible", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "QAlly demo B", exact: true }),
    ).toHaveCount(0);
  }
});

test("validación de formulario, selecciones editables y búsqueda paginada de miembros", async ({
  page,
}) => {
  await login(page);
  await page.goto("/proyectos/nuevo");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByLabel("Nombre del proyecto", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page
    .getByLabel("Nombre del proyecto", { exact: true })
    .fill(`Selección ${randomUUID()}`);
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Solo las selecciones confirmadas");
  await page.getByLabel("Fecha de inicio", { exact: true }).fill("2026-10-10");
  await page.getByLabel("Fin previsto", { exact: false }).fill("2026-10-01");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByLabel("Fin previsto", { exact: false }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Fin previsto", { exact: false }).fill("2026-10-20");
  await expect(
    page.getByRole("button", { name: "Cargar más miembros" }),
  ).toBeVisible();
  const antes = await page.getByRole("checkbox").count();
  await page.getByRole("button", { name: "Cargar más miembros" }).click();
  await expect
    .poll(() => page.getByRole("checkbox").count())
    .toBeGreaterThan(antes);
  await page
    .getByRole("searchbox", { name: "Buscar miembros" })
    .fill("Persona de prueba 25");
  await page
    .getByRole("checkbox", { name: "Persona de prueba 25", exact: true })
    .check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("checkbox", { name: /A-01/ }).uncheck();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("checkbox", { name: /M-04/ }).uncheck();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar proyecto", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
  await expect(
    page.getByText("Actividades SQA configuradas (4)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Métricas configuradas (3)", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Persona de prueba 25", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});

test("respuesta perdida en alta se recupera sin duplicar", async ({ page }) => {
  await login(page);
  const nombre = `Reintento ${randomUUID()}`;
  await prepararAlta(page, nombre, false);
  let perdido = false;
  await page.route("**/proyectos/nuevo", async (route) => {
    if (!perdido && route.request().headers()["next-action"]) {
      perdido = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Registrar proyecto", exact: true })
    .click();
  await expect(page.locator('[data-slot="alert"]')).toBeVisible();
  await expect(page.getByText(/La respuesta es incierta/)).toBeVisible();
  await page
    .getByRole("button", { name: "Reintentar registro", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
  const { admin } = clients();
  expect(
    checked(await admin.from("proyecto").select("id").eq("nombre", nombre)),
  ).toHaveLength(1);
});

test("paginación de proyectos y actividades conserva alcance y recupera todas las filas", async ({
  page,
}) => {
  await login(page);
  const primero = await page.locator("table tbody tr").first().innerText();
  await page
    .getByRole("link", { name: "Siguiente página", exact: true })
    .click();
  await expect(page).toHaveURL(/cursor=/);
  expect(await page.locator("table tbody tr").first().innerText()).not.toBe(
    primero,
  );
  const { admin } = clients();
  const a = checked(
    await admin
      .from("proyecto")
      .select("id")
      .eq("nombre", "Actividades paginadas CU-01")
      .single(),
  );
  // La tabla paginada de CU-01 está en el resumen; la pestaña Actividades es el tablero de CU-03.
  await page.goto(`/proyectos/${a.id}`);
  const first = await page.locator("table tbody tr").first().innerText();
  await expect(page.locator("table tbody tr")).toHaveCount(25);
  await page.getByRole("link", { name: "Siguientes actividades" }).click();
  await expect(page).toHaveURL(/cursor=/);
  await expect(page.locator("table tbody tr")).toHaveCount(5);
  expect(await page.locator("table tbody tr").first().innerText()).not.toBe(
    first,
  );
});

test("renueva sesión SSR y mantiene la sesión de QA aislada de Miembro", async ({
  page,
  context,
  browser,
}) => {
  await login(page);
  const cookies = (await context.cookies())
    .filter((c) => c.name.startsWith("sb-"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const raw = cookies.map((c) => c.value).join("");
  expect(raw.startsWith("base64-")).toBe(true);
  const sesion = JSON.parse(Buffer.from(raw.slice(7), "base64url").toString());
  sesion.expires_at = 1;
  const value =
    "base64-" + Buffer.from(JSON.stringify(sesion)).toString("base64url");
  await context.clearCookies();
  const name = cookies[0].name.replace(/\.\d+$/, "");
  const chunks = value.match(/.{1,3180}/g)!;
  await context.addCookies(
    chunks.map((v, i) => ({
      ...cookies[0],
      name: chunks.length === 1 ? name : `${name}.${i}`,
      value: v,
    })),
  );
  await page.goto("/proyectos");
  await expect(
    page.getByRole("heading", { name: "Proyectos", exact: true }),
  ).toBeVisible();
  const renovadas = (await context.cookies())
    .filter((c) => c.name.startsWith("sb-"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const actual = JSON.parse(
    Buffer.from(
      renovadas
        .map((c) => c.value)
        .join("")
        .slice(7),
      "base64url",
    ).toString(),
  );
  expect(actual.expires_at).toBeGreaterThan(Date.now() / 1000);
  const miembroContext = await browser.newContext({ baseURL: base });
  const miembro = await miembroContext.newPage();
  await login(miembro, "miembro1@qally.example.test");
  await expect(
    miembro.getByRole("link", { name: "Nuevo proyecto", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Nuevo proyecto", exact: true }).first(),
  ).toBeVisible();
  await miembroContext.close();
});

test("una sesión que ya no puede renovarse vuelve al login", async ({
  page,
  context,
}) => {
  await login(page);
  const cookies = (await context.cookies())
    .filter((c) => c.name.startsWith("sb-"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const original = cookies.map((c) => c.value).join("");
  const sesion = JSON.parse(
    Buffer.from(original.slice(7), "base64url").toString(),
  );
  sesion.expires_at = 1;
  sesion.refresh_token = "refresh-invalido-de-prueba";
  const value =
    "base64-" + Buffer.from(JSON.stringify(sesion)).toString("base64url");
  const name = cookies[0].name.replace(/\.\d+$/, "");
  const chunks = value.match(/.{1,3180}/g)!;
  await context.clearCookies();
  await context.addCookies(
    chunks.map((v, i) => ({
      ...cookies[0],
      name: chunks.length === 1 ? name : `${name}.${i}`,
      value: v,
    })),
  );
  await page.goto("/proyectos", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
});
