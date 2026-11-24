"""A subject's quiz folder, read and validated into the data the browser reads.

    <subject>/quiz/
      week1a.json     {"title": "Requirements", "week": 1, "questions": [...]}
      week1b.json     one file per chapter; "week" defaults to the number in the file name
      img/...         anything else (images of later question types) is copied as is

The result is `{"chapters": [{"id", "title", "week", "questions": [...]}, ...]}`, in the natural
order of the file names (week2 before week10). Each question gets an `id`, `<file>/<index>`, which
the browser uses to remember what was missed.
"""

import json
import re

from .validate import QuizError, check_file

# Week number from a file name, as notes-engine reads its weekly notes: 01, week3, week1a, week_2
WEEK = re.compile(r"(?:week_?)?(\d+)", re.I)


def week_of(stem):
    m = WEEK.match(stem)
    return int(m.group(1)) if m else None


def natural(path):
    """Sort key: numbers compared as numbers, so week2 comes before week10."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.stem)]


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise QuizError(f"{path}: not valid JSON, line {e.lineno} column {e.colno}: {e.msg}") from None


def load_subject(quiz_dir):
    """Every quiz file of `quiz_dir`, checked, as the browser's data (raises QuizError)."""
    files = sorted(quiz_dir.glob("*.json"), key=natural)
    if not files:
        raise QuizError(f"{quiz_dir}: no quiz file (*.json)")
    chapters = []
    for f in files:
        data = read_json(f)
        check_file(data, f)
        chapters.append({
            "id": f.stem,
            "title": data.get("title", f.stem),
            "week": data.get("week", week_of(f.stem)),
            "questions": [dict(q, id=f"{f.stem}/{i}") for i, q in enumerate(data["questions"])],
        })
    return {"chapters": chapters}
