"""Command line: check quiz folders, or build the demo.

    python -m quiz_engine check ../notes_ba5/swent/quiz   # validate, print the counts
    python -m quiz_engine demo                            # example/ -> example/dist/, then serve it
"""

import argparse
import shutil
import sys
from pathlib import Path

from .build import build_subject, write_runtime
from .load import load_subject
from .validate import QuizError

HERE = Path(__file__).resolve().parent
EXAMPLE = HERE.parent / "example"


def check(folders):
    for folder in folders:
        data = load_subject(Path(folder))
        n = sum(len(c["questions"]) for c in data["chapters"])
        print(f"ok  {folder}: {len(data['chapters'])} chapter(s), {n} question(s)")


def demo(out):
    """The example quiz in a page of its own, styled like the notes page (light and dark)."""
    for warning in write_runtime(out / "quiz"):
        print(f"warn  {warning}")
    n = build_subject(EXAMPLE / "quiz", out / "quiz" / "demo")
    shutil.copy2(HERE / "demo" / "index.html", out / "index.html")
    print(f"ok  {out}: {n} question(s); serve it: python -m http.server 8790 --directory {out}")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="quiz_engine", description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="validate quiz folders")
    c.add_argument("folders", nargs="+")
    d = sub.add_parser("demo", help="build the example into a standalone page")
    d.add_argument("--out", type=Path, default=EXAMPLE / "dist")
    args = ap.parse_args(argv)
    try:
        check(args.folders) if args.cmd == "check" else demo(args.out)
    except QuizError as e:
        print(f"error  {e}", file=sys.stderr)
        sys.exit(1)
