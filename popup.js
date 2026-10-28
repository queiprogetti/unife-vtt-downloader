const statusEl = document.getElementById('status');
const filenameEl = document.getElementById('filename');
const timestampsEl = document.getElementById('timestamps');
const buttons = [...document.querySelectorAll('button')];
let transcript = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.background = isError ? '#fce8e6' : '#eaf0fb';
}

function safeFilename(value) {
  return (value || 'trascrizione').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 150) || 'trascrizione';
}

function formatLabel(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') : m + ':' + String(s).padStart(2, '0');
}

function buildTxt(includeTimestamps) {
  return transcript.segments.map(segment =>
    includeTimestamps ? '[' + formatLabel(segment.seconds) + '] ' + segment.text : segment.text
  ).join('\n\n') + '\n';
}

function toVttTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return h + ':' + m + ':' + s + '.' + String(ms % 1000).padStart(3, '0');
}

function buildVtt() {
  if (transcript.rawVtt) return transcript.rawVtt.endsWith('\n') ? transcript.rawVtt : transcript.rawVtt + '\n';
  return 'WEBVTT\n\n' + transcript.segments.map((segment, index) => {
    const next = transcript.segments[index + 1];
    const end = next && next.seconds > segment.seconds ? next.seconds : segment.seconds + 2;
    return toVttTime(segment.seconds) + ' --> ' + toVttTime(end) + '\n' + segment.text;
  }).join('\n\n') + '\n';
}

function downloadText(content, extension, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFilename(filenameEl.value) + '.' + extension;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function extractVimeoTranscript(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: () => ({
      pageTitle: document.title,
      pageUrl: location.href,
      tracks: [...document.querySelectorAll('track[src]')].map(track => ({
        src: track.src, language: track.srclang, kind: track.kind, label: track.label
      }))
    })
  });

  const playerResult = results.find(result =>
    result.result?.pageUrl?.startsWith('https://player.vimeo.com/') &&
    result.result.tracks?.some(track => track.src)
  );
  const track = playerResult?.result?.tracks?.find(item => item.src);
  if (!track) throw new Error('Non trovo una traccia sottotitoli nel player Vimeo. Apri la lezione e verifica che il pannello Transcript sia disponibile, poi riprova.');

  const trackUrl = new URL(track.src);
  if (trackUrl.protocol !== 'https:' || trackUrl.hostname !== 'captions.vimeo.com') {
    throw new Error('La traccia trovata non proviene dal dominio captions.vimeo.com previsto.');
  }

  let vttResponse;
  try {
    vttResponse = await fetch(trackUrl.href, { credentials: 'omit', cache: 'no-store' });
  } catch (error) {
    throw new Error('Non riesco a scaricare la traccia Vimeo (' + error.message + '). Verifica la connessione e riprova.');
  }
  if (!vttResponse.ok) throw new Error('Download della traccia Vimeo non riuscito: HTTP ' + vttResponse.status + '. Riapri la lezione per aggiornare il link temporaneo e riprova.');

  const rawVtt = await vttResponse.text();
  if (!/^WEBVTT(?:\s|$)/.test(rawVtt)) throw new Error('La risorsa ricevuta non sembra essere un file WebVTT valido.');
  const segments = parseVtt(rawVtt);
  if (!segments.length) throw new Error('Il file VTT è valido, ma non contiene segmenti di testo riconoscibili.');

  const mainFrame = results.find(result => result.frameId === 0)?.result;
  const moodleTitle = (mainFrame?.pageTitle || '').replace(/\s*[-|]\s*(Moodle|e-learning).*$/i, '').trim();
  const playerTitle = playerResult.result.pageTitle.replace(/\s*[-|].*$/, '').trim();
  return { ok: true, source: 'UniFE / Vimeo', title: moodleTitle || playerTitle || 'trascrizione-unife', segments, rawVtt };
}

function parseVtt(vtt) {
  const normalized = vtt.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const blocks = normalized.split(/\n{2,}/);
  const segments = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeIndex = lines.findIndex(line => /(?:\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(?:\d{2}:)?\d{2}:\d{2}\.\d{3}/.test(line));
    if (timeIndex < 0) continue;
    const match = lines[timeIndex].match(/((?:\d{2}:)?\d{2}:\d{2})\.(\d{3})\s+-->/);
    if (!match) continue;
    const parts = match[1].split(':').map(Number);
    const seconds = (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]) + Number(match[2]) / 1000;
    const text = lines.slice(timeIndex + 1).join(' ').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
    if (text) segments.push({ seconds, text });
  }
  return segments.sort((a, b) => a.seconds - b.seconds);
}

async function extract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error('Non riesco a individuare la scheda attiva.');
  const url = new URL(tab.url);
  if (!['drive.google.com', 'elearning.unife.it'].includes(url.hostname)) throw new Error('Apri un webinar Google Drive o una videolezione UniFE.');
  if (url.hostname === 'drive.google.com' && !url.pathname.startsWith('/file/d/')) throw new Error('Apri il video Google Drive nella pagina del file.');

  const response = url.hostname === 'elearning.unife.it'
    ? await extractVimeoTranscript(tab.id)
    : await chrome.tabs.sendMessage(tab.id, { type: 'UNIFE_VTT_EXTRACT' });

  if (!response?.ok) throw new Error(response?.reason || 'Trascrizione non trovata.');
  transcript = response;
  filenameEl.value = safeFilename(response.title || 'trascrizione');
  setStatus('Trovati ' + response.segments.length + ' segmenti su ' + response.source + '.');
  buttons.forEach(button => button.disabled = false);
}

buttons.forEach(button => button.disabled = true);
extract().catch(error => setStatus(error.message, true));

document.getElementById('download-vtt').addEventListener('click', () => {
  if (!transcript) return;
  downloadText(buildVtt(), 'vtt', 'text/vtt');
  setStatus('File VTT generato con ' + transcript.segments.length + ' segmenti.');
});

document.getElementById('download-txt').addEventListener('click', () => {
  if (!transcript) return;
  downloadText(buildTxt(timestampsEl.checked), 'txt', 'text/plain');
  setStatus('File TXT generato.');
});

document.getElementById('copy-txt').addEventListener('click', async () => {
  if (!transcript) return;
  try {
    await navigator.clipboard.writeText(buildTxt(timestampsEl.checked));
    setStatus('Trascrizione copiata negli appunti.');
  } catch {
    setStatus('Chrome non ha consentito l’accesso agli appunti. Usa Scarica TXT.', true);
  }
});
