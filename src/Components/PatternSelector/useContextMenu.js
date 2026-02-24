// components/PatternSelector/useContextMenu.js
// Gère l'état du menu contextuel + fermeture au clic extérieur.
import { useState, useEffect, useCallback } from "react";

const CLOSED = { visible: false, x: 0, y: 0, targetId: null, action: null };

export function useContextMenu() {
  const [menu, setMenu] = useState(CLOSED);

  const openMenu = useCallback((e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, targetId, action: null });
  }, []);

  const closeMenu = useCallback(() => setMenu(CLOSED), []);

  const setAction = useCallback((action) => {
    setMenu((prev) => ({ ...prev, action }));
  }, []);

  // Fermer sur clic extérieur ou Escape
  useEffect(() => {
    if (!menu.visible) return;
    const close = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      closeMenu();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [menu.visible, closeMenu]);

  return { menu, openMenu, closeMenu, setAction };
}