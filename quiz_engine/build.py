"""What a build writes: the runtime once, and one data folder per subject.

    <out>/quiz.js, quiz.css          write_runtime(out)
    <out>/<subject>/data.json        build_subject(quiz_dir, out / subject)
    <out>/<subject>/img/...          the quiz folder's other files, copied as they are

notes-engine calls both with `out = dist/quiz`; `python -m quiz_engine demo` does the same for
the example.
"""

import json
import shutil

from . import bundle
from .load import load_subject
from .validate import QuizError


def write_runtime(out):
    """Write quiz.js and quiz.css into `out`; returns the warnings (syntax too new for phones)."""
    js = bundle.js_bundle()
    error = bundle.syntax_error(js)
    if error:
        raise QuizError(f"quiz.js does not parse:\n{error}")
    out.mkdir(parents=True, exist_ok=True)
    (out / "quiz.js").write_text(js, encoding="utf-8")
    (out / "quiz.css").write_text(bundle.css_bundle(), encoding="utf-8")
    return bundle.too_new()


def build_subject(quiz_dir, out):
    """Validate `quiz_dir`, write `out/data.json` and copy its other files; returns the question count."""
    data = load_subject(quiz_dir)
    if out.exists():
        shutil.rmtree(out)  # a file removed from quiz/ must not linger in dist/
    out.mkdir(parents=True)
    for f in quiz_dir.rglob("*"):
        if f.is_file() and f.suffix != ".json":
            target = out / f.relative_to(quiz_dir)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, target)
    (out / "data.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return sum(len(c["questions"]) for c in data["chapters"])
