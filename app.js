document.querySelectorAll(".topic__head").forEach((head) => {
  head.addEventListener("click", () => {
    const topic = head.closest(".topic");

    topic.classList.toggle("topic--open");
    topic.classList.toggle("topic--closed");
  });
});

// Deep-link into learn.html topics: /pages/learn.html#topic-python opens
// that topic (instead of leaving every topic collapsed) and scrolls to it.
// Runs on load for direct links, and again on hashchange for same-page
// clicks (e.g. from the nav dropdown below) which don't trigger a reload.
(() => {
  const openTopicFromHash = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const topic = document.getElementById(id);
    if (!topic || !topic.classList.contains("topic")) return;
    topic.classList.add("topic--open");
    topic.classList.remove("topic--closed");
    topic.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (document.querySelector(".topic")) {
    openTopicFromHash();
    window.addEventListener("hashchange", openTopicFromHash);
  }
})();

// Password-gated subtopics: each topic has its own unlock field, and each
// password reveals a specific subset of its lessons (see data-lock-index on
// the .subtopic links in learn.html). Unlocks accumulate and persist in
// localStorage - once a lesson is unlocked it stays unlocked, no matter how
// many more passwords get entered afterwards.
(() => {
  const STORAGE_KEY = "csguru:unlocked-lessons";

  const LOCK_CONFIG = {
    "topic-python": {
      111: [1, 2],
      222: [3, 4],
      333: [5, 6],
      444: [7],
      1415926535: [1, 2, 3, 4, 5, 6, 7],
    },
    "topic-numbers": {
      aaa: [1, 2],
      bbb: [3],
      ccc: [4],
      ddd: [5, 6],
      8979323846: [1, 2, 3, 4, 5, 6],
    },
    "topic-logic": {
      314: [1],
      1592: [2],
      6535: [3],
      8979: [4, 5],
      3238: [6],
      2643383279: [1, 2, 3, 4, 5, 6],
    },
  };

  const topics = [...document.querySelectorAll(".topic[id]")].filter(
    (topic) => LOCK_CONFIG[topic.id],
  );
  if (!topics.length) return;

  function readUnlocked() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveUnlocked(unlocked) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    } catch {
      // Private browsing / quota exceeded - unlocks just won't persist.
    }
  }

  const unlocked = readUnlocked();

  function applyLockState(topic) {
    const unlockedIndices = new Set(unlocked[topic.id] || []);

    topic.querySelectorAll("[data-lock-index]").forEach((link) => {
      const isLocked = !unlockedIndices.has(Number(link.dataset.lockIndex));
      link.classList.toggle("subtopic--locked", isLocked);
      link.setAttribute("aria-disabled", String(isLocked));
      link.tabIndex = isLocked ? -1 : 0;
    });
  }

  topics.forEach((topic) => {
    applyLockState(topic);

    // Locked cards keep their real href (no-JS fallback / SEO), so clicks
    // need to be intercepted explicitly instead of relying on pointer-events.
    topic.addEventListener("click", (event) => {
      if (event.target.closest(".subtopic--locked")) event.preventDefault();
    });

    const form = topic.querySelector("[data-lock-form]");
    const input = form?.querySelector(".topic__lock-input");
    if (!form || !input) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const password = input.value.trim();
      const indices = LOCK_CONFIG[topic.id][password];

      if (!password || !indices) {
        form.classList.remove("topic__lock-form--error");
        void form.offsetWidth; // restart the shake animation on repeat misses
        form.classList.add("topic__lock-form--error");
        return;
      }

      const current = new Set(unlocked[topic.id] || []);
      indices.forEach((index) => current.add(index));
      unlocked[topic.id] = [...current];
      saveUnlocked(unlocked);

      input.value = "";
      form.classList.remove("topic__lock-form--error");
      applyLockState(topic);
    });
  });
})();

// The unlock placeholder text is too long to fit inline on phone screens, so
// swap in a shorter version below the same breakpoint the lesson sidebar
// disappears at, and restore the full text above it.
(() => {
  const inputs = document.querySelectorAll(".topic__lock-input");
  if (!inputs.length) return;

  const mobilePlaceholder = "Passwort eingeben";
  const query = window.matchMedia("(max-width: 700px)");

  inputs.forEach((input) => {
    input.dataset.placeholderFull = input.placeholder;
  });

  function applyPlaceholder() {
    inputs.forEach((input) => {
      input.placeholder = query.matches
        ? mobilePlaceholder
        : input.dataset.placeholderFull;
    });
  }

  applyPlaceholder();
  query.addEventListener("change", applyPlaceholder);
})();

// Nav hover dropdowns: hovering "Lernen", "Spielen", or "Werkzeuge" lists
// every major topic/game/tool so a click jumps straight to it. Injected
// here (rather than duplicated in every page's nav markup) since app.js is
// the one script every page already includes.
(() => {
  const NAV_DROPDOWNS = [
    {
      href: "/pages/learn.html",
      items: [
        ["Python Grundlagen", "/pages/learn.html#topic-python"],
        ["Zahlensysteme", "/pages/learn.html#topic-numbers"],
        ["Schaltalgebra", "/pages/learn.html#topic-logic"],
      ],
    },
    {
      href: "/pages/play.html",
      items: [
        ["Nibbleman", "/games/conversion.html"],
        ["Simplify", "/games/simplify.html"],
        ["The Floor is Lava", "/games/two_pow.html"],
        ["Circuit", "/games/circuit.html"],
      ],
    },
    {
      href: "/pages/tools.html",
      items: [
        ["Basis-Umwandler", "/pages/explainations/tools/base_converter.html"],
        [
          "Dezimalumwandler",
          "/pages/explainations/tools/decimal_converter.html",
        ],
        ["Vereinfacher", "/pages/explainations/tools/simplifier.html"],
        ["Tabellenersteller", "/pages/explainations/tools/truth_table.html"],
      ],
    },
  ];

  NAV_DROPDOWNS.forEach(({ href, items }) => {
    const link = document.querySelector(
      `.nav__links a.nav__link[href="${href}"]`,
    );
    const li = link?.closest("li");
    if (!li) return;

    const dropdown = document.createElement("div");
    dropdown.className = "nav__dropdown";
    const list = document.createElement("ul");
    list.className = "nav__dropdown-list";

    items.forEach(([label, itemHref]) => {
      const itemLi = document.createElement("li");
      const a = document.createElement("a");
      a.className = "nav__dropdown-link";
      a.href = itemHref;
      a.textContent = label;
      itemLi.appendChild(a);
      list.appendChild(itemLi);
    });

    dropdown.appendChild(list);
    li.appendChild(dropdown);
  });
})();

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

// Lesson sidebar scroll tracking. The Niveau-Test builds its outline from
// quiz groups instead of .lesson-section blocks, so those count as sections
// here too - otherwise its sidebar would never advance past the intro.
const lessonSections = [
  ...document.querySelectorAll(
    ".lesson-section[id], .level-test__group[id], .level-test__actions[id]",
  ),
];
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

// Lesson progress (localStorage only, no accounts/server): remember which
// lessons a learner has finished, so /pages/learn.html can show a "done"
// badge on return visits. A lesson with a quiz / quick-check
// (.lesson-exercise) only counts as finished once every exercise on the
// page has been graded fully correct at least once; lessons with no
// exercise fall back to "scrolled to the last section".
(() => {
  const PROGRESS_KEY = "csguru:lesson-progress";

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function normalizePath(path) {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  const markDone = () => {
    const currentPath = normalizePath(location.pathname);
    const progress = readProgress();
    if (progress[currentPath]) return;
    progress[currentPath] = true;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Private browsing / quota exceeded - progress just won't persist.
    }
  };

  const exercises = [...document.querySelectorAll(".lesson-exercise")];

  if (exercises.length) {
    // Every exercise type (multi/match/truth/slice/logic-build/law-quiz/…)
    // renders a ".lesson-exercise__result--ok" message on a fully correct
    // grading, so watch each exercise's own subtree for it instead of
    // hooking into every grading implementation separately.
    //
    // A multi-stage exercise (e.g. "normalform") renders one
    // .lesson-exercise__feedback per stage, in DOM order, so an early stage's
    // leftover --ok from a past round would otherwise count the whole
    // exercise as done before the final stage is ever reached. Checking only
    // the last .lesson-exercise__feedback sidesteps that without needing to
    // know which exercises are multi-stage: single-stage exercises have just
    // one feedback element, so "last" and "only" are the same thing there.
    const passed = new Set();

    exercises.forEach((exercise) => {
      const checkPassed = () => {
        const feedbacks = exercise.querySelectorAll(
          ".lesson-exercise__feedback",
        );
        const finalFeedback = feedbacks[feedbacks.length - 1];
        if (!finalFeedback?.querySelector(".lesson-exercise__result--ok"))
          return;
        passed.add(exercise);
        if (passed.size === exercises.length) markDone();
      };

      new MutationObserver(checkPassed).observe(exercise, {
        childList: true,
        subtree: true,
      });

      checkPassed();
    });
  } else {
    // Mark the current lesson done once its last section scrolls into view.
    const finalSection = lessonSections[lessonSections.length - 1];

    if (finalSection) {
      const completionObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          markDone();
          completionObserver.disconnect();
        },
        { threshold: 0.4 },
      );

      completionObserver.observe(finalSection);
    }
  }

  // Render "done" badges on the lessons overview page.
  const subtopicLinks = [...document.querySelectorAll(".subtopic[href]")];
  if (!subtopicLinks.length) return;

  const progress = readProgress();

  subtopicLinks.forEach((link) => {
    const linkPath = normalizePath(
      new URL(link.getAttribute("href"), location.origin).pathname,
    );
    if (!progress[linkPath]) return;

    link.classList.add("subtopic--done");

    const badge = document.createElement("span");
    badge.className = "subtopic__done-badge";
    badge.setAttribute("aria-label", "Erledigt");
    link.appendChild(badge);
  });
})();

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

// Hover glossary terms (.lesson-term): build the popup from the data-term-*
// attributes and nudge it sideways so it never leaves the viewport.
(() => {
  const terms = [...document.querySelectorAll(".lesson-term")];
  if (!terms.length) return;

  const edgeMargin = 12;

  terms.forEach((term, index) => {
    const pop = document.createElement("span");
    pop.className = "lesson-term__pop";
    pop.id = `lesson-term-pop-${index + 1}`;
    pop.setAttribute("role", "tooltip");

    // Every part is optional: a term can show just its values, or a full
    // title + values + note block.
    if (term.dataset.termTitle) {
      const title = document.createElement("span");
      title.className = "lesson-term__pop-title";
      title.textContent = term.dataset.termTitle;
      pop.append(title);
    }

    if (term.dataset.termValues) {
      const values = document.createElement("span");
      values.className = "lesson-term__pop-values";
      if (term.dataset.termTone === "value") values.classList.add("code-value");
      values.textContent = term.dataset.termValues;
      pop.append(values);
    }

    if (term.dataset.termNote || term.dataset.termCode) {
      const note = document.createElement("span");
      note.className = "lesson-term__pop-note";

      if (term.dataset.termNote) {
        note.append(`${term.dataset.termNote} `);
      }

      if (term.dataset.termCode) {
        const code = document.createElement("code");
        code.textContent = term.dataset.termCode;
        note.append(code);
      }

      pop.append(note);
    }

    term.append(pop);
    term.setAttribute("aria-describedby", pop.id);

    // The popup is centered under the word, so work out where its edges would
    // land and shift it back inside the viewport if it would stick out.
    const position = () => {
      const word = term.getBoundingClientRect();
      const popWidth = pop.offsetWidth;
      const left = word.left + word.width / 2 - popWidth / 2;
      const right = left + popWidth;
      let shift = 0;

      if (left < edgeMargin) {
        shift = edgeMargin - left;
      } else if (right > window.innerWidth - edgeMargin) {
        shift = window.innerWidth - edgeMargin - right;
      }

      pop.style.setProperty("--pop-shift", `${Math.round(shift)}px`);
    };

    term.addEventListener("pointerenter", position);
    term.addEventListener("focus", position);
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

// Interactive exercises: "order" — put scrambled code lines into the right
// order. Each .lesson-exercise__row carries data-answer (its 1-based correct
// position as a string); a <select> with options 1..N (N = row count) is
// appended to every row, and grading compares the chosen number to it.
(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="order"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-exercise__rows");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      let checked = false;
      const rows = () => [
        ...rowsWrap.querySelectorAll(".lesson-exercise__row"),
      ];

      const makeSelect = (count) => {
        const select = document.createElement("select");
        select.className = "lesson-exercise__select";
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "–";
        select.appendChild(blank);
        for (let i = 1; i <= count; i += 1) {
          const option = document.createElement("option");
          option.value = String(i);
          option.textContent = String(i);
          select.appendChild(option);
        }
        return select;
      };

      rows().forEach((row) => {
        if (!row.querySelector("select"))
          row.appendChild(makeSelect(rows().length));
      });

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        rows().forEach((row) => {
          row.classList.remove("is-correct", "is-wrong");
          row.querySelector(".lesson-exercise__solution")?.remove();
          const select = row.querySelector("select");
          select.value = "";
          select.disabled = false;
        });
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
    });
})();

// Interactive exercises: "base-match" — pick the matching value for each
// row from a shared set of options. The exercise container carries
// data-options (pipe-separated, e.g. "2|8|10|16"); every row gets a select
// built from that list and carries data-answer (the correct option).
(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="base-match"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-exercise__rows");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      const options = (exercise.dataset.options || "")
        .split("|")
        .filter(Boolean);

      let checked = false;
      const rows = () => [
        ...rowsWrap.querySelectorAll(".lesson-exercise__row"),
      ];

      const makeSelect = () => {
        const select = document.createElement("select");
        select.className = "lesson-exercise__select";
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "–";
        select.appendChild(blank);
        options.forEach((value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
        return select;
      };

      rows().forEach((row) => {
        if (!row.querySelector("select")) row.appendChild(makeSelect());
      });

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        rows().forEach((row) => {
          row.classList.remove("is-correct", "is-wrong");
          row.querySelector(".lesson-exercise__solution")?.remove();
          const select = row.querySelector("select");
          select.value = "";
          select.disabled = false;
        });
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
    });
})();

// Interactive exercises: "predict-output" — type the exact expected text for
// each .lesson-exercise__row (data-answer), trimmed and compared
// case-sensitively by default, or case-insensitively when the row carries
// data-ci="true" (for word answers where case shouldn't matter, unlike
// Python output). data-explain supplies the "why", shown for every row once
// checked, right or wrong.
(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="predict-output"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-exercise__rows");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      let checked = false;
      const rows = () => [
        ...rowsWrap.querySelectorAll(".lesson-exercise__row"),
      ];

      const isRowRight = (row, raw) => {
        const given = raw.trim();
        const answer = row.dataset.answer || "";
        return row.dataset.ci === "true"
          ? given.toLowerCase() === answer.toLowerCase()
          : given === answer;
      };

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        rows().forEach((row) => {
          row.classList.remove("is-correct", "is-wrong");
          row.querySelector(".lesson-exercise__solution")?.remove();
          row.querySelector(".lesson-exercise__note")?.remove();
          const input = row.querySelector(".lesson-exercise__input");
          input.value = "";
          input.disabled = false;
        });
      };

      const grade = () => {
        checked = true;
        let correct = 0;
        const all = rows();
        all.forEach((row) => {
          const input = row.querySelector(".lesson-exercise__input");
          input.disabled = true;
          const isRight = isRowRight(row, input.value);
          row.classList.add(isRight ? "is-correct" : "is-wrong");
          if (isRight) correct += 1;
          else if (row.dataset.answer) {
            const solution = document.createElement("span");
            solution.className = "lesson-exercise__solution";
            solution.textContent = `→ ${row.dataset.answer}`;
            row.appendChild(solution);
          }
          if (row.dataset.explain) {
            const note = document.createElement("p");
            note.className = "lesson-exercise__note";
            note.textContent = row.dataset.explain;
            row.appendChild(note);
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

      rowsWrap.querySelectorAll(".lesson-exercise__input").forEach((input) => {
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !checked) {
            event.preventDefault();
            grade();
          }
        });
      });
    });
})();

// Interactive exercises: "truth" — fill in 0/1 for each cell of a truth
// table. Each <input class="lesson-truth-table__input"> carries its own
// data-answer ("0" or "1"); one "Prüfen" button grades every input at once.
(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="truth"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-truth-table tbody");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      let checked = false;
      const inputs = () => [...rowsWrap.querySelectorAll("input")];

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        inputs().forEach((input) => {
          const cell = input.closest("td");
          cell.classList.remove("is-correct", "is-wrong");
          cell.querySelector(".lesson-truth-table__solution")?.remove();
          input.value = "";
          input.disabled = false;
        });
        inputs()[0]?.focus();
      };

      const grade = () => {
        checked = true;
        let correct = 0;
        const all = inputs();
        all.forEach((input) => {
          input.disabled = true;
          const cell = input.closest("td");
          const isRight = input.value.trim() === input.dataset.answer;
          cell.classList.add(isRight ? "is-correct" : "is-wrong");
          if (isRight) {
            correct += 1;
          } else {
            const solution = document.createElement("span");
            solution.className = "lesson-truth-table__solution";
            solution.textContent = `→ ${input.dataset.answer}`;
            cell.appendChild(solution);
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

      inputs().forEach((input) => {
        input.addEventListener("input", () => {
          input.value = input.value.replace(/[^01]/g, "").slice(-1);
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            checkBtn.click();
          }
        });
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

// Interactive exercises: "logic-build" — rebuild XOR/XNOR/implication out of
// the basic operators ∧, ∨, ¬. Each row carries data-truth, a 4-char string
// of expected outputs for (A,B) = (0,0),(0,1),(1,0),(1,1). The typed
// expression is tokenized, parsed into a small AST, and evaluated for all
// four combinations — so any logically equivalent answer is accepted, not
// just one exact string.
(() => {
  const AND_WORDS = ["and", "und"];
  const OR_WORDS = ["or", "oder"];
  const NOT_WORDS = ["not", "nicht"];
  const COMBOS = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  const ERROR_MSG = {
    empty: "Bitte einen Ausdruck eingeben.",
    char: "Unbekanntes Zeichen. Erlaubt sind A, B, Klammern sowie ∧, ∨, ¬.",
    var: "Nur A und B sind als Operanden erlaubt.",
    parse:
      "Der Ausdruck ist nicht gültig aufgebaut. Prüf Klammern und Operatoren.",
  };

  const tokenize = (input) => {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const c = input[i];
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      if (c === "(") {
        tokens.push({ type: "LP" });
        i++;
        continue;
      }
      if (c === ")") {
        tokens.push({ type: "RP" });
        i++;
        continue;
      }
      if (c === "∧" || c === "&" || c === "*") {
        tokens.push({ type: "AND" });
        i++;
        continue;
      }
      if (c === "∨" || c === "|" || c === "+") {
        tokens.push({ type: "OR" });
        i++;
        continue;
      }
      if (c === "¬" || c === "!") {
        tokens.push({ type: "NOT" });
        i++;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;
        const word = input.slice(i, j).toLowerCase();
        if (AND_WORDS.includes(word)) tokens.push({ type: "AND" });
        else if (OR_WORDS.includes(word)) tokens.push({ type: "OR" });
        else if (NOT_WORDS.includes(word)) tokens.push({ type: "NOT" });
        else if (word === "a" || word === "b")
          tokens.push({ type: "VAR", name: word.toUpperCase() });
        else return { error: "var" };
        i = j;
        continue;
      }
      return { error: "char" };
    }
    return { tokens };
  };

  const parse = (tokens) => {
    let pos = 0;
    const peek = () => tokens[pos];

    const parseAtom = () => {
      const t = peek();
      if (!t) return null;
      if (t.type === "VAR") {
        pos++;
        return { type: "VAR", name: t.name };
      }
      if (t.type === "LP") {
        pos++;
        const inner = parseOr();
        if (!inner || peek()?.type !== "RP") return null;
        pos++;
        return inner;
      }
      return null;
    };
    const parseNot = () => {
      if (peek()?.type === "NOT") {
        pos++;
        const operand = parseNot();
        return operand ? { type: "NOT", operand } : null;
      }
      return parseAtom();
    };
    const parseAnd = () => {
      let node = parseNot();
      if (!node) return null;
      while (peek()?.type === "AND") {
        pos++;
        const rhs = parseNot();
        if (!rhs) return null;
        node = { type: "AND", left: node, right: rhs };
      }
      return node;
    };
    const parseOr = () => {
      let node = parseAnd();
      if (!node) return null;
      while (peek()?.type === "OR") {
        pos++;
        const rhs = parseAnd();
        if (!rhs) return null;
        node = { type: "OR", left: node, right: rhs };
      }
      return node;
    };

    const ast = parseOr();
    if (!ast || pos !== tokens.length) return { error: "parse" };
    return { ast };
  };

  const evalNode = (node, vals) => {
    switch (node.type) {
      case "VAR":
        return vals[node.name];
      case "NOT":
        return evalNode(node.operand, vals) ? 0 : 1;
      case "AND":
        return evalNode(node.left, vals) && evalNode(node.right, vals) ? 1 : 0;
      case "OR":
        return evalNode(node.left, vals) || evalNode(node.right, vals) ? 1 : 0;
      default:
        return 0;
    }
  };

  const truthString = (ast) =>
    COMBOS.map(([a, b]) => evalNode(ast, { A: a, B: b })).join("");

  document
    .querySelectorAll('.lesson-exercise[data-exercise="logic-build"]')
    .forEach((exercise) => {
      const rows = [
        ...exercise.querySelectorAll(".lesson-exercise__row[data-truth]"),
      ];
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rows.length || !checkBtn || !feedback) return;

      const inputs = rows.map((row) => row.querySelector("input"));
      let activeInput = inputs[0];
      let checked = false;

      inputs.forEach((input) => {
        input.addEventListener("focus", () => {
          activeInput = input;
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            checkBtn.click();
          }
        });
      });

      exercise.querySelectorAll(".lesson-exercise__symbol").forEach((btn) => {
        btn.addEventListener("click", () => {
          const input = activeInput || inputs[0];
          if (!input || input.disabled) return;
          const symbol = btn.dataset.symbol;
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          input.value =
            input.value.slice(0, start) + symbol + input.value.slice(end);
          const cursor = start + symbol.length;
          input.focus();
          input.setSelectionRange(cursor, cursor);
        });
      });

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        rows.forEach((row, idx) => {
          row.classList.remove("is-correct", "is-wrong");
          inputs[idx].value = "";
          inputs[idx].disabled = false;
        });
        activeInput = inputs[0];
        inputs[0]?.focus();
      };

      const grade = () => {
        checked = true;
        let correct = 0;
        let firstProblem = "";
        rows.forEach((row, idx) => {
          const input = inputs[idx];
          input.disabled = true;
          const raw = input.value.trim();
          if (!raw) {
            row.classList.add("is-wrong");
            firstProblem ||= ERROR_MSG.empty;
            return;
          }
          const tokenRes = tokenize(raw);
          if (tokenRes.error) {
            row.classList.add("is-wrong");
            firstProblem ||= ERROR_MSG[tokenRes.error];
            return;
          }
          const parseRes = parse(tokenRes.tokens);
          if (parseRes.error) {
            row.classList.add("is-wrong");
            firstProblem ||= ERROR_MSG[parseRes.error];
            return;
          }
          if (truthString(parseRes.ast) === row.dataset.truth) {
            row.classList.add("is-correct");
            correct += 1;
          } else {
            row.classList.add("is-wrong");
          }
        });

        feedback.innerHTML =
          correct === rows.length
            ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Gut gemacht! Alle drei Ausdrücke passen.</p>'
            : `<p class="lesson-exercise__result">${correct} von ${rows.length} richtig.${
                firstProblem ? ` ${firstProblem}` : " Nochmal versuchen."
              }</p>`;
        feedback.hidden = false;
        checkBtn.textContent = "Nochmal";
      };

      checkBtn.addEventListener("click", () => {
        if (checked) freshBoard();
        else grade();
      });
    });
})();

// Interactive exercises: "law-quiz" — practice the eight Boolesche Gesetze in
// either direction. Each law's left/right side lives in a hidden
// .lesson-law-quiz__data list (data-law-*) so the JS below stays generic.
// "Ausdruck → Gesetz": a full equation is shown, pick the matching law name.
// "Gesetz → Ausdruck": only the law name + one side is shown, type the other
// side; it's tokenized/parsed into an AST and checked for logical
// equivalence (over all 8 combinations of A, B, C) against the canonical
// side, so any equivalent expression is accepted, not just one exact string.
(() => {
  const AND_WORDS = ["and", "und"];
  const OR_WORDS = ["or", "oder"];
  const NOT_WORDS = ["not", "nicht"];
  const VAR_NAMES = ["a", "b", "c"];
  const LAW_COMBOS = [];
  for (let a = 0; a <= 1; a++)
    for (let b = 0; b <= 1; b++)
      for (let c = 0; c <= 1; c++) LAW_COMBOS.push({ A: a, B: b, C: c });

  const tokenizeLaw = (input) => {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const c = input[i];
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      if (c === "(") {
        tokens.push({ type: "LP", raw: "(" });
        i++;
        continue;
      }
      if (c === ")") {
        tokens.push({ type: "RP", raw: ")" });
        i++;
        continue;
      }
      if (c === "∧" || c === "&" || c === "*") {
        tokens.push({ type: "AND", raw: "∧" });
        i++;
        continue;
      }
      if (c === "∨" || c === "|" || c === "+") {
        tokens.push({ type: "OR", raw: "∨" });
        i++;
        continue;
      }
      if (c === "¬" || c === "!") {
        tokens.push({ type: "NOT", raw: "¬" });
        i++;
        continue;
      }
      if (c === "0" || c === "1") {
        tokens.push({ type: "CONST", raw: c, value: c === "1" ? 1 : 0 });
        i++;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;
        const word = input.slice(i, j).toLowerCase();
        if (AND_WORDS.includes(word)) tokens.push({ type: "AND", raw: "∧" });
        else if (OR_WORDS.includes(word)) tokens.push({ type: "OR", raw: "∨" });
        else if (NOT_WORDS.includes(word))
          tokens.push({ type: "NOT", raw: "¬" });
        else if (VAR_NAMES.includes(word))
          tokens.push({
            type: "VAR",
            name: word.toUpperCase(),
            raw: word.toUpperCase(),
          });
        else return { error: "var" };
        i = j;
        continue;
      }
      return { error: "char" };
    }
    return { tokens };
  };

  const parseLaw = (tokens) => {
    let pos = 0;
    const peek = () => tokens[pos];

    const parseAtom = () => {
      const t = peek();
      if (!t) return null;
      if (t.type === "VAR") {
        pos++;
        return { type: "VAR", name: t.name };
      }
      if (t.type === "CONST") {
        pos++;
        return { type: "CONST", value: t.value };
      }
      if (t.type === "LP") {
        pos++;
        const inner = parseOr();
        if (!inner || peek()?.type !== "RP") return null;
        pos++;
        return inner;
      }
      return null;
    };
    const parseNot = () => {
      if (peek()?.type === "NOT") {
        pos++;
        const operand = parseNot();
        return operand ? { type: "NOT", operand } : null;
      }
      return parseAtom();
    };
    const parseAnd = () => {
      let node = parseNot();
      if (!node) return null;
      while (peek()?.type === "AND") {
        pos++;
        const rhs = parseNot();
        if (!rhs) return null;
        node = { type: "AND", left: node, right: rhs };
      }
      return node;
    };
    const parseOr = () => {
      let node = parseAnd();
      if (!node) return null;
      while (peek()?.type === "OR") {
        pos++;
        const rhs = parseAnd();
        if (!rhs) return null;
        node = { type: "OR", left: node, right: rhs };
      }
      return node;
    };

    const ast = parseOr();
    if (!ast || pos !== tokens.length) return { error: "parse" };
    return { ast };
  };

  const evalLawNode = (node, vals) => {
    switch (node.type) {
      case "VAR":
        return vals[node.name];
      case "CONST":
        return node.value;
      case "NOT":
        return evalLawNode(node.operand, vals) ? 0 : 1;
      case "AND":
        return evalLawNode(node.left, vals) && evalLawNode(node.right, vals)
          ? 1
          : 0;
      case "OR":
        return evalLawNode(node.left, vals) || evalLawNode(node.right, vals)
          ? 1
          : 0;
      default:
        return 0;
    }
  };

  const truthOfLaw = (ast) =>
    LAW_COMBOS.map((vals) => evalLawNode(ast, vals)).join("");

  const EXPR_CLASS = {
    VAR: "code-name",
    CONST: "code-value",
    AND: "code-operator",
    OR: "code-operator",
    NOT: "code-operator",
  };
  const renderExprHtml = (tokens) =>
    tokens
      .map((t, idx) => {
        const prev = tokens[idx - 1];
        const space =
          idx > 0 &&
          t.type !== "RP" &&
          prev.type !== "LP" &&
          prev.type !== "NOT"
            ? " "
            : "";
        if (t.type === "LP" || t.type === "RP") return `${space}${t.raw}`;
        return `${space}<span class="${EXPR_CLASS[t.type]}">${t.raw}</span>`;
      })
      .join("");

  const shuffle = (arr) =>
    arr
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const LAW_ERRORS = {
    empty: "Bitte einen Ausdruck eingeben.",
    char: "Unbekanntes Zeichen. Erlaubt sind A, B, C, 0, 1, Klammern sowie ∧, ∨, ¬.",
    var: "Nur A, B und C sind als Operanden erlaubt.",
    parse:
      "Der Ausdruck ist nicht gültig aufgebaut. Prüf Klammern und Operatoren.",
  };

  document
    .querySelectorAll('.lesson-exercise[data-exercise="law-quiz"]')
    .forEach((exercise) => {
      const board = exercise.querySelector("[data-law-quiz-board]");
      const modeButtons = [
        ...exercise.querySelectorAll(".lesson-law-quiz__mode"),
      ];
      const dataItems = [
        ...exercise.querySelectorAll(".lesson-law-quiz__data li"),
      ];
      if (!board || !modeButtons.length || !dataItems.length) return;

      const laws = dataItems.map((li) => {
        const leftTokens = tokenizeLaw(li.dataset.lawLeft).tokens || [];
        const rightTokens = tokenizeLaw(li.dataset.lawRight).tokens || [];
        return {
          id: li.dataset.lawId,
          name: li.dataset.lawName,
          leftHtml: renderExprHtml(leftTokens),
          rightHtml: renderExprHtml(rightTokens),
          rightAst: parseLaw(rightTokens).ast,
        };
      });

      let mode = "expr-to-law";
      let lastLawId = null;

      const pickLaw = () => {
        let law;
        do {
          law = laws[Math.floor(Math.random() * laws.length)];
        } while (laws.length > 1 && law.id === lastLawId);
        lastLawId = law.id;
        return law;
      };

      const renderExprToLaw = () => {
        const current = pickLaw();
        const options = shuffle(laws.map((l) => l.name));
        board.innerHTML = `
          <div class="lesson-code" aria-label="Zu bestimmender Ausdruck">
            <div class="lesson-code__head"><span>Welches Gesetz?</span><span>Ausdruck</span></div>
            <pre><code>${current.leftHtml} <span class="code-operator">=</span> ${current.rightHtml}</code></pre>
          </div>
          <div class="lesson-exercise__options" role="group" aria-label="Gesetz auswählen">
            ${options.map((name) => `<button type="button" class="lesson-exercise__option" data-name="${name}">${name}</button>`).join("")}
          </div>
          <div class="lesson-exercise__feedback" aria-live="polite" hidden></div>
        `;

        const feedback = board.querySelector(".lesson-exercise__feedback");
        const optionButtons = [
          ...board.querySelectorAll(".lesson-exercise__option"),
        ];
        let answered = false;

        optionButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            if (answered) return;
            answered = true;
            const ok = btn.dataset.name === current.name;
            optionButtons.forEach((b) => {
              b.disabled = true;
              if (b.dataset.name === current.name)
                b.classList.add("is-correct");
              else if (b === btn) b.classList.add("is-wrong");
            });
            feedback.innerHTML = `<p class="lesson-exercise__result${
              ok ? " lesson-exercise__result--ok" : ""
            }">${ok ? "Richtig ✓" : `Leider falsch. Das ist das <strong>${current.name}</strong>.`}</p>
            <button type="button" class="lesson-exercise__check">Nächste Frage</button>`;
            feedback.hidden = false;
            feedback
              .querySelector(".lesson-exercise__check")
              .addEventListener("click", renderExprToLaw);
          });
        });
      };

      const renderLawToExpr = () => {
        const current = pickLaw();
        board.innerHTML = `
          <div class="lesson-code" aria-label="Zu vervollständigender Ausdruck">
            <div class="lesson-code__head"><span>${current.name}</span><span>Ausdruck</span></div>
            <pre><code>${current.leftHtml} <span class="code-operator">=</span> ?</code></pre>
          </div>
          <input
            class="lesson-exercise__input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            placeholder="Nutze auch Worte wie 'und', 'oder', 'nicht'"
            aria-label="Deine Antwort"
          />
          <div class="lesson-exercise__symbols" role="group" aria-label="Operator einfügen">
            <button type="button" class="lesson-exercise__symbol" data-symbol="∧">∧ <small>und</small></button>
            <button type="button" class="lesson-exercise__symbol" data-symbol="∨">∨ <small>oder</small></button>
            <button type="button" class="lesson-exercise__symbol" data-symbol="¬">¬ <small>nicht</small></button>
          </div>
          <div class="lesson-exercise__actions">
            <button type="button" class="lesson-exercise__check">Prüfen</button>
          </div>
          <div class="lesson-exercise__feedback" aria-live="polite" hidden></div>
        `;

        const input = board.querySelector(".lesson-exercise__input");
        const checkBtn = board.querySelector(".lesson-exercise__check");
        const feedback = board.querySelector(".lesson-exercise__feedback");
        let solved = false;

        board.querySelectorAll(".lesson-exercise__symbol").forEach((btn) => {
          btn.addEventListener("click", () => {
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            input.value =
              input.value.slice(0, start) +
              btn.dataset.symbol +
              input.value.slice(end);
            const cursor = start + btn.dataset.symbol.length;
            input.focus();
            input.setSelectionRange(cursor, cursor);
          });
        });

        const say = (html, ok) => {
          feedback.innerHTML = `<p class="lesson-exercise__result${ok ? " lesson-exercise__result--ok" : ""}">${html}</p>`;
          feedback.hidden = false;
        };

        const grade = () => {
          const raw = input.value.trim();
          if (!raw) {
            say(LAW_ERRORS.empty, false);
            return;
          }
          const tokenRes = tokenizeLaw(raw);
          if (tokenRes.error) {
            say(LAW_ERRORS[tokenRes.error], false);
            return;
          }
          const parseRes = parseLaw(tokenRes.tokens);
          if (parseRes.error) {
            say(LAW_ERRORS[parseRes.error], false);
            return;
          }
          if (truthOfLaw(parseRes.ast) === truthOfLaw(current.rightAst)) {
            solved = true;
            input.disabled = true;
            input.classList.add("is-correct");
            say("Richtig ✓", true);
            checkBtn.textContent = "Nächste Frage";
          } else {
            say("Das ist nicht äquivalent. Versuch es nochmal.", false);
          }
        };

        checkBtn.addEventListener("click", () => {
          if (solved) renderLawToExpr();
          else grade();
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            checkBtn.click();
          }
        });
        input.focus();
      };

      const render = () =>
        mode === "expr-to-law" ? renderExprToLaw() : renderLawToExpr();

      modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.mode === mode) return;
          mode = btn.dataset.mode;
          modeButtons.forEach((b) => {
            const active = b === btn;
            b.classList.toggle("is-active", active);
            b.setAttribute("aria-pressed", String(active));
          });
          render();
        });
      });

      render();
    });
})();

(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="combo-count"]')
    .forEach((exercise) => {
      const input = exercise.querySelector(".lesson-exercise__input");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      const revealTarget = document.getElementById(
        exercise.dataset.reveal || "",
      );
      if (!input || !checkBtn || !feedback) return;

      let solved = false;

      const say = (html, ok) => {
        feedback.innerHTML = `<p class="lesson-exercise__result${
          ok ? " lesson-exercise__result--ok" : ""
        }">${html}</p>`;
        feedback.hidden = false;
      };

      const grade = () => {
        const val = input.value.trim();
        if (val === input.dataset.answer) {
          solved = true;
          input.disabled = true;
          input.classList.add("is-correct");
          checkBtn.textContent = "Richtig ✓";
          say("Richtig! Die Tabelle ist jetzt bereit.", true);
          if (revealTarget) {
            revealTarget.hidden = false;
            revealTarget.querySelector("input")?.focus();
          }
        } else {
          say(
            `${val ? "Nicht ganz. " : ""}Tipp: N = 2ⁿ, und der Ausdruck hat drei Operanden.`,
            false,
          );
        }
      };

      checkBtn.addEventListener("click", () => {
        if (!solved) grade();
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !solved) {
          event.preventDefault();
          grade();
        }
      });
    });
})();

// Interactive exercises: "binary-arith" — type the binary result of adding
// or subtracting the two numbers shown in each row (data-a, data-b, data-op).
// With data-generate="binary", "Nochmal" also draws a fresh pair (a > b) and
// updates both rows to match.
(() => {
  const randInt = (n) => Math.floor(Math.random() * n);

  const buildPair = () => {
    const a = 9 + randInt(54); // 9..62
    const b = 2 + randInt(a - 2); // 2..a-1, keeps a > b > 0
    return { a, b };
  };

  document
    .querySelectorAll('.lesson-exercise[data-exercise="binary-arith"]')
    .forEach((exercise) => {
      const rowsWrap = exercise.querySelector(".lesson-exercise__rows");
      const checkBtn = exercise.querySelector(".lesson-exercise__check");
      const feedback = exercise.querySelector(".lesson-exercise__feedback");
      if (!rowsWrap || !checkBtn || !feedback) return;

      const regenerates = exercise.dataset.generate === "binary";
      let checked = false;
      const rows = () => [
        ...rowsWrap.querySelectorAll(".lesson-exercise__row"),
      ];

      const applyPair = (a, b) => {
        rows().forEach((row) => {
          row.dataset.a = a.toString(2);
          row.dataset.b = b.toString(2);
          const literal = row.querySelector(".lesson-exercise__literal");
          literal.textContent = `${a.toString(2)} ${row.dataset.op} ${b.toString(2)} =`;
        });
      };

      const freshBoard = () => {
        checked = false;
        feedback.hidden = true;
        feedback.innerHTML = "";
        checkBtn.textContent = "Prüfen";
        if (regenerates) {
          const { a, b } = buildPair();
          applyPair(a, b);
        }
        rows().forEach((row) => {
          row.classList.remove("is-correct", "is-wrong");
          row.querySelector(".lesson-exercise__solution")?.remove();
          const input = row.querySelector(".lesson-exercise__input");
          input.value = "";
          input.disabled = false;
        });
      };

      const grade = () => {
        checked = true;
        let correct = 0;
        const all = rows();
        all.forEach((row) => {
          const input = row.querySelector(".lesson-exercise__input");
          input.disabled = true;
          const a = parseInt(row.dataset.a, 2);
          const b = parseInt(row.dataset.b, 2);
          const expected = row.dataset.op === "+" ? a + b : a - b;
          const raw = input.value.trim();
          const given = /^[01]+$/.test(raw) ? parseInt(raw, 2) : NaN;
          const isRight = given === expected;
          row.classList.add(isRight ? "is-correct" : "is-wrong");
          if (isRight) {
            correct += 1;
          } else {
            const solution = document.createElement("span");
            solution.className = "lesson-exercise__solution";
            solution.textContent = `→ ${expected.toString(2)}`;
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

      rowsWrap.querySelectorAll(".lesson-exercise__input").forEach((input) => {
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !checked) {
            event.preventDefault();
            grade();
          }
        });
      });
    });
})();

(() => {
  document.querySelectorAll("[data-step-table]").forEach((wrap) => {
    const btn = wrap.querySelector(".lesson-step-table__btn");
    const steps = [
      ...new Set(
        [...wrap.querySelectorAll("[data-step]")].map((el) =>
          Number(el.dataset.step),
        ),
      ),
    ].sort((a, b) => a - b);
    if (!btn || !steps.length) return;

    let idx = 0;

    const reset = () => {
      wrap.querySelectorAll("[data-step]").forEach((el) => {
        el.classList.add("is-hidden");
      });
      idx = 0;
      btn.textContent = "Nächste Spalte zeigen";
    };

    btn.addEventListener("click", () => {
      if (idx >= steps.length) {
        reset();
        return;
      }
      wrap
        .querySelectorAll(`[data-step="${steps[idx]}"]`)
        .forEach((el) => el.classList.remove("is-hidden"));
      idx += 1;
      btn.textContent =
        idx >= steps.length ? "Von vorne" : "Nächste Spalte zeigen";
    });
  });
})();

// Interactive exercises: "normalform" — random easy boolean expression, built
// from a fixed pool and parsed once so the truth table and the canonical
// answer can never drift apart. Four chained stages, each unlocked by the
// previous one: fill the truth table, pick DNF or KNF, click the rows that
// belong to that canonical form, then build it by toggling negations on each
// variable and choosing the ∧/∨ that connects them.
(() => {
  const EXPR_POOL = [
    "(A∧B)∨¬C",
    "A∨(B∧¬C)",
    "¬A∧(B∨C)",
    "(¬A∨B)∧C",
    "A∧(¬B∨C)",
    "(A∨B)∧¬C",
    "¬A∨(B∧C)",
    "(A∧¬B)∨C",
  ];
  const COMBOS = [];
  for (let a = 0; a <= 1; a++)
    for (let b = 0; b <= 1; b++)
      for (let c = 0; c <= 1; c++) COMBOS.push({ A: a, B: b, C: c });

  const tokenizeNf = (input) => {
    const tokens = [];
    for (const c of input) {
      if (c === "(") tokens.push({ type: "LP" });
      else if (c === ")") tokens.push({ type: "RP" });
      else if (c === "∧") tokens.push({ type: "AND" });
      else if (c === "∨") tokens.push({ type: "OR" });
      else if (c === "¬") tokens.push({ type: "NOT" });
      else if (/[A-Za-z]/.test(c))
        tokens.push({ type: "VAR", name: c.toUpperCase() });
    }
    return tokens;
  };

  const parseNf = (tokens) => {
    let pos = 0;
    const peek = () => tokens[pos];
    const parseAtom = () => {
      const t = peek();
      if (!t) return null;
      if (t.type === "VAR") {
        pos++;
        return { type: "VAR", name: t.name };
      }
      if (t.type === "LP") {
        pos++;
        const inner = parseOr();
        if (!inner || peek()?.type !== "RP") return null;
        pos++;
        return inner;
      }
      return null;
    };
    const parseNot = () => {
      if (peek()?.type === "NOT") {
        pos++;
        const operand = parseNot();
        return operand ? { type: "NOT", operand } : null;
      }
      return parseAtom();
    };
    const parseAnd = () => {
      let node = parseNot();
      if (!node) return null;
      while (peek()?.type === "AND") {
        pos++;
        const rhs = parseNot();
        if (!rhs) return null;
        node = { type: "AND", left: node, right: rhs };
      }
      return node;
    };
    const parseOr = () => {
      let node = parseAnd();
      if (!node) return null;
      while (peek()?.type === "OR") {
        pos++;
        const rhs = parseAnd();
        if (!rhs) return null;
        node = { type: "OR", left: node, right: rhs };
      }
      return node;
    };
    return parseOr();
  };

  const evalNf = (node, vals) => {
    switch (node.type) {
      case "VAR":
        return vals[node.name];
      case "NOT":
        return evalNf(node.operand, vals) ? 0 : 1;
      case "AND":
        return evalNf(node.left, vals) && evalNf(node.right, vals) ? 1 : 0;
      case "OR":
        return evalNf(node.left, vals) || evalNf(node.right, vals) ? 1 : 0;
      default:
        return 0;
    }
  };

  const NF_SYMBOL = { AND: "∧", OR: "∨", NOT: "¬" };
  const NF_CLASS = {
    VAR: "code-name",
    AND: "code-operator",
    OR: "code-operator",
    NOT: "code-operator",
  };
  const renderNfHtml = (tokens) =>
    tokens
      .map((t, idx) => {
        const prev = tokens[idx - 1];
        const space =
          idx > 0 &&
          t.type !== "RP" &&
          prev.type !== "LP" &&
          prev.type !== "NOT"
            ? " "
            : "";
        if (t.type === "LP") return `${space}(`;
        if (t.type === "RP") return `)`;
        const raw = t.type === "VAR" ? t.name : NF_SYMBOL[t.type];
        return `${space}<span class="${NF_CLASS[t.type]}">${raw}</span>`;
      })
      .join("");

  document
    .querySelectorAll('.lesson-exercise[data-exercise="normalform"]')
    .forEach((exercise) => {
      const exprEl = exercise.querySelector("[data-nf-expr]");
      const tbody = exercise.querySelector(".lesson-truth-table tbody");
      const tableCheckBtn = exercise.querySelector("[data-nf-table-check]");
      const tableFeedback = exercise.querySelector("[data-nf-table-feedback]");
      const modeSection = exercise.querySelector("[data-nf-mode]");
      const modeButtons = [...exercise.querySelectorAll("[data-nf-pick]")];
      const rowSection = exercise.querySelector("[data-nf-rows]");
      const rowHint = exercise.querySelector("[data-nf-row-hint]");
      const rowCheckBtn = exercise.querySelector("[data-nf-row-check]");
      const rowFeedback = exercise.querySelector("[data-nf-row-feedback]");
      const builderSection = exercise.querySelector("[data-nf-builder]");
      const builderBoard = exercise.querySelector("[data-nf-builder-board]");
      const builderCheckBtn = exercise.querySelector("[data-nf-builder-check]");
      const builderFeedback = exercise.querySelector(
        "[data-nf-builder-feedback]",
      );
      if (
        !exprEl ||
        !tbody ||
        !tableCheckBtn ||
        !modeSection ||
        !rowSection ||
        !builderSection ||
        !builderBoard ||
        !builderCheckBtn
      )
        return;

      let current = null;
      let lastExprIdx = -1;
      let builderChecked = false;

      const pickExpr = () => {
        let idx;
        do {
          idx = Math.floor(Math.random() * EXPR_POOL.length);
        } while (EXPR_POOL.length > 1 && idx === lastExprIdx);
        lastExprIdx = idx;
        return EXPR_POOL[idx];
      };

      const renderTable = (rows) => {
        tbody.innerHTML = rows
          .map(
            (row, idx) => `
          <tr data-row-idx="${idx}">
            <td>${row.A}</td>
            <td>${row.B}</td>
            <td>${row.C}</td>
            <td>
              <input
                class="lesson-truth-table__input"
                type="text"
                inputmode="numeric"
                maxlength="1"
                data-answer="${row.F}"
                aria-label="Ergebnis von F bei A=${row.A}, B=${row.B}, C=${row.C}"
              />
            </td>
          </tr>`,
          )
          .join("");
      };

      const newExercise = () => {
        const raw = pickExpr();
        const tokens = tokenizeNf(raw);
        const ast = parseNf(tokens);
        const rows = COMBOS.map((vals) => ({ ...vals, F: evalNf(ast, vals) }));
        current = { rows, mode: null, selected: null };

        exprEl.innerHTML = renderNfHtml(tokens);
        renderTable(rows);

        tableFeedback.hidden = true;
        tableFeedback.innerHTML = "";
        tableCheckBtn.disabled = false;
        tableCheckBtn.textContent = "Wahrheitstabelle prüfen";

        modeSection.hidden = true;
        modeButtons.forEach((btn) => {
          btn.disabled = false;
          btn.classList.remove("is-active");
        });

        rowSection.hidden = true;
        rowCheckBtn.disabled = false;
        rowCheckBtn.textContent = "Zeilen prüfen";
        rowFeedback.hidden = true;
        rowFeedback.innerHTML = "";

        builderSection.hidden = true;
        builderBoard.innerHTML = "";
        builderChecked = false;
        builderCheckBtn.textContent = "Prüfen";
        builderFeedback.hidden = true;
        builderFeedback.innerHTML = "";

        tbody.querySelectorAll("input").forEach((input) => {
          input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              tableCheckBtn.click();
            }
          });
        });
      };

      // --- Stage 1: fill the truth table ---
      const gradeTable = () => {
        let correct = 0;
        const inputs = [...tbody.querySelectorAll("input")];
        inputs.forEach((input) => {
          input.disabled = true;
          const cell = input.closest("td");
          const isRight = input.value.trim() === input.dataset.answer;
          cell.classList.add(isRight ? "is-correct" : "is-wrong");
          if (isRight) {
            correct += 1;
          } else {
            const sol = document.createElement("span");
            sol.className = "lesson-truth-table__solution";
            sol.textContent = `→ ${input.dataset.answer}`;
            cell.appendChild(sol);
          }
        });
        tableFeedback.innerHTML =
          correct === inputs.length
            ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Gut gemacht!</p>'
            : `<p class="lesson-exercise__result">${correct} von ${inputs.length} richtig.</p>`;
        tableFeedback.hidden = false;
        tableCheckBtn.disabled = true;
        modeSection.hidden = false;
      };

      tableCheckBtn.addEventListener("click", () => {
        if (tableCheckBtn.disabled) return;
        gradeTable();
      });

      // --- Stage 2: pick DNF or KNF ---
      const openRowStage = () => {
        const wantValue = current.mode === "DNF" ? 1 : 0;
        rowHint.textContent = `Klick auf alle passenden Zeilen.`;

        [...tbody.querySelectorAll("tr")].forEach((tr) => {
          tr.classList.add("is-selectable");
          tr.setAttribute("role", "button");
          tr.setAttribute("tabindex", "0");
          tr.setAttribute("aria-pressed", "false");

          const toggle = () => {
            if (tr.dataset.locked === "true") return;
            const pressed = tr.getAttribute("aria-pressed") === "true";
            tr.setAttribute("aria-pressed", String(!pressed));
            tr.classList.toggle("is-selected", !pressed);
          };
          tr.addEventListener("click", toggle);
          tr.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
          });
        });

        rowSection.hidden = false;
      };

      modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!current || current.mode) return;
          current.mode = btn.dataset.nfPick;
          modeButtons.forEach((b) => {
            b.disabled = true;
            b.classList.toggle("is-active", b === btn);
          });
          openRowStage();
        });
      });

      // --- Stage 3: select the matching rows ---
      const buildBuilder = () => {
        builderBoard.innerHTML = "";
        const mode = current.mode;
        const innerOp = mode === "DNF" ? "∧" : "∨";
        const outerOp = mode === "DNF" ? "∨" : "∧";
        const frag = document.createDocumentFragment();

        const makeOpGroup = (expectSymbol, extraClass) => {
          const wrap = document.createElement("span");
          wrap.className = extraClass
            ? `lesson-nf-op ${extraClass}`
            : "lesson-nf-op";
          wrap.dataset.expect = expectSymbol;
          ["∧", "∨"].forEach((sym) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "lesson-nf-op-btn";
            b.dataset.op = sym;
            b.setAttribute("aria-pressed", "false");
            b.textContent = sym;
            b.addEventListener("click", () => {
              if (b.disabled) return;
              const already = b.getAttribute("aria-pressed") === "true";
              wrap
                .querySelectorAll("button")
                .forEach((x) => x.setAttribute("aria-pressed", "false"));
              b.setAttribute("aria-pressed", String(!already));
            });
            wrap.appendChild(b);
          });
          return wrap;
        };

        const makeLiteral = (varName, expectNegate) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "lesson-nf-literal";
          btn.dataset.var = varName;
          btn.dataset.expectNegate = String(expectNegate);
          btn.setAttribute("aria-pressed", "false");
          btn.textContent = varName;
          btn.addEventListener("click", () => {
            if (btn.disabled) return;
            const negated = btn.getAttribute("aria-pressed") !== "true";
            btn.setAttribute("aria-pressed", String(negated));
            btn.textContent = negated ? `¬${varName}` : varName;
          });
          return btn;
        };

        current.selected.forEach((row, i) => {
          if (i > 0)
            frag.appendChild(makeOpGroup(outerOp, "lesson-nf-op--outer"));
          const clause = document.createElement("span");
          clause.className = "lesson-nf-clause";
          clause.append("(");
          ["A", "B", "C"].forEach((v, vi) => {
            const expectNegate = mode === "DNF" ? row[v] === 0 : row[v] === 1;
            clause.appendChild(makeLiteral(v, expectNegate));
            if (vi < 2) clause.appendChild(makeOpGroup(innerOp));
          });
          clause.append(")");
          frag.appendChild(clause);
        });

        builderBoard.appendChild(frag);
      };

      const openBuilderStage = () => {
        buildBuilder();
        builderSection.hidden = false;
        builderChecked = false;
        builderCheckBtn.textContent = "Prüfen";
        builderCheckBtn.disabled = false;
        builderFeedback.hidden = true;
      };

      const gradeRows = () => {
        const wantValue = current.mode === "DNF" ? 1 : 0;
        const trs = [...tbody.querySelectorAll("tr")];
        let allRight = true;
        const selectedRows = [];

        trs.forEach((tr) => {
          const row = current.rows[Number(tr.dataset.rowIdx)];
          const shouldSelect = row.F === wantValue;
          const isSelected = tr.getAttribute("aria-pressed") === "true";
          tr.dataset.locked = "true";
          tr.classList.remove("is-selectable");

          if (shouldSelect) {
            selectedRows.push(row);
            tr.classList.add(isSelected ? "is-correct" : "is-missed");
            if (!isSelected) allRight = false;
          } else if (isSelected) {
            tr.classList.add("is-wrong");
            allRight = false;
          }
        });

        current.selected = selectedRows;
        rowFeedback.innerHTML = allRight
          ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Genau diese Zeilen brauchst du!</p>'
          : '<p class="lesson-exercise__result">Nicht ganz.</p>';
        rowFeedback.hidden = false;
        rowCheckBtn.disabled = true;

        openBuilderStage();
      };

      rowCheckBtn.addEventListener("click", () => {
        if (rowCheckBtn.disabled) return;
        gradeRows();
      });

      // --- Stage 4: build the canonical formula ---
      const solutionString = () => {
        const mode = current.mode;
        const innerOp = mode === "DNF" ? "∧" : "∨";
        const outerOp = mode === "DNF" ? " ∨ " : " ∧ ";
        const clauses = current.selected.map(
          (row) =>
            "(" +
            ["A", "B", "C"]
              .map((v) => {
                const negate = mode === "DNF" ? row[v] === 0 : row[v] === 1;
                return negate ? `¬${v}` : v;
              })
              .join(` ${innerOp} `) +
            ")",
        );
        return `F = ${clauses.join(outerOp)}`;
      };

      const gradeBuilder = () => {
        let correct = 0;
        let total = 0;

        builderBoard.querySelectorAll(".lesson-nf-literal").forEach((btn) => {
          total += 1;
          btn.disabled = true;
          const expect = btn.dataset.expectNegate === "true";
          const got = btn.getAttribute("aria-pressed") === "true";
          const right = expect === got;
          btn.classList.add(right ? "is-correct" : "is-wrong");
          if (right) correct += 1;
        });

        builderBoard.querySelectorAll(".lesson-nf-op").forEach((wrap) => {
          total += 1;
          const buttons = [...wrap.querySelectorAll("button")];
          buttons.forEach((b) => (b.disabled = true));
          const chosen = buttons.find(
            (b) => b.getAttribute("aria-pressed") === "true",
          );
          const right = !!chosen && chosen.dataset.op === wrap.dataset.expect;
          wrap.classList.add(right ? "is-correct" : "is-wrong");
          if (right) correct += 1;
        });

        builderFeedback.innerHTML =
          correct === total
            ? '<p class="lesson-exercise__result lesson-exercise__result--ok">Perfekt!</p>'
            : `<p class="lesson-exercise__result">${correct} von ${total} Feldern richtig.</p>` +
              `<p class="lesson-nf-solution">Lösung: ${solutionString()}</p>`;
        builderFeedback.hidden = false;
        builderCheckBtn.textContent = "Neue Aufgabe";
      };

      builderCheckBtn.addEventListener("click", () => {
        if (builderChecked) {
          newExercise();
          return;
        }
        gradeBuilder();
        builderChecked = true;
      });

      newExercise();
    });
})();

// Interactive exercises: "level-test" — the Python-Grundlagen placement test.
(() => {
  document
    .querySelectorAll('.lesson-exercise[data-exercise="level-test"]')
    .forEach((exercise) => {
      const checkBtn = exercise.querySelector("[data-lt-check]");
      const resetBtn = exercise.querySelector("[data-lt-reset]");
      const result = exercise.querySelector("[data-lt-result]");
      const hint = exercise.querySelector("[data-lt-hint]");
      const meter = exercise.querySelector("[data-lt-meter]");
      const meterFill = exercise.querySelector("[data-lt-meter-fill]");
      const answeredOut = exercise.querySelector("[data-lt-answered]");
      if (!checkBtn || !result) return;

      const groups = [...exercise.querySelectorAll("[data-lt-group]")].map(
        (group) => ({
          el: group,
          topic: group.dataset.topic || "",
          lesson: group.dataset.lesson || "",
          questions: [...group.querySelectorAll("[data-lt-question]")],
        }),
      );

      const questions = groups.flatMap((group) => group.questions);
      const total = questions.length;
      let graded = false;

      const inputsOf = (question) => [
        ...question.querySelectorAll('input[type="radio"]'),
      ];

      const pickedOf = (question) =>
        inputsOf(question).find((input) => input.checked) || null;

      const answeredCount = () =>
        questions.filter((question) => pickedOf(question)).length;

      const updateMeter = () => {
        const done = answeredCount();
        const share = total ? (done / total) * 100 : 0;
        if (meterFill) meterFill.style.width = `${share}%`;
        meter?.setAttribute("aria-valuenow", String(done));
        if (answeredOut) answeredOut.textContent = String(done);
      };

      // Percentage bands double as the wording of the verdict, so the same
      // table drives both the overall level and each topic's label.
      const bandFor = (percent) => {
        if (percent >= 85) return { label: "Sicher", tone: "high" };
        if (percent >= 60) return { label: "Solide", tone: "mid" };
        if (percent >= 35) return { label: "Grundlagen da", tone: "low" };
        return { label: "Noch offen", tone: "none" };
      };

      const markQuestion = (question) => {
        const picked = pickedOf(question);
        let right = false;

        inputsOf(question).forEach((input) => {
          const option = input.closest(".level-test__option");
          input.disabled = true;
          if (!option) return;
          if (input.dataset.correct === "true") {
            option.classList.add("is-correct");
            if (input.checked) right = true;
          } else if (input.checked) {
            option.classList.add("is-wrong");
          }
        });

        question.classList.add(
          right ? "is-right" : picked ? "is-wrong" : "is-blank",
        );

        const explain = question.querySelector("[data-lt-explain]");
        if (explain) explain.hidden = false;

        return right;
      };

      const renderResult = (scores, correct) => {
        const percent = total ? Math.round((correct / total) * 100) : 0;
        const band = bandFor(percent);
        const weak = scores.filter((score) => score.percent < 70);

        const rows = scores
          .map((score) => {
            const scoreBand = bandFor(score.percent);
            const link = score.lesson
              ? `<a class="level-test__score-link" href="${score.lesson}">Lektion öffnen ›</a>`
              : "";
            return `
              <li class="level-test__score" data-tone="${scoreBand.tone}">
                <div class="level-test__score-head">
                  <strong>${score.topic}</strong>
                  <span class="level-test__score-value">${score.percent}&nbsp;%</span>
                </div>
                <div class="level-test__score-track">
                  <span class="level-test__score-fill" style="width: ${score.percent}%"></span>
                </div>
                <div class="level-test__score-foot">
                  <span>${score.correct} von ${score.total} richtig · ${scoreBand.label}</span>
                  ${link}
                </div>
              </li>`;
          })
          .join("");

        const advice = weak.length
          ? `<p class="level-test__advice">Am meisten bringt dir gerade: ${weak
              .map((score) => `<strong>${score.topic}</strong>`)
              .join(", ")}.</p>`
          : `<p class="level-test__advice">Kein Thema unter 70&nbsp;%. Du bist also in Python kein Newbie.</p>`;

        result.innerHTML = `
          <p class="lesson-exercise__result lesson-exercise__result--ok">
            Auswertung <span class="beta-badge">Beta</span>
          </p>
          <div class="level-test__overall" data-tone="${band.tone}">
            <span class="level-test__overall-value">${percent}&nbsp;%</span>
            <span class="level-test__overall-meta">
              <strong>${band.label}</strong>
              ${correct} von ${total} Fragen richtig
            </span>
          </div>
          <ul class="level-test__scores">${rows}</ul>
          ${advice}
          <p class="level-test__note">
            Bei jeder Frage siehst du jetzt die richtige Antwort mit einer
            kurzen Erklärung.
          </p>`;
        result.hidden = false;
      };

      const grade = () => {
        graded = true;
        let correct = 0;

        const scores = groups.map((group) => {
          const right = group.questions.filter(markQuestion).length;
          correct += right;
          return {
            topic: group.topic,
            lesson: group.lesson,
            correct: right,
            total: group.questions.length,
            percent: group.questions.length
              ? Math.round((right / group.questions.length) * 100)
              : 0,
          };
        });

        renderResult(scores, correct);
        checkBtn.hidden = true;
        if (resetBtn) resetBtn.hidden = false;
        if (hint) hint.textContent = "";
        result.focus();
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      const reset = () => {
        graded = false;
        questions.forEach((question) => {
          question.classList.remove("is-right", "is-wrong", "is-blank");
          question.querySelectorAll("[data-lt-explain]").forEach((explain) => {
            explain.hidden = true;
          });
          inputsOf(question).forEach((input) => {
            input.disabled = false;
            input.checked = false;
            input
              .closest(".level-test__option")
              ?.classList.remove("is-correct", "is-wrong");
          });
        });

        result.hidden = true;
        result.innerHTML = "";
        checkBtn.hidden = false;
        if (resetBtn) resetBtn.hidden = true;
        if (hint) {
          hint.textContent = "";
          delete hint.dataset.warned;
        }
        updateMeter();
        exercise.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      exercise.addEventListener("change", (event) => {
        if (graded || !event.target.matches('input[type="radio"]')) return;
        updateMeter();
        if (hint) hint.textContent = "";
      });

      // A form would reload the page on Enter; the test is graded by button.
      exercise.addEventListener("submit", (event) => event.preventDefault());

      checkBtn.addEventListener("click", () => {
        if (graded) return;
        const open = total - answeredCount();
        // First click on an incomplete test warns instead of grading, so
        // nobody loses points to a question they simply scrolled past.
        if (open && hint && !hint.dataset.warned) {
          hint.dataset.warned = "true";
          hint.textContent =
            open === 1
              ? "Eine Frage ist noch offen und würde als falsch zählen. Nochmal klicken, um trotzdem auszuwerten."
              : `${open} Fragen sind noch offen und würden als falsch zählen. Nochmal klicken, um trotzdem auszuwerten.`;
          return;
        }
        grade();
      });

      resetBtn?.addEventListener("click", reset);

      updateMeter();
    });
})();
