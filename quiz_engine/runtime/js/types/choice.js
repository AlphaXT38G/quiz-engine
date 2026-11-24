// ── types/choice.js: scq (one right option) and mcq (several right options) ──
// Options are shuffled unless the question says "shuffle": false. Digits 1-9 pick an option.
// mcq scores partly: (right picks - wrong picks) / right options, at least 0.

QZ.family("choice", "Multiple choice", 10);

QZ.choiceRender = function (q, ctx, multi) {
  var right = multi ? q.answer : [q.answer];
  var order = q.shuffle === false ? q.options.map(function (_, i) { return i; }) : QZ.shuffle(q.options.map(function (_, i) { return i; }));
  var picked = {};
  var locked = false;

  var list = QZ.el("div", "qz-options" + (multi ? " qz-multi" : ""));
  list.setAttribute("role", multi ? "group" : "radiogroup");
  var rows = order.map(function (orig, i) {
    var row = QZ.el("button", "qz-opt", [QZ.el("span", "qz-opt-key", [String(i + 1)]), QZ.block("span", "qz-opt-text", q.options[orig])]);
    row.type = "button";
    row.setAttribute("role", multi ? "checkbox" : "radio");
    row.setAttribute("aria-checked", "false");
    row.addEventListener("click", function () { toggle(orig); });
    row.qzOrig = orig;
    list.appendChild(row);
    return row;
  });

  function toggle(orig) {
    if (locked) return;
    if (!multi) picked = {};
    picked[orig] = !picked[orig];
    rows.forEach(function (r) {
      var on = !!picked[r.qzOrig];
      r.classList.toggle("is-picked", on);
      r.setAttribute("aria-checked", on ? "true" : "false");
    });
    ctx.sound.play("pick");
    ctx.changed();
  }

  return {
    node: list,
    ready: function () { return Object.keys(picked).some(function (k) { return picked[k]; }); },
    grade: function () {
      var hits = 0, misses = 0;
      Object.keys(picked).forEach(function (k) {
        if (!picked[k]) return;
        if (right.indexOf(+k) >= 0) hits++; else misses++;
      });
      if (!multi) return hits ? 1 : 0;
      return Math.max(0, (hits - misses) / right.length);
    },
    reveal: function () {
      locked = true;
      rows.forEach(function (r) {
        var isRight = right.indexOf(r.qzOrig) >= 0, was = !!picked[r.qzOrig];
        r.disabled = true;
        if (isRight && was) r.classList.add("is-right");
        else if (was) r.classList.add("is-wrong");
        else if (isRight) r.classList.add("is-missed");
      });
    },
    key: function (e) {
      var n = parseInt(e.key, 10);
      if (!(n >= 1 && n <= rows.length)) return false;
      toggle(rows[n - 1].qzOrig);
      return true;
    }
  };
};

QZ.type("scq", { family: "choice", label: "Single choice", render: function (q, ctx) { return QZ.choiceRender(q, ctx, false); } });
QZ.type("mcq", { family: "choice", label: "Multiple answers", render: function (q, ctx) { return QZ.choiceRender(q, ctx, true); } });
