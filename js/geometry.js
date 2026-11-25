/**
 * geometry.js
 * Exact analytic geometry engine for 3rd-year high school (terze, matematica di base).
 * Implements §4.1–4.15 + optional circle module, with step-by-step Italian explanations.
 */
(function (root) {
  'use strict';

  const M = (typeof module !== 'undefined' && module.exports)
    ? require('./math-exact.js')
    : root.GraphCalc;
  const P = (typeof module !== 'undefined' && module.exports)
    ? require('./parser.js')
    : root.GraphCalc;

  const { Rational, Radical, absBigInt, formatPointStr, formatPointHTML, formatItalianDecimal } = M;
  const { normalizeLineCoefficients } = P;

  /**
   * Line represented in canonical integer implicit form: a*x + b*y + c = 0
   * with gcd(|a|,|b|,|c|)=1 and (a > 0 || (a === 0 && b > 0)).
   */
  class Line {
    constructor(a, b, c) {
      const norm = normalizeLineCoefficients(a, b, c);
      this.a = norm.a;
      this.b = norm.b;
      this.c = norm.c;
    }

    static fromSlopeIntercept(m, q) {
      m = Rational.of(m);
      q = Rational.of(q);
      // y = m*x + q  =>  m*x - y + q = 0
      return new Line(m, Rational.MINUS_ONE, q);
    }

    static vertical(h) {
      h = Rational.of(h);
      // x = h => x - h = 0
      return new Line(Rational.ONE, Rational.ZERO, h.neg());
    }

    static horizontal(k) {
      k = Rational.of(k);
      // y = k => y - k = 0
      return new Line(Rational.ZERO, Rational.ONE, k.neg());
    }

    isVertical() { return this.b === 0n; }
    isHorizontal() { return this.a === 0n; }

    /** Slope m = -a/b, or null if vertical */
    slope() {
      if (this.isVertical()) return null;
      return new Rational(-this.a, this.b);
    }

    /** y-intercept q = -c/b, or null if vertical */
    yIntercept() {
      if (this.isVertical()) return null;
      return new Rational(-this.c, this.b);
    }

    /** x-intercept -c/a, or null if horizontal */
    xIntercept() {
      if (this.isHorizontal()) return null;
      return new Rational(-this.c, this.a);
    }

    evalY(x) {
      if (this.isVertical()) return null;
      x = Rational.of(x);
      return this.slope().mul(x).add(this.yIntercept());
    }

    /** Evaluate a*x + b*y + c */
    evalImplicit(pt) {
      const x = Rational.of(pt.x);
      const y = Rational.of(pt.y);
      return Rational.of(this.a).mul(x).add(Rational.of(this.b).mul(y)).add(Rational.of(this.c));
    }

    containsPoint(pt) {
      return this.evalImplicit(pt).isZero();
    }

    equals(other) {
      return this.a === other.a && this.b === other.b && this.c === other.c;
    }

    isParallelTo(other) {
      // a1*b2 - a2*b1 === 0
      return this.a * other.b - other.a * this.b === 0n;
    }

    isPerpendicularTo(other) {
      // a1*a2 + b1*b2 === 0
      return this.a * other.a + this.b * other.b === 0n;
    }

    /** Format explicit equation y = mx + q (or x = h for vertical) */
    toExplicitString() {
      if (this.isVertical()) {
        return `x = ${this.xIntercept().toString()}`;
      }
      const m = this.slope();
      const q = this.yIntercept();
      if (m.isZero()) {
        return `y = ${q.toString()}`;
      }
      let mPart = '';
      if (m.isOne()) mPart = 'x';
      else if (m.isMinusOne()) mPart = '-x';
      else mPart = `${m.toString()}x`;

      if (q.isZero()) return `y = ${mPart}`;
      const qSign = q.sign() > 0 ? ' + ' : ' - ';
      return `y = ${mPart}${qSign}${q.abs().toString()}`;
    }

    toExplicitHTML() {
      if (this.isVertical()) {
        return `x = ${this.xIntercept().toHTML()}`;
      }
      const m = this.slope();
      const q = this.yIntercept();
      if (m.isZero()) {
        return `y = ${q.toHTML()}`;
      }
      let mPart = '';
      if (m.isOne()) mPart = 'x';
      else if (m.isMinusOne()) mPart = '−x';
      else mPart = `${m.toHTML()}x`;

      if (q.isZero()) return `y = ${mPart}`;
      const qSign = q.sign() > 0 ? ' + ' : ' − ';
      return `y = ${mPart}${qSign}${q.abs().toHTML()}`;
    }

    /** Format implicit equation ax + by + c = 0 */
    toImplicitString() {
      const terms = [];
      if (this.a !== 0n) {
        if (this.a === 1n) terms.push('x');
        else if (this.a === -1n) terms.push('-x');
        else terms.push(`${this.a}x`);
      }
      if (this.b !== 0n) {
        const absB = absBigInt(this.b);
        const bStr = absB === 1n ? 'y' : `${absB}y`;
        if (terms.length === 0) {
          terms.push(this.b < 0n ? `-${bStr}` : bStr);
        } else {
          terms.push(this.b < 0n ? `- ${bStr}` : `+ ${bStr}`);
        }
      }
      if (this.c !== 0n) {
        const absC = absBigInt(this.c);
        terms.push(this.c < 0n ? `- ${absC}` : `+ ${absC}`);
      }
      return `${terms.join(' ')} = 0`;
    }

    toImplicitHTML() {
      return this.toImplicitString().replace(/-/g, '−');
    }
  }

  // =========================================================================
  // 4.1 Piano cartesiano, quadranti e assi
  // =========================================================================
  function classifyPoint(pt) {
    const sx = Rational.of(pt.x).sign();
    const sy = Rational.of(pt.y).sign();
    if (sx === 0 && sy === 0) return { code: 'origine', label: 'Origine O(0; 0)' };
    if (sx === 0) return { code: 'asse-y', label: 'Asse y' };
    if (sy === 0) return { code: 'asse-x', label: 'Asse x' };
    if (sx > 0 && sy > 0) return { code: 'I', label: 'I quadrante' };
    if (sx < 0 && sy > 0) return { code: 'II', label: 'II quadrante' };
    if (sx < 0 && sy < 0) return { code: 'III', label: 'III quadrante' };
    return { code: 'IV', label: 'IV quadrante' };
  }

  // =========================================================================
  // 4.2 Distanza tra due punti
  // =========================================================================
  function distanceBetweenPoints(A, B, labelA, labelB) {
    labelA = labelA || A.label || 'A';
    labelB = labelB || B.label || 'B';
    const dx = Rational.of(B.x).sub(A.x);
    const dy = Rational.of(B.y).sub(A.y);
    const dx2 = dx.mul(dx);
    const dy2 = dy.mul(dy);
    const d2 = dx2.add(dy2);
    const dist = Radical.sqrtOfRational(d2);

    const steps = [
      {
        title: 'Formula della distanza',
        html: `${labelA}${labelB} = √[(x<sub>${labelB}</sub> − x<sub>${labelA}</sub>)² + (y<sub>${labelB}</sub> − y<sub>${labelA}</sub>)²]`
      },
      {
        title: 'Calcolo delle differenze Δx e Δy',
        html: `Δx = ${B.x.toHTML()} − (${A.x.toHTML()}) = <strong>${dx.toHTML()}</strong> &nbsp;|&nbsp; Δy = ${B.y.toHTML()} − (${A.y.toHTML()}) = <strong>${dy.toHTML()}</strong>`
      },
      {
        title: 'Quadrati e somma',
        html: `${labelA}${labelB}² = (${dx.toHTML()})² + (${dy.toHTML()})² = ${dx2.toHTML()} + ${dy2.toHTML()} = <strong>${d2.toHTML()}</strong>`
      },
      {
        title: 'Radice semplificata',
        html: `${labelA}${labelB} = √(${d2.toHTML()}) = <strong>${dist.toHTML()}</strong>` +
          (dist.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${dist.toApproxItalian(3)})</span>`)
      }
    ];

    return { dx, dy, distSquared: d2, distance: dist, steps };
  }

  // =========================================================================
  // 4.3 Punto medio
  // =========================================================================
  function midpointOf(A, B, labelA, labelB) {
    labelA = labelA || A.label || 'A';
    labelB = labelB || B.label || 'B';
    const two = Rational.of(2);
    const mx = Rational.of(A.x).add(B.x).div(two);
    const my = Rational.of(A.y).add(B.y).div(two);
    const Mpt = { label: 'M', x: mx, y: my };

    const steps = [
      {
        title: 'Formula del punto medio',
        html: `M = (<span class="frac"><span class="num">x<sub>${labelA}</sub> + x<sub>${labelB}</sub></span><span class="den">2</span></span>; <span class="frac"><span class="num">y<sub>${labelA}</sub> + y<sub>${labelB}</sub></span><span class="den">2</span></span>)`
      },
      {
        title: 'Sostituzione delle coordinate',
        html: `x<sub>M</sub> = <span class="frac"><span class="num">${A.x.toHTML()} + (${B.x.toHTML()})</span><span class="den">2</span></span> = <strong>${mx.toHTML()}</strong> &nbsp;|&nbsp; y<sub>M</sub> = <span class="frac"><span class="num">${A.y.toHTML()} + (${B.y.toHTML()})</span><span class="den">2</span></span> = <strong>${my.toHTML()}</strong>`
      },
      {
        title: 'Risultato',
        html: `Punto medio: <strong>${formatPointHTML(Mpt, 'M')}</strong>`
      }
    ];

    return { midpoint: Mpt, steps };
  }

  // =========================================================================
  // 4.4 Tabella di valori per y = mx + q
  // =========================================================================
  function tableOfValues(line, xValues) {
    if (line.isVertical()) {
      const h = line.xIntercept();
      return {
        isVertical: true,
        rows: [-2, -1, 0, 1, 2].map(y => ({ x: h, y: Rational.of(y) }))
      };
    }
    const rows = xValues.map(xv => {
      const x = Rational.of(xv);
      const y = line.evalY(x);
      return { x, y };
    });
    return { isVertical: false, rows };
  }

  // =========================================================================
  // 4.5 Appartenenza di un punto a una retta
  // =========================================================================
  function pointBelongsToLine(line, Ppt, labelP) {
    labelP = labelP || Ppt.label || 'P';
    const steps = [];
    let belongs = false;
    let position = 'sulla retta';

    if (line.isVertical()) {
      const h = line.xIntercept();
      belongs = Rational.of(Ppt.x).eq(h);
      position = belongs ? 'sulla retta' : (Rational.of(Ppt.x).gt(h) ? 'a destra della retta' : 'a sinistra della retta');
      steps.push({
        title: 'Confronto con la retta verticale',
        html: `Retta: <strong>${line.toExplicitHTML()}</strong>. Ascissa del punto: x<sub>${labelP}</sub> = ${Ppt.x.toHTML()}.`
      });
      steps.push({
        title: 'Conclusione',
        html: belongs
          ? `${Ppt.x.toHTML()} = ${h.toHTML()} ⇒ <strong>${labelP} appartiene alla retta</strong> (${labelP} ∈ r).`
          : `${Ppt.x.toHTML()} ≠ ${h.toHTML()} ⇒ <strong>${labelP} NON appartiene alla retta</strong> (${labelP} ∉ r).`
      });
    } else {
      const m = line.slope();
      const q = line.yIntercept();
      const yExpected = line.evalY(Ppt.x);
      belongs = yExpected.eq(Ppt.y);
      position = belongs ? 'sulla retta' : (Rational.of(Ppt.y).gt(yExpected) ? 'sopra la retta' : 'sotto la retta');

      steps.push({
        title: 'Sostituzione nell’equazione esplicita',
        html: `Retta: <strong>${line.toExplicitHTML()}</strong>. Sostituiamo x = ${Ppt.x.toHTML()} e y = ${Ppt.y.toHTML()}.`
      });
      steps.push({
        title: 'Calcolo del secondo membro',
        html: `y<sub>calcolata</sub> = (${m.toHTML()}) · (${Ppt.x.toHTML()}) + (${q.toHTML()}) = <strong>${yExpected.toHTML()}</strong>`
      });
      steps.push({
        title: 'Confronto dei due membri',
        html: belongs
          ? `y<sub>${labelP}</sub> = ${Ppt.y.toHTML()} = ${yExpected.toHTML()} ⇒ <strong>${labelP} appartiene alla retta</strong> (${labelP} ∈ r).`
          : `y<sub>${labelP}</sub> = ${Ppt.y.toHTML()} ≠ ${yExpected.toHTML()} ⇒ <strong>${labelP} NON appartiene alla retta</strong> (${labelP} ∉ r, sta ${position}).`
      });
    }

    return { belongs, position, steps };
  }

  // =========================================================================
  // 4.6 Coefficiente angolare e retta per due punti
  // =========================================================================
  function lineThroughTwoPoints(A, B, labelA, labelB) {
    labelA = labelA || A.label || 'A';
    labelB = labelB || B.label || 'B';
    const dx = Rational.of(B.x).sub(A.x);
    const dy = Rational.of(B.y).sub(A.y);

    if (dx.isZero() && dy.isZero()) {
      throw new Error(`I punti ${labelA} e ${labelB} coincidono: servono due punti distinti.`);
    }

    const steps = [];

    // Vertical line
    if (dx.isZero()) {
      const line = Line.vertical(A.x);
      steps.push({
        title: 'Controllo delle ascisse',
        html: `x<sub>${labelA}</sub> = x<sub>${labelB}</sub> = ${A.x.toHTML()} ⇒ Δx = 0.`
      });
      steps.push({
        title: 'Caso particolare: retta verticale',
        html: `Il denominatore è nullo, quindi <strong>m non esiste</strong>. La retta è verticale: <strong>${line.toExplicitHTML()}</strong> (implicita: ${line.toImplicitHTML()}).`
      });
      return { line, slope: null, isVertical: true, isHorizontal: false, dx, dy, steps };
    }

    const m = dy.div(dx);
    const q = Rational.of(A.y).sub(m.mul(A.x));
    const line = Line.fromSlopeIntercept(m, q);

    steps.push({
      title: 'Coefficiente angolare m',
      html: `m = <span class="frac"><span class="num">y<sub>${labelB}</sub> − y<sub>${labelA}</sub></span><span class="den">x<sub>${labelB}</sub> − x<sub>${labelA}</sub></span></span> = <span class="frac"><span class="num">${B.y.toHTML()} − (${A.y.toHTML()})</span><span class="den">${B.x.toHTML()} − (${A.x.toHTML()})</span></span> = <span class="frac"><span class="num">${dy.toHTML()}</span><span class="den">${dx.toHTML()}</span></span> = <strong>${m.toHTML()}</strong>`
    });

    if (m.isZero()) {
      steps.push({
        title: 'Caso particolare: retta orizzontale',
        html: `Poiché y<sub>${labelA}</sub> = y<sub>${labelB}</sub> = ${A.y.toHTML()}, si ha m = 0. La retta è orizzontale: <strong>${line.toExplicitHTML()}</strong>.`
      });
    } else {
      steps.push({
        title: `Retta per ${labelA} con pendenza m`,
        html: `y − y<sub>${labelA}</sub> = m(x − x<sub>${labelA}</sub>) ⇒ y − (${A.y.toHTML()}) = (${m.toHTML()})(x − (${A.x.toHTML()}))`
      });
      steps.push({
        title: 'Calcolo dell’intercetta q',
        html: `q = y<sub>${labelA}</sub> − m · x<sub>${labelA}</sub> = ${A.y.toHTML()} − (${m.toHTML()}) · (${A.x.toHTML()}) = <strong>${q.toHTML()}</strong>`
      });
    }

    steps.push({
      title: 'Equazione della retta (esplicita e implicita)',
      html: `Esplicita: <strong>${line.toExplicitHTML()}</strong> &nbsp;|&nbsp; Implicita: <strong>${line.toImplicitHTML()}</strong>`
    });

    return { line, slope: m, q, isVertical: false, isHorizontal: m.isZero(), dx, dy, steps };
  }

  // =========================================================================
  // 4.7 Allineamento di tre punti (confronto delle pendenze)
  // =========================================================================
  function checkCollinearity(A, B, C) {
    const lA = A.label || 'A';
    const lB = B.label || 'B';
    const lC = C.label || 'C';
    const dxAB = Rational.of(B.x).sub(A.x);
    const dyAB = Rational.of(B.y).sub(A.y);
    const dxAC = Rational.of(C.x).sub(A.x);
    const dyAC = Rational.of(C.y).sub(A.y);

    const steps = [];
    let collinear = false;
    let commonLine = null;
    let mAB = null;
    let mAC = null;

    if (dxAB.isZero() && dxAC.isZero()) {
      collinear = true;
      commonLine = Line.vertical(A.x);
      steps.push({
        title: 'Confronto delle ascisse',
        html: `Tutti e tre i punti hanno x = ${A.x.toHTML()}: stanno sulla stessa retta verticale <strong>${commonLine.toExplicitHTML()}</strong>.`
      });
    } else if (dxAB.isZero() || dxAC.isZero()) {
      collinear = false;
      mAB = dxAB.isZero() ? null : dyAB.div(dxAB);
      mAC = dxAC.isZero() ? null : dyAC.div(dxAC);
      steps.push({
        title: 'Confronto delle pendenze',
        html: `Una coppia di punti forma una retta verticale (m non esiste), l'altra no ⇒ <strong>i tre punti NON sono allineati</strong>.`
      });
    } else {
      mAB = dyAB.div(dxAB);
      mAC = dyAC.div(dxAC);
      collinear = mAB.eq(mAC);
      steps.push({
        title: `Pendenza tra ${lA} e ${lB}`,
        html: `m<sub>${lA}${lB}</sub> = <span class="frac"><span class="num">${dyAB.toHTML()}</span><span class="den">${dxAB.toHTML()}</span></span> = <strong>${mAB.toHTML()}</strong>`
      });
      steps.push({
        title: `Pendenza tra ${lA} e ${lC}`,
        html: `m<sub>${lA}${lC}</sub> = <span class="frac"><span class="num">${dyAC.toHTML()}</span><span class="den">${dxAC.toHTML()}</span></span> = <strong>${mAC.toHTML()}</strong>`
      });
      if (collinear) {
        commonLine = lineThroughTwoPoints(A, B, lA, lB).line;
        steps.push({
          title: 'Conclusione',
          html: `m<sub>${lA}${lB}</sub> = m<sub>${lA}${lC}</sub> = <strong>${mAB.toHTML()}</strong> ⇒ <strong>i tre punti sono ALLINEATI</strong> sulla retta <strong>${commonLine.toExplicitHTML()}</strong>.`
        });
      } else {
        steps.push({
          title: 'Conclusione',
          html: `m<sub>${lA}${lB}</sub> = ${mAB.toHTML()} ≠ ${mAC.toHTML()} = m<sub>${lA}${lC}</sub> ⇒ <strong>i tre punti NON sono allineati</strong>.`
        });
      }
    }

    return { collinear, mAB, mAC, commonLine, steps };
  }

  // =========================================================================
  // 4.8 Intersezione di due rette (sistemi)
  // =========================================================================
  function intersectLines(r1, r2, name1, name2) {
    name1 = name1 || 'r';
    name2 = name2 || 's';
    const det = r1.a * r2.b - r2.a * r1.b;
    const steps = [];

    steps.push({
      title: 'Sistema delle due rette',
      html: `${name1}: ${r1.toExplicitHTML()} <span class="muted">(${r1.toImplicitHTML()})</span><br>${name2}: ${r2.toExplicitHTML()} <span class="muted">(${r2.toImplicitHTML()})</span>`
    });

    if (det === 0n) {
      if (r1.equals(r2)) {
        steps.push({
          title: 'Sistema indeterminato',
          html: `Le due equazioni rappresentano la stessa retta (infiniti punti in comune). Conclusione: <strong>rette coincidenti</strong>.`
        });
        return { type: 'coincidenti', point: null, steps };
      } else {
        const m1 = r1.slope();
        const mText = m1 === null ? 'entrambe verticali' : `stesso coefficiente angolare m = ${m1.toHTML()}`;
        steps.push({
          title: 'Sistema impossibile',
          html: `Le rette hanno ${mText} ma intercette diverse: nessun punto in comune. Conclusione: <strong>rette parallele distinte</strong> (${name1} ∥ ${name2}).`
        });
        return { type: 'parallele', point: null, steps };
      }
    }

    // Cramer / exact solution: a1*x + b1*y = -c1, a2*x + b2*y = -c2
    const x = new Rational(r1.b * r2.c - r2.b * r1.c, det);
    const y = new Rational(r2.a * r1.c - r1.a * r2.c, det);
    const pt = { label: 'I', x, y };

    if (!r1.isVertical() && !r2.isVertical()) {
      const m1 = r1.slope(), q1 = r1.yIntercept();
      const m2 = r2.slope(), q2 = r2.yIntercept();
      const dm = m1.sub(m2);
      const dq = q2.sub(q1);
      steps.push({
        title: 'Uguagliamo le espressioni di y',
        html: `${r1.toExplicitHTML().replace(/^y = /, '')} = ${r2.toExplicitHTML().replace(/^y = /, '')} ⇒ (${dm.toHTML()})x = ${dq.toHTML()} ⇒ <strong>x = ${x.toHTML()}</strong>`
      });
      steps.push({
        title: 'Sostituiamo x per trovare y',
        html: `y = (${m1.toHTML()}) · (${x.toHTML()}) + (${q1.toHTML()}) = <strong>${y.toHTML()}</strong>`
      });
    } else {
      steps.push({
        title: 'Risoluzione del sistema (caso con retta verticale)',
        html: `Dalla retta verticale si legge subito x = <strong>${x.toHTML()}</strong>; sostituendo nell’altra retta si ottiene y = <strong>${y.toHTML()}</strong>.`
      });
    }

    steps.push({
      title: 'Verifica su entrambe le rette',
      html: `In ${name1}: ${r1.a}(${x.toHTML()}) + (${r1.b})(${y.toHTML()}) + (${r1.c}) = 0 ✓ &nbsp;|&nbsp; In ${name2}: ${r2.a}(${x.toHTML()}) + (${r2.b})(${y.toHTML()}) + (${r2.c}) = 0 ✓<br><strong>Rette incidenti</strong> nel punto <strong>${formatPointHTML(pt, 'I')}</strong>.`
    });

    return { type: 'incidenti', point: pt, steps };
  }

  // =========================================================================
  // 4.9 Riconoscere parallele e perpendicolari (2 o più rette)
  // =========================================================================
  function analyzeLineRelations(linesWithNames) {
    const slopes = linesWithNames.map(({ name, line }) => ({
      name,
      line,
      m: line.slope()
    }));

    const pairs = [];
    for (let i = 0; i < slopes.length; i++) {
      for (let j = i + 1; j < slopes.length; j++) {
        const A = slopes[i];
        const B = slopes[j];
        let relation = 'nessuna';
        let product = null;
        let reasonHTML = '';

        if (A.line.equals(B.line)) {
          relation = 'coincidenti';
          reasonHTML = `stessa equazione`;
        } else if (A.line.isParallelTo(B.line)) {
          relation = 'parallele';
          reasonHTML = A.m === null
            ? `entrambe verticali`
            : `m<sub>${A.name}</sub> = m<sub>${B.name}</sub> = ${A.m.toHTML()}`;
        } else if (A.line.isPerpendicularTo(B.line)) {
          relation = 'perpendicolari';
          if (A.m === null || B.m === null) {
            reasonHTML = `una orizzontale (m = 0) e una verticale (m non esiste)`;
          } else {
            product = A.m.mul(B.m);
            reasonHTML = `m<sub>${A.name}</sub> · m<sub>${B.name}</sub> = (${A.m.toHTML()}) · (${B.m.toHTML()}) = −1`;
          }
        } else {
          if (A.m !== null && B.m !== null) {
            product = A.m.mul(B.m);
            reasonHTML = `m<sub>${A.name}</sub> ≠ m<sub>${B.name}</sub> e m<sub>${A.name}</sub> · m<sub>${B.name}</sub> = ${product.toHTML()} ≠ −1`;
          } else {
            reasonHTML = `una verticale e una obliqua`;
          }
        }
        pairs.push({ name1: A.name, name2: B.name, relation, product, reasonHTML });
      }
    }

    const steps = [
      {
        title: 'Coefficienti angolari delle rette',
        html: slopes.map(s =>
          `<strong>${s.name}</strong> (${s.line.toExplicitHTML()}): ` +
          (s.m === null ? '<strong>m non esiste</strong> (verticale)' : `m = <strong>${s.m.toHTML()}</strong>`)
        ).join('<br>')
      },
      {
        title: 'Confronto a coppie (metodo algebrico)',
        html: pairs.map(p => {
          const sym = p.relation === 'parallele' ? '∥'
            : p.relation === 'perpendicolari' ? '⊥'
            : p.relation === 'coincidenti' ? '≡' : '∦, ∤';
          return `<strong>${p.name1} ${sym} ${p.name2}</strong> (${p.relation}): ${p.reasonHTML}`;
        }).join('<br>')
      }
    ];

    return { slopes, pairs, steps };
  }

  // =========================================================================
  // 4.10 Retta per un punto parallela o perpendicolare a una retta data
  // =========================================================================
  function lineThroughPointRel(r, Ppt, mode, labelP) {
    // mode: 'parallela' | 'perpendicolare'
    labelP = labelP || Ppt.label || 'P';
    const steps = [];
    const m = r.slope();

    steps.push({
      title: 'Coefficiente angolare della retta data',
      html: `Retta data: ${r.toImplicitHTML()} (esplicita: ${r.toExplicitHTML()}). ` +
        (m === null ? `Retta verticale: <strong>m non esiste</strong>.` : `m = −a/b = <strong>${m.toHTML()}</strong>.`)
    });

    let resultLine;
    if (mode === 'parallela') {
      if (r.isVertical()) {
        resultLine = Line.vertical(Ppt.x);
        steps.push({
          title: 'Parallela a una retta verticale',
          html: `È anch’essa verticale e passa per x<sub>${labelP}</sub> = ${Ppt.x.toHTML()}: <strong>${resultLine.toExplicitHTML()}</strong>.`
        });
      } else if (r.isHorizontal()) {
        resultLine = Line.horizontal(Ppt.y);
        steps.push({
          title: 'Parallela a una retta orizzontale',
          html: `Ha m' = 0 e passa per y<sub>${labelP}</sub> = ${Ppt.y.toHTML()}: <strong>${resultLine.toExplicitHTML()}</strong>.`
        });
      } else {
        const q = Rational.of(Ppt.y).sub(m.mul(Ppt.x));
        resultLine = Line.fromSlopeIntercept(m, q);
        steps.push({
          title: 'Condizione di parallelismo',
          html: `m' = m = <strong>${m.toHTML()}</strong>`
        });
        steps.push({
          title: `Retta per ${formatPointHTML(Ppt, labelP)}`,
          html: `y − (${Ppt.y.toHTML()}) = (${m.toHTML()})(x − (${Ppt.x.toHTML()})) ⇒ <strong>${resultLine.toExplicitHTML()}</strong> (implicita: <strong>${resultLine.toImplicitHTML()}</strong>)`
        });
      }
    } else {
      // perpendicolare
      if (r.isVertical()) {
        resultLine = Line.horizontal(Ppt.y);
        steps.push({
          title: 'Perpendicolare a una retta verticale',
          html: `La perpendicolare a una verticale è orizzontale (m' = 0): <strong>${resultLine.toExplicitHTML()}</strong>.`
        });
      } else if (r.isHorizontal()) {
        resultLine = Line.vertical(Ppt.x);
        steps.push({
          title: 'Perpendicolare a una retta orizzontale',
          html: `La perpendicolare a un’orizzontale è verticale (m' non esiste): <strong>${resultLine.toExplicitHTML()}</strong>.`
        });
      } else {
        const mPerp = m.inv().neg();
        const q = Rational.of(Ppt.y).sub(mPerp.mul(Ppt.x));
        resultLine = Line.fromSlopeIntercept(mPerp, q);
        steps.push({
          title: 'Condizione di perpendicolarità',
          html: `m' = −1/m = <strong>${mPerp.toHTML()}</strong> (controllo: (${m.toHTML()}) · (${mPerp.toHTML()}) = −1)`
        });
        steps.push({
          title: `Retta per ${formatPointHTML(Ppt, labelP)}`,
          html: `y − (${Ppt.y.toHTML()}) = (${mPerp.toHTML()})(x − (${Ppt.x.toHTML()})) ⇒ <strong>${resultLine.toExplicitHTML()}</strong> (implicita: <strong>${resultLine.toImplicitHTML()}</strong>)`
        });
      }
    }

    return { line: resultLine, slope: resultLine.slope(), steps };
  }

  // =========================================================================
  // 4.11 Asse di un segmento (entrambi i metodi)
  // =========================================================================
  function perpendicularBisector(A, B, checkPointC) {
    const lA = A.label || 'A';
    const lB = B.label || 'B';
    const dx = Rational.of(B.x).sub(A.x);
    const dy = Rational.of(B.y).sub(A.y);
    if (dx.isZero() && dy.isZero()) {
      throw new Error('I due estremi coincidono: impossibile costruire l’asse.');
    }

    const midRes = midpointOf(A, B, lA, lB);
    const Mpt = midRes.midpoint;
    const segLine = lineThroughTwoPoints(A, B, lA, lB).line;
    const perpRes = lineThroughPointRel(segLine, Mpt, 'perpendicolare', 'M');
    const axis = perpRes.line;

    // Method 2: (x - xA)^2 + (y - yA)^2 = (x - xB)^2 + (y - yB)^2
    // => 2(xB - xA)x + 2(yB - yA)y + (xA^2 + yA^2 - xB^2 - yB^2) = 0
    const two = Rational.of(2);
    const a2 = two.mul(dx);
    const b2 = two.mul(dy);
    const c2 = Rational.of(A.x).pow(2).add(Rational.of(A.y).pow(2))
      .sub(Rational.of(B.x).pow(2)).sub(Rational.of(B.y).pow(2));

    const stepsMethod1 = [
      {
        title: 'Metodo 1 — Punto medio M',
        html: `M = <strong>${formatPointHTML(Mpt, 'M')}</strong>`
      },
      {
        title: `Metodo 1 — Pendenza del segmento ${lA}${lB}`,
        html: segLine.isVertical()
          ? `${lA}${lB} è verticale (m non esiste) ⇒ asse orizzontale (m<sub>⊥</sub> = 0)`
          : segLine.isHorizontal()
          ? `${lA}${lB} è orizzontale (m = 0) ⇒ asse verticale (m<sub>⊥</sub> non esiste)`
          : `m<sub>${lA}${lB}</sub> = ${segLine.slope().toHTML()} ⇒ m<sub>⊥</sub> = <strong>${axis.slope().toHTML()}</strong>`
      },
      {
        title: 'Metodo 1 — Retta per M perpendicolare al segmento',
        html: `Asse: <strong>${axis.toExplicitHTML()}</strong> (implicita: <strong>${axis.toImplicitHTML()}</strong>)`
      }
    ];

    const stepsMethod2 = [
      {
        title: `Metodo 2 — Luogo geometrico P${lA} = P${lB}`,
        html: `(x − (${A.x.toHTML()}))² + (y − (${A.y.toHTML()}))² = (x − (${B.x.toHTML()}))² + (y − (${B.y.toHTML()}))²`
      },
      {
        title: 'Metodo 2 — Semplificazione (x² e y² si eliminano)',
        html: `(${a2.toHTML()})x + (${b2.toHTML()})y + (${c2.toHTML()}) = 0 ⇒ <strong>${axis.toImplicitHTML()}</strong> (esplicita: <strong>${axis.toExplicitHTML()}</strong>)`
      }
    ];

    let pointCheck = null;
    if (checkPointC) {
      const check = pointBelongsToLine(axis, checkPointC, checkPointC.label || 'C');
      pointCheck = check;
    }

    return {
      midpoint: Mpt,
      segmentLine: segLine,
      axis,
      stepsMethod1,
      stepsMethod2,
      steps: [...stepsMethod1, ...stepsMethod2],
      pointCheck
    };
  }

  // =========================================================================
  // 4.12 Distanza punto-retta: metodo lungo (piede H) e formula
  // =========================================================================
  function pointToLineDistance(Ppt, r, labelP) {
    labelP = labelP || Ppt.label || 'P';
    const onLine = r.containsPoint(Ppt);
    const perpRes = lineThroughPointRel(r, Ppt, 'perpendicolare', labelP);
    const perpLine = perpRes.line;

    if (onLine) {
      const H = { label: 'H', x: Rational.of(Ppt.x), y: Rational.of(Ppt.y) };
      const steps = [
        {
          title: 'Controllo di appartenenza',
          html: `${formatPointHTML(Ppt, labelP)} appartiene già alla retta ${r.toExplicitHTML()}.`
        },
        {
          title: 'Risultato',
          html: `Piede H = ${labelP} = <strong>${formatPointHTML(H, 'H')}</strong>, distanza d(${labelP}, r) = <strong>0</strong>.`
        }
      ];
      return {
        onLine: true,
        perpendicular: perpLine,
        foot: H,
        distance: Radical.ZERO,
        distanceSquared: Rational.ZERO,
        stepsLong: steps,
        stepsFormula: steps,
        steps
      };
    }

    const inter = intersectLines(r, perpLine, 'r', 's_⊥');
    const H = { label: 'H', x: inter.point.x, y: inter.point.y };
    const distLong = distanceBetweenPoints(Ppt, H, labelP, 'H');

    // Formula: |a*xP + b*yP + c| / sqrt(a^2 + b^2)
    const numRat = r.evalImplicit(Ppt).abs();
    const denSq = Rational.of(r.a * r.a + r.b * r.b);
    const denRad = Radical.sqrtOfRational(denSq);
    const distFormula = new Radical(numRat, 1n).div(denRad);

    const stepsLong = [
      {
        title: `Metodo lungo (1/3) — Perpendicolare a r per ${labelP}`,
        html: `s<sub>⊥</sub>: <strong>${perpLine.toExplicitHTML()}</strong> <span class="muted">(${perpLine.toImplicitHTML()})</span>`
      },
      {
        title: 'Metodo lungo (2/3) — Piede H (intersezione r ∩ s⊥)',
        html: `Risolvendo il sistema tra r e s<sub>⊥</sub> si ottiene <strong>${formatPointHTML(H, 'H')}</strong>`
      },
      {
        title: `Metodo lungo (3/3) — Distanza ${labelP}H`,
        html: `${labelP}H = √[(${H.x.toHTML()} − (${Ppt.x.toHTML()}))² + (${H.y.toHTML()} − (${Ppt.y.toHTML()}))²] = <strong>${distLong.distance.toHTML()}</strong>` +
          (distLong.distance.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${distLong.distance.toApproxItalian(3)})</span>`)
      }
    ];

    const stepsFormula = [
      {
        title: 'Formula — Retta in forma implicita',
        html: `r: <strong>${r.toImplicitHTML()}</strong> &nbsp;(a = ${r.a}, b = ${r.b}, c = ${r.c})`
      },
      {
        title: 'Formula — Sostituzione di P(xP; yP)',
        html: `d(${labelP}, r) = <span class="frac"><span class="num">|(${r.a})·(${Ppt.x.toHTML()}) + (${r.b})·(${Ppt.y.toHTML()}) + (${r.c})|</span><span class="den">√(${r.a}² + (${r.b})²)</span></span> = <span class="frac"><span class="num">${numRat.toHTML()}</span><span class="den">√${r.a * r.a + r.b * r.b}</span></span>`
      },
      {
        title: 'Formula — Riduzione del radicale',
        html: `d(${labelP}, r) = <strong>${distFormula.toHTML()}</strong>` +
          (distFormula.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${distFormula.toApproxItalian(3)})</span>`) +
          ` — coincide con il metodo lungo ✓`
      }
    ];

    return {
      onLine: false,
      perpendicular: perpLine,
      foot: H,
      distance: distFormula,
      distanceSquared: distLong.distSquared,
      stepsLong,
      stepsFormula,
      steps: [...stepsLong, ...stepsFormula]
    };
  }

  // =========================================================================
  // 4.13 Distanza tra rette parallele
  // =========================================================================
  function distanceBetweenParallelLines(r1, r2) {
    if (!r1.isParallelTo(r2)) {
      return {
        parallel: false,
        distance: null,
        steps: [{
          title: 'Rette non parallele',
          html: `Le due rette non sono parallele (si incontrano in un punto), quindi non ha senso parlare di distanza tra rette parallele.`
        }]
      };
    }
    if (r1.equals(r2)) {
      return {
        parallel: true,
        coincident: true,
        distance: Radical.ZERO,
        samplePoint: null,
        foot: null,
        steps: [{
          title: 'Rette coincidenti',
          html: `Le due rette coincidono: distanza = <strong>0</strong>.`
        }]
      };
    }
    // Pick a clean point on r1: (0; q) if non-vertical, else (h; 0)
    const samplePoint = r1.isVertical()
      ? { label: 'P', x: r1.xIntercept(), y: Rational.ZERO }
      : { label: 'P', x: Rational.ZERO, y: r1.yIntercept() };

    const dRes = pointToLineDistance(samplePoint, r2, 'P');
    const steps = [
      {
        title: 'Verifica del parallelismo',
        html: `r<sub>1</sub>: ${r1.toExplicitHTML()} e r<sub>2</sub>: ${r2.toExplicitHTML()} sono parallele (r<sub>1</sub> ∥ r<sub>2</sub>).`
      },
      {
        title: 'Scelta di un punto su r₁',
        html: `Prendiamo un punto comodo su r<sub>1</sub>: <strong>${formatPointHTML(samplePoint, 'P')}</strong>.`
      },
      ...dRes.stepsFormula
    ];

    return {
      parallel: true,
      coincident: false,
      samplePoint,
      foot: dRes.foot,
      perpendicular: dRes.perpendicular,
      distance: dRes.distance,
      steps
    };
  }

  // =========================================================================
  // 4.14 Problemi su un triangolo (lati, isoscele, punti medi, assi,
  //      circocentro, altezza, area, parallela/perpendicolare, mediana opzionale)
  // =========================================================================
  function analyzeTriangle(A, B, C, baseVertexChoice) {
    // baseVertexChoice: 'C' means base AB and apex C (default)
    const lA = A.label || 'A';
    const lB = B.label || 'B';
    const lC = C.label || 'C';

    const col = checkCollinearity(A, B, C);
    if (col.collinear) {
      throw new Error('I tre punti sono allineati: non formano un triangolo.');
    }

    const dAB = distanceBetweenPoints(A, B, lA, lB);
    const dBC = distanceBetweenPoints(B, C, lB, lC);
    const dCA = distanceBetweenPoints(C, A, lC, lA);

    const isoscelesBases = [];
    if (dCA.distSquared.eq(dBC.distSquared)) isoscelesBases.push(`${lA}${lB}`);
    if (dAB.distSquared.eq(dBC.distSquared)) isoscelesBases.push(`${lA}${lC}`);
    if (dAB.distSquared.eq(dCA.distSquared)) isoscelesBases.push(`${lB}${lC}`);

    const midAB = midpointOf(A, B, lA, lB).midpoint;
    const midBC = midpointOf(B, C, lB, lC).midpoint;
    const midCA = midpointOf(C, A, lC, lA).midpoint;

    const lineAB = lineThroughTwoPoints(A, B, lA, lB).line;
    const lineBC = lineThroughTwoPoints(B, C, lB, lC).line;
    const lineCA = lineThroughTwoPoints(C, A, lC, lA).line;

    const axisAB = perpendicularBisector(A, B, C);
    const axisBC = perpendicularBisector(B, C, A);
    const axisCA = perpendicularBisector(C, A, B);

    // Circumcenter = intersection of axisAB and axisCA
    const circumInter = intersectLines(axisAB.axis, axisCA.axis, 'asse AB', 'asse AC');
    const circumcenter = { label: 'O', x: circumInter.point.x, y: circumInter.point.y };
    const circumradius = distanceBetweenPoints(circumcenter, A, 'O', lA).distance;

    // Right angle check via slopes (a1*a2 + b1*b2 = 0)
    let rightAngleAt = null;
    if (lineAB.isPerpendicularTo(lineCA)) rightAngleAt = lA;
    else if (lineAB.isPerpendicularTo(lineBC)) rightAngleAt = lB;
    else if (lineBC.isPerpendicularTo(lineCA)) rightAngleAt = lC;

    // Altitude & Area relative to chosen base (default base AB, apex C)
    const apexChoice = baseVertexChoice || 'C';
    let basePts, apexPt, baseLine, baseLen;
    if (apexChoice === 'A') {
      basePts = [B, C]; apexPt = A; baseLine = lineBC; baseLen = dBC.distance;
    } else if (apexChoice === 'B') {
      basePts = [A, C]; apexPt = B; baseLine = lineCA; baseLen = dCA.distance;
    } else {
      basePts = [A, B]; apexPt = C; baseLine = lineAB; baseLen = dAB.distance;
    }

    const altitude = pointToLineDistance(apexPt, baseLine, apexPt.label || apexChoice);
    // Exact area = 1/2 * base * height (always rational for rational vertices!)
    const areaRad = baseLen.mul(altitude.distance).div(Radical.of(2));
    const area = areaRad.coef; // radicand is guaranteed 1n for rational vertices

    // Optional medians (4.15 - off by default in UI)
    const medianA = {
      midpoint: midBC,
      line: lineThroughTwoPoints(A, midBC, lA, 'M').line,
      length: distanceBetweenPoints(A, midBC, lA, 'M').distance
    };
    const medianB = {
      midpoint: midCA,
      line: lineThroughTwoPoints(B, midCA, lB, 'M').line,
      length: distanceBetweenPoints(B, midCA, lB, 'M').distance
    };
    const medianC = {
      midpoint: midAB,
      line: lineThroughTwoPoints(C, midAB, lC, 'M').line,
      length: distanceBetweenPoints(C, midAB, lC, 'M').distance
    };

    const steps = [
      {
        title: 'Lunghezze dei lati',
        html: `${lA}${lB} = <strong>${dAB.distance.toHTML()}</strong> &nbsp;|&nbsp; ${lB}${lC} = <strong>${dBC.distance.toHTML()}</strong> &nbsp;|&nbsp; ${lC}${lA} = <strong>${dCA.distance.toHTML()}</strong>` +
          (isoscelesBases.length > 0 ? `<br>Triangolo <strong>isoscele</strong> sulla base ${isoscelesBases.join(' / ')}` : '') +
          (rightAngleAt ? `<br>Angolo retto in <strong>${rightAngleAt}</strong> (controllo pendenze m₁ · m₂ = −1 ✓)` : '')
      },
      {
        title: 'Assi dei lati e circocentro',
        html: `Asse di ${lA}${lB}: <strong>${axisAB.axis.toExplicitHTML()}</strong><br>Asse di ${lA}${lC}: <strong>${axisCA.axis.toExplicitHTML()}</strong><br>Circocentro (intersezione degli assi): <strong>${formatPointHTML(circumcenter, 'O')}</strong>`
      },
      {
        title: `Altezza da ${apexPt.label || apexChoice} e Area`,
        html: `Base ${basePts[0].label || ''}${basePts[1].label || ''} = ${baseLen.toHTML()} &nbsp;|&nbsp; Piede H = ${formatPointHTML(altitude.foot, 'H')} &nbsp;|&nbsp; Altezza h = <strong>${altitude.distance.toHTML()}</strong><br>Area = <span class="frac"><span class="num">1</span><span class="den">2</span></span> · base · altezza = <strong>${area.toHTML()}</strong>`
      }
    ];

    return {
      sides: { AB: dAB, BC: dBC, CA: dCA },
      isoscelesBases,
      rightAngleAt,
      midpoints: { AB: midAB, BC: midBC, CA: midCA },
      lines: { AB: lineAB, BC: lineBC, CA: lineCA },
      axes: { AB: axisAB, BC: axisBC, CA: axisCA },
      circumcenter,
      circumradius,
      altitude: { ...altitude, baseLine, baseLen, apex: apexPt },
      area,
      medians: { A: medianA, B: medianB, C: medianC },
      steps
    };
  }

  // =========================================================================
  // Opzionale (spento di default): Circonferenza per centro e raggio / 3 punti
  // =========================================================================
  function circleThroughThreePoints(A, B, C) {
    const tri = analyzeTriangle(A, B, C);
    const O = tri.circumcenter;
    const r = tri.circumradius;
    const r2 = r.square();
    // (x - xO)^2 + (y - yO)^2 = r^2  => x^2 + y^2 + ax + by + c = 0
    const a = O.x.mul(Rational.of(-2));
    const b = O.y.mul(Rational.of(-2));
    const c = O.x.pow(2).add(O.y.pow(2)).sub(r2);
    return { center: O, radius: r, radiusSquared: r2, a, b, c };
  }

  const exportsObj = {
    Line,
    classifyPoint,
    distanceBetweenPoints,
    midpointOf,
    tableOfValues,
    pointBelongsToLine,
    lineThroughTwoPoints,
    checkCollinearity,
    intersectLines,
    analyzeLineRelations,
    lineThroughPointRel,
    perpendicularBisector,
    pointToLineDistance,
    distanceBetweenParallelLines,
    analyzeTriangle,
    circleThroughThreePoints
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
