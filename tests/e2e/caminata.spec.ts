/*
 * Caminata (walkthrough) CU-01 → CU-06 sobre DEC-25–28. La conduce el autor del cambio ante el
 * equipo; cada paso es un test.step para leerlo en el reporte de Playwright. Ejecutar con
 * `npm run e2e:caminata`. Plan: docs/equipo/plan-pruebas-dec25-28.md (sección «Caminata»).
 */
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { checked, rpc } from "../../scripts/lib/local.mjs";
import { actividad, contexto, detalle, EQUIPO, ETAPAS, login, preparar, proyecto, saludEnDashboard, type Contexto } from "./apoyo";

let c: Contexto;
test.beforeAll(async () => {
  c = await preparar();
});

test(
  "CW-01 recorrido completo: alta con 10 preseleccionadas, entregas, medición sin fuente, salud y PDF coherentes",
  detalle("@caminata", "CU-01..CU-06", EQUIPO.emi),
  async ({ page, browser }) => {
    const nombre = `Caminata ${randomUUID()}`;
    let pid = "";

    await test.step("CU-01: alta con las diez actividades preseleccionadas y desmarcables", async () => {
      await login(page);
      await page.goto("/proyectos/nuevo");
      await page.getByLabel("Nombre del proyecto", { exact: true }).fill(nombre);
      await page.getByLabel("Descripción", { exact: true }).fill("Caminata DEC-25–28");
      await page.getByLabel("Fecha de inicio", { exact: true }).fill("2026-10-01");
      await page.getByRole("searchbox", { name: "Buscar miembros" }).fill("Miembro 1");
      await page.getByRole("checkbox", { name: "Miembro 1", exact: true }).check();
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(10);
      // Quedan A-01 (Requerimientos) y A-05/A-06/A-09 (Desarrollo); Diseño sin elementos.
      for (const codigo of ["A-02", "A-03", "A-04", "A-07", "A-08", "A-10"])
        await page.getByRole("checkbox", { name: new RegExp(codigo) }).uncheck();
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      for (const codigo of ["M-01", "M-04"]) await page.getByRole("checkbox", { name: new RegExp(codigo) }).uncheck();
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      await page.getByRole("button", { name: "Registrar proyecto", exact: true }).click();
      await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
      pid = page.url().split("/").at(-1)!;
      await expect(page.getByText("Actividades SQA configuradas (4)", { exact: true })).toBeVisible();
      await expect(page.getByText("Métricas configuradas (2)", { exact: true })).toBeVisible();
    });

    await test.step("CU-03/CU-04: Miembro entrega A-01 y A-05; QA aprueba A-01 (A-05 queda En revisión)", async () => {
      const filas = checked(
        await c.qa.client.from("actividad_sqa").select("id,version:version::text,tipo:tipo_actividad(codigo)").eq("proyecto_id", pid),
      ) as { id: string; version: string; tipo: { codigo: string } }[];
      for (const codigo of ["A-01", "A-05"]) {
        const f = filas.find((x) => x.tipo.codigo === codigo)!;
        // Misma secuencia de RPC que usa la UI de CU-03/CU-04 (cubierta por sus specs personales).
        let a = await rpc(c.qa.client, "asignar_responsable", { p_actividad_id: f.id, p_responsable_id: c.m1.id, p_version_esperada: f.version });
        a = await rpc(c.m1.client, "iniciar_actividad", { p_actividad_id: f.id, p_version_esperada: a.version });
        const e = await rpc(c.m1.client, "preparar_entrega", { p_actividad_id: f.id, p_version_esperada: a.version });
        a = await rpc(c.m1.client, "guardar_resultado", { p_entrega_id: e.id, p_resultado: "Revisión hecha", p_version_esperada: e.version });
        a = await rpc(c.m1.client, "agregar_enlace", { p_entrega_id: e.id, p_url: `https://example.test/${codigo}`, p_version_esperada: a.version });
        a = await rpc(c.m1.client, "enviar_entrega", { p_entrega_id: e.id, p_version_esperada: a.version });
        if (codigo === "A-01")
          await rpc(c.qa.client, "revisar_entrega", { p_entrega_id: e.id, p_decision: "Aprobar", p_version_esperada: a.version });
      }
    });

    await test.step("CU-02: QA registra M-02 y M-03 desde la UI, M-03 sin fuente (DEC-26)", async () => {
      await page.goto(`/proyectos/${pid}/metricas`);
      for (const [codigo, conteos, fuente] of [
        ["M-02", { "PR integrados revisados": "10", "PR integrados": "10" }, "https://example.test/pulls"],
        ["M-03", { "Requisitos probados": "8", "Requisitos definidos": "10" }, ""],
      ] as const) {
        await page.locator("table tbody tr").filter({ hasText: codigo }).getByRole("button", { name: "Registrar medición" }).click();
        const dialogo = page.getByRole("dialog", { name: "Registrar medición" });
        for (const [etiqueta, valor] of Object.entries(conteos)) await dialogo.getByLabel(etiqueta, { exact: true }).fill(valor);
        await dialogo.getByLabel("Fecha de medición").fill("2026-10-10");
        await dialogo.getByLabel(/^Fuente/).fill(fuente);
        await dialogo.getByRole("button", { name: "Guardar medición" }).click();
        await expect(dialogo).toBeHidden();
      }
    });

    // 4 actividades (1 Aprobada) + 2 métricas (aportes 1 y 0.8): 100 × 2.8 / 6 = 46.67 %.
    const esperado = {
      General: "46.67 % · Malo",
      [ETAPAS[0]]: "100.00 % · Excelente",
      [ETAPAS[1]]: "Sin evaluar",
      [ETAPAS[2]]: "36.00 % · Malo",
    };

    await test.step("CU-05: el dashboard muestra la salud general y por etapa calculada", async () => {
      await page.goto(`/proyectos/${pid}/salud`);
      expect(await saludEnDashboard(page, "Salud general")).toBe(esperado.General);
      for (const e of ETAPAS) expect(await saludEnDashboard(page, e)).toBe(esperado[e]);
      // Encabezado del proyecto y listado usan la misma función de salud.
      await expect(page.getByText(`Salud general: ${esperado.General}`)).toBeVisible();
      await page.goto("/proyectos");
      await expect(page.getByRole("row").filter({ hasText: nombre })).toContainText(esperado.General);
    });

    await test.step("CU-05: Miembro participante consulta la misma salud", async () => {
      const miembro = await contexto(browser, "miembro1@qally.example.test");
      await miembro.page.goto(`/proyectos/${pid}/salud`);
      expect(await saludEnDashboard(miembro.page, "Salud general")).toBe(esperado.General);
      await miembro.ctx.close();
    });

    await test.step("CU-06: la vista del reporte coincide con el dashboard y el PDF se descarga", async () => {
      await page.goto(`/proyectos/${pid}/reportes`);
      await page.getByRole("button", { name: "Generar reporte" }).click();
      const doc = page.getByRole("article", { name: "Reporte de calidad" });
      const salud = doc.getByRole("table").first();
      for (const [ambito, texto] of Object.entries(esperado))
        await expect(salud.getByRole("row").filter({ hasText: ambito }).first()).toContainText(texto);
      await expect(doc.getByRole("row").filter({ hasText: "M-03" })).toContainText("0.80 de 1");
      // Evidencias como enlaces del último intento enviado, sin incrustar.
      await expect(doc.getByRole("link", { name: "https://example.test/A-01" })).toBeVisible();
      const [descarga] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Exportar a PDF" }).click(),
      ]);
      const bytes = await readFile((await descarga.path())!);
      expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      expect(bytes.byteLength).toBeLessThan(3 * 1024 * 1024);
    });
  },
);

test(
  "CW-02 aprobar una actividad sube la salud en dashboard y en un reporte regenerado",
  detalle("@caminata", "CU-03..CU-06", EQUIPO.emi),
  async ({ page }) => {
    const { id: pid } = await proyecto(c, {}, "Caminata CW-02");
    for (let i = 0; i < 4; i++) await actividad(c, pid, "A-09", i === 0 ? "Aprobada" : "Pendiente");
    await login(page);
    await page.goto(`/proyectos/${pid}/reportes`);
    await page.getByRole("button", { name: "Generar reporte" }).click();
    const fila = page.getByRole("article", { name: "Reporte de calidad" }).getByRole("table").first().getByRole("row").filter({ hasText: "General" });
    await expect(fila).toContainText("25.00 % · Malo");

    // Se aprueba otra instancia: la vista ya generada es una captura y no cambia sola.
    await actividad(c, pid, "A-09", "Aprobada");
    await expect(fila).toContainText("25.00 % · Malo");
    await page.getByRole("button", { name: "Regenerar reporte" }).click();
    // 2 Aprobadas de 5 instancias.
    await expect(fila).toContainText("40.00 % · Malo");
    await page.goto(`/proyectos/${pid}/salud`);
    expect(await saludEnDashboard(page, "Salud general")).toBe("40.00 % · Malo");
  },
);
