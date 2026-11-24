// ── select.js: the first screen, choosing what the quiz is about ──
// It only puts the parts together: the launch zone at the top (launch.js: the count and Start),
// then the panels (selpanels.js: content, kinds of exercise, length). Every change goes through
// changed(): all of them show view.sel again, and the selection is remembered (view.saveSel).
// Start runs QZ.pick.draw(). view = { data, sel, start(questions), saveSel() } (view.js)

QZ.select = function (view, host) {
  var data = view.data, sel = view.sel;
  var launch = QZ.launch(function () {
    var qs = QZ.pick.draw(data, sel);
    if (qs.length) view.start(qs);
  });
  var panels = ["content", "kinds", "length"].map(function (name) { return QZ.selPanels[name](view, changed); });

  // "Week 1 · 2 kinds of exercise", "All the content · every kind of exercise"
  function summary() {
    var chapters = data.chapters.filter(function (c) { return sel.chapters[c.id]; });
    var weeks = {};
    chapters.forEach(function (c) { weeks[c.week == null ? "Other" : "Week " + c.week] = true; });
    var w = Object.keys(weeks);
    var what = chapters.length === data.chapters.length ? "All the content" : w.length <= 2 ? w.join(", ") : chapters.length + " chapters";
    var fams = QZ.pick.families(data), on = fams.filter(function (f) { return sel.families[f.id]; });
    var kinds = on.length === fams.length ? "every kind of exercise" : on.length === 1 ? on[0].label : on.length + " kinds of exercise";
    return what + " · " + kinds;
  }

  function changed() {
    panels.forEach(function (p) { p.refresh(); });
    var n = QZ.pick.matching(data, sel).length;
    launch.update(sel.limit ? Math.min(sel.limit, n) : n, summary());
    view.saveSel();
  }

  host.appendChild(QZ.el("div", "qz-select", [launch.node].concat(panels.map(function (p) { return p.node; }))));
  changed();
  return { key: launch.key };
};
