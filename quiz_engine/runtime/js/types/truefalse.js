// ── types/truefalse.js: tf, a statement to judge ──
// Two big buttons, True and False (keys 1 / 2, or T / F); the choice widget does the rest.

QZ.family("tf", "True / false", 20);

QZ.type("tf", {
  family: "tf",
  label: "True or false",
  render: function (q, ctx) {
    var h = QZ.choiceRender({ options: ["True", "False"], answer: q.answer ? 0 : 1, shuffle: false }, ctx, false);
    h.node.classList.add("qz-tf");
    var digits = h.key;
    h.key = function (e) {
      var k = String(e.key).toLowerCase();
      if (k === "t") return digits({ key: "1" });
      if (k === "f") return digits({ key: "2" });
      return digits(e);
    };
    return h;
  }
});
