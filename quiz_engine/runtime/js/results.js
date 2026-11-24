// ── results.js: the end of a quiz ──
// The score (partial answers count partly), a word for it, the score per kind of exercise, and
// two ways on: the missed questions again (those not fully right), or back to the selection.
// view = { again(questions), toSelect() } (view.js)

QZ.results = function (view, host, results) {
  var total = results.reduce(function (s, r) { return s + r.score; }, 0);
  var ratio = results.length ? total / results.length : 0;
  var pct = Math.round(ratio * 100);
  var word = pct === 100 ? "Perfect!" : pct >= 80 ? "Great job" : pct >= 60 ? "Not bad" : pct >= 40 ? "Keep going" : "Time to review";

  // Per family: points / questions
  var per = {};
  results.forEach(function (r) {
    var f = QZ.familyOf(r.q);
    per[f] = per[f] || { pts: 0, n: 0 };
    per[f].pts += r.score; per[f].n++;
  });
  var rows = QZ.familyOrder.filter(function (f) { return per[f]; }).map(function (f) {
    var p = per[f], bar = QZ.el("div", "qz-bar-fill");
    bar.style.transform = "scaleX(" + (p.pts / p.n) + ")";
    return QZ.el("div", "qz-family-row", [
      QZ.el("span", "qz-family-name", [QZ.families[f].label]),
      QZ.el("div", "qz-bar", [bar]),
      QZ.el("span", "qz-family-score", [(Math.round(p.pts * 10) / 10) + " / " + p.n])
    ]);
  });

  var missed = results.filter(function (r) { return r.score < 1; }).map(function (r) { return r.q; });
  var ring = QZ.el("div", "qz-ring", [QZ.el("span", "qz-ring-pct", [pct + "%"])]);
  ring.style.setProperty("--qz-pct", String(pct));

  host.appendChild(QZ.el("div", "qz-results", [
    ring,
    QZ.el("h2", "qz-results-word", [word]),
    QZ.el("p", "qz-results-sub", [(Math.round(total * 10) / 10) + " / " + results.length + " points"]),
    rows.length > 1 ? QZ.el("div", "qz-families", rows) : null,
    QZ.el("div", "qz-results-actions", [
      missed.length ? QZ.button("qz-btn qz-btn-primary", "Retry the " + missed.length + " missed", function () { view.again(QZ.shuffle(missed)); }) : null,
      QZ.button("qz-btn", "New quiz", function () { view.toSelect(); })
    ])
  ]));
  QZ.sound.play("done", ratio);
  return { key: function () { return false; } };
};
