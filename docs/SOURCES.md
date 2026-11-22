# Fonti e calibrazione della previsione

Consultazione: **22 novembre 2026**. Sono listini pubblicati da singoli venditori, non una rilevazione rappresentativa del mercato. La consultazione non garantisce che il prezzo sia aggiornato al checkout. Separiamo i dati osservati dalle scelte del modello.

## Prezzi osservati

| Venditore e fonte diretta | Dato nella pagina | Canale e limiti |
| --- | --- | --- |
| [Amadio Carni, Cappelle sul Tavo](https://www.amadiocarni.it/arrosticini/) | 25–26 g a 25 €/kg; rimaneggiati 33–34 g a 27 €/kg | Ritiro in macelleria; si paga il peso effettivo. Prezzi espliciti al kg. |
| [La Bottega Sapori e Delizie](https://labottegasaporiedelizie.it/product-category/carni/arrosticini/) | Pecora da 20, 30 e 40 g a 19,90 €/kg | Ritiro/consegna locale; ordine minimo 25 €; consegna gratuita oltre 50 € entro 10 km. Sono prezzi della carne, non un prezzo comprensivo di spedizione nazionale. |
| [Azienda Agricola Di Cola](https://www.aziendaagricoladicola.it/prodotto/arrosticini-di-pecora/) | Fatti a mano, 1 kg a 23,90 € | Il peso del singolo pezzo non è dichiarato: confronto di famiglia, non quotazione esatta per 30 g. |
| [La Cantina del Pastore](https://www.lacantinadelpastore.it/prodotto/lavorato-mano/) | Fatti a mano da 30–33 g: 50 pezzi 48 €, 100 pezzi 94 €, 200 pezzi 175 €, 500 pezzi 400 € | Per 100 pezzi: 3–3,3 kg nominali, quindi 28,48–31,33 €/kg, calcolati. Ritiro gratuito; trasporto 15 € separato. Non si presume che ogni quantità abbia lo stesso prezzo unitario. |
| [Cic Carni, fatti a mano](https://ciccarni.it/prodotto/arrosticini-dabruzzo-fatti-a-mano-66-pz/) | 66 pezzi da 30 g, confezione dichiarata di circa 2 kg, 64 € | 32 €/kg sul peso dichiarato della confezione; 66×30 g darebbe invece 1,98 kg. Trasporto aggiuntivo da 16 €, gratuito sopra 200 € secondo il sito. Confronto secondario, non preventivo consegnato. |
| [Cic Carni, PRIME da 38 g](https://ciccarni.it/prodotto/arrosticissimi-di-filetto-38-gr-66-pz/) | 66 pezzi da 38 g, 66 € | 26,32 €/kg calcolati su 66×38 g = 2,508 kg nominali. La pagina contiene anche pesi complessivi differenti: riferimento secondario, con spedizione esclusa. |

Non abbiamo usato prezzi di ristoranti per carne cotta, listini B2B senza confronto con IVA, volantini scaduti o l'offerta 112 pezzi/79 € con spedizione inclusa come stima locale al kg. Il listino ICA non entra nella calibrazione perché pagina aperta e indice di ricerca riportavano dati diversi.

## Valori usati dal modello

| Formato fisso | Riferimento €/kg | Fascia di pianificazione €/kg | Motivazione |
| --- | ---: | ---: | --- |
| Classici 23 g | 22 | 20–25 | Formati vicini da 20–25 g: La Bottega 19,90, Amadio 25. Il riferimento 22 è una scelta arrotondata del modello, non una quotazione esatta dei 23 g. |
| Intermedi 25 g | 25 | 20–27 | Riferimento diretto Amadio; estremi estesi alla famiglia di formati vicini. |
| Medi 30 g | 22 | 20–27 | La Bottega 30 g a 19,90; confronto di famiglia con i 33–34 g Amadio a 27. |
| Fatti a mano 30 g | 30 | 24–32 | Riferimenti Di Cola, Cantina del Pastore e Cic Carni, con diverse grammature e confezioni. |
| Grandi 38 g | 26,50 | 20–27 | Riscontro nominale Cic Carni 26,32, confrontato con formati vicini da 33–40 g. |

Le fasce sono **ipotesi editoriali per pianificare la spesa**, informate dai riscontri; non sono minimi/massimi di tutti i venditori, medie regionali, intervalli di confidenza o prezzi garantiti. Alcuni confronti usano grammature vicine. Il modello considera il costo della carne; non aggiunge spedizione, vincoli minimi di acquisto o promozioni dei venditori. Per un'offerta conosciuta si usa “Personalizza”, inclusa l'eventuale modalità a confezioni.

Il costo centrale usa il riferimento; la fascia di spesa moltiplica il peso previsto per i due estremi. La proposta di porzione sostenibile usa l'estremo alto, per lasciare margine nella pianificazione. Non garantisce che il prezzo effettivo rientri nella fascia.

## Grammature

I formati di partenza provengono dalle schede [classici 22–23 g](https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-piccoli-da-20g-al-pezzo/), [intermedi 25 g](https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-intermedi-da-25g-al-pezzo/), [medi 30 g](https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-medi-da-32g-in-cartoncino/), [fatti a mano 30 g](https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-fatti-a-mano-da-30g/) e [grandi 38 g](https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-lavorati-a-mano-da-38g/) di Abruzzo Arrosticini.

Un formato scelto ha grammatura fissa. Solo “Formato personalizzato” permette di inserire un altro peso. Le schede originali hanno alcune incongruenze tra pezzi e peso della confezione: 112 classici con circa 2,3–2,4 kg; 60 fatti a mano da 30 g con testi da 1,5 o 1,8 kg; medi da 30 g con 80 o 84 pezzi; grandi da 38 g con circa 2,3 o 2,5 kg. Il peso calcolato dall'app è perciò una stima nominale, non il peso alla bilancia.

## Fornacelle: tre profili fissi

| Scelta | Spazio utile dichiarato | Massimo commerciale | Carico pianificato |
| --- | --- | ---: | ---: |
| Piccola | 39×11 cm | 25–30 pezzi | 20 pezzi |
| Media | 69×11 cm | 50 pezzi | 30 pezzi |
| Grande | 97×11 cm | 70 pezzi | 45 pezzi |

Fonti commerciali: [INOX 50](https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-50-cm/), [INOX 80](https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-80-cm/), [INOX 110](https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-110-cm/).

**20/30/45 sono carichi prudenziali scelti per il piano**, rispondendo all'osservazione dell'utente che raramente si cuoce al pieno pubblicizzato. Non sono capacità effettive misurate né valori dichiarati dal produttore. Nell'interfaccia si sceglie soltanto la dimensione; i numeri non sono campi modificabili e non si moltiplicano automaticamente per la grammatura.

## Porzioni e tempi

20 pezzi per la cena centrata sugli arrosticini e 10 con altra carne derivano dall'esperienza dell'utente e sono compatibili con indicazioni commerciali. 6 pezzi con più portate è un'ipotesi del modello. La porzione resta una scelta modificabile; la grammatura non è una misura automatica della sazietà.

Le stime di servizio usano 8 minuti per i formati 23/25 g, 10 per 30/38 g, 25 minuti di preparazione e 2 minuti tra cuociate. **Sono ipotesi organizzative, non tempi calibrati sperimentalmente o istruzioni per determinare il grado di cottura.** Le pagine consultate non forniscono dati sufficienti per ricavarli in modo affidabile. Si cuociono le porzioni e la scorta richiesta; gli avanzi da confezionamento non entrano nel piano. L'ultima cuociata ha la stessa durata stimata delle altre; non c'è un cambio dopo l'ultima.

Il riferimento di 20 € a testa deriva dall'esperienza dell'utente. Il budget totale è persone × quota; sottraendo gli arrosticini si ottiene il residuo per bevande, contorni, carbone e accessori. Non viene chiesto un accantonamento anticipato. Tali acquisti non sono ancora stimati singolarmente. Per esempio: 10×20 € = 200 €; meno 101,20 € di arrosticini = 98,80 € per il resto (9,88 € a testa). Il residuo può essere negativo se gli arrosticini superano la quota totale.
