# Laboratorio di Geometria Analitica — Classi Terze

Web app statica, offline e senza login, pensata per gli studenti di terza (matematica di base, istituti professionali e tecnici) su telefono, PC e LIM.

## Funzionalità principali

- **Notazione italiana e aritmetica esatta**: punti scritti `P(x; y)` con punto e virgola, risultati in frazioni ridotte e radicali semplificati (`√10`, `2√5`), con valore approssimato di calcolatrice mostrato solo in seconda battuta.
- **Piano cartesiano isometrico**: un quadrato della griglia è sempre un quadrato (gli angoli retti appaiono retti anche sulla LIM), con trascinamento dei punti, zoom/pan al tocco e aggancio a interi/seminteri.
- **Livelli per classe**:
  - **3F (Base)**: retta per 2 punti, `y = mx + q` con slider e tabella, punti e quadranti, appartenenza, allineamento di 3 punti, intersezione con sistemi, riconoscimento parallele/perpendicolari, retta per un punto `∥`/`⊥`, piede `H` della perpendicolare.
  - **3A / 3B (Completo)**: aggiunge distanza e punto medio, asse di un segmento (entrambi i metodi), distanza punto-retta (metodo lungo + formula), distanza tra rette parallele, problemi sul triangolo (isoscele, assi, circocentro, altezza, area).
- **Prossimi argomenti** (marcati come «Prossimo argomento»): parabola, disequazioni di secondo grado, funzioni ed equazioni esponenziali e logaritmiche.
- **Moduli opzionali** (spenti di default in *Opzioni*): mediana di un triangolo, circonferenza per tre punti.
- **Tre modalità**: *Esplora*, *Guidato* (passaggio per passaggio), *Esercizio* (controllo con equivalenza algebrica, es. `y=2x-8` ≡ `2x-y-8=0`, `10/√5` ≡ `2√5`), più *Vista docente* locale e stampa della scheda esercizi senza soluzioni.

## Come aprire l'app

- **Online (GitHub Pages)**: [https://linzialessandro.github.io/geometria_analitica/](https://linzialessandro.github.io/geometria_analitica/)
- **Da disco (offline)**: apri direttamente `index.html` con qualsiasi browser moderno (Chrome, Safari, Firefox, Edge). Non serve alcun server né connessione a internet.
- **Da server locale / GitHub Pages**: servi la cartella del progetto (es. `npx serve .` oppure `python3 -m http.server 8000`) e apri `http://localhost:8000`. Su HTTPS o localhost si attiva anche il Service Worker per l'uso offline completo.

## Come lanciare i test automatici

Richiede Node.js (v18+):

```bash
node --test tests/acceptance.test.js
```

La suite verifica tutti i 27 criteri di accettazione del §6 di `graph-calculator-terze.md`, i casi particolari (rette orizzontali/verticali), il parser italiano, il controllo di equivalenza e i moduli dei prossimi argomenti.

## Come aggiungere un esercizio

Apri `js/exercises.js` e aggiungi un oggetto all'array `EXERCISES` seguendo la struttura esistente:

```js
{
  id: 'mio-esercizio-1',
  title: 'Titolo breve',
  source: 'Scheda 3B, data',
  level: '3AB', // '3F' oppure '3AB'
  tool: 'retta-2-punti', // id dello strumento da precaricare
  prompt: 'Testo della consegna per lo studente.',
  params: { A: 'A(1; 2)', B: 'B(3; 6)' },
  questions: [
    { label: 'Coefficiente angolare m', answerType: 'slope', expected: '2', placeholder: 'es. 2' },
    { label: 'Equazione della retta', answerType: 'line', expected: 'y=2x', placeholder: 'es. y=2x' }
  ],
  solutionSummary: 'm = 2, retta y = 2x.'
}
```

Tipi di risposta supportati in `answerType`: `'rational'`, `'radical'`, `'point'`, `'line'`, `'slope'`, `'boolean'`, `'relation'`.
