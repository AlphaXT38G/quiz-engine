// ── run.js: the quiz itself, one question after the other ──
// For each question: its type renders the answer area (QZ.types[..].render), Confirm grades it
// once, the type reveals what was right, a badge and the explanation follow, then Next.
// Enter confirms / goes on, the type may take other keys (digits). The scores go to results.js.
// view = { data, finish(results) } (view.js)

QZ.run = function (view, host, questions) {
  var i = 0, results = [], streak = 0;
  var chapterOf = {};
  view.data.chapters.forEach(function (c) { c.questions.forEach(function (q) { chapterOf[q.id] = c.title; }); });

  var label = QZ.el("span", "qz-progress-label");
  var scoreEl = QZ.el("span", "qz-progress-score");
  var fill = QZ.el("div", "qz-progress-fill");
  var stage = QZ.el("div", "qz-stage");
  host.appendChild(QZ.el("div", "qz-run", [
    QZ.el("div", "qz-progress", [QZ.el("div", "qz-progress-meta", [label, scoreEl]), QZ.el("div", "qz-progress-track", [fill])]),
    stage
  ]));

  var handle = null, confirmBtn = null, nextBtn = null, answered = false;

  function total() { return results.reduce(function (s, r) { return s + r.score; }, 0); }

  function progress() {
    label.textContent = (i + 1) + " / " + questions.length;
    scoreEl.textContent = (Math.round(total() * 10) / 10) + " pt" + (total() > 1 ? "s" : "");
    fill.style.transform = "scaleX(" + (i / questions.length) + ")";
  }

  function show() {
    var q = questions[i], type = QZ.types[q.type];
    answered = false;
    progress();
    handle = type.render(q, { base: view.base, sound: QZ.sound, changed: function () { confirmBtn.disabled = !handle.ready(); } });
    confirmBtn = QZ.button("qz-btn qz-btn-primary", "Confirm", confirm);
    confirmBtn.disabled = true;
    var foot = QZ.el("div", "qz-card-foot", [confirmBtn]);
    var card = QZ.el("div", "qz-card", [
      QZ.el("div", "qz-card-tags", [QZ.el("span", "qz-tag", [type.label]), QZ.el("span", "qz-tag qz-tag-soft", [chapterOf[q.id] || ""])]),
      QZ.block("div", "qz-question", q.question),
      handle.node,
      foot
    ]);
    card.qzFoot = foot;
    stage.textContent = "";
    stage.appendChild(card);
    if (stage.scrollIntoView && i) stage.scrollIntoView({ block: "nearest" });
  }

  function confirm() {
    if (answered || !handle.ready()) return;
    answered = true;
    var q = questions[i];
    var score = Math.max(0, Math.min(1, handle.grade()));
    handle.reveal(score);
    results.push({ q: q, score: score });
    streak = score === 1 ? streak + 1 : 0;
    QZ.sound.play(score === 1 ? (streak > 0 && streak % 3 === 0 ? "streak" : "good") : score > 0 ? "partial" : "bad");

    var verdict = score === 1 ? ["is-right", "Correct"] : score > 0 ? ["is-partial", "Partly right"] : ["is-wrong", "Wrong"];
    var foot = stage.firstChild.qzFoot;
    foot.textContent = "";
    foot.appendChild(QZ.el("div", "qz-verdict " + verdict[0], [verdict[1], streak >= 3 ? QZ.el("span", "qz-streak", [" · " + streak + " in a row"]) : null]));
    if (q.explanation) foot.appendChild(QZ.block("div", "qz-explanation", q.explanation));
    nextBtn = QZ.button("qz-btn qz-btn-primary qz-next", i + 1 < questions.length ? "Next" : "See results", next);
    foot.appendChild(nextBtn);
    progress();
    fill.style.transform = "scaleX(" + ((i + 1) / questions.length) + ")";
    nextBtn.focus({ preventScroll: true });
  }

  function next() {
    i++;
    if (i < questions.length) show();
    else view.finish(results);
  }

  show();
  return {
    key: function (e) {
      // Enter confirms / goes on wherever the focus is (an option just clicked keeps it: Enter
      // must not click it again), except in a field where Enter belongs to the typing
      if (e.key === "Enter" && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "")) {
        if (answered) next(); else confirm();
        return true;
      }
      return !answered && handle.key ? handle.key(e) : false;
    }
  };
};
