const BASE_LABELS = {
  2: "Binär",
  8: "Oktal",
  16: "Hexadezimal",
};

const ALLOWED_BASES = [2, 8, 16];
const DIGITS = "0123456789ABCDEF";

const fromBaseSelect = document.querySelector("#from-base");
const toBaseSelect = document.querySelector("#to-base");
const numberInput = document.querySelector("#number-input");
const resultBlock = document.querySelector("#result-block");
const resultMain = document.querySelector("#result-main");
const errorMessage = document.querySelector("#error-message");
const convertBtn = document.querySelector("#convert-btn");
const clearBtn = document.querySelector("#clear-btn");

function stripVisualSubscripts(value) {
  return value.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, "");
}

function normalizeInput(value, base) {
  let normalized = stripVisualSubscripts(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toUpperCase();

  if (base === 2 && normalized.startsWith("0B"))
    normalized = normalized.slice(2);
  if (base === 8 && normalized.startsWith("0O"))
    normalized = normalized.slice(2);
  if (base === 16 && normalized.startsWith("0X"))
    normalized = normalized.slice(2);

  return normalized;
}

function isAllowedBase(base) {
  return ALLOWED_BASES.includes(Number(base));
}

function hasValidDigits(value, base) {
  if (!value) return false;

  return [...value].every((char) => {
    const digit = DIGITS.indexOf(char);
    return digit >= 0 && digit < base;
  });
}

function toDecimalBigInt(value, base) {
  let result = 0n;
  const bigBase = BigInt(base);

  for (const char of value) {
    result = result * bigBase + BigInt(DIGITS.indexOf(char));
  }

  return result;
}

function fromDecimalBigInt(decimalValue, base) {
  if (decimalValue === 0n) return "0";

  let value = decimalValue;
  const bigBase = BigInt(base);
  let result = "";

  while (value > 0n) {
    const remainder = Number(value % bigBase);
    result = DIGITS[remainder] + result;
    value = value / bigBase;
  }

  return result;
}

function convertNumber(value, fromBase, toBase) {
  fromBase = Number(fromBase);
  toBase = Number(toBase);

  if (!isAllowedBase(fromBase) || !isAllowedBase(toBase)) {
    throw new Error("Nur die Basen 2, 8 und 16 werden unterstützt.");
  }

  const normalized = normalizeInput(value, fromBase);

  if (!hasValidDigits(normalized, fromBase)) {
    throw new Error(
      `Ungültige Zahl für ${BASE_LABELS[fromBase]} (${fromBase}).`,
    );
  }

  const decimalValue = toDecimalBigInt(normalized, fromBase);
  return fromDecimalBigInt(decimalValue, toBase);
}

function clearError() {
  errorMessage.textContent = "";
}

function hideResult() {
  resultMain.textContent = "";
  resultBlock.classList.add("tool-result-block--hidden");
}

function showError(message) {
  hideResult();
  errorMessage.textContent = message;
}

function renderResult(result, base) {
  resultMain.textContent = result;
  resultBlock.classList.remove("tool-result-block--hidden");
}

function runConversion() {
  try {
    const result = convertNumber(
      numberInput.value,
      Number(fromBaseSelect.value),
      Number(toBaseSelect.value),
    );

    clearError();
    renderResult(result, Number(toBaseSelect.value));
  } catch (error) {
    showError(error.message);
  }
}

function resetOutput() {
  clearError();
  hideResult();
}

function clearInput() {
  numberInput.value = "";
  resetOutput();
  numberInput.focus();
}

convertBtn?.addEventListener("click", runConversion);
numberInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runConversion();
  }
});
clearBtn?.addEventListener("click", clearInput);
numberInput?.addEventListener("input", resetOutput);
fromBaseSelect?.addEventListener("change", resetOutput);
toBaseSelect?.addEventListener("change", resetOutput);

resetOutput();
