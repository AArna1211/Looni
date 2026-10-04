// audio.js - everything that makes sound. Exposes one global: LoomAudio.
const LoomAudio = (() => {
  let ac = null, master, delayIn;

  // Must be called from a user gesture (a tap), or browsers keep audio blocked.
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.3; master.connect(ac.destination);

    // Echo: delay -> low-pass -> feedback gain -> back into the delay.
    // Feedback must stay below 1 or the echo grows forever.
    delayIn = ac.createGain();
    const delay = ac.createDelay(1);  delay.delayTime.value = 0.375;
    const fb = ac.createGain();       fb.gain.value = 0.38;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    delayIn.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
    lp.connect(master);
  }

  // One note: two oscillators -> envelope -> (panner) -> master + echo.
  function pluck(freq, pan = 0) {
    if (!ac) return;
    const now = ac.currentTime;
    const env = ac.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.012);        // fast attack
    env.gain.exponentialRampToValueAtTime(0.0008, now + 1.8);  // long decay (can't reach 0)

    const o1 = ac.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    const o2 = ac.createOscillator(); o2.type = 'sine';     o2.frequency.value = freq * 2;
    const g2 = ac.createGain(); g2.gain.value = 0.25;          // quiet octave = shimmer
    o1.connect(env); o2.connect(g2); g2.connect(env);

    let out = env;
    if (ac.createStereoPanner) {
      const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
      env.connect(p); out = p;
    }
    out.connect(master); out.connect(delayIn);
    o1.start(now); o2.start(now); o1.stop(now + 2); o2.stop(now + 2);  // always stop oscillators
  }

  return { init, pluck };
})();
