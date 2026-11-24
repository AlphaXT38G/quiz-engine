"""Graphs: draw the curve of a function with the mouse or a finger.

    {"type": "plot", "question": "Draw y = x^2", "fn": "x^2", "x": [-3, 3], "y": [-1, 9]}

`fn` is written with x, numbers, + - * / ^, parentheses, pi, e and sin cos tan exp ln log sqrt
abs (the browser evaluates it: `js/expr.js`). `x` and `y` are the axes' ranges. `tolerance`
(default 0.06) is how far the drawing may be from the curve, as a share of the y range.
"""

import re

NAMES = {"x", "pi", "e", "sin", "cos", "tan", "exp", "ln", "log", "sqrt", "abs"}
TOKEN = re.compile(r"\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z]+)|([-+*/^()]))")


def fn_problem(fn):
    """A problem of the formula (unknown name, bad character, parentheses), or None."""
    pos, depth = 0, 0
    fn = fn.rstrip()
    while pos < len(fn):
        m = TOKEN.match(fn, pos)
        if not m:
            return f"\"fn\": unexpected character {fn[pos:].strip()[:1]!r}"
        if m.group(2) and m.group(2) not in NAMES:
            return f"\"fn\": unknown name {m.group(2)!r}; known: {sorted(NAMES)}"
        depth += {"(": 1, ")": -1}.get(m.group(3), 0)
        if depth < 0:
            return "\"fn\": a ) without its ("
        pos = m.end()
    return "\"fn\": a ( is not closed" if depth else None


def _range(v):
    return (isinstance(v, list) and len(v) == 2 and all(isinstance(a, (int, float)) and not isinstance(a, bool) for a in v)
            and v[0] < v[1])


def check_plot(q):
    if not isinstance(q.get("fn"), str) or not q["fn"].strip():
        return "\"fn\" must be the formula of the curve, e.g. \"x^2\""
    problem = fn_problem(q["fn"])
    if problem:
        return problem
    for axis in ("x", "y"):
        if not _range(q.get(axis)):
            return f"\"{axis}\" must be [min, max], min < max"
    t = q.get("tolerance", 0.06)
    if not (isinstance(t, (int, float)) and not isinstance(t, bool) and 0 < t < 0.5):
        return "\"tolerance\" must be a number between 0 and 0.5"
    return None


TYPES = {
    "plot": {"keys": {"fn", "x", "y", "tolerance"}, "check": check_plot},
}
