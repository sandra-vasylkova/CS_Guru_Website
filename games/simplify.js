const levelButtons = [...document.querySelectorAll(".simplify-level-btn")];
const scoreEl = document.getElementById("simplify-score");
const streakEl = document.getElementById("simplify-streak");
const modeEl = document.getElementById("simplify-mode");
const taskEl = document.getElementById("simplify-task");
const workspaceEl = document.getElementById("simplify-workspace");
const resultEl = document.getElementById("simplify-result");
const finalEl = document.getElementById("simplify-final");
const feedbackEl = document.getElementById("simplify-feedback");
const newTaskBtn = document.getElementById("simplify-new-task");
const showAnswerBtn = document.getElementById("simplify-show-answer");
const resetBtn = document.getElementById("simplify-reset");

const TASKS = [
  {
    expression: "¬¬A ∨ 0",
    final: "A",
    steps: [
      { rule: "doppelte Negation", fragment: "A ∨ 0" },
      { rule: "Neutralgesetz", fragment: "A" },
    ],
  },
  {
    expression: "(A ∨ A) ∧ 1",
    final: "A",
    steps: [
      { rule: "Idempotenzgesetz", fragment: "A ∧ 1" },
      { rule: "Neutralgesetz", fragment: "A" },
    ],
  },
  {
    expression: "(A ∧ A) ∨ 0",
    final: "A",
    steps: [
      { rule: "Idempotenzgesetz", fragment: "A ∨ 0" },
      { rule: "Neutralgesetz", fragment: "A" },
    ],
  },
  {
    expression: "A ∨ (¬A ∨ 0)",
    final: "1",
    steps: [
      { rule: "Assoziativgesetz", fragment: "(A ∨ ¬A) ∨ 0" },
      { rule: "Komplementgesetz", fragment: "1 ∨ 0" },
      { rule: "Neutralgesetz", fragment: "1" },
    ],
  },
  {
    expression: "A ∧ (¬A ∧ 1)",
    final: "0",
    steps: [
      { rule: "Assoziativgesetz", fragment: "(A ∧ ¬A) ∧ 1" },
      { rule: "Komplementgesetz", fragment: "0 ∧ 1" },
      { rule: "Neutralgesetz", fragment: "0" },
    ],
  },
  {
    expression: "(A ∨ B) ∧ (A ∨ ¬B)",
    final: "A",
    steps: [
      { rule: "Distributivgesetz", fragment: "A ∨ (B ∧ ¬B)" },
      { rule: "Komplementgesetz", fragment: "A ∨ 0" },
      { rule: "Neutralgesetz", fragment: "A" },
    ],
  },
  {
    expression: "(A ∧ B) ∨ (A ∧ ¬B)",
    final: "A",
    steps: [
      { rule: "Distributivgesetz", fragment: "A ∧ (B ∨ ¬B)" },
      { rule: "Komplementgesetz", fragment: "A ∧ 1" },
      { rule: "Neutralgesetz", fragment: "A" },
    ],
  },
  {
    expression: "¬(A ∨ ¬A) ∨ B",
    final: "B",
    steps: [
      { rule: "Gesetze von De Morgan", fragment: "(¬A ∧ ¬¬A) ∨ B" },
      { rule: "doppelte Negation", fragment: "(¬A ∧ A) ∨ B" },
      { rule: "Komplementgesetz", fragment: "0 ∨ B" },
      { rule: "Neutralgesetz", fragment: "B" },
    ],
  },
  {
    expression: "¬(A ∧ ¬A) ∧ B",
    final: "B",
    steps: [
      { rule: "Gesetze von De Morgan", fragment: "(¬A ∨ ¬¬A) ∧ B" },
      { rule: "doppelte Negation", fragment: "(¬A ∨ A) ∧ B" },
      { rule: "Komplementgesetz", fragment: "1 ∧ B" },
      { rule: "Neutralgesetz", fragment: "B" },
    ],
  },
  {
    expression: "¬¬(B ∧ 1)",
    final: "B",
    steps: [
      { rule: "doppelte Negation", fragment: "B ∧ 1" },
      { rule: "Neutralgesetz", fragment: "B" },
    ],
  },
];

let score = 0;
let streak = 0;
let currentLevel = null;
let currentTask = null;
let expectedStep = 0;
let selectedRule = null;
let selectedFragment = null;
let lastTaskIndex = -1;
let solved = false;
let activeTextInput = null;

function operatorButtonsHtml() {
  return `
    <div class="simplify-symbols" aria-label="Operatoren einfügen">
      <button class="simplify-symbol-btn" type="button" data-symbol="∨" aria-label="or einfügen">∨</button>
      <button class="simplify-symbol-btn" type="button" data-symbol="∧" aria-label="and einfügen">∧</button>
      <button class="simplify-symbol-btn" type="button" data-symbol="¬" aria-label="not einfügen">¬</button>
      <button class="simplify-symbol-btn" type="button" data-symbol="(" aria-label="Klammer auf einfügen">(</button>
      <button class="simplify-symbol-btn" type="button" data-symbol=")" aria-label="Klammer zu einfügen">)</button>
    </div>
  `;
}

function rememberInput(input) {
  activeTextInput = input;
}

function insertAtCursor(input, value) {
  if (!input) return;

  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`;
  input.focus();
  const position = start + value.length;
  input.setSelectionRange(position, position);
}

function bindOperatorButtons(root, fallbackInput = null) {
  root.querySelectorAll(".simplify-symbol-btn").forEach((button) => {
    button.addEventListener("click", () => {
      insertAtCursor(activeTextInput || fallbackInput, button.dataset.symbol);
    });
  });
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeText(expr) {
  return String(expr || "")
    .toUpperCase()
    .replace(/¬/g, "!")
    .replace(/~/g, "!")
    .replace(/∧/g, "&&")
    .replace(/∨/g, "||")
    .replace(/\bNOT\b/g, "!")
    .replace(/\bAND\b/g, "&&")
    .replace(/\bOR\b/g, "||")
    .replace(/\s+/g, "")
    .trim();
}

function toJsExpression(expr) {
  const js = normalizeText(expr)
    .replace(/(?<![A-Z])0(?![A-Z])/g, "false")
    .replace(/(?<![A-Z])1(?![A-Z])/g, "true");

  if (!/^[A-Z!&|()truefals]+$/i.test(js)) return null;
  return js;
}

function evaluateExpression(expr, assignment) {
  const js = toJsExpression(expr);
  if (!js) throw new Error("invalid expression");

  const variables = Object.keys(assignment);
  const values = variables.map((variable) => Boolean(assignment[variable]));
  return Boolean(Function(...variables, `"use strict"; return (${js});`)(...values));
}

function areEquivalent(left, right) {
  const variables = [...new Set(`${left} ${right}`.toUpperCase().match(/\b[A-Z]\b/g) || [])].sort();

  try {
    for (let mask = 0; mask < 2 ** variables.length; mask += 1) {
      const assignment = {};
      variables.forEach((variable, index) => {
        assignment[variable] = (mask >> index) & 1;
      });

      if (evaluateExpression(left, assignment) !== evaluateExpression(right, assignment)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function tokenizeBoolean(js) {
  const tokens = [];
  let i = 0;

  while (i < js.length) {
    if (js.slice(i, i + 2) === "&&") {
      tokens.push({ type: "AND" });
      i += 2;
      continue;
    }

    if (js.slice(i, i + 2) === "||") {
      tokens.push({ type: "OR" });
      i += 2;
      continue;
    }

    if (js[i] === "!") {
      tokens.push({ type: "NOT" });
      i += 1;
      continue;
    }

    if (js[i] === "(") {
      tokens.push({ type: "LPAREN" });
      i += 1;
      continue;
    }

    if (js[i] === ")") {
      tokens.push({ type: "RPAREN" });
      i += 1;
      continue;
    }

    if (js.slice(i, i + 4) === "true") {
      tokens.push({ type: "CONST", value: 1 });
      i += 4;
      continue;
    }

    if (js.slice(i, i + 5) === "false") {
      tokens.push({ type: "CONST", value: 0 });
      i += 5;
      continue;
    }

    if (/[A-Z]/.test(js[i])) {
      tokens.push({ type: "VAR", value: js[i] });
      i += 1;
      continue;
    }

    throw new Error("unexpected token");
  }

  tokens.push({ type: "EOF" });
  return tokens;
}

function parseBoolean(js) {
  const tokens = tokenizeBoolean(js);
  let index = 0;

  const peek = () => tokens[index];
  const consume = (type) => {
    if (peek().type !== type) throw new Error("parse error");
    return tokens[index++];
  };

  function parseOr() {
    let left = parseAnd();
    while (peek().type === "OR") {
      consume("OR");
      left = { type: "or", left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd() {
    let left = parseNot();
    while (peek().type === "AND") {
      consume("AND");
      left = { type: "and", left, right: parseNot() };
    }
    return left;
  }

  function parseNot() {
    if (peek().type === "NOT") {
      consume("NOT");
      return { type: "not", value: parseNot() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();

    if (token.type === "VAR") {
      consume("VAR");
      return { type: "var", name: token.value };
    }

    if (token.type === "CONST") {
      consume("CONST");
      return { type: "const", value: token.value };
    }

    if (token.type === "LPAREN") {
      consume("LPAREN");
      const expr = parseOr();
      consume("RPAREN");
      return expr;
    }

    throw new Error("parse error");
  }

  const ast = parseOr();
  if (peek().type !== "EOF") throw new Error("parse error");
  return ast;
}

function astKey(ast) {
  if (ast.type === "var") return `V:${ast.name}`;
  if (ast.type === "const") return `C:${ast.value}`;
  if (ast.type === "not") return `N(${astKey(ast.value)})`;

  const leftKey = astKey(ast.left);
  const rightKey = astKey(ast.right);
  return `${ast.type}(${[leftKey, rightKey].sort().join(",")})`;
}

function canonicalKey(expr) {
  const js = toJsExpression(expr);
  if (!js) return null;

  try {
    return astKey(parseBoolean(js));
  } catch {
    return null;
  }
}

// Structural equality up to reordering of ∧/∨ operands (commutativity),
// so a typed fragment isn't rejected merely for writing "B ∧ A" where the
// task's stored fragment happens to read "A ∧ B".
function sameFragment(a, b) {
  const keyA = canonicalKey(a);
  const keyB = canonicalKey(b);

  if (keyA === null || keyB === null) {
    return normalizeText(a) === normalizeText(b);
  }

  return keyA === keyB;
}

function updateHud() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  modeEl.textContent = currentLevel ? `Level ${currentLevel}` : "Kein Level gewählt";

  levelButtons.forEach((button) => {
    button.classList.toggle("simplify-level-btn--active", Number(button.dataset.level) === currentLevel);
  });
}

function setFeedback(text, type = "") {
  feedbackEl.textContent = text;
  feedbackEl.className = "simplify-feedback";
  if (type) feedbackEl.classList.add(`simplify-feedback--${type}`);
}

function lockPathStep(step) {
  const pathEl = document.getElementById("simplify-path");
  if (!pathEl) return;

  const item = document.createElement("div");
  item.className = "simplify-path-step";
  item.innerHTML = `
    <span>${expectedStep + 1}</span>
    <strong>${step.rule}</strong>
    <em>${step.fragment}</em>
  `;
  pathEl.appendChild(item);
}

function showResult() {
  solved = true;
  finalEl.textContent = currentTask.final;
  resultEl.classList.remove("simplify-result--hidden");
  score += 15 + currentLevel * 5 + Math.min(streak, 10);
  streak += 1;
  updateHud();
  setFeedback("");
}

function showAnswer() {
  if (!currentTask) return;

  solved = true;
  streak = 0;
  finalEl.textContent = currentTask.final;
  resultEl.classList.remove("simplify-result--hidden");
  updateHud();
  setFeedback("");
}

function completeStep(step) {
  lockPathStep(step);
  expectedStep += 1;

  if (expectedStep >= currentTask.steps.length) {
    showResult();
  }
}

function showTask() {
  let nextIndex = Math.floor(Math.random() * TASKS.length);
  if (TASKS.length > 1 && nextIndex === lastTaskIndex) {
    nextIndex = (nextIndex + 1) % TASKS.length;
  }

  lastTaskIndex = nextIndex;
  currentTask = TASKS[nextIndex];
  expectedStep = 0;
  selectedRule = null;
  selectedFragment = null;
  solved = false;

  taskEl.textContent = currentTask.expression;
  resultEl.classList.add("simplify-result--hidden");
  finalEl.textContent = "";
  setFeedback("");

  if (currentLevel === 1) renderLevelOne();
  if (currentLevel === 2) renderLevelTwo();
  if (currentLevel === 3) renderLevelThree();
}

function basePathHtml() {
  return `
    <div class="simplify-path-card">
      <h2>Lösungsweg</h2>
      <div id="simplify-path" class="simplify-path"></div>
    </div>
  `;
}

function renderLevelOne() {
  const rules = shuffle(currentTask.steps.map((step, index) => ({ ...step, index })));
  const fragments = shuffle(currentTask.steps.map((step, index) => ({ ...step, index })));

  workspaceEl.innerHTML = `
    <div class="simplify-match-board">
      <section class="simplify-column">
        <h2>Regeln</h2>
        ${rules.map((step) => `
          <button class="simplify-card" type="button" data-kind="rule" data-step="${step.index}">
            ${step.rule}
          </button>
        `).join("")}
      </section>
      <section class="simplify-column">
        <h2>Fragmente</h2>
        ${fragments.map((step) => `
          <button class="simplify-card" type="button" data-kind="fragment" data-step="${step.index}">
            ${step.fragment}
          </button>
        `).join("")}
      </section>
    </div>
    ${basePathHtml()}
  `;

  workspaceEl.querySelectorAll(".simplify-card").forEach((card) => {
    card.addEventListener("click", () => selectLevelOneCard(card));
  });
}

function selectLevelOneCard(card) {
  if (solved || card.classList.contains("simplify-card--locked")) return;

  const kind = card.dataset.kind;
  const stepIndex = Number(card.dataset.step);

  if (kind === "rule") {
    selectedRule?.classList.remove("simplify-card--selected");
    selectedRule = card;
  } else {
    selectedFragment?.classList.remove("simplify-card--selected");
    selectedFragment = card;
  }

  card.classList.add("simplify-card--selected");

  if (!selectedRule || !selectedFragment) return;

  const ruleIndex = Number(selectedRule.dataset.step);
  const fragmentIndex = Number(selectedFragment.dataset.step);

  if (ruleIndex === expectedStep && fragmentIndex === expectedStep) {
    selectedRule.classList.remove("simplify-card--selected");
    selectedFragment.classList.remove("simplify-card--selected");
    selectedRule.classList.add("simplify-card--locked");
    selectedFragment.classList.add("simplify-card--locked");
    selectedRule.disabled = true;
    selectedFragment.disabled = true;
    completeStep(currentTask.steps[expectedStep]);
    updateStepHint();
  } else {
    blink([selectedRule, selectedFragment]);
    setFeedback("");
  }

  selectedRule?.classList.remove("simplify-card--selected");
  selectedFragment?.classList.remove("simplify-card--selected");
  selectedRule = null;
  selectedFragment = null;
}

function renderLevelTwo() {
  const rules = currentTask.steps.map((step, index) => ({ ...step, index }));

  workspaceEl.innerHTML = `
    <div class="simplify-type-board">
      ${rules.map((step) => `
        <article class="simplify-type-card" data-step="${step.index}">
          <h2>${step.rule}</h2>
          <div class="simplify-type-row">
            <input class="simplify-fragment-input" type="text" autocomplete="off" placeholder="Fragment eingeben" />
            <button class="simplify-small-btn" type="button">Prüfen</button>
          </div>
        </article>
      `).join("")}
    </div>
    ${operatorButtonsHtml()}
    ${basePathHtml()}
  `;

  const firstInput = workspaceEl.querySelector(".simplify-fragment-input");
  rememberInput(firstInput);

  workspaceEl.querySelectorAll(".simplify-type-card").forEach((card) => {
    const input = card.querySelector(".simplify-fragment-input");
    const button = card.querySelector(".simplify-small-btn");
    input.addEventListener("focus", () => rememberInput(input));
    button.addEventListener("click", () => checkLevelTwoCard(card));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") checkLevelTwoCard(card);
    });
  });

  bindOperatorButtons(workspaceEl, firstInput);
}

function checkLevelTwoCard(card) {
  if (solved || card.classList.contains("simplify-type-card--locked")) return;

  const stepIndex = Number(card.dataset.step);
  const input = card.querySelector(".simplify-fragment-input");
  const answer = input.value;
  const expected = currentTask.steps[expectedStep].fragment;

  if (stepIndex !== expectedStep) {
    blink([card]);
    setFeedback("");
    return;
  }

  if (!sameFragment(answer, expected)) {
    input.value = "";
    blink([input]);
    setFeedback("");
    return;
  }

  card.classList.add("simplify-type-card--locked");
  input.readOnly = true;
  card.querySelector(".simplify-small-btn").disabled = true;
  completeStep(currentTask.steps[expectedStep]);
  updateStepHint();
}

function renderLevelThree() {
  workspaceEl.innerHTML = `
    <div class="simplify-solo-card">
      <label for="simplify-answer-input">Vereinfachte Form</label>
      <div class="simplify-answer-row">
        <input id="simplify-answer-input" class="simplify-answer-input" type="text" autocomplete="off" placeholder="Antwort" />
        <button id="simplify-check-answer" class="simplify-btn simplify-btn--primary" type="button">Prüfen</button>
      </div>
      ${operatorButtonsHtml()}
    </div>
  `;

  const input = document.getElementById("simplify-answer-input");
  const checkButton = document.getElementById("simplify-check-answer");

  checkButton.addEventListener("click", checkLevelThreeAnswer);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkLevelThreeAnswer();
  });

  input.addEventListener("focus", () => rememberInput(input));
  rememberInput(input);
  bindOperatorButtons(workspaceEl, input);

  input.focus();
}

function checkLevelThreeAnswer() {
  if (solved) return;

  const input = document.getElementById("simplify-answer-input");
  const value = input.value.trim();
  if (!value) return;

  if (areEquivalent(value, currentTask.final)) {
    showResult();
  } else {
    input.value = "";
    blink([input]);
    streak = 0;
    updateHud();
    setFeedback("");
  }
}

function updateStepHint() {}

function blink(elements) {
  elements.filter(Boolean).forEach((element) => {
    element.classList.remove("simplify-wrong");
    void element.offsetWidth;
    element.classList.add("simplify-wrong");
  });
}

function chooseLevel(level) {
  currentLevel = level;
  updateHud();
  showTask();
}

function resetGame() {
  currentLevel = null;
  currentTask = null;
  expectedStep = 0;
  selectedRule = null;
  selectedFragment = null;
  solved = false;
  taskEl.textContent = "Wähle ein Level.";
  workspaceEl.innerHTML = "";
  resultEl.classList.add("simplify-result--hidden");
  finalEl.textContent = "";
  setFeedback("");
  updateHud();
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => chooseLevel(Number(button.dataset.level)));
});

newTaskBtn.addEventListener("click", () => {
  if (!currentLevel) {
    setFeedback("");
    return;
  }
  showTask();
});

showAnswerBtn.addEventListener("click", showAnswer);

resetBtn.addEventListener("click", resetGame);

resetGame();

