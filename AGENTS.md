# AGENTS.md of the quiz engine

Guide for anyone working on the quiz engine, human or AI agent (Claude Code reads it through
`CLAUDE.md`). Read it before adding a question type or changing the quiz view.

## What this repository is

The quizzes of a notes site. It knows **how quizzes work**: the question types, the selection of
what to practise, the question-by-question run, the score, the sounds. It knows nothing about any
course: the questions live in the notes repositories, and the page that shows them is
notes-engine's.

```
notes_ba5/swent/quiz/*.json      the questions of a course            (a notes repository)
        │  read and validated by
quiz-engine (this repository)    quiz_engine/ (Python) + runtime/ (the browser's JS and CSS)
        │  called by
notes-engine                     its build writes dist/quiz/; its page has the Quiz button
                                 and opens the quiz as a view inside index.html
```

The three are separate repositories. notes-engine reads this one the way a notes repository
reads notes-engine: on a computer, the checkout next to it (`../quiz-engine`); on GitHub, its
publish workflow fetches this repository's `main` beside the engine. So what is pushed to `main`
is online at the next build of the notes: keep `main` working, and never remove a type or a key
that quiz files already use.

## Repository layout

```
quiz_engine/
  __init__.py         the public API: build_subject(), write_runtime(), QuizError
  cli.py              python -m quiz_engine check <quiz dirs> | demo
  load.py             a subject's quiz/ folder -> the browser's data (chapters, weeks, question ids)
  validate.py         the checks shared by every question; QuizError
  types/              one module per family of types: the keys a type allows and its check
    choice.py           scq, mcq
    truefalse.py        tf
  bundle.py           runtime/ -> quiz.js + quiz.css (manifest order), syntax checks
  build.py            what a build writes (see "What a build writes")
  runtime/            the browser side, plain scripts for Chromium 73 / Safari 12.1
    manifest.json       the JS and CSS files, IN ORDER
    js/  css/           one concern per file (see the tables below)
    js/types/ css/types/  one file per family of question types
  demo/index.html     a stand-in for the notes page, to try the quiz alone
example/quiz/         a small quiz (3 chapters over 2 weeks): the demo and the tests use it
tests/                python -m unittest discover -s tests
```

## The quiz files (in a notes repository)

```
<subject>/quiz/
  week1a.json         one file = one chapter
  week1b.json
  week2.json
  img/...             any other file (images for later types) is copied as is
```

```json
{
  "title": "Caches",
  "week": 1,
  "questions": [
    {"type": "scq", "question": "What does a **cache hit** mean?",
     "options": ["Found in the cache", "Fetched from memory"], "answer": 0,
     "explanation": "Optional, shown after the answer."}
  ]
}
```

- `title`: the chapter's name in the selection (default: the file name).
- `week`: its week (default: the number at the start of the file name, as notes-engine reads its
  weekly notes: `01`, `week3`, `week1a`, `week_2`). A chapter without a week goes under "Other".
- Files are ordered naturally (`week2` before `week10`).
- Every question has `type`, `question`, optional `explanation`, and its type's keys:

| Type | Family (filter) | Keys | Score |
|---|---|---|---|
| `scq` | Multiple choice | `options` (≥ 2), `answer` (an index), `shuffle` (default true) | 0 or 1 |
| `mcq` | Multiple choice | `options`, `answer` (a list of indices), `shuffle` | (right picks − wrong picks) / right options, ≥ 0 |
| `tf` | True / false | `answer` (true / false) | 0 or 1 |

- **Text markup** (questions, options, explanations): `**bold**`, `*italic*`, `` `code` ``,
  `\n` for a line break. Never HTML: it is shown as text (`text.js`).
- **Any mistake is a build error** naming the file and the question: an unknown key (a typo), a
  type that does not exist, an answer out of range, invalid JSON (with its line). Check a folder
  with `python -m quiz_engine check ../notes_ba5/swent/quiz`.

## What a build writes

```
dist/quiz/quiz.js, quiz.css       write_runtime(dist / "quiz")        once
dist/quiz/<subject>/data.json     build_subject(quiz_dir, dist / "quiz" / subject)
dist/quiz/<subject>/img/...       the quiz folder's other files
```

`data.json` is `{"chapters": [{"id", "title", "week", "questions": [... each with an "id",
"<file>/<index>"]}]}`. `quiz.js` is every file of `runtime/manifest.json` concatenated inside
one function (`bundle.py`): the files share one scope with each other, and the page only gets
`window.QuizEngine`. The notes page already has hundreds of top-level names of its own.

## How the browser side works

### The page's side: `window.QuizEngine`

```js
QuizEngine.open(host, { url: "quiz/swent/data.json", title: "Software enterprise", onClose: fn });
QuizEngine.close();      // empties the host, without calling onClose
QuizEngine.isOpen();
```

The host page loads `quiz.css` and `quiz.js` (notes-engine: on the first click of a Quiz
button), hides its own content and calls `open()`. Everything else is the host's: its URL
(`#quiz/<subject>`), its back button, showing its content again in `onClose`. The demo
(`demo/index.html`) does exactly what notes-engine does, in 30 lines.

### The steps of a quiz

```
select  ──Start──▶  run  ──last answer──▶  results
   ▲                 │                       │  "Retry the missed" ─▶ run (those questions)
   └──── back arrow / Escape ◀───────────────┘  "New quiz" ─▶ select
select ── back arrow / Escape ──▶ onClose() (the host shows its page again)
```

1. **Selection** (`select.js`, the logic in `pick.js`): the content (weeks, each with its
   chapters: a week's box checks all its chapters, so everything, a week, a chapter or any mix
   are the same gesture), the kinds of exercise (one chip per family present), the length (10,
   20, all). The count follows every change. The selection is remembered per quiz
   (localStorage `qz-sel:<url>`), cleaned of chapters that no longer exist.
2. **Run** (`run.js`): the drawn questions, shuffled, one at a time. The question's type renders
   its answer area; Confirm (or Enter) grades it once, the type reveals what was right, a verdict
   (Correct / Partly right / Wrong, the streak from 3 in a row), the explanation, Next.
3. **Results** (`results.js`): the score in a ring, a word, the score per family, retry the
   missed questions (any not fully right) or a new quiz.

### JS files, in load order

| File | What it does |
|---|---|
| `core.js` | `QZ`, the namespace every file shares; `QZ.el()` / `QZ.button()` (DOM, never innerHTML), `QZ.shuffle()`, `QZ.store` (localStorage, guarded), `QZ.family()` and `QZ.type()`, the registries |
| `text.js` | `QZ.rich()` / `QZ.block()`: the light markup of the quiz text, as DOM nodes |
| `sound.js` | `QZ.sound`: the effects (`pick`, `good`, `partial`, `bad`, `streak`, `done`) made with Web Audio, the mute toggle (`qz-sound`) |
| `types/choice.js` | the Multiple choice family: `scq`, `mcq`; `QZ.choiceRender()`, which `tf` reuses |
| `types/truefalse.js` | the True / false family: `tf` |
| `pick.js` | `QZ.pick`: weeks and families of the data, the questions a selection gives, drawing them, restoring a saved selection. No DOM: easy to reason about |
| `select.js` | the selection screen |
| `run.js` | the run: progress bar, the question card, confirm, verdict, explanation, next |
| `results.js` | the results screen |
| `view.js` | **last**: the frame (back arrow, title, sound toggle), the steps, the keys (Escape, Enter, the types' keys), loading `data.json`, `window.QuizEngine` |

### CSS files, in cascade order

`view.css` (the frame, buttons, the colour tokens) → `select.css` → `run.css` → `results.css` →
`types/choice.css` (one file per family).

### Colours: the quiz takes the screen's

The quiz has no colours of its own: it reads the page's tokens (`--bg --fg --card --line --mut
--acc --acc-bg --new --new-bg`), which notes-engine's `base.css` sets for light and dark and
every screen (jazz bar, Christmas, Halloween...) sets again. Opened on the Halloween screen, the
quiz is Halloween's colours. `view.css` maps them to `--qz-*` with fallbacks for a bare page, and
adds the verdict colours (`--qz-bad`, `--qz-part`, translucent so they sit on any card). Never
write a colour in a type's CSS: use the `--qz-*` tokens.

## Adding a question type

Example: `order` (put photos in order), in a new family "Ordering".

1. **`quiz_engine/types/ordering.py`**: the keys it allows and its check, then add the module to
   `types/__init__.py`.

   ```python
   def check_order(q):
       items = q.get("items")
       if not isinstance(items, list) or len(items) < 2:
           return "\"items\" must list at least 2 things, in the right order"
       return None

   TYPES = {"order": {"keys": {"items"}, "check": check_order}}
   ```

2. **`runtime/js/types/ordering.js`**: its family (once per family), then the type. `render`
   returns the handle `run.js` drives:

   ```js
   QZ.family("order", "Ordering", 30);       // label of the filter chip, place among the chips
   QZ.type("order", {
     family: "order",
     label: "Put in order",                   // shown above the question
     render: function (q, ctx) {
       // build the answer area; call ctx.changed() whenever ready() may have changed;
       // ctx.base is the subject's folder (images: ctx.base + "img/a.jpg"); ctx.sound.play("pick")
       return {
         node: el,                            // the answer area
         ready: function () { return true; }, // can it be confirmed?
         grade: function () { return 1; },    // once, on confirm: 0 to 1 (partial is fine)
         reveal: function (score) {},         // lock the inputs, show the right answer
         key: function (e) { return false; }  // optional: keys it uses (true if used)
       };
     }
   });
   ```

3. **`runtime/css/types/ordering.css`**: its look, with the `--qz-*` tokens only, its own
   `@media(prefers-reduced-motion:reduce)` block, controls ≥ 44 px under `pointer:coarse`.
4. **`runtime/manifest.json`**: the JS after the other types (before `pick.js`), the CSS at the
   end.
5. **`example/quiz/`**: a question or two of the new type; this file's tables (the types, the
   files); then `python -m unittest discover -s tests` and the demo.

The tests fail if the Python side and the browser side do not know the same type names, if a
runtime file is missing from the manifest, or if a file grows past 200 lines.

## Build and try

```bash
python -m unittest discover -s tests       # validation, loading, the bundle's rules
python -m quiz_engine check example/quiz   # validate quiz folders
python -m quiz_engine demo                 # example/ -> example/dist/ (git-ignored)
python -m http.server 8790 --directory example/dist   # then http://localhost:8790/
```

Windows: prefix with `PYTHONIOENCODING=utf-8` if the console cannot print a character. `node`,
when installed, checks the bundle's syntax at every build.

Before committing a runtime change: the tests, the demo in light and dark (the button top
right), a whole quiz with the mouse and with the keyboard (digits, Enter, Escape), and a
375 px wide window.

## Good practices

### Code

- **One concern per file**, a header saying what it is about, the why in comments. No file past
  200 lines (a test checks it): split it before, as the types are split by family.
- **Never innerHTML** with quiz content: build nodes (`QZ.el`, `QZ.rich`).
- **Only `div`s and classes** for the quiz's structure (no `<section>`, `<header>`, `<article>`
  for layout): the host page styles those elements, and its screens even more (`body.halloween
  header{...}` would beat `.qz-head`). Prefix every class with `qz-`.
- **Everything goes through `QZ`**: no new top-level name escapes the bundle, and only `view.js`
  touches `window`.
- **localStorage can throw**: use `QZ.store`, which catches.
- **Sound** only from `QZ.sound` (Web Audio, guarded; the quiz opens from a click, so it may play).

### Phones and older browsers (the same rules as notes-engine)

- **JavaScript for Chromium 73 / Safari 12.1**: no `?.`, `??`, `||=`, `.at()`, `replaceAll`,
  `replaceChildren`, private fields, ES modules... `bundle.TOO_NEW` lists them (keep it in step
  with notes-engine's `page.py`) and a test fails on any.
- **Guard optional APIs** (`AudioContext`, `matchMedia`) before use.
- **Touch**: controls at least 44 px high under `pointer:coarse`; drag-and-drop types use Pointer
  Events, not the HTML5 drag-and-drop API (it does not work with a finger).

### Performance

- Animate **only `transform` and `opacity`** (the progress bar is a `scaleX`, not a width).
- Each CSS file has its own `@media(prefers-reduced-motion:reduce)` block.

## Workflow

- **Branch** from an up-to-date `main` (`feat/...`, `fix/...`), open a PR.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) in English,
  `type(scope): summary`. Scopes: `runtime`, `types`, `build`, `demo`, `docs`.
- Keep `README.md` (for authors of quizzes) and this file (for contributors) up to date.
