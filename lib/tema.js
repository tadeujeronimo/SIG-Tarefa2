import { useSyncExternalStore } from "react";

// O tema fica no atributo data-theme do <html> ("light" ou "dark").
// Um script em app/layout.js o define antes da primeira pintura, para a página não piscar.

function assinar(aviso) {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observador.disconnect();
}

const lerTema = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

// Devolve "light" ou "dark" e atualiza o componente quando o tema muda
export function useTema() {
  return useSyncExternalStore(assinar, lerTema, () => "light");
}

export function definirTema(tema) {
  document.documentElement.dataset.theme = tema;
  try {
    localStorage.setItem("tema", tema);
  } catch {
    // sem localStorage (navegação privada, por exemplo): o tema vale só nesta visita
  }
}
