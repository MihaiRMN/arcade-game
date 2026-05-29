/**
 * background.js — Animated Interactive Background for Game Portal
 * Self-contained IIFE. No external dependencies. Pure Canvas 2D.
 *
 * Layers (draw order):
 *   1. Clear with theme bg
 *   2. Nebulas (large slow radial gradient blobs)
 *   3. Stars (static pulsating + shooting)
 *   4. Energy waves (expanding rings)
 *   5. Decorative blobs (4 themed fire/ice/storm/shadow)
 *   6. Particles (permanent floaters + click-burst)
 */
(function () {
  'use strict';

  // ─── THEME DEFINITIONS ──────────────────────────────────────────────────────
  const THEMES = {
    galaxy: {
      bg: '#020208',
      starColor: '#ffffff',
      nebula: ['#6600cc', '#0044ff', '#00ccff'],
      particles: ['#a855f7', '#06b6d4', '#6366f1', '#22d3ee'],
      wave: 'rgba(100,50,200,',
    },
    neon: {
      bg: '#000000',
      starColor: '#00ff41',
      nebula: ['#00ff41', '#ff00ff', '#00ffaa'],
      particles: ['#00ff41', '#ff00ff', '#00ffaa', '#ffff00'],
      wave: 'rgba(0,255,100,',
    },
    sakura: {
      bg: '#0d0008',
      starColor: '#ffccd5',
      nebula: ['#ff6b9d', '#ffccd5', '#ff99bb'],
      particles: ['#ff6b9d', '#ffccd5', '#ff9933', '#ffffff'],
      wave: 'rgba(255,100,150,',
    },
  };

  // ─── CANVAS SETUP ───────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '-1',
    pointerEvents: 'none',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); rebuildOnResize(); });

  // ─── MOUSE & CLICK STATE ────────────────────────────────────────────────────
  let mouseX = W / 2, mouseY = H / 2;
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  const burstParticles = []; // click explosions live here
  window.addEventListener('click', e => spawnBurst(e.clientX, e.clientY));

  // ─── THEME STATE ────────────────────────────────────────────────────────────
  let theme = null;

  function getThemeName() {
    const attr = document.documentElement.getAttribute('data-theme');
    return (attr && THEMES[attr]) ? attr : 'galaxy';
  }

  function applyTheme() {
    theme = THEMES[getThemeName()];
  }
  applyTheme();

  function isDayMode() {
    return document.documentElement.getAttribute('data-daymode') === 'true';
  }

  // Watch for data-theme changes on <html>
  new MutationObserver(() => applyTheme()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // Watch for data-daymode changes — rebuild day layers when entering day mode
  new MutationObserver(() => {
    if (isDayMode()) { buildClouds(); buildDayBlobs(); }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-daymode'],
  });

  // ─── UTILITY HELPERS ────────────────────────────────────────────────────────
  const rand    = (a, b) => Math.random() * (b - a) + a;
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
  const dist    = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const isMobile = () => window.innerWidth < 768;

  // ─── LAYER 1 — STATIC STARS ─────────────────────────────────────────────────
  let stars = [];

  function buildStars() {
    const count = isMobile() ? 100 : 200;
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x:          rand(0, W),
        y:          rand(0, H),
        radius:     rand(0.5, 2),
        baseAlpha:  rand(0.2, 0.9),
        pulseSpeed: rand(0.005, 0.02),
        pulseOffset: rand(0, Math.PI * 2),
      });
    }
  }
  buildStars();

  function drawStars(t) {
    const color = theme.starColor;
    stars.forEach(s => {
      const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.pulseSpeed + s.pulseOffset));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── LAYER 1 — SHOOTING STARS ───────────────────────────────────────────────
  let shootingStars = [];
  let lastShootTime = 0;
  let nextShootDelay = rand(3000, 8000);

  function spawnShootingStar(now) {
    if (shootingStars.length >= 3) return;

    // Start off an edge; travel diagonally across
    const edge = randInt(0, 3); // 0=top, 1=left, 2=right, 3=bottom-ish
    let sx, sy;
    if (edge === 0) { sx = rand(0, W); sy = -10; }
    else if (edge === 1) { sx = -10; sy = rand(0, H); }
    else if (edge === 2) { sx = W + 10; sy = rand(0, H); }
    else { sx = rand(0, W); sy = H + 10; }

    // Direction toward opposite side (roughly)
    const angle = Math.atan2(H / 2 - sy, W / 2 - sx) + rand(-0.4, 0.4);
    const speed = rand(4, 7);
    shootingStars.push({
      x: sx, y: sy,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      born: now,
      duration: 1500,
    });
  }

  function updateDrawShootingStars(now) {
    // Spawn timing
    if (now - lastShootTime > nextShootDelay) {
      spawnShootingStar(now);
      lastShootTime = now;
      nextShootDelay = rand(3000, 8000);
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      const progress = (now - s.born) / s.duration; // 0..1+
      if (progress > 1 || s.x < -50 || s.x > W + 50 || s.y < -50 || s.y > H + 50) {
        shootingStars.splice(i, 1);
        continue;
      }

      // Move
      s.x += s.dx;
      s.y += s.dy;

      // Trail: gradient line from head back 20 velocity-units
      const trailAlpha = (1 - progress) * 0.9;
      const tx = s.x - s.dx * 20;
      const ty = s.y - s.dy * 20;
      const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, `rgba(255,255,255,${trailAlpha.toFixed(3)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // Head dot
      ctx.globalAlpha = trailAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── LAYER 2 — NEBULAS ──────────────────────────────────────────────────────
  let nebulas = [];

  function buildNebulas() {
    nebulas = [
      { x: W * 0.2,  y: H * 0.3,  vx: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), vy: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), radius: rand(300, 500), colorIndex: 0 },
      { x: W * 0.75, y: H * 0.5,  vx: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), vy: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), radius: rand(300, 500), colorIndex: 1 },
      { x: W * 0.5,  y: H * 0.8,  vx: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), vy: rand(0.08, 0.15) * (Math.random() < 0.5 ? 1 : -1), radius: rand(300, 500), colorIndex: 2 },
    ];
  }
  buildNebulas();

  function drawNebulas() {
    nebulas.forEach(n => {
      // Move and bounce
      n.x += n.vx;
      n.y += n.vy;
      if (n.x - n.radius < 0 || n.x + n.radius > W) n.vx *= -1;
      if (n.y - n.radius < 0 || n.y + n.radius > H) n.vy *= -1;

      const color = theme.nebula[n.colorIndex];
      // Parse hex to rgb for gradient stops
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.save();
      ctx.globalAlpha = rand(0.04, 0.07); // per-frame slight flicker for atmosphere
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── LAYER 3 — INTERACTIVE PARTICLES ────────────────────────────────────────
  let particles = [];

  function buildParticles() {
    const count = isMobile() ? 40 : 80;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle());
    }
  }

  function makeParticle() {
    return {
      x:      rand(0, W),
      y:      rand(0, H),
      vx:     rand(-0.4, 0.4),
      vy:     rand(-0.4, 0.4),
      radius: rand(1.5, 3),
      color:  pick(theme ? theme.particles : THEMES.galaxy.particles),
      angle:  rand(0, Math.PI * 2),       // for sakura petals
      rotSpeed: rand(-0.02, 0.02),        // petal rotation speed
    };
  }
  buildParticles();

  function drawParticles() {
    const isSakura = (getThemeName() === 'sakura');

    particles.forEach(p => {
      // Mouse attraction
      const d = dist(p.x, p.y, mouseX, mouseY);
      if (d < 150) {
        const force = (150 - d) / 150 * 0.12;
        p.vx += (mouseX - p.x) / d * force;
        p.vy += (mouseY - p.y) / d * force;
      }

      // Speed cap to prevent runaway
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 2) { p.vx = (p.vx / speed) * 2; p.vy = (p.vy / speed) * 2; }

      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.rotSpeed;

      // Bounce at edges
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = p.color;

      if (isSakura) {
        // Petal: rotated rectangle 6×3px
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-3, -1.5, 6, 3);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // ─── LAYER 3 — BURST PARTICLES ──────────────────────────────────────────────
  function spawnBurst(cx, cy) {
    const count = 20;
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 5);
      burstParticles.push({
        x:      cx,
        y:      cy,
        vx:     Math.cos(angle) * speed,
        vy:     Math.sin(angle) * speed,
        radius: rand(2, 4),
        color:  pick(theme.particles),
        born:   now,
        life:   2000,
      });
    }
  }

  function drawBurstParticles(now) {
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      const elapsed = now - p.born;
      if (elapsed >= p.life) {
        burstParticles.splice(i, 1);
        continue;
      }
      const progress = elapsed / p.life;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97; // friction
      p.vy *= 0.97;

      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── LAYER 4 — DECORATIVE BLOBS ─────────────────────────────────────────────
  const BLOB_DEFS = [
    { label: 'Fire',   color: '#ff4500' },
    { label: 'Ice',    color: '#00cfff' },
    { label: 'Storm',  color: '#ffe500' },
    { label: 'Shadow', color: '#6600cc' },
  ];

  let blobs = [];

  function buildBlobs() {
    blobs = BLOB_DEFS.map((def, i) => ({
      x:       rand(100, W - 100),
      y:       rand(100, H - 100),
      vx:      rand(0.3, 0.6) * (Math.random() < 0.5 ? 1 : -1),
      vy:      rand(0.3, 0.6) * (Math.random() < 0.5 ? 1 : -1),
      radius:  rand(30, 60),
      color:   def.color,
      offset:  rand(0, Math.PI * 2),
    }));
  }
  buildBlobs();

  function drawBlobs(t) {
    blobs.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x - b.radius < 0 || b.x + b.radius > W) b.vx *= -1;
      if (b.y - b.radius < 0 || b.y + b.radius > H) b.vy *= -1;

      const scale = 0.95 + 0.05 * Math.sin(t * 0.002 + b.offset);
      const r = b.radius * scale;

      // Parse hex color
      const hex = b.color;
      const cr = parseInt(hex.slice(1, 3), 16);
      const cg = parseInt(hex.slice(3, 5), 16);
      const cb = parseInt(hex.slice(5, 7), 16);

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.30)`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.shadowBlur = 20;
      ctx.shadowColor = b.color;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── LAYER 5 — ENERGY WAVES ──────────────────────────────────────────────────
  let waves = [];
  let lastWaveTime = 0;
  const WAVE_INTERVAL = 4000;
  const WAVE_DURATION = 3000;
  const WAVE_MAX_R    = 600;

  function drawWaves(now) {
    // Spawn new wave
    if (now - lastWaveTime > WAVE_INTERVAL) {
      waves.push({ x: W / 2, y: H / 2, born: now });
      lastWaveTime = now;
    }

    const waveColor = theme.wave;

    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      const r = (now - w.born) / WAVE_DURATION * WAVE_MAX_R;
      if (r >= WAVE_MAX_R) {
        waves.splice(i, 1);
        continue;
      }
      const alpha = Math.max(0, 1 - r / WAVE_MAX_R) * 0.25;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `${waveColor}${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ─── DAY MODE — CONSTANTS ────────────────────────────────────────────────────
  const DAY_PARTICLES = ['#d4830a', '#e8a820', '#fbbf24', '#f97316', '#fcd34d', '#fb923c'];
  const DAY_BLOB_DEFS = [
    { color: '#ff8c42' }, // orange
    { color: '#ffd166' }, // golden yellow
    { color: '#87ceeb' }, // sky blue
    { color: '#f4a261' }, // peach
  ];

  // ─── DAY MODE — CLOUDS ───────────────────────────────────────────────────────
  let clouds = [];

  function buildClouds() {
    const count = isMobile() ? 5 : 9;
    clouds = [];
    for (let i = 0; i < count; i++) {
      clouds.push({
        x:      rand(-250, W + 250),
        y:      rand(H * 0.04, H * 0.42),
        vx:     rand(0.12, 0.35) * (Math.random() < 0.75 ? 1 : -1),
        width:  rand(130, 280),
        height: rand(50, 95),
        alpha:  rand(0.55, 0.9),
      });
    }
  }
  buildClouds();

  function drawCloud(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const puffs = Math.max(3, Math.floor(w / 45));
    for (let i = 0; i < puffs; i++) {
      const px = x - w / 2 + (i / (puffs - 1)) * w;
      const py = y + Math.sin(i * 1.1) * h * 0.18;
      const r  = h * (0.38 + Math.sin(i * 0.9) * 0.14);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawClouds() {
    clouds.forEach(c => {
      c.x += c.vx;
      if (c.vx > 0 && c.x - c.width / 2 > W + 200) c.x = -c.width / 2 - 200;
      if (c.vx < 0 && c.x + c.width / 2 < -200)     c.x =  W + c.width / 2 + 200;
      drawCloud(c.x, c.y, c.width, c.height, c.alpha);
    });
  }

  // ─── DAY MODE — SUN ──────────────────────────────────────────────────────────
  let sunRayAngle = 0;

  function drawSun(now) {
    const sx = W - 110;
    const sy = 110;
    const baseR = 42;
    const pulse = 0.85 + 0.15 * Math.sin(now * 0.0009);

    // Outer halo
    const halo = ctx.createRadialGradient(sx, sy, baseR * 0.5, sx, sy, baseR * 3.5);
    halo.addColorStop(0, `rgba(255,220,50,${(0.22 * pulse).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.save();
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, baseR * 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rotating rays
    sunRayAngle += 0.0025;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(sunRayAngle);
    ctx.strokeStyle = `rgba(255,190,40,${(0.45 * pulse).toFixed(3)})`;
    ctx.lineWidth = 2;
    const numRays = 14;
    for (let i = 0; i < numRays; i++) {
      const a    = (i / numRays) * Math.PI * 2;
      const long = i % 2 === 0;
      const r1   = baseR + 6;
      const r2   = baseR + (long ? 24 : 14);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();

    // Sun body gradient
    const sunGrad = ctx.createRadialGradient(sx - baseR * 0.22, sy - baseR * 0.22, 0, sx, sy, baseR);
    sunGrad.addColorStop(0, '#fff9b0');
    sunGrad.addColorStop(0.5, '#ffd700');
    sunGrad.addColorStop(1, '#f97316');
    ctx.save();
    ctx.shadowBlur  = 28;
    ctx.shadowColor = 'rgba(255,200,50,0.75)';
    ctx.fillStyle   = sunGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, baseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── DAY MODE — GOLDEN PARTICLES ─────────────────────────────────────────────
  function drawDayParticles() {
    particles.forEach(p => {
      if (!p.dayColor) p.dayColor = DAY_PARTICLES[Math.floor(Math.random() * DAY_PARTICLES.length)];

      const d = dist(p.x, p.y, mouseX, mouseY);
      if (d < 130) {
        const force = (130 - d) / 130 * 0.09;
        p.vx += (mouseX - p.x) / d * force;
        p.vy += (mouseY - p.y) / d * force;
      }
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 1.5) { p.vx = (p.vx / speed) * 1.5; p.vy = (p.vy / speed) * 1.5; }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));

      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle   = p.dayColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── DAY MODE — WARM BLOBS ────────────────────────────────────────────────────
  let dayBlobs = [];

  function buildDayBlobs() {
    dayBlobs = DAY_BLOB_DEFS.map(def => ({
      x:      rand(100, W - 100),
      y:      rand(100, H - 100),
      vx:     rand(0.18, 0.4) * (Math.random() < 0.5 ? 1 : -1),
      vy:     rand(0.18, 0.4) * (Math.random() < 0.5 ? 1 : -1),
      radius: rand(90, 160),
      color:  def.color,
      offset: rand(0, Math.PI * 2),
    }));
  }
  buildDayBlobs();

  function drawDayBlobs(t) {
    dayBlobs.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x - b.radius < 0 || b.x + b.radius > W) b.vx *= -1;
      if (b.y - b.radius < 0 || b.y + b.radius > H) b.vy *= -1;

      const scale = 0.95 + 0.05 * Math.sin(t * 0.001 + b.offset);
      const r     = b.radius * scale;
      const hex   = b.color;
      const cr    = parseInt(hex.slice(1, 3), 16);
      const cg    = parseInt(hex.slice(3, 5), 16);
      const cb    = parseInt(hex.slice(5, 7), 16);

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.1)`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── DAY MODE — GOLDEN WAVES ─────────────────────────────────────────────────
  function drawDayWaves(now) {
    if (now - lastWaveTime > WAVE_INTERVAL) {
      waves.push({ x: rand(W * 0.2, W * 0.8), y: rand(H * 0.5, H * 0.85), born: now });
      lastWaveTime = now;
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      const r = (now - w.born) / WAVE_DURATION * WAVE_MAX_R;
      if (r >= WAVE_MAX_R) { waves.splice(i, 1); continue; }
      const alpha = Math.max(0, 1 - r / WAVE_MAX_R) * 0.12;
      ctx.save();
      ctx.strokeStyle = `rgba(212,131,10,${alpha.toFixed(3)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ─── DAY MODE — MAIN DRAW ─────────────────────────────────────────────────────
  function drawDayBackground(now, t) {
    // Sky-to-horizon gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,    '#8ecae6');  // blue sky
    sky.addColorStop(0.45, '#b4d9ee');  // lighter
    sky.addColorStop(1,    '#f5edd8');  // warm cream horizon
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawDayBlobs(t);
    drawClouds();
    drawSun(now);
    drawDayWaves(now);
    drawDayParticles();
    drawBurstParticles(now);
  }

  // ─── REBUILD ON RESIZE ───────────────────────────────────────────────────────
  function rebuildOnResize() {
    buildStars();
    buildParticles();
    buildClouds();
    buildDayBlobs();
    // Clamp nebula/blob positions to new dimensions
    nebulas.forEach(n => {
      n.x = Math.min(n.x, W);
      n.y = Math.min(n.y, H);
    });
    blobs.forEach(b => {
      b.x = Math.min(Math.max(b.x, b.radius), W - b.radius);
      b.y = Math.min(Math.max(b.y, b.radius), H - b.radius);
    });
    dayBlobs.forEach(b => {
      b.x = Math.min(Math.max(b.x, b.radius), W - b.radius);
      b.y = Math.min(Math.max(b.y, b.radius), H - b.radius);
    });
    waves = []; // reset waves on resize
  }

  // ─── INITIALISE NEBULAS & BLOBS AFTER CANVAS IS SIZED ───────────────────────
  buildNebulas();
  buildBlobs();

  // ─── MAIN ANIMATION LOOP ─────────────────────────────────────────────────────
  let t = 0;

  function loop(now) {
    t++;

    if (isDayMode()) {
      // ── DAY MODE ──
      drawDayBackground(now, t);
    } else {
      // ── NIGHT MODE ──
      // 1. Clear with theme background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // 2. Nebulas
      drawNebulas();

      // 3. Stars (static pulsating)
      drawStars(t);

      // 4. Shooting stars + trails
      updateDrawShootingStars(now);

      // 5. Energy waves
      drawWaves(now);

      // 6. Decorative blobs
      drawBlobs(t);

      // 7. Particles (permanent floaters + burst)
      drawParticles();
      drawBurstParticles(now);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

})();
