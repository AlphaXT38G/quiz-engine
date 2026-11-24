"""Checks of a quiz file and of its questions, before anything reaches the browser.

A mistake in a quiz file (a typo in a key, an answer index out of range) is an error at build
time, with the file and the question, never a quiz that silently breaks on a phone. The rules
shared by every question are here; each type's own rules are in `types/` (one module per family).
"""

from .types import TYPES

FILE_KEYS = {"title", "week", "questions"}
# Keys every question may have, whatever its type
COMMON_KEYS = {"type", "question", "explanation"}


class QuizError(Exception):
    """A quiz file that cannot be used; the message says where."""


def check_file(data, where):
    """Check a whole quiz file (already parsed JSON). `where` names it in the errors."""
    if not isinstance(data, dict):
        raise QuizError(f"{where}: a quiz file is an object with a \"questions\" list")
    unknown = set(data) - FILE_KEYS
    if unknown:
        raise QuizError(f"{where}: unknown key(s) {sorted(unknown)}; allowed: {sorted(FILE_KEYS)}")
    if "title" in data and not _text(data["title"]):
        raise QuizError(f"{where}: \"title\" must be a non-empty string")
    if "week" in data and not (isinstance(data["week"], int) and not isinstance(data["week"], bool) and data["week"] > 0):
        raise QuizError(f"{where}: \"week\" must be a positive whole number")
    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        raise QuizError(f"{where}: \"questions\" must be a non-empty list")
    for i, q in enumerate(questions):
        check_question(q, f"{where}: question {i + 1}")


def check_question(q, where):
    """Check one question: the common keys here, the rest by its type's own check."""
    if not isinstance(q, dict):
        raise QuizError(f"{where}: a question is an object")
    kind = q.get("type")
    if kind not in TYPES:
        raise QuizError(f"{where}: unknown type {kind!r}; known: {sorted(TYPES)}")
    where = f"{where} ({kind})"
    spec = TYPES[kind]
    unknown = set(q) - COMMON_KEYS - spec["keys"]
    if unknown:
        raise QuizError(f"{where}: unknown key(s) {sorted(unknown)}; allowed: {sorted(COMMON_KEYS | spec['keys'])}")
    if not _text(q.get("question")):
        raise QuizError(f"{where}: \"question\" must be a non-empty string")
    if "explanation" in q and not _text(q["explanation"]):
        raise QuizError(f"{where}: \"explanation\" must be a non-empty string")
    problem = spec["check"](q)
    if problem:
        raise QuizError(f"{where}: {problem}")


def _text(v):
    return isinstance(v, str) and v.strip() != ""
