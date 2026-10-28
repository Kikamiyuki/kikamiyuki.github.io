// Vitrina 3D y "tejido en vivo": arma cada aro en 3D, mostacilla por mostacilla, a partir de su recorte (img/probador/<slug>.png).
// Los datos vienen de window.KIKA_VITRINA (index.html, productos con el campo `vitrina`).
// Solo sirve para aros tejidos únicamente con Delicas: perlas o dijes se verían como mostacillas.
// three.js se descarga recién cuando la sección está por aparecer en pantalla.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/+esm";
const ROOM_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js/+esm";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ITEMS = window.KIKA_VITRINA || [];
let THREE, RoomEnvironment;

async function loadThree() {
  if (!THREE) [THREE, { RoomEnvironment }] = await Promise.all([import(THREE_URL), import(ROOM_URL)]);
}
function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
function whenNear(el, fn) {
  const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: "600px 0px" });
  io.observe(el);
}

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// Lee la foto recortada y la convierte en una grilla de mostacillas (punto de ladrillo: filas desfasadas media cuenta)
const cache = {};
async function analyze(item) {
  if (cache[item.slug]) return cache[item.slug];
  const img = await loadImage(item.img);
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const y0 = Math.round(H * item.top);

  // colores de mostacilla: k-means sobre los píxeles opacos
  const pts = [];
  for (let y = y0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (d[i + 3] > 200) pts.push([d[i], d[i + 1], d[i + 2]]); }
  const K = item.k;
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  let cent = [pts[Math.floor(pts.length / 2)].slice()];
  while (cent.length < K) {
    let best = null, bd = -1;
    for (let i = 0; i < pts.length; i += 7) { const m = Math.min(...cent.map((c) => dist(pts[i], c))); if (m > bd) { bd = m; best = pts[i]; } }
    cent.push(best.slice());
  }
  const near = (p) => { let b = 0, bd = Infinity; for (let k = 0; k < K; k++) { const dd = dist(p, cent[k]); if (dd < bd) { bd = dd; b = k; } } return b; };
  for (let it = 0; it < 12; it++) {
    const s = cent.map(() => [0, 0, 0, 0]);
    for (const p of pts) { const k = near(p); s[k][0] += p[0]; s[k][1] += p[1]; s[k][2] += p[2]; s[k][3]++; }
    cent = s.map((v, k) => v[3] ? [v[0] / v[3], v[1] / v[3], v[2] / v[3]] : cent[k]);
  }

  const P = item.pitch, R = P * (item.row || 1), beads = [];
  let row = 0;
  for (let cy = y0 + R / 2; cy < H; cy += R, row++) {
    const off = (row % 2) * P / 2, line = [];
    for (let cx = off + P / 2; cx < W; cx += P) {
      let tot = 0, op = 0; const votes = new Array(K).fill(0);
      for (let y = Math.round(cy - R * .36); y <= cy + R * .36; y++) for (let x = Math.round(cx - P * .36); x <= cx + P * .36; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        tot++; const i = (y * W + x) * 4;
        if (d[i + 3] > 160) { op++; votes[near([d[i], d[i + 1], d[i + 2]])]++; }
      }
      if (tot && op / tot > .55) line.push({ x: cx, y: cy, k: votes.indexOf(Math.max(...votes)), row });
    }
    if (row % 2) line.reverse(); // se teje de ida y vuelta
    beads.push(...line);
  }
  return (cache[item.slug] = { img, W, H, y0, P, R, beads, cent, rows: row });
}

// Delica: un cilindro corto con su agujero
function beadGeometry(h) {
  const ro = .47, ri = .2, hh = h / 2 * .9, b = .12;
  const pts = [[ri, -hh], [ro - b, -hh], [ro, -hh + b], [ro, hh - b], [ro - b, hh], [ri, hh], [ri, -hh]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 18);
}

function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe9d8ff, .8); rim.position.set(-6, 2, -4); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(28, 1, .1, 2000);
  const holder = new THREE.Group(); scene.add(holder);
  let piece = null, lw = 0, lh = 0;
  function fit() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    if (piece) {
      const ph = piece.h * 1.06, pw = piece.w * 1.12, t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.position.set(0, 0, Math.max(ph / 2 / t, pw / 2 / t / cam.aspect));
    }
    cam.updateProjectionMatrix();
  }
  return {
    holder,
    set(p) { if (piece) holder.remove(piece.grp); piece = p; holder.add(p.grp); fit(); },
    render() {
      if (canvas.clientWidth !== lw || canvas.clientHeight !== lh) { lw = canvas.clientWidth; lh = canvas.clientHeight; fit(); }
      renderer.render(scene, cam);
    },
  };
}

function buildPiece(data) {
  const { W, H, y0, P, R } = data, rand = rng(7);
  const grp = new THREE.Group(), geo = beadGeometry(R / P);
  // los tonos dorados/cobre se tratan como mostacilla metalizada, el resto como vidrio
  const hsl = { h: 0, s: 0, l: 0 }, tmp = new THREE.Color();
  const metallic = data.cent.map((c) => { tmp.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).getHSL(hsl); const h = hsl.h * 360; return h > 18 && h < 58 && hsl.s > .28 && hsl.l > .28 && hsl.l < .72; });
  const counts = [0, 0];
  data.beads.forEach((b) => { b.mi = metallic[b.k] ? 1 : 0; b.ii = counts[b.mi]++; });
  const meshes = [
    new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ roughness: .22, metalness: .05, clearcoat: 1, clearcoatRoughness: .08 }), Math.max(1, counts[0])),
    new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ roughness: .3, metalness: .85, clearcoat: .6, clearcoatRoughness: .2 }), Math.max(1, counts[1])),
  ];
  meshes.forEach((ms, i) => { ms.count = counts[i]; grp.add(ms); });
  const m = new THREE.Matrix4(), col = new THREE.Color(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  data.beads.forEach((b) => {
    const c = data.cent[b.k], j = (b.mi ? 1.25 : .95) * (1 + (rand() - .5) * .1);
    col.setRGB(Math.min(1, c[0] / 255 * j), Math.min(1, c[1] / 255 * j), Math.min(1, c[2] / 255 * j), THREE.SRGBColorSpace);
    meshes[b.mi].setColorAt(b.ii, col);
    b.pos = new THREE.Vector3((b.x - W / 2) / P + (rand() - .5) * .05, -(b.y - H / 2) / P, (rand() - .5) * .08);
    b.rot = new THREE.Quaternion().setFromEuler(e.set((rand() - .5) * .14, rand() * Math.PI, (rand() - .5) * .1));
    m.compose(b.pos, b.rot, one); meshes[b.mi].setMatrixAt(b.ii, m);
  });
  // el gancho (y lo que cuelga arriba) se muestra desde la foto
  const hc = document.createElement("canvas"); hc.width = W; hc.height = y0;
  hc.getContext("2d").drawImage(data.img, 0, 0);
  const tex = new THREE.CanvasTexture(hc); tex.colorSpace = THREE.SRGBColorSpace;
  const hook = new THREE.Mesh(new THREE.PlaneGeometry(W / P, y0 / P),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .35, side: THREE.DoubleSide }));
  hook.position.set(0, (H / 2 - y0 / 2) / P, 0);
  grp.add(hook);
  return {
    grp, hook, beads: data.beads, w: W / P, h: H / P,
    setBead: (b, mat) => meshes[b.mi].setMatrixAt(b.ii, mat),
    flush: () => meshes.forEach((ms) => { ms.instanceMatrix.needsUpdate = true; }),
  };
}

/* ---------- Tejido en vivo ---------- */
async function initTejido(section, item) {
  const canvas = section.querySelector("canvas");
  const nEl = section.querySelector("[data-n]"), totalEl = section.querySelector("[data-total]"), barEl = section.querySelector("[data-bar]");
  const rowEl = section.querySelector("[data-row]"), doneEl = section.querySelector("[data-done]");
  section.querySelector("[data-tname]").textContent = item.name;
  await loadThree();
  const data = await analyze(item);
  const stage = makeStage(canvas), piece = buildPiece(data);
  stage.set(piece);
  const total = data.beads.length, born = new Float32Array(total).fill(-1);
  totalEl.textContent = total.toLocaleString("es-CL");
  const m = new THREE.Matrix4(), s = new THREE.Vector3(), p = new THREE.Vector3(), zero = new THREE.Vector3(0, 0, 0);
  for (const b of piece.beads) { m.compose(b.pos, b.rot, zero); piece.setBead(b, m); }
  piece.flush();
  piece.hook.material.opacity = 0;
  let shown = 0, visible = true, hookA = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(section);
  const pop = (t) => t >= 1 ? 1 : 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); // aparece con un pequeño rebote

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const r = section.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    const target = Math.round(Math.min(1, prog / .88) * total);
    // born: -1 sin tejer, -2 ya asentada, otro valor = momento en que se agregó
    if (target > shown) { for (let i = shown; i < target; i++) born[i] = reduced ? now - 1000 : now - (target - i) * 4; }
    if (target < shown) { for (let i = target; i < shown; i++) { born[i] = -1; m.compose(piece.beads[i].pos, piece.beads[i].rot, zero); piece.setBead(piece.beads[i], m); } }
    shown = target;
    for (let i = 0; i < shown; i++) {
      if (born[i] === -2) continue;
      const b = piece.beads[i], age = (now - born[i]) / 260;
      if (age >= 1) { m.compose(b.pos, b.rot, s.set(1, 1, 1)); born[i] = -2; }
      else { const k = Math.max(0, pop(Math.max(0, age))); p.copy(b.pos); p.z += (1 - Math.max(0, age)) * 2.5; m.compose(p, b.rot, s.set(k, k, k)); }
      piece.setBead(b, m);
    }
    piece.flush();
    const last = shown ? piece.beads[shown - 1] : null;
    nEl.textContent = shown.toLocaleString("es-CL");
    barEl.style.width = (shown / total * 100) + "%";
    rowEl.textContent = last ? `Fila ${last.row + 1} de ${data.rows}` : "Fila 0";
    const complete = shown === total;
    doneEl.classList.toggle("on", complete);
    hookA += ((complete ? 1 : 0) - hookA) * .08;
    piece.hook.material.opacity = hookA; piece.hook.visible = hookA > .02;
    stage.holder.rotation.y = reduced ? 0 : Math.sin(now / 2200) * (.18 + .25 * hookA);
    stage.holder.rotation.x = reduced ? 0 : Math.sin(now / 3100) * .05;
    stage.render();
  }
  requestAnimationFrame(frame);
}

/* ---------- Vitrina 3D ---------- */
async function initVitrina(section) {
  const canvas = section.querySelector("canvas"), nameEl = section.querySelector("[data-name]"), priceEl = section.querySelector("[data-price]");
  const thumbs = section.querySelector("[data-thumbs]"), orderBtn = section.querySelector("[data-order]"), tryBtn = section.querySelector("[data-try]");
  let current = ITEMS[0];
  for (const it of ITEMS) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.slug = it.slug; b.setAttribute("aria-label", it.name);
    b.innerHTML = `<img src="${it.img}" alt="" />`;
    b.onclick = () => show(it);
    thumbs.appendChild(b);
  }
  orderBtn.onclick = () => current.onOrder && current.onOrder();
  tryBtn.onclick = () => window.KikaProbador && window.KikaProbador.open(current.slug);
  await loadThree();
  const stage = makeStage(canvas);
  let rotY = 0, vel = 0, dragging = false, lastX = 0, idle = 0, gyroY = null, visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

  async function show(it) {
    current = it;
    thumbs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.slug === it.slug));
    nameEl.textContent = it.name; priceEl.textContent = it.price;
    tryBtn.hidden = !it.tryon;
    stage.set(buildPiece(await analyze(it)));
    section.querySelector(".vt-loading")?.remove();
    rotY = -.9; vel = .045; // entra girando
  }

  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * .012; rotY += vel; idle = 0; });
  const up = () => { dragging = false; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  // inclinar el teléfono también gira el aro
  const gyroBtn = section.querySelector("[data-gyro]");
  if ("DeviceOrientationEvent" in window && matchMedia("(pointer: coarse)").matches) gyroBtn.hidden = false;
  gyroBtn.onclick = async () => {
    try { if (typeof DeviceOrientationEvent.requestPermission === "function" && await DeviceOrientationEvent.requestPermission() !== "granted") return; } catch { return; }
    addEventListener("deviceorientation", (e) => { if (e.gamma != null) gyroY = THREE.MathUtils.degToRad(e.gamma) * 1.6; });
    gyroBtn.textContent = "Inclina el teléfono"; gyroBtn.disabled = true;
  };

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(50, now - last) / 16.7; last = now;
    if (!visible) return;
    if (!dragging) {
      rotY += vel * dt; vel *= Math.pow(.94, dt); idle += dt;
      if (gyroY != null) rotY += (gyroY - rotY) * .08 * dt;
      else if (!reduced && Math.abs(vel) < .002 && idle > 90) rotY += .006 * dt; // si nadie lo toca, gira solo
    }
    stage.holder.rotation.y = rotY;
    stage.holder.rotation.z = reduced ? 0 : Math.sin(now / 1400) * .02; // leve vaivén, como colgando
    stage.render();
  }
  await show(current);
  requestAnimationFrame(frame);
}

const vSection = document.getElementById("vitrina"), tSection = document.getElementById("tejido");
const tejidoItem = ITEMS.find((it) => it.tejido) || ITEMS[0];
if (!ITEMS.length || !webglOK()) { vSection?.remove(); tSection?.remove(); }
else {
  if (vSection) whenNear(vSection, () => initVitrina(vSection).catch(() => vSection.remove()));
  if (tSection) whenNear(tSection, () => initTejido(tSection, tejidoItem).catch(() => tSection.remove()));
}
