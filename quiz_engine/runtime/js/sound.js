// ── sound.js: the quiz's sound effects, made with Web Audio (no file to load) ──
// QZ.sound.play("good" | "bad" | "partial" | "streak" | "pick" | "done", score)
// The context is made on first use: the quiz opens from a click, so it is allowed to play.
// A mute toggle (view.js) is remembered in localStorage (qz-sound).

QZ.sound = (function () {
  var ctx = null;
  var on = QZ.store.get("sound", true);

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }

  // One note: frequency (Hz), start (s from now), length (s), wave, loudness
  function tone(ac, freq, at, len, wave, vol, slideTo) {
    var t = ac.currentTime + at;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = wave || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + len + 0.02);
  }

  var SOUNDS = {
    pick: function (ac) { tone(ac, 660, 0, 0.06, "triangle", 0.06); },
    good: function (ac) { tone(ac, 660, 0, 0.12, "sine"); tone(ac, 990, 0.09, 0.22, "sine"); },
    partial: function (ac) { tone(ac, 520, 0, 0.14, "triangle", 0.14); tone(ac, 620, 0.1, 0.2, "triangle", 0.12); },
    bad: function (ac) { tone(ac, 220, 0, 0.28, "sawtooth", 0.07, 140); },
    streak: function (ac) {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(ac, f, i * 0.07, 0.18, "square", 0.05); });
    },
    // The end: a fanfare as bright as the score (0 to 1)
    done: function (ac, score) {
      var notes = score >= 0.8 ? [523, 659, 784, 1047, 784, 1047] : score >= 0.5 ? [440, 554, 659, 880] : [392, 349, 330, 262];
      notes.forEach(function (f, i) { tone(ac, f, i * 0.11, 0.3, "triangle", 0.12); });
    }
  };

  return {
    play: function (name, score) {
      if (!on || !SOUNDS[name]) return;
      var ac = audio();
      if (!ac) return;
      if (ac.state === "suspended" && ac.resume) ac.resume();
      SOUNDS[name](ac, score);
    },
    isOn: function () { return on; },
    toggle: function () { on = !on; QZ.store.set("sound", on); return on; }
  };
})();
