// ── types/ordering.js: order, put pictures or words in the right order ──
// Drag an item with the mouse or a finger (Pointer Events: the HTML5 drag-and-drop API does not
// work with a finger), or focus it (Tab) and move it with the arrow keys. The others slide to
// their new places (FLIP: measured before and after, then animated back from where they were).
// Score: the share of pairs in the right relative order, so one swap costs little; 1 only when
// all are in place. Revealed: each item says its right place.

QZ.family("order", "Ordering", 30);

var QZ_LIFT = " scale(1.06) rotate(-1.5deg)";  // the held item, picked up off the table

QZ.type("order", {
  family: "order",
  label: "Put in order",
  render: function (q, ctx) {
    var n = q.items.length, locked = false, drag = null;
    var pics = q.items.some(function (it) { return typeof it !== "string"; });
    var start = q.items.map(function (_, i) { return i; });
    do { start = QZ.shuffle(start); } while (n > 1 && start.every(function (v, i) { return v === i; }));

    var list = QZ.el("div", "qz-order" + (pics ? " qz-order-pics" : ""));
    start.forEach(function (orig) {
      var it = q.items[orig], label = typeof it === "string" ? it : it.label;
      var img = null;
      if (typeof it !== "string") {
        img = QZ.el("img", "qz-item-pic");
        img.src = ctx.base + it.img;
        img.alt = label || "";
        img.draggable = false;
      }
      var card = QZ.el("div", "qz-item", [img, label ? QZ.block("span", "qz-item-label", label) : null, QZ.el("span", "qz-item-rank")]);
      card.tabIndex = 0;
      card.qzOrig = orig;
      card.addEventListener("pointerdown", down);
      card.addEventListener("pointermove", moveDrag);
      card.addEventListener("pointerup", up);
      card.addEventListener("pointercancel", up);
      list.appendChild(card);
    });

    function cards() { return Array.prototype.slice.call(list.children); }

    // Move the item at `from` to `to`, the others sliding to their new places: each starts from
    // where it is seen (getBoundingClientRect, even halfway through a slide) and slides to its
    // slot in the layout (offsetLeft / offsetTop: the list is their offsetParent)
    function move(from, to) {
      var all = cards(), card = all[from];
      if (to < 0 || to >= all.length || to === from) return;
      var seen = all.map(function (c) { return c.getBoundingClientRect(); });
      list.insertBefore(card, to > from ? all[to].nextSibling : all[to]);
      if (QZ.reducedMotion()) return;
      var origin = list.getBoundingClientRect();
      all.forEach(function (c, i) {
        if (drag && c === drag.card) return;
        var dx = seen[i].left - (origin.left + c.offsetLeft), dy = seen[i].top - (origin.top + c.offsetTop);
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        c.style.transition = "none";
        c.style.transform = "translate(" + dx + "px," + dy + "px)";
        c.getBoundingClientRect();  // apply it now, so that the next line animates
        c.style.transition = "";
        c.style.transform = "";
      });
    }

    // The slot under the pointer, by the layout only: the slides in progress are not seen, so a
    // neighbour sliding away under the pointer never swaps back (the jitter of a visual test)
    function slotAt(clientX, clientY) {
      var origin = list.getBoundingClientRect(), x = clientX - origin.left, y = clientY - origin.top;
      var all = cards();
      for (var i = 0; i < all.length; i++) {
        var c = all[i];
        if (x >= c.offsetLeft && x < c.offsetLeft + c.offsetWidth && y >= c.offsetTop && y < c.offsetTop + c.offsetHeight) return i;
      }
      return -1;
    }

    function down(e) {
      if (locked || e.button > 0) return;
      drag = { card: e.currentTarget, x: e.clientX, y: e.clientY, id: e.pointerId };
      try { drag.card.setPointerCapture(e.pointerId); } catch (err) {}
      drag.card.classList.add("is-dragging");
      drag.card.style.transform = QZ_LIFT;
      e.preventDefault();
    }

    function moveDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var from = cards().indexOf(drag.card), to = slotAt(e.clientX, e.clientY);
      if (to >= 0 && to !== from) {
        var ox = drag.card.offsetLeft, oy = drag.card.offsetTop;
        move(from, to);
        drag.x += drag.card.offsetLeft - ox;  // its slot moved: keep it under the pointer
        drag.y += drag.card.offsetTop - oy;
      }
      drag.card.style.transform = "translate(" + (e.clientX - drag.x) + "px," + (e.clientY - drag.y) + "px)" + QZ_LIFT;
    }

    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.card.classList.remove("is-dragging");
      drag.card.style.transform = "";
      drag = null;
      ctx.sound.play("pick");
    }

    function order() { return cards().map(function (c) { return c.qzOrig; }); }

    return {
      node: list,
      ready: function () { return true; },
      grade: function () {
        var s = order(), good = 0, pairs = n * (n - 1) / 2;
        for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) if (s[i] < s[j]) good++;
        return good === pairs ? 1 : good / pairs * 0.9;
      },
      reveal: function () {
        locked = true;
        cards().forEach(function (c, i) {
          c.classList.add(c.qzOrig === i ? "is-right" : "is-wrong");
          c.querySelector(".qz-item-rank").textContent = String(c.qzOrig + 1);
          c.removeAttribute("tabindex");
        });
      },
      key: function (e) {
        var c = document.activeElement, i = cards().indexOf(c);
        if (locked || i < 0) return false;
        var step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
        if (!step) return false;
        move(i, i + step);
        c.focus();
        ctx.sound.play("pick");
        return true;
      }
    };
  }
});
