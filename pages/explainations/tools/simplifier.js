const expressionInput = document.querySelector("#expression-input");
const clearBtn = document.querySelector("#clear-btn");
const simplifyBtn = document.querySelector("#simplify-btn");
const errorMessage = document.querySelector("#error-message");
const resultBlock = document.querySelector("#result-block");
const resultMain = document.querySelector("#result-main");
const stepsBlock = document.querySelector("#steps-block");
const stepsList = document.querySelector("#steps-list");

let currentResult = "";

const TOKEN_TYPES = {
  VAR: "VAR",
  CONST: "CONST",
  NOT: "NOT",
  AND: "AND",
  OR: "OR",
  XOR: "XOR",
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

    if (["↔", "⇔"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.EQUIV, value: "↔" });
      i++;
      continue;
    }

    if (["⊕", "⊻"].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.XOR, value: "⊕" });
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

      if (upper === "NOT" || upper === "NICHT") {
        tokens.push({ type: TOKEN_TYPES.NOT, value: "¬" });
        continue;
      }

      if (upper === "XOR") {
        tokens.push({ type: TOKEN_TYPES.XOR, value: "⊕" });
        continue;
      }

      if (["EQUIV", "EQUIVALENT", "XNOR"].includes(upper)) {
        tokens.push({ type: TOKEN_TYPES.EQUIV, value: "↔" });
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

function cloneAst(ast) {
  if (!ast) return ast;

  if (ast.type === "var") return { type: "var", name: ast.name };
  if (ast.type === "const") return { type: "const", value: ast.value };
  if (ast.type === "not") return { type: "not", value: cloneAst(ast.value) };

  return {
    type: ast.type,
    left: cloneAst(ast.left),
    right: cloneAst(ast.right),
  };
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
  if (ast.type === "xor") return 2;
  if (ast.type === "and") return 3;
  if (ast.type === "not") return 4;
  return 5;
}

function astToLabel(ast, parentPrecedence = 0) {
  if (ast.type === "var") return ast.name;
  if (ast.type === "const") return String(ast.value);

  let label = "";

  if (ast.type === "not") {
    const inner = astToLabel(ast.value, precedence(ast));
    label = `¬${inner}`;
  }

  if (ast.type === "and") {
    label = `${astToLabel(ast.left, precedence(ast))} ∧ ${astToLabel(
      ast.right,
      precedence(ast),
    )}`;
  }

  if (ast.type === "xor") {
    label = `${astToLabel(ast.left, precedence(ast))} ⊕ ${astToLabel(
      ast.right,
      precedence(ast),
    )}`;
  }

  if (ast.type === "or") {
    label = `${astToLabel(ast.left, precedence(ast))} ∨ ${astToLabel(
      ast.right,
      precedence(ast),
    )}`;
  }

  if (ast.type === "implies") {
    label = `${astToLabel(ast.left, precedence(ast))} → ${astToLabel(
      ast.right,
      precedence(ast),
    )}`;
  }

  if (ast.type === "equiv") {
    label = `${astToLabel(ast.left, precedence(ast))} ↔ ${astToLabel(
      ast.right,
      precedence(ast),
    )}`;
  }

  if (precedence(ast) < parentPrecedence) return `(${label})`;
  return label;
}

function astKey(ast) {
  if (ast.type === "var") return `V:${ast.name}`;
  if (ast.type === "const") return `C:${ast.value}`;
  if (ast.type === "not") return `N(${astKey(ast.value)})`;

  const leftKey = astKey(ast.left);
  const rightKey = astKey(ast.right);

  if (["and", "or", "xor", "equiv"].includes(ast.type)) {
    return `${ast.type}(${[leftKey, rightKey].sort().join(",")})`;
  }

  return `${ast.type}(${leftKey},${rightKey})`;
}

function astEqual(a, b) {
  return astKey(a) === astKey(b);
}

function astComplexity(ast) {
  if (!ast) return 0;
  if (ast.type === "var" || ast.type === "const") return 1;
  if (ast.type === "not") return 1 + astComplexity(ast.value);
  return 1 + astComplexity(ast.left) + astComplexity(ast.right);
}

function isConst(ast, value) {
  return ast.type === "const" && ast.value === value;
}

function isNegationPair(a, b) {
  return (
    (a.type === "not" && astEqual(a.value, b)) ||
    (b.type === "not" && astEqual(b.value, a))
  );
}

function makeNot(value) {
  return { type: "not", value: cloneAst(value) };
}

function makeBinary(type, left, right) {
  return { type, left: cloneAst(left), right: cloneAst(right) };
}

function otherFactor(binary, common) {
  if (astEqual(binary.left, common)) return binary.right;
  if (astEqual(binary.right, common)) return binary.left;
  return null;
}

function findCommonFactor(leftBinary, rightBinary) {
  const leftFactors = [leftBinary.left, leftBinary.right];
  const rightFactors = [rightBinary.left, rightBinary.right];

  for (const leftFactor of leftFactors) {
    for (const rightFactor of rightFactors) {
      if (astEqual(leftFactor, rightFactor)) {
        return {
          common: leftFactor,
          leftRest: otherFactor(leftBinary, leftFactor),
          rightRest: otherFactor(rightBinary, rightFactor),
        };
      }
    }
  }

  return null;
}

function applyLocalLaw(ast) {
  if (ast.type === "implies") {
    return {
      ast: makeBinary("or", makeNot(ast.left), ast.right),
      law: "Implikationsgesetz",
    };
  }

  if (ast.type === "xor") {
    return {
      ast: makeBinary(
        "or",
        makeBinary("and", ast.left, makeNot(ast.right)),
        makeBinary("and", makeNot(ast.left), ast.right),
      ),
      law: "Definition des exklusiven Oder",
    };
  }

  if (ast.type === "equiv") {
    return {
      ast: makeBinary(
        "or",
        makeBinary("and", ast.left, ast.right),
        makeBinary("and", makeNot(ast.left), makeNot(ast.right)),
      ),
      law: "Äquivalenzgesetz",
    };
  }

  if (ast.type === "not") {
    const value = ast.value;

    if (value.type === "const") {
      return {
        ast: { type: "const", value: value.value ? 0 : 1 },
        law: "Negation von Konstanten",
      };
    }

    if (value.type === "not") {
      return {
        ast: cloneAst(value.value),
        law: "Doppelte Negation",
      };
    }

    if (value.type === "and") {
      return {
        ast: makeBinary("or", makeNot(value.left), makeNot(value.right)),
        law: "De Morgans Gesetz",
      };
    }

    if (value.type === "or") {
      return {
        ast: makeBinary("and", makeNot(value.left), makeNot(value.right)),
        law: "De Morgans Gesetz",
      };
    }
  }

  if (ast.type !== "and" && ast.type !== "or") {
    return null;
  }

  const left = ast.left;
  const right = ast.right;

  if (ast.type === "and") {
    if (isConst(left, 0) || isConst(right, 0)) {
      return { ast: { type: "const", value: 0 }, law: "Dominanzgesetz" };
    }

    if (isConst(left, 1)) {
      return { ast: cloneAst(right), law: "Gesetz der neutralen Elemente" };
    }

    if (isConst(right, 1)) {
      return { ast: cloneAst(left), law: "Gesetz der neutralen Elemente" };
    }

    if (astEqual(left, right)) {
      return { ast: cloneAst(left), law: "Idempotenzgesetz" };
    }

    if (isNegationPair(left, right)) {
      return { ast: { type: "const", value: 0 }, law: "Komplementgesetz" };
    }

    if (
      right.type === "or" &&
      (astEqual(left, right.left) || astEqual(left, right.right))
    ) {
      return { ast: cloneAst(left), law: "Absorptionsgesetz" };
    }

    if (
      left.type === "or" &&
      (astEqual(right, left.left) || astEqual(right, left.right))
    ) {
      return { ast: cloneAst(right), law: "Absorptionsgesetz" };
    }

    if (left.type === "or" && right.type === "or") {
      const found = findCommonFactor(left, right);

      if (found) {
        return {
          ast: makeBinary(
            "or",
            found.common,
            makeBinary("and", found.leftRest, found.rightRest),
          ),
          law: "Distributivgesetz",
        };
      }
    }
  }

  if (ast.type === "or") {
    if (isConst(left, 1) || isConst(right, 1)) {
      return { ast: { type: "const", value: 1 }, law: "Dominanzgesetz" };
    }

    if (isConst(left, 0)) {
      return { ast: cloneAst(right), law: "Gesetz der neutralen Elemente" };
    }

    if (isConst(right, 0)) {
      return { ast: cloneAst(left), law: "Gesetz der neutralen Elemente" };
    }

    if (astEqual(left, right)) {
      return { ast: cloneAst(left), law: "Idempotenzgesetz" };
    }

    if (isNegationPair(left, right)) {
      return { ast: { type: "const", value: 1 }, law: "Komplementgesetz" };
    }

    if (
      right.type === "and" &&
      (astEqual(left, right.left) || astEqual(left, right.right))
    ) {
      return { ast: cloneAst(left), law: "Absorptionsgesetz" };
    }

    if (
      left.type === "and" &&
      (astEqual(right, left.left) || astEqual(right, left.right))
    ) {
      return { ast: cloneAst(right), law: "Absorptionsgesetz" };
    }

    if (left.type === "and" && right.type === "and") {
      const found = findCommonFactor(left, right);

      if (found) {
        return {
          ast: makeBinary(
            "and",
            found.common,
            makeBinary("or", found.leftRest, found.rightRest),
          ),
          law: "Distributivgesetz",
        };
      }
    }
  }

  return null;
}

function simplifyOnce(ast) {
  const local = applyLocalLaw(ast);

  if (local && !astEqual(local.ast, ast)) {
    return local;
  }

  if (ast.type === "not") {
    const child = simplifyOnce(ast.value);

    if (child) {
      return {
        ast: { type: "not", value: child.ast },
        law: child.law,
      };
    }
  }

  if (ast.left && ast.right) {
    const leftStep = simplifyOnce(ast.left);

    if (leftStep) {
      return {
        ast: { ...cloneAst(ast), left: leftStep.ast },
        law: leftStep.law,
      };
    }

    const rightStep = simplifyOnce(ast.right);

    if (rightStep) {
      return {
        ast: { ...cloneAst(ast), right: rightStep.ast },
        law: rightStep.law,
      };
    }
  }

  return null;
}

function evaluateAst(ast, values) {
  if (ast.type === "var") return Boolean(values[ast.name]);
  if (ast.type === "const") return Boolean(ast.value);
  if (ast.type === "not") return !evaluateAst(ast.value, values);
  if (ast.type === "and")
    return evaluateAst(ast.left, values) && evaluateAst(ast.right, values);
  if (ast.type === "xor")
    return evaluateAst(ast.left, values) !== evaluateAst(ast.right, values);
  if (ast.type === "or")
    return evaluateAst(ast.left, values) || evaluateAst(ast.right, values);
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

function termsEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function termExists(list, term) {
  return list.some((item) => termsEqual(item, term));
}

function tryMerge(termA, termB) {
  if (termA.length !== termB.length) return null;

  let diffIndex = -1;

  for (let i = 0; i < termA.length; i++) {
    if ((termA[i] === "*") !== (termB[i] === "*")) return null;

    if (termA[i] !== termB[i]) {
      if (diffIndex !== -1) return null;
      diffIndex = i;
    }
  }

  if (diffIndex === -1) return null;

  const merged = [...termA];
  merged[diffIndex] = "*";
  return merged;
}

function covers(primeImplicant, minterm) {
  return primeImplicant.every(
    (value, index) => value === "*" || value === minterm[index],
  );
}

function getPrimeImplicants(terms) {
  let current = terms;

  while (true) {
    let mergedAny = false;
    const next = [];
    const used = new Set();

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const merged = tryMerge(current[i], current[j]);

        if (merged && !termExists(next, merged)) {
          next.push(merged);
          used.add(i);
          used.add(j);
          mergedAny = true;
        }
      }
    }

    current.forEach((term, index) => {
      if (!used.has(index) && !termExists(next, term)) {
        next.push(term);
      }
    });

    if (!mergedAny) break;
    current = next;
  }

  return current;
}

function selectCover(primeImplicants, minterms) {
  const coverage = minterms.map((minterm) =>
    primeImplicants.reduce(
      (acc, primeImplicant, index) =>
        covers(primeImplicant, minterm) ? [...acc, index] : acc,
      [],
    ),
  );

  const selected = new Set();

  coverage.forEach((covering) => {
    if (covering.length === 1) selected.add(covering[0]);
  });

  const covered = new Set(
    minterms.flatMap((_, index) =>
      coverage[index].some((primeIndex) => selected.has(primeIndex))
        ? [index]
        : [],
    ),
  );

  while (covered.size < minterms.length) {
    let best = -1;
    let bestCount = 0;

    primeImplicants.forEach((primeImplicant, index) => {
      if (selected.has(index)) return;

      const count = minterms.filter(
        (minterm, mintermIndex) =>
          !covered.has(mintermIndex) && covers(primeImplicant, minterm),
      ).length;

      if (count > bestCount) {
        best = index;
        bestCount = count;
      }
    });

    if (best === -1) break;

    selected.add(best);
    minterms.forEach((minterm, index) => {
      if (covers(primeImplicants[best], minterm)) covered.add(index);
    });
  }

  return [...selected].map((index) => primeImplicants[index]);
}

function formatTerm(term, variables, wrap) {
  const literals = term
    .map((value, index) => {
      if (value === "*") return null;
      return value === 1 ? variables[index] : `¬${variables[index]}`;
    })
    .filter(Boolean);

  if (literals.length === 0) return "1";
  if (literals.length === 1) return literals[0];

  const joined = literals.join(" ∧ ");
  return wrap ? `(${joined})` : joined;
}

function simplifyByTruthTable(ast, variables) {
  const combinations = buildCombinations(variables);
  const minterms = combinations
    .filter((values) => evaluateAst(ast, values))
    .map((values) => variables.map((variable) => values[variable]));

  if (minterms.length === 0) {
    return { result: "0", minterms, primeImplicants: [] };
  }

  if (minterms.length === 2 ** variables.length) {
    return { result: "1", minterms, primeImplicants: [] };
  }

  const primeImplicants = getPrimeImplicants(minterms);
  const cover = selectCover(primeImplicants, minterms);
  const needsWrap = cover.length > 1;

  const result = cover
    .sort((a, b) => {
      const aLength = a.filter((value) => value !== "*").length;
      const bLength = b.filter((value) => value !== "*").length;
      if (aLength !== bLength) return aLength - bLength;
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    })
    .map((term) => formatTerm(term, variables, needsWrap))
    .join(" ∨ ");

  return { result, minterms, primeImplicants: cover };
}

function simplifyWithLaws(ast, variables) {
  let current = cloneAst(ast);
  const steps = [{ expr: astToLabel(current), law: "" }];

  for (let i = 0; i < 60; i++) {
    const next = simplifyOnce(current);

    if (!next || astEqual(next.ast, current)) break;

    current = next.ast;
    steps.push({
      expr: astToLabel(current),
      law: next.law,
    });
  }

  let finalByLaws = astToLabel(current);
  const minimized = simplifyByTruthTable(current, variables).result;

  try {
    const minimizedAst = parseExpression(tokenize(minimized));

    if (
      minimized !== finalByLaws &&
      astComplexity(minimizedAst) < astComplexity(current)
    ) {
      steps.push({
        expr: minimized,
        law: "Minimierung über Wahrheitstabelle",
      });
      finalByLaws = minimized;
    }
  } catch {
    // Keep the law-based result if the fallback string cannot be parsed.
  }

  return {
    result: steps.at(-1).expr,
    steps,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSteps(steps) {
  stepsList.innerHTML = steps
    .map((step, index) => {
      const lawHtml = step.law
        ? `<span class="simplifier-step__law">${escapeHtml(step.law)}</span>`
        : "";

      return `
        <div class="simplifier-step">
          <span class="simplifier-step__num">${index + 1}.</span>
          <div class="simplifier-step__content">
            <span class="simplifier-step__expr">${escapeHtml(step.expr)}</span>
            ${lawHtml}
          </div>
        </div>
      `;
    })
    .join("");

  stepsBlock.classList.remove("simplifier-steps-block--hidden");
}

function clearError() {
  errorMessage.textContent = "";
}

function hideOutput() {
  currentResult = "";
  resultMain.textContent = "";
  resultBlock.classList.add("simplifier-result-block--hidden");
  stepsList.innerHTML = "";
  stepsBlock.classList.add("simplifier-steps-block--hidden");
}

function showError(message) {
  hideOutput();
  errorMessage.textContent = message;
}

function renderResult(result) {
  currentResult = result;
  resultMain.textContent = result;
  resultBlock.classList.remove("simplifier-result-block--hidden");
}

function runSimplification() {
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
        "Maximal 5 Variablen werden unterstützt, damit es übersichtlich bleibt.",
      );
    }

    const { result, steps } = simplifyWithLaws(ast, variables);

    clearError();
    renderResult(result);
    renderSteps(steps);
  } catch (error) {
    showError(error.message);
  }
}

function clearInput() {
  expressionInput.value = "";
  clearError();
  hideOutput();
  expressionInput.focus();
}

function insertAtCursor(insert) {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? expressionInput.value.length;

  expressionInput.value =
    expressionInput.value.slice(0, start) +
    insert +
    expressionInput.value.slice(end);

  expressionInput.focus();
  expressionInput.selectionStart = expressionInput.selectionEnd =
    start + insert.length;
  clearError();
  hideOutput();
}

simplifyBtn?.addEventListener("click", runSimplification);
clearBtn?.addEventListener("click", clearInput);

expressionInput?.addEventListener("input", () => {
  clearError();
  hideOutput();
});

expressionInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runSimplification();
  }
});

document.querySelectorAll(".operator-btn").forEach((button) => {
  button.addEventListener("click", () => {
    insertAtCursor(button.dataset.insert || "");
  });
});

hideOutput();
