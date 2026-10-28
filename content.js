(() => {
  function parseTimeLabel(label) {
    const match = label.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function secondsToVtt(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    const h = String(Math.floor(whole / 3600)).padStart(2, '0');
    const m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
    const s = String(whole % 60).padStart(2, '0');
    return `${h}:${m}:${s}.000`;
  }

  function extractDriveTranscript() {
    const rows = [...document.querySelectorAll('[role="button"][data-timestamp][aria-label^="Segmento che inizia a"]')];
    const seen = new Set();
    const segments = [];

    for (const row of rows) {
      const timestampNodes = [...row.querySelectorAll('[data-timestamp]')];
      const timeNode = timestampNodes.find(node => /^\d{1,2}:\d{2}(?::\d{2})?$/.test(node.textContent.trim()));
      if (!timeNode) continue;
      const seconds = parseTimeLabel(timeNode.textContent);
      if (seconds === null) continue;

      // In Drive il testo della frase è un elemento distinto con data-timestamp.
      const textNode = timestampNodes.find(node => node !== row && node !== timeNode && node.textContent.trim() && !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(node.textContent.trim()));
      const text = (textNode?.innerText || '').trim();
      if (!text) {
        const aria = row.getAttribute('aria-label') || '';
        const match = aria.match(/^Segmento che inizia a\s+\d{1,2}:\d{2}(?::\d{2})?,\s*(.*)$/s);
        if (match) segments.push({ seconds, text: match[1].trim() });
        continue;
      }
      const key = `${seconds}\u0000${text}`;
      if (!seen.has(key)) {
        seen.add(key);
        segments.push({ seconds, text });
      }
    }

    segments.sort((a, b) => a.seconds - b.seconds);
    return segments;
  }

  function extractUnifeTranscript() {
    // Prima versione: nessuna estrazione euristica su Moodle finché non ne verifichiamo il player.
    return [];
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'UNIFE_VTT_EXTRACT') return;
    try {
      const isDrive = location.hostname === 'drive.google.com';
      const segments = isDrive ? extractDriveTranscript() : extractUnifeTranscript();
      sendResponse({
        ok: segments.length > 0,
        source: isDrive ? 'Google Drive' : 'UniFE',
        title: document.title.replace(/\s*-\s*Google Drive\s*$/, '').trim(),
        segments,
        reason: isDrive
          ? (segments.length ? '' : 'Non ho trovato segmenti della trascrizione. Apri il pannello Trascrizione in Google Drive e riprova.')
          : 'Il supporto per il player UniFE sarà aggiunto dopo aver verificato come carica i sottotitoli.'
      });
    } catch (error) {
      sendResponse({ ok: false, reason: `Error durante la lettura della trascrizione: ${error.message}` });
    }
    return true;
  });
})()