"""The browser runtime, bundled: `quiz.js` and `quiz.css` from `runtime/`.

`runtime/manifest.json` lists the files IN ORDER. The JavaScript files are concatenated inside
one function, so they share one scope with each other but add only `window.QuizEngine` to the
page: the notes page already has hundreds of top-level names of its own. The same checks as
notes-engine's page run here: a syntax check with node when it is installed, and the syntax too
new for older phone browsers (Chromium 73 / Safari 12.1), which would stop the whole quiz.
"""

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

RUNTIME = Path(__file__).resolve().parent / "runtime"

# The same list as notes-engine's page.py (TOO_NEW): keep them in step
TOO_NEW = {
    r"\?\.(?=[\w$\[(])": "optional chaining ?. (Chromium 80)",
    r"\?\?": "nullish ?? (Chromium 80)",
    r"(\|\||&&|\?\?)=": "logical assignment (Chromium 85)",
    r"\.at\(": "Array/String .at() (Chromium 92)",
    r"\breplaceChildren\b": "replaceChildren (Chromium 86)",
    r"\broundRect\b": "roundRect (Chromium 99)",
    r"\breplaceAll\b": "replaceAll (Chromium 85)",
    r"\bstructuredClone\b": "structuredClone (Chromium 98)",
    r"\bObject\.hasOwn\b": "Object.hasOwn (Chromium 93)",
    r"\bfindLast(Index)?\b": "findLast (Chromium 97)",
    r"\bstatic\s*\{": "class static block (Chromium 94)",
    r"\bthis\.#|^\s*#\w+\s*[=;]": "private class field (Chromium 74)",
    r"^\s*(import|export)\b": "ES modules (the runtime is plain scripts)",
}


def manifest():
    return json.loads((RUNTIME / "manifest.json").read_text(encoding="utf-8"))


def too_new():
    """Lines of the runtime's JavaScript using syntax older phones lack: ["file:line: what"]."""
    found = []
    for rel in manifest()["js"]:
        for n, line in enumerate((RUNTIME / rel).read_text(encoding="utf-8").splitlines(), 1):
            code = line.split("//", 1)[0] if "://" not in line else line
            for pattern, what in TOO_NEW.items():
                if re.search(pattern, code):
                    found.append(f"{rel}:{n}: {what}")
    return found


def js_bundle():
    parts = []
    for rel in manifest()["js"]:
        parts.append(f"// ── {rel} ──\n" + (RUNTIME / rel).read_text(encoding="utf-8").rstrip("\n"))
    return '(function () {\n"use strict";\n' + "\n\n".join(parts) + "\n})();\n"


def css_bundle():
    return "\n".join((RUNTIME / rel).read_text(encoding="utf-8").rstrip("\n") for rel in manifest()["css"]) + "\n"


def syntax_error(js):
    """node's complaint about the bundle, or None (also None without node)."""
    node = shutil.which("node")
    if not node:
        return None
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "quiz.js"
        p.write_text(js, encoding="utf-8")
        r = subprocess.run([node, "--check", str(p)], capture_output=True, text=True)
        return r.stderr.strip() if r.returncode else None
