/* =========================================================
   TOCA AÍ — sw.js (service worker)
   Um "funcionário" que fica entre o app e a internet:
   - Na instalação, guarda todos os arquivos do app no celular.
   - Depois, entrega os arquivos guardados (abre sem internet).
   - Quando há internet, busca a versão nova em segundo plano.
   Ao mudar qualquer arquivo do app, aumente o número da VERSAO.
   ========================================================= */
const VERSAO = 'toca-ai-v8';
const ARQUIVOS = [
  './', './index.html', './style.css', './minimal.css', './data.js', './audio-detect.js', './ia.js', './estrada.js', './busca.js', './gravacao.js', './youtube.js', './aprender.js', './app.js',
  './modelo-acordes.json', './modelo-acordes.js', './manifest.webmanifest',
  // 45 notas de violão gravadas (sons/violao-nylon/40.mp3 ... 84.mp3)
  ...Array.from({ length: 45 }, (_, i) => `./sons/violao-nylon/${40 + i}.mp3`),
  './icones/icone-192.png', './icones/icone-512.png', './icones/icone-mascaravel-512.png', './icones/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // apaga caches de versões antigas
  e.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ehFonte = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (url.origin !== location.origin && !ehFonte) return;
  // "stale-while-revalidate": responde já com o que está guardado e atualiza por trás
  e.respondWith(caches.open(VERSAO).then(async cache => {
    const guardado = await cache.match(req, { ignoreSearch: true });
    const daRede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => guardado);
    return guardado || daRede;
  }));
});
