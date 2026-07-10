const expressionInput = document.querySelector("#expression-input");
const clearBtn = document.querySelector("#clear-btn");
const generateBtn = document.querySelector("#generate-btn");
const errorMessage = document.querySelector("#error-message");
const tableBlock = document.querySelector("#table-block");
const truthTable = document.querySelector("#truth-table");

let currentCsv = "";

const TOKEN_TYPES = {
  VAR: "VAR",
  CONST: "CONST",
  NOT: "NOT",
  AND: "AND",
  XOR: "XOR",
  OR: "OR",
  IMPLIES: "IMPLIES",
  EQUIV: "EQUIV",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  EOF: "EOF",
};

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    const two = input.slice(i, i + 2);
    const three = input.slice(i, i + 3);

    if (three === "<->" || three === "<=>") {
      tokens.push({ type: TOKEN_TYPES.EQUIV, value: "↔" });
      i += 3;
      continue;
    }

    if (two === "&&") {
      tokens.push({ type: TOKEN_TYPES.AND, value: "∧" });
      i += 2;
      continue;
    }

    if (two === "||") {
      tokens.push({ type: TOKEN_TYPES.OR, value: "∨" });
      i += 2;
      continue;
    }

    if (two === "->" || two === "=>") {
      tokens.push({ type: TOKEN_TYPES.IMPLIES, value: "→" });
      i += 2;
      continue;
    }

    if (two === "^=" || two === "!=") {
      tokens.push({ type: TOKEN_TYPES.XOR, value: "⊕" });
      i += 2;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: char });
      i++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: TOKEN_TYPES.RPAREN, value: char });
      i++;
      continue;
    }

    if (["∧", "&", "^", "⋀"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.AND, value: "∧" });
      i++;
      continue;
    }

    if (["∨", "|", "⋁"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.OR, value: "∨" });
      i++;
      continue;
    }

    if (["⊕", "⊻"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.XOR, value: "⊕" });
      i++;
      continue;
    }

    if (["↔", "⇔", "≡"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.EQUIV, value: "↔" });
      i++;
      continue;
    }

    if (["¬", "!", "~"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.NOT, value: "¬" });
      i++;
      continue;
    }

    if (["→", "⇒"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.IMPLIES, value: "→" });
      i++;
      continue;
    }

    if (char === "0" || char === "1") {
      tokens.push({ type: TOKEN_TYPES.CONST, value: Number(char) });
      i++;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      let word = "";
      while (i < input.length && /[A-Za-z]/.test(input[i])) {
        word += input[i];
        i++;
      }

      const upper = word.toUpperCase();

      if (upper === "AND" || upper === "UND") {
        tokens.push({ type: TOKEN_TYPES.AND, value: "∧" });
        continue;
      }

      if (upper === "OR" || upper === "ODER") {
        tokens.push({ type: TOKEN_TYPES.OR, value: "∨" });
        continue;
      }

      if (upper === "XOR") {
        tokens.push({ type: TOKEN_TYPES.XOR, value: "⊕" });
        continue;
      }

      if (upper === "EQUIV" || upper === "EQUIVALENT" || upper === "XNOR") {
        tokens.push({ type: TOKEN_TYPES.EQUIV, value: "↔" });
        continue;
      }

      if (upper === "NOT" || upper === "NICHT") {
        tokens.push({ type: TOKEN_TYPES.NOT, value: "¬" });
        continue;
      }

      if (word.length === 1) {
        tokens.push({ type: TOKEN_TYPES.VAR, value: upper });
        continue;
      }

      throw new Error(
        `Ungültiges Wort „${word}“. Verwende einzelne Variablen wie A, B, C.`,
      );
    }

    throw new Error(`Ungültiges Zeichen „${char}“.`);
  }

  tokens.push({ type: TOKEN_TYPES.EOF, value: null });
  return tokens;
}

function parseExpression(tokens) {
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(type) {
    if (peek().type !== type) {
      throw new Error("Der Ausdruck ist unvollständig oder falsch geklammert.");
    }
    return tokens[index++];
  }

  function parseEquivalence() {
    let left = parseImplication();

    while (peek().type === TOKEN_TYPES.EQUIV) {
      consume(TOKEN_TYPES.EQUIV);
      const right = parseImplication();
      left = { type: "equiv", left, right };
    }

    return left;
  }

  function parseImplication() {
    let left = parseOr();

    if (peek().type === TOKEN_TYPES.IMPLIES) {
      consume(TOKEN_TYPES.IMPLIES);
      const right = parseImplication();
      left = { type: "implies", left, right };
    }

    return left;
  }

  function parseOr() {
    let left = parseXor();

    while (peek().type === TOKEN_TYPES.OR) {
      consume(TOKEN_TYPES.OR);
      const right = parseXor();
      left = { type: "or", left, right };
    }

    return left;
  }

  function parseXor() {
    let left = parseAnd();

    while (peek().type === TOKEN_TYPES.XOR) {
      consume(TOKEN_TYPES.XOR);
      const right = parseAnd();
      left = { type: "xor", left, right };
    }

    return left;
  }

  function parseAnd() {
    let left = parseNot();

    while (peek().type === TOKEN_TYPES.AND) {
      consume(TOKEN_TYPES.AND);
      const right = parseNot();
      left = { type: "and", left, right };
    }

    return left;
  }

  function parseNot() {
    if (peek().type === TOKEN_TYPES.NOT) {
      consume(TOKEN_TYPES.NOT);
      return { type: "not", value: parseNot() };
    }

    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();

    if (token.type === TOKEN_TYPES.VAR) {
      consume(TOKEN_TYPES.VAR);
      return { type: "var", name: token.value };
    }

    if (token.type === TOKEN_TYPES.CONST) {
      consume(TOKEN_TYPES.CONST);
      return { type: "const", value: token.value };
    }

    if (token.type === TOKEN_TYPES.LPAREN) {
      consume(TOKEN_TYPES.LPAREN);
      const expr = parseEquivalence();
      consume(TOKEN_TYPES.RPAREN);
      return expr;
    }

    throw new Error("Der Ausdruck ist unvollständig.");
  }

  const ast = parseEquivalence();

  if (peek().type !== TOKEN_TYPES.EOF) {
    throw new Error("Der Ausdruck enthält einen unerwarteten Teil.");
  }

  return ast;
}

function collectVariables(ast, variables = new Set()) {
  if (!ast) return variables;

  if (ast.type === "var") {
    variables.add(ast.name);
    return variables;
  }

  if (ast.type === "not") {
    collectVariables(ast.value, variables);
    return variables;
  }

  if (ast.left) collectVariables(ast.left, variables);
  if (ast.right) collectVariables(ast.right, variables);

  return variables;
}

function precedence(ast) {
  if (ast.type === "equiv") return 0;
  if (ast.type === "implies") return 1;
  if (ast.type === "or") return 2;
  if (ast.type === "xor") return 3;
  if (ast.type === "and") return 4;
  if (ast.type === "not") return 5;
  return 6;
}

function astToLabel(ast, parentPrecedence = 0) {
  let label;

  if (ast.type === "var") return ast.name;
  if (ast.type === "const") return String(ast.value);

  if (ast.type === "not") {
    const inner = astToLabel(ast.value, precedence(ast));
    label = `¬${inner}`;
  }

  if (ast.type === "and") {
    label = `${astToLabel(ast.left, precedence(ast))} ∧ ${astToLabel(ast.right, precedence(ast))}`;
  }

  if (ast.type === "or") {
    label = `${astToLabel(ast.left, precedence(ast))} ∨ ${astToLabel(ast.right, precedence(ast))}`;
  }

  if (ast.type === "xor") {
    label = `${astToLabel(ast.left, precedence(ast))} ⊕ ${astToLabel(ast.right, precedence(ast))}`;
  }

  if (ast.type === "implies") {
    label = `${astToLabel(ast.left, precedence(ast))} → ${astToLabel(ast.right, precedence(ast))}`;
  }

  if (ast.type === "equiv") {
    label = `${astToLabel(ast.left, precedence(ast))} ↔ ${astToLabel(ast.right, precedence(ast))}`;
  }

  if (precedence(ast) < parentPrecedence) {
    return `(${label})`;
  }

  return label;
}

function collectSubexpressions(ast, result = [], seen = new Set()) {
  if (!ast || ast.type === "var" || ast.type === "const") return result;

  if (ast.type === "not") {
    collectSubexpressions(ast.value, result, seen);
  } else {
    collectSubexpressions(ast.left, result, seen);
    collectSubexpressions(ast.right, result, seen);
  }

  const label = astToLabel(ast);
  if (!seen.has(label)) {
    seen.add(label);
    result.push({ ast, label });
  }

  return result;
}

function evaluateAst(ast, values) {
  if (ast.type === "var") return Boolean(values[ast.name]);
  if (ast.type === "const") return Boolean(ast.value);
  if (ast.type === "not") return !evaluateAst(ast.value, values);
  if (ast.type === "and")
    return evaluateAst(ast.left, values) && evaluateAst(ast.right, values);
  if (ast.type === "or")
    return evaluateAst(ast.left, values) || evaluateAst(ast.right, values);
  if (ast.type === "xor")
    return evaluateAst(ast.left, values) !== evaluateAst(ast.right, values);
  if (ast.type === "implies")
    return !evaluateAst(ast.left, values) || evaluateAst(ast.right, values);
  if (ast.type === "equiv")
    return evaluateAst(ast.left, values) === evaluateAst(ast.right, values);

  throw new Error("Unbekannter Ausdruck.");
}

function buildCombinations(variables) {
  const rows = 2 ** variables.length;
  const combinations = [];

  for (let i = 0; i < rows; i++) {
    const values = {};

    variables.forEach((variable, index) => {
      const bit = (i >> (variables.length - 1 - index)) & 1;
      values[variable] = bit;
    });

    combinations.push(values);
  }

  return combinations;
}

function setError(message) {
  hideTable();
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

function hideTable() {
  tableBlock.classList.add("truth-table-block--hidden");
  truthTable.innerHTML = "";
  currentCsv = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTable(columns, rows) {
  const headerHtml = columns
    .map((column, index) => {
      const className =
        index === columns.length - 1
          ? ' class="truth-table__result-heading"'
          : "";
      return `<th${className}>${escapeHtml(column)}</th>`;
    })
    .join("");

  const bodyHtml = rows
    .map((row) => {
      const cells = row
        .map((cell, index) => {
          const className =
            index === row.length - 1 ? ' class="truth-table__result-cell"' : "";
          return `<td${className}>${cell}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  truthTable.innerHTML = `
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  `;

  tableBlock.classList.remove("truth-table-block--hidden");
}

function makeCsv(columns, rows) {
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    columns.map(escapeCsv).join(";"),
    ...rows.map((row) => row.map(escapeCsv).join(";")),
  ].join("\n");
}

function generateTable() {
  try {
    const input = expressionInput.value.trim();

    if (!input) {
      throw new Error("Gib zuerst einen logischen Ausdruck ein.");
    }

    const ast = parseExpression(tokenize(input));
    const variables = [...collectVariables(ast)].sort();

    if (variables.length === 0) {
      throw new Error(
        "Der Ausdruck braucht mindestens eine Variable, z. B. A oder B.",
      );
    }

    if (variables.length > 5) {
      throw new Error(
        "Maximal 5 Variablen werden unterstützt, damit die Tabelle übersichtlich bleibt.",
      );
    }

    const subexpressions = collectSubexpressions(ast);
    const combinations = buildCombinations(variables);
    const columns = [...variables, ...subexpressions.map((item) => item.label)];

    const rows = combinations.map((values) => {
      const variableValues = variables.map((variable) => values[variable]);
      const expressionValues = subexpressions.map((item) =>
        Number(evaluateAst(item.ast, values)),
      );
      return [...variableValues, ...expressionValues];
    });

    currentCsv = makeCsv(columns, rows);
    clearError();
    renderTable(columns, rows);
  } catch (error) {
    setError(error.message);
  }
}

function clearInput() {
  expressionInput.value = "";
  clearError();
  hideTable();
  expressionInput.focus();
}

generateBtn?.addEventListener("click", generateTable);
clearBtn?.addEventListener("click", clearInput);

expressionInput?.addEventListener("input", () => {
  clearError();
  hideTable();
});

expressionInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    generateTable();
  }
});

function insertAtCursor(insert) {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? expressionInput.value.length;

  expressionInput.value =
    expressionInput.value.slice(0, start) +
    insert +
    expressionInput.value.slice(end);

  const nextPosition = start + insert.length;
  expressionInput.focus();
  expressionInput.setSelectionRange(nextPosition, nextPosition);

  clearError();
  hideTable();
}

document.querySelectorAll(".operator-btn").forEach((button) => {
  button.addEventListener("click", () => {
    insertAtCursor(button.dataset.insert || "");
  });
});

hideTable();
