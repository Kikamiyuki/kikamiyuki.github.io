// Lupa de mostacillas: amplía la foto bajo el mouse (o bajo el dedo, manteniéndolo presionado).
// Se activa en toda imagen con el atributo data-lupa. Un toque corto o deslizar no la activan, para no estorbar al scroll.
(function () {
  const ZOOM = 3, SIZE = 190, HOLD_MS = 260;
  const css = `
  .lupa { position: fixed; z-index: 90; width: ${SIZE}px; height: ${SIZE}px; border-radius: 50%; pointer-events: none;
    border: 4px solid #faf8f5; background-color: #faf8f5; background-repeat: no-repeat;
    box-shadow: 0 14px 30px rgba(31,28,27,.3); /* taste-skill-ignore: la lupa flota sobre la página */ opacity: 0; transform: scale(.6); transition: opacity .15s, transform .15s; }
  .lupa.on { opacity: 1; transform: scale(1); }
  [data-lupa] { cursor: zoom-in; -webkit-touch-callout: none; user-select: none; }
  @media (prefers-reduced-motion: reduce) { .lupa { transition: none; } }`;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);

  const lens = document.createElement("div");
  lens.className = "lupa";
  lens.setAttribute("aria-hidden", "true");
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(lens));
  if (document.body) document.body.appendChild(lens);

  let target = null, holdTimer = 0, touchActive = false, startPt = null, suppressClick = false;

  function place(img, clientX, clientY, aboveFinger) {
    const r = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, clientX - r.left)), y = Math.max(0, Math.min(r.height, clientY - r.top));
    // la foto se muestra recortada con object-fit: cover; se replica ese recorte en la lupa
    const nw = img.naturalWidth || r.width, nh = img.naturalHeight || r.height;
    const scale = Math.max(r.width / nw, r.height / nh);
    const dw = nw * scale, dh = nh * scale, ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lens.style.backgroundSize = `${dw * ZOOM}px ${dh * ZOOM}px`;
    lens.style.backgroundPosition = `${-(x - ox) * ZOOM + SIZE / 2 - 4}px ${-(y - oy) * ZOOM + SIZE / 2 - 4}px`;
    const ly = aboveFinger ? clientY - SIZE - 40 : clientY - SIZE / 2;
    lens.style.left = `${clientX - SIZE / 2}px`;
    lens.style.top = `${Math.max(8, ly)}px`;
  }
  const show = () => lens.classList.add("on");
  const hide = () => { lens.classList.remove("on"); target = null; touchActive = false; };

  // Mouse
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const img = e.target.closest && e.target.closest("img[data-lupa]");
    if (!img) { if (target) hide(); return; }
    target = img; place(img, e.clientX, e.clientY, false); show();
  });
  document.addEventListener("pointerleave", hide);
  addEventListener("scroll", () => { if (target && !touchActive) hide(); }, { passive: true });

  // Dedo: mantener presionado
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const img = e.target.closest && e.target.closest("img[data-lupa]");
    if (!img) return;
    startPt = { x: e.clientX, y: e.clientY };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      target = img; touchActive = true; suppressClick = true;
      place(img, startPt.x, startPt.y, true); show();
    }, HOLD_MS);
  });
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") return;
    if (touchActive && target) { place(target, e.clientX, e.clientY, true); return; }
    if (startPt && Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y) > 10) { clearTimeout(holdTimer); startPt = null; }
  });
  const endTouch = (e) => {
    if (e.pointerType === "mouse") return;
    clearTimeout(holdTimer); startPt = null;
    if (touchActive) { hide(); setTimeout(() => { suppressClick = false; }, 400); }
  };
  document.addEventListener("pointerup", endTouch);
  document.addEventListener("pointercancel", endTouch);
  // mientras la lupa está activa, el dedo mueve la lupa y no la página
  document.addEventListener("touchmove", (e) => { if (touchActive) e.preventDefault(); }, { passive: false });
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest("img[data-lupa]")) e.preventDefault(); });
  // después de usar la lupa, soltar el dedo no debe abrir el enlace de la foto
  document.addEventListener("click", (e) => { if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); } }, true);
})();
