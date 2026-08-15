const levelButtons = [...document.querySelectorAll(".circuit-level-btn")];
const scoreEl = document.getElementById("circuit-score");
const streakEl = document.getElementById("circuit-streak");
const modeEl = document.getElementById("circuit-mode");
const expressionEl = document.getElementById("circuit-expression");
const truthTableEl = document.getElementById("circuit-truth-table");
const workspaceEl = document.getElementById("circuit-workspace");
const answerEl = document.getElementById("circuit-answer");
const answerContentEl = document.getElementById("circuit-answer-content");
const feedbackEl = document.getElementById("circuit-feedback");
const checkBtn = document.getElementById("circuit-check");
const showAnswerBtn = document.getElementById("circuit-show-answer");
const newTaskBtn = document.getElementById("circuit-new-task");

const GATE_LABELS = {
  AND: "&",
  OR: "≥1",
  NOT: "1",
};

const TASKS = [
  {
    expression: "(A ∧ B) ∨ C",
    ast: or(and(v("A"), v("B")), v("C")),
    variables: ["A", "B", "C"],
    gates: [
      { id: "g1", type: "AND", x: 45, y: 26, inputs: ["A", "B"] },
      { id: "g2", type: "OR", x: 71, y: 40, inputs: ["g1", "C"], output: true },
    ],
  },
  {
    expression: "A ∧ ¬B",
    ast: and(v("A"), not(v("B"))),
    variables: ["A", "B"],
    gates: [
      { id: "g1", type: "NOT", x: 43, y: 48, inputs: ["B"] },
      {
        id: "g2",
        type: "AND",
        x: 70,
        y: 34,
        inputs: ["A", "g1"],
        output: true,
      },
    ],
  },
  {
    expression: "¬A ∨ B",
    ast: or(not(v("A")), v("B")),
    variables: ["A", "B"],
    gates: [
      { id: "g1", type: "NOT", x: 43, y: 24, inputs: ["A"] },
      { id: "g2", type: "OR", x: 70, y: 39, inputs: ["g1", "B"], output: true },
    ],
  },
  {
    expression: "¬(A ∨ B)",
    ast: not(or(v("A"), v("B"))),
    variables: ["A", "B"],
    gates: [
      { id: "g1", type: "OR", x: 43, y: 36, inputs: ["A", "B"] },
      { id: "g2", type: "NOT", x: 70, y: 36, inputs: ["g1"], output: true },
    ],
  },
  {
    expression: "(A ∨ B) ∧ ¬C",
    ast: and(or(v("A"), v("B")), not(v("C"))),
    variables: ["A", "B", "C"],
    gates: [
      { id: "g1", type: "OR", x: 43, y: 25, inputs: ["A", "B"] },
      { id: "g2", type: "NOT", x: 43, y: 62, inputs: ["C"] },
      {
        id: "g3",
        type: "AND",
        x: 71,
        y: 43,
        inputs: ["g1", "g2"],
        output: true,
      },
    ],
  },
  {
    expression: "(A ∧ B) ∨ ¬C",
    ast: or(and(v("A"), v("B")), not(v("C"))),
    variables: ["A", "B", "C"],
    gates: [
      { id: "g1", type: "AND", x: 43, y: 25, inputs: ["A", "B"] },
      { id: "g2", type: "NOT", x: 43, y: 62, inputs: ["C"] },
      {
        id: "g3",
        type: "OR",
        x: 71,
        y: 43,
        inputs: ["g1", "g2"],
        output: true,
      },
    ],
  },
  {
    expression: "¬(A ∧ B) ∨ C",
    ast: or(not(and(v("A"), v("B"))), v("C")),
    variables: ["A", "B", "C"],
    gates: [
      { id: "g1", type: "AND", x: 38, y: 28, inputs: ["A", "B"] },
      { id: "g2", type: "NOT", x: 58, y: 28, inputs: ["g1"] },
      { id: "g3", type: "OR", x: 76, y: 44, inputs: ["g2", "C"], output: true },
    ],
  },
  {
    expression: "(A ∨ ¬B) ∧ C",
    ast: and(or(v("A"), not(v("B"))), v("C")),
    variables: ["A", "B", "C"],
    gates: [
      { id: "g1", type: "NOT", x: 38, y: 43, inputs: ["B"] },
      { id: "g2", type: "OR", x: 58, y: 28, inputs: ["A", "g1"] },
      {
        id: "g3",
        type: "AND",
        x: 76,
        y: 48,
        inputs: ["g2", "C"],
        output: true,
      },
    ],
  },
];

let score = 0;
let streak = 0;
let currentLevel = null;
let currentTask = null;
let lastTaskIndex = -1;
let solved = false;
let levelOnePlaced = new Map();
let builderGates = [];
let builderConnections = [];
let builderCounter = 0;
let wireDrag = null;

function v(name) {
  return { type: "VAR", name };
}
function and(left, right) {
  return { type: "AND", left, right };
}
function or(left, right) {
  return { type: "OR", left, right };
}
function not(input) {
  return { type: "NOT", input };
}

function evalAst(ast, assignment) {
  if (!ast) return false;
  if (ast.type === "VAR") return Boolean(assignment[ast.name]);
  if (ast.type === "NOT") return !evalAst(ast.input, assignment);
  if (ast.type === "AND")
    return evalAst(ast.left, assignment) && evalAst(ast.right, assignment);
  if (ast.type === "OR")
    return evalAst(ast.left, assignment) || evalAst(ast.right, assignment);
  return false;
}

function astToText(ast) {
  if (!ast) return "";
  if (ast.type === "VAR") return ast.name;
  if (ast.type === "NOT") {
    const input =
      ast.input.type === "VAR"
        ? astToText(ast.input)
        : `(${astToText(ast.input)})`;
    return `¬${input}`;
  }
  const sign = ast.type === "AND" ? "∧" : "∨";
  return `(${astToText(ast.left)} ${sign} ${astToText(ast.right)})`;
}

function makeTruthRows(task) {
  const rows = [];
  const total = 2 ** task.variables.length;
  for (let mask = 0; mask < total; mask += 1) {
    const assignment = {};
    task.variables.forEach((variable, index) => {
      assignment[variable] = (mask >> (task.variables.length - 1 - index)) & 1;
    });
    rows.push({ assignment, result: evalAst(task.ast, assignment) ? 1 : 0 });
  }
  return rows;
}

function renderTruthTable(task) {
  if (truthTableEl) truthTableEl.innerHTML = "";
}

function updateHud() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  modeEl.textContent = currentLevel
    ? `Level ${currentLevel}`
    : "Kein Level gewählt";
  checkBtn.disabled = !currentLevel || solved;

  levelButtons.forEach((button) => {
    button.classList.toggle(
      "circuit-level-btn--active",
      Number(button.dataset.level) === currentLevel,
    );
  });
}

function setFeedback(text = "", type = "") {
  feedbackEl.textContent = text;
  feedbackEl.className = "circuit-feedback";
  if (type) feedbackEl.classList.add(`circuit-feedback--${type}`);
}

function pickTask() {
  let nextIndex = Math.floor(Math.random() * TASKS.length);
  if (TASKS.length > 1 && nextIndex === lastTaskIndex)
    nextIndex = (nextIndex + 1) % TASKS.length;
  lastTaskIndex = nextIndex;
  currentTask = TASKS[nextIndex];
}

function showTask() {
  pickTask();
  solved = false;
  levelOnePlaced = new Map();
  builderGates = [];
  builderConnections = [];
  builderCounter = 0;
  wireDrag = null;

  expressionEl.textContent = currentTask.expression;
  renderTruthTable(currentTask);
  answerEl.classList.add("circuit-answer--hidden");
  answerContentEl.innerHTML = "";
  workspaceEl.classList.remove("circuit-workspace--hidden");
  setFeedback();

  if (currentLevel === 1) renderLevelOne();
  if (currentLevel === 2) renderLevelTwo();
  updateHud();
}

function renderGateSymbol(type) {
  if (type === "NOT") {
    return `<span class="circuit-not-symbol">1</span>`;
  }
  return `<span>${GATE_LABELS[type]}</span>`;
}

function renderPalette(extraClass = "") {
  const blockTypes = ["AND", "OR", "NOT"];
  const repeat = 1;
  return `
    <div class="circuit-palette ${extraClass}">
      ${Array.from({ length: repeat })
        .flatMap(() => blockTypes)
        .map(
          (type) => `
            <button class="circuit-gate-card circuit-gate-card--${type.toLowerCase()}" type="button" draggable="true" data-gate-type="${type}">
              ${renderGateSymbol(type)}
              <small>${type}</small>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

const CIRCUIT_VIEWBOX = {
  width: 1000,
  height: 460,
  variableTop: 58,
  variableBottom: 400,
  variableStartX: 105,
  variableGap: 86,
  outputX: 940,
};

function gateHalfWidth(gateOrType) {
  const type = typeof gateOrType === "string" ? gateOrType : gateOrType.type;
  return type === "NOT" ? 36 : 52;
}

function notBubbleInputOffset(gate) {
  return gate.type === "NOT" ? 1 : 0;
}

function percentX(value) {
  return (value / 100) * CIRCUIT_VIEWBOX.width;
}

function percentY(value) {
  return (value / 100) * CIRCUIT_VIEWBOX.height;
}

function variableX(variable) {
  const index = currentTask.variables.indexOf(variable);
  return CIRCUIT_VIEWBOX.variableStartX + index * CIRCUIT_VIEWBOX.variableGap;
}

function gateCenter(gate) {
  return {
    x: percentX(gate.x),
    y: percentY(gate.y),
  };
}

function sourcePosition(source, fallbackY) {
  const gate = currentTask.gates.find((item) => item.id === source);
  if (gate) {
    const center = gateCenter(gate);
    return { x: center.x + gateHalfWidth(gate), y: center.y };
  }

  return { x: variableX(source), y: fallbackY };
}

function inputPosition(gate, inputIndex) {
  const center = gateCenter(gate);
  let offset = 0;

  if (gate.type !== "NOT") {
    offset = inputIndex === 0 ? -17 : 17;
  }

  return {
    x: center.x - gateHalfWidth(gate) - notBubbleInputOffset(gate),
    y: center.y + offset,
  };
}

function circuitPath(from, to) {
  const middleX = from.x + Math.max(48, (to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} H ${middleX} V ${to.y} H ${to.x}`;
}

function drawLevelOneSvg() {
  const wires = [];
  const dots = [];
  const labels = [];

  currentTask.variables.forEach((variable) => {
    const x = variableX(variable);
    labels.push(
      `<text x="${x}" y="42" class="circuit-svg-label" text-anchor="middle">${variable}</text>`,
    );
    wires.push(
      `<line x1="${x}" y1="${CIRCUIT_VIEWBOX.variableTop}" x2="${x}" y2="${CIRCUIT_VIEWBOX.variableBottom}" class="circuit-wire circuit-wire--variable" />`,
    );
  });

  currentTask.gates.forEach((gate) => {
    gate.inputs.forEach((source, inputIndex) => {
      const to = inputPosition(gate, inputIndex);
      const from = sourcePosition(source, to.y);
      wires.push(`<path d="${circuitPath(from, to)}" class="circuit-wire" />`);
      if (currentTask.variables.includes(source)) {
        dots.push(
          `<circle cx="${from.x}" cy="${from.y}" r="5.5" class="circuit-dot" />`,
        );
      }
    });
  });

  const outputGate =
    currentTask.gates.find((gate) => gate.output) ||
    currentTask.gates[currentTask.gates.length - 1];
  const out = sourcePosition(outputGate.id, percentY(outputGate.y));
  wires.push(
    `<line x1="${out.x}" y1="${out.y}" x2="${CIRCUIT_VIEWBOX.outputX}" y2="${out.y}" class="circuit-wire" />`,
  );
  labels.push(
    `<text x="${CIRCUIT_VIEWBOX.outputX + 18}" y="${out.y + 7}" class="circuit-svg-label">Y</text>`,
  );

  return `
    <svg class="circuit-svg" viewBox="0 0 ${CIRCUIT_VIEWBOX.width} ${CIRCUIT_VIEWBOX.height}" preserveAspectRatio="none" aria-hidden="true">
      ${wires.join("")}
      ${dots.join("")}
      ${labels.join("")}
    </svg>
  `;
}

function renderLevelOne() {
  workspaceEl.innerHTML = `
    <div class="circuit-level-one">
      ${renderPalette()}
      <div class="circuit-board circuit-board--slots">
        ${drawLevelOneSvg()}
        ${currentTask.gates
          .map(
            (gate) => `
              <div class="circuit-slot circuit-slot--${gate.type.toLowerCase()}" data-slot-id="${gate.id}" data-expected="${gate.type}" style="left:${gate.x}%;top:${gate.y}%">
                <span></span>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;

  workspaceEl.querySelectorAll(".circuit-gate-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.gateType);
      event.dataTransfer.effectAllowed = "copy";
    });
  });

  workspaceEl.querySelectorAll(".circuit-slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      placeLevelOneGate(slot, event.dataTransfer.getData("text/plain"));
    });
  });
}

function placeLevelOneGate(slot, type) {
  if (solved || !type || slot.classList.contains("circuit-slot--locked"))
    return;

  const expected = slot.dataset.expected;
  if (type !== expected) {
    blink(slot);
    return;
  }

  slot.classList.add("circuit-slot--locked");
  slot.innerHTML = `<div class="circuit-gate-card circuit-gate-card--locked circuit-gate-card--${type.toLowerCase()}">${renderGateSymbol(type)}<small>${type}</small></div>`;
  levelOnePlaced.set(slot.dataset.slotId, type);

  // Level 1 is checked only when the user presses Prüfen.
}

function renderLevelTwo() {
  workspaceEl.innerHTML = `
    <div class="circuit-level-two">
      ${renderPalette("circuit-builder-palette")}
      <div id="circuit-builder-board" class="circuit-board circuit-builder-board">
        <svg id="circuit-wire-layer" class="circuit-wire-layer"></svg>
        <div class="circuit-builder-vars">
          ${currentTask.variables
            .map(
              (variable) => `
                <div class="circuit-node circuit-var-node" data-node="${variable}" style="top:${18 + currentTask.variables.indexOf(variable) * 25}%">
                  <strong>${variable}</strong>
                  <span class="circuit-terminal circuit-terminal--out" data-node="${variable}" data-port="out"></span>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="circuit-output-node" data-node="Y">
          <span class="circuit-terminal circuit-terminal--in" data-node="Y" data-port="in"></span>
          <strong>Y</strong>
        </div>
      </div>
    </div>
  `;

  const board = document.getElementById("circuit-builder-board");

  workspaceEl.querySelectorAll(".circuit-gate-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.gateType);
      event.dataTransfer.effectAllowed = "copy";
    });
  });

  board.addEventListener("dragover", (event) => event.preventDefault());
  board.addEventListener("drop", (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("text/plain");
    if (!type) return;
    const rect = board.getBoundingClientRect();
    addBuilderGate(type, event.clientX - rect.left, event.clientY - rect.top);
  });

  registerTerminalEvents();
}

function addBuilderGate(type, x, y) {
  const board = document.getElementById("circuit-builder-board");
  const id = `gate_${builderCounter++}`;
  const gate = { id, type, x, y };
  builderGates.push(gate);

  const element = document.createElement("div");
  element.className = "circuit-builder-gate";
  element.dataset.node = id;
  element.dataset.type = type;
  element.style.left = `${Math.max(130, Math.min(x - 48, board.clientWidth - 170))}px`;
  element.style.top = `${Math.max(28, Math.min(y - 34, board.clientHeight - 92))}px`;
  element.innerHTML = gateHtml(id, type);
  board.appendChild(element);
  makeGateMovable(element);
  registerTerminalEvents();
}

function gateHtml(id, type) {
  const inputs = type === "NOT" ? ["in"] : ["in1", "in2"];
  return `
    <div class="circuit-builder-gate-inner">
      <div class="circuit-gate-inputs">
        ${inputs
          .map(
            (port) =>
              `<span class="circuit-terminal circuit-terminal--in" data-node="${id}" data-port="${port}"></span>`,
          )
          .join("")}
      </div>
      <div class="circuit-gate-face">${renderGateSymbol(type)}</div>
      <span class="circuit-terminal circuit-terminal--out" data-node="${id}" data-port="out"></span>
    </div>
  `;
}

function makeGateMovable(gateEl) {
  let moving = false;
  let startX = 0;
  let startY = 0;
  let originalX = 0;
  let originalY = 0;

  gateEl.addEventListener("pointerdown", (event) => {
    if (event.target.classList.contains("circuit-terminal")) return;
    moving = true;
    gateEl.setPointerCapture(event.pointerId);
    startX = event.clientX;
    startY = event.clientY;
    originalX = parseFloat(gateEl.style.left) || 0;
    originalY = parseFloat(gateEl.style.top) || 0;
  });

  gateEl.addEventListener("pointermove", (event) => {
    if (!moving) return;
    const board = document.getElementById("circuit-builder-board");
    const nextX = Math.max(
      130,
      Math.min(originalX + event.clientX - startX, board.clientWidth - 170),
    );
    const nextY = Math.max(
      20,
      Math.min(originalY + event.clientY - startY, board.clientHeight - 92),
    );
    gateEl.style.left = `${nextX}px`;
    gateEl.style.top = `${nextY}px`;
    renderBuilderWires();
  });

  gateEl.addEventListener("pointerup", (event) => {
    moving = false;
    try {
      gateEl.releasePointerCapture(event.pointerId);
    } catch {}
  });
}

function registerTerminalEvents() {
  workspaceEl.querySelectorAll(".circuit-terminal").forEach((terminal) => {
    if (terminal.dataset.ready === "1") return;
    terminal.dataset.ready = "1";
    terminal.addEventListener("pointerdown", startWireDrag);
    terminal.addEventListener("dblclick", () =>
      removeConnectionsForTerminal(terminal),
    );
  });
}

function startWireDrag(event) {
  if (currentLevel !== 2 || solved) return;
  event.preventDefault();
  event.stopPropagation();

  const startTerminal = event.currentTarget;
  const startInfo = terminalInfo(startTerminal);

  if (startInfo.port !== "out") {
    removeConnectionsForTerminal(startTerminal);
    return;
  }

  const board = document.getElementById("circuit-builder-board");
  board.setPointerCapture(event.pointerId);
  wireDrag = {
    pointerId: event.pointerId,
    start: startInfo,
    startEl: startTerminal,
    x: event.clientX,
    y: event.clientY,
  };
  board.addEventListener("pointermove", moveWireDrag);
  board.addEventListener("pointerup", endWireDrag);
  startTerminal.classList.add("circuit-terminal--active");
  renderBuilderWires(event.clientX, event.clientY);
}

function moveWireDrag(event) {
  if (!wireDrag || event.pointerId !== wireDrag.pointerId) return;
  wireDrag.x = event.clientX;
  wireDrag.y = event.clientY;
  renderBuilderWires(event.clientX, event.clientY);
}

function endWireDrag(event) {
  if (!wireDrag || event.pointerId !== wireDrag.pointerId) return;

  const board = document.getElementById("circuit-builder-board");
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const targetTerminal = target?.closest?.(".circuit-terminal");

  if (targetTerminal)
    addConnection(wireDrag.start, terminalInfo(targetTerminal));

  wireDrag.startEl.classList.remove("circuit-terminal--active");
  wireDrag = null;
  board.removeEventListener("pointermove", moveWireDrag);
  board.removeEventListener("pointerup", endWireDrag);
  try {
    board.releasePointerCapture(event.pointerId);
  } catch {}
  renderBuilderWires();
  updateTerminalState();
}

function terminalInfo(el) {
  return { node: el.dataset.node, port: el.dataset.port };
}

function addConnection(from, to) {
  if (!from || !to || from.node === to.node) return;
  if (from.port !== "out" || to.port === "out") return;

  builderConnections = builderConnections.filter(
    (connection) =>
      !(connection.toNode === to.node && connection.toPort === to.port),
  );
  builderConnections.push({
    fromNode: from.node,
    fromPort: from.port,
    toNode: to.node,
    toPort: to.port,
  });
}

function removeConnectionsForTerminal(terminal) {
  const info = terminalInfo(terminal);
  builderConnections = builderConnections.filter(
    (connection) =>
      !(connection.toNode === info.node && connection.toPort === info.port) &&
      !(connection.fromNode === info.node && connection.fromPort === info.port),
  );
  renderBuilderWires();
  updateTerminalState();
}

function terminalPoint(info) {
  const board = document.getElementById("circuit-builder-board");
  const terminal = workspaceEl.querySelector(
    `.circuit-terminal[data-node="${info.node}"][data-port="${info.port}"]`,
  );
  if (!board || !terminal) return { x: 0, y: 0 };
  const boardRect = board.getBoundingClientRect();
  const terminalRect = terminal.getBoundingClientRect();
  return {
    x: terminalRect.left + terminalRect.width / 2 - boardRect.left,
    y: terminalRect.top + terminalRect.height / 2 - boardRect.top,
  };
}

function clientPoint(clientX, clientY) {
  const board = document.getElementById("circuit-builder-board");
  const rect = board.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function renderBuilderWires(tempX, tempY) {
  const layer = document.getElementById("circuit-wire-layer");
  if (!layer) return;

  const paths = builderConnections.map((connection) => {
    const from = terminalPoint({
      node: connection.fromNode,
      port: connection.fromPort,
    });
    const to = terminalPoint({
      node: connection.toNode,
      port: connection.toPort,
    });
    return wirePath(from, to, "circuit-connection-wire");
  });

  if (wireDrag && tempX != null && tempY != null) {
    const from = terminalPoint(wireDrag.start);
    const to = clientPoint(tempX, tempY);
    paths.push(
      wirePath(
        from,
        to,
        "circuit-connection-wire circuit-connection-wire--temp",
      ),
    );
  }

  layer.innerHTML = paths.join("");
}

function wirePath(from, to, className) {
  const mid = from.x + Math.max(30, Math.abs(to.x - from.x) / 2);
  return `<path d="M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}" class="${className}" />`;
}

function updateTerminalState() {
  workspaceEl.querySelectorAll(".circuit-terminal").forEach((terminal) => {
    const info = terminalInfo(terminal);
    const connected = builderConnections.some(
      (connection) =>
        (connection.fromNode === info.node &&
          connection.fromPort === info.port) ||
        (connection.toNode === info.node && connection.toPort === info.port),
    );
    terminal.classList.toggle("circuit-terminal--connected", connected);
  });
}

function astFromBuilder() {
  const outputConnection = builderConnections.find(
    (connection) => connection.toNode === "Y" && connection.toPort === "in",
  );
  if (!outputConnection) return null;
  return astFromNode(outputConnection.fromNode, new Set());
}

function astFromNode(node, visiting) {
  if (currentTask.variables.includes(node)) return v(node);
  if (visiting.has(node)) return null;

  const gateEl = workspaceEl.querySelector(
    `.circuit-builder-gate[data-node="${node}"]`,
  );
  if (!gateEl) return null;

  visiting.add(node);
  const type = gateEl.dataset.type;
  const inputPorts = type === "NOT" ? ["in"] : ["in1", "in2"];
  const inputAsts = inputPorts.map((port) => {
    const connection = builderConnections.find(
      (item) => item.toNode === node && item.toPort === port,
    );
    return connection ? astFromNode(connection.fromNode, visiting) : null;
  });
  visiting.delete(node);

  if (inputAsts.some((item) => !item)) return null;
  if (type === "NOT") return not(inputAsts[0]);
  if (type === "AND") return and(inputAsts[0], inputAsts[1]);
  if (type === "OR") return or(inputAsts[0], inputAsts[1]);
  return null;
}

function equivalentToTask(ast) {
  if (!ast) return false;
  const variables = currentTask.variables;
  for (let mask = 0; mask < 2 ** variables.length; mask += 1) {
    const assignment = {};
    variables.forEach((variable, index) => {
      assignment[variable] = (mask >> index) & 1;
    });
    if (evalAst(ast, assignment) !== evalAst(currentTask.ast, assignment))
      return false;
  }
  return true;
}

function checkAnswer() {
  if (!currentLevel || !currentTask || solved) return;

  if (currentLevel === 1) {
    if (levelOnePlaced.size === currentTask.gates.length) solve(true);
    else blink(workspaceEl.querySelector(".circuit-board"));
    return;
  }

  const ast = astFromBuilder();
  if (equivalentToTask(ast)) {
    solve(true);
  } else {
    blink(document.getElementById("circuit-builder-board"));
    streak = 0;
    updateHud();
  }
}

function showCorrectMessage() {
  answerEl.classList.remove("circuit-answer--hidden");
  answerContentEl.innerHTML = `<div class="circuit-correct-message">Richtig!</div>`;
}

function solve(addScore) {
  solved = true;
  if (addScore) {
    score +=
      currentLevel === 1
        ? 20 + Math.min(streak, 10)
        : 35 + Math.min(streak, 10);
    streak += 1;
  }
  if (currentLevel === 1 && addScore) {
    showCorrectMessage();
  } else {
    showAnswer();
  }
  workspaceEl.classList.add("circuit-workspace--hidden");
  updateHud();
}

function showAnswer() {
  if (!currentTask) return;
  answerEl.classList.remove("circuit-answer--hidden");
  answerContentEl.innerHTML = `
    <h2>Antwort</h2>
    ${currentLevel === 1 ? "" : `<div class="circuit-answer-expression">Y = ${currentTask.expression}</div>`}
    <div class="circuit-mini-answer-board">
      ${drawLevelOneSvg()}
      ${currentTask.gates
        .map(
          (gate) => `
            <div class="circuit-slot circuit-slot--answer circuit-slot--${gate.type.toLowerCase()}" style="left:${gate.x}%;top:${gate.y}%">
              <div class="circuit-gate-card circuit-gate-card--locked circuit-gate-card--${gate.type.toLowerCase()}">${renderGateSymbol(gate.type)}<small>${gate.type}</small></div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function blink(element) {
  if (!element) return;
  element.classList.remove("circuit-wrong");
  void element.offsetWidth;
  element.classList.add("circuit-wrong");
}

function chooseLevel(level) {
  currentLevel = level;
  showTask();
}

function resetCurrent() {
  if (!currentLevel || !currentTask) {
    resetGame();
    return;
  }
  solved = false;
  levelOnePlaced = new Map();
  builderGates = [];
  builderConnections = [];
  answerEl.classList.add("circuit-answer--hidden");
  answerContentEl.innerHTML = "";
  workspaceEl.classList.remove("circuit-workspace--hidden");
  setFeedback();
  if (currentLevel === 1) renderLevelOne();
  if (currentLevel === 2) renderLevelTwo();
  updateHud();
}

function resetGame() {
  currentLevel = null;
  currentTask = null;
  solved = false;
  expressionEl.textContent = "Wähle ein Level.";
  if (truthTableEl) truthTableEl.innerHTML = "";
  workspaceEl.innerHTML = "";
  workspaceEl.classList.remove("circuit-workspace--hidden");
  answerEl.classList.add("circuit-answer--hidden");
  answerContentEl.innerHTML = "";
  setFeedback();
  updateHud();
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () =>
    chooseLevel(Number(button.dataset.level)),
  );
});

checkBtn.addEventListener("click", checkAnswer);
showAnswerBtn.addEventListener("click", showAnswer);
newTaskBtn.addEventListener("click", () => {
  if (!currentLevel) return;
  showTask();
});

resetGame();
