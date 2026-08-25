"use client";

import { useEffect } from "react";

/**
 * O scroll={true} (padrão) do Link considera a página "visível" sempre que
 * <main> intersecta o viewport — o que quase sempre é verdade numa página
 * longa, então o Next não rola pro topo e a loja abre na posição em que a LP
 * estava (ex: perto do rodapé). Forçamos o topo aqui, só na entrada da rota.
 */
export function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return null;
}
