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

// Portada: el logo tejido en mostacillas, fila por fila, como en un telar
(function () {
  const canvas = document.querySelector(".telar-logo canvas");
  if (!canvas) return;
  const COLS = 40, ROWS = 44, S = 12;
  const FONDO = ["#33203f", "#2c1a37", "#38244a"], TINTA = "#f4ede3", MIYUKI = "#dcc2f2";
  const FRANJA = ["#e5392f", "#f7b928", "#1e7be0", "#2e9f4f", "#f06ba8"], PUNTOS = ["#e5392f", "#f7b928", "#1e7be0", "#2e9f4f"];

  // Dibuja el texto en grande y mide cuánto cubre cada celda: las celdas cubiertas son mostacillas del color del texto
  function patron(partes, font, filas, desdeFila) {
    const w = COLS * S, h = filas * S;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.font = font; g.textBaseline = "middle"; g.fillStyle = "#000";
    const anchos = partes.map(p => g.measureText(p).width), total = anchos.reduce((a, b) => a + b, 0);
    let x = (w - total) / 2; const centros = [];
    partes.forEach((p, i) => { g.fillText(p, x, h / 2 + S * .4); centros.push(x + anchos[i] / 2); x += anchos[i]; });
    const data = g.getImageData(0, 0, w, h).data, celdas = [];
    for (let r = 0; r < filas; r++) for (let col = 0; col < COLS; col++) {
      let sum = 0;
      for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) sum += data[((r * S + y) * w + col * S + xx) * 4 + 3];
      if (sum / (S * S * 255) > .42) celdas.push([desdeFila + r, col]);
    }
    return { celdas, centros: centros.map(cx => Math.floor(cx / S)) };
  }

  document.fonts.load('700 200px "DM Sans"').then(() => {
    let seed = 5; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const grid = [...Array(ROWS)].map(() => [...Array(COLS)].map(() => FONDO[Math.floor(rnd() * 3)]));
    [3, ROWS - 4].forEach(r => { for (let c = 0; c < COLS; c++) grid[r][c] = FRANJA[(c + r) % 5]; });   // franjas de colores
    const kika = patron(["k", "ı", "ka"], '700 200px "DM Sans"', 17, 9);
    kika.celdas.forEach(([r, c]) => grid[r][c] = TINTA);
    // «miyuki» es chico, así que va dibujado mostacilla por mostacilla, como se diseña en el telar
    const LETRAS = {
      m: [".....", ".....", "####.", "#.#.#", "#.#.#", "#.#.#", "#.#.#", ".....", "....."],
      i: ["#", ".", "#", "#", "#", "#", "#", ".", "."],
      y: ["....", "....", "#..#", "#..#", "#..#", "#..#", ".###", "...#", "###."],
      u: ["....", "....", "#..#", "#..#", "#..#", "#..#", ".###", "....", "...."],
      k: ["#...", "#...", "#..#", "#.#.", "##..", "#.#.", "#..#", "....", "...."]
    };
    const palabra = [..."miyuki"].map(l => LETRAS[l]);
    let col = Math.floor((COLS - palabra.reduce((a, g) => a + g[0].length + 1, -1)) / 2);
    palabra.forEach(g => {
      g.forEach((fila, r) => [...fila].forEach((p, c) => { if (p === "#") grid[29 + r][col + c] = MIYUKI; }));
      col += g[0].length + 1;
    });
    // los cuatro cuadritos de colores van sobre la «ı», como en el logo
    const ic = kika.centros[1], top = Math.min(...kika.celdas.filter(([, c]) => c === ic).map(([r]) => r));
    [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(([dr, dc], k) => { grid[top - 3 + dr][ic + dc] = PUNTOS[k]; });

    const g = canvas.getContext("2d"), cw = canvas.width / COLS, ch = canvas.height / ROWS;
    const bead = (r, c, color) => {
      const x = c * cw, y = r * ch, p = cw * .07;
      g.fillStyle = color; g.beginPath(); g.roundRect(x + p, y + p, cw - 2 * p, ch - 2 * p, cw * .26); g.fill();
      g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x + cw * .22, y + p + 2, cw * .56, ch * .1);
      g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.arc(x + cw / 2, y + ch / 2, cw * .14, 0, Math.PI * 2); g.fill();
    };
    const fila = r => { for (let c = 0; c < COLS; c++) bead(r, c, grid[r][c]); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { for (let r = 0; r < ROWS; r++) fila(r); return; }
    // se teje de arriba hacia abajo cuando aparece en pantalla
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return; obs.disconnect();
      let r = 0; const paso = () => { fila(r++); if (r < ROWS) setTimeout(paso, 55); }; paso();
    }).observe(canvas);
  });
})();
