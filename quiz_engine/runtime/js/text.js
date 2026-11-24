// ── text.js: the light markup of questions, options and explanations ──
// The quiz files are plain JSON strings. A few marks are understood, and turned into DOM nodes
// (never innerHTML, so a "<" in a question is just a "<"):
//   **bold**   *italic*   `code`   a blank line or "\n" -> a line break
// Formulas ($...$) will come with KaTeX, loaded only when a question has one.

var QZ_MARKS = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/;

QZ.rich = function (s) {
  var frag = document.createDocumentFragment();
  String(s).split("\n").forEach(function (line, i) {
    if (i) frag.appendChild(document.createElement("br"));
    line.split(QZ_MARKS).forEach(function (part) {
      if (!part) return;
      var tag = null, inner = part;
      if (/^\*\*.+\*\*$/.test(part)) { tag = "strong"; inner = part.slice(2, -2); }
      else if (/^`.+`$/.test(part)) { tag = "code"; inner = part.slice(1, -1); }
      else if (/^\*.+\*$/.test(part)) { tag = "em"; inner = part.slice(1, -1); }
      frag.appendChild(tag ? QZ.el(tag, null, [inner]) : document.createTextNode(part));
    });
  });
  return frag;
};

// A block of rich text: QZ.block("div", "qz-question", q.question)
QZ.block = function (tag, cls, s) {
  var e = QZ.el(tag, cls);
  e.appendChild(QZ.rich(s));
  return e;
};
