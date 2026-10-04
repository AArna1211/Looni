// app.js - state, drawing, input. Depends on audio.js (LoomAudio).

// ---------- 1. Musical model ----------
const N = 16;          // steps around the circle (time)
const RINGS = 7;       // rings (pitch)
const ROOT = 220;      // A3, in Hz

// Scales as semitone offsets from the root, one per ring (low to high).
// EXPERIMENT: add your own here, it appears in the dropdown automatically.
const SCALES = {
  'Minor pentatonic': [0, 3, 5, 7, 10, 12, 15],
  'Major pentatonic': [0, 2, 4, 7, 9, 12, 14],
  'Dorian':           [0, 2, 3, 5, 7, 9, 10],
  'Whole tone':       [0, 2, 4, 6, 8, 10, 12],
};
let scale = SCALES['Minor pentatonic'];
// Ring 0 is the innermost ring and gets the highest pitch.
const freqOf = ring => ROOT * Math.pow(2, scale[RINGS - 1 - ring] / 12);

// A note is just {ring, step, pulse}. pulse is a visual flash that decays.
let nodes = [[0,6],[1,12],[2,0],[2,8],[3,4],[3,12],[4,10],[5,2],[6,0],[6,8]]
  .map(([ring, step]) => ({ ring, step, pulse: 0 }));
let ripples = [];

// ---------- 2. Canvas + geometry ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const hint = document.getElementById('hint');
let W, H, cx, cy, base;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);       // draw in CSS pixels
  cx = W / 2; cy = H / 2 - 10; base = Math.min(W, H - 110) / 2 * 0.94;
}
addEventListener('resize', resize); resize();

const hue = i => 340 - (i / (RINGS - 1)) * 145;               // pink -> ice
const rad = i => base * (0.26 + 0.74 * i / (RINGS - 1));       // ring radius
const stepAngle = s => s / N * Math.PI * 2 - Math.PI / 2;      // step 0 at the top
function pos(n) {
  const a = stepAngle(n.step), r = rad(n.ring);
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

// ---------- 3. Playing a note ----------
function trigger(n) {
  n.pulse = 1;
  const p = pos(n);
  LoomAudio.pluck(freqOf(n.ring), (p.x - cx) / base);
  ripples.push({ x: p.x, y: p.y, r: 6, a: 0.8, h: hue(n.ring) });
  if (ripples.length > 60) ripples.shift();
}

// ---------- 4. The sweep + draw loop ----------
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let rpm = 7.5, s = 0, lastStep = -1, prev = performance.now();

function frame(now) {
  // Accumulate position (instead of using raw time) so changing speed never makes it jump.
  const dt = Math.min((now - prev) / 1000, 0.1); prev = now;
  s = (s + dt * (calm ? rpm / 2 : rpm) / 60 * N) % N;

  // Fire notes only when the integer step changes: each note plays exactly once per pass.
  const cur = Math.floor(s);
  if (cur !== lastStep) { lastStep = cur; nodes.forEach(n => { if (n.step === cur) trigger(n); }); }
  const theta = s / N * Math.PI * 2 - Math.PI / 2;

  // Paint a see-through background instead of clearing: old frames fade = free trails.
  ctx.fillStyle = 'rgba(12,10,36,.28)'; ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1;
  for (let i = 0; i < RINGS; i++) {                           // rings
    ctx.strokeStyle = `hsla(${hue(i)},70%,80%,.16)`;
    ctx.beginPath(); ctx.arc(cx, cy, rad(i), 0, 7); ctx.stroke();
  }
  for (let k = 0; k < N; k++) {                               // spokes (every 4th brighter)
    const a = stepAngle(k);
    ctx.strokeStyle = `rgba(232,236,255,${k % 4 === 0 ? .2 : .07})`;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rad(0) * .9, cy + Math.sin(a) * rad(0) * .9);
    ctx.lineTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base); ctx.stroke();
  }
  ctx.lineWidth = 2;
  for (let j = 0; j < 28; j++) {                              // arm + fading tail
    const a = theta - j * 0.022;
    ctx.strokeStyle = `rgba(255,236,245,${(.5 * (1 - j / 28)).toFixed(3)})`;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * base * 1.02, cy + Math.sin(a) * base * 1.02); ctx.stroke();
  }
  ctx.lineWidth = 1;
  for (let q = ripples.length - 1; q >= 0; q--) {             // ripples grow and fade
    const r = ripples[q]; r.r += 2.2; r.a *= 0.965;
    if (r.a < 0.01) { ripples.splice(q, 1); continue; }
    ctx.strokeStyle = `hsla(${r.h},90%,75%,${r.a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
  }
  for (const n of nodes) {                                    // notes
    const p = pos(n); n.pulse *= 0.93;
    const c = `hsl(${hue(n.ring)},90%,${68 + n.pulse * 18}%)`;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = n.pulse > .02 ? 28 * n.pulse : 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 + n.pulse * 9, 0, 7); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,236,245,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- 5. Input: screen -> (ring, step) ----------
cv.addEventListener('pointerdown', e => {
  LoomAudio.init();
  const x = e.clientX - cx, y = e.clientY - cy, d = Math.hypot(x, y);
  const ring = Math.round((d / base - 0.26) / 0.74 * (RINGS - 1));
  if (ring < 0 || ring >= RINGS || Math.abs(d - rad(ring)) > base * 0.06) return;  // missed
  let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
  const step = Math.round(a / (Math.PI * 2) * N) % N;
  const i = nodes.findIndex(n => n.ring === ring && n.step === step);
  if (i >= 0) { nodes.splice(i, 1); return; }
  const n = { ring, step, pulse: 1 }; nodes.push(n);
  LoomAudio.pluck(freqOf(ring), (pos(n).x - cx) / base);   // preview the note you placed
  hint.style.opacity = 0;
});

// ---------- 6. Controls ----------
const sel = document.getElementById('scale');
Object.keys(SCALES).forEach(name => sel.add(new Option(name, name)));
sel.onchange = () => { scale = SCALES[sel.value]; };
document.getElementById('tempo').oninput = e => { rpm = +e.target.value; };
document.getElementById('clear').onclick = () => { nodes = []; };
