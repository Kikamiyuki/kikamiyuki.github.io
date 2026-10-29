// Diseño de la landing: cordón de mostacillas y títulos que suben palabra por palabra, como en los reels.
// Se carga antes del script principal de la página, que es el que marca cada .reveal con .in al aparecer.
(function () {
  const COLORS = ["var(--red)", "var(--yel)", "var(--blue)", "var(--green)", "var(--pink)", "var(--plum)", "var(--lilac)"];

  // Cordón: una fila de mostacillas de colores que aparecen una tras otra
  document.querySelectorAll(".cordon").forEach(c => {
    let html = "";
    for (let i = 0; i < 40; i++) html += `<i style="--c:${COLORS[(i * 3) % COLORS.length]}; --d:${i * 22}ms"></i>`;
    c.innerHTML = html;
  });

  // Títulos: cada palabra va en <span class="w"><span>…</span></span> con un pequeño desfase
  document.querySelectorAll(".reveal h1, .reveal h2").forEach(el => {
    el.classList.add("kw");
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.textContent = p;
            s.style.setProperty("--d", (i++ * 70) + "ms");
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
  });
})();
