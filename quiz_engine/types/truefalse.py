"""True / false questions.

    {"type": "tf", "question": "A cache hit is faster than a miss.", "answer": true}
"""


def check_tf(q):
    if not isinstance(q.get("answer"), bool):
        return "\"answer\" must be true or false"
    return None


TYPES = {
    "tf": {"keys": {"answer"}, "check": check_tf},
}
