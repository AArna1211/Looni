# Looni

A circular step sequencer. A glowing arm sweeps 7 rings; every note it touches
plays a plucked tone and sends out a ripple. No build step, no dependencies.

## Run it
Double-click `index.html`. (Or serve the folder: `python3 -m http.server`.)
Tap once anywhere to unlock audio.

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

## Build-it-yourself challenges (easy -> hard)
1. Change `PERIOD`-like feel: set the slider's default in `index.html`.
2. Add a scale to `SCALES` (try Phrygian: `[0,1,3,5,7,8,10]`).
3. Change `N` to 12 or 8 for a different rhythmic feel. Everything adapts.
4. Add a velocity: make notes quieter near the outer rings (pass a gain into `pluck`).
5. Add a second arm moving at half speed, firing its own notes.
6. Save the pattern in `localStorage` and restore it on load.
7. Add a "randomize" button that places notes with a probability per step.
8. Replace the oscillator pluck with a Karplus-Strong string (noise burst + delay loop).
