const DIGITS = "0123456789ABCDEF";

const taskEl = document.querySelector("#task");
const scoreEl = document.querySelector("#score");
const streakEl = document.querySelector("#streak");
const modeLabel = document.querySelector("#mode-label");
const group3Btn = document.querySelector("#group-3-btn");
const group4Btn = document.querySelector("#group-4-btn");
const newTaskBtn = document.querySelector("#new-task-btn");
const workspace = document.querySelector("#workspace");
const draggablesEl = document.querySelector("#draggables");
const targetsTitle = document.querySelector("#targets-title");
const targetsEl = document.querySelector("#targets");
const resultBlock = document.querySelector("#result-block");
const answerEl = document.querySelector("#answer");
const feedbackEl = document.querySelector("#feedback");

let currentTask = null;
let score = 0;
let streak = 0;
let selectedGroupId = null;
let draggedGroupId = null;
let wrongAttemptedGroups = new Set();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function binaryToDigit(bits) {
  return DIGITS[parseInt(bits, 2)];
}

function digitToBits(digit, size) {
  return parseInt(digit, 16).toString(2).padStart(size, "0");
}

function baseName(base) {
  if (base === 2) return "Binär";
  if (base === 8) return "Oktal";
  return "Hex";
}

function uniqueValues(count, max, firstMin = 1) {
  const values = [];
  while (values.length < count) {
    const min = values.length === 0 ? firstMin : 0;
    const value = randomInt(min, max);
    if (!values.includes(value)) values.push(value);
  }
  return values;
}

function generateFromBinaryTask(targetBase) {
  const groupSize = targetBase === 16 ? 4 : 3;
  const groupCount = randomInt(3, 4);
  const max = targetBase - 1;
  const firstMin = 2 ** (groupSize - 1);
  const values = uniqueValues(groupCount, max, firstMin);
  const pieces = values.map((value, index) => {
    const bits = value.toString(2).padStart(groupSize, "0");
    return {
      id: `g-${index}`,
      index,
      bits,
      digit: DIGITS[value],
      locked: false,
    };
  });

  return {
    direction: "fromBinary",
    sourceBase: 2,
    targetBase,
    groupSize,
    pieces,
    source: pieces.map((piece) => piece.bits).join(""),
    answer: pieces.map((piece) => piece.digit).join(""),
  };
}

function generateToBinaryTask(sourceBase) {
  const groupSize = sourceBase === 16 ? 4 : 3;
  const groupCount = randomInt(3, 4);
  const max = sourceBase - 1;
  const values = uniqueValues(groupCount, max);
  const pieces = values.map((value, index) => {
    const digit = DIGITS[value];
    return {
      id: `g-${index}`,
      index,
      bits: digitToBits(digit, groupSize),
      digit,
      locked: false,
    };
  });

  return {
    direction: "toBinary",
    sourceBase,
    targetBase: 2,
    groupSize,
    pieces,
    source: pieces.map((piece) => piece.digit).join(""),
    answer: pieces.map((piece) => piece.bits).join(" "),
  };
}

function generateTask() {
  const variants = [
    () => generateFromBinaryTask(16),
    () => generateFromBinaryTask(8),
    () => generateToBinaryTask(16),
    () => generateToBinaryTask(8),
  ];

  return variants[randomInt(0, variants.length - 1)]();
}

function setFeedback(message, type = "") {
  feedbackEl.textContent = "";
  feedbackEl.className = `conversion-feedback ${type}`.trim();
}

function updateScore() {
  scoreEl.textContent = String(score);
  streakEl.textContent = String(streak);
}

function renderTaskHeader() {
  taskEl.classList.toggle("conversion-task--long", currentTask.source.length >= 10);
  taskEl.classList.toggle("conversion-task--very-long", currentTask.source.length >= 14);

  const source = `<span class="conversion-source"><span>${currentTask.source}</span><sub>${currentTask.sourceBase}</sub></span>`;
  const target = `<span class="conversion-unknown">?<sub>${currentTask.targetBase}</sub></span>`;
  taskEl.innerHTML = `${source}<span class="conversion-arrow">→</span>${target}`;

  modeLabel.textContent = `${baseName(currentTask.sourceBase)} → ${baseName(currentTask.targetBase)}`;
}

function resetWorkspace() {
  workspace.classList.add("conversion-workspace--hidden");
  resultBlock.classList.add("conversion-result--hidden");
  answerEl.textContent = "";
  draggablesEl.innerHTML = "";
  targetsEl.innerHTML = "";
  selectedGroupId = null;
  draggedGroupId = null;
  wrongAttemptedGroups = new Set();
  group3Btn.disabled = false;
  group4Btn.disabled = false;
  group3Btn.classList.remove("conversion-btn--active");
  group4Btn.classList.remove("conversion-btn--active");
}

function newTask() {
  currentTask = generateTask();
  resetWorkspace();
  renderTaskHeader();
  setFeedback("Wähle zuerst 3er- oder 4er-Gruppen.");
}

function groupButton(size) {
  return size === 3 ? group3Btn : group4Btn;
}

function renderDraggables() {
  const pieces = currentTask.direction === "fromBinary"
    ? currentTask.pieces
    : shuffle(currentTask.pieces);

  draggablesEl.innerHTML = "";

  pieces.forEach((piece) => {
    const card = document.createElement("div");
    card.className = "conversion-group";
    card.id = `group-${piece.id}`;
    card.draggable = true;
    card.dataset.groupId = piece.id;
    card.dataset.bits = piece.bits;
    card.textContent = piece.bits;

    card.addEventListener("dragstart", (event) => {
      if (piece.locked) {
        event.preventDefault();
        return;
      }
      draggedGroupId = piece.id;
      event.dataTransfer.setData("text/plain", piece.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("conversion-group--ghost");
    });

    card.addEventListener("dragend", () => {
      draggedGroupId = null;
      card.classList.remove("conversion-group--ghost");
    });

    card.addEventListener("click", () => selectGroup(piece.id));
    draggablesEl.appendChild(card);
  });
}

function targetOrder() {
  if (currentTask.direction === "fromBinary") return shuffle(currentTask.pieces);
  return currentTask.pieces;
}

function renderTargets() {
  targetsTitle.textContent = currentTask.direction === "fromBinary"
    ? "Ziffern / Buchstaben"
    : "Ziffern aus der Aufgabe";

  targetsEl.innerHTML = "";

  targetOrder().forEach((piece) => {
    const target = document.createElement("div");
    target.className = "conversion-target";
    target.dataset.targetId = piece.id;
    target.dataset.expectedBits = piece.bits;

    target.innerHTML = `
      <div class="conversion-target__digit">${piece.digit}</div>
      <div class="conversion-dropzone">hier ablegen</div>
    `;

    target.addEventListener("dragover", (event) => {
      if (piece.locked) return;
      event.preventDefault();
      target.classList.add("conversion-target--over");
    });

    target.addEventListener("dragleave", () => {
      target.classList.remove("conversion-target--over");
    });

    target.addEventListener("drop", (event) => {
      event.preventDefault();
      target.classList.remove("conversion-target--over");
      const groupId = event.dataTransfer.getData("text/plain") || draggedGroupId;
      tryPlace(groupId, piece.id);
    });

    target.addEventListener("click", () => {
      if (selectedGroupId) tryPlace(selectedGroupId, piece.id);
    });

    targetsEl.appendChild(target);
  });
}

function chooseGrouping(size) {
  if (!currentTask) newTask();

  if (size !== currentTask.groupSize) {
    streak = 0;
    updateScore();
    setFeedback(
      `Diese Aufgabe braucht ${currentTask.groupSize}er-Gruppen.`,
      "conversion-feedback--error",
    );
    blinkAllUnlocked();
    return;
  }

  group3Btn.disabled = true;
  group4Btn.disabled = true;
  groupButton(size).classList.add("conversion-btn--active");

  workspace.classList.remove("conversion-workspace--hidden");
  resultBlock.classList.add("conversion-result--hidden");
  setFeedback("Ziehe jede Bitgruppe unter die passende Ziffer.");
  renderDraggables();
  renderTargets();
}

function selectGroup(groupId) {
  const piece = currentTask.pieces.find((item) => item.id === groupId);
  if (!piece || piece.locked) return;

  selectedGroupId = selectedGroupId === groupId ? null : groupId;
  document.querySelectorAll(".conversion-group").forEach((el) => {
    el.classList.toggle("conversion-group--selected", el.dataset.groupId === selectedGroupId);
  });
}

function tryPlace(groupId, targetId) {
  const group = currentTask.pieces.find((piece) => piece.id === groupId);
  const targetPiece = currentTask.pieces.find((piece) => piece.id === targetId);
  const targetEl = document.querySelector(`[data-target-id="${targetId}"]`);

  if (!group || !targetPiece || !targetEl || group.locked || targetPiece.locked) return;

  if (group.bits !== targetPiece.bits) {
    wrongAttemptedGroups.add(group.id);
    selectedGroupId = null;
    document.querySelectorAll(".conversion-group").forEach((el) => {
      el.classList.remove("conversion-group--selected");
    });

    const unlocked = currentTask.pieces.filter((piece) => !piece.locked);
    if (wrongAttemptedGroups.size >= unlocked.length) {
      blinkAllUnlocked();
      wrongAttemptedGroups.clear();
      setFeedback("Alle Zuordnungen waren falsch. Versuch es nochmal.", "conversion-feedback--error");
    } else {
      blinkGroup(group.id);
      setFeedback("Passt nicht. Die Gruppe bleibt beweglich.", "conversion-feedback--error");
    }
    return;
  }

  lockGroup(group, targetPiece, targetEl);
}

function lockGroup(group, targetPiece, targetEl) {
  group.locked = true;
  targetPiece.locked = true;
  selectedGroupId = null;
  wrongAttemptedGroups.clear();

  const groupEl = document.querySelector(`#group-${group.id}`);
  const dropzone = targetEl.querySelector(".conversion-dropzone");

  if (groupEl && dropzone) {
    groupEl.classList.remove("conversion-group--selected", "conversion-group--blink");
    groupEl.classList.add("conversion-group--locked");
    groupEl.draggable = false;
    dropzone.textContent = "";
    dropzone.appendChild(groupEl);
  }

  targetEl.classList.add("conversion-target--locked");
  score += 10;
  streak += 1;
  updateScore();
  setFeedback("Richtig. Die Gruppe ist fixiert.", "conversion-feedback--success");

  if (currentTask.pieces.every((piece) => piece.locked)) {
    finishTask();
  }
}

function finishTask() {
  const formatted = currentTask.targetBase === 2
    ? `${currentTask.answer}<sub>2</sub>`
    : `${currentTask.answer}<sub>${currentTask.targetBase}</sub>`;

  answerEl.innerHTML = formatted;
  resultBlock.classList.remove("conversion-result--hidden");
  setFeedback("Alles richtig gelöst.", "conversion-feedback--success");
}

function blinkGroup(groupId) {
  const groupEl = document.querySelector(`#group-${groupId}`);
  if (!groupEl) return;
  groupEl.classList.remove("conversion-group--blink");
  void groupEl.offsetWidth;
  groupEl.classList.add("conversion-group--blink");
}

function blinkAllUnlocked() {
  currentTask?.pieces
    .filter((piece) => !piece.locked)
    .forEach((piece) => blinkGroup(piece.id));
}

group3Btn.addEventListener("click", () => chooseGrouping(3));
group4Btn.addEventListener("click", () => chooseGrouping(4));
newTaskBtn.addEventListener("click", newTask);

updateScore();
newTask();
