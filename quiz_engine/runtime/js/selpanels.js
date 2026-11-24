// ── selpanels.js: the panels of the selection screen (select.js puts them together) ──
// Each panel is made by QZ.selPanels.<name>(view, changed) and returns { node, refresh() }:
// a click changes view.sel and calls changed(); refresh() makes the panel show view.sel again.
//   content   the weeks, each with its chapters (a week's box checks all its chapters, so
//             "everything", "a week", "a chapter" or any mix are the same gesture), All / None
//   kinds     one chip per family of exercise present in the quiz
//   length    10, 20 or all the questions

QZ.selPanels = {};

QZ.panel = function (title, extra, body) {
  return QZ.el("div", "qz-panel", [QZ.el("div", "qz-panel-head", [QZ.el("h3", null, [title])].concat(extra)), body]);
};

QZ.selPanels.content = function (view, changed) {
  var data = view.data, sel = view.sel, rows = [], weeks = [];
  function countIn(chapter) {
    return chapter.questions.filter(function (q) { return sel.families[QZ.familyOf(q)]; }).length;
  }
  function setChapters(chapters, on) {
    chapters.forEach(function (c) { if (on) sel.chapters[c.id] = true; else delete sel.chapters[c.id]; });
    changed();
  }
  function check(label, onChange) {
    var box = QZ.el("input"), count = QZ.el("span", "qz-pill");
    box.type = "checkbox";
    box.addEventListener("change", function () { onChange(box.checked); });
    return { label: QZ.el("label", "qz-check", [box, QZ.el("span", "qz-check-text", [label]), count]), box: box, count: count };
  }
  function chapterRow(c, label) {
    var ch = check(label, function (on) { setChapters([c], on); });
    rows.push({ chapter: c, box: ch.box, count: ch.count });
    return ch.label;
  }

  var list = QZ.el("div", "qz-weeks");
  QZ.pick.weeks(data).forEach(function (w) {
    var name = w.week == null ? "Other" : "Week " + w.week;
    if (w.chapters.length === 1) {  // one chapter: one row, "Week 3 · Its title"
      var c = w.chapters[0];
      list.appendChild(QZ.el("div", "qz-week", [chapterRow(c, c.title === c.id ? name : name + " · " + c.title)]));
      return;
    }
    var head = check(name, function (on) { setChapters(w.chapters, on); });
    head.label.classList.add("qz-week-head");
    weeks.push({ box: head.box, count: head.count, chapters: w.chapters });
    list.appendChild(QZ.el("div", "qz-week", [head.label, QZ.el("div", "qz-chapters", w.chapters.map(function (c) { return chapterRow(c, c.title); }))]));
  });

  return {
    node: QZ.panel("Content", [
      QZ.button("qz-link", "All", function () { setChapters(data.chapters, true); }),
      QZ.button("qz-link", "None", function () { setChapters(data.chapters, false); })
    ], list),
    refresh: function () {
      rows.forEach(function (r) {
        r.box.checked = !!sel.chapters[r.chapter.id];
        r.count.textContent = String(countIn(r.chapter));
      });
      weeks.forEach(function (w) {
        var n = w.chapters.filter(function (c) { return sel.chapters[c.id]; }).length;
        w.box.checked = n === w.chapters.length;
        w.box.indeterminate = n > 0 && n < w.chapters.length;
        w.count.textContent = String(w.chapters.reduce(function (s, c) { return s + countIn(c); }, 0));
      });
    }
  };
};

QZ.selPanels.kinds = function (view, changed) {
  var sel = view.sel, chips = [];
  var box = QZ.el("div", "qz-chips");
  QZ.pick.families(view.data).forEach(function (f) {
    var chip = QZ.button("qz-chip", "", function () {
      if (sel.families[f.id]) delete sel.families[f.id]; else sel.families[f.id] = true;
      changed();
    });
    chip.appendChild(QZ.el("span", null, [f.label]));
    chips.push({ id: f.id, el: chip });
    box.appendChild(chip);
  });
  return {
    node: QZ.panel("Exercises", [], box),
    refresh: function () {
      chips.forEach(function (c) {
        var on = !!sel.families[c.id];
        c.el.classList.toggle("is-on", on);
        c.el.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  };
};

QZ.selPanels.length = function (view, changed) {
  var sel = view.sel;
  var segs = [10, 20, 0].map(function (n) {
    return { n: n, el: QZ.button("qz-seg", n ? String(n) : "All", function () { sel.limit = n; changed(); }) };
  });
  return {
    node: QZ.panel("Length", [], QZ.el("div", "qz-segs", segs.map(function (s) { return s.el; }))),
    refresh: function () {
      segs.forEach(function (s) { s.el.classList.toggle("is-on", (sel.limit || 0) === s.n); });
    }
  };
};
