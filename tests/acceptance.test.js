/**
 * acceptance.test.js
 * Automated test suite verifying all 27 acceptance criteria from §6 of graph-calculator-terze.md,
 * plus edge cases, Italian parser, equivalence checker, and future-topic modules.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const M = require('../js/math-exact.js');
const P = require('../js/parser.js');
const G = require('../js/geometry.js');
const F = require('../js/algebra-future.js');

const { Rational, Radical } = M;
const { parsePoint, parseLine, parseRational, parseRadical, checkAnswerEquivalence } = P;
const { Line } = G;

function lineFrom(str) {
  const { a, b, c } = parseLine(str);
  return new Line(a, b, c);
}

// =========================================================================
// §6 Criteri di accettazione (Tests 1–27)
// =========================================================================

test('#1: A(1;2), B(3;6) => m=2, retta y=2x', () => {
  const res = G.lineThroughTwoPoints(parsePoint('A(1;2)'), parsePoint('B(3;6)'));
  assert.ok(res.slope.eq(Rational.of(2)));
  assert.ok(res.line.equals(lineFrom('y=2x')));
  assert.equal(res.line.toExplicitString(), 'y = 2x');
});

test('#2: A(0;2), B(2;6) => m=2, y=2x+2', () => {
  const res = G.lineThroughTwoPoints(parsePoint('A(0;2)'), parsePoint('B(2;6)'));
  assert.ok(res.slope.eq(Rational.of(2)));
  assert.ok(res.line.equals(lineFrom('y=2x+2')));
});

test('#3: A(2;5), B(-2;5) => retta orizzontale y=5, m=0', () => {
  const res = G.lineThroughTwoPoints(parsePoint('A(2;5)'), parsePoint('B(-2;5)'));
  assert.equal(res.isHorizontal, true);
  assert.ok(res.slope.eq(Rational.ZERO));
  assert.ok(res.line.equals(lineFrom('y=5')));
  assert.equal(res.line.toExplicitString(), 'y = 5');
});

test('#4: A(3;1), B(3;-4) => retta verticale x=3, m non esiste', () => {
  const res = G.lineThroughTwoPoints(parsePoint('A(3;1)'), parsePoint('B(3;-4)'));
  assert.equal(res.isVertical, true);
  assert.equal(res.slope, null);
  assert.ok(res.line.equals(lineFrom('x=3')));
  assert.equal(res.line.toExplicitString(), 'x = 3');
});

test('#5: y=2x+1, punti x=-1,0,1,2 => (-1;-1), (0;1), (1;3), (2;5)', () => {
  const r = lineFrom('y=2x+1');
  const tbl = G.tableOfValues(r, [-1, 0, 1, 2]);
  const expected = [[-1, -1], [0, 1], [1, 3], [2, 5]];
  assert.equal(tbl.rows.length, 4);
  expected.forEach(([ex, ey], i) => {
    assert.ok(tbl.rows[i].x.eq(Rational.of(ex)));
    assert.ok(tbl.rows[i].y.eq(Rational.of(ey)));
  });
});

test('#6: y=2x+1, P(2;5) appartiene, Q(1;4) no', () => {
  const r = lineFrom('y=2x+1');
  assert.equal(G.pointBelongsToLine(r, parsePoint('P(2;5)')).belongs, true);
  assert.equal(G.pointBelongsToLine(r, parsePoint('Q(1;4)')).belongs, false);
});

test('#7: y=3x-2 e y=-x+6 => intersezione (2;4)', () => {
  const res = G.intersectLines(lineFrom('y=3x-2'), lineFrom('y=-x+6'));
  assert.equal(res.type, 'incidenti');
  assert.ok(res.point.x.eq(Rational.of(2)));
  assert.ok(res.point.y.eq(Rational.of(4)));
});

test('#8: 3x-y-7=0 e x+2y-7=0 => intersezione (3;2)', () => {
  const res = G.intersectLines(lineFrom('3x-y-7=0'), lineFrom('x+2y-7=0'));
  assert.equal(res.type, 'incidenti');
  assert.ok(res.point.x.eq(Rational.of(3)));
  assert.ok(res.point.y.eq(Rational.of(2)));
});

test('#9: y=3x+1 e y=3x-2 => parallele distinte', () => {
  const res = G.intersectLines(lineFrom('y=3x+1'), lineFrom('y=3x-2'));
  assert.equal(res.type, 'parallele');
  assert.equal(res.point, null);
});

test('#10: x+2y-4=0 e 2x+4y-8=0 => coincidenti', () => {
  const res = G.intersectLines(lineFrom('x+2y-4=0'), lineFrom('2x+4y-8=0'));
  assert.equal(res.type, 'coincidenti');
  assert.equal(res.point, null);
});

test('#11: r1:y=3x-1, r2:y=-1/3x+2, r3:y=3x+4, r4:y=-3x', () => {
  const res = G.analyzeLineRelations([
    { name: 'r1', line: lineFrom('y=3x-1') },
    { name: 'r2', line: lineFrom('y=-1/3x+2') },
    { name: 'r3', line: lineFrom('y=3x+4') },
    { name: 'r4', line: lineFrom('y=-3x') }
  ]);
  const rel = (a, b) => res.pairs.find(p => p.name1 === a && p.name2 === b).relation;
  assert.equal(rel('r1', 'r3'), 'parallele');
  assert.equal(rel('r1', 'r2'), 'perpendicolari');
  assert.equal(rel('r2', 'r3'), 'perpendicolari');
  assert.equal(rel('r1', 'r4'), 'nessuna');
  assert.equal(rel('r2', 'r4'), 'nessuna');
  assert.equal(rel('r3', 'r4'), 'nessuna');
});

test('#12: parallela a y=2x-1 per A(1;4) => y=2x+2', () => {
  const res = G.lineThroughPointRel(lineFrom('y=2x-1'), parsePoint('A(1;4)'), 'parallela');
  assert.ok(res.line.equals(lineFrom('y=2x+2')));
});

test('#13: perpendicolare a y=2x-1 per B(2;3) => y=-1/2x+4', () => {
  const res = G.lineThroughPointRel(lineFrom('y=2x-1'), parsePoint('B(2;3)'), 'perpendicolare');
  assert.ok(res.line.equals(lineFrom('y=-1/2x+4')));
});

test('#14: r: x+2y-2=0, P(4;0): || => y=-1/2x+2; perp => y=2x-8', () => {
  const r = lineFrom('x+2y-2=0');
  const Ppt = parsePoint('P(4;0)');
  const par = G.lineThroughPointRel(r, Ppt, 'parallela');
  const perp = G.lineThroughPointRel(r, Ppt, 'perpendicolare');
  assert.ok(par.line.equals(lineFrom('y=-1/2x+2')));
  assert.ok(perp.line.equals(lineFrom('y=2x-8')));
});

test('#15: r: y=x+1, P(5;0) => P not in r; perp y=-x+5; H(2;3)', () => {
  const r = lineFrom('y=x+1');
  const Ppt = parsePoint('P(5;0)');
  assert.equal(G.pointBelongsToLine(r, Ppt).belongs, false);
  const dRes = G.pointToLineDistance(Ppt, r);
  assert.ok(dRes.perpendicular.equals(lineFrom('y=-x+5')));
  assert.ok(dRes.foot.x.eq(Rational.of(2)));
  assert.ok(dRes.foot.y.eq(Rational.of(3)));
});

test('#16: A(1;2), B(5;6): asse => y=-x+7 (x+y-7=0)', () => {
  const res = G.perpendicularBisector(parsePoint('A(1;2)'), parsePoint('B(5;6)'));
  assert.ok(res.axis.equals(lineFrom('y=-x+7')));
  assert.ok(res.axis.equals(lineFrom('x+y-7=0')));
});

test('#17: A(0;0), B(4;2): asse => y=-2x+5; passa per C(1;3)', () => {
  const res = G.perpendicularBisector(parsePoint('A(0;0)'), parsePoint('B(4;2)'), parsePoint('C(1;3)'));
  assert.ok(res.axis.equals(lineFrom('y=-2x+5')));
  assert.equal(res.pointCheck.belongs, true);
});

test('#18: P(-3;1), 4x-3y+5=0 => d=2', () => {
  const res = G.pointToLineDistance(parsePoint('P(-3;1)'), lineFrom('4x-3y+5=0'));
  assert.ok(res.distance.eq(Radical.of(2)));
});

test('#19: P(2;-1), 3x+4y+8=0 => d=2', () => {
  const res = G.pointToLineDistance(parsePoint('P(2;-1)'), lineFrom('3x+4y+8=0'));
  assert.ok(res.distance.eq(Radical.of(2)));
});

test('#20: P(5;0), y=2x => H(1;2), d=2√5', () => {
  const res = G.pointToLineDistance(parsePoint('P(5;0)'), lineFrom('y=2x'));
  assert.ok(res.foot.x.eq(Rational.of(1)));
  assert.ok(res.foot.y.eq(Rational.of(2)));
  assert.ok(res.distance.eq(new Radical(Rational.of(2), 5n)));
  assert.equal(res.distance.toString(), '2√5');
});

test('#21: A(0;0), B(4;2), C(1;3): CA=CB=√10, h=√5, area=5', () => {
  const tri = G.analyzeTriangle(parsePoint('A(0;0)'), parsePoint('B(4;2)'), parsePoint('C(1;3)'), 'C');
  assert.ok(tri.sides.CA.distance.eq(new Radical(Rational.ONE, 10n)));
  assert.ok(tri.sides.BC.distance.eq(new Radical(Rational.ONE, 10n)));
  assert.ok(tri.isoscelesBases.includes('AB'));
  assert.ok(tri.altitude.distance.eq(new Radical(Rational.ONE, 5n)));
  assert.ok(tri.area.eq(Rational.of(5)));
});

test('#22: A(1;1), B(4;5), C(5;3): circocentro (5/2; 3)', () => {
  const tri = G.analyzeTriangle(parsePoint('A(1;1)'), parsePoint('B(4;5)'), parsePoint('C(5;3)'), 'C');
  assert.ok(tri.circumcenter.x.eq(new Rational(5n, 2n)));
  assert.ok(tri.circumcenter.y.eq(Rational.of(3)));
  assert.equal(tri.rightAngleAt, 'C');
  assert.ok(tri.altitude.distance.eq(Radical.of(2)));
  assert.ok(tri.area.eq(Rational.of(5)));
});

test('#23: A(0;0), B(2;1), C(6;3) => allineati, m=1/2', () => {
  const res = G.checkCollinearity(parsePoint('A(0;0)'), parsePoint('B(2;1)'), parsePoint('C(6;3)'));
  assert.equal(res.collinear, true);
  assert.ok(res.mAB.eq(new Rational(1n, 2n)));
});

test('#24: A(-2;-1), B(0;3), C(1;6) => non allineati', () => {
  const res = G.checkCollinearity(parsePoint('A(-2;-1)'), parsePoint('B(0;3)'), parsePoint('C(1;6)'));
  assert.equal(res.collinear, false);
});

test('#25: parallele y=2x+1 e y=2x-4 => distanza √5', () => {
  const res = G.distanceBetweenParallelLines(lineFrom('y=2x+1'), lineFrom('y=2x-4'));
  assert.equal(res.parallel, true);
  assert.ok(res.distance.eq(new Radical(Rational.ONE, 5n)));
});

test('#26: P(-2;6), Q(1;-3), R(2;-6), S(-1;2) => y=-3x; R sì, S no', () => {
  const l = G.lineThroughTwoPoints(parsePoint('P(-2;6)'), parsePoint('Q(1;-3)')).line;
  assert.ok(l.equals(lineFrom('y=-3x')));
  assert.equal(G.pointBelongsToLine(l, parsePoint('R(2;-6)')).belongs, true);
  assert.equal(G.pointBelongsToLine(l, parsePoint('S(-1;2)')).belongs, false);
});

test('#27: A(-2;1), B(4;4), P(2;3), Q(6;6) => y=1/2x+2; P sì, Q no', () => {
  const l = G.lineThroughTwoPoints(parsePoint('A(-2;1)'), parsePoint('B(4;4)')).line;
  assert.ok(l.equals(lineFrom('y=1/2x+2')));
  assert.equal(G.pointBelongsToLine(l, parsePoint('P(2;3)')).belongs, true);
  assert.equal(G.pointBelongsToLine(l, parsePoint('Q(6;6)')).belongs, false);
});

// =========================================================================
// Extra checks: Quadranti, Equivalenze Esercizio, Casi speciali, Moduli futuri
// =========================================================================

test('Quadranti e assi (orali 3A gruppo A1)', () => {
  assert.equal(G.classifyPoint(parsePoint('A(2;5)')).code, 'I');
  assert.equal(G.classifyPoint(parsePoint('B(-4;3)')).code, 'II');
  assert.equal(G.classifyPoint(parsePoint('C(-1;-6)')).code, 'III');
  assert.equal(G.classifyPoint(parsePoint('D(6;-2)')).code, 'IV');
  assert.equal(G.classifyPoint(parsePoint('E(0;3)')).code, 'asse-y');
  assert.equal(G.classifyPoint(parsePoint('F(-5;0)')).code, 'asse-x');
});

test('Equivalenza risposte in modalità Esercizio', () => {
  assert.equal(checkAnswerEquivalence(lineFrom('y=2x-8'), '2x-y-8=0', 'line').ok, true);
  assert.equal(checkAnswerEquivalence(lineFrom('y=2x-8'), 'y - 0 = 2(x - 4)', 'line').ok, true);
  assert.equal(checkAnswerEquivalence(new Radical(Rational.of(2), 5n), '10/√5', 'radical').ok, true);
  assert.equal(checkAnswerEquivalence(new Radical(Rational.of(2), 5n), '10/sqrt(5)', 'radical').ok, true);
  assert.equal(checkAnswerEquivalence(new Radical(Rational.of(2), 5n), 'sqrt(20)', 'radical').ok, true);
  assert.equal(checkAnswerEquivalence(null, 'non esiste', 'slope').ok, true);
  assert.equal(checkAnswerEquivalence(parsePoint('H(2;3)'), '2; 3', 'point').ok, true);
});

test('Casi con assi: parallele/perpendicolari a y=4 e x=-2, asse orizzontale/verticale', () => {
  const Gpt = parsePoint('G(3;-1)');
  assert.ok(G.lineThroughPointRel(lineFrom('y=4'), Gpt, 'parallela').line.equals(lineFrom('y=-1')));
  assert.ok(G.lineThroughPointRel(lineFrom('y=4'), Gpt, 'perpendicolare').line.equals(lineFrom('x=3')));
  assert.ok(G.lineThroughPointRel(lineFrom('x=-2'), parsePoint('H(5;2)'), 'parallela').line.equals(lineFrom('x=5')));
  assert.ok(G.perpendicularBisector(parsePoint('A(0;1)'), parsePoint('B(4;1)')).axis.equals(lineFrom('x=2')));
  assert.ok(G.perpendicularBisector(parsePoint('A(1;-2)'), parsePoint('B(1;4)')).axis.equals(lineFrom('y=1')));
});

test('Moduli futuri: Parabola, Disequazione 2° grado, Esponenziale/Logaritmo', () => {
  // Parabola y = x^2 - 4x + 3 => V(2;-1), radici 1 e 3
  const par = F.analyzeParabola(1, -4, 3, lineFrom('y=3'));
  assert.ok(par.vertex.x.eq(Rational.of(2)));
  assert.ok(par.vertex.y.eq(Rational.of(-1)));
  assert.equal(par.xIntersections.count, 2);
  assert.ok(par.xIntersections.roots[0].exact.eq(Rational.of(1)));
  assert.ok(par.xIntersections.roots[1].exact.eq(Rational.of(3)));
  assert.equal(par.lineIntersection.count, 2);

  // Disequazione x^2 - 4x + 3 <= 0 => 1 <= x <= 3
  const ineq = F.solveQuadraticInequality(1, -4, 3, '<=');
  assert.equal(ineq.intervals.length, 1);
  assert.equal(ineq.intervals[0].from, 1);
  assert.equal(ineq.intervals[0].to, 3);

  // Esponenziale 2^x = 8 => x = 3
  const expSol = F.solveExpLogEquation('exp', 2, 8);
  assert.equal(expSol.solvable, true);
  assert.equal(Math.round(expSol.xValue), 3);

  // Logaritmo log_2(x) = 3 => x = 8
  const logSol = F.solveExpLogEquation('log', 2, 3);
  assert.equal(logSol.solvable, true);
  assert.equal(Math.round(logSol.xValue), 8);
});
