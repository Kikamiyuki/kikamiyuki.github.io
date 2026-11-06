// Pop up del descuento programado (PROMO en index.html): sin código, porque los precios ya vienen rebajados.
// index.html lo carga solo mientras el descuento está activo; aparece una sola vez por visitante y por descuento.
// Mismo diseño que lanzamiento.js.
(function () {
  const P = window.KIKA_PROMO;
  if (!P) return;
  const VISTO = "kika-promo-visto-" + P.desde;
  const ESPERA = 1500; // milisegundos

  const css = `
  .kp-back { position: fixed; inset: 0; background: rgba(36,18,46,.62); z-index: 90; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .kp-card { outline: 0; position: relative; background: #f4ede3; color: #24122e; width: 100%; max-width: 420px; border-radius: 28px; padding: 26px 26px 22px;
    font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; box-shadow: 12px 12px 0 #e5392f; max-height: calc(100vh - 40px); overflow: auto; }
  .kp-x { position: absolute; top: 14px; right: 14px; z-index: 2; width: 42px; height: 42px; border-radius: 50%; border: 0; background: #ebe1d3; color: #24122e;
    font-size: 26px; line-height: 1; cursor: pointer; display: grid; place-items: center; }
  .kp-x:hover { background: #dcc2f2; }
  .kp-beads { width: 76px; height: 14px; margin-bottom: 14px; border-radius: 4px;
    background: linear-gradient(90deg, #e5392f 0 14px, transparent 14px 20px, #f7b928 20px 34px, transparent 34px 40px, #1e7be0 40px 54px, transparent 54px 60px, #2e9f4f 60px 74px, transparent 74px); }
  .kp-label { font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #e5392f; padding-right: 44px; line-height: 1.3; }
  .kp-card h2.kp-head { position: relative; margin: 12px 0 0; min-height: 150px; font: inherit; letter-spacing: normal; }
  .kp-num { display: block; font-weight: 800; font-stretch: 85%; letter-spacing: -.05em; font-size: 118px; line-height: .86; }
  .kp-sub { display: block; font-family: "Instrument Serif", Georgia, serif; font-style: italic; color: #7a3fa0; font-size: 42px; line-height: 1; margin-top: 8px; max-width: calc(100% - 140px); }
  .kp-aro { position: absolute; width: 66px; pointer-events: none; }
  .kp-aro.a { right: 58px; top: 0; rotate: -10deg; }
  .kp-aro.b { right: 0; top: 38px; rotate: 10deg; }
  .kp-txt { font-size: 16px; line-height: 1.4; margin: 16px 0 0; }
  .kp-sin { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 12px 16px; border-radius: 18px; background: #fbf7f1; border: 2px solid #dcc2f2;
    font-size: 15px; font-weight: 700; line-height: 1.3; }
  .kp-sin i { flex: none; width: 26px; height: 26px; border-radius: 50%; background: #2e9f4f; color: #fff; font-style: normal; display: grid; place-items: center; font-size: 15px; }
  .kp-btn { display: block; width: 100%; margin-top: 16px; padding: 16px; border-radius: 999px; border: 0; background: #24122e; color: #f4ede3;
    font: 700 16px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif; cursor: pointer; text-align: center; box-shadow: 5px 5px 0 #f7b928; }
  .kp-btn:hover { background: #7a3fa0; }
  .kp-foot { margin-top: 16px; font-size: 14px; line-height: 1.4; color: #5a4a63; text-align: center; }
  .kp-x:focus-visible, .kp-btn:focus-visible { outline: 3px solid #7a3fa0; outline-offset: 3px; }
  @media (max-height: 640px) { .kp-num { font-size: 84px; } .kp-sub { font-size: 32px; } .kp-card h2.kp-head { min-height: 110px; } .kp-aro { width: 54px; } }`;

  // El navegador puede bloquear el almacenamiento (ventana privada); en ese caso el pop up igual funciona
  const yaVisto = () => { try { return localStorage.getItem(VISTO) === "1"; } catch (e) { return false; } };
  const marcarVisto = () => { try { localStorage.setItem(VISTO, "1"); } catch (e) {} };

  function abrir() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    const back = document.createElement("div");
    back.className = "kp-back";
    back.innerHTML = `
      <div class="kp-card" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="kp-titulo">
        <button type="button" class="kp-x" aria-label="Cerrar">×</button>
        <div class="kp-beads" aria-hidden="true"></div>
        <div class="kp-label">${P.nombre} · ${P.fechas}</div>
        <h2 class="kp-head" id="kp-titulo">
          <span class="kp-num">${P.pct}%</span>
          <span class="kp-sub">en toda la tienda</span>
          <img class="kp-aro a" src="img/probador/calavera-halloween.png" alt="" />
          <img class="kp-aro b" src="img/probador/sol-fucsia.png" alt="" />
        </h2>
        <p class="kp-txt">Todos los aros y anillos tienen ${P.pct}% de descuento. Elige tu par y pídelo por DM.</p>
        <p class="kp-sin"><i aria-hidden="true">✓</i>No necesitas código: el precio ya viene rebajado.</p>
        <button type="button" class="kp-btn">Ver la colección</button>
        <p class="kp-foot">Válido ${P.hastaTxt} a las 23:59.</p>
      </div>`;
    document.body.appendChild(back);

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const cerrar = () => {
      marcarVisto();
      back.remove();
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", tecla);
    };
    const tecla = (e) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", tecla);

    back.addEventListener("click", (e) => { if (e.target === back) cerrar(); });
    back.querySelector(".kp-x").addEventListener("click", cerrar);
    back.querySelector(".kp-btn").addEventListener("click", () => {
      cerrar();
      const coleccion = document.getElementById("coleccion");
      if (coleccion) coleccion.scrollIntoView({ behavior: "smooth" });
    });

    back.querySelector(".kp-card").focus();
    marcarVisto();
  }

  if (!yaVisto()) setTimeout(abrir, ESPERA);
})();
