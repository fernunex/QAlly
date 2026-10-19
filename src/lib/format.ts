/**
 * Formateadores de presentación. Usan UTC para evitar desfases entre servidor y navegador,
 * y meses fijos porque Intl es-MX produce «01-sep» en formatos cortos.
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function partes(valor: string) {
  const d = new Date(valor);
  return {
    dia: String(d.getUTCDate()).padStart(2, "0"),
    mes: MESES[d.getUTCMonth()]!,
    anio: d.getUTCFullYear(),
    hora: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
  };
}

/** «03 oct 2026». Acepta AAAA-MM-DD o ISO. */
export function formatFecha(valor: string): string {
  const p = partes(valor);
  return `${p.dia} ${p.mes} ${p.anio}`;
}

/** «03 oct». */
export function formatFechaCorta(valor: string): string {
  const p = partes(valor);
  return `${p.dia} ${p.mes}`;
}

/** «03 oct 2026, 10:42». */
export function formatFechaHora(valor: string): string {
  const p = partes(valor);
  return `${p.dia} ${p.mes} ${p.anio}, ${p.hora}`;
}

/** «01 sep – 12 dic 2026» o «12 ene 2026 – sin fin previsto». */
export function formatRango(inicio: string, fin: string | null): string {
  if (!fin) return `${formatFecha(inicio)} – sin fin previsto`;
  const mismoAnio = inicio.slice(0, 4) === fin.slice(0, 4);
  return `${mismoAnio ? formatFechaCorta(inicio) : formatFecha(inicio)} – ${formatFecha(fin)}`;
}

/** Decimal en cadena → «72.22 %». Nunca convierte nulo en 0. */
export function formatValor(valor: string | null, unidad: "%" | "defectos"): string {
  if (valor === null) return "Sin medición";
  if (unidad === "%") return `${Number(valor).toFixed(2)} %`;
  return `${Number(valor)} ${Number(valor) === 1 ? "defecto" : "defectos"}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/** «David S.» → «DS»; «Emi» → «EM». */
export function iniciales(nombre: string): string {
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return partes
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
