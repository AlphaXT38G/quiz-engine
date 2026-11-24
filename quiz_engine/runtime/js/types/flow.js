// ── types/flow.js: flow, a flowchart or an organisation chart with boxes to fill in ──
// The chart is laid out by the browser (rows of nodes, each row centred: CSS flex), then its
// arrows are drawn over it in an SVG, from where the boxes ended up (flowedges.js). A blank is a
// text field; Enter goes to the next one, and from the last one confirms. Answers are compared
// ignoring case, accents, punctuation and extra spaces (QZ.normalize, text.js). Score: the
// share of blanks right.

QZ.family("flow", "Diagrams", 40);

QZ.type("flow", {
  family: "flow",
  label: "Complete the diagram",
  render: function (q, ctx) {
    var boxes = {}, blanks = [], locked = false;
    var wrap = QZ.el("div", "qz-flow");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "qz-flow-edges");
    svg.setAttribute("aria-hidden", "true");
    wrap.appendChild(svg);

    q.rows.forEach(function (row) {
      var r = QZ.el("div", "qz-flow-row");
      row.forEach(function (id) {
        var spec = typeof q.nodes[id] === "string" ? { text: q.nodes[id] } : q.nodes[id];
        var inner;
        if (spec.blank != null) {
          inner = QZ.el("input", "qz-node-input");
          inner.type = "text";
          inner.autocomplete = "off";
          inner.setAttribute("autocapitalize", "off");
          inner.spellcheck = false;
          inner.placeholder = "?";
          inner.setAttribute("aria-label", "Box to fill in");
          inner.addEventListener("input", function () { ctx.changed(); });
          blanks.push({ input: inner, answers: [].concat(spec.blank), id: id });
        } else {
          inner = QZ.block("span", "qz-node-text", spec.text);
        }
        var box = QZ.el("div", "qz-node qz-node-" + (spec.shape || "box"), [inner]);
        boxes[id] = box;
        r.appendChild(box);
      });
      wrap.appendChild(r);
    });

    // The arrows: drawn once the chart is on the page, and again when its size changes
    function redraw() {
      if (!wrap.isConnected) { window.removeEventListener("resize", redraw); return; }
      QZ.flowEdges(svg, wrap, boxes, q.edges || []);
    }
    window.addEventListener("resize", redraw);
    requestAnimationFrame(function () { redraw(); if (blanks.length && !matchMedia("(pointer:coarse)").matches) blanks[0].input.focus({ preventScroll: true }); });

    function right(b) {
      var given = QZ.normalize(b.input.value);
      return b.answers.some(function (a) { return QZ.normalize(a) === given; });
    }

    return {
      node: wrap,
      ready: function () { return blanks.some(function (b) { return b.input.value.trim() !== ""; }); },
      grade: function () {
        return blanks.filter(right).length / blanks.length;
      },
      reveal: function () {
        locked = true;
        blanks.forEach(function (b) {
          var ok = right(b), box = boxes[b.id];
          b.input.readOnly = true;
          box.classList.add(ok ? "is-right" : "is-wrong");
          if (!ok) box.appendChild(QZ.el("span", "qz-node-fix", [b.answers[0]]));
        });
        redraw();  // a corrected box is taller: the arrows follow
      },
      key: function (e) {
        if (locked || e.key !== "Enter") return false;
        var i = blanks.map(function (b) { return b.input; }).indexOf(e.target);
        if (i < 0 || i === blanks.length - 1) return false;  // from the last one: confirm
        blanks[i + 1].input.focus();
        return true;
      }
    };
  }
});
