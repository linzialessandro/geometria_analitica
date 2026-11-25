/**
 * parser.js
 * Robust parser for Italian analytic geometry notation:
 * - Rationals: 2, -3, 1/2, -1/3, 0,5
 * - Radicals: √10, 2√5, 10/√5, 2*sqrt(5), sqrt(20)
 * - Points: A(1;2), P(-3; 1), (5/2; 3), 1;2
 * - Lines: y=2x-1, y=-1/2x+3, y=4, x=2, 3x-y-7=0, x+2y-2=0, y-2=3(x-1)
 * - Equivalence checker for Exercise mode.
 */
(function (root) {
  'use strict';

  const M = (typeof module !== 'undefined' && module.exports)
    ? require('./math-exact.js')
    : root.GraphCalc;

  const { Rational, Radical, gcdBigInt, lcmBigInt, absBigInt } = M;

  function normalizeUnicode(str) {
    return String(str || '')
      .replace(/\u2212|\u2013|\u2014/g, '-') // minus/en-dash/em-dash -> -
      .replace(/\u00d7|\u00b7/g, '*')       // × · -> *
      .replace(/\u00f7/g, '/')              // ÷ -> /
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse a rational number: "2", "-3", "1/2", "-1/3", "0,5", "-2.25", "(3/2)"
   */
  function parseRational(input) {
    if (input instanceof Rational) return input;
    if (typeof input === 'number') return Rational.fromNumber(input);
    let s = normalizeUnicode(input).replace(/\s+/g, '');
    if (!s) throw new Error('Numero vuoto');
    // Strip outer parentheses if balanced
    while (s.startsWith('(') && s.endsWith(')')) {
      const inner = s.slice(1, -1);
      if (isBalanced(inner)) s = inner;
      else break;
    }
    // Fraction a/b
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length !== 2) throw new Error(`Frazione non valida: ${input}`);
      const num = parseSimpleDecimalOrInt(parts[0]);
      const den = parseSimpleDecimalOrInt(parts[1]);
      return num.div(den);
    }
    return parseSimpleDecimalOrInt(s);
  }

  function parseSimpleDecimalOrInt(s) {
    if (!s) throw new Error('Numero mancante');
    // Allow Italian comma or dot
    const clean = s.replace(',', '.');
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(clean)) {
      throw new Error(`Numero non valido: ${s}`);
    }
    if (!clean.includes('.')) {
      return new Rational(BigInt(clean), 1n);
    }
    const neg = clean.startsWith('-');
    const unsigned = clean.replace(/^[+-]/, '');
    const [intPart, decPart] = unsigned.split('.');
    const den = 10n ** BigInt(decPart.length);
    const num = BigInt((intPart || '0') + decPart);
    return new Rational(neg ? -num : num, den);
  }

  function isBalanced(s) {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth < 0) return false;
      }
    }
    return depth === 0;
  }

  /**
   * Parse a quadratic radical expression such as:
   * "2√5", "10/√5", "sqrt(10)", "2*sqrt(5)", "√5/2", "(3√2)/4", "-√8", "5/2", "3"
   */
  function parseRadical(input) {
    if (input instanceof Radical) return input;
    if (input instanceof Rational) return new Radical(input, 1n);
    let s = normalizeUnicode(input).replace(/\s+/g, '');
    if (!s) throw new Error('Espressione vuota');

    // Replace sqrt(...) or √(...) or √digits with tokens
    // Support simple multiplicative/divisive expressions of rationals and square roots
    // Normalize `sqrt(` -> `√(` and `rad(` -> `√(`
    s = s.replace(/sqrt\(/gi, '√(').replace(/rad\(/gi, '√(');

    // Handle leading sign
    let sign = 1;
    if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
    else if (s.startsWith('+')) { s = s.slice(1); }

    // Tokenize factors separated by * or / (respecting parentheses)
    const factors = [];
    let currentOp = '*';
    let i = 0;
    while (i < s.length) {
      if (s[i] === '*') {
        currentOp = '*';
        i++;
        continue;
      }
      if (s[i] === '/') {
        currentOp = '/';
        i++;
        continue;
      }
      if (s[i] === '√') {
        i++;
        let argStr = '';
        if (s[i] === '(') {
          const end = findMatchingParen(s, i);
          if (end === -1) throw new Error('Parentesi non chiusa');
          argStr = s.slice(i + 1, end);
          i = end + 1;
        } else {
          const m = s.slice(i).match(/^(\d+([,.]\d+)?)/);
          if (!m) throw new Error(`Radicando non valido in ${input}`);
          argStr = m[1];
          i += m[1].length;
        }
        const argRat = parseRational(argStr);
        const radVal = Radical.sqrtOfRational(argRat);
        factors.push({ op: currentOp, val: radVal });
        currentOp = '*';
        continue;
      }
      if (s[i] === '(') {
        const end = findMatchingParen(s, i);
        if (end === -1) throw new Error('Parentesi non chiusa');
        const inner = s.slice(i + 1, end);
        const innerVal = parseRadical(inner);
        factors.push({ op: currentOp, val: innerVal });
        i = end + 1;
        currentOp = '*';
        continue;
      }
      // Number
      const m = s.slice(i).match(/^(\d+([,.]\d+)?)/);
      if (m) {
        const rat = parseSimpleDecimalOrInt(m[1]);
        factors.push({ op: currentOp, val: new Radical(rat, 1n) });
        i += m[1].length;
        currentOp = '*';
        continue;
      }
      throw new Error(`Carattere non valido "${s[i]}" in "${input}"`);
    }

    if (factors.length === 0) throw new Error(`Espressione non valida: ${input}`);
    let acc = Radical.ONE;
    for (const f of factors) {
      acc = f.op === '*' ? acc.mul(f.val) : acc.div(f.val);
    }
    return sign < 0 ? acc.neg() : acc;
  }

  function findMatchingParen(s, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  /**
   * Parse a point in Italian notation:
   * "A(1;2)", "P(-3; 1)", "(5/2; 3)", "1;2", "M(1; 3/2)"
   */
  function parsePoint(input, defaultLabel) {
    const s = normalizeUnicode(input);
    if (!s) throw new Error('Punto vuoto');
    let label = defaultLabel || '';
    let body = s;

    const m = s.match(/^([A-Za-z][A-Za-z0-9_']*)\s*\((.*)\)$/);
    if (m) {
      label = m[1];
      body = m[2];
    } else if (s.startsWith('(') && s.endsWith(')')) {
      body = s.slice(1, -1);
    }

    let parts = body.split(';');
    if (parts.length !== 2) {
      // Fallback: if no semicolon, allow comma ONLY if neither side looks like an Italian decimal
      // e.g. "1, 2" (with space) or two integers "1,2" only if comma count is 1 and not decimal
      const commaParts = body.split(',');
      if (commaParts.length === 2 && !body.includes(';')) {
        parts = commaParts;
      } else {
        throw new Error(`Usa il punto e virgola tra le coordinate, es. P(1; 2): "${input}"`);
      }
    }
    const x = parseRational(parts[0]);
    const y = parseRational(parts[1]);
    return { label, x, y };
  }

  /**
   * Parse a linear expression in x and y into { a, b, c } (all Rationals) representing a*x + b*y + c.
   * Supports terms like: 2x, -1/2x, -x/2, 3/4 y, -(x-1), 2(x-3), -1/2(x-5), 5
   */
  function parseLinearExpr(exprStr) {
    let s = normalizeUnicode(exprStr).replace(/\s+/g, '');
    if (!s) throw new Error('Espressione vuota');

    let a = Rational.ZERO;
    let b = Rational.ZERO;
    let c = Rational.ZERO;

    let i = 0;
    while (i < s.length) {
      let sign = 1;
      if (s[i] === '+') { i++; }
      else if (s[i] === '-') { sign = -1; i++; }

      // Parse coefficient (optional number/fraction)
      let hasCoef = false;
      let coef = Rational.ONE;

      const numMatch = s.slice(i).match(/^(\d+(?:[,.]\d+)?(?:\/\d+(?:[,.]\d+)?)?)/);
      if (numMatch) {
        coef = parseRational(numMatch[1]);
        i += numMatch[1].length;
        hasCoef = true;
      }

      if (sign < 0) coef = coef.neg();

      // Optional explicit multiplication *
      if (s[i] === '*') i++;

      // Case 1: parenthesized sub-expression, e.g. -1/2(x-5) or -(x+2)
      if (s[i] === '(') {
        const end = findMatchingParen(s, i);
        if (end === -1) throw new Error('Parentesi non chiusa nella retta');
        const sub = parseLinearExpr(s.slice(i + 1, end));
        i = end + 1;
        // Optional division after parenthesis: (x-5)/2
        let divRat = Rational.ONE;
        if (s[i] === '/') {
          i++;
          const dm = s.slice(i).match(/^(\d+(?:[,.]\d+)?)/);
          if (!dm) throw new Error('Denominatore non valido');
          divRat = parseSimpleDecimalOrInt(dm[1]);
          i += dm[1].length;
        }
        const factor = coef.div(divRat);
        a = a.add(sub.a.mul(factor));
        b = b.add(sub.b.mul(factor));
        c = c.add(sub.c.mul(factor));
        continue;
      }

      // Case 2: variable x or y
      if (s[i] === 'x' || s[i] === 'X' || s[i] === 'y' || s[i] === 'Y') {
        const v = s[i].toLowerCase();
        i++;
        // Optional /d after variable, e.g., x/2 or -3x/4
        if (s[i] === '/') {
          i++;
          const dm = s.slice(i).match(/^(\d+(?:[,.]\d+)?)/);
          if (!dm) throw new Error('Denominatore non valido');
          coef = coef.div(parseSimpleDecimalOrInt(dm[1]));
          i += dm[1].length;
        }
        if (v === 'x') a = a.add(coef);
        else b = b.add(coef);
        continue;
      }

      // Case 3: pure constant term
      if (hasCoef) {
        c = c.add(coef);
        continue;
      }

      throw new Error(`Termine non riconosciuto in "${exprStr}" vicino a "${s.slice(i)}"`);
    }

    return { a, b, c };
  }

  /**
   * Canonical integer form ax + by + c = 0 with gcd(|a|,|b|,|c|)=1 and (a>0 or (a==0 and b>0)).
   */
  function normalizeLineCoefficients(aRat, bRat, cRat) {
    aRat = Rational.of(aRat);
    bRat = Rational.of(bRat);
    cRat = Rational.of(cRat);
    if (aRat.isZero() && bRat.isZero()) {
      throw new Error('Equazione non valida: i coefficienti di x e y sono entrambi zero');
    }
    const commonDen = lcmBigInt(lcmBigInt(aRat.d, bRat.d), cRat.d);
    let a = aRat.n * (commonDen / aRat.d);
    let b = bRat.n * (commonDen / bRat.d);
    let c = cRat.n * (commonDen / cRat.d);

    const g = gcdBigInt(gcdBigInt(a, b), c);
    if (g > 1n) {
      a /= g;
      b /= g;
      c /= g;
    }
    if (a < 0n || (a === 0n && b < 0n)) {
      a = -a;
      b = -b;
      c = -c;
    }
    return { a, b, c };
  }

  /**
   * Parse any line equation:
   * - explicit: y=2x-1, y=-1/2x+3, y=4
   * - vertical: x=2
   * - implicit: 3x-y-7=0, x+2y-2=0, x+y=7
   * - point-slope: y-2=-1/2(x-5)
   * Also ignores optional prefix like "r:" or "s: "
   */
  function parseLine(input) {
    let s = normalizeUnicode(input);
    if (!s) throw new Error('Equazione della retta vuota');
    // Strip optional label prefix like "r:" or "r_1:"
    s = s.replace(/^[A-Za-z][A-Za-z0-9_']*\s*:\s*/, '');

    const eqParts = s.split('=');
    if (eqParts.length !== 2) {
      throw new Error(`Inserisci un'equazione con "=", es. y=2x-1 oppure 3x-y-7=0`);
    }
    const left = parseLinearExpr(eqParts[0]);
    const right = parseLinearExpr(eqParts[1]);

    const aRat = left.a.sub(right.a);
    const bRat = left.b.sub(right.b);
    const cRat = left.c.sub(right.c);

    return normalizeLineCoefficients(aRat, bRat, cRat);
  }

  /**
   * Equivalence checker for Exercise mode.
   * Accepts equivalent algebraic forms:
   * - line: y=2x-8 === 2x-y-8=0 === y-0=2(x-4)
   * - radical: 10/√5 === 2√5 === √20
   * - point: (2;4) === 2;4 === H(2; 4)
   * - slope: rational or "non esiste" for vertical lines
   * - boolean: sì/si/appartiene/allineati vs no/non appartiene/non allineati
   * - relation: parallele / perpendicolari / incidenti / coincidenti / nessuna
   */
  function checkAnswerEquivalence(expected, userInput, type) {
    const raw = normalizeUnicode(userInput);
    if (!raw) return { ok: false, reason: 'Inserisci una risposta prima di controllare.' };

    try {
      if (type === 'rational') {
        const exp = Rational.of(expected);
        const got = parseRational(raw);
        return { ok: exp.eq(got) };
      }
      if (type === 'radical') {
        const exp = Radical.of(expected);
        const got = parseRadical(raw);
        return { ok: exp.eq(got) };
      }
      if (type === 'point') {
        const got = parsePoint(raw);
        return { ok: Rational.of(expected.x).eq(got.x) && Rational.of(expected.y).eq(got.y) };
      }
      if (type === 'line') {
        const expNorm = expected.a !== undefined && typeof expected.a === 'bigint'
          ? normalizeLineCoefficients(expected.a, expected.b, expected.c)
          : parseLine(expected);
        const gotNorm = parseLine(raw);
        return { ok: expNorm.a === gotNorm.a && expNorm.b === gotNorm.b && expNorm.c === gotNorm.c };
      }
      if (type === 'slope') {
        if (expected === null || expected === undefined || expected === 'none') {
          const low = raw.toLowerCase();
          const ok = /non\s*esist|indefinit|vertical|nessun|impossibil|n\.e\./i.test(low);
          return { ok };
        }
        const exp = Rational.of(expected);
        const got = parseRational(raw.replace(/^m\s*=\s*/i, ''));
        return { ok: exp.eq(got) };
      }
      if (type === 'boolean') {
        const low = raw.toLowerCase();
        const isYes = /^(s[iì]|yes|vero|v|appartiene|allineati|isoscele|ok)$/i.test(low);
        const isNo = /^(no|n|falso|f|non\s*appartiene|non\s*allineati|non\s*isoscele)$/i.test(low);
        if (!isYes && !isNo) {
          return { ok: false, reason: 'Rispondi "sì" oppure "no".' };
        }
        return { ok: Boolean(expected) === isYes };
      }
      if (type === 'relation') {
        const low = raw.toLowerCase();
        let norm = low;
        if (/parallel|\|\||∥/.test(low)) norm = 'parallele';
        else if (/perpendicol|perp|⊥/.test(low)) norm = 'perpendicolari';
        else if (/coincident/.test(low)) norm = 'coincidenti';
        else if (/incident/.test(low)) norm = 'incidenti';
        else if (/nessun|n[eé]/.test(low)) norm = 'nessuna';
        return { ok: norm === expected };
      }
    } catch (err) {
      return { ok: false, reason: err.message };
    }
    return { ok: false, reason: 'Tipo di risposta non riconosciuto.' };
  }

  const exportsObj = {
    normalizeUnicode,
    parseRational,
    parseRadical,
    parsePoint,
    parseLinearExpr,
    normalizeLineCoefficients,
    parseLine,
    checkAnswerEquivalence
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
