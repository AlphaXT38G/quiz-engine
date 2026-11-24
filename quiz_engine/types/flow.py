"""Flowcharts and organisation charts with boxes to fill in.

    {"type": "flow", "question": "Complete the flowchart",
     "nodes": {
       "start": {"text": "Start", "shape": "round"},
       "test":  {"text": "n mod 2 = 0 ?", "shape": "diamond"},
       "even":  {"blank": ["even", "pair"]},
       "odd":   {"blank": "odd"}
     },
     "rows":  [["start"], ["test"], ["even", "odd"]],
     "edges": [["start", "test"], ["test", "even", "yes"], ["test", "odd", "no"]]}

A node is a text (a plain box) or an object: `text` (shown) or `blank` (to fill in: the answer,
or a list of accepted answers, the first one shown when revealed), and `shape` (`box`, `round`,
`diamond`). `rows` lays the chart out top to bottom, each row centred. An edge is
[from, to] or [from, to, label]. Answers are compared ignoring case, accents and punctuation.
"""

SHAPES = {"box", "round", "diamond"}


def _text(v):
    return isinstance(v, str) and v.strip() != ""


def _node_problem(nid, node):
    if _text(node):
        return None
    if not isinstance(node, dict):
        return f"node {nid!r} must be a text or an object"
    unknown = set(node) - {"text", "blank", "shape"}
    if unknown:
        return f"node {nid!r}: unknown key(s) {sorted(unknown)}"
    if ("text" in node) == ("blank" in node):
        return f"node {nid!r} needs either \"text\" or \"blank\""
    if "text" in node and not _text(node["text"]):
        return f"node {nid!r}: \"text\" must be a non-empty string"
    if "blank" in node:
        b = node["blank"]
        answers = b if isinstance(b, list) else [b]
        if not answers or not all(_text(a) for a in answers):
            return f"node {nid!r}: \"blank\" is the answer, or a list of accepted answers"
    if "shape" in node and node["shape"] not in SHAPES:
        return f"node {nid!r}: \"shape\" is one of {sorted(SHAPES)}"
    return None


def check_flow(q):
    nodes, rows, edges = q.get("nodes"), q.get("rows"), q.get("edges", [])
    if not isinstance(nodes, dict) or not nodes:
        return "\"nodes\" must be an object of nodes by id"
    for nid, node in nodes.items():
        problem = _node_problem(nid, node)
        if problem:
            return problem
    if not any(isinstance(n, dict) and "blank" in n for n in nodes.values()):
        return "at least one node must be a \"blank\" to fill in"
    if not isinstance(rows, list) or not rows or not all(isinstance(r, list) and r for r in rows):
        return "\"rows\" must be a list of rows, each a list of node ids"
    placed = [nid for r in rows for nid in r]
    if sorted(placed) != sorted(nodes):
        return "every node must be in exactly one row (and rows list only nodes)"
    if not isinstance(edges, list):
        return "\"edges\" must be a list of [from, to] or [from, to, label]"
    for e in edges:
        if not (isinstance(e, list) and len(e) in (2, 3) and e[0] in nodes and e[1] in nodes and (len(e) == 2 or _text(e[2]))):
            return f"bad edge {e!r}: [from, to] or [from, to, label], with ids of nodes"
    return None


TYPES = {
    "flow": {"keys": {"nodes", "rows", "edges"}, "check": check_flow},
}
