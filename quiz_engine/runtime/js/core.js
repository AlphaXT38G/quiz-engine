// ── core.js: the namespace, DOM helpers, the type and family registries ──
// Every runtime file shares this scope (bundle.py wraps them in one function) and reaches the
// others through QZ. Only view.js puts something on window: QuizEngine.

var QZ = { types: {}, families: {}, familyOrder: [] };

// el("div", "qz-card", [child, "text", ...]): an element with a class and children (strings
// become text nodes, never HTML: the quiz content goes through QZ.rich, text.js)
QZ.el = function (tag, cls, kids) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  (kids || []).forEach(function (k) {
    if (k == null || k === false) return;
    e.appendChild(typeof k === "string" ? document.createTextNode(k) : k);
  });
  return e;
};

// A button: a real <button type="button">, so Enter / Space and the focus ring come for free
QZ.button = function (cls, label, onClick) {
  var b = QZ.el("button", cls, [label]);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
};

QZ.shuffle = function (arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

// localStorage can throw (private mode, blocked storage): never let it break the quiz
QZ.store = {
  get: function (key, fallback) {
    try { var v = localStorage.getItem("qz-" + key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set: function (key, value) {
    try { localStorage.setItem("qz-" + key, JSON.stringify(value)); } catch (e) {}
  }
};

QZ.reducedMotion = function () {
  return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
};

// A family groups types for the "kind of exercise" filter: "choice" holds scq and mcq.
// order: place among the filter's chips.
QZ.family = function (id, label, order) {
  QZ.families[id] = { id: id, label: label, order: order };
  QZ.familyOrder = Object.keys(QZ.families).sort(function (a, b) {
    return QZ.families[a].order - QZ.families[b].order;
  });
};

// A question type. def = {
//   family: "choice",                 its family (QZ.family)
//   label: "Single choice",           shown above the question
//   render: function (q, ctx) -> {    builds the question's answer area, returns its handle:
//     node:   Element,                  what goes under the question's text
//     ready:  function () -> bool,      can the answer be confirmed (something picked)?
//     grade:  function () -> number,    called once, on confirm: 0 (wrong) to 1 (right)
//     reveal: function (score)          then: lock the inputs, show what was right
//     key:    function (e) -> bool      optional: a key pressed (digits...), true if used
//   }
// }
// ctx = { base: url of the subject's folder (images), changed: call it when ready() may have
// changed, sound: QZ.sound }. See AGENTS.md, "Adding a question type".
QZ.type = function (name, def) {
  if (!QZ.families[def.family]) throw new Error("quiz type " + name + ": unknown family " + def.family);
  def.name = name;
  QZ.types[name] = def;
};

QZ.familyOf = function (q) {
  var t = QZ.types[q.type];
  return t ? t.family : null;
};
