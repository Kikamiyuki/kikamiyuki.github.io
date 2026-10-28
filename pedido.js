// Panel "Lo quiero": arma una ficha (foto + nombre + precio) y la envía a Instagram como IMAGEN.
// Instagram no permite adjuntar fotos ni escribir el mensaje desde un enlace, así que:
//  - En el celular: abre el menú "Compartir" del teléfono con la ficha → la clienta elige Instagram → Chats → @kikamiyuki.
//  - En computador (o si no se puede compartir): copia la ficha como imagen y abre el chat para pegarla.
// Uso:  KikaPedido.open({ name, price, oldPrice, img, msg, dm, currency })
(function () {
  // Mismo sistema visual que la landing (diseno.css): papel, tinta ciruela, sombras sólidas y mostacillas.
  const css = `
  /* sin transiciones de opacidad: si el navegador las pausa, el panel quedaría invisible */
  .kp-back { position: fixed; inset: 0; background: rgba(36,18,46,.62); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
  .kp-sheet { background: #f4ede3; color: #24122e; width: 100%; max-width: 440px; border-radius: 28px 28px 0 0; padding: 22px 22px 26px;
    font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; max-height: 92vh; overflow: auto; }
  @media (min-width: 640px) { .kp-back { align-items: center; } .kp-sheet { border-radius: 28px; box-shadow: 14px 14px 0 #f7b928; } }
  .kp-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .kp-top b { font-weight: 750; font-stretch: 90%; letter-spacing: -.035em; font-size: 30px; line-height: .95; }
  .kp-top b em { display: block; font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; font-stretch: normal;
    letter-spacing: -.01em; color: #7a3fa0; font-size: 34px; }
  .kp-top b::before { content: ""; display: block; width: 76px; height: 14px; margin-bottom: 12px;
    background: radial-gradient(circle at 50% 50%, rgba(0,0,0,.3) 2px, transparent 2.5px) 0 0 / 20px 14px,
      linear-gradient(90deg, #e5392f 0 14px, transparent 14px 20px, #f7b928 20px 34px, transparent 34px 40px, #1e7be0 40px 54px, transparent 54px 60px, #2e9f4f 60px 74px, transparent 74px);
    border-radius: 4px; }
  .kp-x { flex: none; width: 42px; height: 42px; border-radius: 50%; border: 0; background: #ebe1d3; color: #24122e; font-size: 26px; line-height: 1;
    cursor: pointer; display: grid; place-items: center; }
  .kp-x:hover { background: #dcc2f2; }
  .kp-card { display: block; max-width: 100%; max-height: 50vh; margin: 0 auto; border-radius: 20px; }
  .kp-steps { font-size: 15px; color: #5a4a63; margin: 20px 0 18px; line-height: 1.5; }
  .kp-steps strong { color: #24122e; }
  .kp-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border-radius: 999px; border: 0;
    background: #24122e; color: #f4ede3; font: 700 16px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; cursor: pointer; text-decoration: none;
    box-shadow: 5px 5px 0 #f7b928; transition: background .2s, transform .15s, box-shadow .15s; }
  .kp-btn:hover:not(:disabled) { background: #7a3fa0; }
  .kp-btn:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: 2px 2px 0 #f7b928; }
  .kp-btn:disabled { opacity: .55; cursor: wait; }
  .kp-btn svg { width: 20px; height: 20px; }
  .kp-alt { display: block; text-align: center; margin-top: 16px; font-size: 14px; color: #5a4a63; text-decoration: underline; background: none; border: 0;
    width: 100%; cursor: pointer; font-family: inherit; }
  .kp-alt:hover { color: #7a3fa0; }
  .kp-note { font-size: 14px; font-weight: 600; color: #7a3fa0; text-align: center; margin-top: 12px; min-height: 18px; }
  .kp-x:focus-visible, .kp-btn:focus-visible, .kp-alt:focus-visible { outline: 3px solid #7a3fa0; outline-offset: 3px; }`;

  let styled = false;
  const fmt = (n, cur) => (cur || "$") + n.toLocaleString("es-CL");

  async function makeCard(p) {
    const W = 1080, H = 1262, pad = 48;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const limit = (promise, ms) => Promise.race([promise, new Promise(r => setTimeout(r, ms))]);
    await limit(Promise.all([
      document.fonts.load('750 80px "Bricolage Grotesque"'),
      document.fonts.load('italic 400 84px "Instrument Serif"'),
      document.fonts.load('500 34px "DM Sans"'),
    ]).catch(() => {}), 2500);
    // onload en vez de img.decode(): decode() puede quedarse esperando para siempre en algunos navegadores
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      setTimeout(() => reject(new Error("La foto tardó demasiado")), 10000);
      img.src = p.img;
    });

    const PAPER = "#f4ede3", INK = "#24122e", PLUM = "#7a3fa0", SOFT = "#5a4a63";
    const BEADS = ["#e5392f", "#f7b928", "#1e7be0", "#2e9f4f"];
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
    const bead = (x, y, s, color) => {
      g.fillStyle = color; rr(x, y, s, s, s * .28); g.fill();
      g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + s * .15, y + s * .82, s * .7, s * .1);
      g.fillStyle = "rgba(0,0,0,.32)"; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * .16, 0, Math.PI * 2); g.fill();
    };
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);

    // foto en un marco con sombra sólida amarilla, como en los reels
    const off = 22, size = W - pad * 2 - off;
    g.fillStyle = "#f7b928"; rr(pad + off, pad + off, size, size, 44); g.fill();
    g.save(); rr(pad, pad, size, size, 44); g.clip();
    g.fillStyle = "#fff"; g.fillRect(pad, pad, size, size);
    const k = Math.max(size / img.width, size / img.height), iw = img.width * k, ih = img.height * k;
    g.drawImage(img, pad + (size - iw) / 2, pad + (size - ih) / 2, iw, ih);
    g.restore();
    BEADS.forEach((color, i) => bead(pad + size - 4 * 50 + i * 50 - 18, pad + 26, 40, color));

    // línea 1: «Aros» (o «Anillo») en itálica + nombre · línea 2: precio (y precio anterior tachado)
    const pre = p.tipo === "anillo" ? "Anillo " : "Aros ";
    const y = pad + size + off + 96;
    g.textBaseline = "alphabetic";
    if ("fontStretch" in g) g.fontStretch = "semi-condensed";
    if ("letterSpacing" in g) g.letterSpacing = "-2px";
    let fs = 84;
    const fit = () => {
      g.font = `italic 400 ${fs * 1.05}px "Instrument Serif", Georgia, serif`; const w1 = g.measureText(pre).width;
      g.font = `750 ${fs}px "Bricolage Grotesque", "DM Sans", sans-serif`; return w1 + g.measureText(p.name).width;
    };
    while (fit() > W - pad * 2 && fs > 44) fs -= 4;
    g.font = `italic 400 ${fs * 1.05}px "Instrument Serif", Georgia, serif`; g.fillStyle = PLUM;
    g.fillText(pre, pad, y);
    const nx = pad + g.measureText(pre).width;
    g.font = `750 ${fs}px "Bricolage Grotesque", "DM Sans", sans-serif`; g.fillStyle = INK;
    g.fillText(p.name, nx, y);
    if ("letterSpacing" in g) g.letterSpacing = "0px";

    const py = y + 86;
    if (p.price) {
      g.fillStyle = PLUM;
      g.font = '750 60px "Bricolage Grotesque", "DM Sans", sans-serif';
      const priceTxt = fmt(p.price, p.currency);
      g.fillText(priceTxt, pad, py);
      if (p.oldPrice) {
        const ox = pad + g.measureText(priceTxt).width + 24;
        g.fillStyle = SOFT;
        g.font = '400 38px "DM Sans", sans-serif';
        const old = fmt(p.oldPrice, p.currency);
        g.fillText(old, ox, py);
        g.fillRect(ox, py - 13, g.measureText(old).width, 3);
      }
    }
    if ("fontStretch" in g) g.fontStretch = "normal";
    g.fillStyle = SOFT;
    g.font = '500 32px "DM Sans", sans-serif';
    g.textAlign = "right";
    g.fillText("Kika Miyuki · kikamiyuki.github.io", W - pad, py);
    g.textAlign = "left";

    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    return blob;
  }

  function open(p) {
    if (!styled) {
      const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); styled = true;
    }
    const anillo = p.tipo === "anillo";
    const slug = p.img.split("/").pop().replace(/\.[a-z]+$/i, "");
    const back = document.createElement("div");
    back.className = "kp-back";
    back.innerHTML = `
      <div class="kp-sheet" role="dialog" aria-modal="true" aria-label="Pedir ${anillo ? "el anillo" : "los aros"} ${p.name}">
        <div class="kp-top"><b>Pide ${anillo ? "tu anillo" : "tus aros"} <em>${p.name}</em></b><button class="kp-x" aria-label="Cerrar">×</button></div>
        <img class="kp-card" alt="Ficha ${anillo ? "del anillo" : "de los aros"} ${p.name}" />
        <p class="kp-steps"></p>
        <button class="kp-btn kp-send" disabled>Preparando foto…</button>
        <div class="kp-note" role="status"></div>
        <button class="kp-alt kp-text">Prefiero enviar solo un mensaje de texto</button>
      </div>`;
    document.body.appendChild(back);

    const close = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) close(); });
    back.querySelector(".kp-x").onclick = close;

    const send = back.querySelector(".kp-send");
    const note = back.querySelector(".kp-note");
    const steps = back.querySelector(".kp-steps");
    const igIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>';

    back.querySelector(".kp-text").onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(p.msg).catch(() => {});
      window.open(p.dm, "_blank", "noopener");
      note.textContent = "Copiamos tu mensaje: pégalo en el chat de Instagram 💜";
    };

    makeCard(p).then(blob => {
      back.querySelector(".kp-card").src = URL.createObjectURL(blob);
      const file = new File([blob], `kika-miyuki-${slug}.png`, { type: "image/png" });
      const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] })) && matchMedia("(pointer: coarse)").matches;

      if (canShare) {
        steps.innerHTML = 'Toca el botón, elige <strong>Instagram</strong> → <strong>Chats / Mensajes</strong> y envíala a <strong>@kikamiyuki</strong>. Así sabemos exactamente qué ' + (anillo ? 'anillo' : 'aros') + ' quieres.';
        send.innerHTML = igIcon + "Enviar foto por Instagram";
        send.disabled = false;
        send.onclick = () => {
          navigator.share({ files: [file], text: p.msg })
            .then(() => { note.textContent = "¡Listo! Te responderemos pronto por Instagram 💜"; })
            .catch(err => { if (err && err.name !== "AbortError") note.textContent = "No se pudo compartir. Prueba con el mensaje de texto."; });
        };
      } else {
        steps.innerHTML = 'Toca el botón: copiamos esta foto y abrimos nuestro chat de Instagram. Ahí <strong>pégala</strong> (Ctrl+V o mantener presionado → Pegar) y envíala.';
        send.innerHTML = igIcon + "Copiar foto y abrir chat";
        send.disabled = false;
        send.onclick = () => {
          const ok = () => note.textContent = "Foto copiada: pégala en el chat de Instagram 💜";
          const fail = () => {
            // último recurso: descargar la ficha
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
            note.textContent = "Descargamos la foto: adjúntala en el chat de Instagram 💜";
          };
          if (navigator.clipboard && window.ClipboardItem) {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(ok, fail);
          } else fail();
          window.open(p.dm, "_blank", "noopener");
        };
      }
    }).catch(() => {
      send.textContent = "Enviar mensaje por Instagram";
      send.disabled = false;
      send.onclick = () => back.querySelector(".kp-text").click();
    });
  }

  window.KikaPedido = { open };
})();
