/**
 * app.js
 * Main UI controller for "Laboratorio di Geometria Analitica — Classi Terze".
 * Works offline both via file:// and http(s)://.
 */
(function (root) {
  'use strict';

  const GC = root.GraphCalc;
  const {
    Rational, Radical, formatPointStr, formatPointHTML, formatItalianDecimal,
    parsePoint, parseLine, parseRational, checkAnswerEquivalence,
    Line, classifyPoint, distanceBetweenPoints, midpointOf, tableOfValues,
    pointBelongsToLine, lineThroughTwoPoints, checkCollinearity, intersectLines,
    analyzeLineRelations, lineThroughPointRel, perpendicularBisector,
    pointToLineDistance, distanceBetweenParallelLines, analyzeTriangle,
    circleThroughThreePoints,
    analyzeParabola, solveQuadraticInequality, solveExpLogEquation,
    EXERCISES, IsometricGraph
  } = GC;

  // =========================================================================
  // Tool registry
  // =========================================================================
  const TOOLS = [
    // Base (3F + 3A/3B)
    { id: 'retta-2-punti', label: 'Retta per 2 punti', group: 'base', minLevel: '3F' },
    { id: 'retta-mq', label: 'y = mx + q e tabella', group: 'base', minLevel: '3F' },
    { id: 'punti-quadranti', label: 'Punti e quadranti', group: 'base', minLevel: '3F' },
    { id: 'appartenenza', label: 'Appartenenza', group: 'base', minLevel: '3F' },
    { id: 'allineamento', label: '3 punti allineati', group: 'base', minLevel: '3F' },
    { id: 'intersezione', label: 'Intersezione rette', group: 'base', minLevel: '3F' },
    { id: 'parallele-perp', label: 'Parallele e ⊥', group: 'base', minLevel: '3F' },
    { id: 'retta-punto-rel', label: 'Retta per P (∥ / ⊥)', group: 'base', minLevel: '3F' },
    { id: 'distanza-punto-retta', label: 'Piede H / Dist. P-retta', group: 'base', minLevel: '3F' },

    // Completo (3A / 3B)
    { id: 'distanza-medio', label: 'Distanza e punto medio', group: '3AB', minLevel: '3AB' },
    { id: 'asse-segmento', label: 'Asse del segmento', group: '3AB', minLevel: '3AB' },
    { id: 'distanza-parallele', label: 'Dist. rette parallele', group: '3AB', minLevel: '3AB' },
    { id: 'triangolo', label: 'Triangolo e circocentro', group: '3AB', minLevel: '3AB' },

    // Opzionale (spento di default)
    { id: 'circonferenza', label: 'Circonferenza (3 punti)', group: 'optional', minLevel: '3AB', optionalKey: 'circle' },

    // Prossimi argomenti (programma ufficiale, da svolgere)
    { id: 'parabola', label: 'Parabola', group: 'future', minLevel: '3F', future: true },
    { id: 'disequazione', label: 'Disequazioni 2° grado', group: 'future', minLevel: '3F', future: true },
    { id: 'exp-log', label: 'Esponenziali e logaritmi', group: 'future', minLevel: '3F', future: true }
  ];

  // =========================================================================
  // Application State
  // =========================================================================
  const STORAGE_KEY = 'geo_analitica_terze_prefs_v1';

  const state = {
    level: '3AB',         // '3F' | '3AB'
    mode: 'esplora',      // 'esplora' | 'guidato' | 'esercizio'
    tool: 'retta-2-punti',
    guidedStepCount: 1,
    exerciseId: EXERCISES[0].id,
    exerciseChecked: false,
    exerciseRevealed: false,
    options: {
      lim: false,
      teacher: false,
      median: false,
      circle: false
    },
    // Per-tool mutable inputs
    inputs: {
      'retta-2-punti': { A: 'A(1; 2)', B: 'B(3; 6)', showTriangle: true },
      'retta-mq': { kind: 'esplicita', m: '2', q: '1', k: '3', h: '2', xTable: ['-1', '0', '1', '2'] },
      'punti-quadranti': { pts: ['A(2; 5)', 'B(-4; 3)', 'C(-1; -6)', 'D(6; -2)', 'E(0; 3)', 'F(-5; 0)'] },
      'appartenenza': { line: 'y=2x+1', P: 'P(2; 5)' },
      'allineamento': { A: 'A(0; 0)', B: 'B(2; 1)', C: 'C(6; 3)' },
      'intersezione': { r1: 'y=3x-2', r2: 'y=-x+6' },
      'parallele-perp': { lines: ['y=3x-1', 'y=-1/3x+2', 'y=3x+4', 'y=-3x'] },
      'retta-punto-rel': { line: 'x+2y-2=0', P: 'P(4; 0)', rel: 'perpendicolare' },
      'distanza-punto-retta': { line: 'y=2x', P: 'P(5; 0)', onlyFoot: false },
      'distanza-medio': { A: 'A(0; 0)', B: 'B(4; 2)', C: 'C(1; 3)', showC: false },
      'asse-segmento': { A: 'A(0; 0)', B: 'B(4; 2)', C: 'C(1; 3)', checkC: true },
      'distanza-parallele': { r1: 'y=2x+1', r2: 'y=2x-4' },
      'triangolo': {
        A: 'A(0; 0)', B: 'B(4; 2)', C: 'C(1; 3)',
        baseApex: 'C',
        showMidpoints: false,
        showAxes: true,
        showCircumcenter: false,
        showAltitude: true,
        showVertexLine: false,
        vertexLineRel: 'perpendicolare',
        showMedian: false
      },
      'circonferenza': { A: 'A(1; 1)', B: 'B(4; 5)', C: 'C(5; 3)' },
      'parabola': { a: '1', b: '-4', c: '3', line: 'y=3', useLine: false },
      'disequazione': { a: '1', b: '-4', c: '3', op: '<=' },
      'exp-log': { kind: 'exp', base: '2', rhs: '8' }
    }
  };

  let graph = null;
  let lastFitPoints = [];

  // =========================================================================
  // Persistence (localStorage only, optional & clearable)
  // =========================================================================
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.level === '3F' || saved.level === '3AB') state.level = saved.level;
      if (saved.options) Object.assign(state.options, saved.options);
    } catch (_) { /* ignore storage errors */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level: state.level,
        options: state.options
      }));
    } catch (_) { /* ignore */ }
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function lineFromStr(str) {
    const { a, b, c } = parseLine(str);
    return new Line(a, b, c);
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isToolVisible(t) {
    if (t.optionalKey && !state.options[t.optionalKey]) return false;
    if (state.level === '3F' && t.minLevel === '3AB') return false;
    return true;
  }

  // =========================================================================
  // Tool Bar & Topbar Rendering
  // =========================================================================
  function renderToolBar() {
    const container = document.getElementById('tool-list');
    container.innerHTML = '';

    const visible = TOOLS.filter(isToolVisible);
    if (!visible.some(t => t.id === state.tool)) {
      state.tool = visible[0].id;
    }

    let lastGroup = null;
    for (const t of visible) {
      if (lastGroup !== null && t.group !== lastGroup) {
        const sep = document.createElement('span');
        sep.className = 'tool-sep';
        container.appendChild(sep);
      }
      if (t.group !== lastGroup) {
        const tag = document.createElement('span');
        tag.className = 'tool-group-tag' + (t.future ? ' future-tag' : '');
        tag.textContent = t.group === 'base' ? 'Rette'
          : t.group === '3AB' ? '3A–3B'
          : t.group === 'optional' ? 'Opz.'
          : 'Prossimi';
        container.appendChild(tag);
        lastGroup = t.group;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool-pill' + (t.future ? ' future-pill' : '') + (t.id === state.tool ? ' active' : '');
      btn.textContent = (t.id === 'distanza-punto-retta' && state.level === '3F')
        ? 'Piede H della ⊥'
        : t.label;
      btn.dataset.toolId = t.id;
      btn.addEventListener('click', () => {
        state.tool = t.id;
        state.guidedStepCount = 1;
        renderToolBar();
        renderToolInputs();
        computeAndRender(true);
      });
      container.appendChild(btn);
    }
  }

  function syncTopbarButtons() {
    document.querySelectorAll('[data-level]').forEach(btn => {
      const active = btn.dataset.level === state.level;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-mode]').forEach(btn => {
      const active = btn.dataset.mode === state.mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    document.body.classList.toggle('lim-mode', state.options.lim);
  }

  // =========================================================================
  // Exercise Mode Panel
  // =========================================================================
  function getFilteredExercises() {
    if (state.level === '3F') {
      return EXERCISES.filter(ex => ex.level === '3F');
    }
    return EXERCISES;
  }

  function renderExerciseBox() {
    const box = document.getElementById('exercise-box');
    if (state.mode !== 'esercizio') {
      box.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');

    const list = getFilteredExercises();
    let ex = list.find(e => e.id === state.exerciseId) || list[0];
    state.exerciseId = ex.id;

    const optionsHTML = list.map(e =>
      `<option value="${e.id}" ${e.id === ex.id ? 'selected' : ''}>${escapeHTML(e.title)} — ${escapeHTML(e.source)}</option>`
    ).join('');

    const qHTML = ex.questions.map((q, idx) => `
      <div class="q-row field">
        <label for="ex-q-${idx}">${escapeHTML(q.label)}</label>
        <input type="text" id="ex-q-${idx}" placeholder="${escapeHTML(q.placeholder)}" autocomplete="off">
        <div class="q-feedback" id="ex-fb-${idx}"></div>
      </div>
    `).join('');

    box.innerHTML = `
      <div class="field">
        <label for="ex-select">Scegli un esercizio di classe</label>
        <select id="ex-select">${optionsHTML}</select>
      </div>
      <div class="exercise-prompt">
        <div class="exercise-source">${escapeHTML(ex.source)}</div>
        <div>${escapeHTML(ex.prompt)}</div>
      </div>
      <div id="ex-questions">${qHTML}</div>
      <div class="btn-row">
        <button type="button" id="btn-check-ex" class="btn-primary">Controlla risposta</button>
        <button type="button" id="btn-reveal-ex" class="btn-secondary">${state.exerciseRevealed ? 'Nascondi passaggi' : 'Mostra disegno e passaggi'}</button>
      </div>
      <div id="ex-teacher-sol" class="result-item ok ${state.options.teacher ? '' : 'hidden'}" style="margin-top:10px">
        <div class="result-label">Vista docente — Soluzione</div>
        <div class="result-value small">${escapeHTML(ex.solutionSummary)}</div>
      </div>
    `;

    document.getElementById('ex-select').addEventListener('change', (e) => {
      state.exerciseId = e.target.value;
      state.exerciseChecked = false;
      state.exerciseRevealed = false;
      loadExerciseIntoTool(list.find(x => x.id === state.exerciseId));
      renderExerciseBox();
      computeAndRender(true);
    });

    document.getElementById('btn-check-ex').addEventListener('click', () => {
      let allOk = true;
      ex.questions.forEach((q, idx) => {
        const val = document.getElementById(`ex-q-${idx}`).value;
        const fb = document.getElementById(`ex-fb-${idx}`);
        const res = checkAnswerEquivalence(q.expected, val, q.answerType);
        if (res.ok) {
          fb.className = 'q-feedback ok';
          fb.textContent = '✓ Esatto! Ottimo lavoro.';
        } else {
          allOk = false;
          fb.className = 'q-feedback retry';
          fb.textContent = res.reason
            ? `Quasi: ${res.reason}`
            : 'Non coincide ancora. Riprova oppure guarda il disegno e i passaggi per capire dove sistemare.';
        }
      });
      state.exerciseChecked = true;
      if (allOk) {
        state.exerciseRevealed = true;
      }
      updateExerciseVisibility();
    });

    document.getElementById('btn-reveal-ex').addEventListener('click', () => {
      state.exerciseRevealed = !state.exerciseRevealed;
      document.getElementById('btn-reveal-ex').textContent = state.exerciseRevealed
        ? 'Nascondi passaggi' : 'Mostra disegno e passaggi';
      updateExerciseVisibility();
    });

    updateExerciseVisibility();
  }

  function loadExerciseIntoTool(ex) {
    if (!ex) return;
    state.tool = ex.tool;
    Object.assign(state.inputs[ex.tool], ex.params);
    renderToolBar();
    renderToolInputs();
  }

  function updateExerciseVisibility() {
    const showResults = state.mode !== 'esercizio' || state.exerciseRevealed || state.options.teacher;
    document.getElementById('results-box').classList.toggle('hidden', !showResults);
    document.getElementById('steps-box').classList.toggle('hidden', !showResults);
    document.getElementById('tool-inputs').classList.toggle('hidden', state.mode === 'esercizio' && !state.exerciseRevealed);
  }

  // =========================================================================
  // Tool Input Forms
  // =========================================================================
  function renderToolInputs() {
    const t = TOOLS.find(x => x.id === state.tool);
    document.getElementById('tool-title').textContent =
      (t.id === 'distanza-punto-retta' && state.level === '3F') ? 'Piede H della perpendicolare' : t.label;

    const badge = document.getElementById('tool-badge');
    if (t.future) {
      badge.textContent = 'Prossimo argomento (in programma, da svolgere)';
      badge.className = 'badge badge-future';
    } else if (t.optionalKey) {
      badge.textContent = 'Modulo opzionale (da confermare)';
      badge.className = 'badge badge-opt';
    } else {
      badge.className = 'badge hidden';
    }

    const box = document.getElementById('tool-inputs');
    const inp = state.inputs[state.tool];

    if (state.tool === 'retta-2-punti') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field">
            <label for="in-A">Punto A</label>
            <input type="text" id="in-A" value="${escapeHTML(inp.A)}" placeholder="A(1; 2)">
          </div>
          <div class="field">
            <label for="in-B">Punto B</label>
            <input type="text" id="in-B" value="${escapeHTML(inp.B)}" placeholder="B(3; 6)">
          </div>
        </div>
        <label class="toggle-pill" style="margin-top:10px">
          <input type="checkbox" id="in-tri" ${inp.showTriangle ? 'checked' : ''}>
          Mostra triangolo della pendenza (Δx, Δy)
        </label>
        <div class="preset-chips">
          <button type="button" class="chip" data-preset="1;2|3;6">Esempio guida: A(1;2), B(3;6)</button>
          <button type="button" class="chip" data-preset="2;5|-2;5">Orizzontale: y = 5</button>
          <button type="button" class="chip" data-preset="3;1|3;-4">Verticale: x = 3</button>
          <button type="button" class="chip" data-preset="-2;-1|2;5">Frazione: m = 3/2</button>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      document.getElementById('in-tri').addEventListener('change', e => {
        inp.showTriangle = e.target.checked;
        computeAndRender(false);
      });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        const [a, b] = ch.dataset.preset.split('|');
        inp.A = `A(${a})`; inp.B = `B(${b})`;
        renderToolInputs();
        computeAndRender(true);
      }));
    } else if (state.tool === 'retta-mq') {
      box.innerHTML = `
        <div class="btn-row" style="margin-top:0; margin-bottom:10px">
          <button type="button" class="chip ${inp.kind === 'esplicita' ? 'active' : ''}" data-kind="esplicita">Obliqua y = mx + q</button>
          <button type="button" class="chip ${inp.kind === 'orizzontale' ? 'active' : ''}" data-kind="orizzontale">Orizzontale y = k</button>
          <button type="button" class="chip ${inp.kind === 'verticale' ? 'active' : ''}" data-kind="verticale">Verticale x = h</button>
        </div>
        ${inp.kind === 'esplicita' ? `
          <div class="form-grid two-col">
            <div class="field">
              <label for="in-m">Pendenza m</label>
              <input type="text" id="in-m" value="${escapeHTML(inp.m)}">
              <div class="slider-row">
                <input type="range" id="sl-m" min="-5" max="5" step="0.5" value="${safeNum(inp.m, 2)}">
              </div>
            </div>
            <div class="field">
              <label for="in-q">Intercetta q</label>
              <input type="text" id="in-q" value="${escapeHTML(inp.q)}">
              <div class="slider-row">
                <input type="range" id="sl-q" min="-6" max="6" step="0.5" value="${safeNum(inp.q, 1)}">
              </div>
            </div>
          </div>
          <div class="field" style="margin-top:10px">
            <label>Tabella di valori (modifica i valori di x)</label>
            <table class="val-table">
              <thead><tr><th>x</th>${inp.xTable.map((xv, i) => `<td><input type="text" class="tbl-x" data-idx="${i}" value="${escapeHTML(xv)}"></td>`).join('')}</tr></thead>
              <tbody><tr><th>y</th>${inp.xTable.map((_, i) => `<td id="tbl-y-${i}">—</td>`).join('')}</tr></tbody>
            </table>
          </div>
        ` : inp.kind === 'orizzontale' ? `
          <div class="field">
            <label for="in-k">Retta orizzontale y = k (m = 0)</label>
            <input type="text" id="in-k" value="${escapeHTML(inp.k)}">
          </div>
        ` : `
          <div class="field">
            <label for="in-h">Retta verticale x = h (m non esiste)</label>
            <input type="text" id="in-h" value="${escapeHTML(inp.h)}">
          </div>
        `}
      `;
      box.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => {
        inp.kind = b.dataset.kind;
        renderToolInputs();
        computeAndRender(false);
      }));
      if (inp.kind === 'esplicita') {
        bindTextInput('in-m', v => { inp.m = v; });
        bindTextInput('in-q', v => { inp.q = v; });
        document.getElementById('sl-m').addEventListener('input', e => {
          inp.m = Rational.fromNumber(Number(e.target.value), 10).toString();
          document.getElementById('in-m').value = inp.m;
          computeAndRender(false);
        });
        document.getElementById('sl-q').addEventListener('input', e => {
          inp.q = Rational.fromNumber(Number(e.target.value), 10).toString();
          document.getElementById('in-q').value = inp.q;
          computeAndRender(false);
        });
        box.querySelectorAll('.tbl-x').forEach(el => el.addEventListener('input', e => {
          inp.xTable[Number(e.target.dataset.idx)] = e.target.value;
          computeAndRender(false);
        }));
      } else if (inp.kind === 'orizzontale') {
        bindTextInput('in-k', v => { inp.k = v; });
      } else {
        bindTextInput('in-h', v => { inp.h = v; });
      }
    } else if (state.tool === 'punti-quadranti') {
      box.innerHTML = `
        <div class="form-grid two-col">
          ${inp.pts.map((p, i) => `
            <div class="field">
              <label for="in-pt-${i}">Punto ${i + 1}</label>
              <input type="text" id="in-pt-${i}" value="${escapeHTML(p)}" placeholder="P(x; y)">
            </div>
          `).join('')}
        </div>
        <p class="small muted" style="margin:8px 0 0">Trascina qualsiasi punto sul piano per vedere cambiare quadrante o asse.</p>
      `;
      inp.pts.forEach((_, i) => bindTextInput(`in-pt-${i}`, v => { inp.pts[i] = v; }));
    } else if (state.tool === 'appartenenza') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field">
            <label for="in-line">Retta (esplicita o implicita)</label>
            <input type="text" id="in-line" value="${escapeHTML(inp.line)}" placeholder="y=2x+1">
          </div>
          <div class="field">
            <label for="in-P">Punto P</label>
            <input type="text" id="in-P" value="${escapeHTML(inp.P)}" placeholder="P(2; 5)">
          </div>
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-l="y=2x+1" data-p="P(2; 5)">P(2;5) ∈ y=2x+1</button>
          <button type="button" class="chip" data-l="y=2x+1" data-p="Q(1; 4)">Q(1;4) ∉ y=2x+1</button>
          <button type="button" class="chip" data-l="y=x+1" data-p="P(5; 0)">Verifica 3F: P(5;0), y=x+1</button>
        </div>
      `;
      bindTextInput('in-line', v => { inp.line = v; });
      bindTextInput('in-P', v => { inp.P = v; });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.line = ch.dataset.l; inp.P = ch.dataset.p;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'allineamento') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-A">Punto A</label><input type="text" id="in-A" value="${escapeHTML(inp.A)}"></div>
          <div class="field"><label for="in-B">Punto B</label><input type="text" id="in-B" value="${escapeHTML(inp.B)}"></div>
          <div class="field"><label for="in-C">Punto C</label><input type="text" id="in-C" value="${escapeHTML(inp.C)}"></div>
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-p="A(0; 0)|B(2; 1)|C(6; 3)">Allineati (3F)</button>
          <button type="button" class="chip" data-p="A(-2; -1)|B(0; 3)|C(1; 6)">Non allineati (3F)</button>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      bindTextInput('in-C', v => { inp.C = v; });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        const [a, b, c] = ch.dataset.p.split('|');
        inp.A = a; inp.B = b; inp.C = c;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'intersezione') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-r1">Retta r</label><input type="text" id="in-r1" value="${escapeHTML(inp.r1)}"></div>
          <div class="field"><label for="in-r2">Retta s</label><input type="text" id="in-r2" value="${escapeHTML(inp.r2)}"></div>
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-r1="y=3x-2" data-r2="y=-x+6">Verifica 3F: (2; 4)</button>
          <button type="button" class="chip" data-r1="3x-y-7=0" data-r2="x+2y-7=0">Verifica 3B: (3; 2)</button>
          <button type="button" class="chip" data-r1="y=3x+1" data-r2="y=3x-2">Parallele distinte</button>
          <button type="button" class="chip" data-r1="x+2y-4=0" data-r2="2x+4y-8=0">Coincidenti</button>
        </div>
      `;
      bindTextInput('in-r1', v => { inp.r1 = v; });
      bindTextInput('in-r2', v => { inp.r2 = v; });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.r1 = ch.dataset.r1; inp.r2 = ch.dataset.r2;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'parallele-perp') {
      box.innerHTML = `
        <div class="form-grid two-col">
          ${inp.lines.map((l, i) => `
            <div class="field">
              <label for="in-l-${i}">Retta r<sub>${i + 1}</sub></label>
              <input type="text" id="in-l-${i}" value="${escapeHTML(l)}" placeholder="lascia vuoto per escludere">
            </div>
          `).join('')}
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-ls="y=3x-1|y=-1/3x+2|y=3x+4|y=-3x">Verifica 3F es. 1</button>
          <button type="button" class="chip" data-ls="2x-y+3=0|x+2y-4=0||">Brief 3A: implicite ⊥</button>
        </div>
      `;
      inp.lines.forEach((_, i) => bindTextInput(`in-l-${i}`, v => { inp.lines[i] = v; }));
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.lines = ch.dataset.ls.split('|');
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'retta-punto-rel') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-line">Retta data r</label><input type="text" id="in-line" value="${escapeHTML(inp.line)}"></div>
          <div class="field"><label for="in-P">Punto P</label><input type="text" id="in-P" value="${escapeHTML(inp.P)}"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="chip ${inp.rel === 'parallela' ? 'active' : ''}" data-rel="parallela">Parallela (∥)</button>
          <button type="button" class="chip ${inp.rel === 'perpendicolare' ? 'active' : ''}" data-rel="perpendicolare">Perpendicolare (⊥)</button>
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-l="x+2y-2=0" data-p="P(4; 0)" data-r="perpendicolare">Verifica 3B es. 3</button>
          <button type="button" class="chip" data-l="y=2x-1" data-p="A(1; 4)" data-r="parallela">Verifica 3F es. 2a</button>
          <button type="button" class="chip" data-l="y=4" data-p="G(3; -1)" data-r="perpendicolare">Scheda 3F: y = 4</button>
        </div>
      `;
      bindTextInput('in-line', v => { inp.line = v; });
      bindTextInput('in-P', v => { inp.P = v; });
      box.querySelectorAll('[data-rel]').forEach(b => b.addEventListener('click', () => {
        inp.rel = b.dataset.rel;
        renderToolInputs(); computeAndRender(false);
      }));
      box.querySelectorAll('[data-l]').forEach(ch => ch.addEventListener('click', () => {
        inp.line = ch.dataset.l; inp.P = ch.dataset.p; inp.rel = ch.dataset.r;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'distanza-punto-retta') {
      if (state.level === '3F') inp.onlyFoot = true;
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-line">Retta r</label><input type="text" id="in-line" value="${escapeHTML(inp.line)}"></div>
          <div class="field"><label for="in-P">Punto P</label><input type="text" id="in-P" value="${escapeHTML(inp.P)}"></div>
        </div>
        ${state.level === '3F' ? `
          <label class="toggle-pill" style="margin-top:8px">
            <input type="checkbox" id="in-only-foot" ${inp.onlyFoot ? 'checked' : ''}>
            Fermati al piede H (livello 3F, senza formula)
          </label>
        ` : ''}
        <div class="preset-chips">
          <button type="button" class="chip" data-l="y=2x" data-p="P(5; 0)">Lezione 3B: P(5;0), y=2x</button>
          <button type="button" class="chip" data-l="4x-3y+5=0" data-p="P(-3; 1)">Verifica 3B es. 1</button>
          <button type="button" class="chip" data-l="y=x+1" data-p="P(5; 0)">Verifica 3F es. 4 (H)</button>
        </div>
      `;
      bindTextInput('in-line', v => { inp.line = v; });
      bindTextInput('in-P', v => { inp.P = v; });
      const cb = document.getElementById('in-only-foot');
      if (cb) cb.addEventListener('change', e => { inp.onlyFoot = e.target.checked; computeAndRender(false); });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.line = ch.dataset.l; inp.P = ch.dataset.p;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'distanza-medio') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-A">Punto A</label><input type="text" id="in-A" value="${escapeHTML(inp.A)}"></div>
          <div class="field"><label for="in-B">Punto B</label><input type="text" id="in-B" value="${escapeHTML(inp.B)}"></div>
        </div>
        <label class="toggle-pill" style="margin-top:10px">
          <input type="checkbox" id="in-showC" ${inp.showC ? 'checked' : ''}>
          Confronta con un terzo punto C (verifica triangolo isoscele CA = CB)
        </label>
        ${inp.showC ? `<div class="field" style="margin-top:8px"><label for="in-C">Punto C</label><input type="text" id="in-C" value="${escapeHTML(inp.C)}"></div>` : ''}
        <div class="preset-chips">
          <button type="button" class="chip" data-a="A(0; 0)" data-b="B(4; 2)" data-c="C(1; 3)" data-sc="1">Verifica 3B: isoscele</button>
          <button type="button" class="chip" data-a="A(-5; -1)" data-b="B(7; 4)" data-c="C(1; 3)" data-sc="0">Orali 3A: M(1; 3/2)</button>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      if (inp.showC) bindTextInput('in-C', v => { inp.C = v; });
      document.getElementById('in-showC').addEventListener('change', e => {
        inp.showC = e.target.checked;
        renderToolInputs(); computeAndRender(false);
      });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.A = ch.dataset.a; inp.B = ch.dataset.b; inp.C = ch.dataset.c; inp.showC = ch.dataset.sc === '1';
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'asse-segmento') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-A">Estremo A</label><input type="text" id="in-A" value="${escapeHTML(inp.A)}"></div>
          <div class="field"><label for="in-B">Estremo B</label><input type="text" id="in-B" value="${escapeHTML(inp.B)}"></div>
        </div>
        <label class="toggle-pill" style="margin-top:10px">
          <input type="checkbox" id="in-checkC" ${inp.checkC ? 'checked' : ''}>
          Verifica se un punto C sta sull'asse
        </label>
        ${inp.checkC ? `<div class="field" style="margin-top:8px"><label for="in-C">Punto C</label><input type="text" id="in-C" value="${escapeHTML(inp.C)}"></div>` : ''}
        <div class="preset-chips">
          <button type="button" class="chip" data-a="A(0; 0)" data-b="B(4; 2)" data-c="C(1; 3)">Verifica 3B es. 4b</button>
          <button type="button" class="chip" data-a="A(1; 2)" data-b="B(5; 6)" data-c="C(3; 4)">Lezione 3B: y = −x + 7</button>
          <button type="button" class="chip" data-a="A(0; 1)" data-b="B(4; 1)" data-c="C(2; 3)">Orizzontale → x = 2</button>
          <button type="button" class="chip" data-a="A(1; -2)" data-b="B(1; 4)" data-c="C(3; 1)">Verticale → y = 1</button>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      if (inp.checkC) bindTextInput('in-C', v => { inp.C = v; });
      document.getElementById('in-checkC').addEventListener('change', e => {
        inp.checkC = e.target.checked; renderToolInputs(); computeAndRender(false);
      });
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        inp.A = ch.dataset.a; inp.B = ch.dataset.b; inp.C = ch.dataset.c;
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'distanza-parallele') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-r1">Retta r₁</label><input type="text" id="in-r1" value="${escapeHTML(inp.r1)}"></div>
          <div class="field"><label for="in-r2">Retta r₂</label><input type="text" id="in-r2" value="${escapeHTML(inp.r2)}"></div>
        </div>
      `;
      bindTextInput('in-r1', v => { inp.r1 = v; });
      bindTextInput('in-r2', v => { inp.r2 = v; });
    } else if (state.tool === 'triangolo') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-A">Vertice A</label><input type="text" id="in-A" value="${escapeHTML(inp.A)}"></div>
          <div class="field"><label for="in-B">Vertice B</label><input type="text" id="in-B" value="${escapeHTML(inp.B)}"></div>
          <div class="field"><label for="in-C">Vertice C</label><input type="text" id="in-C" value="${escapeHTML(inp.C)}"></div>
          <div class="field">
            <label for="in-apex">Altezza dal vertice</label>
            <select id="in-apex">
              <option value="C" ${inp.baseApex === 'C' ? 'selected' : ''}>da C (base AB)</option>
              <option value="A" ${inp.baseApex === 'A' ? 'selected' : ''}>da A (base BC)</option>
              <option value="B" ${inp.baseApex === 'B' ? 'selected' : ''}>da B (base AC)</option>
            </select>
          </div>
        </div>
        <div class="toggle-group">
          <label class="toggle-pill"><input type="checkbox" id="tg-mid" ${inp.showMidpoints ? 'checked' : ''}> Punti medi</label>
          <label class="toggle-pill"><input type="checkbox" id="tg-axes" ${inp.showAxes ? 'checked' : ''}> Assi dei lati</label>
          <label class="toggle-pill"><input type="checkbox" id="tg-circ" ${inp.showCircumcenter ? 'checked' : ''}> Circocentro O</label>
          <label class="toggle-pill"><input type="checkbox" id="tg-alt" ${inp.showAltitude ? 'checked' : ''}> Altezza e Area</label>
          <label class="toggle-pill"><input type="checkbox" id="tg-vline" ${inp.showVertexLine ? 'checked' : ''}> Retta per vertice ⊥</label>
          ${state.options.median ? `<label class="toggle-pill"><input type="checkbox" id="tg-med" ${inp.showMedian ? 'checked' : ''}> Mediana (opz.)</label>` : ''}
        </div>
        <div class="preset-chips">
          <button type="button" class="chip" data-t="A(0; 0)|B(4; 2)|C(1; 3)|0">Verifica 3B es. 4</button>
          <button type="button" class="chip" data-t="A(1; 1)|B(4; 5)|C(5; 3)|1">Circocentro 3B (12 nov)</button>
          <button type="button" class="chip" data-t="A(0; 1)|B(4; -1)|C(4; 4)|0">Simulazione 3B es. 4</button>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      bindTextInput('in-C', v => { inp.C = v; });
      document.getElementById('in-apex').addEventListener('change', e => { inp.baseApex = e.target.value; computeAndRender(false); });
      const bindTg = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', e => { inp[key] = e.target.checked; computeAndRender(false); });
      };
      bindTg('tg-mid', 'showMidpoints');
      bindTg('tg-axes', 'showAxes');
      bindTg('tg-circ', 'showCircumcenter');
      bindTg('tg-alt', 'showAltitude');
      bindTg('tg-vline', 'showVertexLine');
      bindTg('tg-med', 'showMedian');
      box.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        const [a, b, c, circ] = ch.dataset.t.split('|');
        inp.A = a; inp.B = b; inp.C = c;
        inp.showCircumcenter = circ === '1';
        renderToolInputs(); computeAndRender(true);
      }));
    } else if (state.tool === 'circonferenza') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-A">Punto A</label><input type="text" id="in-A" value="${escapeHTML(inp.A)}"></div>
          <div class="field"><label for="in-B">Punto B</label><input type="text" id="in-B" value="${escapeHTML(inp.B)}"></div>
          <div class="field"><label for="in-C">Punto C</label><input type="text" id="in-C" value="${escapeHTML(inp.C)}"></div>
        </div>
      `;
      bindTextInput('in-A', v => { inp.A = v; });
      bindTextInput('in-B', v => { inp.B = v; });
      bindTextInput('in-C', v => { inp.C = v; });
    } else if (state.tool === 'parabola') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-a">a (di x²)</label><input type="text" id="in-a" value="${escapeHTML(inp.a)}"></div>
          <div class="field"><label for="in-b">b (di x)</label><input type="text" id="in-b" value="${escapeHTML(inp.b)}"></div>
          <div class="field"><label for="in-c">c (termine noto)</label><input type="text" id="in-c" value="${escapeHTML(inp.c)}"></div>
        </div>
        <label class="toggle-pill" style="margin-top:10px">
          <input type="checkbox" id="in-useLine" ${inp.useLine ? 'checked' : ''}>
          Intersezione con una retta
        </label>
        ${inp.useLine ? `<div class="field" style="margin-top:8px"><label for="in-line">Retta</label><input type="text" id="in-line" value="${escapeHTML(inp.line)}"></div>` : ''}
      `;
      bindTextInput('in-a', v => { inp.a = v; });
      bindTextInput('in-b', v => { inp.b = v; });
      bindTextInput('in-c', v => { inp.c = v; });
      if (inp.useLine) bindTextInput('in-line', v => { inp.line = v; });
      document.getElementById('in-useLine').addEventListener('change', e => {
        inp.useLine = e.target.checked; renderToolInputs(); computeAndRender(false);
      });
    } else if (state.tool === 'disequazione') {
      box.innerHTML = `
        <div class="form-grid two-col">
          <div class="field"><label for="in-a">a (di x²)</label><input type="text" id="in-a" value="${escapeHTML(inp.a)}"></div>
          <div class="field"><label for="in-b">b (di x)</label><input type="text" id="in-b" value="${escapeHTML(inp.b)}"></div>
          <div class="field"><label for="in-c">c</label><input type="text" id="in-c" value="${escapeHTML(inp.c)}"></div>
          <div class="field">
            <label for="in-op">Segno</label>
            <select id="in-op">
              <option value=">" ${inp.op === '>' ? 'selected' : ''}>&gt; 0</option>
              <option value=">=" ${inp.op === '>=' ? 'selected' : ''}>≥ 0</option>
              <option value="<" ${inp.op === '<' ? 'selected' : ''}>&lt; 0</option>
              <option value="<=" ${inp.op === '<=' ? 'selected' : ''}>≤ 0</option>
            </select>
          </div>
        </div>
      `;
      bindTextInput('in-a', v => { inp.a = v; });
      bindTextInput('in-b', v => { inp.b = v; });
      bindTextInput('in-c', v => { inp.c = v; });
      document.getElementById('in-op').addEventListener('change', e => { inp.op = e.target.value; computeAndRender(false); });
    } else if (state.tool === 'exp-log') {
      box.innerHTML = `
        <div class="btn-row" style="margin-top:0; margin-bottom:10px">
          <button type="button" class="chip ${inp.kind === 'exp' ? 'active' : ''}" data-k="exp">Esponenziale y = aˣ</button>
          <button type="button" class="chip ${inp.kind === 'log' ? 'active' : ''}" data-k="log">Logaritmo y = logₐ(x)</button>
        </div>
        <div class="form-grid two-col">
          <div class="field">
            <label for="in-base">Base a (es. 2, 10, e, 1/2)</label>
            <input type="text" id="in-base" value="${escapeHTML(inp.base)}">
          </div>
          <div class="field">
            <label for="in-rhs">${inp.kind === 'exp' ? 'Equazione aˣ = b (valore b)' : 'Equazione logₐ(x) = c (valore c)'}</label>
            <input type="text" id="in-rhs" value="${escapeHTML(inp.rhs)}">
          </div>
        </div>
      `;
      box.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
        inp.kind = b.dataset.k; renderToolInputs(); computeAndRender(false);
      }));
      bindTextInput('in-base', v => { inp.base = v; });
      bindTextInput('in-rhs', v => { inp.rhs = v; });
    }
  }

  function safeNum(str, fallback) {
    try { return parseRational(str).toNumber(); } catch (_) { return fallback; }
  }

  function bindTextInput(id, setter) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      setter(el.value);
      computeAndRender(false);
    });
  }

  // =========================================================================
  // Compute & Render Active Tool
  // =========================================================================
  function computeAndRender(shouldFit) {
    const resultsBox = document.getElementById('results-box');
    const stepsList = document.getElementById('steps-list');
    const guidedControls = document.getElementById('guided-controls');
    const dragHint = document.getElementById('drag-hint');

    const inp = state.inputs[state.tool];
    const scene = {
      points: [], lines: [], segments: [], polygons: [],
      slopeTriangle: null, rightAngles: [], parabola: null,
      inequalityIntervals: null, functionCurves: [], circles: []
    };
    let resultCards = [];
    let steps = [];
    let hasDraggable = false;

    try {
      if (state.tool === 'retta-2-punti') {
        const A = parsePoint(inp.A, 'A');
        const B = parsePoint(inp.B, 'B');
        const res = lineThroughTwoPoints(A, B, 'A', 'B');
        hasDraggable = true;
        scene.lines.push({ line: res.line, color: '#1d4ed8', label: res.line.toExplicitString() });
        if (inp.showTriangle && !res.isVertical && !res.isHorizontal) {
          scene.slopeTriangle = {
            A, B,
            dxLabel: `Δx = ${res.dx.toString()}`,
            dyLabel: `Δy = ${res.dy.toString()}`
          };
        }
        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: `A(${A.x.toString()}; ${A.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: `B(${B.x.toString()}; ${B.y.toString()})`, color: '#dc2626', draggable: true }
        );
        resultCards = [
          {
            label: 'Coefficiente angolare m',
            html: res.isVertical ? '<strong>non esiste</strong> (retta verticale)' : `m = <strong>${res.slope.toHTML()}</strong>` + (res.isHorizontal ? ' (retta orizzontale)' : ''),
            cls: res.isVertical ? 'warn' : 'ok'
          },
          { label: 'Forma esplicita', html: `<strong>${res.line.toExplicitHTML()}</strong>` },
          { label: 'Forma implicita', html: `<strong>${res.line.toImplicitHTML()}</strong>` }
        ];
        steps = res.steps;
      } else if (state.tool === 'retta-mq') {
        let line;
        if (inp.kind === 'orizzontale') {
          line = Line.horizontal(parseRational(inp.k));
        } else if (inp.kind === 'verticale') {
          line = Line.vertical(parseRational(inp.h));
        } else {
          line = Line.fromSlopeIntercept(parseRational(inp.m), parseRational(inp.q));
        }
        scene.lines.push({ line, color: '#1d4ed8', label: line.toExplicitString() });
        if (!line.isVertical()) {
          const xVals = inp.xTable.map(s => { try { return parseRational(s); } catch (_) { return null; } });
          xVals.forEach((xv, i) => {
            const cell = document.getElementById(`tbl-y-${i}`);
            if (!xv) { if (cell) cell.textContent = '—'; return; }
            const yv = line.evalY(xv);
            if (cell) cell.innerHTML = yv.toHTML();
            scene.points.push({ id: `t${i}`, x: xv, y: yv, label: `(${xv.toString()}; ${yv.toString()})`, color: '#0f766e' });
          });
          const qPt = { x: Rational.ZERO, y: line.yIntercept() };
          scene.points.push({ id: 'q', x: qPt.x, y: qPt.y, label: `q = ${qPt.y.toString()}`, color: '#dc2626' });
        }
        resultCards = [
          { label: 'Forma esplicita', html: `<strong>${line.toExplicitHTML()}</strong>`, cls: 'ok' },
          { label: 'Forma implicita', html: `<strong>${line.toImplicitHTML()}</strong>` },
          {
            label: 'Pendenza e intercetta',
            html: line.isVertical()
              ? `m <strong>non esiste</strong> (retta verticale), taglia l’asse x in (${line.xIntercept().toHTML()}; 0)`
              : `m = <strong>${line.slope().toHTML()}</strong> &nbsp;|&nbsp; q = <strong>${line.yIntercept().toHTML()}</strong>`
          }
        ];
        steps = [
          { title: 'Significato di m e q', html: line.isVertical() ? 'Tutti i punti hanno la stessa ascissa x.' : `La pendenza è m = ${line.slope().toHTML()}; la retta taglia l’asse y nel punto (0; ${line.yIntercept().toHTML()}).` }
        ];
      } else if (state.tool === 'punti-quadranti') {
        hasDraggable = true;
        const rows = [];
        inp.pts.forEach((pStr, i) => {
          if (!pStr.trim()) return;
          const pt = parsePoint(pStr, String.fromCharCode(65 + i));
          const cls = classifyPoint(pt);
          scene.points.push({
            id: `p${i}`, x: pt.x, y: pt.y,
            label: `${pt.label}(${pt.x.toString()}; ${pt.y.toString()})`,
            color: '#1d4ed8', draggable: true
          });
          rows.push(`${formatPointHTML(pt, pt.label)} → <strong>${cls.label}</strong>`);
        });
        resultCards = [{ label: 'Posizione dei punti', html: rows.join('<br>'), cls: 'ok' }];
        steps = [{ title: 'Regola dei segni dei quadranti', html: 'I: (+; +) &nbsp;|&nbsp; II: (−; +) &nbsp;|&nbsp; III: (−; −) &nbsp;|&nbsp; IV: (+; −) &nbsp;|&nbsp; x = 0: asse y &nbsp;|&nbsp; y = 0: asse x.' }];
      } else if (state.tool === 'appartenenza') {
        const line = lineFromStr(inp.line);
        const Ppt = parsePoint(inp.P, 'P');
        const res = pointBelongsToLine(line, Ppt, Ppt.label || 'P');
        hasDraggable = true;
        scene.lines.push({ line, color: '#1d4ed8', label: line.toExplicitString() });
        scene.points.push({
          id: 'P', x: Ppt.x, y: Ppt.y,
          label: `${Ppt.label || 'P'}(${Ppt.x.toString()}; ${Ppt.y.toString()})`,
          color: res.belongs ? '#15803d' : '#dc2626', draggable: true
        });
        resultCards = [{
          label: 'Esito appartenenza',
          html: res.belongs
            ? `<strong>SÌ, ${Ppt.label || 'P'} appartiene alla retta</strong> (${Ppt.label || 'P'} ∈ r)`
            : `<strong>NO, ${Ppt.label || 'P'} non appartiene alla retta</strong> (si trova ${res.position})`,
          cls: res.belongs ? 'ok' : 'warn'
        }];
        steps = res.steps;
      } else if (state.tool === 'allineamento') {
        const A = parsePoint(inp.A, 'A'), B = parsePoint(inp.B, 'B'), C = parsePoint(inp.C, 'C');
        const res = checkCollinearity(A, B, C);
        hasDraggable = true;
        scene.segments.push({ A, B, color: '#0f766e' }, { A: B, B: C, color: '#0f766e' });
        if (res.collinear && res.commonLine) {
          scene.lines.push({ line: res.commonLine, color: '#15803d', dashed: true, label: res.commonLine.toExplicitString() });
        }
        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: `A(${A.x.toString()}; ${A.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: `B(${B.x.toString()}; ${B.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'C', x: C.x, y: C.y, label: `C(${C.x.toString()}; ${C.y.toString()})`, color: '#dc2626', draggable: true }
        );
        resultCards = [{
          label: 'Allineamento',
          html: res.collinear
            ? `<strong>ALLINEATI</strong> — retta comune: <strong>${res.commonLine.toExplicitHTML()}</strong>`
            : `<strong>NON allineati</strong> (pendenze diverse)`,
          cls: res.collinear ? 'ok' : 'warn'
        }];
        steps = res.steps;
      } else if (state.tool === 'intersezione') {
        const r1 = lineFromStr(inp.r1);
        const r2 = lineFromStr(inp.r2);
        const res = intersectLines(r1, r2, 'r', 's');
        scene.lines.push(
          { line: r1, color: '#1d4ed8', label: `r: ${r1.toExplicitString()}` },
          { line: r2, color: '#0f766e', label: `s: ${r2.toExplicitString()}`, dashed: res.type === 'coincidenti' }
        );
        if (res.point) {
          scene.points.push({ id: 'I', x: res.point.x, y: res.point.y, label: `I(${res.point.x.toString()}; ${res.point.y.toString()})`, color: '#dc2626' });
        }
        resultCards = [{
          label: 'Posizione reciproca',
          html: res.type === 'incidenti'
            ? `<strong>Rette incidenti</strong> in <strong>${formatPointHTML(res.point, 'I')}</strong>`
            : res.type === 'parallele'
            ? `<strong>Rette parallele distinte</strong> (nessun punto in comune)`
            : `<strong>Rette coincidenti</strong> (infiniti punti in comune)`,
          cls: res.type === 'incidenti' ? 'ok' : 'warn'
        }];
        steps = res.steps;
      } else if (state.tool === 'parallele-perp') {
        const colors = ['#1d4ed8', '#dc2626', '#0f766e', '#7c3aed'];
        const list = [];
        inp.lines.forEach((s, i) => {
          if (!s.trim()) return;
          const line = lineFromStr(s);
          const name = `r${i + 1}`;
          list.push({ name, line });
          scene.lines.push({ line, color: colors[i % colors.length], label: `${name}: ${line.toExplicitString()}` });
        });
        if (list.length < 2) throw new Error('Inserisci almeno due rette.');
        const res = analyzeLineRelations(list);
        const parPerp = res.pairs.filter(p => p.relation !== 'nessuna');
        resultCards = [
          {
            label: 'Pendenze',
            html: res.slopes.map(s => `${s.name}: m = <strong>${s.m === null ? 'non esiste' : s.m.toHTML()}</strong>`).join(' &nbsp;|&nbsp; ')
          },
          {
            label: 'Coppie ∥ e ⊥ trovate',
            html: parPerp.length > 0
              ? parPerp.map(p => `<strong>${p.name1} ${p.relation === 'parallele' ? '∥' : p.relation === 'perpendicolari' ? '⊥' : '≡'} ${p.name2}</strong> (${p.relation})`).join('<br>')
              : 'Nessuna coppia parallela o perpendicolare.',
            cls: parPerp.length > 0 ? 'ok' : 'warn'
          }
        ];
        steps = res.steps;
      } else if (state.tool === 'retta-punto-rel') {
        const r = lineFromStr(inp.line);
        const Ppt = parsePoint(inp.P, 'P');
        const res = lineThroughPointRel(r, Ppt, inp.rel, Ppt.label || 'P');
        hasDraggable = true;
        scene.lines.push(
          { line: r, color: '#64748b', label: `r: ${r.toExplicitString()}` },
          { line: res.line, color: '#1d4ed8', label: `${inp.rel === 'parallela' ? '∥' : '⊥'}: ${res.line.toExplicitString()}` }
        );
        scene.points.push({ id: 'P', x: Ppt.x, y: Ppt.y, label: `${Ppt.label || 'P'}(${Ppt.x.toString()}; ${Ppt.y.toString()})`, color: '#dc2626', draggable: true });
        resultCards = [
          { label: `Retta ${inp.rel} (esplicita)`, html: `<strong>${res.line.toExplicitHTML()}</strong>`, cls: 'ok' },
          { label: 'Forma implicita', html: `<strong>${res.line.toImplicitHTML()}</strong>` }
        ];
        steps = res.steps;
      } else if (state.tool === 'distanza-punto-retta') {
        const r = lineFromStr(inp.line);
        const Ppt = parsePoint(inp.P, 'P');
        const res = pointToLineDistance(Ppt, r, Ppt.label || 'P');
        const onlyFoot = state.level === '3F' && inp.onlyFoot;
        hasDraggable = true;

        scene.lines.push(
          { line: r, color: '#1d4ed8', label: `r: ${r.toExplicitString()}` },
          { line: res.perpendicular, color: '#94a3b8', dashed: true, label: `s⊥: ${res.perpendicular.toExplicitString()}` }
        );
        if (!res.onLine) {
          scene.segments.push({
            A: Ppt, B: res.foot, color: '#dc2626', width: 3,
            label: onlyFoot ? '' : `d = ${res.distance.toString()}`
          });
          scene.rightAngles.push({
            vertex: res.foot,
            dir1: { x: Ppt.x.toNumber() - res.foot.x.toNumber(), y: Ppt.y.toNumber() - res.foot.y.toNumber() },
            dir2: { x: Number(r.b), y: -Number(r.a) }
          });
        }
        scene.points.push(
          { id: 'P', x: Ppt.x, y: Ppt.y, label: `${Ppt.label || 'P'}(${Ppt.x.toString()}; ${Ppt.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'H', x: res.foot.x, y: res.foot.y, label: `H(${res.foot.x.toString()}; ${res.foot.y.toString()})`, color: '#15803d' }
        );

        resultCards = [
          { label: 'Retta perpendicolare per P', html: `<strong>${res.perpendicular.toExplicitHTML()}</strong>` },
          { label: 'Piede H della perpendicolare', html: `<strong>${formatPointHTML(res.foot, 'H')}</strong>`, cls: 'ok' }
        ];
        if (!onlyFoot) {
          resultCards.push({
            label: 'Distanza d(P, r)',
            html: `<strong>${res.distance.toHTML()}</strong>` + (res.distance.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${res.distance.toApproxItalian(3)})</span>`),
            cls: 'ok'
          });
        }
        steps = onlyFoot ? res.stepsLong.slice(0, 2) : res.steps;
      } else if (state.tool === 'distanza-medio') {
        const A = parsePoint(inp.A, 'A');
        const B = parsePoint(inp.B, 'B');
        const dist = distanceBetweenPoints(A, B, 'A', 'B');
        const mid = midpointOf(A, B, 'A', 'B');
        hasDraggable = true;

        scene.segments.push({ A, B, color: '#1d4ed8', label: `AB = ${dist.distance.toString()}` });
        scene.slopeTriangle = { A, B, dxLabel: `Δx = ${dist.dx.toString()}`, dyLabel: `Δy = ${dist.dy.toString()}` };
        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: `A(${A.x.toString()}; ${A.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: `B(${B.x.toString()}; ${B.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'M', x: mid.midpoint.x, y: mid.midpoint.y, label: `M(${mid.midpoint.x.toString()}; ${mid.midpoint.y.toString()})`, color: '#15803d' }
        );

        resultCards = [
          {
            label: 'Distanza AB',
            html: `<strong>${dist.distance.toHTML()}</strong> (AB² = ${dist.distSquared.toHTML()})` +
              (dist.distance.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${dist.distance.toApproxItalian(3)})</span>`),
            cls: 'ok'
          },
          { label: 'Punto medio M', html: `<strong>${formatPointHTML(mid.midpoint, 'M')}</strong>` }
        ];
        steps = [...dist.steps, ...mid.steps];

        if (inp.showC) {
          const C = parsePoint(inp.C, 'C');
          const dCA = distanceBetweenPoints(C, A, 'C', 'A');
          const dCB = distanceBetweenPoints(C, B, 'C', 'B');
          const isIso = dCA.distSquared.eq(dCB.distSquared);
          scene.segments.push({ A: C, B: A, color: '#0f766e', dashed: true }, { A: C, B, color: '#0f766e', dashed: true });
          scene.points.push({ id: 'C', x: C.x, y: C.y, label: `C(${C.x.toString()}; ${C.y.toString()})`, color: '#7c3aed', draggable: true });
          resultCards.push({
            label: 'Confronto CA e CB',
            html: `CA = ${dCA.distance.toHTML()}, CB = ${dCB.distance.toHTML()} ⇒ <strong>${isIso ? 'Triangolo isoscele sulla base AB ✓' : 'Non isoscele sulla base AB'}</strong>`,
            cls: isIso ? 'ok' : 'warn'
          });
        }
      } else if (state.tool === 'asse-segmento') {
        const A = parsePoint(inp.A, 'A');
        const B = parsePoint(inp.B, 'B');
        const C = inp.checkC && inp.C.trim() ? parsePoint(inp.C, 'C') : null;
        const res = perpendicularBisector(A, B, C);
        hasDraggable = true;

        scene.segments.push({ A, B, color: '#1d4ed8' });
        scene.lines.push({ line: res.axis, color: '#15803d', label: `asse: ${res.axis.toExplicitString()}` });
        scene.rightAngles.push({
          vertex: res.midpoint,
          dir1: { x: B.x.toNumber() - A.x.toNumber(), y: B.y.toNumber() - A.y.toNumber() },
          dir2: { x: -(B.y.toNumber() - A.y.toNumber()), y: B.x.toNumber() - A.x.toNumber() }
        });
        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: `A(${A.x.toString()}; ${A.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: `B(${B.x.toString()}; ${B.y.toString()})`, color: '#dc2626', draggable: true },
          { id: 'M', x: res.midpoint.x, y: res.midpoint.y, label: `M(${res.midpoint.x.toString()}; ${res.midpoint.y.toString()})`, color: '#15803d' }
        );
        resultCards = [
          { label: 'Punto medio M', html: `<strong>${formatPointHTML(res.midpoint, 'M')}</strong>` },
          { label: 'Asse del segmento (esplicita)', html: `<strong>${res.axis.toExplicitHTML()}</strong>`, cls: 'ok' },
          { label: 'Forma implicita', html: `<strong>${res.axis.toImplicitHTML()}</strong>` }
        ];
        if (C && res.pointCheck) {
          scene.points.push({ id: 'C', x: C.x, y: C.y, label: `C(${C.x.toString()}; ${C.y.toString()})`, color: res.pointCheck.belongs ? '#15803d' : '#b45309', draggable: true });
          resultCards.push({
            label: `Appartenenza di ${C.label || 'C'}`,
            html: res.pointCheck.belongs ? `<strong>${C.label || 'C'} sta sull’asse</strong> (CA = CB ✓)` : `<strong>${C.label || 'C'} NON sta sull’asse</strong>`,
            cls: res.pointCheck.belongs ? 'ok' : 'warn'
          });
        }
        steps = res.steps;
      } else if (state.tool === 'distanza-parallele') {
        const r1 = lineFromStr(inp.r1);
        const r2 = lineFromStr(inp.r2);
        const res = distanceBetweenParallelLines(r1, r2);
        scene.lines.push(
          { line: r1, color: '#1d4ed8', label: `r₁: ${r1.toExplicitString()}` },
          { line: r2, color: '#0f766e', label: `r₂: ${r2.toExplicitString()}` }
        );
        if (res.parallel && res.samplePoint && res.foot) {
          scene.segments.push({ A: res.samplePoint, B: res.foot, color: '#dc2626', width: 3, label: `d = ${res.distance.toString()}` });
          scene.points.push(
            { id: 'P', x: res.samplePoint.x, y: res.samplePoint.y, label: `P(${res.samplePoint.x.toString()}; ${res.samplePoint.y.toString()})`, color: '#dc2626' },
            { id: 'H', x: res.foot.x, y: res.foot.y, label: `H(${res.foot.x.toString()}; ${res.foot.y.toString()})`, color: '#15803d' }
          );
        }
        resultCards = [{
          label: 'Distanza tra rette parallele',
          html: !res.parallel
            ? 'Le rette <strong>non sono parallele</strong>: nessuna distanza definita.'
            : `d(r₁, r₂) = <strong>${res.distance.toHTML()}</strong>` + (res.distance.isRational() ? '' : ` <span class="calc-approx">(calcolatrice: ≈ ${res.distance.toApproxItalian(3)})</span>`),
          cls: res.parallel ? 'ok' : 'warn'
        }];
        steps = res.steps;
      } else if (state.tool === 'triangolo') {
        const A = parsePoint(inp.A, 'A'), B = parsePoint(inp.B, 'B'), C = parsePoint(inp.C, 'C');
        const tri = analyzeTriangle(A, B, C, inp.baseApex);
        hasDraggable = true;

        scene.polygons.push({ points: [A, B, C] });
        if (inp.showMidpoints) {
          scene.points.push(
            { id: 'mAB', x: tri.midpoints.AB.x, y: tri.midpoints.AB.y, label: 'M_AB', color: '#0f766e' },
            { id: 'mBC', x: tri.midpoints.BC.x, y: tri.midpoints.BC.y, label: 'M_BC', color: '#0f766e' },
            { id: 'mCA', x: tri.midpoints.CA.x, y: tri.midpoints.CA.y, label: 'M_AC', color: '#0f766e' }
          );
        }
        if (inp.showAxes) {
          scene.lines.push(
            { line: tri.axes.AB.axis, color: '#15803d', dashed: true, label: 'asse AB' },
            { line: tri.axes.CA.axis, color: '#0d9488', dashed: true, label: 'asse AC' }
          );
        }
        if (inp.showCircumcenter) {
          scene.circles.push({ center: tri.circumcenter, radius: tri.circumradius, color: '#94a3b8', dashed: true });
          scene.points.push({ id: 'O', x: tri.circumcenter.x, y: tri.circumcenter.y, label: `O(${tri.circumcenter.x.toString()}; ${tri.circumcenter.y.toString()})`, color: '#7c3aed' });
        }
        if (inp.showAltitude) {
          scene.segments.push({ A: tri.altitude.apex, B: tri.altitude.foot, color: '#dc2626', width: 2.6, label: `h = ${tri.altitude.distance.toString()}` });
          scene.points.push({ id: 'H', x: tri.altitude.foot.x, y: tri.altitude.foot.y, label: `H(${tri.altitude.foot.x.toString()}; ${tri.altitude.foot.y.toString()})`, color: '#dc2626' });
        }
        if (inp.showVertexLine) {
          const perpBC = lineThroughPointRel(tri.lines.BC, A, 'perpendicolare', 'A');
          scene.lines.push({ line: perpBC.line, color: '#d97706', label: `⊥ BC per A: ${perpBC.line.toExplicitString()}` });
        }
        if (state.options.median && inp.showMedian) {
          const med = tri.medians[inp.baseApex];
          const apexPt = inp.baseApex === 'A' ? A : inp.baseApex === 'B' ? B : C;
          scene.segments.push({ A: apexPt, B: med.midpoint, color: '#9333ea', dashed: true, label: `med = ${med.length.toString()}` });
        }

        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: `A(${A.x.toString()}; ${A.y.toString()})`, color: '#1d4ed8', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: `B(${B.x.toString()}; ${B.y.toString()})`, color: '#1d4ed8', draggable: true },
          { id: 'C', x: C.x, y: C.y, label: `C(${C.x.toString()}; ${C.y.toString()})`, color: '#1d4ed8', draggable: true }
        );

        resultCards = [
          {
            label: 'Lati',
            html: `AB = <strong>${tri.sides.AB.distance.toHTML()}</strong> &nbsp;|&nbsp; BC = <strong>${tri.sides.BC.distance.toHTML()}</strong> &nbsp;|&nbsp; CA = <strong>${tri.sides.CA.distance.toHTML()}</strong>` +
              (tri.isoscelesBases.length ? `<br><strong>Isoscele</strong> sulla base ${tri.isoscelesBases.join(', ')}` : '') +
              (tri.rightAngleAt ? `<br><strong>Rettangolo</strong> in ${tri.rightAngleAt}` : '')
          },
          {
            label: 'Altezza e Area',
            html: `h = <strong>${tri.altitude.distance.toHTML()}</strong> (piede ${formatPointHTML(tri.altitude.foot, 'H')}) &nbsp;|&nbsp; Area = <strong>${tri.area.toHTML()}</strong>`,
            cls: 'ok'
          },
          {
            label: 'Asse AB e Circocentro O',
            html: `Asse AB: <strong>${tri.axes.AB.axis.toExplicitHTML()}</strong><br>Circocentro: <strong>${formatPointHTML(tri.circumcenter, 'O')}</strong>`
          }
        ];
        steps = tri.steps;
      } else if (state.tool === 'circonferenza') {
        const A = parsePoint(inp.A, 'A'), B = parsePoint(inp.B, 'B'), C = parsePoint(inp.C, 'C');
        const circ = circleThroughThreePoints(A, B, C);
        hasDraggable = true;
        scene.circles.push({ center: circ.center, radius: circ.radius, color: '#1d4ed8' });
        scene.points.push(
          { id: 'A', x: A.x, y: A.y, label: 'A', color: '#dc2626', draggable: true },
          { id: 'B', x: B.x, y: B.y, label: 'B', color: '#dc2626', draggable: true },
          { id: 'C', x: C.x, y: C.y, label: 'C', color: '#dc2626', draggable: true },
          { id: 'O', x: circ.center.x, y: circ.center.y, label: `O(${circ.center.x.toString()}; ${circ.center.y.toString()})`, color: '#15803d' }
        );
        resultCards = [
          { label: 'Centro e Raggio', html: `Centro <strong>${formatPointHTML(circ.center, 'O')}</strong> &nbsp;|&nbsp; Raggio r = <strong>${circ.radius.toHTML()}</strong>`, cls: 'ok' }
        ];
        steps = [{ title: 'Costruzione', html: 'Il centro è il circocentro (intersezione degli assi) e il raggio è la distanza OA.' }];
      } else if (state.tool === 'parabola') {
        const a = parseRational(inp.a), b = parseRational(inp.b), c = parseRational(inp.c);
        const l = inp.useLine && inp.line.trim() ? lineFromStr(inp.line) : null;
        const res = analyzeParabola(a, b, c, l);
        scene.parabola = { a, b, c, color: '#7c3aed' };
        scene.lines.push({ line: Line.vertical(res.axisX), color: '#94a3b8', dashed: true, label: `x = ${res.axisX.toString()}` });
        scene.points.push(
          { id: 'V', x: res.vertex.x, y: res.vertex.y, label: `V(${res.vertex.x.toString()}; ${res.vertex.y.toString()})`, color: '#dc2626' },
          { id: 'Py', x: res.yIntercept.x, y: res.yIntercept.y, label: `(0; ${c.toString()})`, color: '#0f766e' }
        );
        res.xIntersections.roots.forEach((rt, idx) => {
          scene.points.push({ id: `rx${idx}`, x: rt.num, y: 0, label: `x${idx + 1}`, color: '#15803d' });
        });
        if (l) {
          scene.lines.push({ line: l, color: '#1d4ed8', label: l.toExplicitString() });
          if (res.lineIntersection) {
            res.lineIntersection.points.forEach((pt, idx) => {
              scene.points.push({ id: `li${idx}`, x: pt.xNum, y: pt.yNum, label: `I${idx + 1}`, color: '#d97706' });
            });
          }
        }
        resultCards = [
          { label: 'Vertice e Asse', html: `<strong>${formatPointHTML(res.vertex, 'V')}</strong> &nbsp;|&nbsp; Asse: <strong>x = ${res.axisX.toHTML()}</strong> &nbsp;|&nbsp; Concavità ${res.concavity}`, cls: 'ok' },
          { label: 'Intersezioni con asse x', html: res.xIntersections.count === 0 ? 'Nessuna (Δ < 0)' : res.xIntersections.roots.map(r => `(${r.html}; 0)`).join(' e ') }
        ];
        steps = res.steps;
      } else if (state.tool === 'disequazione') {
        const a = parseRational(inp.a), b = parseRational(inp.b), c = parseRational(inp.c);
        const res = solveQuadraticInequality(a, b, c, inp.op);
        scene.parabola = { a, b, c, color: '#7c3aed' };
        scene.inequalityIntervals = res.intervals;
        resultCards = [
          { label: 'Soluzione della disequazione', html: `<strong>${res.solutionHTML}</strong> <span class="muted">(${res.summary})</span>`, cls: 'ok' }
        ];
        steps = res.steps;
      } else if (state.tool === 'exp-log') {
        const baseStr = inp.base.trim().toLowerCase();
        const baseNum = baseStr === 'e' ? Math.E : parseRational(inp.base).toNumber();
        const rhsNum = parseRational(inp.rhs).toNumber();
        const res = solveExpLogEquation(inp.kind, baseNum, rhsNum);
        if (inp.kind === 'exp') {
          scene.functionCurves.push({ fn: x => Math.pow(baseNum, x), color: '#0284c7' });
          scene.lines.push({ line: Line.horizontal(parseRational(inp.rhs)), color: '#94a3b8', dashed: true, label: `y = ${inp.rhs}` });
          if (res.solvable) {
            scene.points.push({ id: 'sol', x: res.xValue, y: rhsNum, label: `x ≈ ${formatItalianDecimal(res.xValue, 2)}`, color: '#dc2626' });
          }
        } else {
          scene.functionCurves.push({ fn: x => Math.log(x) / Math.log(baseNum), domainMin: 0, color: '#0284c7' });
          scene.lines.push({ line: Line.horizontal(parseRational(inp.rhs)), color: '#94a3b8', dashed: true, label: `y = ${inp.rhs}` });
          if (res.solvable) {
            scene.points.push({ id: 'sol', x: res.xValue, y: rhsNum, label: `x ≈ ${formatItalianDecimal(res.xValue, 2)}`, color: '#dc2626' });
          }
        }
        resultCards = [{ label: 'Soluzione', html: res.exactHTML, cls: res.solvable ? 'ok' : 'warn' }];
        steps = res.steps;
      }
    } catch (err) {
      resultCards = [{ label: 'Controlla i dati', html: escapeHTML(err.message), cls: 'err' }];
      steps = [];
    }

    // Render results
    resultsBox.innerHTML = `<div class="result-grid">${resultCards.map(c => `
      <div class="result-item ${c.cls || ''}">
        <div class="result-label">${c.label}</div>
        <div class="result-value">${c.html}</div>
      </div>
    `).join('')}</div>`;

    // Render steps (full in Esplora, step-by-step in Guidato)
    renderSteps(steps, stepsList, guidedControls);

    // Update canvas
    dragHint.classList.toggle('hidden', !hasDraggable);
    lastFitPoints = scene.points;
    graph.setScene(scene);
    if (shouldFit && scene.points.length > 0) {
      graph.fitToPoints(scene.points);
    }
    updateExerciseVisibility();
  }

  function renderSteps(steps, listEl, controlsEl) {
    if (steps.length === 0) {
      listEl.innerHTML = '<li class="muted">Nessun passaggio disponibile per questi dati.</li>';
      controlsEl.innerHTML = '';
      return;
    }
    if (state.mode === 'guidato') {
      const shown = Math.max(1, Math.min(state.guidedStepCount, steps.length));
      state.guidedStepCount = shown;
      listEl.innerHTML = steps.slice(0, shown).map(s => `
        <li>
          <div class="step-title">${s.title}</div>
          <div>${s.html}</div>
        </li>
      `).join('');

      controlsEl.innerHTML = `
        <span class="small muted">${shown} / ${steps.length}</span>
        ${shown < steps.length ? '<button type="button" id="btn-next-step" class="btn-primary" style="min-height:36px;padding:4px 12px">Passaggio successivo</button>' : ''}
        ${shown < steps.length ? '<button type="button" id="btn-all-steps" class="btn-ghost" style="min-height:36px">Tutti</button>' : ''}
        ${shown > 1 ? '<button type="button" id="btn-reset-steps" class="btn-ghost" style="min-height:36px">Ricomincia</button>' : ''}
      `;
      const btnNext = document.getElementById('btn-next-step');
      if (btnNext) btnNext.addEventListener('click', () => { state.guidedStepCount++; renderSteps(steps, listEl, controlsEl); });
      const btnAll = document.getElementById('btn-all-steps');
      if (btnAll) btnAll.addEventListener('click', () => { state.guidedStepCount = steps.length; renderSteps(steps, listEl, controlsEl); });
      const btnReset = document.getElementById('btn-reset-steps');
      if (btnReset) btnReset.addEventListener('click', () => { state.guidedStepCount = 1; renderSteps(steps, listEl, controlsEl); });
    } else {
      controlsEl.innerHTML = '';
      listEl.innerHTML = steps.map(s => `
        <li>
          <div class="step-title">${s.title}</div>
          <div>${s.html}</div>
        </li>
      `).join('');
    }
  }

  // =========================================================================
  // Live Point Dragging Handler
  // =========================================================================
  function handlePointDrag(id, rx, ry) {
    const inp = state.inputs[state.tool];
    const coordText = (lbl) => `${lbl}(${rx.toString()}; ${ry.toString()})`;

    if (state.tool === 'punti-quadranti' && id.startsWith('p')) {
      const idx = Number(id.slice(1));
      const old = inp.pts[idx] || '';
      const m = old.match(/^([A-Za-z][A-Za-z0-9_']*)/);
      const lbl = m ? m[1] : String.fromCharCode(65 + idx);
      inp.pts[idx] = coordText(lbl);
      const el = document.getElementById(`in-pt-${idx}`);
      if (el) el.value = inp.pts[idx];
    } else if (['A', 'B', 'C', 'P'].includes(id) && inp[id] !== undefined) {
      inp[id] = coordText(id);
      const el = document.getElementById(`in-${id}`);
      if (el) el.value = inp[id];
    }
    computeAndRender(false);
  }

  // =========================================================================
  // Printable Student Worksheet (STRICTLY WITHOUT SOLUTIONS)
  // =========================================================================
  function printStudentWorksheet() {
    const area = document.getElementById('print-worksheet');
    const list = getFilteredExercises();
    area.innerHTML = `
      <h1>Scheda di esercizi — Geometria analitica (${state.level === '3F' ? '3F Base' : '3A / 3B Completo'})</h1>
      <p>Nome e cognome: ___________________________________ &nbsp;&nbsp; Classe: __________ &nbsp;&nbsp; Data: ______________</p>
      <hr>
      ${list.map((ex, i) => `
        <div class="print-ex">
          <h3>Esercizio ${i + 1} — ${escapeHTML(ex.title)} <small>(${escapeHTML(ex.source)})</small></h3>
          <p>${escapeHTML(ex.prompt)}</p>
          <div class="print-lines"></div>
        </div>
      `).join('')}
    `;
    window.print();
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    loadPrefs();

    const canvas = document.getElementById('graph-canvas');
    const coordEl = document.getElementById('coord-readout');
    graph = new IsometricGraph(canvas, {
      onPointDrag: handlePointDrag,
      onHoverCoord: (mx, my) => {
        coordEl.textContent = `x: ${formatItalianDecimal(mx, 1)}; y: ${formatItalianDecimal(my, 1)}`;
      }
    });

    window.addEventListener('resize', () => graph.resize());

    // Toolbar buttons
    document.getElementById('btn-zoom-in').addEventListener('click', () => graph.zoomBy(1.25));
    document.getElementById('btn-zoom-out').addEventListener('click', () => graph.zoomBy(0.8));
    document.getElementById('btn-reset-view').addEventListener('click', () => graph.resetView());
    document.getElementById('btn-fit').addEventListener('click', () => graph.fitToPoints(lastFitPoints));
    document.getElementById('snap-select').addEventListener('change', (e) => graph.setSnapMode(e.target.value));

    // Level selector
    document.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.level = btn.dataset.level;
        savePrefs();
        syncTopbarButtons();
        renderToolBar();
        renderToolInputs();
        if (state.mode === 'esercizio') renderExerciseBox();
        computeAndRender(true);
      });
    });

    // Mode selector
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;
        state.guidedStepCount = 1;
        state.exerciseRevealed = false;
        syncTopbarButtons();
        if (state.mode === 'esercizio') {
          const list = getFilteredExercises();
          const ex = list.find(e => e.id === state.exerciseId) || list[0];
          state.exerciseId = ex.id;
          loadExerciseIntoTool(ex);
        }
        renderExerciseBox();
        computeAndRender(true);
      });
    });

    // Settings dialog
    const dialog = document.getElementById('settings-dialog');
    const optLim = document.getElementById('opt-lim');
    const optTeacher = document.getElementById('opt-teacher');
    const optMedian = document.getElementById('opt-median');
    const optCircle = document.getElementById('opt-circle');

    document.getElementById('btn-settings').addEventListener('click', () => {
      optLim.checked = state.options.lim;
      optTeacher.checked = state.options.teacher;
      optMedian.checked = state.options.median;
      optCircle.checked = state.options.circle;
      dialog.showModal();
    });

    const onOptChange = () => {
      state.options.lim = optLim.checked;
      state.options.teacher = optTeacher.checked;
      state.options.median = optMedian.checked;
      state.options.circle = optCircle.checked;
      savePrefs();
      syncTopbarButtons();
      renderToolBar();
      renderToolInputs();
      if (state.mode === 'esercizio') renderExerciseBox();
      computeAndRender(false);
    };
    [optLim, optTeacher, optMedian, optCircle].forEach(el => el.addEventListener('change', onOptChange));

    document.getElementById('btn-print-sheet').addEventListener('click', () => {
      dialog.close();
      printStudentWorksheet();
    });

    document.getElementById('btn-clear-storage').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      state.options = { lim: false, teacher: false, median: false, circle: false };
      state.level = '3AB';
      optLim.checked = optTeacher.checked = optMedian.checked = optCircle.checked = false;
      syncTopbarButtons();
      renderToolBar();
      renderToolInputs();
      computeAndRender(false);
    });

    // Register Service Worker only on http/https (avoid file:// errors)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    syncTopbarButtons();
    renderToolBar();
    renderToolInputs();
    computeAndRender(true);
  }

  document.addEventListener('DOMContentLoaded', init);
})(typeof globalThis !== 'undefined' ? globalThis : window);
