import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { clients, checked, rpc, stableId } from "../../scripts/lib/local.mjs";
import { samplePdf } from "../../scripts/lib/fixtures.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";
const miembro = "miembro2@qally.example.test";
const ajeno = "miembro3@qally.example.test";

async function cliente(email: string) {
  const { anon } = clients();
  checked(await anon.auth.signInWithPassword({ email, password: clave }));
  return anon;
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos$/);
}
/** Proyecto aislado por ejecución con una actividad asignada al miembro. */
async function fixture(descripcion: string) {
  const qa = await cliente("qa1@qally.example.test");
  const tipo = checked(
    await qa.from("tipo_actividad").select("id").eq("codigo", "A-01").single(),
  );
  const p = await rpc(qa, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: `CU-04 ${descripcion}`,
    p_descripcion: "Fixture local de entrega de evidencias",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [stableId(miembro)],
  });
  const a = await rpc(qa, "agregar_actividad", {
    p_proyecto_id: p.id,
    p_tipo_id: tipo.id,
    p_descripcion: descripcion,
  });
  await rpc(qa, "asignar_responsable", {
    p_actividad_id: a.id,
    p_responsable_id: stableId(miembro),
    p_version_esperada: a.version,
  });
  return { qa, proyectoId: p.id as string, actividadId: a.id as string };
}
async function abrir(page: Page, descripcion: string) {
  await page.goto("/mis-actividades");
  await page.getByRole("button", { name: new RegExp(descripcion) }).click();
  await expect(
    page.getByRole("heading", { name: descripcion, exact: true }),
  ).toBeVisible();
}
const entregas = async (qa: Awaited<ReturnType<typeof cliente>>, id: string) =>
  checked(
    await qa
      .from("entrega")
      .select("id,numero_intento,resultado,enviada_en,evidencia(id,tipo,url)")
      .eq("actividad_id", id)
      .order("numero_intento"),
  );

test("CU-04: iniciar, validar, adjuntar PDF y enlace, enviar y corregir tras devolución", async ({
  page,
}) => {
  const descripcion = `Entrega E2E ${randomUUID().slice(0, 8)}`;
  const { qa, actividadId } = await fixture(descripcion);
  await login(page, miembro);
  await abrir(page, descripcion);

  // SF-01
  await page
    .getByRole("button", { name: "Iniciar actividad", exact: true })
    .click();
  await expect(page.getByText("Intento 1 · en preparación")).toBeVisible();

  // FE-02
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByText("Falta el resultado de la actividad.")).toBeVisible();
  await expect(page.getByText(/Falta la evidencia/)).toBeVisible();

  // FE-03: enlace y archivo inválidos no se agregan.
  await page.getByRole("button", { name: "Agregar enlace", exact: true }).click();
  const enlace = page.getByLabel("Enlace de la evidencia", { exact: true });
  await enlace.fill("ftp://example.test/informe");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText(/El enlace no es válido/)).toBeVisible();
  await enlace.fill("https://example.test/informe-e2e");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("https://example.test/informe-e2e")).toBeVisible();
  const archivo = page.getByLabel("Seleccionar archivo PDF", { exact: true });
  await archivo.setInputFiles({
    name: "notas.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("no es pdf"),
  });
  await expect(page.getByText(/no es un PDF válido/)).toBeVisible();
  await archivo.setInputFiles({
    name: "informe-revisión.pdf",
    mimeType: "application/pdf",
    buffer: samplePdf(),
  });
  await expect(page.getByText("informe-revisión.pdf")).toBeVisible();

  await page.getByLabel("Resultado", { exact: true }).fill("Revisión completa, sin hallazgos críticos.");
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();

  // Persistencia tras recargar.
  await page.reload();
  await abrir(page, descripcion);
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();
  const descarga = page.getByRole("dialog").getByRole("link", { name: "Descargar" });
  await expect(descarga).toBeVisible();
  const [intento1] = await entregas(qa, actividadId);
  expect(intento1.enviada_en).not.toBeNull();
  expect(intento1.evidencia).toHaveLength(2);
  const actividad = checked(
    await qa.from("actividad_sqa").select("estado,version").eq("id", actividadId).single(),
  );
  expect(actividad.estado).toBe("En revisión");

  // Lectura privada como adjunto.
  const pdf = intento1.evidencia.find((e: { tipo: string }) => e.tipo === "PDF")!;
  const r = await page.request.get(`/api/evidencias/${pdf.id}/archivo`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["content-disposition"]).toMatch(/^attachment;/);
  expect((await r.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // SF-02: QA devuelve y el miembro corrige en un intento nuevo.
  await rpc(qa, "revisar_entrega", {
    p_entrega_id: intento1.id,
    p_decision: "Devolver",
    p_observaciones: "Adjuntar el checklist firmado.",
    p_version_esperada: String(actividad.version),
  });
  await page.goto("/mis-actividades");
  await expect(page.getByRole("listitem").filter({ hasText: descripcion }).getByText(/Devuelta con observaciones/)).toBeVisible();
  await abrir(page, descripcion);
  await expect(page.getByText("Adjuntar el checklist firmado.").first()).toBeVisible();
  await page.getByRole("button", { name: "Corregir entrega", exact: true }).click();
  await expect(page.getByText("Intento 2 · en preparación")).toBeVisible();
  const resultado = page.getByLabel("Resultado", { exact: true });
  await expect(resultado).toHaveValue("Revisión completa, sin hallazgos críticos.");
  await resultado.fill("Revisión completa con checklist firmado.");
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();
  const intentos = await entregas(qa, actividadId);
  expect(intentos).toHaveLength(2);
  expect(intentos[0].resultado).toBe("Revisión completa, sin hallazgos críticos.");
  expect(intentos[1].resultado).toBe("Revisión completa con checklist firmado.");
  expect(intentos[1].evidencia).toHaveLength(2);
});

test("CU-04: rechaza accesos ajenos, sin origen, sin sesión y proyecto cerrado", async ({
  page,
  browser,
}) => {
  const descripcion = `Seguridad E2E ${randomUUID().slice(0, 8)}`;
  const { qa, proyectoId, actividadId } = await fixture(descripcion);
  const m = await cliente(miembro);
  const a = checked(
    await m.from("actividad_sqa").select("version").eq("id", actividadId).single(),
  );
  const iniciada = await rpc(m, "iniciar_actividad", {
    p_actividad_id: actividadId,
    p_version_esperada: String(a.version),
  });
  const entrega = await rpc(m, "preparar_entrega", {
    p_actividad_id: actividadId,
    p_version_esperada: iniciada.version,
  });

  // Otro miembro sin participación: mismo trato que un recurso inexistente.
  await login(page, ajeno);
  const subida = (origen?: string) =>
    page.request.post(`/api/entregas/${entrega.id}/evidencias/pdf`, {
      headers: {
        "Content-Type": "application/pdf",
        "X-Nombre-Archivo": "x.pdf",
        "X-Version-Actividad": String(entrega.version),
        ...(origen ? { Origin: origen } : {}),
      },
      data: samplePdf(),
    });
  expect((await subida(base)).status()).toBe(404);
  expect((await subida()).status()).toBe(403);
  expect((await subida("https://evil.example")).status()).toBe(403);
  await page.goto("/mis-actividades");
  await expect(page.getByText(descripcion)).toHaveCount(0);

  // Sin sesión.
  const anonimo = await browser.newContext();
  const r = await anonimo.request.post(
    `${base}/api/entregas/${entrega.id}/evidencias/pdf`,
    {
      headers: { "Content-Type": "application/pdf", Origin: base, "X-Nombre-Archivo": "x.pdf", "X-Version-Actividad": "1" },
      data: samplePdf(),
    },
  );
  expect(r.status()).toBe(401);
  await anonimo.close();
  expect(await entregas(qa, actividadId)).toEqual([
    expect.objectContaining({ evidencia: [] }),
  ]);

  // Proyecto cerrado: solo lectura, sin iniciar ni preparar.
  const p = checked(
    await qa.from("proyecto").select("version").eq("id", proyectoId).single(),
  );
  await rpc(qa, "cerrar_proyecto", {
    p_proyecto_id: proyectoId,
    p_version_esperada: String(p.version),
  });
  const propia = await browser.newPage();
  await login(propia, miembro);
  await propia.goto("/mis-actividades");
  await propia.getByRole("button", { name: new RegExp(descripcion) }).click();
  await expect(propia.getByText(/El proyecto está cerrado|solo lectura/i).first()).toBeVisible();
  await expect(propia.getByRole("button", { name: "Enviar a revisión" })).toHaveCount(0);
  await propia.close();
});

test("Integración CU-01/03/04: asignar, entregar, devolver, corregir, aprobar y cerrar desde UI", async ({ page, browser }) => {
  test.setTimeout(120000);
  const qa = await cliente("qa1@qally.example.test");
  const nombre = `Integración ${randomUUID().slice(0, 8)}`;
  const descripcion = `Actividad ${nombre}`;
  const proyecto = await rpc(qa, "crear_proyecto", {
    p_solicitud_id: randomUUID(), p_nombre: nombre,
    p_descripcion: "Recorrido conjunto QA y Miembro", p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [stableId(miembro)],
  });
  await login(page, "qa1@qally.example.test");
  await page.goto(`/proyectos/${proyecto.id}/actividades`);
  await page.getByRole("button", { name: "Agregar actividad", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo de actividad", { exact: true }).click();
  await page.getByRole("option", { name: /^A-01 · / }).click();
  await dialog.getByLabel("Descripción", { exact: true }).fill(descripcion);
  await dialog.getByRole("button", { name: "Agregar actividad", exact: true }).click();
  const tarjeta = (estado: string) => page.getByRole("region", { name: new RegExp(`^${estado}`) })
    .getByRole("listitem").filter({ hasText: descripcion });
  await tarjeta("Pendiente").getByRole("button", { name: "Asignar responsable" }).click();
  await dialog.getByText("Miembro 2", { exact: true }).click();
  await dialog.getByRole("button", { name: "Asignar", exact: true }).click();
  await expect(tarjeta("Pendiente")).toContainText("Miembro 2");
  const actividad = checked(await qa.from("actividad_sqa").select("id").eq("proyecto_id", proyecto.id).single());

  const contexto = await browser.newContext({ baseURL: base });
  try {
    const mp = await contexto.newPage();
    await login(mp, miembro);
    await abrir(mp, descripcion);
    await mp.getByRole("button", { name: "Iniciar actividad", exact: true }).click();
    await expect(mp.getByText("Intento 1 · en preparación")).toBeVisible();
    await mp.getByLabel("Seleccionar archivo PDF", { exact: true }).setInputFiles({
      name: "integracion.pdf", mimeType: "application/pdf", buffer: samplePdf(),
    });
    await expect(mp.getByText("integracion.pdf")).toBeVisible();
    await mp.getByLabel("Resultado", { exact: true }).fill("Resultado original de integración.");
    await mp.getByRole("button", { name: "Enviar a revisión", exact: true }).click();
    await expect(mp.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();
    const [original] = await entregas(qa, actividad.id);
    const pdfId = original.evidencia[0].id;

    await page.reload();
    await tarjeta("En revisión").getByRole("button").first().click();
    await expect(dialog).toContainText("Resultado original de integración.");
    expect((await page.request.get(`/api/evidencias/${pdfId}/archivo`)).status()).toBe(200);
    await dialog.getByLabel(/Observaciones para el responsable/).fill("Completar la conclusión del informe.");
    await dialog.getByRole("button", { name: "Devolver con observaciones" }).click();
    await expect(dialog).toContainText("En progreso");
    await page.keyboard.press("Escape");
    await expect(tarjeta("En progreso")).toContainText("Devuelta con observaciones");

    await mp.reload();
    await abrir(mp, descripcion);
    await expect(mp.getByText("Completar la conclusión del informe.").first()).toBeVisible();
    await mp.getByRole("button", { name: "Corregir entrega", exact: true }).click();
    await expect(mp.getByText("Intento 2 · en preparación")).toBeVisible();
    await expect(mp.getByLabel("Resultado", { exact: true })).toHaveValue("Resultado original de integración.");
    await mp.getByLabel("Resultado", { exact: true }).fill("Resultado corregido con conclusión.");
    await mp.getByRole("button", { name: "Enviar a revisión", exact: true }).click();
    await expect(mp.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();

    await page.reload();
    await tarjeta("En revisión").getByRole("button").first().click();
    await expect(dialog).toContainText("Resultado corregido con conclusión.");
    await dialog.getByRole("button", { name: "Aprobar", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Aprobar", exact: true }).click();
    await expect(page.getByText("Actividad aprobada", { exact: true })).toBeVisible();
    const finales = await entregas(qa, actividad.id);
    expect(finales).toHaveLength(2);
    expect(finales[0]).toEqual(original);
    expect(finales[1].resultado).toBe("Resultado corregido con conclusión.");
    expect(finales[1].evidencia).toHaveLength(1);
    expect(finales[1].evidencia[0].tipo).toBe("PDF");

    await page.goto(`/proyectos/${proyecto.id}`);
    await page.getByRole("button", { name: `Acciones de ${nombre}`, exact: true }).click();
    await page.getByRole("menuitem", { name: /Cerrar proyecto/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /Cerrar proyecto/ }).click();
    await expect(page.getByRole("note")).toContainText("Proyecto cerrado");
    await page.goto(`/proyectos/${proyecto.id}/actividades`);
    await expect(tarjeta("Aprobada")).toBeVisible();
    await expect(page.getByRole("button", { name: "Agregar actividad" })).toHaveCount(0);
    for (const r of [page.request, mp.request]) {
      const descarga = await r.get(`/api/evidencias/${pdfId}/archivo`);
      expect(descarga.status()).toBe(200);
      expect(descarga.headers()["cache-control"]).toContain("no-store");
    }
    await mp.goto("/mis-actividades");
    await abrir(mp, descripcion);
    await expect(mp.getByRole("dialog")).toContainText("Proyecto cerrado");
    await expect(mp.getByRole("button", { name: "Enviar a revisión", exact: true })).toHaveCount(0);
  } finally {
    await contexto.close();
  }
});

test("CU-04: respuesta perdida tras subir PDF conserva una única evidencia al recargar", async ({ page }) => {
  const descripcion = `Respuesta perdida ${randomUUID().slice(0, 8)}`;
  const { qa, actividadId } = await fixture(descripcion);
  await login(page, miembro);
  await abrir(page, descripcion);
  await page.getByRole("button", { name: "Iniciar actividad", exact: true }).click();
  await expect(page.getByText("Intento 1 · en preparación")).toBeVisible();
  await page.route("**/api/entregas/*/evidencias/pdf", async (route) => {
    const confirmada = await route.fetch();
    expect(confirmada.status()).toBe(200);
    await route.abort("failed");
  }, { times: 1 });
  await page.getByLabel("Seleccionar archivo PDF", { exact: true }).setInputFiles({
    name: "respuesta-perdida.pdf", mimeType: "application/pdf", buffer: samplePdf(),
  });
  await expect(page.getByText(/No pudimos confirmar la subida del PDF/).first()).toBeVisible();
  const [intento] = await entregas(qa, actividadId);
  expect(intento.enviada_en).toBeNull();
  expect(intento.evidencia).toHaveLength(1);
  await page.reload();
  await abrir(page, descripcion);
  await expect(page.getByText("respuesta-perdida.pdf")).toBeVisible();
  const [releido] = await entregas(qa, actividadId);
  expect(releido.evidencia).toEqual(intento.evidencia);
});
