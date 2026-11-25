/**
 * math-exact.js
 * Exact rational arithmetic (BigInt) and simplified quadratic radicals
 * with Italian mathematical formatting (semicolon for points, comma for decimals).
 */
(function (root) {
  'use strict';

  function absBigInt(x) {
    return x < 0n ? -x : x;
  }

  function gcdBigInt(a, b) {
    a = absBigInt(a);
    b = absBigInt(b);
    while (b !== 0n) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function lcmBigInt(a, b) {
    if (a === 0n || b === 0n) return 0n;
    return absBigInt((a / gcdBigInt(a, b)) * b);
  }

  /**
   * Factor out largest square from non-negative BigInt n:
   * returns { outside, inside } such that n = outside^2 * inside and inside is square-free.
   */
  function simplifySquareRootBigInt(n) {
    if (n < 0n) throw new Error('Radice quadrata di numero negativo');
    if (n === 0n) return { outside: 0n, inside: 1n };
    if (n === 1n) return { outside: 1n, inside: 1n };

    let outside = 1n;
    let rem = n;

    // Extract factors of 2
    while (rem % 4n === 0n) {
      outside *= 2n;
      rem /= 4n;
    }
    // Extract odd square factors
    let f = 3n;
    while (f * f <= rem) {
      const sq = f * f;
      while (rem % sq === 0n) {
        outside *= f;
        rem /= sq;
      }
      f += 2n;
    }
    return { outside, inside: rem };
  }

  function formatItalianDecimal(num, maxDecimals) {
    if (maxDecimals === undefined) maxDecimals = 3;
    if (!Number.isFinite(num)) return 'non definito';
    const rounded = Number(num.toFixed(maxDecimals));
    if (Object.is(rounded, -0)) return '0';
    let s = rounded.toFixed(maxDecimals);
    if (s.includes('.')) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s.replace('.', ',').replace('-', '−');
  }

  class Rational {
    constructor(n, d) {
      if (d === undefined) d = 1n;
      n = BigInt(n);
      d = BigInt(d);
      if (d === 0n) throw new Error('Divisione per zero');
      if (d < 0n) {
        n = -n;
        d = -d;
      }
      if (n === 0n) {
        this.n = 0n;
        this.d = 1n;
      } else {
        const g = gcdBigInt(n, d);
        this.n = n / g;
        this.d = d / g;
      }
    }

    static of(n, d) {
      if (n instanceof Rational && d === undefined) return n;
      return new Rational(n, d === undefined ? 1n : d);
    }

    static fromNumber(num, maxDen) {
      if (maxDen === undefined) maxDen = 1000;
      if (!Number.isFinite(num)) throw new Error('Numero non finito');
      if (Number.isInteger(num)) return new Rational(BigInt(num), 1n);
      // Continued fraction approximation for clean snapped rationals
      const sign = num < 0 ? -1 : 1;
      let x = Math.abs(num);
      let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
      let b = x;
      for (let i = 0; i < 16; i++) {
        const a = Math.floor(b);
        const h = a * h1 + h2;
        const k = a * k1 + k2;
        if (k > maxDen) break;
        h2 = h1; h1 = h;
        k2 = k1; k1 = k;
        if (Math.abs(x - h1 / k1) < 1e-10) break;
        const frac = b - a;
        if (frac < 1e-12) break;
        b = 1 / frac;
      }
      return new Rational(BigInt(sign * h1), BigInt(k1));
    }

    isZero() { return this.n === 0n; }
    isOne() { return this.n === 1n && this.d === 1n; }
    isMinusOne() { return this.n === -1n && this.d === 1n; }
    isInt() { return this.d === 1n; }
    sign() { return this.n < 0n ? -1 : (this.n > 0n ? 1 : 0); }

    neg() { return new Rational(-this.n, this.d); }
    abs() { return new Rational(absBigInt(this.n), this.d); }

    add(other) {
      other = Rational.of(other);
      return new Rational(this.n * other.d + other.n * this.d, this.d * other.d);
    }
    sub(other) {
      other = Rational.of(other);
      return new Rational(this.n * other.d - other.n * this.d, this.d * other.d);
    }
    mul(other) {
      other = Rational.of(other);
      return new Rational(this.n * other.n, this.d * other.d);
    }
    div(other) {
      other = Rational.of(other);
      if (other.isZero()) throw new Error('Divisione per zero');
      return new Rational(this.n * other.d, this.d * other.n);
    }
    inv() {
      if (this.isZero()) throw new Error('Reciproco di zero');
      return new Rational(this.d, this.n);
    }
    pow(exp) {
      if (!Number.isInteger(exp)) throw new Error('Esponente non intero');
      if (exp === 0) return Rational.ONE;
      if (exp < 0) return this.inv().pow(-exp);
      let base = this;
      let res = Rational.ONE;
      let e = exp;
      while (e > 0) {
        if (e & 1) res = res.mul(base);
        base = base.mul(base);
        e >>= 1;
      }
      return res;
    }

    eq(other) {
      other = Rational.of(other);
      return this.n === other.n && this.d === other.d;
    }
    cmp(other) {
      other = Rational.of(other);
      const diff = this.n * other.d - other.n * this.d;
      return diff < 0n ? -1 : (diff > 0n ? 1 : 0);
    }
    lt(other) { return this.cmp(other) < 0; }
    lte(other) { return this.cmp(other) <= 0; }
    gt(other) { return this.cmp(other) > 0; }
    gte(other) { return this.cmp(other) >= 0; }

    toNumber() {
      return Number(this.n) / Number(this.d);
    }

    toString() {
      if (this.d === 1n) return this.n.toString();
      return `${this.n}/${this.d}`;
    }

    toPrettyString() {
      if (this.d === 1n) return this.n < 0n ? `−${-this.n}` : this.n.toString();
      const sign = this.n < 0n ? '−' : '';
      return `${sign}${absBigInt(this.n)}/${this.d}`;
    }

    toHTML() {
      if (this.d === 1n) {
        return this.n < 0n ? `−${-this.n}` : this.n.toString();
      }
      const sign = this.n < 0n ? '−' : '';
      return `${sign}<span class="frac"><span class="num">${absBigInt(this.n)}</span><span class="den">${this.d}</span></span>`;
    }

    toApproxItalian(decimals) {
      return formatItalianDecimal(this.toNumber(), decimals === undefined ? 3 : decimals);
    }
  }

  Rational.ZERO = new Rational(0n, 1n);
  Rational.ONE = new Rational(1n, 1n);
  Rational.MINUS_ONE = new Rational(-1n, 1n);

  /**
   * Exact simplified quadratic radical: coef * sqrt(radicand)
   * where coef is a Rational and radicand >= 1n is square-free.
   */
  class Radical {
    constructor(coef, radicand) {
      coef = Rational.of(coef);
      radicand = radicand === undefined ? 1n : BigInt(radicand);
      if (radicand < 0n) throw new Error('Radicando negativo');
      if (coef.isZero() || radicand === 0n) {
        this.coef = Rational.ZERO;
        this.radicand = 1n;
      } else {
        const { outside, inside } = simplifySquareRootBigInt(radicand);
        this.coef = coef.mul(Rational.of(outside));
        this.radicand = inside;
      }
    }

    static of(val) {
      if (val instanceof Radical) return val;
      if (val instanceof Rational) return new Radical(val, 1n);
      return new Radical(Rational.of(val), 1n);
    }

    static sqrtOfRational(r) {
      r = Rational.of(r);
      if (r.sign() < 0) throw new Error('Radice di numero negativo');
      if (r.isZero()) return Radical.ZERO;
      // sqrt(n/d) = sqrt(n*d) / d
      const prod = r.n * r.d;
      const { outside, inside } = simplifySquareRootBigInt(prod);
      return new Radical(new Rational(outside, r.d), inside);
    }

    isZero() { return this.coef.isZero(); }
    isRational() { return this.radicand === 1n; }
    sign() { return this.coef.sign(); }

    neg() { return new Radical(this.coef.neg(), this.radicand); }
    abs() { return new Radical(this.coef.abs(), this.radicand); }

    mul(other) {
      other = Radical.of(other);
      return new Radical(this.coef.mul(other.coef), this.radicand * other.radicand);
    }

    div(other) {
      other = Radical.of(other);
      if (other.isZero()) throw new Error('Divisione per zero');
      // (c1*sqrt(r1)) / (c2*sqrt(r2)) = (c1 / (c2*r2)) * sqrt(r1*r2)
      const newCoef = this.coef.div(other.coef.mul(Rational.of(other.radicand)));
      return new Radical(newCoef, this.radicand * other.radicand);
    }

    square() {
      return this.coef.mul(this.coef).mul(Rational.of(this.radicand));
    }

    eq(other) {
      other = Radical.of(other);
      return this.coef.eq(other.coef) && this.radicand === other.radicand;
    }

    toNumber() {
      return this.coef.toNumber() * Math.sqrt(Number(this.radicand));
    }

    toString() {
      if (this.isZero()) return '0';
      if (this.radicand === 1n) return this.coef.toString();
      const sign = this.coef.n < 0n ? '-' : '';
      const an = absBigInt(this.coef.n);
      const d = this.coef.d;
      const top = an === 1n ? `√${this.radicand}` : `${an}√${this.radicand}`;
      if (d === 1n) return `${sign}${top}`;
      return `${sign}${top}/${d}`;
    }

    toHTML() {
      if (this.isZero()) return '0';
      if (this.radicand === 1n) return this.coef.toHTML();
      const sign = this.coef.n < 0n ? '−' : '';
      const an = absBigInt(this.coef.n);
      const d = this.coef.d;
      const rad = `<span class="sqrt"><span class="rad-sign">√</span><span class="rad-body">${this.radicand}</span></span>`;
      const top = an === 1n ? rad : `${an}${rad}`;
      if (d === 1n) return `${sign}${top}`;
      return `${sign}<span class="frac"><span class="num">${top}</span><span class="den">${d}</span></span>`;
    }

    toApproxItalian(decimals) {
      return formatItalianDecimal(this.toNumber(), decimals === undefined ? 3 : decimals);
    }
  }

  Radical.ZERO = new Radical(Rational.ZERO, 1n);
  Radical.ONE = new Radical(Rational.ONE, 1n);

  function formatPointStr(pt, label) {
    const prefix = label ? label : '';
    return `${prefix}(${pt.x.toString()}; ${pt.y.toString()})`;
  }

  function formatPointHTML(pt, label) {
    const prefix = label ? `<strong>${label}</strong>` : '';
    return `${prefix}(${pt.x.toHTML()}; ${pt.y.toHTML()})`;
  }

  const exportsObj = {
    absBigInt,
    gcdBigInt,
    lcmBigInt,
    simplifySquareRootBigInt,
    formatItalianDecimal,
    Rational,
    Radical,
    formatPointStr,
    formatPointHTML
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
