// ── plotdraw.js: the drawing of a plot question's canvas (types/plot.js) ──
// QZ.plotCanvas(canvas, spec) -> { size(width), px(x, y), math(px, py), paint(layers) }
// spec = { x: [min, max], y: [min, max] }. The grid steps are round (1, 2 or 5 x 10^k), the
// axes are drawn where x = 0 and y = 0 fall inside, the colours are the quiz's tokens, read on
// the canvas itself (so a screen's colours apply). Sharp on high-density screens (devicePixelRatio).

QZ.niceStep = function (range) {
  var raw = range / 8, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), r = raw / mag;
  return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * mag;
};

QZ.plotCanvas = function (canvas, spec) {
  var g = canvas.getContext("2d"), W = 0, H = 0, PAD = 28;
  var x0 = spec.x[0], x1 = spec.x[1], y0 = spec.y[0], y1 = spec.y[1];

  function px(x, y) { return [PAD + (x - x0) / (x1 - x0) * (W - 2 * PAD), H - PAD - (y - y0) / (y1 - y0) * (H - 2 * PAD)]; }
  function math(X, Y) { return [x0 + (X - PAD) / (W - 2 * PAD) * (x1 - x0), y0 + (H - PAD - Y) / (H - 2 * PAD) * (y1 - y0)]; }
  function color(name) { return getComputedStyle(canvas).getPropertyValue(name).trim() || "#888"; }
  function fmt(v) { return String(Math.round(v * 1000) / 1000); }

  function grid() {
    var line = color("--qz-line"), mut = color("--qz-mut"), fg = color("--qz-fg");
    g.lineWidth = 1;
    g.font = "11px system-ui, sans-serif";
    g.fillStyle = mut;
    var sx = QZ.niceStep(x1 - x0), sy = QZ.niceStep(y1 - y0), v, p;
    g.strokeStyle = line;
    g.textAlign = "center"; g.textBaseline = "top";
    for (v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) {
      p = px(v, 0);
      g.beginPath(); g.moveTo(p[0], PAD); g.lineTo(p[0], H - PAD); g.stroke();
      g.fillText(fmt(v), p[0], H - PAD + 6);
    }
    g.textAlign = "right"; g.textBaseline = "middle";
    for (v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) {
      p = px(0, v);
      g.beginPath(); g.moveTo(PAD, p[1]); g.lineTo(W - PAD, p[1]); g.stroke();
      g.fillText(fmt(v), PAD - 5, p[1]);
    }
    g.strokeStyle = fg; g.lineWidth = 1.5;   // the axes, where 0 is in sight
    if (x0 <= 0 && x1 >= 0) { p = px(0, 0); g.beginPath(); g.moveTo(p[0], PAD); g.lineTo(p[0], H - PAD); g.stroke(); }
    if (y0 <= 0 && y1 >= 0) { p = px(0, 0); g.beginPath(); g.moveTo(PAD, p[1]); g.lineTo(W - PAD, p[1]); g.stroke(); }
  }

  // A polyline of math points; a null point lifts the pen
  function line(pts, stroke, width, dash) {
    g.save();
    g.beginPath(); g.rect(PAD, PAD, W - 2 * PAD, H - 2 * PAD); g.clip();
    g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = g.lineCap = "round";
    if (dash) g.setLineDash(dash);
    g.beginPath();
    var up = true;
    pts.forEach(function (pt) {
      if (!pt) { up = true; return; }
      var p = px(pt[0], pt[1]);
      if (up) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
      up = false;
    });
    g.stroke();
    g.restore();
  }

  return {
    px: px,
    math: math,
    color: color,
    size: function (width) {
      var dpr = window.devicePixelRatio || 1;
      W = Math.round(width); H = Math.round(Math.min(width * 0.72, 440));
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    // layers: [{ pts, color, width, dash }], painted in order over the grid
    paint: function (layers) {
      g.clearRect(0, 0, W, H);
      grid();
      layers.forEach(function (l) { if (l.pts.length) line(l.pts, l.color, l.width, l.dash); });
    }
  };
};
