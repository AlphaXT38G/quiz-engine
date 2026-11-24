// ── view.js: the quiz view and the one thing the page sees, window.QuizEngine ──
//   QuizEngine.open(host, { url, title, onClose })   fills `host` with the quiz of `url`
//   QuizEngine.close()                                empties it (onClose is not called)
//   QuizEngine.isOpen()
// `url` is a subject's data.json (build.py); its folder is the base of the quiz's images.
// The header holds the back arrow (top left) and the sound toggle. The arrow goes one step back:
// results or questions -> the selection -> onClose() (the host shows its page again). Escape too.
// The host owns everything else (its history, its hash, hiding its own content).

(function () {
  var cache = {};       // url -> data, so that coming back to a quiz does not fetch it again
  var current = null;   // the open view, or null

  function svg(paths, cls) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    paths.forEach(function (d) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }
  var ICON_BACK = ["M15 5l-7 7 7 7"];
  var ICON_SOUND = ["M4 9h4l5-4v14l-5-4H4z", "M16.5 8.5a5 5 0 0 1 0 7", "M19 6a8.5 8.5 0 0 1 0 12"];
  var ICON_MUTE = ["M4 9h4l5-4v14l-5-4H4z", "M17 9.5l5 5", "M22 9.5l-5 5"];

  function fetchData(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    }).then(function (d) { cache[url] = d; return d; });
  }

  function open(host, opts) {
    close();
    var view = { host: host, opts: opts, screen: null, step: "select", base: opts.url.replace(/[^/]*$/, "") };
    current = view;

    var back = QZ.button("qz-icon qz-back", "", function () { goBack(view); });
    back.setAttribute("aria-label", "Back");
    back.appendChild(svg(ICON_BACK));
    var sound = QZ.button("qz-icon qz-sound", "", function () {
      QZ.sound.toggle();
      paintSound();
      QZ.sound.play("pick");
    });
    function paintSound() {
      sound.textContent = "";
      sound.appendChild(svg(QZ.sound.isOn() ? ICON_SOUND : ICON_MUTE));
      sound.setAttribute("aria-label", QZ.sound.isOn() ? "Sound on" : "Sound off");
      sound.setAttribute("aria-pressed", QZ.sound.isOn() ? "true" : "false");
    }
    paintSound();

    view.body = QZ.el("div", "qz-body", [QZ.el("p", "qz-note", ["Loading the quiz…"])]);
    view.root = QZ.el("div", "qz", [
      QZ.el("div", "qz-head", [back, QZ.el("div", "qz-titles", [QZ.el("h2", "qz-title", [opts.title || "Quiz"]), QZ.el("span", "qz-kicker", ["Quiz"])]), sound]),
      view.body
    ]);
    view.root.setAttribute("role", "region");
    view.root.setAttribute("aria-label", "Quiz");
    host.appendChild(view.root);

    view.onKey = function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      // Typing in the page's own fields (the notes' search) is not for the quiz
      var t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) && !view.root.contains(t)) return;
      if (e.key === "Escape") { goBack(view); e.preventDefault(); return; }
      if (view.screen && view.screen.key && view.screen.key(e)) e.preventDefault();
    };
    document.addEventListener("keydown", view.onKey);

    fetchData(opts.url).then(function (data) {
      if (current !== view) return;
      view.data = data;
      view.selKey = "sel:" + opts.url;
      view.sel = QZ.pick.restore(data, QZ.store.get(view.selKey, null));
      view.saveSel = function () { QZ.store.set(view.selKey, view.sel); };
      view.start = function (qs) { show(view, "run", function (host) { return QZ.run(view, host, qs); }); };
      view.again = view.start;
      view.finish = function (results) { show(view, "results", function (host) { return QZ.results(view, host, results); }); };
      view.toSelect = function () { show(view, "select", function (host) { return QZ.select(view, host); }); };
      view.toSelect();
    }).catch(function (err) {
      if (current !== view) return;
      view.body.textContent = "";
      view.body.appendChild(QZ.el("p", "qz-note", ["The quiz could not be loaded (" + err.message + ")."]));
    });
  }

  // Swap the body for another screen, with a short slide in (transform / opacity only)
  function show(view, step, make) {
    view.step = step;
    view.body.textContent = "";
    var holder = QZ.el("div", "qz-screen");
    view.body.appendChild(holder);
    view.screen = make(holder);
    if (view.root.getBoundingClientRect().top < 0 && view.root.scrollIntoView) view.root.scrollIntoView();
  }

  function goBack(view) {
    if (view.step !== "select" && view.data) view.toSelect();
    else { var cb = view.opts.onClose; close(); if (cb) cb(); }
  }

  function close() {
    if (!current) return;
    document.removeEventListener("keydown", current.onKey);
    if (current.root.parentNode) current.root.parentNode.removeChild(current.root);
    current = null;
  }

  window.QuizEngine = {
    version: "0.1.0",
    open: open,
    close: close,
    isOpen: function () { return !!current; }
  };
})();
