# UniFE VTT Downloader — versione 0.2.1

Estensione Chrome Manifest V3 per esportare localmente le trascrizioni di Google Drive e delle videolezioni UniFE ospitate su Vimeo.

## Funzioni
- **Google Drive:** legge i segmenti dal pannello Trascrizione quando è aperto.
- **UniFE/Vimeo:** cerca nei frame del player una traccia `<track>` e scarica il WebVTT originale da `captions.vimeo.com`.
- Esporta TXT con o senza timestamp.
- Copia il TXT negli appunti.
- Esporta VTT: per Vimeo conserva il file originale e i suoi timestamp; per Google Drive ricostruisce il VTT dai segmenti visibili e stima i tempi finali.
- Le trascrizioni vengono elaborate localmente; non sono inviate a servizi terzi.

## Installazione da GitHub (Chrome)

1. Apri la [pagina del progetto](https://github.com/queiprogetti/unife-vtt-downloader).
2. Premi **Code** → **Download ZIP**.
3. Estrai lo ZIP in una cartella stabile.
4. Apri `chrome://extensions` in Chrome.
5. Attiva **Modalità sviluppatore**.
6. Premi **Carica estensione non pacchettizzata** e seleziona la cartella estratta che contiene `manifest.json`.
7. Apri una videolezione UniFE oppure un video Google Drive con il pannello Trascrizione aperto, quindi fai clic sull'icona dell'estensione.

Per installarla su un altro computer, ripeti la procedura su quel Chrome. Il repository non sincronizza automaticamente l'estensione o i suoi aggiornamenti: quando viene pubblicata una nuova versione, scarica ed estrai nuovamente il codice e premi **Ricarica** nella scheda dell'estensione selezionando la cartella aggiornata.

## Installazione o aggiornamento da un archivio ZIP

1. Estrai lo ZIP in una cartella stabile.
2. Apri `chrome://extensions`.
3. Attiva **Modalità sviluppatore**.
4. Se è già installata la versione precedente, sostituisci i file e premi **Ricarica**; altrimenti premi **Carica estensione non pacchettizzata** e seleziona la cartella estratta.
5. Apri la lezione UniFE oppure un video Google Drive con il pannello Trascrizione aperto.
6. Fai clic sull'icona dell'estensione.

## Permessi

L'estensione dichiara accesso solo a `drive.google.com`, `elearning.unife.it`, `player.vimeo.com` e `captions.vimeo.com`. Il permesso `scripting` serve a individuare la traccia nei frame del player Vimeo. Il download del VTT viene effettuato dalla pagina dell'estensione, quindi non è soggetto alla CSP della pagina Moodle/Vimeo.

## Limiti noti

- Il supporto UniFE presuppone che il player esponga una traccia `<track>` con URL HTTPS su `captions.vimeo.com`. Se la piattaforma cambia il player o non pubblica una traccia, l'estensione mostra un errore.
- I link alle tracce Vimeo possono essere firmati e temporanei: l'estensione li recupera nuovamente a ogni utilizzo.
- Il VTT di Google Drive è ricostruito dai segmenti visualizzati; i timestamp di fine sono stimati. Per Google Drive, il TXT è preferibile se serve soprattutto il contenuto testuale.

## Versione

La versione pubblicata in questo archivio è **0.2.1**. Il progetto non è un prodotto ufficiale dell'Università di Ferrara né di Google o Vimeo.

## Licenza

Distribuito con licenza MIT; vedere [LICENSE](LICENSE).
