// ── flowedges.js: the arrows of a flow chart (types/flow.js), drawn from where its boxes are ──
// QZ.flowEdges(svg, wrap, boxes, edges): every edge [from, to, label] as an SVG path over the
// chart, in the chart's own coordinates. The route depends on where the target is:
//   below, under the source      down, across at mid-height, down into its top
//   below, beside the source     out of the source's side, across, down into its top (yes / no)
//   on the same row              side to side
//   above (a loop back)          out of the right side, around the chart's right, into its right
// The label sits by the start of the arrow.

QZ.flowEdges = function (svg, wrap, boxes, edges) {
  var NS = "http://www.w3.org/2000/svg";
  var base = wrap.getBoundingClientRect();
  svg.setAttribute("width", base.width);
  svg.setAttribute("height", base.height);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // One arrowhead per chart (its id must be unique in the page)
  QZ.flowEdges.n = (QZ.flowEdges.n || 0) + 1;
  var mid = "qz-arrow-" + QZ.flowEdges.n;
  var defs = document.createElementNS(NS, "defs"), marker = document.createElementNS(NS, "marker"), head = document.createElementNS(NS, "path");
  marker.setAttribute("id", mid);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto");
  head.setAttribute("d", "M0 0L10 5L0 10z");
  head.setAttribute("fill", "currentColor");
  marker.appendChild(head); defs.appendChild(marker); svg.appendChild(defs);

  function box(id) {
    var r = boxes[id].getBoundingClientRect();
    var b = { l: r.left - base.left, t: r.top - base.top, w: r.width, h: r.height };
    b.r = b.l + b.w; b.b = b.t + b.h; b.cx = b.l + b.w / 2; b.cy = b.t + b.h / 2;
    return b;
  }
  var right = 0;
  Object.keys(boxes).forEach(function (id) { right = Math.max(right, box(id).r); });

  edges.forEach(function (e) {
    var s = box(e[0]), t = box(e[1]), pts, lab;
    if (t.t >= s.b - 1) {                       // below
      if (t.cx < s.l || t.cx > s.r) {             // beside: out of a side
        var sx = t.cx < s.l ? s.l : s.r;
        pts = [[sx, s.cy], [t.cx, s.cy], [t.cx, t.t]];
        lab = [(sx + t.cx) / 2, s.cy - 6, "middle"];
      } else {
        var my = (s.b + t.t) / 2;
        pts = [[s.cx, s.b], [s.cx, my], [t.cx, my], [t.cx, t.t]];
        // by its own branch: two branches leave from the same point, their labels must not meet
        lab = Math.abs(t.cx - s.cx) > 4 ? [t.cx + (t.cx < s.cx ? -6 : 6), my - 5, t.cx < s.cx ? "end" : "start"] : [s.cx + 6, my - 3, "start"];
      }
    } else if (t.b > s.t + 1) {                 // same row
      var toRight = t.cx > s.cx;
      pts = [[toRight ? s.r : s.l, s.cy], [toRight ? t.l : t.r, t.cy]];
      lab = [(pts[0][0] + pts[1][0]) / 2, s.cy - 6, "middle"];
    } else {                                    // above: around the right
      var x = right + 16;
      pts = [[s.r, s.cy], [x, s.cy], [x, t.cy], [t.r, t.cy]];
      lab = [x + 4, (s.cy + t.cy) / 2, "start"];
    }
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L"));
    path.setAttribute("marker-end", "url(#" + mid + ")");
    svg.appendChild(path);
    if (e[2]) {
      var text = document.createElementNS(NS, "text");
      text.setAttribute("x", lab[0]);
      text.setAttribute("y", lab[1]);
      text.setAttribute("text-anchor", lab[2]);
      text.textContent = e[2];
      svg.appendChild(text);
    }
  });
};
