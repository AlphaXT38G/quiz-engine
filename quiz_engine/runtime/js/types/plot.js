// ── types/plot.js: plot, draw the curve of a function with the mouse or a finger ──
// Pressing on the canvas starts a new drawing (it replaces the last one: "Clear" too); the
// page does not scroll under the finger (touch-action: none). Graded at 60 x values across the
// range, those where the curve is inside the box: a value is right when the drawing passes within
// `tolerance` (share of the y range, 0.06 by default) of the curve there. 85 % of them right is a
// full point (a hand is not a plotter); below, the share. Revealed: the curve and its tolerance
// band over the drawing.

QZ.family("plot", "Graphs", 50);

QZ.type("plot", {
  family: "plot",
  label: "Draw the curve",
  render: function (q, ctx) {
    var f = QZ.expr(q.fn), tol = (q.tolerance || 0.06) * (q.y[1] - q.y[0]);
    var stroke = [], drawing = false, locked = false, result = null;
    var canvas = QZ.el("canvas", "qz-plot-canvas");
    canvas.setAttribute("aria-label", "Drawing area: draw the curve");
    var view = QZ.plotCanvas(canvas, q);
    var clear = QZ.button("qz-link qz-plot-clear", "Clear", function () { stroke = []; paint(); ctx.changed(); });
    var wrap = QZ.el("div", "qz-plot", [canvas, QZ.el("div", "qz-plot-bar", [QZ.el("span", "qz-plot-hint", ["Draw with the mouse or a finger"]), clear])]);

    // The true curve, sampled finely, with pen lifts where it leaves the box or is undefined
    function curve(shift) {
      var pts = [], n = 240;
      for (var k = 0; k <= n; k++) {
        var x = q.x[0] + (q.x[1] - q.x[0]) * k / n, y = f(x) + (shift || 0);
        pts.push(isFinite(y) && y > q.y[0] - (q.y[1] - q.y[0]) && y < q.y[1] + (q.y[1] - q.y[0]) ? [x, y] : null);
      }
      return pts;
    }

    function paint() {
      var layers = [];
      if (result !== null) {
        var good = view.color("--qz-good");
        layers.push({ pts: curve(tol), color: view.color("--qz-good-bg"), width: 1.5, dash: [4, 4] });
        layers.push({ pts: curve(-tol), color: view.color("--qz-good-bg"), width: 1.5, dash: [4, 4] });
        layers.push({ pts: curve(), color: good, width: 3 });
      }
      layers.push({ pts: stroke, color: view.color(result !== null && result < 1 ? "--qz-bad" : "--qz-acc"), width: 3.5 });
      view.paint(layers);
    }

    function fit() {
      if (!wrap.isConnected) { window.removeEventListener("resize", fit); return; }
      view.size(canvas.parentNode.clientWidth);
      paint();
    }
    window.addEventListener("resize", fit);
    requestAnimationFrame(fit);

    function at(e) {
      var r = canvas.getBoundingClientRect();
      return view.math(e.clientX - r.left, e.clientY - r.top);
    }
    canvas.addEventListener("pointerdown", function (e) {
      if (locked || e.button > 0) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}  // no capture: the drawing still works inside the canvas
      drawing = true; stroke = [at(e)];
      e.preventDefault();
      paint();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      stroke.push(at(e));
      paint();
    });
    function end() { if (drawing) { drawing = false; ctx.changed(); } }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    // The drawing's height at x: the mean of its points near x, or null where it does not pass
    function drawnAt(x, half) {
      var sum = 0, n = 0;
      stroke.forEach(function (p) { if (Math.abs(p[0] - x) <= half) { sum += p[1]; n++; } });
      return n ? sum / n : null;
    }

    return {
      node: wrap,
      ready: function () { return stroke.length >= 5; },
      grade: function () {
        var n = 60, half = (q.x[1] - q.x[0]) / n, seen = 0, good = 0;
        for (var k = 0; k <= n; k++) {
          var x = q.x[0] + (q.x[1] - q.x[0]) * k / n, y = f(x);
          if (!isFinite(y) || y < q.y[0] || y > q.y[1]) continue;  // the curve is out of the box there
          seen++;
          var d = drawnAt(x, half);
          if (d != null && Math.abs(d - y) <= tol) good++;
        }
        var share = seen ? good / seen : 0;
        result = share >= 0.85 ? 1 : share;
        return result;
      },
      reveal: function () {
        locked = true;
        canvas.classList.add("is-locked");
        clear.disabled = true;
        paint();
      }
    };
  }
});
