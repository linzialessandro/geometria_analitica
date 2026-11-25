/**
 * algebra-future.js
 * "Prossimi argomenti" del programma ufficiale di terza:
 * - §4.16 Parabola: y = ax^2 + bx + c (concavità, vertice, asse, intersezioni assi, intersezione parabola-retta)
 * - §4.17 Disequazioni di secondo grado (segno del trinomio, intervalli sulla retta reale, collegamento con la parabola)
 * - §4.18 Funzioni ed equazioni esponenziali e logaritmiche (a^x, log_a(x), equazioni semplici + valore calcolatrice)
 */
(function (root) {
  'use strict';

  const M = (typeof module !== 'undefined' && module.exports)
    ? require('./math-exact.js')
    : root.GraphCalc;

  const { Rational, Radical, formatPointHTML, formatItalianDecimal } = M;

  function formatQuadraticExprHTML(a, b, c) {
    const terms = [];
    if (!a.isZero()) {
      if (a.isOne()) terms.push('x²');
      else if (a.isMinusOne()) terms.push('−x²');
      else terms.push(`${a.toHTML()}x²`);
    }
    if (!b.isZero()) {
      const absB = b.abs();
      const bStr = absB.isOne() ? 'x' : `${absB.toHTML()}x`;
      if (terms.length === 0) terms.push(b.sign() < 0 ? `−${bStr}` : bStr);
      else terms.push(b.sign() < 0 ? ` − ${bStr}` : ` + ${bStr}`);
    }
    if (!c.isZero() || terms.length === 0) {
      const absC = c.abs();
      if (terms.length === 0) terms.push(c.toHTML());
      else terms.push(c.sign() < 0 ? ` − ${absC.toHTML()}` : ` + ${absC.toHTML()}`);
    }
    return terms.join('');
  }

  /**
   * Solve a*x^2 + b*x + c = 0 exactly (rational roots when Δ is a perfect square,
   * otherwise exact quadratic radical representation).
   */
  function solveQuadratic(a, b, c) {
    a = Rational.of(a);
    b = Rational.of(b);
    c = Rational.of(c);
    if (a.isZero()) throw new Error('Il coefficiente a deve essere diverso da zero.');

    const delta = b.pow(2).sub(Rational.of(4).mul(a).mul(c));
    if (delta.sign() < 0) {
      return { delta, count: 0, roots: [] };
    }
    const twoA = Rational.of(2).mul(a);
    const negB = b.neg();

    if (delta.isZero()) {
      const x0 = negB.div(twoA);
      return {
        delta,
        count: 1,
        roots: [{ exact: x0, isRational: true, num: x0.toNumber(), html: x0.toHTML() }]
      };
    }

    const sqrtDelta = Radical.sqrtOfRational(delta);
    if (sqrtDelta.isRational()) {
      const s = sqrtDelta.coef;
      const r1 = negB.sub(s).div(twoA);
      const r2 = negB.add(s).div(twoA);
      const ordered = r1.lt(r2) ? [r1, r2] : [r2, r1];
      return {
        delta,
        count: 2,
        roots: ordered.map(r => ({ exact: r, isRational: true, num: r.toNumber(), html: r.toHTML() }))
      };
    }

    // Irrational roots: (-b ± sqrt(delta)) / (2a)
    const center = negB.div(twoA);
    const halfSpan = sqrtDelta.div(Radical.of(twoA.abs()));
    const n1 = center.toNumber() - halfSpan.toNumber();
    const n2 = center.toNumber() + halfSpan.toNumber();
    const cHTML = center.isZero() ? '' : `${center.toHTML()} `;
    const r1HTML = center.isZero() ? `−${halfSpan.toHTML()}` : `${cHTML}− ${halfSpan.toHTML()}`;
    const r2HTML = center.isZero() ? `${halfSpan.toHTML()}` : `${cHTML}+ ${halfSpan.toHTML()}`;

    return {
      delta,
      count: 2,
      roots: [
        { exact: null, isRational: false, num: n1, html: r1HTML },
        { exact: null, isRational: false, num: n2, html: r2HTML }
      ]
    };
  }

  // =========================================================================
  // 4.16 Parabola y = ax^2 + bx + c
  // =========================================================================
  function analyzeParabola(a, b, c, intersectLine) {
    a = Rational.of(a);
    b = Rational.of(b);
    c = Rational.of(c);
    if (a.isZero()) throw new Error('Per una parabola serve a ≠ 0.');

    const concavity = a.sign() > 0 ? 'verso l’alto (∪)' : 'verso il basso (∩)';
    const xV = b.neg().div(Rational.of(2).mul(a));
    const yV = a.mul(xV.pow(2)).add(b.mul(xV)).add(c);
    const vertex = { label: 'V', x: xV, y: yV };
    const yIntercept = { label: 'C', x: Rational.ZERO, y: c };

    const xIntersections = solveQuadratic(a, b, c);

    const steps = [
      {
        title: 'Equazione e concavità',
        html: `y = <strong>${formatQuadraticExprHTML(a, b, c)}</strong> &nbsp;|&nbsp; a = ${a.toHTML()} ${a.sign() > 0 ? '> 0' : '< 0'} ⇒ concavità <strong>${concavity}</strong>.`
      },
      {
        title: 'Asse di simmetria e Vertice V',
        html: `x<sub>V</sub> = −<span class="frac"><span class="num">b</span><span class="den">2a</span></span> = <strong>${xV.toHTML()}</strong> &nbsp;(asse: <strong>x = ${xV.toHTML()}</strong>)<br>y<sub>V</sub> = f(${xV.toHTML()}) = <strong>${yV.toHTML()}</strong> ⇒ <strong>${formatPointHTML(vertex, 'V')}</strong>`
      },
      {
        title: 'Intersezione con l’asse y',
        html: `Per x = 0 si ottiene y = ${c.toHTML()} ⇒ <strong>${formatPointHTML(yIntercept, 'P_y')}</strong>`
      },
      {
        title: 'Intersezioni con l’asse x (y = 0)',
        html: `Δ = b² − 4ac = <strong>${xIntersections.delta.toHTML()}</strong> ⇒ ` + (
          xIntersections.count === 0
            ? 'Δ < 0: <strong>nessuna intersezione</strong> con l’asse x.'
            : xIntersections.count === 1
            ? `Δ = 0: <strong>un solo punto</strong> (tangente): (${xIntersections.roots[0].html}; 0).`
            : `Δ > 0: <strong>due punti</strong>: (${xIntersections.roots[0].html}; 0) e (${xIntersections.roots[1].html}; 0).`
        )
      }
    ];

    let lineIntersection = null;
    if (intersectLine) {
      if (intersectLine.isVertical()) {
        const h = intersectLine.xIntercept();
        const yh = a.mul(h.pow(2)).add(b.mul(h)).add(c);
        const pt = { label: 'I', x: h, y: yh };
        lineIntersection = {
          count: 1,
          points: [{ xNum: h.toNumber(), yNum: yh.toNumber(), html: formatPointHTML(pt, 'I') }]
        };
        steps.push({
          title: 'Intersezione parabola-retta verticale',
          html: `Sostituendo x = ${h.toHTML()} nella parabola si ottiene <strong>${formatPointHTML(pt, 'I')}</strong>.`
        });
      } else {
        const m = intersectLine.slope();
        const q = intersectLine.yIntercept();
        // ax^2 + (b - m)x + (c - q) = 0
        const sol = solveQuadratic(a, b.sub(m), c.sub(q));
        const pts = sol.roots.map((r, idx) => {
          if (r.isRational) {
            const yVal = intersectLine.evalY(r.exact);
            return {
              xExact: r.exact,
              yExact: yVal,
              xNum: r.exact.toNumber(),
              yNum: yVal.toNumber(),
              html: formatPointHTML({ x: r.exact, y: yVal }, `I${idx + 1}`)
            };
          }
          const yNum = m.toNumber() * r.num + q.toNumber();
          return {
            xExact: null,
            yExact: null,
            xNum: r.num,
            yNum,
            html: `(${r.html}; ≈ ${formatItalianDecimal(yNum, 2)})`
          };
        });
        lineIntersection = { delta: sol.delta, count: sol.count, points: pts };
        const posLabel = sol.count === 0 ? 'esterna (0 punti)'
          : sol.count === 1 ? 'tangente (1 punto)' : 'secante (2 punti)';
        steps.push({
          title: 'Intersezione parabola-retta',
          html: `Sistema con ${intersectLine.toExplicitHTML()}: Δ = <strong>${sol.delta.toHTML()}</strong> ⇒ retta <strong>${posLabel}</strong>` +
            (pts.length > 0 ? `: ${pts.map(p => `<strong>${p.html}</strong>`).join(' e ')}` : '.')
        });
      }
    }

    return {
      a, b, c,
      concavity,
      vertex,
      axisX: xV,
      yIntercept,
      xIntersections,
      lineIntersection,
      steps
    };
  }

  // =========================================================================
  // 4.17 Disequazioni di secondo grado: ax^2 + bx + c (> | >= | < | <=) 0
  // =========================================================================
  function solveQuadraticInequality(a, b, c, op) {
    // op: '>', '>=', '<', '<='
    a = Rational.of(a);
    b = Rational.of(b);
    c = Rational.of(c);
    if (a.isZero()) throw new Error('Per una disequazione di 2° grado serve a ≠ 0.');

    const sol = solveQuadratic(a, b, c);
    const strict = op === '>' || op === '<';
    const wantPositive = op === '>' || op === '>=';
    const aPos = a.sign() > 0;
    // External intervals have the same sign as a
    const wantExternal = (wantPositive && aPos) || (!wantPositive && !aPos);

    let intervals = []; // { from: number|-Infinity, to: number|Infinity, incFrom: bool, incTo: bool }
    let solutionHTML = '';
    let summary = '';

    if (sol.count === 0) {
      if (wantExternal) {
        intervals = [{ from: -Infinity, to: Infinity, incFrom: false, incTo: false }];
        solutionHTML = '∀ x ∈ ℝ (ogni numero reale)';
        summary = 'Sempre verificata';
      } else {
        intervals = [];
        solutionHTML = 'Nessuna soluzione (impossibile)';
        summary = 'Mai verificata';
      }
    } else if (sol.count === 1) {
      const r0 = sol.roots[0];
      if (wantExternal) {
        if (strict) {
          intervals = [
            { from: -Infinity, to: r0.num, incFrom: false, incTo: false },
            { from: r0.num, to: Infinity, incFrom: false, incTo: false }
          ];
          solutionHTML = `x ≠ ${r0.html}`;
          summary = 'Ogni reale tranne la radice';
        } else {
          intervals = [{ from: -Infinity, to: Infinity, incFrom: false, incTo: false }];
          solutionHTML = '∀ x ∈ ℝ (ogni numero reale)';
          summary = 'Sempre verificata';
        }
      } else {
        if (strict) {
          intervals = [];
          solutionHTML = 'Nessuna soluzione (impossibile)';
          summary = 'Mai verificata';
        } else {
          intervals = [{ from: r0.num, to: r0.num, incFrom: true, incTo: true }];
          solutionHTML = `x = ${r0.html}`;
          summary = 'Solo un punto';
        }
      }
    } else {
      const r1 = sol.roots[0];
      const r2 = sol.roots[1];
      const symL = strict ? '<' : '≤';
      const symG = strict ? '>' : '≥';
      if (wantExternal) {
        intervals = [
          { from: -Infinity, to: r1.num, incFrom: false, incTo: !strict },
          { from: r2.num, to: Infinity, incFrom: !strict, incTo: false }
        ];
        solutionHTML = `x ${symL} ${r1.html} &nbsp;∨&nbsp; x ${symG} ${r2.html}`;
        summary = 'Valori esterni';
      } else {
        intervals = [
          { from: r1.num, to: r2.num, incFrom: !strict, incTo: !strict }
        ];
        solutionHTML = `${r1.html} ${symL} x ${symL} ${r2.html}`;
        summary = 'Valori interni';
      }
    }

    const opPretty = op.replace('>=', '≥').replace('<=', '≤');
    const steps = [
      {
        title: 'Equazione associata',
        html: `${formatQuadraticExprHTML(a, b, c)} = 0 &nbsp;⇒&nbsp; Δ = <strong>${sol.delta.toHTML()}</strong>`
      },
      {
        title: 'Radici e segno della parabola',
        html: (sol.count === 0 ? 'Nessuna radice reale. '
          : sol.count === 1 ? `Una radice doppia: x<sub>1,2</sub> = <strong>${sol.roots[0].html}</strong>. `
          : `Due radici: x<sub>1</sub> = <strong>${sol.roots[0].html}</strong>, x<sub>2</sub> = <strong>${sol.roots[1].html}</strong>. `) +
          `La parabola ha concavità ${aPos ? 'verso l’alto (a > 0)' : 'verso il basso (a < 0)'}.`
      },
      {
        title: `Soluzione di ${formatQuadraticExprHTML(a, b, c)} ${opPretty} 0`,
        html: `<strong>${solutionHTML}</strong> <span class="muted">(${summary})</span>`
      }
    ];

    return { a, b, c, op, delta: sol.delta, roots: sol.roots, intervals, solutionHTML, summary, steps };
  }

  // =========================================================================
  // 4.18 Esponenziali e logaritmi (equazioni semplici + grafico)
  // =========================================================================
  function solveExpLogEquation(kind, baseNum, rhsNum) {
    // kind: 'exp' (a^x = b) | 'log' (log_a(x) = c)
    if (!(baseNum > 0 && baseNum !== 1)) {
      throw new Error('La base deve essere positiva e diversa da 1 (a > 0, a ≠ 1).');
    }

    const baseStr = Math.abs(baseNum - Math.E) < 1e-6 ? 'e' : formatItalianDecimal(baseNum, 3);
    const rhsStr = formatItalianDecimal(rhsNum, 3);

    if (kind === 'exp') {
      if (rhsNum <= 0) {
        return {
          solvable: false,
          xValue: null,
          exactHTML: 'Impossibile (aˣ è sempre > 0)',
          steps: [
            { title: 'Equazione esponenziale', html: `${baseStr}<sup>x</sup> = ${rhsStr}` },
            { title: 'Conclusione', html: `Una potenza con base positiva è sempre strettamente positiva: <strong>nessuna soluzione reale</strong>.` }
          ]
        };
      }
      const xVal = Math.log(rhsNum) / Math.log(baseNum);
      const isCleanInt = Math.abs(xVal - Math.round(xVal)) < 1e-9;
      const exactHTML = isCleanInt
        ? `x = <strong>${Math.round(xVal)}</strong>`
        : `x = log<sub>${baseStr}</sub>(${rhsStr}) <span class="calc-approx">(calcolatrice: ≈ ${formatItalianDecimal(xVal, 4)})</span>`;

      const steps = [
        { title: 'Equazione esponenziale', html: `${baseStr}<sup>x</sup> = ${rhsStr}` },
        {
          title: 'Risoluzione',
          html: isCleanInt
            ? `Scriviamo ${rhsStr} come potenza di ${baseStr}: ${baseStr}<sup>x</sup> = ${baseStr}<sup>${Math.round(xVal)}</sup> ⇒ <strong>x = ${Math.round(xVal)}</strong>.`
            : `Applichiamo il logaritmo in base ${baseStr}: ${exactHTML}.`
        }
      ];
      return { solvable: true, xValue: xVal, exactHTML, steps };
    }

    // kind === 'log': log_a(x) = c  => x = a^c
    const xVal = Math.pow(baseNum, rhsNum);
    const isCleanInt = Math.abs(xVal - Math.round(xVal)) < 1e-9;
    const exactHTML = isCleanInt
      ? `x = <strong>${Math.round(xVal)}</strong>`
      : `x = ${baseStr}<sup>${rhsStr}</sup> <span class="calc-approx">(calcolatrice: ≈ ${formatItalianDecimal(xVal, 4)})</span>`;

    const steps = [
      { title: 'Equazione logaritmica (condizione di esistenza: x > 0)', html: `log<sub>${baseStr}</sub>(x) = ${rhsStr}` },
      { title: 'Definizione di logaritmo', html: `x = ${baseStr}<sup>${rhsStr}</sup> ⇒ ${exactHTML} (verifica x > 0 ✓)` }
    ];
    return { solvable: true, xValue: xVal, exactHTML, steps };
  }

  const exportsObj = {
    formatQuadraticExprHTML,
    solveQuadratic,
    analyzeParabola,
    solveQuadraticInequality,
    solveExpLogEquation
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
