# Graph calculator per le terze — istruzioni per l'agente

Questo file è il brief completo per costruire un *graph calculator* pensato per gli studenti di terza del prof. Alessandro Linzi (matematica di base, istituti professionali/tecnici). Va letto e seguito come specifica. Non inventare dati sugli studenti e non aggiungere argomenti fuori dal programma indicato.

Stato didattico di riferimento: **mercoledì 25 novembre 2026**. Le lezioni finiscono il **9 giugno 2027**.

---

## 1. Prompt per l'agente

Costruisci una web app statica, in italiano, che faccia da calcolatrice grafica e da laboratorio di geometria analitica per studenti di terza (livello semplice, scuole professionali e tecniche). Non è un GeoGebra generico: è uno strumento *di classe*, allineato agli esercizi che il docente fa davvero, con notazione italiana e passaggi visibili.

**Scopo.** Lo studente deve poter fare, sul telefono, sul PC o sulla LIM, tutto ciò che si fa in terza con punti e rette (e, in seguito, parabola, disequazioni di secondo grado, esponenziali e logaritmi): inserire punti e equazioni, vedere subito il disegno, ottenere i calcoli (coefficiente angolare, retta, intersezione, distanze, asse, piede della perpendicolare, ecc.) e, in modalità esercizio, provare da solo e poi controllare.

**Esempio guida (richiesto dal docente).** Dati due punti, lo studente vede la retta che li congiunge e il coefficiente angolare. Esempio di accettazione: \(A(1;2)\), \(B(3;6)\) \(\Rightarrow\) \(m=2\), retta \(y=2x\).

**Vincoli di prodotto.**

- Pubblico: studenti di terza, livello semplice. Interfaccia chiara, bottoni grandi, poco testo, adatta anche alla LIM.
- Lingua: italiano.
- Notazione italiana: punti scritti \(P(x;y)\) con *punto e virgola*; se servono decimali, virgola decimale; se i dati sono razionali, i risultati restano frazioni esatte (niente \(0{,}333\) al posto di \(\frac13\)).
- Due forme della retta, sempre disponibili e convertibili: esplicita \(y=mx+q\) e implicita \(ax+by+c=0\). In implicita, \(m=-\dfrac{a}{b}\) se \(b\neq 0\).
- Casi particolari visibili e gestiti senza errori: retta orizzontale \(y=k\) (\(m=0\)), retta verticale \(x=h\) (\(m\) non esiste).
- Aritmetica razionale esatta. Quando compare un radicale (distanze, formula punto-retta), lascialo in forma semplificata (\(\sqrt{10}\), \(2\sqrt{5}\), non un decimale lungo).
- Nessun login, nessun account, nessun dato studente raccolto o salvato su server.
- Funziona offline (file statici, eventualmente un service worker) e su mobile.
- Mostra i passaggi (formule usate, calcoli intermedi) in modo opzionale ma chiaro: lo studente deve poter *capire*, non solo leggere il risultato.
- Modalità *esercizio*: lo studente prova prima; solo dopo può rivelare il risultato e il confronto col disegno.

Non costruire un CAS avanzato, non introdurre analisi da quinta (limiti, derivate, asintoti obliqui, funzioni a tratti), non aggiungere probabilità o statistica. Se un argomento futuro non è ancora stato fatto in classe, implementalo come modulo pronto ma marcalo nell'interfaccia come «prossimo argomento», senza darlo per già spiegato.

---

## 2. Contesto: tre classi, stesso anno, ritmi diversi

L'app serve tre terze dello stesso docente, tutte di *matematica di base* (niente probabilità/statistica). Il programma annuale è lo stesso in linea di massima; il ritmo e la profondità no.

| Classe | Codice usato dal docente | Note sul ritmo (confermate dai materiali e dalle indicazioni del docente, autunno 2026) |
|---|---|---|
| 3B SV | `sv3B` | Più avanti sulle rette. Ha già fatto asse, distanza punto-retta (metodo lungo e formula), circocentro di un triangolo, verifica scritta il 23 novembre 2026. **Niente mediana.** La parabola non è ancora iniziata. |
| 3A CUC | `cuc3A` o `3A CUC` / `3ACUC` | Stesso percorso della 3B, in ritardo di qualche settimana. Ha già fatto piano cartesiano, distanza, punto medio, retta per due punti (con una verifica precedente e orali di recupero), intersezioni, parallele/perpendicolari, asse e distanza punto-retta. Verifica sulle rette: martedì 1 dicembre 2026, *stesso testo* della verifica 3B del 23 novembre. La mediana era in un piano di novembre ma **non è nello scritto e non risulta svolta**; trattarla come opzionale, da confermare. |
| 3F IeFP | `alb3F` o `3F IeFP` | Percorso **più stretto** e più lento. Si lavora su carta e LIM (il laboratorio spesso ha solo la LIM, senza computer per gli studenti). Fino alla verifica del 1 dicembre 2026: \(y=mx+q\), appartenenza, retta per due punti, allineamento, parallele/perpendicolari per un punto, intersezioni con sistemi, piede \(H\) della perpendicolare. **Non entra** (almeno in questo quadrimestre) la formula della distanza punto-retta né l'asse del segmento come oggetto di verifica. |

L'app deve coprire il percorso completo di `sv3B`/`cuc3A` e restare usabile in `alb3F` senza sommergerlo: prevedere un selettore di livello o di classe (per esempio «3F: strumenti di base» / «3A-3B: percorso completo»), con gli strumenti avanzati nascosti o in una sezione successiva, non cancellati.

---

## 3. Programma di terza

### 3.1 Programma ufficiale confermato dal docente

Il docente ha indicato il programma di matematica di base delle terze (`cuc3A`, `sv3B`, `alb3F` IeFP), escludendo probabilità e statistica:

1. **Geometria analitica:** distanza tra due punti, punto medio, retta, parabola, asse di un segmento, distanza punto-retta.
2. **Disequazioni di secondo grado.**
3. **Funzioni ed equazioni esponenziali e logaritmiche.**
4. **Uso della calcolatrice.**

Le lezioni finiscono il **9 giugno 2027**. Il primo quadrimestre si chiude intorno al 25 gennaio 2027 (scrutini). In questo arco va concluso, in particolare, il blocco della retta e va affrontata la parabola; disequazioni di secondo grado ed esponenziali/logaritmi stanno nella parte restante dell'anno. Il dettaglio fine dell'ordine dopo la parabola non è stato fissato esercizio per esercizio: va implementato in modo solido e semplice, e segnalato come *previsto, da confermare nel dettaglio* dove sotto manca una tipologia già svolta in classe.

**Non compare** nel programma indicato dal docente la *circonferenza come curva* \(x^2+y^2+ax+by+c=0\). In 3B è stato fatto il **circocentro** di un triangolo (intersezione degli assi), che resta nel blocco della retta, non è lo studio della circonferenza. Uno strumento «circonferenza per tre punti / equazione della circonferenza» è **previsto, da confermare**: utile, ma non va presentato come argomento già in programma.

### 3.2 Cosa è già stato svolto (al 25 novembre 2026)

Sintesi per classe, ricostruita da verifiche, simulazioni, schede, brief e note del docente. Le date indicano quando l'argomento compare nei materiali o è stato confermato in classe; qualche lezione è saltata (sciopero 20 novembre, uscita a teatro 24 novembre, progetti), quindi «previsto in un brief» non significa sempre «svolto quel giorno». Lo *stato* è quello confermato dalle note successive.

#### sv3B — svolto

- Richiamo della retta: \(y=mx+q\), forma implicita, retta per un punto \(y-y_0=m(x-x_0)\), orizzontali e verticali (deck *Rette nel piano cartesiano*, già in uso a fine ottobre).
- Intersezione di due rette con un sistema; classificazione: incidenti, parallele distinte, coincidenti.
- Rette parallele (\(m'=m\)) e perpendicolari (\(m'=-\frac1m\), oppure \(m_1\cdot m_2=-1\)).
- Retta per un punto parallela o perpendicolare a una retta data, anche partendo dalla forma implicita; casi con gli assi (\(y=k\), \(x=h\)).
- Retta per due punti e coefficiente angolare.
- **Asse di un segmento** (due metodi: per il punto medio con \(m_{\perp}\); luogo \(PA=PB\)). Lezione del 29 ottobre, PDF `lezione-3B-asse-distanza`.
- **Distanza punto-retta, metodo lungo:** perpendicolare per \(P\), piede \(H\) come intersezione, distanza \(PH\). Poi controllo con la formula
  \[
  d(P,r)=\frac{\lvert ax_P+by_P+c\rvert}{\sqrt{a^2+b^2}},\qquad r:\ ax+by+c=0.
  \]
- Distanza tra due rette parallele (prendere un punto sulla prima).
- Problemi geometrici su un triangolo: isoscele sulla base, asse, altezza con la formula, area, retta per un vertice perpendicolare a un lato.
- **Circocentro** come intersezione di due assi; controllo dell'angolo retto col prodotto delle pendenze; altezza e area. Esempio chiuso il 12 novembre: \(A(1;1)\), \(B(4;5)\), \(C(5;3)\), circocentro \(\bigl(\frac52;3\bigr)\).
- Verifica scritta **lunedì 23 novembre 2026** (50–55 minuti). Simulazione il 19 novembre, andata bene. Recupero degli assenti: fatto il 25 novembre, **restano 2 assenti** da recuperare (orale, salvo tanti assenti).
- **Mediana: esclusa** in 3B (indicazione del docente da fine ottobre / 9 novembre: «niente mediana, nessun argomento nuovo» in fase di ripasso).
- Schede di lettura (storia): *Cartesio e la geometria analitica* e *Il quinto postulato di Euclide*, da leggere insieme in classe. **Al 25 novembre non sono ancora state lette**; restano per le prossime lezioni. Non richiedono strumenti di calcolo propri, al massimo un disegno (triangolo sferico da 270° nella scheda sul quinto postulato: fuori dal piano euclideo, non è un obiettivo dell'app).

#### cuc3A — svolto

- Piano cartesiano: punti, quadranti, assi.
- Distanza tra due punti, punto medio, triangolo isoscele sulla base.
- Retta per due punti in forma esplicita e verifica di appartenenza di altri punti.
- Verifica scritta precedente «Piano cartesiano e retta» (già svolta prima di ottobre inoltrato); esiste un foglio di orali di recupero (`orali-3ACUC`) per l'assente, sugli stessi tipi (non include la forma implicita di quella verifica).
- Intersezione di due rette (da fine ottobre), anche in forma mista esplicita/implicita; riconoscimento di parallele che non si incontrano.
- Parallele e perpendicolari; retta per un punto \(\parallel\) o \(\perp\).
- Asse del segmento (in piano da metà novembre; stesso PDF della 3B).
- Distanza punto-retta (metodo lungo, poi formula). Il 25 novembre la classe ha *ripassato la distanza punto-retta*.
- Da qui al **1 dicembre**: ripasso strutturato con esercizi simili alla verifica 3B, simulazione **lunedì 30 novembre** (stessi materiali della simulazione/verifica 3B), verifica **martedì 1 dicembre alle 11:40**, stesso testo della 3B del 23 novembre (`verifica-3ACUC-1dic`).

#### alb3F — svolto

- Retta \(y=mx+q\) su carta e LIM: tabella di valori, disegno, significato di \(m\) (pendenza) e \(q\) (intercetta con l'asse \(y\)).
- Appartenenza di un punto alla retta (sostituzione).
- Rette orizzontali \(y=k\) e verticali \(x=h\).
- Retta per due punti, compresi i casi \(m=0\) e retta verticale; verifica se altri punti stanno sulla retta. Esempio guida del 3 novembre: \(A(1;2)\), \(B(3;6)\) \(\Rightarrow\) \(y=2x\).
- Tre punti allineati (confronto delle pendenze).
- Riconoscere parallele e perpendicolari dalle pendenze.
- Retta per un punto parallela o perpendicolare a una retta data, anche da forma implicita, e casi con \(y=k\) / \(x=h\) (scheda `esercizi-3F-17nov`).
- Intersezione di due rette con un sistema (introdotta il 23/25 novembre; da consolidare).
- Piede \(H\) della perpendicolare da un punto a una retta (nello scritto del 1 dicembre, senza formula della distanza).
- Verifica **martedì 1 dicembre alle 8:00**, 50 minuti (`verifica-3F-1dic`). Simulazione in due parti: **venerdì 27 e lunedì 30 novembre**, stessi tipi di esercizi della verifica ma con numeri diversi.

GeoGebra per la 3F era previsto in laboratorio e poi rinviato (spesso manca il computer per gli studenti): questa app deve poter sostituire quel ruolo sulla LIM e sul telefono, restando più semplice e più aderente agli esercizi di classe.

### 3.3 Cosa resta fino al 9 giugno 2027

**Subito (fine novembre – inizio dicembre 2026), confermato.**

- 3B: correzione verifica (fatta il 25), recupero orale dei 2 assenti, lettura delle due schede (Cartesio, quinto postulato). Poi si può aprire la parabola.
- 3A CUC: ripasso, simulazione 30 novembre, verifica 1 dicembre (stesso programma della verifica 3B). Poi, come da piano del docente, si passa alla parabola.
- 3F: simulazione 27 e 30 novembre, verifica 1 dicembre (programma più stretto, vedi sopra). Il seguito dopo lo scritto (se e quando arrivare ad asse, formula della distanza, parabola) è **da confermare**.

**Dopo le verifiche sulle rette, confermato nel programma ufficiale ma non ancora iniziato.**

- **Parabola** (esplicitamente nel programma; in 3B «non è ancora iniziata» al 22 novembre). Argomento centrale del resto del primo quadrimestre / inizio del secondo. Il tipo esatto degli esercizi è **previsto, da confermare nel dettaglio** quando il docente li assegna; l'app deve già coprire il nucleo standard di una terza professionale semplice (vedi §4.16).
- **Disequazioni di secondo grado** (programma ufficiale). Naturalmente collegate al segno del trinomio e al grafico della parabola. Dettaglio delle tipologie: **previsto, da confermare**.
- **Funzioni ed equazioni esponenziali e logaritmiche** (programma ufficiale), con uso della calcolatrice. Dettaglio delle tipologie: **previsto, da confermare**.
- **Uso della calcolatrice:** l'app è essa stessa uno strumento di classe; deve mostrare anche il valore decimale *in seconda battuta* (per esempio per confrontare con la calcolatrice tascabile), senza sostituire la forma esatta.

**Opzionali / da confermare.**

- Mediana di un triangolo: esclusa in 3B; in 3A era in un piano di novembre, non risulta svolta e non è nello scritto del 1 dicembre. Modulo presente ma spento di default.
- Circonferenza come luogo/equazione: non è nel programma indicato dal docente. Modulo eventuale, spento di default.
- Ellisse, iperbole, trigonometria, numeri complessi, statistica, probabilità: **fuori programma**.

---

## 4. Argomenti, tipologie di esercizi e funzionalità richieste

Per ogni blocco: cosa sa già fare la classe, 1–2 esempi *reali* tratti dai materiali, e cosa deve fare l'app. Gli esempi vanno usati anche come test automatici (§6).

Convenzioni di input da accettare ovunque:

- Punti: `A(1;2)`, `P(-3; 1)`, anche `1;2` in due campi \(x\) e \(y\).
- Rette esplicite: `y=2x-1`, `y=-1/2x+3`, `y=4`, `x=2`.
- Rette implicite: `3x-y-7=0`, `x+2y-2=0`.
- Frazioni: `1/2`, `-1/3`. Niente obbligo di scrivere i decimali.

### 4.1 Piano cartesiano, quadranti e assi

**Svolto in:** 3A (verifica precedente e orali); presupposto in 3B e 3F.

**Esercizi fatti.** Rappresentare punti e dire se stanno in un quadrante o su un asse. Esempio dagli orali 3A (`orali-3ACUC`, gruppo A1):

> \(A(2;5)\), \(B(-4;3)\), \(C(-1;-6)\), \(D(6;-2)\), \(E(0;3)\), \(F(-5;0)\).

Soluzione: \(A\) I, \(B\) II, \(C\) III, \(D\) IV, \(E\) asse \(y\), \(F\) asse \(x\).

**App.** Inserire o trascinare punti su una griglia con unità visibili, assi numerati, origine in evidenza. Per ogni punto mostrare coordinate in forma \(P(x;y)\) e l'etichetta «I/II/III/IV quadrante» oppure «asse \(x\) / asse \(y\) / origine». I punti si trascinano e le coordinate si aggiornano in frazioni o interi quando il punto è su un nodo della griglia (snap opzionale ai seminteri/interi, disattivabile).

### 4.2 Distanza tra due punti

**Svolto in:** 3A, 3B (e come prerequisito nei problemi); non è oggetto dello scritto 3F di dicembre, ma è la base di \(PH\).

Formula: \(\displaystyle AB=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}\).

**Esempi.**

- Verifica 3B, es. 4a: \(A(0;0)\), \(B(4;2)\), \(C(1;3)\). \(CA=\sqrt{10}\), \(CB=\sqrt{10}\) \(\Rightarrow\) triangolo isoscele sulla base \(AB\).
- Orali 3A, B2: \(A(-2;1)\), \(B(4;9)\), \(C(-3;8)\). \(AB=10\); \(CA=CB\) (isoscele). Spesso si confrontano i *quadrati* delle distanze per evitare radicali inutili.

**App.** Dati due punti, disegnare il segmento, il triangolo rettangolo dei cateti \(\Delta x,\Delta y\), e mostrare i passaggi della formula, con risultato esatto. Opzione: confrontare \(CA\) e \(CB\) e dire se il triangolo è isoscele sulla base \(AB\).

### 4.3 Punto medio

Formula: \(\displaystyle M=\Bigl(\frac{x_A+x_B}{2};\frac{y_A+y_B}{2}\Bigr)\).

**Esempi.**

- Verifica 3B, es. 4b: punto medio di \(A(0;0)\), \(B(4;2)\) è \(M(2;1)\).
- Simulazione 3B, es. 4b: \(A(0;1)\), \(B(4;-1)\) \(\Rightarrow\) \(M(2;0)\).
- Orali 3A, B1: \(A(-5;-1)\), \(B(7;4)\) \(\Rightarrow\) \(M\bigl(1;\frac32\bigr)\).

**App.** Dati due punti, mostrare \(M\), il segmento, e i passaggi. Il punto medio deve aggiornarsi se si trascinano gli estremi.

### 4.4 Retta \(y=mx+q\): tabella, pendenza, intercetta

**Svolto in particolare in 3F**, ed è il richiamo di partenza anche in 3A e 3B.

**Esempi (brief 3F, 23 e 27 ottobre).**

1. Disegna \(y=2x+1\) con la tabella \(x=-1,0,1,2\). Punti: \((-1;-1)\), \((0;1)\), \((1;3)\), \((2;5)\).
2. \(P(2;5)\) sta su \(y=2x+1\)? Sì. \(Q(1;4)\)? No (\(y=3\)).
3. Confronta \(y=x\), \(y=2x\), \(y=3x\): più \(m\) è grande (in valore), più la retta è ripida. Confronta \(y=x+1\), \(y=x+3\), \(y=x-2\): stessa \(m\), parallele, tagliano l'asse \(y\) in \(q\).
4. \(y=-x+3\), \(y=3\) (orizzontale), \(x=2\) (verticale).
5. Pendenza e intercetta di \(y=-\frac12 x+3\): \(m=-\frac12\), \(q=3\).
6. (veloce) \(P(k;7)\) sta su \(y=2x+1\). Quanto vale \(k\)? \(k=3\).

**App.**

- Input di \(m\) e \(q\) (anche con slider, come nell'esercizio GeoGebra previsto in 3F: «cosa cambia muovendo \(m\)? e \(q\)?»).
- Tabella di valori editabile; i punti della tabella appaiono sul grafico.
- Disegno della retta, intercetta con gli assi, etichette \(m\) e \(q\).
- Rette orizzontali e verticali come casi di primo livello, non come eccezioni nascoste.

### 4.5 Appartenenza di un punto a una retta

**Esempi.**

- 3F, verifica 1 dicembre, es. 4a: \(r:\ y=x+1\), \(P(5;0)\). Per \(x=5\) si ha \(y=6\neq 0\), quindi \(P\notin r\).
- 3F, 3 novembre, es. 6: retta per \(A(-2;1)\), \(B(4;4)\) è \(y=\frac12 x+2\); \(P(2;3)\) sì, \(Q(6;6)\) no.
- Orali 3A, C1: retta per \(P(-2;6)\), \(Q(1;-3)\) è \(y=-3x\); \(R(2;-6)\in s\), \(S(-1;2)\notin s\).

**App.** Dati retta e punto, sostituire, mostrare i due membri, concludere «appartiene / non appartiene», e evidenziare il punto sul grafico (sopra/sotto/sulla retta).

### 4.6 Coefficiente angolare e retta per due punti

Formula: \(\displaystyle m=\frac{y_Q-y_P}{x_Q-x_P}\), poi \(y-y_P=m(x-x_P)\), forma esplicita \(y=mx+q\).

Casi particolari (3F, 3 novembre): stessa \(y\) \(\Rightarrow\) \(m=0\), retta \(y=y_1\); stessa \(x\) \(\Rightarrow\) denominatore nullo, retta verticale \(x=x_1\).

**Esempi.**

- 3F, 3 novembre: \(A(1;2)\), \(B(3;6)\) \(\Rightarrow\) \(m=2\), \(y=2x\). (È l'esempio citato dal docente.)
- 3F, 23 ottobre, veloce: \(A(0;2)\), \(B(2;6)\) \(\Rightarrow\) \(m=2\), \(y=2x+2\).
- Orali 3A, C2: \(P(-2;-1)\), \(Q(2;5)\) \(\Rightarrow\) \(m=\frac32\), \(y=\frac32 x+2\).
- Brief 3B, 28 ottobre, es. 7: retta per \(C(0;1)\) e \(D(2;5)\), \(m_{CD}=2\).

**App.** Dati due punti (digitati o trascinati):

- calcolare \(m\) in forma esatta, oppure segnalare «retta verticale, \(m\) non esiste»;
- scrivere la retta in forma esplicita e implicita a coefficienti interi;
- disegnare punti, retta e (in opzione) il «triangolo della pendenza» \(\Delta x,\Delta y\);
- aggiornare tutto in tempo reale quando si trascinano i punti;
- mostrare i passaggi: differenza delle \(y\), differenza delle \(x\), riduzione della frazione, sostituzione di un punto per trovare \(q\).

### 4.7 Allineamento di tre punti

**Svolto in 3F** (9–10 novembre).

**Esempi.**

- \(A(0;0)\), \(B(2;1)\), \(C(6;3)\): sì, \(m=\frac12\).
- \(A(-2;-1)\), \(B(0;3)\), \(C(1;6)\): no (\(2\neq\frac73\)).

Metodo usato in classe: confrontare le pendenze \(m_{AB}\) e \(m_{AC}\) (o \(m_{BC}\)).

**App.** Dati tre punti, calcolare le pendenze, concludere allineati / non allineati, disegnare i segmenti. Se sono allineati, scrivere la retta comune. Alternativa visibile nei passaggi: area del triangolo nulla / punto medio, ma il metodo *di classe* è il confronto delle \(m\).

### 4.8 Intersezione di due rette (sistemi)

**Svolto in tutte e tre le classi.** In 3F è l'ultimo arrivo prima dello scritto del 1 dicembre.

Metodo: uguagliare le esplicite, oppure sostituzione/riduzione sulle implicite. Poi **verificare** il punto su entrambe le rette. Se il sistema è impossibile: parallele distinte; se è indeterminato: coincidenti.

**Esempi.**

- Verifica 3F, es. 3: \(y=3x-2\) e \(y=-x+6\) \(\Rightarrow\) \(4x=8\), \(x=2\), \(y=4\), punto \((2;4)\). Stesso sistema compare nei brief della 3A (2 novembre, es. 1) e della 3B (22 ottobre, es. 4).
- Verifica 3B, es. 2: \(3x-y-7=0\) e \(x+2y-7=0\) \(\Rightarrow\) \(Q(3;2)\).
- Simulazione 3B, es. 2: \(2x+y-7=0\) e \(x-y-2=0\) \(\Rightarrow\) \(Q(3;1)\).
- Brief 3A, 23 ottobre: \(y=2x-1\) e \(y=-x+5\) \(\Rightarrow\) \((2;3)\); \(y=3x+1\) e \(y=3x-2\) non si incontrano (stessa \(m\)).
- Ripasso 3B, 9 novembre: (a) incidenti in \((1;2)\); (b) \(y=2x+1\) e \(y=2x-3\), parallele distinte; (c) \(x+2y-4=0\) e \(2x+4y-8=0\), coincidenti.

**App.**

- Input di due rette (qualsiasi forma).
- Disegno, punto di intersezione evidenziato (se esiste).
- Classificazione: incidenti / parallele distinte / coincidenti (e, se parallele, eventuale distanza: §4.13).
- Passaggi del sistema e verifica per sostituzione.
- Se le rette sono verticali/orizzontali, gestirle senza cadere in divisione per zero.

### 4.9 Riconoscere parallele e perpendicolari

Regole di classe, da mostrare sempre:

- parallele (non verticali): \(m'=m\);
- perpendicolari (non parallele agli assi): \(m'=-\dfrac{1}{m}\), cioè \(m_1\cdot m_2=-1\);
- una orizzontale \(y=k\) è perpendicolare a ogni verticale \(x=h\);
- in forma implicita: prima calcolare \(m=-\dfrac{a}{b}\).

**Esempi.**

- Verifica 3F, es. 1: \(r_1:\ y=3x-1\), \(r_2:\ y=-\frac13 x+2\), \(r_3:\ y=3x+4\), \(r_4:\ y=-3x\). Pendenze \(3\), \(-\frac13\), \(3\), \(-3\). Quindi \(r_1\parallel r_3\); \(r_2\perp r_1\) e \(r_2\perp r_3\); \(r_4\) non è né parallela né perpendicolare alle altre.
- Deck 3B, es. 2: \(y=4x-2\) e \(y=4x+5\) parallele; \(y=3x+1\) e \(y=-\frac13 x+2\) perpendicolari; \(y=2x\) e \(y=-2x+1\) nessuna delle due.
- Brief 3A, 2 novembre, es. 4: \(2x-y+3=0\) e \(x+2y-4=0\), \(m=2\), \(m'=-\frac12\), perpendicolari.

**App.** Date due o più rette, elencare le pendenze e le coppie \(\parallel\) / \(\perp\) / nessuna, con il prodotto \(m_1 m_2\) visibile. Disegnare le rette con stili distinti. Non dire «perpendicolari» solo perché «si vedono ad angolo» sul grafico: la conclusione deve essere algebrica (sulla LIM la scala degli assi può ingannare: se le unità \(x\) e \(y\) non sono uguali, l'angolo retto *non* si vede retto; **la griglia deve avere unità isometriche di default**).

### 4.10 Retta per un punto, parallela o perpendicolare a una retta data

Procedura di classe: leggere \(m\) (o calcolare \(m=-\frac ab\)); per la parallela usare la stessa \(m\), per la perpendicolare \(m'=-\frac1m\); poi \(y-y_0=m(x-x_0)\).

**Esempi.**

- Verifica 3F, es. 2:
  - parallela a \(y=2x-1\) per \(A(1;4)\) \(\Rightarrow\) \(y=2x+2\);
  - perpendicolare a \(y=2x-1\) per \(B(2;3)\) \(\Rightarrow\) \(y=-\frac12 x+4\);
  - parallela a \(y=-3x+5\) per \(C(-1;2)\) \(\Rightarrow\) \(y=-3x-1\).
- Verifica 3B, es. 3: \(r:\ x+2y-2=0\) (\(m=-\frac12\)), \(P(4;0)\). Parallela: \(y=-\frac12 x+2\) (o \(x+2y-4=0\)). Perpendicolare: \(y=2x-8\) (o \(2x-y-8=0\)).
- Scheda 3F del 17 novembre, casi con gli assi: parallela a \(y=4\) per \(G(3;-1)\) \(\Rightarrow\) \(y=-1\); perpendicolare a \(y=4\) per \(G\) \(\Rightarrow\) \(x=3\); parallela a \(x=-2\) per \(H(5;2)\) \(\Rightarrow\) \(x=5\).
- Brief 3B, 28 ottobre, es. 6: per \(T(2;5)\), parallela all'asse \(x\) è \(y=5\); perpendicolare all'asse \(x\) è \(x=2\).

**App.** Input: punto + retta + scelta «parallela» / «perpendicolare». Output: nuova retta in entrambe le forme, disegno delle due rette e del punto, passaggi (\(m\), \(m'\), sostituzione). Gestire gli assi e le verticali senza errori.

### 4.11 Asse di un segmento

**Svolto in 3B e 3A; non è nello scritto 3F di dicembre.**

Definizione usata in classe: l'asse di \(AB\) è la retta **perpendicolare** ad \(AB\) passante per il **punto medio** \(M\). Equivalentemente, è il luogo dei punti \(P\) con \(PA=PB\).

Due metodi, entrambi da mostrare (lezione 29 ottobre):

1. \(M\), \(m_{AB}\), quindi \(m_{\perp}=-\dfrac{1}{m_{AB}}\), retta per \(M\).
2. \((x-x_A)^2+(y-y_A)^2=(x-x_B)^2+(y-y_B)^2\), che si semplifica nella stessa retta.

**Esempi.**

- Lezione, esempio alla lavagna: \(A(1;2)\), \(B(5;6)\). \(M(3;4)\), \(m_{AB}=1\), asse \(y=-x+7\). Metodo 2: \(x+y=7\).
- Lezione, es. 1: \(A(2;0)\), \(B(6;4)\) \(\Rightarrow\) \(y=-x+6\).
- Lezione, es. 3 (orizzontale): \(A(0;1)\), \(B(4;1)\) \(\Rightarrow\) asse \(x=2\).
- Lezione, es. 4 (verticale): \(A(1;-2)\), \(B(1;4)\) \(\Rightarrow\) asse \(y=1\).
- Verifica 3B, es. 4b: asse di \(AB\) con \(A(0;0)\), \(B(4;2)\) è \(y=-2x+5\), e passa per \(C(1;3)\).

**App.** Dati \(A\) e \(B\): disegnare il segmento, \(M\), l'asse, e (opzionale) alcuni punti dell'asse con \(PA=PB\). Mostrare entrambi i metodi. Verificare se un terzo punto \(C\) sta sull'asse. Aggiornare al trascinamento. Casi orizzontale/verticale coperti.

### 4.12 Distanza punto-retta: metodo lungo e formula

**Svolto in 3B e 3A; in 3F lo scritto chiede il piede \(H\), non la formula.**

**Metodo lungo** (quello che la 3B ha consolidato a novembre, e che la 3F fa in parte): retta perpendicolare per \(P\) \(\to\) piede \(H\) = intersezione \(\to\) \(d=PH\).

**Formula**, per \(r:\ ax+by+c=0\):

\[
d(P,r)=\frac{\lvert ax_P+by_P+c\rvert}{\sqrt{a^2+b^2}}.
\]

Se la retta è in forma esplicita, prima trasformarla in implicita (es. \(y=2x+6\) diventa \(2x-y+6=0\)).

**Esempi.**

- Lezione, esempio: \(P(5;0)\), \(r:\ y=2x\). Perpendicolare: \(y=-\frac12(x-5)\). \(H(1;2)\), \(PH=2\sqrt{5}\). Formula: \(\frac{|10|}{\sqrt5}=2\sqrt5\).
- Verifica 3B, es. 1: \(P(-3;1)\), \(4x-3y+5=0\) \(\Rightarrow\) \(d=2\).
- Simulazione 3B, es. 1: \(P(2;-1)\), \(3x+4y+8=0\) \(\Rightarrow\) \(d=2\).
- Verifica 3F, es. 4 (solo fino a \(H\), senza chiedere \(PH\)): \(r:\ y=x+1\), \(P(5;0)\). \(P\notin r\); perpendicolare \(s:\ y=-x+5\); \(H(2;3)\).
- Lezione, es. 8 (frazioni nel metodo lungo): \(P(1;1)\), \(3x+4y-17=0\). Formula: \(d=2\). Lungo: \(H\bigl(\frac{11}{5};\frac{13}{5}\bigr)\), \(PH=2\).

**App.** Dati \(P\) e una retta:

- disegnare retta, punto, perpendicolare, piede \(H\), segmento \(PH\);
- calcolare \(H\) e \(PH\) col metodo lungo, con i passaggi;
- calcolare la formula, con la riduzione del radicale, e mostrare che i due risultati coincidono;
- in livello 3F, poter fermarsi a «trova \(H\)» senza imporre la formula;
- se \(P\) sta sulla retta, \(d=0\) e \(H=P\).

### 4.13 Distanza tra rette parallele

**Svolto in ripasso 3B** (12 novembre, es. 3): distanza tra \(y=2x+1\) e \(y=2x-4\): si prende un punto sulla prima, per esempio \((0;1)\), e si usa la formula sulla seconda \(2x-y-4=0\), ottenendo \(\sqrt5\).

**App.** Se due rette sono parallele, offrire il calcolo della distanza con questo metodo (punto sulla prima + formula o metodo lungo). Se non sono parallele, non inventare una «distanza tra rette».

### 4.14 Problemi su un triangolo: isoscele, asse, altezza, area, circocentro

Sono il tipo «esercizio 4» della verifica 3B / 3A e dei ripassi. L'app deve poter *accompagnare* un triangolo \(ABC\) con tutti gli strumenti precedenti, non solo un bottone magico «risolvi il problema».

**Esempio da verifica 3B, es. 4.** \(A(0;0)\), \(B(4;2)\), \(C(1;3)\).

- a) \(CA=CB=\sqrt{10}\): isoscele sulla base \(AB\).
- b) Asse di \(AB\): \(y=-2x+5\), passa per \(C\).
- c) \(AB:\ x-2y=0\), altezza \(h=d(C,AB)=\sqrt5\), \(AB=2\sqrt5\), area \(=5\).
- d) Perpendicolare a \(BC\) per \(A\): \(m_{BC}=-\frac13\), quindi \(y=3x\).

**Esempio da simulazione 3B, es. 4.** \(A(0;1)\), \(B(4;-1)\), \(C(4;4)\). \(CA=CB=5\); asse \(y=2x-4\), passa per \(C\); \(h=2\sqrt5\), area \(=10\); perpendicolare ad \(AC\) per \(B\): \(y=-\frac43 x+\frac{13}{3}\).

**Esempio circocentro (3B, 12 novembre).** \(A(1;1)\), \(B(4;5)\), \(C(5;3)\): assi di \(AB\) e \(AC\), circocentro \(\bigl(\frac52;3\bigr)\) = punto medio di \(AB\) (angolo retto in \(C\), perché \(m_{AC}\cdot m_{BC}=-1\)). Altezza \(H\bigl(\frac{17}{5};\frac{21}{5}\bigr)\), \(CH=2\), area \(5\). Controllo: \(AB:\ 4x-3y-1=0\), \(d(C)=2\).

**Esempio ripasso 3B, 12 novembre, es. 8 (stile verifica).** \(A(0;1)\), \(B(4;3)\), \(C(0;6)\): \(CA=CB=5\); asse di \(AB\): \(y=-2x+6\), passa per \(C\); \(h=CM=2\sqrt5\); area \(10\); parallela ad \(AB\) per \(C\): \(y=\frac12 x+6\).

**App.** Dati tre vertici:

- disegnare il triangolo;
- strumenti (attivabili uno per volta, con passaggi): lati e confronto \(CA=CB\); punti medi; assi; circocentro (intersezione di due assi, controllo \(OA=OB=OC\) se si vuole, ma il metodo di classe è l'intersezione degli assi); altezza relativa a un lato (perpendicolare dal vertice, oppure formula della distanza); area \(\frac12\cdot\text{base}\cdot\text{altezza}\); retta per un vertice parallela o perpendicolare a un lato.
- Non è richiesto (e in 3B è escluso) il baricentro via mediana, salvo modulo opzionale.

### 4.15 Mediana (opzionale, spenta di default)

In 3B è esclusa. In 3A era prevista in un piano di novembre («asse → distanza → mediana → ripasso»), ma al 25 novembre non risulta svolta e non è nello scritto del 1 dicembre. **Previsto, da confermare** se e quando servirà.

Se si attiva: mediana da un vertice = retta (e segmento) dal vertice al punto medio del lato opposto; eventuale lunghezza. Esempi già preparati in un brief del 2 novembre (non confermati come svolti): \(A(0;0)\), \(B(4;0)\), \(C(2;6)\), mediana da \(C\): \(M(2;0)\), retta \(x=2\), lunghezza \(6\); e \(A(1;2)\), \(B(5;4)\), \(C(-1;6)\), mediana da \(A\): \(M(2;5)\), \(y=3x-1\), lunghezza \(\sqrt{10}\).

### 4.16 Parabola — previsto (programma ufficiale), dettaglio esercizi da confermare

Non è ancora iniziata. L'app deve già avere un modulo solido, livello semplice, da sbloccare quando il docente parte. Nucleo standard di una terza professionale, **da confermare nel dettaglio alla prima lezione sulla parabola**:

- Grafico di \(y=ax^2+bx+c\) e dei casi \(y=ax^2\), \(y=ax^2+q\), \(y=a(x-h)^2+k\).
- Concavitità (segno di \(a\)), vertice \(V\bigl(-\frac{b}{2a};\,f(x_V)\bigr)\), asse di simmetria \(x=-\frac{b}{2a}\).
- Intersezioni con gli assi (punti razionali quando i dati lo permettono: il docente chiede risultati razionali).
- Intersezione parabola-retta con un sistema (zero, una o due soluzioni), disegnata.
- Lettura dal grafico: vertice, asse, intersezioni, dove la parabola è sopra/sotto l'asse \(x\).
- Fuoco e direttrice: **da confermare** (spesso si omettono in un percorso semplice); se presenti, modulo secondario.

Input: coefficienti o espressione. Disegno fedele, unità isometriche, vertice e asse evidenziati, passaggi del completamento o della formula del vertice. Niente funzioni a tratti.

### 4.17 Disequazioni di secondo grado — previsto (programma ufficiale), dettaglio da confermare

Collegate alla parabola: segno di \(ax^2+bx+c\), soluzioni come intervalli sulla retta reale, confronto col grafico (dove la parabola è positiva/negativa). Anche questo va preparato, con risultati razionali quando i dati sono razionali (radici intere o frazionarie). **Tipologie esatte da confermare** alla prima scheda del docente. Non è richiesto, per le terze, il livello dei sistemi di disequazioni della quarta (`com4A`).

### 4.18 Esponenziali e logaritmi — previsto (programma ufficiale), dettaglio da confermare

Modulo successivo, da tenere pronto:

- grafici di \(y=a^x\) e \(y=\log_a x\) (base \(a>0\), \(a\neq 1\)), casi \(a=2\), \(a=10\), \(a=e\) se servirà, **da confermare**;
- traslazioni semplici, **da confermare**;
- equazioni del tipo \(a^{f(x)}=a^{g(x)}\), \(a^x=b\), \(\log_a x=c\), con passaggi e, se utile, valore numerico di calcolatrice in seconda battuta;
- disequazioni esponenziali/logaritmiche: nel programma di *quarta* compaiono esplicitamente; per la terza il programma parla di *funzioni ed equazioni*. Le disequazioni restano **da confermare** e non sono prioritarie.

### 4.19 Modalità esercizio

Ogni strumento ha tre modi:

1. **Esplora:** l'allievo muove punti e legge subito calcoli e disegno (laboratorio, LIM).
2. **Guidato:** inserisce i dati di un esercizio (i suoi, o un esempio precaricato) e vede i passaggi uno alla volta (pulsante «passaggio successivo»).
3. **Esercizio:** l'app (o il docente) pone la domanda; lo studente scrive la risposta (\(m\), equazione, coordinate, sì/no, «parallele», ecc.); poi controlla. Il controllo accetta forme equivalenti (\(y=2x-8\) e \(2x-y-8=0\); \(\frac{10}{\sqrt5}\) e \(2\sqrt5\)). In caso di errore, mostrare il disegno e i passaggi, senza linguaggio punitivo.

Precaricare, come banco di prova e come esercizi di classe, i problemi elencati in questa sezione (verifiche, simulazioni, brief, schede). Le *soluzioni* non devono apparire in un foglio stampabile «per lo studente»; in app compaiono solo dopo il tentativo, o in una vista docente attivabile localmente (niente account).

---

## 5. Requisiti tecnici (suggeriti, non vincolanti)

Sono indicazioni di implementazione: si può scegliere uno stack diverso se il risultato è lo stesso.

- Web app statica: HTML + CSS + JavaScript, senza backend obbligatorio. Distribuzione: cartella di file da aprire anche da disco, o GitHub Pages, o un unico `index.html` con asset locali.
- Libreria grafica consigliata: JSXGraph, oppure `canvas`/SVG. Qualunque scelta, la griglia deve avere **unità isometriche**, zoom e pan, e funzionare al tocco (LIM e telefono).
- Offline: niente dipendenze remote indispensabili a runtime (o bundle/vendor locale). Se si usa un CDN in sviluppo, la build di consegna deve stare in piedi senza rete.
- Mobile first e LIM: area grafica grande, controlli sotto o a lato che non coprano il disegno, font leggibile, contrasto alto. Test reale a larghezze tipo 360 px e tipo proiettore.
- Nessun login, nessun cookie di tracciamento, nessun invio di dati. Eventuale «ultimo lavoro» solo in `localStorage` sul dispositivo, cancellabile, mai obbligatorio.
- Aritmetica razionale esatta (frazioni intere, radicali quadratici semplici). Non basarsi su `number` in virgola mobile per i risultati che lo studente legge. Un decimale approssimato, se c'è, è un extra etichettato («calcolatrice: \(\approx\) …»).
- Parsing robusto delle notazioni italiane (`P(1;2)`, `y=-1/2x+3`, `2x-y+1=0`).
- Interfaccia e messaggi in italiano; simboli \(\parallel\), \(\perp\); punti con punto e virgola.
- Codice leggibile, test automatici sui casi del §6. README breve in italiano: come aprire l'app, come lanciare i test, come aggiungere un esercizio.

Non è richiesto un backend, un database, un'app nativa, né un editor tipo GeoGebra Class con classi e compiti in cloud.

---

## 6. Criteri di accettazione e test

I test seguenti devono passare, con uguaglianza esatta (forme equivalenti ammesse).

| # | Input | Output atteso |
|---|---|---|
| 1 | \(A(1;2)\), \(B(3;6)\) | \(m=2\), retta \(y=2x\) |
| 2 | \(A(0;2)\), \(B(2;6)\) | \(m=2\), \(y=2x+2\) |
| 3 | \(A(2;5)\), \(B(-2;5)\) | retta orizzontale \(y=5\), \(m=0\) |
| 4 | \(A(3;1)\), \(B(3;-4)\) | retta verticale \(x=3\), \(m\) non esiste |
| 5 | \(y=2x+1\), punti \(x=-1,0,1,2\) | \((-1;-1)\), \((0;1)\), \((1;3)\), \((2;5)\) |
| 6 | \(y=2x+1\), \(P(2;5)\), \(Q(1;4)\) | \(P\) appartiene, \(Q\) no |
| 7 | \(y=3x-2\) e \(y=-x+6\) | intersezione \((2;4)\) |
| 8 | \(3x-y-7=0\) e \(x+2y-7=0\) | intersezione \((3;2)\) |
| 9 | \(y=3x+1\) e \(y=3x-2\) | parallele distinte, nessun punto comune |
| 10 | \(x+2y-4=0\) e \(2x+4y-8=0\) | coincidenti |
| 11 | \(y=3x-1\), \(y=-\frac13 x+2\), \(y=3x+4\), \(y=-3x\) | \(r_1\parallel r_3\); \(r_2\perp r_1\) e \(r_2\perp r_3\); \(r_4\) nessuna |
| 12 | parallela a \(y=2x-1\) per \(A(1;4)\) | \(y=2x+2\) |
| 13 | perpendicolare a \(y=2x-1\) per \(B(2;3)\) | \(y=-\frac12 x+4\) |
| 14 | \(r:\ x+2y-2=0\), \(P(4;0)\): \(\parallel\) e \(\perp\) | \(y=-\frac12 x+2\); \(y=2x-8\) |
| 15 | \(r:\ y=x+1\), \(P(5;0)\) | \(P\notin r\); \(\perp\) \(y=-x+5\); \(H(2;3)\) |
| 16 | \(A(1;2)\), \(B(5;6)\): asse | \(y=-x+7\) (o \(x+y-7=0\)) |
| 17 | \(A(0;0)\), \(B(4;2)\): asse | \(y=-2x+5\); passa per \(C(1;3)\) |
| 18 | \(P(-3;1)\), \(4x-3y+5=0\) | \(d=2\) |
| 19 | \(P(2;-1)\), \(3x+4y+8=0\) | \(d=2\) |
| 20 | \(P(5;0)\), \(y=2x\), metodo lungo e formula | \(H(1;2)\), \(d=2\sqrt5\) |
| 21 | \(A(0;0)\), \(B(4;2)\), \(C(1;3)\): \(CA\), \(CB\), area | \(CA=CB=\sqrt{10}\), \(h=\sqrt5\), area \(5\) |
| 22 | \(A(1;1)\), \(B(4;5)\), \(C(5;3)\): circocentro | \(\bigl(\frac52;3\bigr)\) |
| 23 | \(A(0;0)\), \(B(2;1)\), \(C(6;3)\) | allineati, \(m=\frac12\) |
| 24 | \(A(-2;-1)\), \(B(0;3)\), \(C(1;6)\) | non allineati |
| 25 | parallele \(y=2x+1\) e \(y=2x-4\) | distanza \(\sqrt5\) |
| 26 | \(P(-2;6)\), \(Q(1;-3)\), \(R(2;-6)\), \(S(-1;2)\) | retta \(y=-3x\); \(R\) sì, \(S\) no |
| 27 | \(A(-2;1)\), \(B(4;4)\), \(P(2;3)\), \(Q(6;6)\) | \(y=\frac12 x+2\); \(P\) sì, \(Q\) no |

Oltre ai test numerici: l'app si apre senza rete; è usabile a una larghezza da telefono; trascinare \(A\) e \(B\) ricalcola \(m\) e la retta; una retta verticale non fa crash; le unità degli assi sono uguali (un quadrato della griglia è un quadrato).

---

## 7. Fuori scopo

Non implementare, o non presentare come funzione principale:

- CAS avanzato (semplificazione simbolica generica, derivate, integrali, scomposizioni alla Wolfram).
- Analisi da quinta: limiti, continuità, derivate, studio di funzione completo, asintoti obliqui, forme indeterminate, funzioni a tratti. (Sono argomenti delle classi quinte dello stesso docente, con regole diverse: niente funzioni a tratti e niente asintoti obliqui *negli scritti* delle quinte; comunque non appartengono a questa app.)
- Probabilità e statistica (escluse dal programma di matematica di base).
- Coniche oltre la parabola, salvo un eventuale modulo «circonferenza» spento di default e da confermare.
- Trigonometria, numeri complessi, geometria dello spazio, geometria sferica (la scheda sul quinto postulato può citare un triangolo da 270°, ma l'app resta nel piano euclideo).
- Account, classi in cloud, raccolta di compiti o di dati studenti, voti, login.
- Contatto con studenti, famiglie o colleghi: questa app è solo uno strumento didattico.
- Generatore automatico di verifiche o di voti.
- Versione che *richieda* GeoGebra, un server Python, o un'installazione nativa.

---

## 8. Fonti e stato delle informazioni

Tutto ciò che riguarda *esercizi già fatti* e *stato delle classi a novembre 2026* proviene da materiali reali del docente e dalle sue note, non da invenzione. In particolare:

- Programma ufficiale di terza (geometria analitica con distanza, punto medio, retta, parabola, asse, distanza punto-retta; disequazioni di secondo grado; funzioni ed equazioni esponenziali e logaritmiche; uso della calcolatrice; niente probabilità/statistica): indicato dal docente per le terze di matematica di base.
- Verifiche e simulazioni: `verifica-3B-23nov`, `simulazione-3B-19nov`, `verifica-3ACUC-1dic` (stesso testo della 3B), `verifica-3F-1dic`, con le rispettive soluzioni.
- Schede e lezioni: `lezione-3B-asse-distanza`, `esercizi-3F-17nov`, `orali-3ACUC`, `compito-3B-es3`, deck `sv3B_rette_parallele_perpendicolari`, schede di lettura su Cartesio e sul quinto postulato.
- Brief quotidiani da ottobre a novembre 2026 (`brief-2210` … `brief-2511`) e note del docente del 25 novembre 2026 (recupero 3B con 2 assenti ancora da fare, schede non lette; 3A ripasso distanza punto-retta e simulazione il 30 novembre; 3F sistemi per le intersezioni, simulazione 27+30 novembre).
- Indicazioni didattiche confermate: 3B senza mediana; 3A stesso scritto della 3B il 1 dicembre, poi parabola; 3F percorso più stretto; risultati razionali quando i dati lo permettono; notazione \(P(x;y)\).

**Confermato da fonti.** Blocco della retta (tutti gli strumenti dei §4.1–4.14, con gli esempi numerici di questa specifica); differenza di ritmo 3F vs 3A/3B; esclusione della mediana in 3B; parabola, disequazioni di secondo grado, esponenziali e logaritmi, calcolatrice come argomenti *di programma* ancora da svolgere; fine lezioni 9 giugno 2027.

**Previsto, da confermare.** Dettaglio degli esercizi su parabola, disequazioni di secondo grado, esponenziali e logaritmi (il nucleo del §4.16–4.18 è lo standard semplice, non una scheda già assegnata); se e quando la 3F arriverà ad asse e formula della distanza; mediana in 3A; circonferenza come curva; fuoco e direttrice della parabola; disequazioni esponenziali/logaritmiche in terza.

Se, in fase di costruzione, un esempio di questa specifica e un calcolo dell'app non coincidono, ha ragione l'esempio verificato nei PDF (le soluzioni delle verifiche sono state controllate con SymPy). Segnala la discrepanza invece di «aggiustare» l'esercizio.
