"""Ordering: put things (photos, or words) in the right order by dragging them.

    {"type": "order", "question": "From the closest to the Sun to the farthest",
     "items": [{"img": "img/mercury.svg", "label": "Mercury"}, {"img": "img/venus.svg"}, "Earth"]}

`items` is the right order; the browser shuffles it. An item is a text, or a picture (`img`, a
path inside the quiz folder) with an optional `label`.
"""


def _item_problem(item):
    if isinstance(item, str):
        return None if item.strip() else "an item is an empty string"
    if not isinstance(item, dict) or not isinstance(item.get("img"), str) or not item["img"].strip():
        return "an item is a text, or an object with \"img\" (and an optional \"label\")"
    unknown = set(item) - {"img", "label"}
    if unknown:
        return f"unknown key(s) in an item: {sorted(unknown)}"
    if "label" in item and not (isinstance(item["label"], str) and item["label"].strip()):
        return "an item's \"label\" must be a non-empty string"
    return None


def check_order(q):
    items = q.get("items")
    if not isinstance(items, list) or len(items) < 2:
        return "\"items\" must list at least 2 things, in the right order"
    for item in items:
        problem = _item_problem(item)
        if problem:
            return problem
    return None


def files_order(q):
    """The pictures it uses, which must exist in the quiz folder."""
    return [i["img"] for i in q["items"] if isinstance(i, dict)]


TYPES = {
    "order": {"keys": {"items"}, "check": check_order, "files": files_order},
}
