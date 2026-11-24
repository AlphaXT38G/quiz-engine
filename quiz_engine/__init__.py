"""quiz-engine: the quizzes of a notes site.

A notes repository writes its questions in `<subject>/quiz/*.json`; this package validates them
(`validate.py`, `types/`), turns them into the data the browser reads (`load.py`) and bundles the
browser runtime (`runtime/`, `bundle.py`). notes-engine calls `build_subject()` and
`write_runtime()` during its build; nothing here knows about notes-engine.
"""

__version__ = "0.1.0"

from .build import build_subject, write_runtime  # noqa: E402,F401  the public API
from .validate import QuizError  # noqa: E402,F401
