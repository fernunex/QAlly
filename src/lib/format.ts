/**
 * Formateadores de presentación. Los instantes se muestran en hora de la Ciudad de México con
 * zona fija (igual en servidor y navegador, sin desfases de hidratación); los días de calendario
 * (AAAA-MM-DD) no se convierten. Meses fijos porque Intl es-MX produce «01-sep» en formatos cortos.
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Zona en la que se presentan los instantes; el rótulo acompaña las horas en reportes y salud. */
export const ZONA_HORARIA = "America/Mexico_City";
export const ROTULO_ZONA = "hora de CDMX";

const enZona = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const pad = (n: number) => String(n).padStart(2, "0");

function partes(valor: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split("-").map(Number) as [number, number, number];
    return { dia: pad(dia), mes: MESES[mes - 1]!, mesNum: mes, anio, hora: "00:00" };
  }
  const p = Object.fromEntries(
    enZona.formatToParts(new Date(valor)).map((x) => [x.type, x.value]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", string>;
  const mes = Number(p.month);
  return { dia: pad(Number(p.day)), mes: MESES[mes - 1]!, mesNum: mes, anio: Number(p.year), hora: `${p.hour}:${p.minute}` };
}

/** Día de calendario guardado como ISO a las 00:00 UTC (fecha de medición): «03 oct 2026», sin convertir de zona. */
export function formatDia(valor: string): string {
  return formatFecha(valor.slice(0, 10));
}

/** «20261003-1042» en hora de CDMX, para nombres de archivo. */
export function selloFechaHora(valor: string): string {
  const p = partes(valor);
  return `${p.anio}${pad(p.mesNum)}${p.dia}-${p.hora.replace(":", "")}`;
}

/** «03 oct 2026». AAAA-MM-DD sin convertir; un instante ISO, en hora de CDMX. */
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
