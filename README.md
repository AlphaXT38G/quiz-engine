# quiz-engine

The quizzes of a notes site. A notes repository (such as `notes_ba5`) writes the questions of a
course in `<subject>/quiz/*.json`, and [notes-engine](https://github.com/AlphaXT38G/notes-engine)
shows a **Quiz** button on that course's card. The button opens the quiz in the page, in the colours
of the current screen.

A quiz starts with a choice of what to practise: everything, some weeks, some chapters, or any
mix, and which kinds of exercise. Then it goes question by question, with a progress bar,
sounds, explanations, and a results screen that offers to retry the missed questions.

## Writing a quiz

One file per chapter, in the course's `quiz/` folder:

```
swent/quiz/week1a.json
swent/quiz/week1b.json
swent/quiz/week2.json
```

```json
{
  "title": "Requirements",
  "week": 1,
  "questions": [
    {
      "type": "scq",
      "question": "Which document lists what the system must do?",
      "options": ["The requirements", "The test plan", "The changelog"],
      "answer": 0,
      "explanation": "Optional: shown after the answer."
    },
    {
      "type": "mcq",
      "question": "Which are *non-functional* requirements?",
      "options": ["Response time", "Login", "Availability"],
      "answer": [0, 2]
    },
    {
      "type": "tf",
      "question": "A user story is a requirement.",
      "answer": true
    }
  ]
}
```

- `week` is optional: by default it is the number in the file name (`week1a` → week 1).
- `answer` counts options from 0. Options are shuffled, unless `"shuffle": false`.
- Text can use `**bold**`, `*italic*`, `` `code` `` and `\n` for a new line.

| Type | What it is |
|---|---|
| `scq` | one right option |
| `mcq` | several right options (partly right answers score partly) |
| `tf` | true or false |

More types are coming: putting photos in order, completing a diagram, flowcharts, drawing a
graph, a world map.

Check a quiz before pushing (a typo in a key or an answer out of range is an error that names the
file and the question):

```bash
python -m quiz_engine check swent/quiz
```

## Trying it alone

```bash
python -m quiz_engine demo
python -m http.server 8790 --directory example/dist   # http://localhost:8790/
```

## Contributing

Read [`AGENTS.md`](AGENTS.md): how it is organised, how it works, how to add a question type.
