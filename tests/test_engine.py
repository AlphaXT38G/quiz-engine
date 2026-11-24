"""Tests: the validation of quiz files, the data the browser gets, and the runtime bundle."""

import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from quiz_engine import bundle, build_subject, write_runtime  # noqa: E402
from quiz_engine.load import load_subject, week_of  # noqa: E402
from quiz_engine.types import TYPES  # noqa: E402
from quiz_engine.validate import QuizError, check_file  # noqa: E402

EXAMPLE = HERE / "example" / "quiz"


def quiz(*questions, **file_keys):
    return dict(file_keys, questions=list(questions))


class ValidationTest(unittest.TestCase):
    def bad(self, data, fragment):
        with self.assertRaises(QuizError) as e:
            check_file(data, "f.json")
        self.assertIn(fragment, str(e.exception))

    def test_good_questions_pass(self):
        check_file(quiz(
            {"type": "scq", "question": "q", "options": ["a", "b"], "answer": 1},
            {"type": "mcq", "question": "q", "options": ["a", "b", "c"], "answer": [0, 2], "explanation": "e"},
            {"type": "tf", "question": "q", "answer": False},
            title="T", week=3,
        ), "f.json")

    def test_unknown_keys_are_errors(self):
        self.bad(quiz({"type": "tf", "question": "q", "answer": True}, titel="typo"), "titel")
        self.bad(quiz({"type": "tf", "question": "q", "answer": True, "answr": 1}), "answr")

    def test_unknown_type(self):
        self.bad(quiz({"type": "essay", "question": "q"}), "unknown type 'essay'")

    def test_answer_out_of_range_names_the_question(self):
        self.bad(quiz({"type": "tf", "question": "q", "answer": True},
                      {"type": "scq", "question": "q", "options": ["a", "b"], "answer": 2}), "question 2 (scq)")

    def test_mcq_answer_is_a_list(self):
        self.bad(quiz({"type": "mcq", "question": "q", "options": ["a", "b"], "answer": 0}), "non-empty list")

    def test_tf_answer_is_a_bool(self):
        self.bad(quiz({"type": "tf", "question": "q", "answer": "true"}), "true or false")

    def test_week_is_a_positive_int(self):
        self.bad(quiz({"type": "tf", "question": "q", "answer": True}, week="2"), "week")

    def test_empty_questions(self):
        self.bad({"questions": []}, "non-empty list")


class LoadTest(unittest.TestCase):
    def test_week_from_file_name(self):
        self.assertEqual([week_of(s) for s in ("01", "week3", "week1a", "week_12", "intro")], [1, 3, 1, 12, None])

    def test_example_loads_in_natural_order(self):
        data = load_subject(EXAMPLE)
        self.assertEqual([c["id"] for c in data["chapters"]], ["week1a", "week1b", "week2"])
        self.assertEqual([c["week"] for c in data["chapters"]], [1, 1, 2])
        self.assertEqual(data["chapters"][0]["questions"][1]["id"], "week1a/1")

    def test_invalid_json_says_where(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "01.json").write_text('{"questions": [}', encoding="utf-8")
            with self.assertRaises(QuizError) as e:
                load_subject(Path(d))
            self.assertIn("line 1", str(e.exception))

    def test_build_subject_copies_assets_and_drops_stale_files(self):
        with tempfile.TemporaryDirectory() as d:
            src, out = Path(d) / "quiz", Path(d) / "out"
            (src / "img").mkdir(parents=True)
            (src / "01.json").write_text(json.dumps(quiz({"type": "tf", "question": "q", "answer": True})), encoding="utf-8")
            (src / "img" / "a.svg").write_text("<svg/>", encoding="utf-8")
            out.mkdir()
            (out / "old.png").write_text("x")
            self.assertEqual(build_subject(src, out), 1)
            self.assertTrue((out / "img" / "a.svg").exists())
            self.assertFalse((out / "old.png").exists())
            self.assertIn("chapters", json.loads((out / "data.json").read_text(encoding="utf-8")))


class RuntimeTest(unittest.TestCase):
    def test_manifest_files_exist(self):
        m = bundle.manifest()
        for rel in m["js"] + m["css"]:
            self.assertTrue((bundle.RUNTIME / rel).is_file(), rel)

    def test_every_runtime_file_is_in_the_manifest(self):
        m = bundle.manifest()
        listed = set(m["js"] + m["css"])
        found = {p.relative_to(bundle.RUNTIME).as_posix() for p in bundle.RUNTIME.rglob("*") if p.suffix in (".js", ".css")}
        self.assertEqual(found - listed, set())

    def test_python_and_browser_know_the_same_types(self):
        js = "".join((bundle.RUNTIME / rel).read_text(encoding="utf-8") for rel in bundle.manifest()["js"])
        self.assertEqual(set(re.findall(r'QZ\.type\("(\w+)"', js)), set(TYPES))

    def test_runtime_is_old_phone_safe(self):
        self.assertEqual(bundle.too_new(), [])

    def test_runtime_files_stay_short(self):
        # One concern per file: a file past this is a sign it should be split (AGENTS.md)
        for p in list(bundle.RUNTIME.rglob("*.js")) + list((HERE / "quiz_engine").rglob("*.py")):
            n = len(p.read_text(encoding="utf-8").splitlines())
            self.assertLessEqual(n, 200, f"{p.name} has {n} lines")

    def test_write_runtime(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(write_runtime(Path(d)), [])
            js = (Path(d) / "quiz.js").read_text(encoding="utf-8")
            self.assertTrue(js.startswith("(function () {"))
            self.assertIn("window.QuizEngine", js)


if __name__ == "__main__":
    unittest.main()
