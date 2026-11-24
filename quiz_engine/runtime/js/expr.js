// ── expr.js: the formula of a plot question, turned into a function of x (no eval) ──
// QZ.expr("2x^2 - sin(pi x)") -> function (x) { ... }, or an Error thrown with what is wrong.
// Numbers, x, pi, e, + - * / ^ (right-associative, above unary minus: -x^2 = -(x^2)),
// parentheses, implicit products (2x, 3(x+1), x sin(x)), and the functions below. The build
// checks the names and parentheses already (types/plot.py); this is the real parser.

var QZ_FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: Math.log,
  log: function (v) { return Math.log(v) / Math.LN10; }, sqrt: Math.sqrt, abs: Math.abs
};

QZ.expr = function (src) {
  var toks = [], re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z]+)|([-+*/^()]))/y, m, i = 0;
  src = String(src).replace(/\s+$/, "");
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    var at = re.lastIndex;
    m = re.exec(src);
    if (!m) throw new Error("unexpected " + src.slice(at).trim().charAt(0));
    toks.push(m[1] ? { n: parseFloat(m[1]) } : m[2] ? { w: m[2] } : { o: m[3] });
  }
  function peek() { return toks[i]; }
  function isOp(t, o) { return t && t.o === o; }
  function startsAtom(t) { return t && (t.n != null || t.w || t.o === "("); }

  // A node of two operands. Made by a function, not in the loops below: a closure made in a loop
  // would share the loop's `var`s, and every node would end up computing the last one
  function both(op, a, b) {
    if (op === "+") return function (x) { return a(x) + b(x); };
    if (op === "-") return function (x) { return a(x) - b(x); };
    if (op === "*") return function (x) { return a(x) * b(x); };
    return function (x) { return a(x) / b(x); };
  }
  function expr() {
    var f = term();
    while (isOp(peek(), "+") || isOp(peek(), "-")) {
      var op = toks[i++].o;
      f = both(op, f, term());
    }
    return f;
  }
  function term() {
    var f = unary();
    for (;;) {
      var t = peek();
      if (isOp(t, "*") || isOp(t, "/")) { i++; f = both(t.o, f, unary()); }
      else if (startsAtom(t)) f = both("*", f, power());  // implicit product: 2x, x(x+1)
      else return f;
    }
  }
  function unary() {
    if (isOp(peek(), "-")) { i++; var a = unary(); return function (x) { return -a(x); }; }
    if (isOp(peek(), "+")) { i++; return unary(); }
    return power();
  }
  function power() {
    var a = atom();
    if (!isOp(peek(), "^")) return a;
    i++;
    var b = unary();
    return function (x) { return Math.pow(a(x), b(x)); };
  }
  function atom() {
    var t = toks[i++];
    if (!t) throw new Error("the formula ends too early");
    if (t.n != null) { var n = t.n; return function () { return n; }; }
    if (t.o === "(") {
      var inner = expr();
      if (!isOp(toks[i++], ")")) throw new Error("a ( is not closed");
      return inner;
    }
    if (t.w === "x") return function (x) { return x; };
    if (t.w === "pi") return function () { return Math.PI; };
    if (t.w === "e") return function () { return Math.E; };
    if (QZ_FUNCS[t.w]) {
      var fn = QZ_FUNCS[t.w], arg = startsAtom(peek()) ? power() : null;
      if (!arg) throw new Error(t.w + " needs an argument");
      return function (x) { return fn(arg(x)); };
    }
    throw new Error("unexpected " + (t.w || t.o));
  }
  var f = expr();
  if (i < toks.length) throw new Error("unexpected " + (toks[i].w || toks[i].o || toks[i].n));
  return f;
};
