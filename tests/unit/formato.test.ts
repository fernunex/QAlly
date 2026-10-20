import { describe, expect, test } from "vitest";
import { formatDia, formatFecha, formatFechaCorta, formatFechaHora, formatRango, selloFechaHora } from "@/lib/format";

describe("Formato de fechas", () => {
  test("los instantes se muestran en hora de CDMX, también de noche", () => {
    expect(formatFechaHora("2026-10-20T19:31:00.000Z")).toBe("20 oct 2026, 13:31");
    // 19:30 en CDMX ya es el día siguiente en UTC: no debe saltar de día.
    expect(formatFechaHora("2026-10-21T01:30:00.000Z")).toBe("20 oct 2026, 19:30");
    expect(formatFecha("2026-10-21T01:30:00+00:00")).toBe("20 oct 2026");
    expect(formatFechaCorta("2026-10-21T01:30:00.000Z")).toBe("20 oct");
    expect(selloFechaHora("2026-10-21T01:30:00.000Z")).toBe("20261020-1930");
  });

  test("los días de calendario no cambian de zona", () => {
    expect(formatFecha("2026-08-17")).toBe("17 ago 2026");
    expect(formatRango("2026-08-17", "2026-12-04")).toBe("17 ago – 04 dic 2026");
    // Fecha de medición guardada a las 00:00 UTC.
    expect(formatDia("2026-10-10T00:00:00Z")).toBe("10 oct 2026");
    expect(formatDia("2026-01-01T00:00:00+00:00")).toBe("01 ene 2026");
  });
});
