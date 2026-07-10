const boardEl = document.getElementById("lava-board");
const answerBubbleEl = document.getElementById("answer-bubble");
const lavaFloorEl = document.querySelector(".lava-floor");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const livesEl = document.getElementById("lives");
const speedLabelEl = document.getElementById("speed-label");
const inputEl = document.getElementById("answer-input");
const feedbackEl = document.getElementById("feedback");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

const MAX_LIVES = 3;
const BLOCK_WIDTH = 94;
const BLOCK_HEIGHT = 68;
const ANSWER_OFFSET = 10;
const STARTING_BLOCKS = 5;
const MIN_VERTICAL_GAP = 118;

let blocks = [];
let score = 0;
let streak = 0;
let lives = MAX_LIVES;
let running = false;
let paused = false;
let lastTime = 0;
let spawnTimer = 0;
let nextId = 1;
let animationId = null;
let lastExponent = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomXPercent() {
  return randomInt(13, 87);
}

function currentLevel() {
  return Math.min(7, 1 + Math.floor(score / 90));
}

function currentSpeed() {
  return Math.min(76, 20 + currentLevel() * 3.5 + streak * 0.9);
}

function currentSpawnInterval() {
  return Math.max(1600, 3600 - currentLevel() * 170 - streak * 24);
}

function exponentRange() {
  const max = Math.min(10, 8 + Math.floor(score / 90) + Math.floor(streak / 7));
  const min = score > 160 ? 2 : 0;
  return [min, max];
}

function getActiveBlock() {
  if (!blocks.length) return null;
  return blocks.reduce(
    (lowest, block) => (block.y > lowest.y ? block : lowest),
    blocks[0],
  );
}

function getNextSpawnY() {
  if (!blocks.length) return -BLOCK_HEIGHT;

  const highestBlock = blocks.reduce(
    (highest, block) => (block.y < highest.y ? block : highest),
    blocks[0],
  );

  return Math.min(-BLOCK_HEIGHT, highestBlock.y - MIN_VERTICAL_GAP);
}

function createBlock(y = getNextSpawnY()) {
  const [minN, maxN] = exponentRange();
  let n = randomInt(minN, maxN);

  if (maxN > minN && n === lastExponent) {
    n = n === maxN ? n - 1 : n + 1;
  }

  lastExponent = n;

  const el = document.createElement("div");
  el.className = "lava-block";
  el.innerHTML = `<span class="lava-block__base">2</span><sup>${n}</sup>`;
  el.dataset.id = String(nextId);
  boardEl.appendChild(el);

  const block = {
    id: nextId,
    n,
    answer: 2 ** n,
    y,
    x: randomXPercent(),
    el,
  };

  nextId += 1;
  blocks.push(block);
  renderBlock(block);
  updateActiveBlock();
}

function renderBlock(block) {
  block.el.style.left = `${block.x}%`;
  block.el.style.top = `${block.y}px`;
}

function getLavaTop() {
  return lavaFloorEl ? lavaFloorEl.offsetTop : boardEl.clientHeight;
}

function positionAnswerBubble(active) {
  if (!active || !running || paused) {
    answerBubbleEl.classList.add("lava-answer-bubble--hidden");
    return;
  }

  answerBubbleEl.style.left = `${active.x}%`;
  answerBubbleEl.style.top = `${active.y + BLOCK_HEIGHT + ANSWER_OFFSET}px`;
  answerBubbleEl.classList.remove("lava-answer-bubble--hidden");
}

function updateActiveBlock() {
  const active = getActiveBlock();

  blocks.forEach((block) => {
    block.el.classList.toggle("lava-block--active", active?.id === block.id);
  });

  positionAnswerBubble(active);
}

function updateHud() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  livesEl.textContent = lives;
  speedLabelEl.textContent = `Tempo ${currentLevel()}`;
}

function setFeedback(text, type = "") {
  feedbackEl.textContent = text;
  feedbackEl.className = "lava-feedback";
  if (type) feedbackEl.classList.add(`lava-feedback--${type}`);
}

function removeBlock(block, solved = false) {
  blocks = blocks.filter((item) => item.id !== block.id);

  if (solved) {
    block.el.classList.add("lava-block--solved");
    window.setTimeout(() => block.el.remove(), 170);
  } else {
    block.el.remove();
  }

  updateActiveBlock();
}

function loseLife(reason) {
  lives -= 1;
  streak = 0;
  inputEl.value = "";
  updateHud();

  if (lives <= 0) {
    endGame(reason);
  } else {
    setFeedback(reason, "error");
  }
}

function acceptCorrectAnswer(active) {
  score += 10 + Math.min(streak, 10);
  streak += 1;
  inputEl.value = "";
  removeBlock(active, true);
  updateHud();

  while (blocks.length < STARTING_BLOCKS) {
    createBlock();
  }

  inputEl.focus();
}

function tryAutoAcceptAnswer() {
  if (!running || paused) return;

  const active = getActiveBlock();
  if (!active) return;

  const value = inputEl.value.trim();
  if (!value) return;

  const expected = String(active.answer);
  if (Number(value) === active.answer && value.length >= expected.length) {
    acceptCorrectAnswer(active);
  }
}

function submitAnswer() {
  if (!running || paused) {
    if (!running) startGame();
    return;
  }

  const active = getActiveBlock();
  if (!active) return;

  const value = inputEl.value.trim();
  if (!value) return;

  if (Number(value) === active.answer) {
    acceptCorrectAnswer(active);
  } else {
    inputEl.value = "";
    active.el.classList.remove("lava-block--wrong");
    void active.el.offsetWidth;
    active.el.classList.add("lava-block--wrong");
    loseLife(`Falsch. Richtig wäre ${active.answer}.`);
  }
}

function tick(time) {
  if (!running) return;

  if (!lastTime) lastTime = time;
  const delta = Math.min(0.04, (time - lastTime) / 1000);
  lastTime = time;

  if (!paused) {
    const lavaTop = getLavaTop();
    const speed = currentSpeed();

    spawnTimer += delta * 1000;
    if (spawnTimer >= currentSpawnInterval() && blocks.length < 8) {
      spawnTimer = 0;
      createBlock();
    }

    [...blocks].forEach((block) => {
      block.y += speed * delta;
      renderBlock(block);

      // Lose a life the moment the block first touches the visible red lava area.
      if (block.y + BLOCK_HEIGHT >= lavaTop) {
        removeBlock(block, false);
        loseLife(`Zu langsam. ${block.answer} wäre richtig gewesen.`);
      }
    });

    updateActiveBlock();
  }

  animationId = requestAnimationFrame(tick);
}

function startGame() {
  if (running && paused) {
    paused = false;
    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = false;
    setFeedback("Weiter.");
    inputEl.focus();
    updateActiveBlock();
    return;
  }

  if (running) return;

  resetState();
  running = true;
  paused = false;
  pauseBtn.disabled = false;
  setFeedback("Tippe das Ergebnis.");

  createBlock(18);
  for (let i = 1; i < STARTING_BLOCKS; i += 1) {
    createBlock(18 - i * MIN_VERTICAL_GAP);
  }

  inputEl.focus();
  animationId = requestAnimationFrame(tick);
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Weiter" : "Pause";
  setFeedback(paused ? "Pause." : "Weiter.");
  updateActiveBlock();
  inputEl.focus();
}

function endGame(reason) {
  running = false;
  paused = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";
  setFeedback(`${reason} Spiel vorbei. Punkte: ${score}.`, "error");
  answerBubbleEl.classList.add("lava-answer-bubble--hidden");

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function clearBlocks() {
  blocks.forEach((block) => block.el.remove());
  blocks = [];
}

function resetState() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  clearBlocks();
  score = 0;
  streak = 0;
  lives = MAX_LIVES;
  running = false;
  paused = false;
  lastTime = 0;
  spawnTimer = 0;
  nextId = 1;
  lastExponent = null;
  inputEl.value = "";
  pauseBtn.textContent = "Pause";
  pauseBtn.disabled = true;
  answerBubbleEl.classList.add("lava-answer-bubble--hidden");
  setFeedback("Drücke Start.");
  updateHud();
}

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitAnswer();
  }
});

inputEl.addEventListener("input", () => {
  inputEl.value = inputEl.value.replace(/[^0-9]/g, "");
  tryAutoAcceptAnswer();
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetState);
window.addEventListener("resize", updateActiveBlock);

resetState();
