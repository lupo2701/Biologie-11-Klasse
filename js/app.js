/* Zell-Quest: Lern-App Biologie Klasse 11 (ohne Server, Fortschritt in localStorage) */
(() => {
  "use strict";

  // ---------- Speicher ----------
  const KEY = "zellquest-v1";
  const DEFAULT = { name: "", xp: 0, badges: {}, best: {}, played: {}, flashKnown: 0, openDone: 0,
    simSeen: {}, streak: { last: null, count: 0 }, bossWins: 0, bestCombo: 0 };
  let S = load();
  function load() {
    try { return Object.assign(structuredClone(DEFAULT), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch { return structuredClone(DEFAULT); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* privat-modus */ } }

  // ---------- Hilfen ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $("#app");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const today = () => new Date().toLocaleDateString("sv-SE");
  const moduleById = id => MODULES.find(m => m.id === id);

  function levelInfo(xp = S.xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    const pct = next ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100) : 100;
    return { idx: i, name: cur.name, next, pct };
  }

  // ---------- Belohnungen ----------
  function addXP(n) {
    if (n <= 0) return;
    const before = levelInfo().idx;
    S.xp += n;
    touchStreak();
    save();
    const after = levelInfo();
    if (after.idx > before) {
      toast(`<b>Level ${after.idx + 1}!</b> Du bist jetzt <b>${esc(after.name)}</b>`, "level");
      confetti();
    }
    renderStats();
  }
  function touchStreak() {
    const t = today();
    if (S.streak.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak.count = S.streak.last === y.toLocaleDateString("sv-SE") ? S.streak.count + 1 : 1;
    S.streak.last = t;
    if (S.streak.count >= 3) award("streak3");
  }
  function award(id) {
    if (S.badges[id]) return;
    const b = BADGES.find(x => x.id === id); if (!b) return;
    S.badges[id] = today(); save();
    toast(`<span class="t-icon">${b.icon}</span> Abzeichen: <b>${esc(b.name)}</b>`, "badge");
  }
  function toast(html, kind = "") {
    const el = h(`<div class="toast ${kind}">${html}</div>`);
    $("#toasts").appendChild(el);
    setTimeout(() => el.classList.add("out"), 2800);
    setTimeout(() => el.remove(), 3300);
  }
  function confetti() {
    const c = $("#confetti"), ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const cols = ["#2f8f5b", "#7b3fa0", "#1f7fb3", "#e7a92b", "#c0562f"];
    const P = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4,
      vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 5, a: Math.random() * 6, col: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.a += .1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (++f < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  function renderStats() {
    const L = levelInfo();
    $("#stats").innerHTML = `
      <span class="pill" title="Lernserie in Tagen">🔥 ${S.streak.count || 0}</span>
      <span class="pill" title="Erfahrungspunkte">⭐ ${S.xp} XP</span>
      <span class="pill lvl" title="Level">Lv ${L.idx + 1}</span>`;
  }

  // ---------- Router ----------
  const routes = {
    "": viewHome, "modul": viewModule, "quiz": viewQuiz, "erklaeren": viewOpen,
    "karten": viewFlash, "labor": viewLab, "boss": viewBoss, "abzeichen": viewBadges, "datenschutz": viewPrivacy,
  };
  function route() {
    const [, name = "", arg] = location.hash.replace(/^#/, "").split("/");
    (routes[name] || viewHome)(arg);
    window.scrollTo(0, 0);
    renderStats();
  }
  addEventListener("hashchange", route);

  // ---------- Startseite ----------
  function viewHome() {
    if (!S.name) return viewWelcome();
    const L = levelInfo();
    const allPlayed = MODULES.every(m => S.played[m.id]);
    const badgeCount = Object.keys(S.badges).length;
    app.innerHTML = `
      <section class="hero card">
        <div>
          <p class="muted">Hallo ${esc(S.name)}!</p>
          <h1>${esc(L.name)} <span class="lv">Level ${L.idx + 1}</span></h1>
          <div class="xpbar"><div style="width:${L.pct}%"></div></div>
          <p class="muted small">${L.next ? `${L.next.xp - S.xp} XP bis „${esc(L.next.name)}“` : "Höchstes Level erreicht!"}</p>
        </div>
        <div class="hero-side">
          <div class="big">🔥 ${S.streak.count || 0}</div><div class="muted small">Tage in Folge</div>
        </div>
      </section>

      <h2 class="section">Lernmodule</h2>
      <div class="grid">
        ${MODULES.map(m => {
          const best = S.best[m.id];
          return `<a class="card module" href="#/modul/${m.id}" style="--mc:${m.color}">
            <div class="m-icon">${m.icon}</div>
            <div class="m-body"><h3>${esc(m.title)}</h3><p class="muted small">${esc(m.intro)}</p>
            <div class="minibar"><div style="width:${best || 0}%"></div></div>
            <p class="small">${best != null ? `Bestes Ergebnis: <b>${best} %</b>` : "Noch nicht gespielt"}</p></div>
          </a>`; }).join("")}
      </div>

      <h2 class="section">Extras</h2>
      <div class="grid tiles">
        <a class="card tile" href="#/karten"><div class="t-big">🃏</div><h3>Karteikarten</h3><p class="muted small">${FLASHCARDS.length} Fachbegriffe</p></a>
        <a class="card tile" href="#/labor"><div class="t-big">🧪</div><h3>Osmose-Labor</h3><p class="muted small">Zellen in Lösungen testen</p></a>
        <a class="card tile ${allPlayed ? "" : "locked"}" href="#/boss"><div class="t-big">${allPlayed ? "👾" : "🔒"}</div><h3>Abschluss-Boss</h3>
          <p class="muted small">${allPlayed ? "Bereit zum Kampf?" : "Spiele zuerst alle 4 Module"}</p></a>
        <a class="card tile" href="#/abzeichen"><div class="t-big">🏅</div><h3>Abzeichen</h3><p class="muted small">${badgeCount} von ${BADGES.length}</p></a>
      </div>`;
  }

  function viewWelcome() {
    app.innerHTML = `
      <section class="card welcome">
        <div class="t-big">🧫</div>
        <h1>Willkommen bei Zell-Quest</h1>
        <p>Trainiere Zellbiologie, Biomembranen, Diffusion und Osmose. Sammle XP, steige Level auf, schalte Abzeichen frei und besiege am Ende den Abschluss-Boss.</p>
        <form id="nameForm" class="row">
          <input id="nameIn" maxlength="20" placeholder="Dein Spitzname" autocomplete="off" required>
          <button class="btn primary">Los geht’s</button>
        </form>
        <p class="muted small">Spitzname und Fortschritt bleiben nur auf diesem Gerät gespeichert. <a class="link" href="#/datenschutz">Datenschutz</a></p>
      </section>`;
    $("#nameForm").onsubmit = e => { e.preventDefault(); S.name = $("#nameIn").value.trim().slice(0, 20); save(); route(); };
    $("#nameIn").focus();
  }

  // ---------- Modulseite ----------
  function viewModule(id) {
    const m = moduleById(id); if (!m) return viewHome();
    app.innerHTML = `
      <a class="back" href="#/">← Übersicht</a>
      <section class="card mhead" style="--mc:${m.color}">
        <div class="m-icon xl">${m.icon}</div>
        <div><h1>${esc(m.title)}</h1><p class="muted">${esc(m.intro)}</p></div>
      </section>
      <div class="grid tiles">
        <a class="card tile" href="#/quiz/${m.id}"><div class="t-big">🎯</div><h3>Quiz</h3><p class="muted small">${m.questions.length} Fragen · bis zu ${m.questions.length * 15} XP</p></a>
        <a class="card tile" href="#/erklaeren/${m.id}"><div class="t-big">✍️</div><h3>Erklär-Aufgaben</h3><p class="muted small">Klausur-Training mit Selbstkontrolle</p></a>
      </div>`;
  }

  // ---------- Quiz-Engine ----------
  function runQuiz(questions, opts) {
    const st = { qs: questions, i: 0, correct: 0, combo: 0, xp: 0, hearts: 3, hp: opts.bossHP || 0 };
    const next = () => {
      if (opts.boss && (st.hp <= 0 || st.hearts <= 0)) return opts.onEnd(st);
      if (st.i >= st.qs.length) {
        if (opts.boss) { st.qs = st.qs.concat(shuffle(st.qs)); } else return opts.onEnd(st);
      }
      showQuestion(st.qs[st.i], st, opts, () => { st.i++; next(); });
    };
    next();
  }

  function showQuestion(q, st, opts, done) {
    const total = opts.boss ? opts.bossHP : st.qs.length;
    const progress = opts.boss ? (opts.bossHP - st.hp) / opts.bossHP * 100 : st.i / total * 100;
    app.innerHTML = `
      <a class="back" href="${opts.backHref}">← Abbrechen</a>
      ${opts.boss ? bossBar(st, opts) : `
      <div class="qtop"><span class="muted small">Frage ${st.i + 1} von ${total}</span>
        <span class="combo ${st.combo >= 3 ? "hot" : ""}">${st.combo >= 2 ? `🔥 Combo ×${st.combo}` : ""}</span></div>
      <div class="xpbar thin"><div style="width:${progress}%"></div></div>`}
      <section class="card q">
        <p class="qtype">${({ mc: "Multiple Choice", tf: "Richtig oder falsch?", order: "Reihenfolge", match: "Zuordnen", gap: "Lückentext" })[q.type]}</p>
        <h2 class="qtext">${esc(q.q)}</h2>
        <div id="qbody"></div>
        <div id="feedback"></div>
        <div class="actions"><button id="checkBtn" class="btn primary" disabled>Prüfen</button></div>
      </section>`;
    const body = $("#qbody"), btn = $("#checkBtn");
    const R = RENDER[q.type](q, body, ready => { btn.disabled = !ready; });
    btn.onclick = () => {
      if (btn.dataset.state === "next") return done();
      const ok = R.check();
      R.lock();
      if (ok) {
        st.correct++; st.combo++;
        const gain = 10 + (st.combo >= 3 ? 5 : 0);
        st.xp += gain; addXP(gain);
        award("first");
        if (st.combo >= 5) award("combo5");
        if (st.combo >= 10) award("combo10");
        S.bestCombo = Math.max(S.bestCombo, st.combo); save();
        if (opts.boss) st.hp--;
      } else {
        st.combo = 0;
        if (opts.boss) st.hearts--;
      }
      $("#feedback").innerHTML = `<div class="fb ${ok ? "ok" : "bad"}">
        <b>${ok ? pick(["Richtig!", "Stark!", "Genau so!", "Super!"]) + (st.combo >= 3 ? ` +${10 + 5} XP` : " +10 XP") : "Leider nicht ganz."}</b>
        <p>${esc(q.explain)}</p></div>`;
      if (opts.boss) { const bb = $(".bossbar"); if (bb) bb.outerHTML = bossBar(st, opts); if (ok) hitBoss(); }
      btn.textContent = "Weiter →"; btn.dataset.state = "next"; btn.disabled = false; btn.focus();
    };
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // Renderer je Fragetyp: liefern { check(): bool, lock() }
  const RENDER = {
    mc(q, el, ready) {
      const opts = shuffle(q.options); let sel = null;
      el.innerHTML = `<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
      el.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        el.querySelectorAll(".opt").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = opts[+b.dataset.i]; ready(true); });
      return {
        check: () => sel === q.answer,
        lock() { el.querySelectorAll(".opt").forEach(b => { b.disabled = true; const o = opts[+b.dataset.i];
          if (o === q.answer) b.classList.add("right"); else if (o === sel) b.classList.add("wrong"); }); },
      };
    },
    tf(q, el, ready) {
      let sel = null;
      el.innerHTML = `<div class="opts two"><button class="opt" data-v="1">✔ Richtig</button><button class="opt" data-v="0">✘ Falsch</button></div>`;
      el.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        el.querySelectorAll(".opt").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = b.dataset.v === "1"; ready(true); });
      return {
        check: () => sel === q.answer,
        lock() { el.querySelectorAll(".opt").forEach(b => { b.disabled = true; const v = b.dataset.v === "1";
          if (v === q.answer) b.classList.add("right"); else if (v === sel) b.classList.add("wrong"); }); },
      };
    },
    order(q, el, ready) {
      let items = shuffle(q.items);
      while (items.length > 1 && items.every((x, i) => x === q.items[i])) items = shuffle(q.items);
      let locked = false;
      const draw = () => {
        el.innerHTML = `<ol class="order">${items.map((t, i) => `<li data-i="${i}"><span class="num">${i + 1}</span><span class="otext">${esc(t)}</span>
          <span class="ob"><button class="mini" data-up="${i}" ${i === 0 || locked ? "disabled" : ""} aria-label="nach oben">▲</button>
          <button class="mini" data-down="${i}" ${i === items.length - 1 || locked ? "disabled" : ""} aria-label="nach unten">▼</button></span></li>`).join("")}</ol>
          <p class="muted small">Verschiebe die Schritte mit ▲ und ▼.</p>`;
        el.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const i = +b.dataset.up; [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); });
        el.querySelectorAll("[data-down]").forEach(b => b.onclick = () => { const i = +b.dataset.down; [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); });
      };
      draw(); ready(true);
      return {
        check: () => items.every((x, i) => x === q.items[i]),
        lock() { locked = true; draw();
          el.querySelectorAll(".order li").forEach((li, i) => li.classList.add(items[i] === q.items[i] ? "right" : "wrong"));
          if (!items.every((x, i) => x === q.items[i]))
            el.insertAdjacentHTML("beforeend", `<div class="solution"><b>Richtige Reihenfolge:</b><ol>${q.items.map(t => `<li>${esc(t)}</li>`).join("")}</ol></div>`); },
      };
    },
    match(q, el, ready) {
      const defs = shuffle(q.pairs.map(p => p[1]));
      el.innerHTML = `<div class="match">${q.pairs.map((p, i) => `<label class="mrow"><span class="term">${esc(p[0])}</span>
        <select data-i="${i}"><option value="">– wählen –</option>${defs.map(d => `<option>${esc(d)}</option>`).join("")}</select></label>`).join("")}</div>`;
      const sels = [...el.querySelectorAll("select")];
      sels.forEach(s => s.onchange = () => ready(sels.every(x => x.value)));
      return {
        check: () => sels.every((s, i) => s.value === q.pairs[i][1]),
        lock() { sels.forEach((s, i) => { s.disabled = true; const ok = s.value === q.pairs[i][1];
          s.parentElement.classList.add(ok ? "right" : "wrong");
          if (!ok) s.insertAdjacentHTML("afterend", `<span class="corr">→ ${esc(q.pairs[i][1])}</span>`); }); },
      };
    },
    gap(q, el, ready) {
      const html = esc(q.text).replace(/\{(\d+)\}/g, (_, n) => {
        const g = q.gaps[+n];
        return `<select class="gapsel" data-g="${n}"><option value="">…</option>${shuffle(g.options).map(o => `<option>${esc(o)}</option>`).join("")}</select>`; });
      el.innerHTML = `<p class="gaptext">${html}</p>`;
      const sels = [...el.querySelectorAll("select")];
      sels.forEach(s => s.onchange = () => ready(sels.every(x => x.value)));
      return {
        check: () => sels.every(s => s.value === q.gaps[+s.dataset.g].answer),
        lock() { sels.forEach(s => { s.disabled = true; const a = q.gaps[+s.dataset.g].answer; const ok = s.value === a;
          s.classList.add(ok ? "right" : "wrong"); if (!ok) s.insertAdjacentHTML("afterend", ` <span class="corr">(${esc(a)})</span>`); }); },
      };
    },
  };

  // ---------- Modul-Quiz ----------
  function viewQuiz(id) {
    const m = moduleById(id); if (!m) return viewHome();
    runQuiz(shuffle(m.questions), {
      backHref: `#/modul/${m.id}`,
      onEnd(st) {
        const pct = Math.round(st.correct / st.qs.length * 100);
        S.played[m.id] = (S.played[m.id] || 0) + 1;
        S.best[m.id] = Math.max(S.best[m.id] || 0, pct); save();
        if (pct >= 80) award(m.id);
        if (pct === 100) award("perfect");
        if (pct >= 80) confetti();
        const stars = pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0;
        app.innerHTML = `
          <section class="card result">
            <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? "on" : ""}">★</span>`).join("")}</div>
            <h1>${pct} %</h1>
            <p>${st.correct} von ${st.qs.length} richtig · <b>+${st.xp} XP</b></p>
            <p class="muted">${pct === 100 ? "Fehlerfrei. Stark!" : pct >= 80 ? "Sehr gut, das Modul sitzt!" : pct >= 50 ? "Ordentlich. Noch eine Runde, dann sitzt es." : "Lies dir die Erklärungen nochmal durch und versuch es erneut."}</p>
            <div class="actions center">
              <a class="btn primary" href="#/quiz/${m.id}">Nochmal</a>
              <a class="btn" href="#/erklaeren/${m.id}">Erklär-Aufgaben</a>
              <a class="btn" href="#/">Übersicht</a>
            </div>
          </section>`;
        // "Nochmal" muss neu starten, auch wenn der Hash gleich bleibt
        app.querySelector(".btn.primary").onclick = e => { e.preventDefault(); viewQuiz(m.id); };
      },
    });
  }

  // ---------- Erklär-Aufgaben ----------
  function viewOpen(id, idx = 0) {
    const m = moduleById(id); if (!m) return viewHome();
    const t = m.openTasks[idx];
    app.innerHTML = `
      <a class="back" href="#/modul/${m.id}">← ${esc(m.title)}</a>
      <section class="card q">
        <p class="qtype">Erklär-Aufgabe ${idx + 1} von ${m.openTasks.length}</p>
        <h2 class="qtext">${esc(t.q)}</h2>
        <textarea id="ans" rows="7" placeholder="Schreibe deine Antwort hier in ganzen Sätzen, wie in der Klausur …"></textarea>
        <div class="actions"><button id="show" class="btn primary">Musterlösung vergleichen</button></div>
        <div id="cmp"></div>
      </section>`;
    $("#show").onclick = () => {
      $("#show").remove();
      $("#ans").readOnly = true;
      $("#cmp").innerHTML = `
        <div class="fb neutral"><b>Vergleiche ehrlich:</b> Hake jeden Punkt ab, den deine Antwort enthält. Pro Punkt gibt es 5 XP.</div>
        <div class="checks">${t.points.map((p, i) => `<label class="chk"><input type="checkbox" data-i="${i}"><span>${esc(p)}</span></label>`).join("")}</div>
        <div class="actions"><button id="fin" class="btn primary">Fertig</button></div>`;
      $("#fin").onclick = () => {
        const n = app.querySelectorAll(".checks input:checked").length;
        addXP(n * 5);
        S.openDone++; save();
        if (S.openDone >= 3) award("writer");
        const more = idx + 1 < m.openTasks.length;
        $("#cmp").insertAdjacentHTML("beforeend", `<div class="fb ok"><b>${n} von ${t.points.length} Punkten · +${n * 5} XP</b>
          <p>${n === t.points.length ? "Vollständig! Genau so sollte eine Klausurantwort aussehen." : "Ergänze die fehlenden Punkte gedanklich und schreib die Antwort beim nächsten Mal vollständiger."}</p></div>
          <div class="actions">${more ? `<button id="nx" class="btn primary">Nächste Aufgabe →</button>` : ""}<a class="btn" href="#/modul/${m.id}">Zum Modul</a></div>`);
        $("#fin").remove();
        if (more) $("#nx").onclick = () => viewOpen(id, idx + 1);
      };
    };
  }

  // ---------- Karteikarten ----------
  function viewFlash() {
    let deck = shuffle(FLASHCARDS), known = 0;
    const draw = () => {
      if (!deck.length) {
        app.innerHTML = `<section class="card result"><div class="t-big">🃏</div><h1>Stapel geschafft!</h1>
          <p>Du hast alle ${FLASHCARDS.length} Begriffe durchgearbeitet. <b>+${known * 2} XP</b></p>
          <div class="actions center"><button class="btn primary" id="again">Nochmal mischen</button><a class="btn" href="#/">Übersicht</a></div></section>`;
        $("#again").onclick = viewFlash; return;
      }
      const [term, def] = deck[0];
      app.innerHTML = `
        <a class="back" href="#/">← Übersicht</a>
        <div class="qtop"><span class="muted small">Noch ${deck.length} Karten im Stapel</span><span class="muted small">Gewusst: ${known}</span></div>
        <div class="flip" id="card" tabindex="0" role="button" aria-label="Karte umdrehen">
          <div class="face front"><span class="muted small">Begriff</span><h2>${esc(term)}</h2><span class="muted small">Tippen zum Umdrehen</span></div>
          <div class="face back"><span class="muted small">${esc(term)}</span><p>${esc(def)}</p></div>
        </div>
        <div class="actions center"><button class="btn" id="again">↻ Nochmal</button><button class="btn primary" id="knew">✓ Gewusst</button></div>`;
      const card = $("#card");
      const flip = () => card.classList.toggle("flipped");
      card.onclick = flip; card.onkeydown = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } };
      $("#knew").onclick = () => { deck.shift(); known++; S.flashKnown++; save(); addXP(2); if (S.flashKnown >= 20) award("flash"); draw(); };
      $("#again").onclick = () => { deck.push(deck.shift()); draw(); };
    };
    draw();
  }

  // ---------- Osmose-Labor ----------
  function viewLab() {
    app.innerHTML = `
      <a class="back" href="#/">← Übersicht</a>
      <section class="card">
        <h1>🧪 Osmose-Labor</h1>
        <p class="muted">Lege eine Pflanzenzelle (rote Zwiebel) und eine rote Blutzelle in Lösungen mit unterschiedlicher Konzentration. Was passiert?</p>
        <div class="presets">
          <button class="btn" data-v="0">Destilliertes Wasser</button>
          <button class="btn" data-v="50">Isotonische Lösung</button>
          <button class="btn" data-v="100">Konzentrierte Salzlösung</button>
        </div>
        <label class="slider"><span>Konzentration der Außenlösung</span>
          <input type="range" id="conc" min="0" max="100" value="50"></label>
        <div class="scale small muted"><span>niedrig</span><span>wie im Zellinneren</span><span>hoch</span></div>
        <div class="labgrid">
          <figure><svg id="plant" viewBox="0 0 220 160"></svg><figcaption>Pflanzenzelle (rote Zwiebel)</figcaption><p id="ptext" class="labtext"></p></figure>
          <figure><svg id="rbc" viewBox="0 0 220 160"></svg><figcaption>Rote Blutzelle</figcaption><p id="rtext" class="labtext"></p></figure>
        </div>
        <div id="tonic" class="tonic"></div>
      </section>`;
    const inp = $("#conc");
    const upd = () => drawLab(+inp.value);
    inp.oninput = upd;
    app.querySelectorAll(".presets .btn").forEach(b => b.onclick = () => { inp.value = b.dataset.v; upd(); });
    upd();
  }

  function drawLab(c) {
    const e = c < 40 ? (c - 40) / 40 : c > 60 ? (c - 60) / 40 : 0; // -1 … 1
    const zone = e < 0 ? "hypo" : e > 0 ? "hyper" : "iso";
    S.simSeen[zone] = true; save();
    if (S.simSeen.hypo && S.simSeen.iso && S.simSeen.hyper) award("sim");

    // Wasserpfeile
    const arrows = (dir) => {
      if (dir === null) return "";
      if (dir === 0) return `<g class="arr two"><text x="6" y="84">⇄</text><text x="196" y="84">⇄</text></g>`;
      const inw = dir < 0;
      const a = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" marker-end="url(#ah)"/>`;
      return `<g class="arr">${inw ? a(-2, 16, 60) + a(-2, 16, 100) + a(222, 204, 60) + a(222, 204, 100)
        : a(16, -2, 60) + a(16, -2, 100) + a(204, 222, 60) + a(204, 222, 100)}</g>`;
    };
    const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1f7fb3"/></marker>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8a9a7b" stroke-width="2"/></pattern></defs>`;

    // Pflanzenzelle
    const s = e > 0 ? 1 - 0.5 * e : 1;
    const pw = 192 * s, ph = 132 * s, px = 110 - pw / 2, py = 80 - ph / 2;
    const vw = Math.max(pw - 40, 20), vh = Math.max(ph - 40, 14);
    const dark = e > 0 ? e : 0;
    const vcol = mix("#d7a6ea", "#5b1a7a", dark);
    $("#plant").innerHTML = defs + `
      <rect x="12" y="12" width="196" height="136" rx="14" fill="${e > 0 ? "#e6f0fa" : "#fff"}" stroke="#4d5d40" stroke-width="2"/>
      <rect x="8" y="8" width="204" height="144" rx="17" fill="none" stroke="url(#hatch)" stroke-width="7"/>
      <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${10 + 30 * dark}" fill="#eef6e8" stroke="#2f8f5b" stroke-width="2" class="anim"/>
      <rect x="${110 - vw / 2 - 6}" y="${80 - vh / 2 - (e > 0 ? 0 : 6)}" width="${vw}" height="${vh}" rx="${8 + 26 * dark}" fill="${vcol}" stroke="#4b1a63" stroke-width="1" class="anim"/>
      <circle cx="${px + pw - 14 * s - 4}" cy="${py + 16 * s + 4}" r="${7 * Math.max(s, .7)}" fill="#7b8a6d" stroke="#3a4630" class="anim"/>
      ${e < 0 ? `<text x="104" y="${80 + vh / 2 + 13}" text-anchor="middle" class="lbl">Turgor ↑</text>` : ""}
      ${arrows(Math.sign(e))}`;

    // rote Blutzelle
    let rbc = "";
    if (e < -0.75) {
      rbc = `<g class="burst"><path d="M60 60 q20 -30 45 -20" /><path d="M150 55 q20 25 10 50"/><path d="M70 115 q30 20 60 5"/>
        <circle cx="110" cy="80" r="3" fill="#c0392b"/><circle cx="95" cy="70" r="2" fill="#c0392b"/><circle cx="128" cy="92" r="2.5" fill="#c0392b"/><circle cx="118" cy="66" r="2" fill="#c0392b"/></g>
        <text x="110" y="150" text-anchor="middle" class="lbl red">geplatzt!</text>`;
    } else {
      const r = e < 0 ? 44 * (1 + 0.35 * -e) : 44 * (1 - 0.3 * e);
      const amp = e > 0 ? 7 * e : 0;
      let d = "";
      for (let i = 0; i <= 96; i++) { const th = i / 96 * Math.PI * 2; const rr = r + amp * Math.abs(Math.sin(th * 7));
        d += (i ? "L" : "M") + (110 + rr * Math.cos(th)).toFixed(1) + " " + (80 + rr * Math.sin(th)).toFixed(1); }
      const inner = e < 0 ? Math.max(0, 0.45 + e * 0.6) : 0.45;
      rbc = `<path d="${d}Z" fill="#d9534f" stroke="#8e2320" stroke-width="2" class="anim"/>
        ${inner > 0.05 ? `<circle cx="110" cy="80" r="${r * inner}" fill="#ec8d89" opacity=".9"/>` : ""}`;
    }
    $("#rbc").innerHTML = defs + rbc + arrows(e < -0.75 ? null : Math.sign(e));

    const T = {
      hypo: ["Wasser strömt osmotisch ein. Der Protoplast drückt gegen die Zellwand: Der Turgor steigt. Die Zellwand verhindert das Platzen.",
        e < -0.75 ? "Hämolyse! Wasser ist eingeströmt, bis die Membran gerissen ist. Rote Blutzellen haben keine Zellwand." : "Wasser strömt osmotisch ein, die Zelle schwillt kugelig an. Ohne Zellwand droht sie zu platzen."],
      iso: ["Kein Nettowasserstrom: Es strömen gleich viele Wassermoleküle ein wie aus (dynamisches Gleichgewicht).",
        "Die Zelle behält ihre typische Scheibenform. Ein- und Ausstrom von Wasser sind gleich groß."],
      hyper: ["Wasser strömt aus der Vakuole. Plasmolyse: Der Protoplast löst sich von der Zellwand, die Vakuole wird dunkler, weil der Farbstoff konzentrierter ist.",
        "Wasser strömt aus, die Zelle schrumpft und bekommt eine höckerige Oberfläche (Stechapfelform)."],
    }[zone];
    $("#ptext").textContent = T[0]; $("#rtext").textContent = T[1];
    $("#tonic").innerHTML = `Die Außenlösung ist <b>${{ hypo: "hypotonisch", iso: "isotonisch", hyper: "hypertonisch" }[zone]}</b> im Vergleich zum Zellinneren.`;
    $("#tonic").className = "tonic " + zone;
  }
  function mix(a, b, t) {
    const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
    const [A, B] = [p(a), p(b)];
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  // ---------- Boss ----------
  function bossBar(st, opts) {
    return `<div class="bossbar">
      <div class="boss-sprite" id="boss">👾</div>
      <div class="boss-info"><b>Membran-Monster</b>
        <div class="hp"><div style="width:${st.hp / opts.bossHP * 100}%"></div></div>
        <span class="small muted">${st.hp} / ${opts.bossHP} Lebenspunkte</span></div>
      <div class="hearts">${[0, 1, 2].map(i => `<span class="${i < st.hearts ? "" : "lost"}">❤️</span>`).join("")}</div>
    </div>`;
  }
  function hitBoss() { const b = $("#boss"); if (b) { b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); } }

  function viewBoss() {
    const allPlayed = MODULES.every(m => S.played[m.id]);
    if (!allPlayed) {
      app.innerHTML = `<a class="back" href="#/">← Übersicht</a><section class="card result"><div class="t-big">🔒</div><h1>Noch gesperrt</h1>
        <p>Spiele zuerst jedes der vier Module mindestens einmal durch.</p>
        <ul class="unlock">${MODULES.map(m => `<li>${S.played[m.id] ? "✅" : "⬜"} ${esc(m.title)}</li>`).join("")}</ul></section>`;
      return;
    }
    app.innerHTML = `<a class="back" href="#/">← Übersicht</a>
      <section class="card result"><div class="t-big boss-sprite">👾</div><h1>Das Membran-Monster</h1>
      <p>Es hat <b>12 Lebenspunkte</b>. Jede richtige Antwort trifft. Du hast <b>3 Herzen</b>, jede falsche Antwort kostet eins.</p>
      <p class="muted">Fragen aus allen vier Modulen. Sieg: +100 XP.</p>
      <div class="actions center"><button class="btn primary" id="fight">Kampf starten</button></div></section>`;
    $("#fight").onclick = () => {
      const pool = shuffle(MODULES.flatMap(m => m.questions));
      runQuiz(pool, { boss: true, bossHP: 12, backHref: "#/",
        onEnd(st) {
          const win = st.hp <= 0;
          if (win) { S.bossWins++; save(); addXP(100); award("boss"); confetti(); }
          app.innerHTML = `<section class="card result"><div class="t-big">${win ? "🏆" : "💥"}</div>
            <h1>${win ? "Sieg!" : "Knapp verloren"}</h1>
            <p>${win ? `Du hast das Membran-Monster besiegt und dabei ${3 - st.hearts} Fehler gemacht. <b>+100 XP Bonus</b>` : `Das Monster hatte noch ${st.hp} Lebenspunkte. Wiederhole die Module und versuch es nochmal!`}</p>
            <div class="actions center"><button class="btn primary" id="re">Nochmal kämpfen</button><a class="btn" href="#/">Übersicht</a></div></section>`;
          $("#re").onclick = viewBoss;
        } });
    };
  }

  // ---------- Abzeichen ----------
  function viewBadges() {
    const L = levelInfo();
    app.innerHTML = `<a class="back" href="#/">← Übersicht</a>
      <section class="card"><h1>🏅 Abzeichen</h1>
        <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? "got" : ""}">
          <div class="b-icon">${S.badges[b.id] ? b.icon : "🔒"}</div><b>${esc(b.name)}</b><span class="small muted">${esc(b.desc)}</span></div>`).join("")}</div>
      </section>
      <section class="card"><h2>Deine Statistik</h2>
        <ul class="statlist">
          <li><span>Level</span><b>${L.idx + 1} · ${esc(L.name)}</b></li>
          <li><span>Erfahrungspunkte</span><b>${S.xp} XP</b></li>
          <li><span>Längste Combo</span><b>${S.bestCombo}</b></li>
          <li><span>Karteikarten gewusst</span><b>${S.flashKnown}</b></li>
          <li><span>Erklär-Aufgaben</span><b>${S.openDone}</b></li>
          <li><span>Boss-Siege</span><b>${S.bossWins}</b></li>
        </ul>
        <div class="levels">${LEVELS.map((l, i) => `<span class="${i <= L.idx ? "on" : ""}">${i + 1}. ${esc(l.name)} <small>(${l.xp} XP)</small></span>`).join("")}</div>
        <div class="actions"><button class="btn danger" id="reset">Fortschritt zurücksetzen</button></div>
      </section>`;
    $("#reset").onclick = () => {
      const b = $("#reset");
      if (b.dataset.sure) { localStorage.removeItem(KEY); S = load(); location.hash = "#/"; route(); }
      else { b.dataset.sure = 1; b.textContent = "Wirklich alles löschen? Nochmal klicken"; }
    };
  }

  // ---------- Datenschutz ----------
  function viewPrivacy() {
    app.innerHTML = `<a class="back" href="#/">← Übersicht</a>
      <section class="card prose"><h1>Datenschutz</h1>
        <p>Zell-Quest ist ein freiwilliges Lernangebot für den Biologieunterricht der Jahrgangsstufe 11.</p>
        <h3>Was die App speichert</h3>
        <p>Dein Spitzname, deine Punkte, Level und Abzeichen werden nur im Speicher deines Browsers auf diesem Gerät abgelegt (localStorage). Diese Daten werden nicht übertragen. Weder deine Lehrkraft noch sonst jemand kann sie sehen. Es gibt keine Anmeldung, keine Cookies, keine Werbung und keine Statistik- oder Tracking-Dienste. Die App lädt keine Inhalte von fremden Servern nach.</p>
        <p>Du kannst die gespeicherten Daten jederzeit löschen: unter „Abzeichen“ mit „Fortschritt zurücksetzen“ oder indem du die Websitedaten in deinem Browser löschst.</p>
        <h3>Hosting</h3>
        <p>Die Seite wird über GitHub Pages bereitgestellt (GitHub, Inc., USA). Wie bei jeder Website wird beim Aufruf deine IP-Adresse an den Server übertragen. GitHub speichert IP-Adressen nach eigenen Angaben zu Sicherheitszwecken. Darauf hat die Lehrkraft keinen Zugriff. Näheres steht in der <a class="link" href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>
        <h3>Tipp</h3>
        <p>Gib als Namen am besten einen Spitznamen ein, keinen vollständigen Namen.</p>
      </section>`;
  }

  route();
})();
