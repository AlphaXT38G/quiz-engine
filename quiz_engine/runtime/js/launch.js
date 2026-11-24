// ── launch.js: the launch zone at the top of the selection, with its big Start button ──
// QZ.launch(onStart) -> { node, key(e), update(count, summary) }: how many questions the
// selection gives, in big (it pops when it changes), a line saying what they are about, and
// Start. Its look is launch.css; .qz-hero-deco is an empty layer the host page may decorate
// (notes-engine dresses it for each screen: snow on Christmas, bats on Halloween...).

QZ.launch = function (onStart) {
  var n = QZ.el("span", "qz-hero-n"), unit = QZ.el("span", "qz-hero-unit");
  var sub = QZ.el("div", "qz-hero-sub");
  var go = QZ.button("qz-go", "", function () { if (!go.disabled) { QZ.sound.play("streak"); onStart(); } });
  var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("class", "qz-go-icon");
  var tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tri.setAttribute("d", "M8 5.5v13l11-6.5z");
  icon.appendChild(tri);
  go.appendChild(icon);
  go.appendChild(QZ.el("span", "qz-go-text", ["Start"]));

  var deco = QZ.el("div", "qz-hero-deco");
  deco.setAttribute("aria-hidden", "true");
  var node = QZ.el("div", "qz-hero", [
    deco,
    QZ.el("div", "qz-hero-text", [QZ.el("div", "qz-hero-count", [n, unit]), sub]),
    go
  ]);
  var shown = null;

  return {
    node: node,
    update: function (count, summary) {
      if (count !== shown) {  // the number pops when it changes (restart the animation)
        n.classList.remove("is-pop");
        void n.offsetWidth;
        n.classList.add("is-pop");
        shown = count;
      }
      n.textContent = String(count);
      unit.textContent = count === 1 ? "question" : "questions";
      sub.textContent = count ? summary : "Pick some content and a kind of exercise below";
      go.disabled = count === 0;
      node.classList.toggle("is-empty", count === 0);
    },
    // Enter starts, unless the focus is on a control that Enter already works (a box, a chip)
    key: function (e) {
      var free = !e.target.tagName || e.target === document.body;
      if (e.key === "Enter" && free && !go.disabled) { go.click(); return true; }
      return false;
    }
  };
};
