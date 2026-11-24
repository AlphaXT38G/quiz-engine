// ── pick.js: which questions a selection gives (no DOM here) ──
// A selection = { chapters: {id: true}, families: {id: true}, limit: 0 (all) or a number }.
// The questions are those of the checked chapters whose type belongs to a checked family,
// shuffled, then cut to the limit. "Everything", "one week", "two chapters and a week": all are
// just sets of checked chapters (select.js checks a week's chapters together).

QZ.pick = {
  // Weeks of the data, in order, each with its chapters: [{week: 1 | null, chapters: [...]}]
  weeks: function (data) {
    var byWeek = {}, order = [];
    data.chapters.forEach(function (c) {
      var k = c.week == null ? "none" : String(c.week);
      if (!byWeek[k]) { byWeek[k] = { week: c.week, chapters: [] }; order.push(k); }
      byWeek[k].chapters.push(c);
    });
    order.sort(function (a, b) {
      if (a === "none") return 1;
      if (b === "none") return -1;
      return +a - +b;
    });
    return order.map(function (k) { return byWeek[k]; });
  },

  // The families present in the data, in their display order, with their question counts
  families: function (data) {
    var n = {};
    data.chapters.forEach(function (c) {
      c.questions.forEach(function (q) { var f = QZ.familyOf(q); if (f) n[f] = (n[f] || 0) + 1; });
    });
    return QZ.familyOrder.filter(function (f) { return n[f]; }).map(function (f) {
      return { id: f, label: QZ.families[f].label, count: n[f] };
    });
  },

  // The questions a selection gives, in chapter order (not shuffled, not limited)
  matching: function (data, sel) {
    var out = [];
    data.chapters.forEach(function (c) {
      if (!sel.chapters[c.id]) return;
      c.questions.forEach(function (q) {
        if (sel.families[QZ.familyOf(q)]) out.push(q);
      });
    });
    return out;
  },

  // What a quiz runs: the matching questions, shuffled, cut to the limit
  draw: function (data, sel) {
    var qs = QZ.shuffle(QZ.pick.matching(data, sel));
    return sel.limit ? qs.slice(0, sel.limit) : qs;
  },

  // Everything checked: the first visit, or the "All" button
  all: function (data) {
    var sel = { chapters: {}, families: {}, limit: 0 };
    data.chapters.forEach(function (c) { sel.chapters[c.id] = true; });
    QZ.pick.families(data).forEach(function (f) { sel.families[f.id] = true; });
    return sel;
  },

  // A remembered selection, cleaned of chapters and families that no longer exist
  restore: function (data, saved) {
    var fresh = QZ.pick.all(data);
    if (!saved || !saved.chapters || !saved.families) return fresh;
    var sel = { chapters: {}, families: {}, limit: saved.limit || 0 };
    Object.keys(fresh.chapters).forEach(function (id) { if (saved.chapters[id]) sel.chapters[id] = true; });
    Object.keys(fresh.families).forEach(function (id) { if (saved.families[id]) sel.families[id] = true; });
    return sel;
  }
};
