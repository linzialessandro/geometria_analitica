/**
 * exercises.js
 * Preloaded exercise bank from real class materials (verifiche, simulazioni, brief, orali)
 * documented in graph-calculator-terze.md.
 * Solutions are never printed in the student worksheet; in app they appear only after a try
 * or when local "Vista docente" is toggled on.
 */
(function (root) {
  'use strict';

  const EXERCISES = [
    // --- Esempio guida (docente / 3F 3 nov) ---
    {
      id: 'guida-3f-ab',
      title: 'Retta per due punti (esempio guida)',
      source: 'Brief 3F, 3 novembre',
      level: '3F',
      tool: 'retta-2-punti',
      prompt: 'Dati i punti A(1; 2) e B(3; 6), trova il coefficiente angolare m e l’equazione della retta passante per A e B.',
      params: { A: 'A(1; 2)', B: 'B(3; 6)' },
      questions: [
        { label: 'Coefficiente angolare m', answerType: 'slope', expected: '2', placeholder: 'es. 2 oppure -1/2' },
        { label: 'Equazione della retta', answerType: 'line', expected: 'y=2x', placeholder: 'es. y=2x' }
      ],
      solutionSummary: 'm = 2, retta y = 2x (implicita: 2x − y = 0).'
    },
    {
      id: '3f-ver-es1',
      title: 'Riconoscere parallele e perpendicolari',
      source: 'Verifica 3F (1 dic), es. 1',
      level: '3F',
      tool: 'parallele-perp',
      prompt: 'Date r₁: y = 3x − 1, r₂: y = −1/3 x + 2, r₃: y = 3x + 4, r₄: y = −3x, stabilisci la relazione tra r₁ e r₃ e tra r₁ e r₂.',
      params: { lines: ['y=3x-1', 'y=-1/3x+2', 'y=3x+4', 'y=-3x'] },
      questions: [
        { label: 'Relazione tra r₁ e r₃', answerType: 'relation', expected: 'parallele', placeholder: 'parallele / perpendicolari / nessuna' },
        { label: 'Relazione tra r₁ e r₂', answerType: 'relation', expected: 'perpendicolari', placeholder: 'parallele / perpendicolari / nessuna' }
      ],
      solutionSummary: 'r₁ ∥ r₃ (m = 3); r₂ ⊥ r₁ e r₂ ⊥ r₃ (m = −1/3); r₄ nessuna.'
    },
    {
      id: '3f-ver-es2a',
      title: 'Parallela e perpendicolare per un punto',
      source: 'Verifica 3F (1 dic), es. 2',
      level: '3F',
      tool: 'retta-punto-rel',
      prompt: 'Data r: y = 2x − 1, trova: (a) la parallela per A(1; 4); (b) la perpendicolare per B(2; 3).',
      params: { line: 'y=2x-1', P: 'A(1; 4)', rel: 'parallela' },
      questions: [
        { label: 'Parallela per A(1; 4)', answerType: 'line', expected: 'y=2x+2', placeholder: 'es. y=2x+2' },
        { label: 'Perpendicolare per B(2; 3)', answerType: 'line', expected: 'y=-1/2x+4', placeholder: 'es. y=-1/2x+4' }
      ],
      solutionSummary: 'Parallela: y = 2x + 2; Perpendicolare: y = −1/2 x + 4.'
    },
    {
      id: '3f-ver-es3',
      title: 'Intersezione di due rette (sistema)',
      source: 'Verifica 3F (1 dic), es. 3 / 3A / 3B',
      level: '3F',
      tool: 'intersezione',
      prompt: 'Trova il punto di intersezione tra r: y = 3x − 2 e s: y = −x + 6.',
      params: { r1: 'y=3x-2', r2: 'y=-x+6' },
      questions: [
        { label: 'Punto di intersezione', answerType: 'point', expected: { x: '2', y: '4' }, placeholder: 'es. (2; 4)' }
      ],
      solutionSummary: 'Intersezione in (2; 4).'
    },
    {
      id: '3f-ver-es4',
      title: 'Appartenenza e piede H della perpendicolare',
      source: 'Verifica 3F (1 dic), es. 4',
      level: '3F',
      tool: 'distanza-punto-retta',
      prompt: 'Data r: y = x + 1 e il punto P(5; 0): (a) P appartiene a r? (b) Trova la perpendicolare per P. (c) Trova il piede H.',
      params: { line: 'y=x+1', P: 'P(5; 0)' },
      questions: [
        { label: 'P appartiene alla retta? (sì/no)', answerType: 'boolean', expected: false, placeholder: 'sì oppure no' },
        { label: 'Retta perpendicolare per P', answerType: 'line', expected: 'y=-x+5', placeholder: 'es. y=-x+5' },
        { label: 'Piede H della perpendicolare', answerType: 'point', expected: { x: '2', y: '3' }, placeholder: 'es. H(2; 3)' }
      ],
      solutionSummary: 'P ∉ r; perpendicolare s: y = −x + 5; piede H(2; 3).'
    },
    {
      id: '3f-allineamento',
      title: 'Tre punti allineati',
      source: 'Brief 3F, 9–10 novembre',
      level: '3F',
      tool: 'allineamento',
      prompt: 'Verifica se i punti A(0; 0), B(2; 1) e C(6; 3) sono allineati confrontando le pendenze.',
      params: { A: 'A(0; 0)', B: 'B(2; 1)', C: 'C(6; 3)' },
      questions: [
        { label: 'Sono allineati? (sì/no)', answerType: 'boolean', expected: true, placeholder: 'sì oppure no' },
        { label: 'Pendenza comune m', answerType: 'slope', expected: '1/2', placeholder: 'es. 1/2' }
      ],
      solutionSummary: 'Sì, allineati con m = 1/2 sulla retta y = 1/2 x.'
    },
    {
      id: '3f-casi-assi',
      title: 'Rette parallele e perpendicolari agli assi',
      source: 'Scheda 3F, 17 novembre',
      level: '3F',
      tool: 'retta-punto-rel',
      prompt: 'Data la retta orizzontale y = 4 e il punto G(3; −1), trova la parallela e la perpendicolare per G.',
      params: { line: 'y=4', P: 'G(3; -1)', rel: 'perpendicolare' },
      questions: [
        { label: 'Parallela a y = 4 per G(3; −1)', answerType: 'line', expected: 'y=-1', placeholder: 'es. y=-1' },
        { label: 'Perpendicolare a y = 4 per G(3; −1)', answerType: 'line', expected: 'x=3', placeholder: 'es. x=3' }
      ],
      solutionSummary: 'Parallela: y = −1; Perpendicolare: x = 3.'
    },

    // --- 3A / 3B Completo ---
    {
      id: '3b-ver-es1',
      title: 'Distanza punto-retta (formula)',
      source: 'Verifica 3B (23 nov) / 3A (1 dic), es. 1',
      level: '3AB',
      tool: 'distanza-punto-retta',
      prompt: 'Calcola la distanza del punto P(−3; 1) dalla retta 4x − 3y + 5 = 0.',
      params: { line: '4x-3y+5=0', P: 'P(-3; 1)' },
      questions: [
        { label: 'Distanza d(P, r)', answerType: 'radical', expected: '2', placeholder: 'es. 2 oppure 2√5' }
      ],
      solutionSummary: 'd = |4(−3) − 3(1) + 5| / √(16 + 9) = 10 / 5 = 2.'
    },
    {
      id: '3b-ver-es2',
      title: 'Intersezione in forma implicita',
      source: 'Verifica 3B (23 nov) / 3A (1 dic), es. 2',
      level: '3AB',
      tool: 'intersezione',
      prompt: 'Determina il punto di intersezione Q tra 3x − y − 7 = 0 e x + 2y − 7 = 0.',
      params: { r1: '3x-y-7=0', r2: 'x+2y-7=0' },
      questions: [
        { label: 'Punto di intersezione Q', answerType: 'point', expected: { x: '3', y: '2' }, placeholder: 'es. (3; 2)' }
      ],
      solutionSummary: 'Q(3; 2).'
    },
    {
      id: '3b-ver-es3',
      title: 'Parallela e perpendicolare da implicita',
      source: 'Verifica 3B (23 nov) / 3A (1 dic), es. 3',
      level: '3AB',
      tool: 'retta-punto-rel',
      prompt: 'Data r: x + 2y − 2 = 0 e P(4; 0), trova la parallela e la perpendicolare a r passanti per P.',
      params: { line: 'x+2y-2=0', P: 'P(4; 0)', rel: 'perpendicolare' },
      questions: [
        { label: 'Retta parallela per P', answerType: 'line', expected: 'y=-1/2x+2', placeholder: 'es. y=-1/2x+2 o x+2y-4=0' },
        { label: 'Retta perpendicolare per P', answerType: 'line', expected: 'y=2x-8', placeholder: 'es. y=2x-8 o 2x-y-8=0' }
      ],
      solutionSummary: 'Parallela: y = −1/2 x + 2 (x + 2y − 4 = 0); Perpendicolare: y = 2x − 8 (2x − y − 8 = 0).'
    },
    {
      id: '3b-ver-es4',
      title: 'Problema sul triangolo (isoscele, asse, altezza, area)',
      source: 'Verifica 3B (23 nov) / 3A (1 dic), es. 4',
      level: '3AB',
      tool: 'triangolo',
      prompt: 'Dato il triangolo A(0; 0), B(4; 2), C(1; 3): calcola CA, l’asse di AB, l’altezza h relativa ad AB e l’area.',
      params: { A: 'A(0; 0)', B: 'B(4; 2)', C: 'C(1; 3)' },
      questions: [
        { label: 'Lunghezza CA', answerType: 'radical', expected: '√10', placeholder: 'es. √10 o sqrt(10)' },
        { label: 'Asse del segmento AB', answerType: 'line', expected: 'y=-2x+5', placeholder: 'es. y=-2x+5' },
        { label: 'Altezza h relativa ad AB', answerType: 'radical', expected: '√5', placeholder: 'es. √5' },
        { label: 'Area del triangolo', answerType: 'rational', expected: '5', placeholder: 'es. 5' }
      ],
      solutionSummary: 'CA = CB = √10 (isoscele su AB); asse AB: y = −2x + 5 (passa per C); h = √5; Area = 5.'
    },
    {
      id: '3b-lezione-dist',
      title: 'Distanza punto-retta: metodo lungo e formula',
      source: 'Lezione 3B, 29 ottobre',
      level: '3AB',
      tool: 'distanza-punto-retta',
      prompt: 'Dati P(5; 0) e r: y = 2x, trova il piede H della perpendicolare e la distanza d(P, r).',
      params: { line: 'y=2x', P: 'P(5; 0)' },
      questions: [
        { label: 'Piede H', answerType: 'point', expected: { x: '1', y: '2' }, placeholder: 'es. H(1; 2)' },
        { label: 'Distanza PH', answerType: 'radical', expected: '2√5', placeholder: 'es. 2√5 o 10/√5' }
      ],
      solutionSummary: 'Perpendicolare y = −1/2(x − 5); H(1; 2); d = 2√5.'
    },
    {
      id: '3b-circocentro',
      title: 'Circocentro di un triangolo',
      source: 'Ripasso 3B, 12 novembre',
      level: '3AB',
      tool: 'triangolo',
      prompt: 'Dato il triangolo A(1; 1), B(4; 5), C(5; 3), trova il circocentro (intersezione degli assi) e l’area.',
      params: { A: 'A(1; 1)', B: 'B(4; 5)', C: 'C(5; 3)' },
      questions: [
        { label: 'Circocentro O', answerType: 'point', expected: { x: '5/2', y: '3' }, placeholder: 'es. (5/2; 3)' },
        { label: 'Area del triangolo', answerType: 'rational', expected: '5', placeholder: 'es. 5' }
      ],
      solutionSummary: 'Circocentro O(5/2; 3) (punto medio di AB, angolo retto in C); Area = 5.'
    },
    {
      id: '3b-dist-parallele',
      title: 'Distanza tra due rette parallele',
      source: 'Ripasso 3B, 12 novembre, es. 3',
      level: '3AB',
      tool: 'distanza-parallele',
      prompt: 'Calcola la distanza tra le rette parallele r₁: y = 2x + 1 e r₂: y = 2x − 4.',
      params: { r1: 'y=2x+1', r2: 'y=2x-4' },
      questions: [
        { label: 'Distanza tra r₁ e r₂', answerType: 'radical', expected: '√5', placeholder: 'es. √5' }
      ],
      solutionSummary: 'Punto (0; 1) su r₁, formula su 2x − y − 4 = 0 ⇒ d = 5/√5 = √5.'
    },
    {
      id: '3a-orali-c1',
      title: 'Retta per due punti e appartenenza',
      source: 'Orali 3A CUC, gruppo C1',
      level: '3F',
      tool: 'retta-2-punti',
      prompt: 'Trova la retta per P(−2; 6) e Q(1; −3) e verifica se R(2; −6) appartiene alla retta.',
      params: { A: 'P(-2; 6)', B: 'Q(1; -3)' },
      questions: [
        { label: 'Equazione della retta', answerType: 'line', expected: 'y=-3x', placeholder: 'es. y=-3x' },
        { label: 'R(2; −6) appartiene? (sì/no)', answerType: 'boolean', expected: true, placeholder: 'sì oppure no' }
      ],
      solutionSummary: 'Retta y = −3x; R(2; −6) appartiene (sì).'
    }
  ];

  const exportsObj = { EXERCISES };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
