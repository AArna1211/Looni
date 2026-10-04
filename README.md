# Looni

A circular step sequencer. A glowing arm sweeps 7 rings; every note it touches
plays a plucked tone and sends out a ripple. No build step, no dependencies.


## Files
| File | Job |
|------|-----|
| `index.html` | Canvas, controls, loads the scripts |
| `style.css`  | Layout and look |
| `audio.js`   | Web Audio: oscillators, envelope, echo, panning |
| `app.js`     | Notes, scales, the sweep, drawing, input |

## The ideas worth understanding
1. **A note is two integers.** `ring` = pitch, `step` = moment in time.
2. **Polar coordinates.** Position = angle from `step`, radius from `ring`. Input just reverses it.
3. **The sweep is a float.** `Math.floor(s)` is the current step; notes fire when it changes.
4. **Accumulate, don't recompute.** `s += dt * speed` means changing speed never causes a jump.
5. **Fade, don't clear.** A translucent fill each frame gives free motion trails.
6. **Audio is a graph.** Oscillator -> envelope -> panner -> master (+ feedback echo).

