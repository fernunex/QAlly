import { formatValor } from "@/lib/format";
import type { TipoMetrica } from "@/lib/domain";
import type { MetricaProyecto } from "../types";

/*
 * Validación y cálculo de vista previa del catálogo v1 de métricas (ADR-002).
 * Solo sirve para mostrar en vivo; el servidor recalcula y compara con aritmética decimal
 * exacta (multiplicación cruzada), sin usar el porcentaje redondeado de pantalla.
 */

export const MAX_CONTEO = 1_000_000_000;
export const MAX_OBJETIVO_ENTERO = 2_000_000_000;
export const MAX_FUENTE = 2048;

export type DatosTexto = Record<string, string>;
export type Errores = Record<string, string>;

function entero(s: string | undefined): number | null {
  if (s === undefined || !/^\d+$/.test(s.trim())) return null;
  const n = Number(s.trim());
  return n <= MAX_CONTEO ? n : null;
}

/** Errores por campo (clave de datos fuente). Vacío = válido. */
export function validarDatosFuente(codigo: string, campos: TipoMetrica["campos"], datos: DatosTexto): Errores {
  const errores: Errores = {};
  const n: Record<string, number> = {};
  for (const { clave } of campos) {
    const v = datos[clave] ?? "";
    if (v.trim() === "") errores[clave] = "Ingresa un entero entre 0 y 1 000 000 000.";
    else {
      const e = entero(v);
      if (e === null) errores[clave] = "Debe ser un entero entre 0 y 1 000 000 000.";
      else n[clave] = e;
    }
  }
  const ambos = (a: string, b: string) => a in n && b in n;
  const poner = (clave: string, msg: string) => {
    if (!errores[clave]) errores[clave] = msg;
  };
  switch (codigo) {
    case "M-01": {
      if (ambos("aprobadas", "ejecutadas") && n.aprobadas! > n.ejecutadas!)
        poner("aprobadas", "Las aprobadas no pueden ser más que las ejecutadas.");
      if (ambos("criticas_ejecutadas", "ejecutadas") && n.criticas_ejecutadas! > n.ejecutadas!)
        poner("criticas_ejecutadas", "Las críticas ejecutadas no pueden ser más que las ejecutadas.");
      if (ambos("criticas_aprobadas", "criticas_ejecutadas") && n.criticas_aprobadas! > n.criticas_ejecutadas!)
        poner("criticas_aprobadas", "Las críticas aprobadas no pueden ser más que las críticas ejecutadas.");
      if (ambos("criticas_aprobadas", "aprobadas") && n.criticas_aprobadas! > n.aprobadas!)
        poner("criticas_aprobadas", "Las críticas aprobadas no pueden ser más que las aprobadas.");
      if (
        Object.keys(errores).length === 0 &&
        n.aprobadas! - n.criticas_aprobadas! > n.ejecutadas! - n.criticas_ejecutadas!
      )
        poner("aprobadas", "Las aprobadas no críticas no pueden superar las ejecutadas no críticas.");
      break;
    }
    case "M-02":
      if (ambos("integrados_revisados", "integrados") && n.integrados_revisados! > n.integrados!)
        poner("integrados_revisados", "Los revisados no pueden ser más que los integrados.");
      break;
    case "M-03":
      if (ambos("requisitos_probados", "requisitos_definidos") && n.requisitos_probados! > n.requisitos_definidos!)
        poner("requisitos_probados", "Los probados no pueden ser más que los definidos.");
      break;
  }
  return errores;
}

/** Fuente opcional (DEC-26): vacía es válida; si se indica, 1–2048 caracteres. */
export function validarFuente(fuente: string): string | null {
  const t = fuente.trim();
  if (t.length > MAX_FUENTE) return `Máximo ${MAX_FUENTE} caracteres.`;
  return null;
}

export type VistaPrevia = {
  /** null = no evaluable por denominador 0. */
  principal: string | null;
  /** Solo M-01. */
  criticas?: string;
};

const pct = (num: number, den: number) => `${((100 * num) / den).toFixed(2)} %`;

/** Requiere datos ya validados. */
export function calcularVistaPrevia(tipo: TipoMetrica, datos: DatosTexto): VistaPrevia {
  const n = (k: string) => Number(datos[k]);
  switch (tipo.codigo) {
    case "M-01":
      return {
        principal: n("ejecutadas") === 0 ? null : pct(n("aprobadas"), n("ejecutadas")),
        criticas:
          n("criticas_ejecutadas") === 0
            ? "sin críticas ejecutadas"
            : pct(n("criticas_aprobadas"), n("criticas_ejecutadas")),
      };
    case "M-02":
      return { principal: n("integrados") === 0 ? null : pct(n("integrados_revisados"), n("integrados")) };
    case "M-03":
      return {
        principal:
          n("requisitos_definidos") === 0 ? null : pct(n("requisitos_probados"), n("requisitos_definidos")),
      };
    default:
      return { principal: formatValor(String(n("criticos_abiertos") + n("altos_abiertos")), "defectos") };
  }
}

/** Valida un objetivo (porcentaje con ≤4 decimales en (0,100] —DEC-29— o entero para M-04). */
export function validarObjetivo(unidad: TipoMetrica["unidad"], valor: string, permitirCero = false): string | null {
  const t = valor.trim();
  if (t === "") return "Ingresa un objetivo.";
  if (unidad === "%") {
    if (!/^\d+(\.\d{1,4})?$/.test(t)) return "Usa un número con hasta 4 decimales (por ejemplo 90 o 97.5).";
    if (Number(t) > 100) return "El objetivo debe estar entre 0 y 100.";
    if (!permitirCero && Number(t) === 0) return "El objetivo debe ser mayor que 0.";
    return null;
  }
  if (!/^\d+$/.test(t)) return "Debe ser un entero.";
  if (Number(t) > MAX_OBJETIVO_ENTERO) return "El máximo es 2 000 000 000.";
  return null;
}

/** ¿La medición con esta fecha pasa a ser la vigente? (fecha más reciente; empate gana el último registro). */
export function seraVigente(m: Pick<MetricaProyecto, "medidaEn">, medidaEn: string): boolean {
  return !m.medidaEn || medidaEn >= m.medidaEn.slice(0, 10);
}
