# Installazione su Firefox

## Prova rapida (installazione temporanea)

L'installazione temporanea serve per testare l'estensione. Rimane attiva finché non chiudi Firefox.

1. Apri Firefox e vai su `about:debugging#/runtime/this-firefox`
2. Clicca su **Carica componente aggiuntivo temporaneo…**
3. Seleziona il file `manifest.json` contenuto nella cartella dell'estensione (o nello ZIP estratto)
4. L'estensione compare nell'elenco: **UniFE VTT Downloader**

### Prima esecuzione

In Firefox, i permessi per leggere drive.google.com, elearning.unife.it e le tracce Vimeo **non vengono concessi automaticamente**: al primo utilizzo il popup mostrerà un pulsante **Concedi permessi**. Premilo una volta sola e conferma. Da quel momento l'estensione funzionerà senza richieste ulteriori.

Se riapri il popup e vedi ancora il pulsante, significa che i permessi non sono stati concessi: rimuovili da `about:addons` → UniFE VTT Downloader → Permessi e riprova.

## Installazione permanente

Per tenere l'estensione installata stabilmente, Firefox richiede un pacchetto XPI **firmato da Mozilla**. La firma è gratuita e non richiede la pubblicazione nel catalogo pubblico addons.mozilla.org: si può distribuire il file direttamente da GitHub (canale "unlisted").

Procedura:

1. Crea un account su [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. Carica il pacchetto come estensione non elencata (self-distribution)
3. Mozilla firma il pacchetto e restituisce l'XPI firmato
4. Pubblica l'XPI nel repository GitHub
5. Gli utenti installano aprendo l'XPI da Firefox (Strumenti → Componenti aggiuntivi → Installa componente aggiuntivo da file)

## Note tecniche

- **Namespace API**: il codice usa uno shim (`browser` su Firefox, `chrome` su Chrome/Edge), quindi la stessa cartella funziona su entrambi i browser.
- **Permessi host**: su Chrome/Edge sono concessi all'installazione; su Firefox MV3 sono opzionali e vengono richiesti al primo utilizzo tramite pulsante nel popup.
- **Versione minima Firefox**: 115.0 (per Manifest V3 con `scripting`).
- **Elaborazione locale**: la trascrizione non viene inviata a server esterni.
