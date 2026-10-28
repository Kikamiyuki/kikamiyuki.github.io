// Probador virtual: muestra los aros en las orejas de la clienta usando la cámara (o una foto).
// El seguimiento facial (MediaPipe Face Landmarker) corre dentro del navegador: la imagen no sale del dispositivo.
// Uso:  KikaProbador.open("perla-dorada")   — lista de aros en window.KIKA_TRYON = [{ slug, name, price, img, h, centro, onOrder }]
(function () {
  const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  // Puntos del rostro (malla de 468 puntos de MediaPipe)
  const P = { earL: 234, earR: 454, jawL: 132, jawR: 361, nose: 1, top: 10, chin: 152, eyeL: 33, eyeR: 263 };

  // Mismo sistema visual que la landing (diseno.css). El cuadro de la cámara queda oscuro para que la cara se vea bien.
  const css = `
  .tr-back { position: fixed; inset: 0; z-index: 120; background: rgba(36,18,46,.72); display: flex; justify-content: center; align-items: center; }
  .tr { width: 100%; height: 100%; max-width: 480px; max-height: 900px; background: #f4ede3; color: #24122e; display: flex; flex-direction: column;
    font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; overflow: hidden; }
  @media (min-width: 640px) { .tr { height: 92vh; border-radius: 28px; box-shadow: 14px 14px 0 #f7b928; } }
  .tr-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px 12px 20px; }
  .tr-top b { display: flex; align-items: center; gap: 12px; font-weight: 750; font-stretch: 90%; letter-spacing: -.035em; font-size: 28px; line-height: 1; }
  .tr-top b em { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; font-stretch: normal; letter-spacing: -.01em; color: #7a3fa0; font-size: 30px; }
  .tr-dots { display: inline-grid; grid-template-columns: repeat(2, 9px); gap: 2px; }
  .tr-dots i { width: 9px; height: 9px; border-radius: 3px; box-shadow: inset 0 -2px 0 rgba(0,0,0,.2); }
  .tr-dots i:nth-child(1) { background: #e5392f; } .tr-dots i:nth-child(2) { background: #f7b928; }
  .tr-dots i:nth-child(3) { background: #1e7be0; } .tr-dots i:nth-child(4) { background: #2e9f4f; }
  .tr-x { flex: none; width: 42px; height: 42px; border-radius: 50%; border: 0; background: #ebe1d3; color: #24122e; font-size: 26px; line-height: 1;
    cursor: pointer; display: grid; place-items: center; }
  .tr-x:hover { background: #dcc2f2; }
  .tr-stage { position: relative; flex: 1; min-height: 0; margin: 0 14px; border-radius: 24px; background: #24122e; overflow: hidden; }
  .tr-stage video, .tr-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .tr-stage .mirror { transform: scaleX(-1); }
  .tr-stage .tr-still { object-fit: contain; }
  .tr-status { position: absolute; left: 14px; right: 14px; bottom: 14px; margin: 0; text-align: center; font-size: 15px; font-weight: 600;
    background: #f4ede3; color: #24122e; padding: 11px 14px; border-radius: 16px; box-shadow: 5px 5px 0 #f7b928; }
  .tr-status:empty { display: none; }
  .tr-bar { padding: 14px 16px 18px; }
  .tr-name { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 0 4px; }
  .tr-name b { font-weight: 750; font-stretch: 90%; letter-spacing: -.03em; font-size: 24px; }
  .tr-name span { color: #7a3fa0; font-weight: 750; font-size: 18px; }
  .tr-thumbs { display: flex; gap: 12px; overflow-x: auto; padding: 12px 8px 16px 4px; scrollbar-width: none; }
  .tr-thumbs::-webkit-scrollbar { display: none; }
  .tr-thumb { flex: none; width: 62px; height: 62px; border-radius: 18px; background: #fff; border: 3px solid transparent; padding: 6px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .15s; }
  .tr-thumb:hover { transform: translateY(-2px); }
  .tr-thumb img { max-width: 100%; max-height: 100%; }
  .tr-thumb[aria-pressed="true"] { border-color: #24122e; box-shadow: 4px 4px 0 #f7b928; }
  .tr-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tr-btn { border: 0; border-radius: 999px; padding: 15px; font: 700 15px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; cursor: pointer;
    background: #24122e; color: #f4ede3; box-shadow: 5px 5px 0 #f7b928; transition: background .2s, transform .15s, box-shadow .15s; }
  .tr-btn:hover:not(:disabled) { background: #7a3fa0; }
  .tr-btn:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: 2px 2px 0 #f7b928; }
  .tr-btn.alt { background: #ebe1d3; color: #24122e; box-shadow: 5px 5px 0 #dcc2f2; }
  .tr-btn.alt:hover:not(:disabled) { background: #dcc2f2; }
  .tr-btn.alt:active:not(:disabled) { box-shadow: 2px 2px 0 #dcc2f2; }
  .tr-btn:disabled { opacity: .5; cursor: default; }
  .tr-foot { margin-top: 14px; font-size: 13px; color: #5a4a63; text-align: center; }
  .tr-foot label { color: #24122e; font-weight: 700; text-decoration: underline; cursor: pointer; white-space: nowrap; }
  .tr-foot input { display: none; }
  .tr { position: relative; }
  .tr-shotview { position: absolute; inset: 0; z-index: 2; background: #f4ede3; display: flex; flex-direction: column; padding: 16px 16px 18px; gap: 14px; }
  .tr-shotview img { flex: 1; min-height: 0; width: 100%; object-fit: contain; -webkit-touch-callout: default; }
  .tr-shot-tip { margin: 0; text-align: center; font-size: 15px; color: #24122e; }
  .tr-shotview a.tr-btn { display: flex; align-items: center; justify-content: center; text-decoration: none; }
  .tr-shotview .tr-actions:has(> :only-child) { grid-template-columns: 1fr; }
  .tr-shotview .tr-actions:empty { display: none; }
  .tr-back-btn { background: none; border: 0; color: #5a4a63; font: 600 14px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; text-decoration: underline; cursor: pointer; padding: 4px; }
  .tr-btn:focus-visible, .tr-thumb:focus-visible, .tr-x:focus-visible, .tr-back-btn:focus-visible, .tr-foot label:focus-within { outline: 3px solid #7a3fa0; outline-offset: 3px; }`;

  let styled = false, landmarker = null, loading = null;

  async function getLandmarker() {
    if (landmarker) return landmarker;
    if (!loading) loading = (async () => {
      const vision = await import(`${MP}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const make = (delegate) => vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numFaces: 1,
      });
      try { landmarker = await make("GPU"); } catch (e) { landmarker = await make("CPU"); }
      return landmarker;
    })();
    return loading;
  }

  const imgCache = {}, imgReady = {};
  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => { imgReady[src] = i; res(i); };
      i.onerror = rej;
      i.src = src;
    });
    return imgCache[src];
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const smooth = (prev, next, k) => prev ? { x: prev.x + (next.x - prev.x) * k, y: prev.y + (next.y - prev.y) * k } : next;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Calcula dónde cuelga cada aro a partir de los puntos del rostro (coordenadas en píxeles del cuadro)
  function earAnchors(lm, W, H) {
    const p = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });
    const L = p(P.earL), R = p(P.earR), jl = p(P.jawL), jr = p(P.jawR), nose = p(P.nose);
    const faceW = dist(L, R);
    const out = { x: (L.x - R.x) / faceW, y: (L.y - R.y) / faceW };     // dirección hacia afuera del lado L
    const lobe = (ear, jaw, sign) => ({
      x: ear.x + (jaw.x - ear.x) * 0.45 + out.x * sign * faceW * 0.065,
      y: ear.y + (jaw.y - ear.y) * 0.45 + out.y * sign * faceW * 0.065,
    });
    const eL = p(P.eyeL), eR = p(P.eyeR);
    return {
      faceW,
      roll: Math.atan2(eR.y - eL.y, eR.x - eL.x),
      L: lobe(L, jl, 1), R: lobe(R, jr, -1),
      // cuando la cabeza gira, la oreja del lado que se aleja queda oculta
      visL: clamp01((dist(nose, L) / faceW - 0.24) / 0.12),
      visR: clamp01((dist(nose, R) / faceW - 0.24) / 0.12),
    };
  }

  function drawEarring(ctx, img, at, faceW, item, angle, mirror, alpha) {
    if (alpha <= 0.02) return;
    const h = faceW * (item.h || 0.4), w = h * img.width / img.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(at.x, at.y);
    ctx.rotate(angle);
    if (mirror) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h * (item.centro ? 0.5 : 0.05), w, h);
    ctx.restore();
  }

  function open(slug) {
    const items = (window.KIKA_TRYON || []).filter(i => i.img);
    if (!items.length) return;
    let cur = Math.max(0, items.findIndex(i => i.slug === slug));

    if (!styled) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); styled = true; }
    const back = document.createElement("div");
    back.className = "tr-back";
    back.innerHTML = `
      <div class="tr" role="dialog" aria-modal="true" aria-label="Probador virtual de aros">
        <div class="tr-top"><b><span class="tr-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Pruébatelos <em>aquí</em></span></b><button class="tr-x" aria-label="Cerrar probador">×</button></div>
        <div class="tr-stage">
          <video class="mirror" playsinline muted autoplay></video>
          <canvas class="tr-ov mirror"></canvas>
          <canvas class="tr-still" hidden></canvas>
          <p class="tr-status" role="status">Activando la cámara…</p>
        </div>
        <div class="tr-bar">
          <div class="tr-name"><b></b><span></span></div>
          <div class="tr-thumbs" role="group" aria-label="Elige los aros">${items.map((it, i) =>
            `<button class="tr-thumb" data-i="${i}" aria-label="${it.name}"><img src="${it.img}" alt="" /></button>`).join("")}</div>
          <div class="tr-actions">
            <button class="tr-btn alt tr-shot" disabled>Tomar foto</button>
            <button class="tr-btn tr-order">Lo quiero</button>
          </div>
          <p class="tr-foot">La imagen se procesa solo en tu dispositivo · <label>Usar una foto<input type="file" accept="image/*" /></label></p>
        </div>
      </div>`;
    document.body.appendChild(back);
    document.documentElement.style.overflow = "hidden";

    const $ = (s) => back.querySelector(s);
    const video = $("video"), ov = $(".tr-ov"), still = $(".tr-still"), status = $(".tr-status");
    const octx = ov.getContext("2d"), sctx = still.getContext("2d");
    let stream = null, running = false, raf = 0, lastT = -1, mode = "camera", stillImg = null, stillFace = null;
    let sm = null, faceW = 0, sway = { a: 0, v: 0, prevX: null }, tipShown = false, statusTimer = 0;

    const setStatus = (t, ms) => { status.textContent = t; clearTimeout(statusTimer); if (ms) statusTimer = setTimeout(() => status.textContent = "", ms); };

    function select(i) {
      cur = i;
      const it = items[i];
      $(".tr-name b").textContent = it.name;
      $(".tr-name span").textContent = it.price || "";
      back.querySelectorAll(".tr-thumb").forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      loadImg(it.img).then(() => { if (mode === "photo") drawStill(); });
    }
    back.querySelectorAll(".tr-thumb").forEach(b => b.onclick = () => select(+b.dataset.i));
    select(cur);
    back.querySelector(`.tr-thumb[data-i="${cur}"]`).scrollIntoView({ inline: "center", block: "nearest" });

    function close() {
      running = false; cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
      back.remove();
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    $(".tr-x").onclick = close;
    back.addEventListener("click", e => { if (e.target === back) close(); });
    $(".tr-order").onclick = () => { const it = items[cur]; close(); if (it.onOrder) it.onOrder(); };

    // ---------- Cámara ----------
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      } catch (e) {
        setStatus("No pudimos usar la cámara. Toca «Usar una foto» para probártelos con una selfie.");
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStatus("Preparando el probador…");
      try { await getLandmarker(); } catch (e) { setStatus("No se pudo cargar el probador. Revisa tu conexión e inténtalo de nuevo."); return; }
      if (!back.isConnected) return;
      landmarker.setOptions && await landmarker.setOptions({ runningMode: "VIDEO" });
      setStatus("Mira a la cámara");
      $(".tr-shot").disabled = false;
      running = true;
      loop();
    }

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (video.readyState < 2 || mode !== "camera") return;
      const W = video.videoWidth, H = video.videoHeight;
      if (ov.width !== W) { ov.width = W; ov.height = H; }
      const t = performance.now();
      if (t === lastT) return;
      lastT = t;
      const res = landmarker.detectForVideo(video, t);
      octx.clearRect(0, 0, W, H);
      const lm = res.faceLandmarks && res.faceLandmarks[0];
      if (!lm) { sm = null; if (!status.textContent) setStatus("Acerca tu cara a la cámara"); return; }
      if (status.textContent === "Mira a la cámara" || status.textContent === "Acerca tu cara a la cámara") {
        setStatus(tipShown ? "" : "Recoge tu pelo detrás de la oreja para verlos mejor", tipShown ? 0 : 3500);
        tipShown = true;
      }
      const a = earAnchors(lm, W, H);
      sm = sm || { L: a.L, R: a.R, visL: a.visL, visR: a.visR };
      sm.L = smooth(sm.L, a.L, .55); sm.R = smooth(sm.R, a.R, .55);
      sm.visL += (a.visL - sm.visL) * .3; sm.visR += (a.visR - sm.visR) * .3;
      faceW = faceW ? faceW + (a.faceW - faceW) * .4 : a.faceW;
      // vaivén: el aro se balancea un poco cuando la cabeza se mueve de lado
      const cx = (sm.L.x + sm.R.x) / 2;
      if (sway.prevX !== null) sway.v += -(cx - sway.prevX) / faceW * 0.9;
      sway.prevX = cx;
      sway.v += -sway.a * 0.12; sway.v *= 0.86; sway.a = Math.max(-.4, Math.min(.4, sway.a + sway.v));
      const im = imgReady[items[cur].img];
      if (!im) return;
      drawEarring(octx, im, sm.L, faceW, items[cur], sway.a + a.roll * .2, false, sm.visL);
      drawEarring(octx, im, sm.R, faceW, items[cur], sway.a + a.roll * .2, true, sm.visR);
    }

    // ---------- Foto subida ----------
    $(".tr-foot input").onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setStatus("Buscando tu cara en la foto…");
      const im = await loadImg(URL.createObjectURL(file)).catch(() => null);
      if (!im) { setStatus("No pudimos abrir esa imagen."); return; }
      try { await getLandmarker(); } catch (e2) { setStatus("No se pudo cargar el probador. Revisa tu conexión."); return; }
      mode = "photo";
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      video.hidden = true; ov.hidden = true; still.hidden = false;
      await landmarker.setOptions({ runningMode: "IMAGE" });
      const res = landmarker.detect(im);
      stillImg = im;
      stillFace = res.faceLandmarks && res.faceLandmarks[0];
      setStatus(stillFace ? "" : "No encontramos una cara en la foto. Prueba con una selfie de frente.");
      $(".tr-shot").disabled = false;
      drawStill();
    };

    function drawStill() {
      if (!stillImg) return;
      const W = stillImg.naturalWidth, H = stillImg.naturalHeight;
      still.width = W; still.height = H;
      sctx.drawImage(stillImg, 0, 0);
      if (!stillFace) return;
      const a = earAnchors(stillFace, W, H);
      loadImg(items[cur].img).then(im => {
        sctx.drawImage(stillImg, 0, 0);
        drawEarring(sctx, im, a.L, a.faceW, items[cur], a.roll * .2, false, a.visL);
        drawEarring(sctx, im, a.R, a.faceW, items[cur], a.roll * .2, true, a.visR);
      });
    }

    // ---------- Tomar foto ----------
    $(".tr-shot").onclick = () => {
      const it = items[cur];
      let W, H;
      const c = document.createElement("canvas"), g = c.getContext("2d");
      if (mode === "camera") {
        W = video.videoWidth; H = video.videoHeight; c.width = W; c.height = H;
        g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(video, 0, 0, W, H); g.drawImage(ov, 0, 0); g.restore();
      } else {
        W = still.width; H = still.height; c.width = W; c.height = H; g.drawImage(still, 0, 0);
      }
      const band = Math.round(H * 0.075);
      g.fillStyle = "rgba(36,18,46,.86)"; g.fillRect(0, H - band, W, band);
      g.fillStyle = "#f4ede3"; g.textBaseline = "middle";
      g.font = `750 ${Math.round(band * .4)}px "Bricolage Grotesque", "DM Sans", sans-serif`;
      g.fillText(`Aros ${it.name}`, band * .4, H - band / 2);
      g.textAlign = "right"; g.font = `500 ${Math.round(band * .3)}px "DM Sans", sans-serif`;
      g.fillText("kikamiyuki.github.io", W - band * .4, H - band / 2);
      // Se muestra la foto en una vista previa: mantener presionada para guardar funciona en cualquier celular
      // (incluido el navegador interno de Instagram, que bloquea las descargas automáticas).
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      const bytes = atob(dataUrl.split(",")[1]), arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const file = new File([arr], `kika-miyuki-${it.slug}.jpg`, { type: "image/jpeg" });
      showShot(dataUrl, file, it);
    };

    function showShot(dataUrl, file, it) {
      const ua = navigator.userAgent || "";
      const inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly/i.test(ua);       // navegadores internos: no descargan
      const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      const blobUrl = URL.createObjectURL(file);
      const tip = inApp
        ? "Mantén presionada la foto para guardarla. Si no aparece la opción, toca ··· arriba a la derecha y elige «Abrir en el navegador»."
        : iOS
          ? `Mantén presionada la foto y elige «Añadir a Fotos»${canShare ? ", o toca Compartir → Guardar imagen" : ""}.`
          : `Mantén presionada la foto y elige «Descargar imagen»${canShare ? ", o compártela" : ""}.`;
      const box = document.createElement("div");
      box.className = "tr-shotview";
      box.innerHTML = `
        <img src="${blobUrl}" alt="Tu foto con los aros ${it.name}" />
        <p class="tr-shot-tip">${tip}</p>
        <div class="tr-actions">
          ${canShare ? `<button class="tr-btn tr-share" type="button">${iOS ? "Guardar o compartir" : "Compartir"}</button>` : ""}
          ${inApp ? "" : `<button class="tr-btn ${canShare ? "alt" : ""} tr-dl" type="button">${iOS ? "Abrir la foto" : "Descargar"}</button>`}
        </div>
        <button class="tr-back-btn" type="button">Volver al probador</button>`;
      back.querySelector(".tr").appendChild(box);
      const setTip = (t) => { box.querySelector(".tr-shot-tip").textContent = t; };

      const shareBtn = box.querySelector(".tr-share");
      if (shareBtn) shareBtn.onclick = () => {
        navigator.share({ files: [file], text: `Me probé los aros ${it.name} de Kika Miyuki · kikamiyuki.github.io` })
          .catch(err => { if (err && err.name !== "AbortError") setTip("No se pudo compartir: mantén presionada la foto para guardarla."); });
      };
      const dlBtn = box.querySelector(".tr-dl");
      if (dlBtn) dlBtn.onclick = () => {
        if (iOS) {
          // Safari no guarda descargas en Fotos: se abre la imagen sola, donde «mantener presionado → Añadir a Fotos» funciona
          const w = window.open(blobUrl, "_blank");
          if (!w) setTip("Mantén presionada la foto y elige «Añadir a Fotos».");
          return;
        }
        const a = document.createElement("a");
        a.href = blobUrl; a.download = file.name; a.rel = "noopener";
        document.body.appendChild(a); a.click(); a.remove();
        setTip("Si no ves la foto en tus descargas, mantén presionada la imagen y elige «Descargar imagen».");
      };
      box.querySelector(".tr-back-btn").onclick = () => { box.remove(); setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); };
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) startCamera();
    else setStatus("Tu navegador no permite usar la cámara. Toca «Usar una foto».");
    getLandmarker().catch(() => {});   // empieza a descargar el modelo mientras se pide permiso
  }

  window.KikaProbador = { open };
})();
