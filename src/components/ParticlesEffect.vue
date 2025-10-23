<template>
  <canvas ref="canvasEl" class="absolute inset-0 w-full h-full"></canvas>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  type: { type: String, default: 'neutral' },
  autoplay: { type: Boolean, default: true },
});

const canvasEl = ref(null);
let ctx = null;
let rafId = 0;
let particles = [];
let startTs = 0;

const rand = (min, max) => Math.random() * (max - min) + min;

const resize = () => {
  if (!canvasEl.value) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvasEl.value.getBoundingClientRect();
  canvasEl.value.width = rect.width * dpr;
  canvasEl.value.height = rect.height * dpr;
  ctx = canvasEl.value.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const spawnFire = (w, h) => {
  for (let i = 0; i < 24; i++) {
    particles.push({
      x: w / 2 + rand(-30, 30),
      y: h / 2 + rand(10, 30),
      vx: rand(-0.6, 0.6),
      vy: rand(-1.8, -0.6),
      r: rand(4, 10),
      life: rand(500, 900),
      color: `rgba(255, ${Math.floor(rand(90, 160))}, ${Math.floor(rand(20, 60))}, 0.9)`,
    });
  }
};

const spawnWater = (w, h) => {
  // expanding ripples
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      r: 10,
      vr: rand(1.2, 2.0),
      line: true,
      life: 900,
      color: 'rgba(80,180,255,0.85)',
    });
  }
  // droplets
  for (let i = 0; i < 20; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(0.8, 1.8);
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: rand(2, 4),
      life: rand(700, 1100),
      color: 'rgba(120,200,255,0.9)',
    });
  }
};

const spawnElectric = (w, h) => {
  // vertical lightning bolts from top to bottom
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: w / 2 + rand(-60, 60),
      y: -20,
      path: Array.from({ length: 8 }, () => ({ dx: rand(-6, 6), dy: rand(10, 22) })),
      life: rand(500, 800),
      bolt: true,
      vy: rand(3, 5),
      color: 'rgba(255,230,90,1)',
    });
  }
};

const spawnGrass = (w, h) => {
  // flying leaves: drift to the right with wind sway and gravity
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: w / 2 - 80 + rand(-10, 10),
      y: h / 2 + rand(-30, 30),
      vx: rand(1.4, 2.6),
      vy: rand(-0.3, 0.3),
      g: 0.015,
      r: rand(3, 6),
      life: rand(1100, 1500),
      leaf: true,
      rot: rand(-Math.PI, Math.PI),
      rotV: rand(-0.03, 0.03),
      swayA: rand(0, Math.PI * 2),
      swayV: rand(0.05, 0.09),
      swayAmp: rand(6, 12),
      color: 'rgba(90,230,140,0.95)',
    });
  }
};

const spawnPoison = (w, h) => {
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: w / 2 + rand(-40, 40),
      y: h / 2 + rand(-20, 20),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.2, 0.2),
      r: rand(14, 26),
      life: rand(900, 1300),
      color: 'rgba(180,80,255,0.35)',
    });
  }
};

const spawnNeutral = (w, h) => {
  particles.push({
    x: w / 2,
    y: h / 2,
    r: 16,
    vr: 2,
    line: true,
    life: 800,
    color: 'rgba(220,220,220,0.9)',
  });
};

// extra types
const spawnNormal = (w, h) => {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: rand(-1, 1),
      vy: rand(-1, 1),
      r: rand(2, 4),
      life: rand(700, 1100),
      color: 'rgba(200,200,220,0.9)',
    });
  }
};

const spawnFighting = (w, h) => {
  // impact ripples
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      r: 8 + i * 6,
      vr: 2.0,
      line: true,
      life: 700,
      color: 'rgba(255,140,100,0.95)',
    });
  }

  // fast streaks (punch lines)
  for (let i = 0; i < 12; i++) {
    const ang = rand(-0.15, 0.15);
    particles.push({
      streak: true,
      sx: w / 2 - 70,
      sy: h / 2 + rand(-14, 14),
      ang,
      len: rand(24, 46),
      speed: rand(6, 9),
      life: rand(260, 420),
      color: 'rgba(255,110,80,0.95)',
    });
  }

  // debris
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: w / 2 - 40,
      y: h / 2 + rand(-12, 12),
      vx: rand(2.5, 4.0),
      vy: rand(-1.0, 1.0),
      r: rand(2, 4),
      life: rand(500, 900),
      color: 'rgba(255,160,110,0.95)',
    });
  }
};

const spawnFlying = (w, h) => {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x: w / 2 - 40,
      y: h / 2 - 40,
      vx: rand(1.5, 2.5),
      vy: rand(-0.8, -0.2),
      r: rand(2, 4),
      life: rand(800, 1200),
      color: 'rgba(180,220,255,0.9)',
    });
  }
};

const spawnGround = (w, h) => {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x: w / 2 + rand(-40, 40),
      y: h / 2 + rand(20, 40),
      vx: rand(-0.5, 0.5),
      vy: rand(-2.0, -1.2),
      r: rand(2, 6),
      life: rand(700, 1100),
      color: 'rgba(170,140,90,0.95)',
    });
  }
};

const spawnRock = (w, h) => {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: w / 2 + rand(-20, 20),
      y: h / 2 + rand(-10, 10),
      vx: rand(-1.2, 1.2),
      vy: rand(-1.2, 1.2),
      r: rand(5, 9),
      life: rand(900, 1300),
      color: 'rgba(140,140,150,1)',
    });
  }
};

const spawnBug = (w, h) => {
  for (let i = 0; i < 16; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.sin(i) * rand(1, 2),
      vy: Math.cos(i) * rand(1, 2),
      r: 3,
      life: rand(800, 1200),
      color: 'rgba(160,220,80,0.95)',
    });
  }
};

const spawnGhost = (w, h) => {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: w / 2 + rand(-30, 30),
      y: h / 2 + rand(-30, 30),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      r: rand(10, 18),
      life: rand(900, 1400),
      color: 'rgba(180,140,255,0.3)',
    });
  }
};

const spawnSteel = (w, h) => {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: rand(-1.5, 1.5),
      vy: rand(-1.5, 1.5),
      r: rand(2, 4),
      life: rand(700, 1000),
      color: 'rgba(190,210,230,0.95)',
    });
  }
};

const spawnPsychic = (w, h) => {
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    particles.push({
      x: w / 2 + Math.cos(a) * 10,
      y: h / 2 + Math.sin(a) * 10,
      vx: Math.cos(a) * 1.4,
      vy: Math.sin(a) * 1.4,
      r: 3,
      life: 1000,
      color: 'rgba(255,100,200,0.9)',
    });
  }
};

const spawnIce = (w, h) => {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x: w / 2 + rand(-20, 20),
      y: h / 2 + rand(-10, 10),
      vx: rand(-0.8, 0.8),
      vy: rand(-0.8, 0.8),
      r: rand(3, 5),
      life: rand(900, 1300),
      color: 'rgba(180,230,255,0.95)',
    });
  }
};

const spawnDragon = (w, h) => {
  for (let i = 0; i < 16; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: rand(-2.0, 2.0),
      vy: rand(-1.0, 1.0),
      r: rand(3, 7),
      life: rand(800, 1200),
      color: 'rgba(120,100,255,0.95)',
    });
  }
};

const spawnDark = (w, h) => {
  // dark vortex + ripples (khác hoàn toàn electric)
  // ripples mờ
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: w / 2,
      y: h / 2,
      r: 8,
      vr: 1.6,
      line: true,
      life: 900,
      color: 'rgba(90,90,120,0.6)',
    });
  }
  // spiral inward particles
  for (let i = 0; i < 40; i++) {
    particles.push({
      x0: w / 2,
      y0: h / 2,
      ang: rand(0, Math.PI * 2),
      rad: rand(40, 90),
      vr: rand(0.25, 0.6),
      vang: rand(0.05, 0.12),
      spiral: true,
      r: rand(2, 4),
      life: rand(900, 1400),
      color: 'rgba(120,110,180,0.9)',
    });
  }
};

const spawnFairy = (w, h) => {
  // floating sparkles with twinkle and soft trails
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: w / 2 + rand(-20, 20),
      y: h / 2 + rand(-20, 20),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.2, 0.2),
      r: rand(2, 3.5),
      life: rand(1100, 1600),
      sparkle: true,
      tw: rand(0, Math.PI * 2), // twinkle phase
      color: 'rgba(255,205,240,1)',
    });
  }
};
const spawnByType = () => {
  const w = canvasEl.value.clientWidth;
  const h = canvasEl.value.clientHeight;
  particles = [];
  switch (props.type) {
    case 'fire':
      spawnFire(w, h);
      break;
    case 'water':
      spawnWater(w, h);
      break;
    case 'electric':
      spawnElectric(w, h);
      break;
    case 'grass':
      spawnGrass(w, h);
      break;
    case 'normal':
      spawnNormal(w, h);
      break;
    case 'fighting':
      spawnFighting(w, h);
      break;
    case 'flying':
      spawnFlying(w, h);
      break;
    case 'poison':
      spawnPoison(w, h);
      break;
    case 'ground':
      spawnGround(w, h);
      break;
    case 'rock':
      spawnRock(w, h);
      break;
    case 'bug':
      spawnBug(w, h);
      break;
    case 'ghost':
      spawnGhost(w, h);
      break;
    case 'steel':
      spawnSteel(w, h);
      break;
    case 'psychic':
      spawnPsychic(w, h);
      break;
    case 'ice':
      spawnIce(w, h);
      break;
    case 'dragon':
      spawnDragon(w, h);
      break;
    case 'dark':
      spawnDark(w, h);
      break;
    case 'fairy':
      spawnFairy(w, h);
      break;
    default:
      spawnNeutral(w, h);
  }
};

const draw = t => {
  if (!ctx) return;
  if (!startTs) startTs = t;
  const dt = Math.min(50, t - startTs);
  startTs = t;

  const w = canvasEl.value.clientWidth;
  const h = canvasEl.value.clientHeight;
  ctx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    if (p.line) {
      // ripple circle
      p.r += p.vr || 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, p.life / 900);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }

    if (p.bolt) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = props.type === 'dark' ? 3.2 : 3.5;
      // glow for lightning
      if (props.type === 'electric') {
        ctx.shadowColor = 'rgba(255,255,140,0.9)';
        ctx.shadowBlur = 14;
      } else if (props.type === 'dark') {
        ctx.shadowColor = 'rgba(120,130,220,0.85)';
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      let x = p.x,
        y = p.y;
      ctx.moveTo(x, y);
      for (let k = 0; k < p.path.length; k++) {
        x += p.path[k].dx;
        y += p.path[k].dy;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      // faint flicker
      for (let k = 0; k < p.path.length; k++) {
        p.path[k].dy += rand(-0.6, 0.6);
      }
      if (p.vy) {
        p.y += p.vy;
      }
      continue;
    }

    if (p.streak) {
      // draw motion streak
      const dx = Math.cos(p.ang) * p.len;
      const dy = Math.sin(p.ang) * p.len;
      // head moves forward
      p.sx += Math.cos(p.ang) * p.speed;
      p.sy += Math.sin(p.ang) * p.speed;
      p.len *= 0.92;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = Math.max(0, p.life / 400);
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.sx - dx, p.sy - dy);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }

    if (p.spiral) {
      p.ang += p.vang;
      p.rad = Math.max(0, p.rad - p.vr);
      const sx = p.x0 + Math.cos(p.ang) * p.rad;
      const sy = p.y0 + Math.sin(p.ang) * p.rad;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 1200);
      ctx.arc(sx, sy, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }

    // classic particle
    p.x += p.vx || 0;
    p.y += p.vy || 0;
    ctx.beginPath();
    ctx.fillStyle = p.color;
    if (p.sparkle) {
      // twinkle alpha
      p.tw += 0.12;
      const alpha = 0.6 + Math.sin(p.tw) * 0.4;
      const prevA = ctx.globalAlpha;
      ctx.globalAlpha = Math.max(0.15, alpha);
      // glow
      ctx.shadowColor = 'rgba(255,220,250,0.9)';
      ctx.shadowBlur = 10;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // small cross sparkle
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,230,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x - 4, p.y);
      ctx.lineTo(p.x + 4, p.y);
      ctx.moveTo(p.x, p.y - 4);
      ctx.lineTo(p.x, p.y + 4);
      ctx.stroke();
      ctx.globalAlpha = prevA;
      continue;
    }
    if (p.leaf) {
      ctx.save();
      // wind sway and gravity for leaves
      p.swayA = (p.swayA || 0) + (p.swayV || 0.07);
      const sx = p.x + Math.sin(p.swayA) * (p.swayAmp || 8);
      p.vy += p.g || 0;
      ctx.translate(sx, p.y);
      ctx.rotate((p.rot += p.rotV || 0.02));
      ctx.scale(1.2, 0.8);
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      // slight fade over life for leaves
      const a = Math.max(0.2, p.life / 1500);
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = a;
      ctx.fill();
      ctx.globalAlpha = prev;
      ctx.restore();
    } else {
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // auto-respawn to keep showcasing
  if (particles.length === 0) {
    spawnByType();
  }

  rafId = requestAnimationFrame(draw);
};

const start = () => {
  resize();
  spawnByType();
  cancelAnimationFrame(rafId);
  startTs = 0;
  rafId = requestAnimationFrame(draw);
};

onMounted(() => {
  resize();
  if (props.autoplay) start();
  window.addEventListener('resize', start);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', start);
});

watch(
  () => props.type,
  () => start()
);
</script>

<style scoped>
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
</style>
