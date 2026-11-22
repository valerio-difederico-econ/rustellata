# Rustellata

**Sito pubblico:** [Apri Rustellata](https://rustellata-valerio.oakenwillow9.chatgpt.site)

Un calcolatore per organizzare la spesa di arrosticini: persone, porzioni, peso, prezzo, budget e cuociate. Nato dall'[Arrosticini Utility Optimizer](https://github.com/valerio-difederico-econ/arrosticini-optimizer) di Valerio Di Federico, mantiene l'identità abruzzese e mette al centro una decisione concreta: quanto comprare e quanto spendere a testa.

Il percorso è sequenziale: **compagnia → spesa → fornacella**. Il piano si mostra soltanto dopo il pulsante finale “Mostra il piano della serata”. Ogni passaggio controlla i propri dati prima di proseguire; è possibile tornare indietro. Dati salvati e link condivisi precompilano il percorso senza mostrare subito il risultato.

## Cosa calcola

- Porzioni modificabili: arrosticini protagonisti della cena oppure accompagnati da altre portate.
- Quantità in pezzi e chilogrammi, con un margine extra facoltativo.
- Acquisto al kg o per confezioni intere, con gli eventuali pezzi in avanzo.
- Budget della festa dalla quota a testa; costo degli arrosticini e residuo automatico per il resto.
- Costo totale, costo per persona e differenza rispetto al budget disponibile.
- Tre fornacelle preimpostate, **piccola, media e grande**, con carichi prudenziali fissi; nessun campo di capienza da compilare.
- Tempi indicativi che separano preparazione, cottura e cambio tra le cuociate.
- Una lista della spesa da copiare e stampare.

Il calcolo principale avviene nel browser. Non servono account, chiavi API o servizi esterni. Il residuo per bevande, contorni e accessori è il budget totale meno gli arrosticini: non viene chiesto un accantonamento anticipato. Queste altre voci non sono ancora stimate singolarmente.

## Ipotesi e dati

La configurazione iniziale usa 10 persone, 20 pezzi per persona e 23 g per pezzo. Le porzioni sono impostazioni pratiche modificabili, non raccomandazioni nutrizionali.

Il formato selezionato fissa la grammatura e carica un **prezzo di riferimento con fascia indicativa**, ricavato da listini e confronti tra formati vicini. I classici da 23 g partono da 22 €/kg con fascia di pianificazione 20–25 €/kg. Non sono medie di mercato né preventivi garantiti. Chi conosce il prezzo del proprio acquisto può aprire “Personalizza”; solo il formato personalizzato consente un altro peso.

Grammature e capienze nominali provengono da Abruzzo Arrosticini. La calibrazione dei prezzi confronta Amadio Carni, La Bottega Sapori e Delizie, Di Cola, La Cantina del Pastore e Cic Carni, consultati il 22 novembre 2026. La stima riguarda la carne, senza spedizione aggiuntiva. Metodo, riscontri, analogie tra grammature e incongruenze sono documentati in [docs/SOURCES.md](docs/SOURCES.md).

Le tre fornacelle pianificano 20, 30 e 45 pezzi per volta: sono assunzioni prudenziali del modello, inferiori ai massimi commerciali, non misurazioni. I tempi (8/10 minuti per cuociata in base al formato, 25 per preparare la brace, 2 tra cuociate) restano ipotesi organizzative, non istruzioni di cottura validate. La proposta per rientrare nel budget usa l'estremo alto della fascia di prezzo.

Il piano programma i pezzi richiesti, compresa la scorta esplicitamente scelta. I pezzi acquistati in più per arrotondare alle confezioni sono mostrati come avanzo e non vengono automaticamente aggiunti alle cuociate.

## Avvio con Flask

Richiede Python 3.10 o successivo.

```bash
git clone https://github.com/valerio-difederico-econ/rustellata.git
cd rustellata
python -m venv .venv
```

Attivare l'ambiente virtuale:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Quindi:

```bash
python -m pip install -r requirements.txt
python app.py
```

Aprire `http://127.0.0.1:5000`. Il `Procfile` conserva l'avvio Gunicorn per ambienti compatibili.

## Versione statica

Richiede Node.js 20 o successivo. Non ci sono dipendenze npm da installare.

```bash
node scripts/build-static.mjs
python -m http.server 8080 --directory dist
```

Aprire `http://127.0.0.1:8080`. La cartella generata `dist/` è distribuibile su un hosting statico. Il laboratorio storico richiede invece Flask.

Per generare un unico file HTML da aprire direttamente nel browser, senza server:

```bash
node scripts/export-standalone.mjs
```

Aprire `dist/rustellata.html`. Il calcolatore è autonomo; i font hanno un fallback locale. La condivisione tramite link è utile quando la pagina è ospitata su un sito accessibile ai destinatari. Un collegamento a un file locale funziona solo sul proprio dispositivo.

## Verifica

```bash
node --test tests/planner-engine.test.mjs
python -m unittest discover -s tests -p "test_*.py"
```

I test del motore coprono arrotondamenti, acquisto in confezioni, budget, scorta, cuociate e input non validi. I test Flask verificano pagine e compatibilità dell'API storica, inclusi errori JSON e valori fuori intervallo.

## Laboratorio originale

Il precedente esperimento con la funzione di utilità rimane disponibile su `/laboratorio`, insieme all'API `POST /api/calculate`. È un modello illustrativo con parametri scelti a mano, non una stima econometrica o una guida scientifica alla cottura.

Esempio di richiesta:

```json
{
  "temperature": 200,
  "time": 8,
  "turns": 1,
  "type": "Artisanal",
  "salting": "Before Cooking"
}
```

L'API accetta temperature tra 100 e 300, tempi tra 1 e 20 e girate intere tra 1 e 10. Le tipologie ammesse sono `Classic`, `Medium`, `Artisanal`; la salatura accetta `Before Cooking`, `During Cooking`, `After Cooking`. Richieste non valide ricevono `400` con un oggetto JSON contenente `error`.

## Struttura

```text
app.py                         Flask e API del laboratorio storico
templates/index.html           Organizzatore della rustellata
static/planner-engine.js       Calcoli e validazione, senza DOM
static/planner.js              Interazioni dell'organizzatore
static/planner.css             Stile responsive
templates/laboratorio.html     Interfaccia storica
static/laboratorio.js          Script storico
static/laboratorio.css         Stile storico
docs/SOURCES.md                Fonti, limiti e ipotesi dei dati
tests/                         Test del motore e di Flask
scripts/build-static.mjs       Preparazione dell'hosting statico
```

Autore del progetto originale: **Valerio Di Federico**. Licenza MIT.
