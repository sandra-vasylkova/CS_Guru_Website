const modeSelect = document.querySelector("#mode-select");
const baseSelect = document.querySelector("#base-select");
const numberInput = document.querySelector("#number-input");
const clearBtn = document.querySelector("#clear-btn");
const convertBtn = document.querySelector("#convert-btn");
const errorMessage = document.querySelector("#error-message");
const resultBlock = document.querySelector("#result-block");
const resultMain = document.querySelector("#result-main");
const resultBase = document.querySelector("#result-base");
const numberLabel = document.querySelector("#number-label");
const baseLabel = document.querySelector("#base-label");

const DIGITS = "0123456789ABCDEF";
const DIGIT_MAP = Object.fromEntries([...DIGITS].map((digit, index) => [digit, BigInt(index)]));

function fromDecimal(value, base) {
  if (!/^[0-9]+$/.test(value)) return null;

  let number = BigInt(value);
  const targetBase = BigInt(base);

  if (number === 0n) return "0";

  const result = [];
  while (number > 0n) {
    const remainder = Number(number % targetBase);
    result.push(DIGITS[remainder]);
    number = number / targetBase;
  }

  return result.reverse().join("");
}

function toDecimal(value, base) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;

  let result = 0n;
  const sourceBase = BigInt(base);

  for (const char of normalized) {
    const digit = DIGIT_MAP[char];
    if (digit === undefined || digit >= sourceBase) return null;
    result = result * sourceBase + digit;
  }

  return result.toString();
}

function clearError() {
  errorMessage.textContent = "";
}

function hideResult() {
  resultMain.textContent = "";
  resultBase.textContent = "";
  resultBlock.classList.add("decimal-result-block--hidden");
}

function showError(message) {
  hideResult();
  errorMessage.textContent = message;
}

function renderResult(result, base) {
  resultMain.textContent = result;
  resultBase.textContent = base;
  resultBlock.classList.remove("decimal-result-block--hidden");
}

function updateModeText() {
  const mode = modeSelect.value;

  if (mode === "from-decimal") {
    numberLabel.textContent = "Dezimalzahl eingeben";
    baseLabel.textContent = "Zielbasis";
    numberInput.placeholder = "z.B. 42";
    if (!numberInput.value.trim()) numberInput.value = "42";
  } else {
    numberLabel.textContent = "Zahl eingeben";
    baseLabel.textContent = "Ausgangsbasis";
    numberInput.placeholder = "z.B. 101010";
    if (numberInput.value.trim() === "42") numberInput.value = "101010";
  }

  clearError();
  hideResult();
}

function runConversion() {
  try {
    const mode = modeSelect.value;
    const base = Number(baseSelect.value);
    const input = numberInput.value.trim();

    if (!input) {
      throw new Error("Gib zuerst eine Zahl ein.");
    }

    let result = null;
    let outputBase = "";

    if (mode === "from-decimal") {
      result = fromDecimal(input, base);
      outputBase = String(base);

      if (result === null) {
        throw new Error("Gib eine gültige nicht-negative Dezimalzahl ein.");
      }
    } else {
      result = toDecimal(input, base);
      outputBase = "10";

      if (result === null) {
        throw new Error(`Diese Zahl ist im Zahlensystem zur Basis ${base} nicht gültig.`);
      }
    }

    clearError();
    renderResult(result, outputBase);
  } catch (error) {
    showError(error.message);
  }
}

function clearInput() {
  numberInput.value = "";
  clearError();
  hideResult();
  numberInput.focus();
}

modeSelect?.addEventListener("change", updateModeText);
baseSelect?.addEventListener("change", () => {
  clearError();
  hideResult();
});

numberInput?.addEventListener("input", () => {
  clearError();
  hideResult();
});

numberInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runConversion();
  }
});

convertBtn?.addEventListener("click", runConversion);
clearBtn?.addEventListener("click", clearInput);

updateModeText();
hideResult();
