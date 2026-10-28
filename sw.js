/* =========================================================
   TOCA AÍ — sw.js (service worker)
   Um "funcionário" que fica entre o app e a internet:
   - Na instalação, guarda os arquivos do app no aparelho.
   - Depois, entrega os arquivos guardados (abre sem internet).
   - Quando há internet, busca a versão nova em segundo plano.
   Ao mudar qualquer arquivo do app, aumente o número da VERSAO.
   ========================================================= */
const VERSAO = 'toca-ai-v9';
const CLASSICO = [35, 38, 40, 42, 44, 45, 47, 49, 50, 52, 54, 55, 57, 59, 61, 63, 64, 66, 68, 69, 71, 73, 74, 76, 78, 79, 80, 81, 82];
const ARQUIVOS = [
  './', './index.html', './tema.css', './fontes/Jost.woff', './manifest.webmanifest',
  './data.js', './acordes.js', './som.js', './modelo-acordes.js', './ia.js', './audio-detect.js', './cifras.js',
  './gravacao.js', './youtube.js', './apostilas.js', './aprender.js', './jogo.js', './app.js',
  // o violão clássico (padrão) fica guardado; o acústico é guardado quando você escolhe
  ...CLASSICO.map(n => `./sons/classico/${n}.mp3`),
  './icones/icone-192.png', './icones/icone-512.png', './icones/icone-mascaravel-512.png', './icones/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // vídeos: direto da rede (pedidos por partes não combinam com o cache)
  if (url.pathname.includes('/videos/') && url.pathname.endsWith('.mp4')) return;
  // "stale-while-revalidate": responde já com o que está guardado e atualiza por trás
  e.respondWith(caches.open(VERSAO).then(async cache => {
    const guardado = await cache.match(req, { ignoreSearch: true });
    const daRede = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => guardado);
    return guardado || daRede;
  }));
});
