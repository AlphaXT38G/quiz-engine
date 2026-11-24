"""Choice questions: `scq` (one right option) and `mcq` (several right options).

    {"type": "scq", "question": "...", "options": ["A", "B", "C"], "answer": 0}
    {"type": "mcq", "question": "...", "options": ["A", "B", "C"], "answer": [0, 2]}

`answer` holds indices into `options`. Options are shuffled in the browser unless
`"shuffle": false` (for "all of the above" style options whose order matters).
"""

KEYS = {"options", "answer", "shuffle"}


def _index(v, n):
    return isinstance(v, int) and not isinstance(v, bool) and 0 <= v < n


def _options(q):
    opts = q.get("options")
    if not isinstance(opts, list) or len(opts) < 2:
        return "\"options\" must be a list of at least 2 strings"
    if not all(isinstance(o, str) and o.strip() for o in opts):
        return "every option must be a non-empty string"
    if len(set(opts)) != len(opts):
        return "two options are the same"
    if "shuffle" in q and not isinstance(q["shuffle"], bool):
        return "\"shuffle\" must be true or false"
    return None


def check_scq(q):
    problem = _options(q)
    if problem:
        return problem
    if not _index(q.get("answer"), len(q["options"])):
        return f"\"answer\" must be the index of the right option (0 to {len(q['options']) - 1})"
    return None


def check_mcq(q):
    problem = _options(q)
    if problem:
        return problem
    ans = q.get("answer")
    n = len(q["options"])
    if not isinstance(ans, list) or not ans or not all(_index(a, n) for a in ans):
        return f"\"answer\" must be a non-empty list of option indices (0 to {n - 1})"
    if len(set(ans)) != len(ans):
        return "\"answer\" lists an option twice"
    return None


TYPES = {
    "scq": {"keys": KEYS, "check": check_scq},
    "mcq": {"keys": KEYS, "check": check_mcq},
}
