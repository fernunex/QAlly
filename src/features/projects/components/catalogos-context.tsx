"use client";
import { createContext, useContext } from "react";
import type { CatalogosProyecto } from "../server/queries";
const Catalogos = createContext<CatalogosProyecto | null>(null);
export function CatalogosProvider({
  catalogos,
  children,
}: {
  catalogos: CatalogosProyecto;
  children: React.ReactNode;
}) {
  return <Catalogos.Provider value={catalogos}>{children}</Catalogos.Provider>;
}
export function useCatalogosProyecto() {
  const value = useContext(Catalogos);
  if (!value) throw new Error("Falta el catálogo autorizado del proyecto");
  return value;
}
