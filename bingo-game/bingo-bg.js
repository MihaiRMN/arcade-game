/* =============================================
   ARCADE BINGO - Animated Background Canvas
   Casino-style festive atmosphere
   ============================================= */

(function () {
  'use strict';

  /* ── Canvas setup ─────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id = 'bingo-bg';
  canvas.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Jackpot mode ─────────────────────────── */
  let jackpotMode = false;
  let jackpotTimer = 0;
  const JACKPOT_DUR = 5000;
  let jackpotConfetti = [];

  window.triggerBingoJackpotBG = function () {
    jackpotMode = true;
    jackpotTimer = JACKPOT_DUR;
    spawnJackpotConfetti();
  };

  /* ── Light rays (6 casino spotlights) ───────── */
  const RAYS = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * Math.PI * 2 + Math.random() * 1.2,
    halfW: 0.055 + Math.random() * 0.045,
    speed: (0.00012 + Math.random() * 0.00018) * (Math.random() > 0.5 ? 1 : -1),
    baseAlpha: 0.05 + Math.random() * 0.03,
  }));

  /* ── Coin particles (40 falling coins) ───────── */
  function makeCoin(fromTop) {
    return {
      x:      fromTop ? Math.random() * W : Math.random() * W,
      y:      fromTop ? -12 - Math.random() * 60 : Math.random() * H,
      vy:     0.22 + Math.random() * 0.38,
      vx:     (Math.random() - 0.5) * 0.18,
      r:      3 + Math.random() * 4,
      rot:    Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.055,
      alpha:  0.3 + Math.random() * 0.2,
    };
  }
  const COINS = Array.from({ length: 40 }, () => makeCoin(false));

  /* ── Sparkles (60 gold/white glints) ────────── */
  function makeSparkle() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      timer: Math.random() * 2.5,
      dur:   1.4 + Math.random() * 1.6,
      size:  0.8 + Math.random() * 2.2,
      gold:  Math.random() > 0.38,
    };
  }
  const SPARKLES = Array.from({ length: 60 }, makeSparkle);

  /* ── Jackpot confetti (canvas-based) ────────── */
  const CONFETTI_COLORS = ['#fbbf24','#ef4444','#3b82f6','#22c55e','#a855f7','#f97316','#06b6d4','#ec4899','#fde68a'];

  function spawnJackpotConfetti() {
    for (let i = 0; i < 100; i++) {
      jackpotConfetti.push({
        x:      Math.random() * W,
        y:      -20 - Math.random() * H * 0.4,
        vx:     (Math.random() - 0.5) * 5,
        vy:     1.5 + Math.random() * 4,
        grav:   0.003 + Math.random() * 0.004,
        w:      5 + Math.random() * 9,
        h:      5 + Math.random() * 9,
        rot:    Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.18,
        color:  CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        alpha:  0.85 + Math.random() * 0.15,
      });
    }
  }

  /* ── Vignette pulse ──────────────────────────── */
  let vigAlpha = 0.08, vigDir = 1;

  /* ── Main draw loop ──────────────────────────── */
  let lastTS = 0;

  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(ts - lastTS, 50);
    lastTS = ts;

    if (jackpotMode) {
      jackpotTimer -= dt;
      if (jackpotTimer <= 0) {
        jackpotMode = false;
        jackpotConfetti = [];
      }
    }

    const mul = jackpotMode ? 3 : 1;

    ctx.clearRect(0, 0, W, H);

    drawRays(dt, mul);
    drawVignette(dt);
    drawCoins(dt, mul);
    drawSparkles(dt, mul);
    if (jackpotMode || jackpotConfetti.length > 0) drawJackpotConfetti(dt);
  }

  /* ── Light rays ──────────────────────────────── */
  function drawRays(dt, mul) {
    const cx = W * 0.5;
    const cy = H + 60; // origin just below screen bottom
    const dist = Math.hypot(W, H) * 1.6;

    for (const r of RAYS) {
      r.angle += r.speed * dt * mul;

      const drawAlpha = mul > 1
        ? Math.min(r.baseAlpha * 2.2, 0.20)
        : r.baseAlpha;

      const ex = cx + Math.cos(r.angle) * dist;
      const ey = cy + Math.sin(r.angle) * dist;

      const grad = ctx.createLinearGradient(cx, cy, ex, ey);
      grad.addColorStop(0,   `rgba(245,158,11,${drawAlpha})`);
      grad.addColorStop(0.3, `rgba(245,158,11,${drawAlpha * 0.25})`);
      grad.addColorStop(0.7, `rgba(245,158,11,${drawAlpha * 0.05})`);
      grad.addColorStop(1,   'rgba(245,158,11,0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, dist, r.angle - r.halfW, r.angle + r.halfW);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  /* ── Gold vignette (pulsing edges) ──────────── */
  function drawVignette(dt) {
    vigAlpha += vigDir * 0.000022 * dt;
    if (vigAlpha > 0.12) vigDir = -1;
    if (vigAlpha < 0.07) vigDir =  1;

    const r0 = Math.min(W, H) * 0.28;
    const r1 = Math.hypot(W, H) * 0.65;
    const g = ctx.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1);
    g.addColorStop(0,    'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0)');
    g.addColorStop(1,    `rgba(245,158,11,${vigAlpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Falling coins ───────────────────────────── */
  function drawCoins(dt, mul) {
    const speed = mul > 1 ? 2.6 : 1;
    for (const c of COINS) {
      c.rot += c.rotSpd * dt * 0.06 * speed;
      c.x   += c.vx    * dt * 0.06 * speed;
      c.y   += c.vy    * dt * 0.06 * speed;

      if (c.y > H + 22 || c.x < -30 || c.x > W + 30) {
        const nc = makeCoin(true);
        Object.assign(c, nc);
      }

      // Simulate coin flip via X-axis scale
      const sx = Math.max(Math.abs(Math.cos(c.rot)), 0.04);
      const a  = c.alpha * (mul > 1 ? 1.5 : 1);

      ctx.save();
      ctx.globalAlpha = Math.min(a, 1);
      ctx.translate(c.x, c.y);
      ctx.scale(sx, 1);

      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fillStyle   = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth   = 0.7;
      ctx.stroke();

      // Highlight glint
      if (sx > 0.4) {
        ctx.beginPath();
        ctx.arc(-c.r * 0.25, -c.r * 0.3, c.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /* ── Sparkles ────────────────────────────────── */
  function drawSparkles(dt, mul) {
    const dtS  = dt / 1000;
    const rate = mul > 1 ? 2.2 : 1;

    for (const s of SPARKLES) {
      s.timer += dtS * rate;
      if (s.timer >= s.dur) {
        s.x     = Math.random() * W;
        s.y     = Math.random() * H;
        s.timer = 0;
        s.dur   = 1.4 + Math.random() * 1.6;
        s.size  = 0.8 + Math.random() * 2.2;
        s.gold  = Math.random() > 0.38;
      }

      const t  = s.timer / s.dur;
      const sc = Math.sin(t * Math.PI); // smooth bell curve 0→1→0
      if (sc < 0.025) continue;

      const a = Math.min(sc * 0.88 * (mul > 1 ? 1.25 : 1), 1);

      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowBlur  = 9 * sc * (mul > 1 ? 1.8 : 1);
      ctx.shadowColor = s.gold ? '#fbbf24' : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * sc, 0, Math.PI * 2);
      ctx.fillStyle = s.gold ? '#fbbf24' : '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    // Reset shadow so it doesn't bleed into other draws
    ctx.shadowBlur = 0;
  }

  /* ── Jackpot confetti ────────────────────────── */
  function drawJackpotConfetti(dt) {
    for (let i = jackpotConfetti.length - 1; i >= 0; i--) {
      const c = jackpotConfetti[i];
      c.vy += c.grav * dt;
      c.x  += c.vx   * dt * 0.06;
      c.y  += c.vy   * dt * 0.06;
      c.rot += c.rotSpd * dt * 0.06;

      if (c.y > H + 30) {
        jackpotConfetti.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }

  requestAnimationFrame(frame);
})();
