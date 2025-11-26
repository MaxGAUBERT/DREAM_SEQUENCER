import React, { useCallback, useEffect, useRef, useState } from "react";

export default function ZoomBarTW({
  windowRange,           
  setWindowRange,
  minWindowPercent = 2,  
}) {
  const barRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const clampRange = useCallback((r) => {
    const a = Math.min(r[0], r[1]);
    const b = Math.max(r[0], r[1]);
    const width = Math.max(b - a, minWindowPercent);
    let s = a, e = a + width;
    if (e > 100) { e = 100; s = 100 - width; }
    if (s < 0)   { s = 0;   e = width; }
    return [s, e];
  }, [minWindowPercent]);

  const pxToPercent = (dxPx) => {
    const w = barRef.current?.clientWidth || 1;
    return (dxPx / w) * 100;
  };

  const onPointerDown = (e, mode) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ mode, startX: e.clientX, startRange: windowRange });
  };

  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      const dxPercent = pxToPercent(e.clientX - drag.startX);
      const s0 = drag.startRange[0];
      const e0 = drag.startRange[1];

      if (drag.mode === "left")  setWindowRange(clampRange([s0 + dxPercent, e0]));
      if (drag.mode === "right") setWindowRange(clampRange([s0, e0 + dxPercent]));
      if (drag.mode === "track") {
        const width = e0 - s0;
        setWindowRange(clampRange([s0 + dxPercent, s0 + dxPercent + width]));
      }
    };

    const onUp = () => setDrag(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, clampRange, setWindowRange]);

  // Ctrl + molette → zoom autour du curseur
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const cursorPercent = (x / rect.width) * 100;

      const delta = Math.sign(e.deltaY);
      const factor = 1 + 0.15 * Math.abs(delta);
      const s = windowRange[0];
      const eP = windowRange[1];
      const w = eP - s;
      const newW = Math.max(
        minWindowPercent,
        Math.min(100, delta > 0 ? w * factor : w / factor)
      );

      const ratio = (cursorPercent - s) / w;
      let ns = cursorPercent - ratio * newW;
      let ne = ns + newW;

      if (ns < 0) { ns = 0; ne = newW; }
      if (ne > 100) { ne = 100; ns = 100 - newW; }

      setWindowRange([ns, ne]);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [windowRange, minWindowPercent, setWindowRange]);

  const start = windowRange[0];
  const end = windowRange[1];
  const winLeft = `${start}%`;
  const winWidth = `${end - start}%`;

  return (
    <div className="px-0 select-none">
      <div
        ref={barRef}
        className="relative h-7 rounded-md bg-slate-800/80 border border-white/10"
      >
        {/* piste */}
        <div className="absolute inset-1 rounded-sm bg-slate-700/60" />

        {/* fenêtre */}
        <div
          className="absolute top-1 bottom-1 rounded bg-white/20 backdrop-blur-[1px] ring-1 ring-white/20 cursor-grab active:cursor-grabbing"
          style={{ left: winLeft, width: winWidth }}
          onPointerDown={(e) => onPointerDown(e, "track")}
          title="Scroll"
        >
          {/* poignée gauche */}
          <div
            className="absolute inset-y-0 -left-1 w-2 rounded-l ring-1 ring-white/40 bg-white/70 cursor-ew-resize"
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, "left"); }}
            title="Left zoom"
          />
          {/* poignée droite */}
          <div
            className="absolute inset-y-0 -right-1 w-2 rounded-r ring-1 ring-white/40 bg-white/70 cursor-ew-resize"
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, "right"); }}
            title="Right zoom"
          />
          {/* stries décor */}
          <div className="h-full min-h-20 opacity-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[length:8px_100%]" />
        </div>
      </div>
    </div>
  );
}
