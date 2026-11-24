// ── select.js: the first screen, choosing what the quiz is about ──
// Three panels: the content (weeks, each with its chapters: a week's box checks all its
// chapters, so "everything", "a week", "a chapter" or any mix are the same gesture), the kinds
// of exercise (one chip per family present), the length (10, 20, all). The count of questions
// follows every change; Start runs QZ.pick.draw(). The selection is remembered per subject.
// view = { data, sel, start(questions), saveSel() } (view.js)

QZ.select = function (view, host) {
  var data = view.data, sel = view.sel;
  var weekBoxes = [], chapterRows = [], familyChips = [];
  var countEl = QZ.el("span", "qz-count");
  var startBtn = QZ.button("qz-btn qz-btn-primary qz-start", "Start", function () {
    var qs = QZ.pick.draw(data, sel);
    if (qs.length) view.start(qs);
  });

  function countIn(chapter) {
    return chapter.questions.filter(function (q) { return sel.families[QZ.familyOf(q)]; }).length;
  }

  // Everything on screen follows `sel`: boxes, week tri-states, counts, Start
  function refresh() {
    chapterRows.forEach(function (r) {
      r.box.checked = !!sel.chapters[r.chapter.id];
      r.count.textContent = String(countIn(r.chapter));
    });
    weekBoxes.forEach(function (w) {
      var n = w.chapters.filter(function (c) { return sel.chapters[c.id]; }).length;
      w.box.checked = n === w.chapters.length;
      w.box.indeterminate = n > 0 && n < w.chapters.length;
      if (w.count) w.count.textContent = String(w.chapters.reduce(function (s, c) { return s + countIn(c); }, 0));
    });
    familyChips.forEach(function (c) {
      var on = !!sel.families[c.id];
      c.el.classList.toggle("is-on", on);
      c.el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    lengthBtns.forEach(function (b) { b.el.classList.toggle("is-on", (sel.limit || 0) === b.n); });
    var n = QZ.pick.matching(data, sel).length;
    var runs = sel.limit ? Math.min(sel.limit, n) : n;
    countEl.textContent = runs + " question" + (runs === 1 ? "" : "s");
    startBtn.disabled = runs === 0;
    view.saveSel();
  }

  function check(label, count, onChange) {
    var box = QZ.el("input");
    box.type = "checkbox";
    box.addEventListener("change", function () { onChange(box.checked); refresh(); });
    var lab = QZ.el("label", "qz-check", [box, QZ.el("span", "qz-check-text", [label]), count]);
    return { label: lab, box: box };
  }

  function chapterRow(c, label) {
    var count = QZ.el("span", "qz-pill");
    var ch = check(label, count, function (on) { if (on) sel.chapters[c.id] = true; else delete sel.chapters[c.id]; });
    chapterRows.push({ chapter: c, box: ch.box, count: count });
    return ch.label;
  }

  // ── Content: weeks and chapters ──
  var weeksEl = QZ.el("div", "qz-weeks");
  QZ.pick.weeks(data).forEach(function (w) {
    var name = w.week == null ? "Other" : "Week " + w.week;
    if (w.chapters.length === 1) {  // one chapter: one row, "Week 3 · Its title"
      var c = w.chapters[0];
      weeksEl.appendChild(QZ.el("div", "qz-week", [chapterRow(c, c.title === c.id ? name : name + " · " + c.title)]));
      return;
    }
    var count = QZ.el("span", "qz-pill");
    var head = check(name, count, function (on) {
      w.chapters.forEach(function (c) { if (on) sel.chapters[c.id] = true; else delete sel.chapters[c.id]; });
    });
    head.label.classList.add("qz-week-head");
    weekBoxes.push({ box: head.box, chapters: w.chapters, count: count });
    var kids = QZ.el("div", "qz-chapters", w.chapters.map(function (c) { return chapterRow(c, c.title); }));
    weeksEl.appendChild(QZ.el("div", "qz-week", [head.label, kids]));
  });
  var setAll = function (on) {
    data.chapters.forEach(function (c) { if (on) sel.chapters[c.id] = true; else delete sel.chapters[c.id]; });
    refresh();
  };
  var contentHead = QZ.el("div", "qz-panel-head", [
    QZ.el("h3", null, ["Content"]),
    QZ.button("qz-link", "All", function () { setAll(true); }),
    QZ.button("qz-link", "None", function () { setAll(false); })
  ]);

  // ── Kinds of exercise ──
  var chipsEl = QZ.el("div", "qz-chips");
  QZ.pick.families(data).forEach(function (f) {
    var chip = QZ.button("qz-chip", "", function () {
      if (sel.families[f.id]) delete sel.families[f.id]; else sel.families[f.id] = true;
      refresh();
    });
    chip.appendChild(QZ.el("span", null, [f.label]));
    familyChips.push({ id: f.id, el: chip });
    chipsEl.appendChild(chip);
  });

  // ── Length ──
  var lengthBtns = [10, 20, 0].map(function (n) {
    var b = QZ.button("qz-seg", n ? String(n) : "All", function () { sel.limit = n; refresh(); });
    return { n: n, el: b };
  });

  host.appendChild(QZ.el("div", "qz-select", [
    QZ.el("div", "qz-panel", [contentHead, weeksEl]),
    QZ.el("div", "qz-panel", [QZ.el("div", "qz-panel-head", [QZ.el("h3", null, ["Exercises"])]), chipsEl]),
    QZ.el("div", "qz-panel", [
      QZ.el("div", "qz-panel-head", [QZ.el("h3", null, ["Length"])]),
      QZ.el("div", "qz-segs", lengthBtns.map(function (b) { return b.el; }))
    ]),
    QZ.el("div", "qz-start-bar", [countEl, startBtn])
  ]));
  refresh();
  // Enter starts, unless the focus is on a control that Enter already works (a box, a chip)
  return {
    key: function (e) {
      var free = !e.target.tagName || e.target === document.body;
      if (e.key === "Enter" && free && !startBtn.disabled) { startBtn.click(); return true; }
      return false;
    }
  };
};
