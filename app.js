document.querySelectorAll(".topic__head").forEach((head) => {
  head.addEventListener("click", () => {
    const topic = head.closest(".topic");

    topic.classList.toggle("topic--open");
    topic.classList.toggle("topic--closed");
  });
});

const menuBtn = document.querySelector(".nav__menu-btn");
const mobileMenu = document.querySelector(".mobile-menu");
const closeBtn = document.querySelector(".mobile-menu__close");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.add("mobile-menu--open");
  });
}

if (closeBtn && mobileMenu) {
  closeBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("mobile-menu--open");
  });
}

mobileMenu?.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    mobileMenu.classList.remove("mobile-menu--open");
  }
});

const contactButtons = document.querySelectorAll(
  ".nav__contact-button, .contact-modal-trigger",
);

const contactModal = document.querySelector(".contact-modal");
const contactClose = document.querySelector(".contact-modal__close");

contactButtons.forEach((button) => {
  button.addEventListener("click", () => {
    contactModal?.classList.add("contact-modal--open");
  });
});

contactClose?.addEventListener("click", () => {
  contactModal?.classList.remove("contact-modal--open");
});

contactModal?.addEventListener("click", (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove("contact-modal--open");
  }
});

// Lesson sidebar scroll tracking
const lessonSections = [...document.querySelectorAll(".lesson-section[id]")];
const lessonSidebarLinks = [
  ...document.querySelectorAll(".lesson-sidebar__link[href^='#']"),
];

if (lessonSections.length && lessonSidebarLinks.length) {
  const setActiveLessonLink = (sectionId) => {
    lessonSidebarLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("lesson-sidebar__link--active", isActive);
    });
  };

  const lessonObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleSections[0]) {
        setActiveLessonLink(visibleSections[0].target.id);
      }
    },
    {
      rootMargin: "-18% 0px -62% 0px",
      threshold: [0, 0.15, 0.35, 0.6],
    },
  );

  lessonSections.forEach((section) => lessonObserver.observe(section));
}
(() => {
  const answerButton = document.getElementById("show-conditions-answer");
  const answer = document.getElementById("conditions-answer");

  answerButton?.addEventListener("click", () => {
    const isVisible = answer.classList.toggle("conditions-answer--visible");

    answerButton.setAttribute("aria-expanded", String(isVisible));
    answerButton.textContent = isVisible
      ? "Antwort ausblenden"
      : "Antwort zeigen";
  });
})();

// Interactive exercises: "pick all that apply" (data-exercise="multi").
// Options with data-correct="true" are the ones the user should select.
// With data-generate="varnames", the "Nochmal" button builds a fresh, random
// set of variable-name candidates (mix of valid and invalid) each time.
(() => {
  const RESERVED = [
    "if",
    "else",
    "elif",
    "while",
    "for",
    "def",
    "class",
    "return",
    "import",
    "from",
    "True",
    "False",
    "None",
    "and",
    "or",
    "not",
    "in",
  ];
  // Real, sensible variable names — single words and meaningful compounds.
  const NAMES = [
    "alter",
    "name",
    "preis",
    "farbe",
    "punkte",
    "wert",
    "summe",
    "note",
    "level",
    "runde",
    "ticket",
    "nummer",
    "datum",
    "groesse",
    "gewicht",
    "ergebnis",
    "zaehler",
    "passwort",
    "benutzer",
    "nachricht",
    "stadt",
    "tempo",
    "kugel",
    "breite",
    "seite",
    "zahl",
    "spieler",
    "konto",
    "betrag",
    "rabatt",
    "menge",
  ];
  // Two-part names that make sense together (joined by "_", or by a space
  // when we want the "forgot the underscore" mistake).
  const COMPOUNDS = [
    ["mein", "alter"],
    ["dein", "name"],
    ["max", "preis"],
    ["min", "preis"],
    ["anzahl", "gaeste"],
    ["erste", "zahl"],
    ["letzte", "seite"],
    ["neuer", "preis"],
    ["ist", "offen"],
    ["hat", "ticket"],
    ["gesamt", "summe"],
    ["aktuelle", "runde"],
    ["naechste", "runde"],
    ["ist", "fertig"],
    ["hat", "zeit"],
    ["neue", "nummer"],
    ["mittlere", "note"],
    ["hoechste", "punktzahl"],
  ];
  // Kept HTML-safe on purpose (no &, <, >), since names are shown via innerHTML.
  const SPECIALS = ["-", "!", "?", "@", "#", "%", "*", "€", "$", ".", "+"];

  const randInt = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[randInt(arr.length)];

  const validName = () => {
    const kind = randInt(4);
    if (kind === 1) return pick(COMPOUNDS).join("_"); // mein_alter
    if (kind === 2) return pick(NAMES) + (1 + randInt(9)); // preis3
    if (kind === 3) return "_" + pick(NAMES); // _wert
    return pick(NAMES); // preis
  };

  const invalidName = () => {
    const kind = randInt(4);
    if (kind === 0) {
      return {
        text: randInt(9) + pick(NAMES),
        reason: "beginnt mit einer Zahl",
      };
    }
    if (kind === 1) {
      return {
        text: pick(COMPOUNDS).join(" "),
        reason: "enthält ein Leerzeichen",
      };
    }
    if (kind === 2) {
      const w = pick(NAMES);
      const ch = pick(SPECIALS);
      const pos = 1 + randInt(w.length - 1);
      return {
        text: w.slice(0, pos) + ch + w.slice(pos),
        reason: `enthält ein ungültiges Zeichen (${ch})`,
      };
    }
    return { text: pick(RESERVED), reason: "ist ein reserviertes Wort" };
  };

  const buildVarNames = (total = 8) => {
    const invalidTarget = 3 + randInt(2); // 3 or 4 invalid names
    const seen = new Set();
    const items = [];
    const add = (item) => {
      if (seen.has(item.text)) return;
      seen.add(item.text);
      items.push(item);
    };
    let guard = 0;
    while (items.length < invalidTarget && guard++ < 60) {
      const inv = invalidName();
      add({ text: inv.text, invalid: true, reason: inv.reason });
    }
    guard = 0;
    while (items.length < total && guard++ < 60) {
      add({ text: validName(), invalid: false });
    }
    for (let i = items.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };

  document
    .querySelectorAll('.lesson-exercise[data-exercise="multi"]')
    .forEach((exercise) => {
      const optionsWrap = exercise.querySelector(".lesson-exercise__options");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!optionsWrap || !checkBtn || !feedback) return;

      const regenerates = exercise.dataset.generate === "varnames";
      let checked = false;

      const options = () => [
        ...optionsWrap.querySelectorAll(".lesson-exercise__option"),
      ];

      const bind = (opt) => {
        opt.addEventListener("click", () => {
          if (checked) return;
          opt.setAttribute(
            "aria-pressed",
            String(opt.getAttribute("aria-pressed") !== "true"),
          );
        });
      };

      const renderRandom = () => {
        optionsWrap.innerHTML = "";
        buildVarNames().forEach((item) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "lesson-exercise__option";
          btn.setAttribute("aria-pressed", "false");
          btn.dataset.correct = item.invalid ? "true" : "false";
          if (item.reason) btn.dataset.reason = item.reason;
          btn.textContent = item.text;
          bind(btn);
          optionsWrap.appendChild(btn);
        });
      };

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        if (regenerates) {
          renderRandom();
        } else {
          options().forEach((opt) => {
            opt.setAttribute("aria-pressed", "false");
            opt.disabled = false;
            opt.classList.remove("is-correct", "is-missed", "is-wrong");
          });
        }
      };

      const grade = () => {
        checked = true;
        let found = 0;
        let missed = 0;
        let wrong = 0;
        let totalInvalid = 0;
        const reasons = [];

        options().forEach((opt) => {
          const shouldSelect = opt.dataset.correct === "true";
          const isSelected = opt.getAttribute("aria-pressed") === "true";
          opt.disabled = true;

          if (shouldSelect) {
            totalInvalid += 1;
            if (isSelected) {
              opt.classList.add("is-correct");
              found += 1;
            } else {
              opt.classList.add("is-missed");
              missed += 1;
            }
            if (opt.dataset.reason) {
              reasons.push(
                `<li><code>${opt.textContent.trim()}</code> – ${opt.dataset.reason}</li>`,
              );
            }
          } else if (isSelected) {
            opt.classList.add("is-wrong");
            wrong += 1;
          }
        });

        const allRight = missed === 0 && wrong === 0;
        const message = allRight
          ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Gut gemacht!</p>'
          : `<p class="lesson-exercise__result">${found} von ${totalInvalid} gefunden.${
              wrong ? `, ${wrong} gültige(n) fälschlich markiert` : ""
            }. Schau dir die Markierungen an.</p>`;
        const reasonList = reasons.length
          ? `<ul class="lesson-exercise__reasons">${reasons.join("")}</ul>`
          : "";

        feedback.innerHTML = message + reasonList;
        feedback.hidden = false;
        checkBtn.textContent = "Nochmal";
      };

      checkBtn.addEventListener("click", () => {
        if (checked) freshBoard();
        else grade();
      });

      options().forEach(bind);
    });
})();

// Interactive exercises: "match" — pick the data type for each literal.
// Each .lesson-exercise__row carries data-answer (str|int|float|bool).
// With data-generate="datatypes", "Nochmal" builds a fresh random set.
(() => {
  const TYPES = ["str", "int", "float", "bool"];
  const STR_WORDS = [
    "hallo",
    "berlin",
    "montag",
    "apfel",
    "gruen",
    "katze",
    "auto",
    "tisch",
  ];
  const randInt = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[randInt(arr.length)];

  const literalOf = (type) => {
    if (type === "int")
      return { text: String(1 + randInt(499)), answer: "int" };
    if (type === "bool") {
      return { text: randInt(2) ? "True" : "False", answer: "bool" };
    }
    if (type === "float") {
      // Half the time the "X.0" trap that looks like an int.
      return randInt(2)
        ? { text: `${1 + randInt(98)}.${1 + randInt(98)}`, answer: "float" }
        : { text: `${1 + randInt(20)}.0`, answer: "float" };
    }
    // str: a quoted word, or the "quoted number" trap.
    return randInt(2)
      ? { text: `"${pick(STR_WORDS)}"`, answer: "str" }
      : { text: `"${1 + randInt(98)}"`, answer: "str" };
  };

  const buildRows = () => {
    const types = [...TYPES]; // guarantee one of each
    const extra = 1 + randInt(2); // 1-2 more -> 5 or 6 rows
    for (let i = 0; i < extra; i += 1) types.push(pick(TYPES));
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = randInt(i + 1);
      [types[i], types[j]] = [types[j], types[i]];
    }
    const seen = new Set();
    return types.map((t) => {
      let lit;
      let guard = 0;
      do {
        lit = literalOf(t);
        guard += 1;
      } while (seen.has(lit.text) && guard < 20);
      seen.add(lit.text);
      return lit;
    });
  };

  const makeSelect = () => {
    const select = document.createElement("select");
    select.className = "lesson-exercise__select";
    [["", "– wählen –"], ...TYPES.map((t) => [t, t])].forEach(
      ([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      },
    );
    return select;
  };

  document
    .querySelectorAll('.lesson-exercise[data-exercise="match"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-exercise__rows");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      const regenerates = exercise.dataset.generate === "datatypes";
      let checked = false;
      const rows = () => [
        ...rowsWrap.querySelectorAll(".lesson-exercise__row"),
      ];

      const renderRandom = () => {
        rowsWrap.innerHTML = "";
        buildRows().forEach((item) => {
          const row = document.createElement("div");
          row.className = "lesson-exercise__row";
          row.dataset.answer = item.answer;
          const literal = document.createElement("span");
          literal.className = "lesson-exercise__literal";
          literal.textContent = item.text;
          row.appendChild(literal);
          row.appendChild(makeSelect());
          rowsWrap.appendChild(row);
        });
      };

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        if (regenerates) {
          renderRandom();
        } else {
          rows().forEach((row) => {
            row.classList.remove("is-correct", "is-wrong");
            row.querySelector(".lesson-exercise__solution")?.remove();
            const select = row.querySelector("select");
            if (select) {
              select.value = "";
              select.disabled = false;
            }
          });
        }
      };

      const grade = () => {
        checked = true;
        let correct = 0;
        const all = rows();
        all.forEach((row) => {
          const select = row.querySelector("select");
          select.disabled = true;
          const isRight = select.value === row.dataset.answer;
          row.classList.add(isRight ? "is-correct" : "is-wrong");
          if (isRight) {
            correct += 1;
          } else {
            const solution = document.createElement("span");
            solution.className = "lesson-exercise__solution";
            solution.textContent = `→ ${row.dataset.answer}`;
            row.appendChild(solution);
          }
        });
        feedback.innerHTML =
          correct === all.length
            ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Gut gemacht!</p>'
            : `<p class="lesson-exercise__result">${correct} von ${all.length} richtig. Nochmal?</p>`;
        feedback.hidden = false;
        checkBtn.textContent = "Nochmal";
      };

      checkBtn.addEventListener("click", () => {
        if (checked) freshBoard();
        else grade();
      });

      // Give the handcrafted first-render rows their dropdowns.
      rows().forEach((row) => {
        if (!row.querySelector("select")) row.appendChild(makeSelect());
      });
    });
})();

// Interactive exercises: "slice" — type an index/slice that yields the target.
// The user's expression is evaluated with real Python slice semantics, so any
// correct form is accepted (name[4:], name[-2:], name[4:6] all pass).
(() => {
  const VAR = "name";
  const NAMES = [
    "Albert",
    "Monika",
    "Stefan",
    "Thomas",
    "Sabine",
    "Claudia",
    "Richard",
    "Martina",
    "Andreas",
    "Barbara",
    "Michael",
    "Susanne",
    "Manuela",
    "Cornelia",
    "Gabriele",
    "Reinhard",
  ];
  const randInt = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[randInt(arr.length)];

  // Single index with Python semantics; null on IndexError.
  const pyIndex = (seq, idx) => {
    const i = idx < 0 ? idx + seq.length : idx;
    return i < 0 || i >= seq.length ? null : seq[i];
  };

  // Slice with Python semantics (mirrors slice.indices); null on step 0.
  const pySlice = (seq, startRaw, stopRaw, stepRaw) => {
    const length = seq.length;
    const step = stepRaw === null ? 1 : stepRaw;
    if (step === 0) return null;
    const lower = step < 0 ? -1 : 0;
    const upper = step < 0 ? length - 1 : length;

    let start;
    if (startRaw === null) start = step < 0 ? upper : lower;
    else if (startRaw < 0) start = Math.max(startRaw + length, lower);
    else start = Math.min(startRaw, upper);

    let stop;
    if (stopRaw === null) stop = step < 0 ? lower : upper;
    else if (stopRaw < 0) stop = Math.max(stopRaw + length, lower);
    else stop = Math.min(stopRaw, upper);

    let res = "";
    if (step > 0) for (let i = start; i < stop; i += step) res += seq[i];
    else for (let i = start; i > stop; i += step) res += seq[i];
    return res;
  };

  const makeTask = () => {
    let word;
    let target;
    let sample;
    let guard = 0;
    do {
      word = pick(NAMES);
      const len = word.length;
      const kind = randInt(6);
      if (kind === 0) {
        const i = randInt(len);
        target = pyIndex(word, i);
        sample = `${VAR}[${i}]`;
      } else if (kind === 1) {
        const k = 2 + randInt(len - 2);
        target = pySlice(word, null, k, null);
        sample = `${VAR}[:${k}]`;
      } else if (kind === 2) {
        const k = 1 + randInt(len - 2);
        target = pySlice(word, k, null, null);
        sample = `${VAR}[${k}:]`;
      } else if (kind === 3) {
        target = pySlice(word, null, null, -1);
        sample = `${VAR}[::-1]`;
      } else if (kind === 4) {
        target = pySlice(word, null, null, 2);
        sample = `${VAR}[::2]`;
      } else {
        const a = 1 + randInt(len - 3);
        const b = a + 2 + randInt(len - a - 1);
        target = pySlice(word, a, b, null);
        sample = `${VAR}[${a}:${b}]`;
      }
      guard += 1;
    } while ((target === word || target.length === 0) && guard < 40);
    return { word, target, sample };
  };

  // Parse and evaluate a typed expression like name[1:4] / [-2:] / [::-1].
  const evalExpr = (raw, word) => {
    const expr = raw.trim();
    const m = expr.match(/^([A-Za-z_]\w*)?\s*\[\s*([^\]]*?)\s*\]$/);
    if (!m) return { error: "format" };
    if (m[1] && m[1] !== VAR) return { error: "var", used: m[1] };
    const inner = m[2].trim();
    if (inner === "") return { error: "empty" };

    if (inner.includes(":")) {
      const parts = inner.split(":");
      if (parts.length > 3) return { error: "format" };
      const nums = parts.map((p) => {
        const t = p.trim();
        if (t === "") return null;
        return /^[+-]?\d+$/.test(t) ? parseInt(t, 10) : NaN;
      });
      if (nums.some((n) => Number.isNaN(n))) return { error: "format" };
      const step = parts.length === 3 ? nums[2] : null;
      const result = pySlice(word, nums[0], nums[1], step);
      if (result === null) return { error: "step0" };
      return { result };
    }

    if (!/^[+-]?\d+$/.test(inner)) return { error: "format" };
    const result = pyIndex(word, parseInt(inner, 10));
    if (result === null) return { error: "range" };
    return { result };
  };

  const ERRORS = {
    format: "Nutze eckige Klammern, z. B. <code>name[1:4]</code>.",
    var: "Die Variable heißt <code>name</code>.",
    empty: "In den Klammern fehlt noch ein Index oder Slice.",
    step0: "Ein Schritt von 0 ist nicht erlaubt.",
    range: "Dieser Index liegt außerhalb des Wortes.",
  };

  document
    .querySelectorAll('.lesson-exercise[data-exercise="slice"]')
    .forEach((exercise) => {
      const wordEl = exercise.querySelector(".lesson-exercise__word");
      const targetEl = exercise.querySelector(".lesson-exercise__target");
      const input = exercise.querySelector(".lesson-exercise__input");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const revealBtn = exercise.querySelector(".lesson-exercise__reveal");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!wordEl || !targetEl || !input || !checkBtn || !feedback) return;

      let solved = false;

      const say = (html, ok) => {
        feedback.innerHTML = `<p class="lesson-exercise__result${
          ok ? " lesson-exercise__result--ok" : ""
        }">${html}</p>`;
        feedback.hidden = false;
      };

      const finish = () => {
        solved = true;
        input.disabled = true;
        input.classList.add("is-correct");
        if (revealBtn) revealBtn.hidden = true;
        checkBtn.textContent = "Nochmal";
      };

      const newTask = () => {
        const task = makeTask();
        wordEl.textContent = task.word;
        targetEl.textContent = task.target;
        exercise.dataset.sample = task.sample;
        solved = false;
        input.value = "";
        input.disabled = false;
        input.classList.remove("is-correct");
        feedback.hidden = true;
        feedback.innerHTML = "";
        if (revealBtn) revealBtn.hidden = false;
        checkBtn.textContent = "Prüfen";
        input.focus();
      };

      const grade = () => {
        const word = wordEl.textContent;
        const target = targetEl.textContent;
        const res = evalExpr(input.value, word);
        if (res.error) {
          say(ERRORS[res.error] || ERRORS.format, false);
          return;
        }
        if (res.result === target) {
          say("Richtig ✓", true);
          finish();
        } else {
          say(
            `Dein Ausdruck ergibt „${res.result}“, gesucht war „${target}“. Versuch es nochmal.`,
            false,
          );
        }
      };

      checkBtn.addEventListener("click", () => {
        if (solved) newTask();
        else grade();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !solved) grade();
      });

      revealBtn?.addEventListener("click", () => {
        if (solved) return;
        say(
          `Ein möglicher Ausdruck: <code>${exercise.dataset.sample}</code>`,
          true,
        );
        finish();
      });
    });
})();
