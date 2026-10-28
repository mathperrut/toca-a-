/* =========================================================
   TOCA AÍ — app.js
   Organização (procure pelos títulos ===== ):
   1. Utilidades e ícones
   2. Estado e armazenamento (salvar progresso)
   3. XP, níveis, missões e sequência de dias
   4. Navegação
   5. Início
   6. Músicas: catálogo, busca na internet e tela da música
   7. Afinador e metrônomo
   8. Ajustes
   9. Treinos (ritmo, trocas, quiz)
   10. Colar cifra e editar música
   11. Inicialização (PWA e app Android)
   ========================================================= */
'use strict';

/* ===== 1. Utilidades e ícones ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const patternById = id => PATTERNS.find(p => p.id === id) || PATTERNS[0];
const lessonById = id => LESSONS.find(l => l.id === id);

function dayKey(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
// Números "aleatórios" sempre iguais para a mesma semente (missões do dia, capas)
function rngFrom(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2800);
}

const icone = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
const IC = {
  play: icone('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
  pausa: icone('<path d="M8 5v14M16 5v14"/>'),
  som: icone('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>'),
  mic: icone('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  check: icone('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  voltar: icone('<path d="M15 5l-7 7 7 7"/>'),
  seta: icone('<path d="M9 5l7 7-7 7"/>'),
  fechar: icone('<path d="M6 6l12 12M18 6L6 18"/>'),
  busca: icone('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  nota: icone('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  relogio: icone('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  livro: icone('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>'),
  video: icone('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>'),
  mais: icone('<path d="M12 5v14M5 12h14"/>'),
  link: icone('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  estrela: icone('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>'),
  fogo: icone('<path d="M12 3c1.5 4 6 5.5 6 11a6 6 0 0 1-12 0c0-2.8 1.5-4.2 2.6-5.6.4 1.8 1.4 2.8 2.4 3.2C11 8.6 11 5.6 12 3z" fill="currentColor" stroke="none"/>'),
  externo: icone('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')
};

/* ===== 2. Estado e armazenamento =====
   Todo o progresso fica num único objeto "S", salvo no aparelho
   (localStorage). Quando o app roda publicado no Claude, também na sua conta. */
const LS_KEY = 'tocaai:v1';
function novoEstado() {
  return {
    v: 4, updatedAt: 0, xp: 0, licoes: {}, musicas: [], log: {}, recordes: {}, recordesMusica: {}, gravacoes: {}, apostilas: {},
    cfg: { bpm: 80, sens: 5, latencia: null, violao: 'classico', modo: 'espera', vel: 60, ritmo: 'acorde', facil: true, temCapo: false,
      metronomo: false, cordaGraveEmCima: false, tema: 'auto', vibrar: true }
  };
}
let S = novoEstado();

function hoje() {
  const k = dayKey();
  if (!S.log[k]) S.log[k] = { seg: 0, licoes: 0, trocas: 0, quiz: 0, batida: 0, musicas: 0, missoes: {} };
  return S.log[k];
}

const Store = {
  ref: null, timer: null,
  carregarLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const salvo = JSON.parse(raw);
        S = Object.assign(novoEstado(), salvo);
        S.cfg = Object.assign(novoEstado().cfg, salvo.cfg || {});
        if (typeof S.cfg.vel !== 'number') S.cfg.vel = 60;                 // versões antigas usavam 'lento'/'medio'
        if (!['acorde', 'tempos', 'batida'].includes(S.cfg.ritmo)) S.cfg.ritmo = 'acorde';
        if (!(S.cfg.violao in BANCOS)) S.cfg.violao = 'classico';
      }
      migrarMusicas();
    } catch (e) { /* aparelho sem armazenamento: segue com estado novo */ }
  },
  salvarLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} },
  salvar(imediato = false) {
    S.updatedAt = Date.now();
    this.salvarLocal();
    if (!this.ref) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.ref.set({ json: JSON.stringify(S) }).catch(() => {}); }, imediato ? 0 : 1500);
  },
  async conectarNuvem() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const uid = user ? await user.id() : null;
      if (!db || !uid) return;
      this.ref = db.doc('data/users/' + uid + '/toca-ai');
      const snap = await this.ref.get();
      if (snap.exists) {
        const remoto = JSON.parse(snap.data().json || '{}');
        if ((remoto.updatedAt || 0) > (S.updatedAt || 0)) {
          S = Object.assign(novoEstado(), remoto);
          S.cfg = Object.assign(novoEstado().cfg, S.cfg); migrarMusicas();
          this.salvarLocal(); aplicarTema(); renderTudo();
        } else if ((S.updatedAt || 0) > (remoto.updatedAt || 0)) this.salvar(true);
      } else if (S.updatedAt) this.salvar(true);
    } catch (e) { this.ref = null; }
  }
};

/* ===== 3. XP, níveis, missões e sequência ===== */
const xpDoNivel = n => 50 * n * (n - 1);           // nível n começa em 0, 100, 300, 600, 1000...
function nivelAtual(xp = S.xp) { let n = 1; while (xp >= xpDoNivel(n + 1)) n++; return n; }
const tituloNivel = n => TITULOS[Math.min(n - 1, TITULOS.length - 1)];
function ganharXP(qtd, motivo, silencioso = false) {
  const antes = nivelAtual();
  S.xp += qtd;
  const depois = nivelAtual();
  if (depois > antes) toast(`Nível ${depois}! Agora você é ${tituloNivel(depois)}.`);
  else if (!silencioso) toast(`+${qtd} XP`);
  Store.salvar();
  renderHeader();
}
function vibrar(padrao) { try { if (S.cfg.vibrar !== false) navigator.vibrate?.(padrao); } catch (e) {} }

function missoesDoDia(k = dayKey()) {
  const r = rngFrom('missao' + k), pool = [...MISSOES], escolhidas = [];
  while (escolhidas.length < 3) escolhidas.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return escolhidas;
}
function valorMetrica(d, metrica) { return metrica === 'min' ? Math.floor(d.seg / 60) : (d[metrica] || 0); }
// modo 'max' guarda o melhor valor do dia (ex.: % num jogo)
function registrar(metrica, valor, modo = 'add') {
  const d = hoje();
  d[metrica] = modo === 'max' ? Math.max(d[metrica] || 0, valor) : (d[metrica] || 0) + valor;
  verificarMissoes();
  Store.salvar();
}
function verificarMissoes() {
  const d = hoje();
  for (const m of missoesDoDia()) {
    if (!d.missoes[m.id] && valorMetrica(d, m.metrica) >= m.alvo) {
      d.missoes[m.id] = true;
      vibrar([12, 40, 12]);
      ganharXP(m.xp, 'missão');
    }
  }
}
function diaAtivo(d) { return d && (d.seg >= 60 || d.licoes || d.trocas || d.quiz || d.batida || d.musicas); }
function sequencia() {
  let n = 0, d = new Date();
  if (!diaAtivo(S.log[dayKey(d)])) d = addDays(d, -1); // hoje ainda não conta como falha
  while (diaAtivo(S.log[dayKey(d)])) { n++; d = addDays(d, -1); }
  return n;
}

// Tempo de treino: enquanto algo "ativo" roda (jogo, afinador...), conta 1 s por segundo
const ativos = new Set();
let telaAcesa = null;
async function manterTelaAcesa(ligar) {
  try {
    if (ligar && !telaAcesa && navigator.wakeLock) { telaAcesa = await navigator.wakeLock.request('screen'); telaAcesa.addEventListener('release', () => { telaAcesa = null; }); }
    else if (!ligar && telaAcesa) { await telaAcesa.release(); telaAcesa = null; }
  } catch (e) { telaAcesa = null; }
}
setInterval(() => {
  manterTelaAcesa(ativos.size > 0 && document.visibilityState === 'visible');
  if (!ativos.size || document.visibilityState !== 'visible') return;
  const d = hoje();
  d.seg++;
  if (d.seg % 15 === 0) { verificarMissoes(); Store.salvar(); }
}, 1000);

/* ===== 4. Navegação ===== */
const VIEWS = ['hoje', 'aprender', 'musicas', 'acordes', 'afinador'];
let viewAtual = 'hoje';
function irPara(v) {
  if (v === 'trilha' || v === 'jogos') v = 'aprender';
  if (v === 'ferramentas') v = 'afinador';
  if (!VIEWS.includes(v)) v = 'hoje';
  viewAtual = v;
  VIEWS.forEach(n => { $('#view-' + n).hidden = n !== v; });
  $$('.nav button').forEach(b => b.setAttribute('aria-current', b.dataset.view === v ? 'page' : 'false'));
  if (v !== 'afinador') { pararMetronomo(); afinador.parar(); }
  Previa.parar();
  RENDER[v]();
  try { history.replaceState(null, '', '#' + v); } catch (e) {}
  window.scrollTo(0, 0);
}
function renderHeader() { const el = $('#seq'); if (el) el.textContent = sequencia(); }
const RENDER = { hoje: renderHoje, aprender: renderAprender, musicas: renderMusicas, acordes: renderAcordes, afinador: renderAfinador };
function renderTudo() { renderHeader(); RENDER[viewAtual](); }

/* Janela (folha que sobe de baixo; "cheia" ocupa a tela toda) */
let limparJanela = null;
function abrirJanela(titulo, html, aoFechar) {
  fecharJanela();
  $('#janela-titulo').textContent = titulo;
  $('#janela').className = 'janela';
  $('#janela-corpo').innerHTML = html;
  $('#janela').hidden = false;
  document.body.classList.add('travado');
  limparJanela = aoFechar || null;
  $('#janela-corpo').scrollTop = 0;
}
function fecharJanela() {
  if (limparJanela) { const f = limparJanela; limparJanela = null; try { f(); } catch (e) {} }
  Som.pararTudo();
  $$('#janela video').forEach(v => { try { v.pause(); } catch (e) {} });
  $('#janela').hidden = true;
  if (!Jogo.atual) document.body.classList.remove('travado');
}

/* ===== 5. Início ===== */
function saudacao() { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
const META_MIN = 10;
function musicasQueDaPraTocar() { return todasMusicas().filter(m => acordesUnicos(m).every(a => seiAcorde(simplificar(a)))); }

function renderHoje() {
  const d = hoje(), prox = proximaLicao(), u = prox ? unidadeDaLicao(prox.id) : null;
  const min = Math.floor(d.seg / 60), pct = Math.min(1, min / META_MIN);
  const feitas = u ? u.licoes.filter(l => S.licoes[l.id]).length : 0;
  const daPra = musicasQueDaPraTocar();
  const sugestoes = (daPra.length ? daPra : CATALOGO.filter(m => m.grupo === 'iniciante')).slice(0, 3);
  const comecou = Object.keys(S.licoes).length > 0;
  const missoes = missoesDoDia();
  $('#view-hoje').innerHTML = `
    <header class="pagina-topo">
      <h2 class="titulo-grande">${saudacao()}.</h2>
      <p class="sub">${min >= META_MIN ? 'Meta de hoje cumprida.' : `Faltam ${META_MIN - min} minutos para a meta de hoje.`}</p>
      <div class="meta-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${META_MIN}" aria-valuenow="${min}" aria-label="Minutos de treino hoje"><i style="transform:scaleX(${pct})"></i></div>
    </header>
    ${prox ? `<button class="painel-continuar" data-licao="${prox.id}">
        <span class="pc-sobre">${esc(u.titulo)}, lição ${feitas + 1} de ${u.licoes.length}</span>
        <span class="pc-titulo">${esc(prox.titulo)}</span>
        <span class="pc-rodape"><span>${prox.min} min</span><span class="pc-play" aria-hidden="true">${IC.play}</span></span>
        <span class="sr">${comecou ? 'Continuar' : 'Começar'}</span>
      </button>`
      : `<div class="painel-continuar"><span class="pc-titulo">Curso concluído</span><span class="pc-sobre">Agora é repertório: escolha uma música e suba a velocidade.</span></div>`}
    <section class="secao">
      <div class="secao-topo"><h3>${daPra.length ? 'Você já pode tocar' : 'Boas para começar'}</h3><button class="link" data-ir="musicas">Ver todas</button></div>
      <div class="lista">${sugestoes.map(linhaMusica).join('')}</div>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Missões de hoje</h3></div>
      <ul class="missoes">${missoes.map(m => { const v = valorMetrica(d, m.metrica), ok = d.missoes[m.id]; return `<li class="${ok ? 'feita' : ''}"><span class="ms-bola" aria-hidden="true">${ok ? IC.check : ''}</span><span>${esc(m.texto)}</span><small>${ok ? `+${m.xp} XP` : `${Math.min(v, m.alvo)}/${m.alvo}`}</small></li>`; }).join('')}</ul>
    </section>
    <section class="secao atalhos">
      <button class="atalho" data-ir="afinador">${IC.mic}<span>Afinar</span></button>
      <button class="atalho" data-treino="trocas">${icone('<path d="M7 7h11l-3-3M17 17H6l3 3"/>')}<span>1 minuto de trocas</span></button>
      <button class="atalho" data-ir="aprender" data-aba="apostilas">${IC.livro}<span>Apostilas</span></button>
    </section>`;
  const v = $('#view-hoje');
  v.querySelector('[data-licao]')?.addEventListener('click', e => abrirLicao(e.currentTarget.dataset.licao));
  v.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { if (b.dataset.aba) abaAprender = b.dataset.aba; irPara(b.dataset.ir); }));
  v.querySelector('[data-treino]')?.addEventListener('click', () => JOGOS.trocas());
  ligarLinhas(v);
  renderHeader();
}

/* ===== 6. Músicas ===== */
// Músicas antigas ({acordes, cpa}) viram o formato novo ({secoes})
function migrarMusicas() {
  S.musicas = (S.musicas || []).map(m => {
    if (m.secoes) return m;
    const p = patternById(m.padrao), tempos = (m.cpa || 1) * (p.beats || 4);
    const acs = String(m.acordes || '').replace(/[|,;]/g, ' ').split(/\s+/).filter(Boolean);
    return { ...m, capo: 0, secoes: [{ nome: 'Música', seq: acs.map(a => `${a}:${tempos}`).join(' '), repetir: 1 }] };
  });
  S.recordesMusica = S.recordesMusica || {};
}
let musicaTemporaria = null;   // resultado da busca ainda não salvo
const todasMusicas = () => [...CATALOGO.map(m => ({ ...m, origem: 'catalogo' })), ...S.musicas];
const acharMusica = id => todasMusicas().find(m => m.id === id) || (musicaTemporaria && musicaTemporaria.id === id ? musicaTemporaria : null);

/* Capa no estilo das capas de disco da bossa nova dos anos 60:
   preto, título em branco e bolinhas vermelhas (uma por acorde). */
function capaHTML(m, tam = '') {
  const r = rngFrom(m.id || m.titulo);
  const n = Math.min(5, Math.max(1, acordesUnicos(m).length));
  const dots = Array.from({ length: n }, (_, i) => `<i style="--x:${10 + i * 16 + Math.round(r() * 5)}%;--y:${62 + Math.round(r() * 20)}%"></i>`).join('');
  return `<span class="capa ${tam}" aria-hidden="true"><b>${esc(m.titulo)}</b>${dots}</span>`;
}
function melhorRecorde(m) {
  const rec = S.recordesMusica?.[m.id];
  return rec ? Math.max(...Object.values(rec).map(x => (typeof x === 'number' ? x : x.pct || 0))) : null;
}
function linhaMusica(m) {
  const acs = [...new Set(acordesUnicos(m).map(a => (S.cfg.facil !== false ? simplificar(a) : a)))];
  const rec = melhorRecorde(m);
  return `<button class="linha-musica" data-musica="${esc(m.id)}">
    ${capaHTML(m)}
    <span class="lm-txt"><b>${esc(m.titulo)}</b><small>${esc(m.artista || 'Artista não informado')}</small>
      <span class="lm-acordes">${acs.slice(0, 6).map(a => `<span class="chip-acorde ${seiAcorde(a) ? 'sei' : ''}">${esc(a)}</span>`).join('')}${acs.length > 6 ? `<span class="sub">+${acs.length - 6}</span>` : ''}</span></span>
    <span class="lm-dir">${rec !== null ? `<small class="lm-rec">${rec}%</small>` : ''}<span class="nivel ${dificuldade(m) === 'Fácil' ? 'facil' : dificuldade(m) === 'Médio' ? 'medio' : 'dificil'}">${dificuldade(m)}</span></span>
  </button>`;
}
function ligarLinhas(raiz) {
  $$('[data-musica]', raiz).forEach(b => b.addEventListener('click', () => abrirMusica(b.dataset.musica)));
}

function renderMusicas() {
  const v = $('#view-musicas');
  const ini = CATALOGO.filter(m => m.grupo === 'iniciante');
  const jorge = CATALOGO.filter(m => m.grupo === 'jorge');
  v.innerHTML = `
    <header class="pagina-topo"><h2 class="titulo-grande">Músicas</h2></header>
    <form class="busca" id="busca-form" role="search">
      ${IC.busca}<input id="busca-termo" type="search" enterkeyhint="search" placeholder="Busque qualquer música ou artista" autocomplete="off" aria-label="Buscar música">
      <button class="btn primario mini" type="submit">Buscar</button>
    </form>
    <div id="busca-res" aria-live="polite"></div>
    <section class="secao">
      <div class="secao-topo"><h3>Para começar</h3><span class="sub">2 a 5 acordes, sem pestana</span></div>
      <div class="lista">${ini.map(linhaMusica).join('')}</div>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Jorge Ben Jor</h3></div>
      <div class="lista">${jorge.map(linhaMusica).join('')}</div>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Melodias</h3><span class="sub">uma nota de cada vez</span></div>
      <div class="lista">${MELODIAS.map(me => `<button class="linha-musica" data-melodia="${me.id}"><span class="capa nota" aria-hidden="true"><b>${esc(me.titulo)}</b><i style="--x:20%;--y:70%"></i></span><span class="lm-txt"><b>${esc(me.titulo)}</b><small>${esc(me.origem)}</small></span><span class="lm-dir">${IC.seta}</span></button>`).join('')}</div>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Minhas músicas</h3><div class="linha-botoes"><button class="btn mini" id="colar-cifra">Colar cifra</button><button class="btn mini" id="nova-musica">${IC.mais} Nova</button></div></div>
      ${S.musicas.length ? `<div class="lista">${S.musicas.map(linhaMusica).join('')}</div>` : `<p class="vazio">Busque uma música lá em cima: ela é salva aqui para você treinar depois.</p>`}
    </section>`;
  ligarLinhas(v);
  $$('[data-melodia]', v).forEach(b => b.addEventListener('click', () => jogarMelodia(b.dataset.melodia)));
  $('#busca-form').addEventListener('submit', e => { e.preventDefault(); $('#busca-termo').blur(); buscar($('#busca-termo').value); });
  $('#colar-cifra').addEventListener('click', () => abrirColarCifra());
  $('#nova-musica').addEventListener('click', () => abrirFormMusica());
}

/* ----- Busca: primeiro no app, depois na internet (Cifra Club) ----- */
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function buscarLocal(termo) {
  const q = semAcento(termo);
  if (!q) return [];
  return todasMusicas().filter(m => { const t = semAcento(m.titulo + ' ' + m.artista); return t.includes(q) || q.split(/\s+/).every(p => t.includes(p)); });
}
let buscaAtual = 0;
async function buscar(termo) {
  termo = termo.trim();
  const res = $('#busca-res');
  if (!termo) { res.innerHTML = ''; return; }
  const minha = ++buscaAtual;
  const locais = buscarLocal(termo);
  res.innerHTML = `
    ${locais.length ? `<section class="secao"><div class="secao-topo"><h3>No app</h3></div><div class="lista">${locais.map(linhaMusica).join('')}</div></section>` : ''}
    <section class="secao" id="web-res"><div class="secao-topo"><h3>Na internet</h3><span class="sub">Cifra Club</span></div><div id="web-lista"></div></section>`;
  ligarLinhas(res);
  const lista = $('#web-lista');
  if (!Cifras.automatico) {
    lista.innerHTML = `<div class="aviso-web">
      <p>No app instalado no celular a busca na internet é automática. Aqui no navegador, abra a cifra e cole o texto:</p>
      <div class="linha-botoes"><a class="btn" href="${esc(Cifras.urlBusca(termo))}" target="_blank" rel="noopener">${IC.externo} Abrir no navegador</a><button class="btn primario" id="ir-colar">Colar cifra</button></div></div>`;
    $('#ir-colar').addEventListener('click', () => abrirColarCifra(termo));
    return;
  }
  lista.innerHTML = `<p class="carregando"><span class="spinner" aria-hidden="true"></span> Procurando "${esc(termo)}"…</p>`;
  try {
    const achados = await Cifras.procurar(termo);
    if (minha !== buscaAtual) return;
    if (!achados.length) { lista.innerHTML = `<p class="vazio">Não achei "${esc(termo)}". Confira o nome ou tente com o nome do artista.</p>`; return; }
    lista.innerHTML = `<div class="lista">${achados.map((a, i) => `<button class="linha-web" data-i="${i}"><span class="lw-txt"><b>${esc(a.titulo)}</b><small>${esc(a.artista)}</small></span><span class="lw-acao">Montar jogo</span></button>`).join('')}</div>`;
    $$('.linha-web', lista).forEach(b => b.addEventListener('click', () => montarDaInternet(achados[+b.dataset.i], b)));
  } catch (e) {
    if (minha !== buscaAtual) return;
    lista.innerHTML = `<div class="aviso-web"><p>${esc(e.message || 'Sem conexão com a internet.')}</p><div class="linha-botoes"><button class="btn" id="tentar">Tentar de novo</button><button class="btn" id="ir-colar">Colar cifra</button></div></div>`;
    $('#tentar').addEventListener('click', () => buscar(termo));
    $('#ir-colar').addEventListener('click', () => abrirColarCifra(termo));
  }
}
// Baixa a cifra, monta o jogo e abre a música pronta para jogar
async function montarDaInternet(achado, botao) {
  const ja = S.musicas.find(m => m.id === 'cc-' + achado.slugArtista + '--' + achado.slugMusica);
  if (ja) return abrirMusica(ja.id);
  botao.disabled = true;
  botao.querySelector('.lw-acao').innerHTML = '<span class="spinner" aria-hidden="true"></span> Lendo a cifra…';
  try {
    const [simp, orig] = await Promise.all([
      Cifras.baixar(achado.slugArtista, achado.slugMusica, { simplificada: true }),
      Cifras.baixar(achado.slugArtista, achado.slugMusica, { simplificada: false }).catch(() => null)
    ]);
    // o nome que veio da busca é o mais limpo
    if (achado.titulo) simp.titulo = achado.titulo;
    if (achado.artista) simp.artista = achado.artista;
    const m = prepararMusica(Cifras.paraMusica(simp), orig);
    botao.querySelector('.lw-acao').textContent = 'Procurando a gravação…';
    try {
      const vids = await Cifras.youtube(m.titulo, m.artista);
      if (vids[0] && vids[0].pontos >= 4) { m.youtube = vids[0].id; m.youtubeCanal = vids[0].canal; }
    } catch (e) {}
    S.musicas.push(m); Store.salvar();
    toast('Música salva em Minhas músicas');
    abrirMusica(m.id);
    if (viewAtual === 'musicas') { const termo = $('#busca-termo')?.value; renderMusicas(); if (termo) { $('#busca-termo').value = termo; } }
  } catch (e) {
    botao.disabled = false;
    botao.querySelector('.lw-acao').textContent = 'Tentar de novo';
    toast(e.message || 'Não consegui ler essa cifra.');
  }
}
/* Deixa a música boa para iniciante:
   1. Capotraste inteligente: se os acordes têm pestana, desce o tom até
      eles ficarem abertos e coloca o capo para soar igual.
   2. Guarda o tom e o capo da cifra original (para tocar junto com a gravação). */
function prepararMusica(m, original) {
  const todos = m.secoes.flatMap(s => lerSequencia(s.seq).map(x => x.acorde));
  const basicos = todos.map(Cifras.basico);
  const k = Cifras.melhorCapo(basicos, a => custoAcorde(acordePorNome(simplificar(a))));
  if (k) {
    m.secoes = m.secoes.map(s => ({ ...s, seq: lerSequencia(s.seq).map(x => `${Cifras.transpor(x.acorde, -k)}:${x.tempos}`).join(' ') }));
    m.nota = `Com capotraste na ${k}ª casa os acordes ficam abertos e soam no tom da cifra. ` + m.nota;
  }
  // capo para a gravação = capo escolhido + diferença entre a cifra original e a simplificada
  const pc = t => (t ? RAIZ_PC[(t.match(/^[A-G](?:#|b)?/) || [''])[0]] : undefined);
  let extra = 0;
  if (original && original.tom && m.tom) {
    const somOrig = pc(original.tom), somSimp = pc(m.tom);
    if (somOrig !== undefined && somSimp !== undefined) extra = ((somOrig - somSimp - (m.capo || 0)) % 12 + 12) % 12;
    if (extra > 7) extra = 0;
  }
  m.capo = (m.capo || 0) + k + extra;
  m.capoCifra = k;
  return m;
}

/* ----- Tela da música ----- */
const VELS = [40, 60, 80, 100];
const MODOS = [
  ['espera', 'Esperar por mim', 'A música para em cada acorde até você acertar'],
  ['tempo', 'No tempo', 'Pontos pelo tempo e pelo acorde certo'],
  ['pratica', 'Prática', 'O app toca junto, sem pontos']
];
function abrirMusica(id) {
  const m = acharMusica(id);
  if (!m) return;
  Previa.parar();
  const acs = [...new Set(acordesUnicos(m).map(a => (S.cfg.facil !== false ? simplificar(a) : a)))];
  const minha = S.musicas.some(x => x.id === m.id);
  const rec = melhorRecorde(m);
  abrirJanela(m.titulo, `
    <div class="musica">
      <header class="mu-topo">${capaHTML(m, 'grande')}
        <div class="mu-info"><h2>${esc(m.titulo)}</h2><p>${esc(m.artista)}</p>
          <p class="mu-chips"><span class="nivel ${dificuldade(m) === 'Fácil' ? 'facil' : dificuldade(m) === 'Médio' ? 'medio' : 'dificil'}">${dificuldade(m)}</span><span class="chip">${esc(patternById(m.padrao).genero)}</span>${rec !== null ? `<span class="chip">Recorde ${rec}%</span>` : ''}</p></div>
      </header>
      ${m.nota ? `<p class="mu-nota">${esc(m.nota)}</p>` : ''}
      <section class="mu-bloco"><h3>Acordes</h3><div class="mu-acordes" id="mu-acs"></div>
        <label class="alternar"><input type="checkbox" id="mu-facil" ${S.cfg.facil !== false ? 'checked' : ''}><span>Acordes fáceis</span><small>troca os difíceis por versões sem pestana</small></label>
        ${m.capo ? `<label class="alternar"><input type="checkbox" id="mu-capo" ${S.cfg.temCapo ? 'checked' : ''}><span>Vou usar capotraste na ${m.capo}ª casa</span><small>para soar igual à gravação (sem capo também dá)</small></label>` : ''}
      </section>
      <section class="mu-bloco"><h3>Como jogar</h3>
        <div class="modos" role="radiogroup" aria-label="Modo de jogo">${MODOS.map(([k, n, d]) => `<button type="button" role="radio" class="modo" aria-checked="${S.cfg.modo === k}" data-modo="${k}"><b>${n}</b><small>${d}</small></button>`).join('')}</div>
        <div class="linha-op"><span>Velocidade</span><div class="segmentado" id="mu-vel">${VELS.map(p => `<button type="button" aria-pressed="${S.cfg.vel === p}" data-vel="${p}">${p}%</button>`).join('')}</div></div>
        <div class="linha-op"><span>Mão direita</span><div class="segmentado" id="mu-ritmo">${[['acorde', '1 por acorde'], ['tempos', '1 por tempo'], ['batida', 'Ritmo']].map(([k, n]) => `<button type="button" aria-pressed="${S.cfg.ritmo === k}" data-ritmo="${k}">${n}</button>`).join('')}</div></div>
        <div class="linha-op"><span>Parte</span><select id="mu-parte"><option value="">Música inteira (${Math.ceil(duracaoMusica(m, m.bpm * (S.cfg.vel / 100)) / 60)} min)</option>${m.secoes.map((s, i) => `<option value="${i}">${esc(s.nome)}${s.repetir > 1 ? ` (${s.repetir}x)` : ''}</option>`).join('')}</select></div>
      </section>
      <section class="mu-bloco" id="mu-grav"><h3>Gravação original</h3><div id="mu-yt"></div></section>
      <details class="mu-bloco mu-seq"><summary>Sequência de acordes</summary>
        ${m.secoes.map(s => `<div class="mu-secao"><b>${esc(s.nome)}${s.repetir > 1 ? ` <small>${s.repetir}x</small>` : ''}</b><div class="mu-chips-seq">${lerSequencia(s.seq).map(x => `<span class="chip-acorde">${esc(S.cfg.facil !== false ? simplificar(x.acorde) : x.acorde)}<small>${x.tempos}</small></span>`).join('')}</div></div>`).join('')}
        <p class="sub">O número pequeno é quantos tempos o acorde dura.</p>
      </details>
      <div class="mu-mais">
        ${minha ? '<button class="btn mini" id="mu-editar">Editar</button>' : '<button class="btn mini" id="mu-copiar">Fazer minha versão</button>'}
        ${m.fonte ? `<a class="btn mini" href="${esc(m.fonte)}" target="_blank" rel="noopener">${IC.externo} Ver a cifra</a>` : ''}
      </div>
      <div class="barra-jogar">
        <button class="btn" id="mu-ouvir">${IC.som} Ouvir</button>
        <button class="btn primario grande" id="mu-jogar">${IC.play} Jogar</button>
      </div>
    </div>`, () => { Previa.parar(); painelYT.tocador?.destruir(); painelYT.tocador = null; });
  $('#janela').classList.add('cheia');
  const desenharAcordes = () => {
    const lista = [...new Set(acordesUnicos(m).map(a => (S.cfg.facil !== false ? simplificar(a) : a)))];
    $('#mu-acs').innerHTML = lista.map(a => `<button class="mu-ac ${seiAcorde(a) ? 'sei' : ''}" data-acorde="${esc(a)}">${diagramaAcorde(a, { tam: 'sm', rotulos: false })}<b>${esc(a)}</b><small>${seiAcorde(a) ? 'Você sabe' : 'Aprender'}</small></button>`).join('');
    $$('#mu-acs [data-acorde]').forEach(b => b.addEventListener('click', () => abrirAcordeSobre(b.dataset.acorde)));
  };
  desenharAcordes();
  $('#mu-facil').addEventListener('change', e => { S.cfg.facil = e.target.checked; Store.salvar(); desenharAcordes(); });
  $('#mu-capo')?.addEventListener('change', e => { S.cfg.temCapo = e.target.checked; Store.salvar(); });
  $$('[data-modo]').forEach(b => b.addEventListener('click', () => { S.cfg.modo = b.dataset.modo; Store.salvar(); $$('[data-modo]').forEach(x => x.setAttribute('aria-checked', x === b)); }));
  $$('#mu-vel [data-vel]').forEach(b => b.addEventListener('click', () => { S.cfg.vel = +b.dataset.vel; Store.salvar(); $$('#mu-vel [data-vel]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  $$('#mu-ritmo [data-ritmo]').forEach(b => b.addEventListener('click', () => { S.cfg.ritmo = b.dataset.ritmo; Store.salvar(); $$('#mu-ritmo [data-ritmo]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  painelYouTube($('#mu-yt'), m);
  $('#mu-editar')?.addEventListener('click', () => abrirFormMusica(m));
  $('#mu-copiar')?.addEventListener('click', () => abrirFormMusica({ ...JSON.parse(JSON.stringify(m)), id: 'm' + Date.now().toString(36), origem: 'minha', titulo: m.titulo + ' (minha versão)' }, true));
  $('#mu-ouvir').addEventListener('click', e => {
    const b = e.currentTarget;
    if (Previa.tocando) { Previa.parar(); b.innerHTML = `${IC.som} Ouvir`; return; }
    b.innerHTML = `${IC.pausa} Parar`;
    Previa.tocar(m, { segundos: 40, bpm: m.bpm * S.cfg.vel / 100, capo: S.cfg.temCapo ? m.capo : 0, aoFim: () => { b.innerHTML = `${IC.som} Ouvir`; } });
  });
  $('#mu-jogar').addEventListener('click', () => jogarMusica(m, $('#mu-parte').value === '' ? null : +$('#mu-parte').value));
}

// Abre o jogo de uma música (do catálogo, da busca ou das suas)
function jogarMusica(m, secao = null, extra = {}) {
  Previa.parar();
  const bpmBase = extra.bpmBase || m.bpm || 80;
  const modo = extra.modo || S.cfg.modo || 'espera';
  return Jogo.abrir({
    titulo: m.titulo + (secao !== null ? ', ' + m.secoes[secao].nome : ''),
    trechos: musicaParaTrechos(m, secao), padrao: patternById(m.padrao), ritmo: extra.ritmo || S.cfg.ritmo || 'acorde',
    bpm: extra.bpm || Math.round(bpmBase * (extra.vel || S.cfg.vel) / 100), bpmBase, capo: m.capo || 0, temCapo: !!S.cfg.temCapo || !!extra.gravacao,
    modo, entrada: modo === 'pratica' ? 'nenhuma' : 'mic', facil: S.cfg.facil !== false, metronomo: S.cfg.metronomo,
    gravacao: extra.gravacao || null, container: extra.container || null, guia: !extra.gravacao, refazer: extra.refazer || null,
    aoFim: r => {
      S.recordesMusica[m.id] = S.recordesMusica[m.id] || {};
      if (r.pct !== null) {
        const chave = `${r.modo}:${Math.round(r.bpm / r.bpmBase * 100)}${secao !== null ? ':' + secao : ''}`;
        S.recordesMusica[m.id][chave] = Math.max(S.recordesMusica[m.id][chave] || 0, r.pct);
        if (r.modo === 'tempo') registrar('batida', r.pct, 'max');
      }
      if (secao === null) registrar('musicas', 1);
      ganharXP(10 + Math.round((r.pct ?? 60) / 5), m.titulo, true);
      extra.aoFim?.(r);
    },
    aoSair: extra.aoSair
  });
}
function jogarMelodia(id, extra = {}) {
  const me = MELODIAS.find(x => x.id === id);
  if (!me) return;
  const modo = extra.modo || (S.cfg.modo === 'pratica' ? 'pratica' : S.cfg.modo) || 'espera';
  return Jogo.abrir({
    titulo: me.titulo, notas: lerMelodia(me.notas), padrao: { beats: me.beats, sub: 1, passos: ['D'] },
    bpm: Math.round(me.bpm * (extra.vel || Math.max(60, S.cfg.vel)) / 100), bpmBase: me.bpm, modo, entrada: modo === 'pratica' ? 'nenhuma' : 'mic',
    aoFim: r => { ganharXP(8, me.titulo, true); extra.aoFim?.(r); }, aoSair: extra.aoSair
  });
}

// Professor de acordes numa camada por cima da tela atual
function abrirAcordeSobre(nome) {
  const cam = document.createElement('div');
  cam.className = 'camada';
  cam.innerHTML = `<div class="camada-caixa" role="dialog" aria-label="${esc(nome)}"><div class="janela-topo"><h2>${esc(nome)}</h2><button class="btn-icone" aria-label="Fechar">${IC.fechar}</button></div><div class="janela-corpo" id="cam-corpo"></div></div>`;
  document.body.appendChild(cam);
  ensinarAcorde(cam.querySelector('#cam-corpo'), nome);
  const fechar = () => cam.remove();
  cam.querySelector('.btn-icone').addEventListener('click', fechar);
  cam.addEventListener('click', e => { if (e.target === cam) fechar(); });
}

/* ----- Prévia: violão (gravado) + percussão leve ----- */
const Previa = {
  tocando: null, timer: null,
  baixo(acorde, t, capo) {
    const p = partesAcorde(acorde);
    if (!p) return;
    const pc = p.baixo ? RAIZ_PC[p.baixo] : p.pc;
    const midi = 40 + ((pc - 4 + 12) % 12) + (capo || 0);
    Som.nota(440 * Math.pow(2, (midi - 69) / 12), t, 0.42, 0);
  },
  tocar(musica, { segundos = 30, bpm = musica.bpm, capo = 0, aoAcorde, aoFim } = {}) {
    this.parar();
    Som.init();
    const padrao = patternById(musica.padrao), seg = 60 / bpm, passo = seg / padrao.sub;
    const trechos = musicaParaTrechos(musica).map(t => ({ ...t, acorde: S.cfg.facil !== false ? simplificar(t.acorde) : t.acorde }));
    const t0 = Som.agora + 0.15;
    const total = Math.min(segundos, trechos.length ? (trechos.at(-1).inicio + trechos.at(-1).tempos) * seg : 0);
    let k = 0, iTr = 0;
    const estado = { musica, fim: t0 + total };
    this.tocando = estado;
    const agendar = () => {
      if (this.tocando !== estado) return;
      while (t0 + k * passo < Som.agora + 0.25) {
        const t = t0 + k * passo, tempo = k / padrao.sub;
        if (t > estado.fim) { setTimeout(() => { if (this.tocando === estado) { this.parar(); aoFim?.(); } }, (estado.fim - Som.agora + 0.4) * 1000); clearInterval(this.timer); return; }
        while (iTr < trechos.length - 1 && trechos[iTr + 1].inicio <= tempo + 1e-6) iTr++;
        const tr = trechos[iTr];
        if (Math.abs(tempo - tr.inicio) < 1e-6) quandoTocar(t, () => { if (this.tocando === estado) aoAcorde?.(tr); });
        const tok = padrao.passos[k % padrao.passos.length];
        if (tok !== '-') Som.golpe(tr.acorde, t, tok, k % padrao.sub === 0 ? 0.3 : 0.24, capo);
        if (k % padrao.sub === 0) Som.ganza(t, 0.05);
        k++;
      }
    };
    agendar();
    this.timer = setInterval(agendar, 40);
    return estado;
  },
  parar() { clearInterval(this.timer); if (this.tocando) { this.tocando = null; Som.pararTudo(); } }
};

// Símbolos de uma batida
const SIMBOLO = { D: '↓', U: '↑', B: 'P', F: 'd', X: 'P+d', T: '×', p: 'p', i: 'i', m: 'm', a: 'a', '-': '·' };
function batidaHTML(p) {
  return `<div class="batida-tira" style="--n:${p.passos.length}">${p.passos.map((t, i) => `<span class="${t === '-' ? 'pausa' : ''} ${i % p.sub === 0 ? 'tempo' : ''}">${SIMBOLO[t]}</span>`).join('')}</div>`;
}
function ouvirBatida(p, compassos = 2, acordes = p.demo) {
  Som.init(); Som.pararTudo();
  const dur = 60 / p.bpm / p.sub, t0 = Som.agora + 0.1;
  for (let b = 0; b < compassos; b++) p.passos.forEach((tok, s) => {
    const t = t0 + (b * p.passos.length + s) * dur;
    if (s % p.sub === 0) Som.click(t, s === 0, 0.12);
    if (tok !== '-') Som.golpe(acordes[b % acordes.length], t, tok, 0.3);
  });
}

/* ===== 7. Afinador e metrônomo ===== */
let metro = null;
function renderAfinador() {
  const v = $('#view-afinador');
  v.innerHTML = `
    <header class="pagina-topo"><h2 class="titulo-grande">Afinador</h2></header>
    <section class="afinador ${afinador.ligado ? 'ligado' : ''}" id="af">
      <div class="af-nota"><b id="af-nome">—</b><span id="af-alvo">Toque uma corda solta</span></div>
      <div class="af-escala" aria-hidden="true"><span class="af-zona"></span><i id="af-ponteiro"></i></div>
      <p class="af-dica" id="af-dica" aria-live="polite">${afinador.ligado ? 'Ouvindo…' : 'Ligue o microfone para começar'}</p>
      <div class="af-cordas">${['E', 'A', 'D', 'G', 'B', 'E'].map((n, i) => `<button class="af-corda ${afinador.alvo === i ? 'ativa' : ''} ${afinador.ok[i] ? 'ok' : ''}" data-corda="${i}"><b>${n}</b><small>${6 - i}ª</small></button>`).join('')}</div>
      <button class="btn primario largo" id="af-mic">${afinador.ligado ? 'Parar de ouvir' : `${IC.mic} Ouvir pelo microfone`}</button>
      <p class="sub center">Toque num botão de corda para ouvir o som certo dela. <span id="af-hz"></span></p>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Metrônomo</h3></div>
      <div class="metro">
        <div class="metro-bpm"><button class="btn-icone grande" data-bpm="-5" aria-label="Diminuir 5">−</button><output id="bpm-out">${S.cfg.bpm}</output><button class="btn-icone grande" data-bpm="5" aria-label="Aumentar 5">+</button></div>
        <span class="sub center">batidas por minuto</span>
        <input type="range" id="bpm-range" min="40" max="200" value="${S.cfg.bpm}" aria-label="BPM">
        <div class="linha-op"><span>Compasso</span><div class="segmentado" id="compasso">${[2, 3, 4].map(c => `<button type="button" aria-pressed="${(S.cfg.compasso || 4) === c}" data-c="${c}">${c}/4</button>`).join('')}</div></div>
        <div class="luzes" id="luzes"></div>
        <div class="linha-botoes"><button class="btn" id="tap">Bater o tempo</button><button class="btn primario" id="metro-play">${metro ? 'Parar' : 'Começar'}</button></div>
      </div>
    </section>`;
  $$('[data-corda]', v).forEach(b => b.addEventListener('click', () => {
    const c = +b.dataset.corda;
    afinador.alvo = afinador.alvo === c ? null : c;
    $$('[data-corda]', v).forEach(x => x.classList.toggle('ativa', +x.dataset.corda === afinador.alvo));
    Som.init(); Som.nota(CORDAS_SOLTAS[c], Som.agora + 0.02, 0.5, c, { humano: false });
  }));
  $('#af-mic').addEventListener('click', () => afinador.ligado ? afinador.parar() : afinador.iniciar());
  if (afinador.ligado) afinador.loop();
  const atualizaBpm = b => { S.cfg.bpm = Math.max(40, Math.min(200, b)); $('#bpm-out').textContent = S.cfg.bpm; $('#bpm-range').value = S.cfg.bpm; if (metro) metro.bpm = S.cfg.bpm; Store.salvar(); };
  $$('[data-bpm]', v).forEach(b => b.addEventListener('click', () => atualizaBpm(S.cfg.bpm + +b.dataset.bpm)));
  $('#bpm-range').addEventListener('input', e => atualizaBpm(+e.target.value));
  const toques = [];
  $('#tap').addEventListener('click', () => {
    const t = performance.now(); toques.push(t); while (toques.length > 5) toques.shift();
    if (toques.length >= 2 && t - toques[toques.length - 2] < 2000) {
      const ints = toques.slice(1).map((x, i) => x - toques[i]).filter(x => x < 2000);
      atualizaBpm(Math.round(60000 / (ints.reduce((a, b) => a + b, 0) / ints.length)));
    }
  });
  const luzes = () => { $('#luzes').innerHTML = Array.from({ length: S.cfg.compasso || 4 }, () => '<i></i>').join(''); };
  $$('#compasso [data-c]').forEach(b => b.addEventListener('click', () => { S.cfg.compasso = +b.dataset.c; Store.salvar(); $$('#compasso [data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); luzes(); if (metro) { pararMetronomo(); iniciarMetronomo(); } }));
  luzes();
  $('#metro-play').addEventListener('click', () => metro ? pararMetronomo() : iniciarMetronomo());
}

/* O afinador lê a altura ~14 vezes por segundo e usa a mediana
   das últimas leituras para o ponteiro não ficar tremendo. */
const afinador = {
  ligado: false, alvo: null, ok: {}, leituras: [], firme: { corda: null, desde: 0 }, timer: null,
  async iniciar() {
    try { await Detector.ligar(); } catch (e) { const d = $('#af-dica'); if (d) d.textContent = msgSemMicrofone(e); return; }
    this.ligado = true; ativos.add('afinador');
    $('#af')?.classList.add('ligado');
    const b = $('#af-mic'); if (b) b.textContent = 'Parar de ouvir';
    this.loop();
  },
  parar() {
    this.ligado = false; ativos.delete('afinador'); clearTimeout(this.timer);
    $('#af')?.classList.remove('ligado');
    const b = $('#af-mic'); if (b) b.innerHTML = `${IC.mic} Ouvir pelo microfone`;
  },
  loop() {
    clearTimeout(this.timer);
    if (!this.ligado || viewAtual !== 'afinador' || !$('#af-nome')) return;
    const r = Detector.altura();
    if (r && r.freq > 60 && r.freq < 700) {
      this.leituras.push(r.freq); if (this.leituras.length > 5) this.leituras.shift();
      this.mostrar(mediana(this.leituras));
    } else if (!r) { this.leituras = []; $('#af-dica').textContent = 'Ouvindo… toque uma corda solta'; }
    this.timer = setTimeout(() => this.loop(), 70);
  },
  mostrar(f) {
    let corda = this.alvo;
    if (corda === null) { corda = 0; CORDAS_SOLTAS.forEach((c, i) => { if (Math.abs(Math.log2(f / c)) < Math.abs(Math.log2(f / CORDAS_SOLTAS[corda]))) corda = i; }); }
    const cents = Math.round(1200 * Math.log2(f / CORDAS_SOLTAS[corda]));
    const n = infoNota(f);
    $('#af-nome').textContent = n.nome;
    $('#af-alvo').textContent = `${6 - corda}ª corda (${['Mi grave', 'Lá', 'Ré', 'Sol', 'Si', 'Mi agudo'][corda]})`;
    $('#af-hz').textContent = `${f.toFixed(1)} Hz`;
    $('#af-ponteiro').style.left = `${50 + Math.max(-50, Math.min(50, cents))}%`;
    const certo = Math.abs(cents) <= 5;
    $('#af').classList.toggle('certo', certo);
    $('#af-dica').textContent = certo ? 'Afinada'
      : Math.abs(cents) > 100 ? (cents < 0 ? 'Muito grave: aperte bastante a tarraxa' : 'Muito aguda: afrouxe bastante a tarraxa')
      : cents < 0 ? 'Grave: aperte um pouco a tarraxa' : 'Aguda: afrouxe um pouco a tarraxa';
    const agora = performance.now();
    if (certo) {
      if (this.firme.corda !== corda) this.firme = { corda, desde: agora };
      else if (agora - this.firme.desde > 800 && !this.ok[corda]) {
        this.ok[corda] = true;
        $(`[data-corda="${corda}"]`)?.classList.add('ok');
        vibrar(20);
        if (Object.keys(this.ok).length === 6) { toast('Violão afinado'); if (!hoje().afinou) { hoje().afinou = true; ganharXP(10, 'violão afinado'); } }
      }
    } else this.firme = { corda: null, desde: 0 };
  }
};
function iniciarMetronomo() {
  const beats = S.cfg.compasso || 4;
  metro = new Relogio({ bpm: S.cfg.bpm, sub: 1, aoPasso: (p, t) => { Som.click(t, p % beats === 0); quandoTocar(t, () => $$('#luzes i').forEach((l, i) => l.classList.toggle('on', i === p % beats))); } });
  metro.iniciar(); ativos.add('metro');
  const b = $('#metro-play'); if (b) b.textContent = 'Parar';
}
function pararMetronomo() {
  if (!metro) return;
  metro.parar(); metro = null; ativos.delete('metro'); Store.salvar();
  const b = $('#metro-play'); if (b) b.textContent = 'Começar';
  $$('#luzes i').forEach(l => l.classList.remove('on'));
}

/* ===== 8. Ajustes ===== */
function aplicarTema() {
  const t = S.cfg.tema || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t === 'escuro' ? 'dark' : 'light');
}
function abrirAjustes() {
  abrirJanela('Ajustes', `
    <div class="ajustes">
      <section class="mu-bloco"><h3>Som do violão</h3>
        <div class="modos" role="radiogroup" aria-label="Som do violão">${Object.entries(BANCOS).map(([k, b]) => `<button type="button" role="radio" class="modo" aria-checked="${S.cfg.violao === k}" data-violao="${k}"><b>${esc(b.nome)}</b><small>${esc(b.descricao)}</small></button>`).join('')}</div>
        <div class="linha-botoes"><button class="btn" id="aj-ouvir">${IC.som} Ouvir um acorde</button></div>
      </section>
      <section class="mu-bloco"><h3>Jogo</h3>
        <label class="alternar"><input type="checkbox" id="aj-metro" ${S.cfg.metronomo ? 'checked' : ''}><span>Metrônomo durante o jogo</span><small>use fone de ouvido: o microfone pode ouvir o clique</small></label>
        <label class="alternar"><input type="checkbox" id="aj-cordas" ${S.cfg.cordaGraveEmCima ? 'checked' : ''}><span>Corda grossa em cima</span><small>como você vê olhando para o violão (o padrão é o da tablatura)</small></label>
        <label class="alternar"><input type="checkbox" id="aj-vibrar" ${S.cfg.vibrar !== false ? 'checked' : ''}><span>Vibrar ao acertar</span></label>
      </section>
      <section class="mu-bloco"><h3>Microfone</h3>
        <div class="medidor" aria-label="Volume do microfone"><i id="aj-nivel"></i></div>
        <label class="faixa">Sensibilidade <b id="aj-sens-v">${S.cfg.sens}</b><input type="range" id="aj-sens" min="1" max="10" value="${S.cfg.sens}"><small class="sub">Se o jogo perde batidas, aumente. Se marca batidas que você não fez, diminua.</small></label>
        <div class="linha-op"><span>Atraso do microfone<small id="aj-lat">${S.cfg.latencia == null ? 'Automático' : `${Math.round(S.cfg.latencia * 1000)} ms`}</small></span><button class="btn mini" id="aj-calibrar">Calibrar</button></div>
        <div class="luzes" id="aj-luzes" hidden></div>
        <p class="sub" id="aj-msg"></p>
      </section>
      <section class="mu-bloco"><h3>Aparência</h3>
        <div class="segmentado" id="aj-tema">${[['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([k, n]) => `<button type="button" aria-pressed="${(S.cfg.tema || 'auto') === k}" data-tema="${k}">${n}</button>`).join('')}</div>
      </section>
      <section class="mu-bloco"><h3>Seu progresso</h3>
        <p class="sub">Nível ${nivelAtual()} (${esc(tituloNivel(nivelAtual()))}), ${S.xp} XP, ${Object.keys(S.licoes).length} lições concluídas, ${sequencia()} dias seguidos.</p>
        <div class="linha-botoes"><button class="btn mini" id="aj-boas">Refazer as boas-vindas</button></div>
      </section>
      <section class="mu-bloco creditos"><h3>Créditos</h3>
        <p class="sub">Sons de violão gravados: University of Iowa Electronic Music Studios e Freesound (quartertone), pela coleção tonejs-instruments (CC BY 3.0). Fonte Jost (OFL). Narração dos vídeos: voz sintética "faber" do Piper (rhasspy/piper-voices). Cifras: Cifra Club (só os acordes, sem letra). Gravações: player oficial do YouTube.</p>
      </section>
    </div>`, () => { offNivel?.(); });
  $('#janela').classList.add('cheia');
  let offNivel = null;
  $$('[data-violao]').forEach(b => b.addEventListener('click', async () => {
    Som.init(); Som.trocarBanco(b.dataset.violao); Store.salvar();
    $$('[data-violao]').forEach(x => x.setAttribute('aria-checked', x === b));
    await Som.carregarAmostras(b.dataset.violao); Som.golpe('G', Som.agora + 0.05, 'D', 0.32);
  }));
  $('#aj-ouvir').addEventListener('click', async () => { Som.init(); await Som.carregarAmostras(); Som.golpe('C', Som.agora + 0.05, 'D', 0.32); Som.golpe('C', Som.agora + 0.7, 'U', 0.26); Som.golpe('G', Som.agora + 1.1, 'D', 0.32); });
  $('#aj-metro').addEventListener('change', e => { S.cfg.metronomo = e.target.checked; Store.salvar(); });
  $('#aj-cordas').addEventListener('change', e => { S.cfg.cordaGraveEmCima = e.target.checked; Store.salvar(); });
  $('#aj-vibrar').addEventListener('change', e => { S.cfg.vibrar = e.target.checked; Store.salvar(); });
  $('#aj-sens').addEventListener('input', e => { S.cfg.sens = +e.target.value; $('#aj-sens-v').textContent = S.cfg.sens; Detector.aplicarSensibilidade(S.cfg.sens); Store.salvar(); });
  $$('#aj-tema [data-tema]').forEach(b => b.addEventListener('click', () => { S.cfg.tema = b.dataset.tema; Store.salvar(); aplicarTema(); $$('#aj-tema [data-tema]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  $('#aj-boas').addEventListener('click', () => { S.onb = false; fecharJanela(); verificarBoasVindas(); });
  $('#aj-calibrar').addEventListener('click', async () => {
    try { await Detector.ligar(); } catch (e) { $('#aj-msg').textContent = msgSemMicrofone(e); return; }
    if (!offNivel) offNivel = Detector.aoNivel(e => { const n = $('#aj-nivel'); if (n) n.style.transform = `scaleX(${Math.min(1, Math.sqrt(e) * 4)})`; });
    calibrarAtraso();
  });
}
/* Calibração: 4 cliques de contagem e depois 8 cliques. Você bate nas cordas
   junto com os 8. A diferença média é o atraso do microfone do seu aparelho. */
function calibrarAtraso() {
  Som.init(); Som.pararTudo();
  const intervalo = 60 / 80, t0 = Som.agora + 0.4, conta = 4, n = 8, cliques = [], ataques = [];
  const luzes = $('#aj-luzes');
  luzes.hidden = false;
  luzes.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
  $('#aj-msg').textContent = 'Escute 4 cliques. Depois bata nas cordas junto com os próximos 8.';
  for (let i = 0; i < conta + n; i++) {
    const t = t0 + i * intervalo;
    Som.click(t, i < conta, 0.6);
    if (i >= conta) { cliques.push(t); quandoTocar(t, () => $$('#aj-luzes i').forEach((l, k) => l.classList.toggle('on', k === i - conta))); }
  }
  const off = Detector.aoAtacar(a => ataques.push(a.t));
  setTimeout(() => {
    off();
    if (!$('#aj-luzes')) return;
    $('#aj-luzes').hidden = true;
    const desvios = [];
    for (const c of cliques) {
      let melhor = null;
      for (const a of ataques) if (Math.abs(a - c) < 0.35 && (melhor === null || Math.abs(a - c) < Math.abs(melhor - c))) melhor = a;
      if (melhor !== null) desvios.push(melhor - c);
    }
    if (desvios.length < 4) { $('#aj-msg').textContent = `Ouvi ${desvios.length} de 8 batidas. Toque mais forte ou aumente a sensibilidade e tente de novo.`; return; }
    S.cfg.latencia = Math.max(0, Math.min(0.35, mediana(desvios)));
    Store.salvar();
    $('#aj-lat').textContent = `${Math.round(S.cfg.latencia * 1000)} ms`;
    $('#aj-msg').textContent = `Pronto: o jogo vai descontar ${Math.round(S.cfg.latencia * 1000)} ms.`;
  }, (t0 + (conta + n) * intervalo - Som.agora + 0.6) * 1000);
}

/* ===== 9. Treinos ===== */
const JOGOS = {
  // Ritmo: escolha uma batida e toque junto (no tempo ou na prática)
  ritmo(padraoInicial = 'pop') {
    abrirJanela('Treino de ritmo', `
      <div class="treino">
        <div class="linha-op"><span>Ritmo</span><select id="rt-padrao">${PATTERNS.map(p => `<option value="${p.id}" ${p.id === padraoInicial ? 'selected' : ''}>${esc(p.genero)}: ${esc(p.nome)}</option>`).join('')}</select></div>
        <div id="rt-tira"></div>
        <div class="linha-botoes"><button class="btn" id="rt-ouvir">${IC.som} Ouvir</button><button class="btn primario" id="rt-jogar">${IC.play} Tocar junto</button></div>
      </div>`);
    const sel = $('#rt-padrao');
    const tira = () => { const p = patternById(sel.value); $('#rt-tira').innerHTML = `${batidaHTML(p)}<p class="sub">${esc(p.dica)}</p><p class="sub"><b>↓</b> para baixo, <b>↑</b> para cima, <b>P</b> polegar, <b>d</b> dedos.</p>`; };
    sel.addEventListener('change', tira); tira();
    $('#rt-ouvir').addEventListener('click', () => ouvirBatida(patternById(sel.value), 2));
    $('#rt-jogar').addEventListener('click', () => {
      const p = patternById(sel.value), tempos = p.passos.length / p.sub, trechos = [];
      p.demo.forEach((a, i) => { for (let r = 0; r < 2; r++) trechos.push({ acorde: a, tempos, inicio: (i * 2 + r) * tempos }); });
      Jogo.abrir({ titulo: p.genero, trechos, padrao: p, ritmo: 'batida', bpm: Math.round(p.bpm * 0.75), bpmBase: p.bpm, modo: 'tempo', entrada: 'mic', facil: true,
        aoFim: r => { if (r.pct !== null) registrar('batida', r.pct, 'max'); ganharXP(5 + Math.round((r.pct || 0) / 10), 'ritmo', true); } });
    });
  },
  // 1 minuto de trocas (JustinGuitar)
  trocas(a = null, b = null) {
    const sei = [...acordesAprendidos()];
    a = a || sei[0] || 'Em'; b = b || sei.find(x => x !== a) || 'D';
    const opcoes = sel => [...new Set([...sei, ...CHORDS.map(c => c.id)])].map(id => `<option ${id === sel ? 'selected' : ''}>${esc(id)}</option>`).join('');
    abrirJanela('1 minuto de trocas', `
      <div class="linha-botoes tr-escolha"><label>Acorde 1 <select id="tr-a">${opcoes(a)}</select></label><label>Acorde 2 <select id="tr-b">${opcoes(b)}</select></label></div>
      <div id="tr-area"></div>`, () => limpar?.());
    let limpar = null;
    const montar = () => { limpar?.(); limpar = trocaUmMinuto($('#tr-area'), $('#tr-a').value, $('#tr-b').value); };
    $('#tr-a').addEventListener('change', montar); $('#tr-b').addEventListener('change', montar);
    montar();
  },
  // Quiz: que acorde é este?
  quiz() {
    const basicos = ['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'A7', 'E7', 'D7', 'G7'];
    const pool = [...new Set([...basicos, ...acordesAprendidos()])];
    const perguntas = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    let i = 0, acertos = 0;
    abrirJanela('Que acorde é este?', `<div id="q"></div>`);
    const mostrar = () => {
      if (!$('#q')) return;
      if (i >= perguntas.length) {
        registrar('quiz', acertos); ganharXP(acertos * 2 + 2, 'quiz', true);
        $('#q').innerHTML = `<div class="qz-fim grande"><b>${acertos} de ${perguntas.length}</b><span>${acertos >= 8 ? 'Mandou bem!' : 'Revise os que errou na aba Acordes.'}</span><button class="btn primario" id="q-de-novo">Jogar de novo</button></div>`;
        $('#q-de-novo').addEventListener('click', () => JOGOS.quiz());
        return;
      }
      const certo = perguntas[i];
      const ops = [certo, ...pool.filter(x => x !== certo).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
      $('#q').innerHTML = `<div class="quiz"><p class="qz-num">Pergunta ${i + 1} de ${perguntas.length}</p>
        <div class="quiz-diag">${diagramaAcorde(certo, { tam: 'xl' })}</div>
        <div class="qz-opcoes grade">${ops.map(o => `<button class="opcao" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><p class="qz-exp" id="q-exp"></p></div>`;
      $$('#q [data-o]').forEach(b => b.addEventListener('click', () => {
        if ($('#q .opcao[disabled]')) return;
        const ok = b.dataset.o === certo;
        if (ok) acertos++;
        $$('#q [data-o]').forEach(x => { x.disabled = true; if (x.dataset.o === certo) x.classList.add('certa'); else if (x === b) x.classList.add('errada'); });
        ouvirAcorde(certo);
        $('#q-exp').innerHTML = `<b>${ok ? 'Isso!' : 'Quase.'}</b> É o <b>${esc(certo)}</b> (${esc(nomeAcorde(certo))}).`;
        setTimeout(() => { if (!$('#q')) return; i++; mostrar(); }, ok ? 1100 : 2000);
      }));
    };
    mostrar();
  }
};

/* ===== 10. Colar cifra e editar música ===== */
function abrirColarCifra(termo = '') {
  abrirJanela('Colar cifra', `
    <form class="form" id="f-colar">
      <p class="sub">Copie a cifra inteira de um site e cole aqui. O app pega só os acordes; a letra é descartada.</p>
      <label>Nome da música<input id="fc-titulo" required value="${esc(termo)}"></label>
      <label>Artista<input id="fc-artista"></label>
      <label>Cifra<textarea id="fc-texto" rows="9" placeholder="[Intro] Em  D&#10;Em          D&#10;(linha da letra...)"></textarea></label>
      <p class="sub" id="fc-msg"></p>
      <div class="linha-botoes"><a class="btn" target="_blank" rel="noopener" id="fc-buscar" href="#">${IC.externo} Procurar a cifra</a><button class="btn primario" type="submit">Montar o jogo</button></div>
    </form>`);
  const link = () => { $('#fc-buscar').href = Cifras.urlBusca(`${$('#fc-titulo').value} ${$('#fc-artista').value}`.trim()); };
  $('#fc-titulo').addEventListener('input', link); $('#fc-artista').addEventListener('input', link); link();
  $('#f-colar').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const m = prepararMusica(Cifras.deTexto($('#fc-texto').value, $('#fc-titulo').value.trim(), $('#fc-artista').value.trim()), null);
      S.musicas.push(m); Store.salvar();
      if (viewAtual === 'musicas') renderMusicas();
      abrirMusica(m.id);
    } catch (err) { $('#fc-msg').textContent = err.message; }
  });
}
// Seções em texto: "[Refrão x2] Am7:4 D7:2 G:2" (uma por linha)
const secoesParaTexto = secoes => secoes.map(s => `[${s.nome}${s.repetir > 1 ? ' x' + s.repetir : ''}] ${s.seq}`).join('\n');
function textoParaSecoes(txt) {
  return String(txt).split(/\r?\n/).map((l, i) => {
    const m = l.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    let nome = `Parte ${i + 1}`, resto = l, repetir = 1;
    if (m) { nome = m[1].trim(); resto = m[2]; const r = nome.match(/\s+x(\d+)$/i); if (r) { repetir = +r[1]; nome = nome.replace(/\s+x\d+$/i, ''); } }
    return { nome, seq: lerSequencia(resto).map(x => `${x.acorde}:${x.tempos}`).join(' '), repetir };
  }).filter(s => s.seq);
}
function abrirFormMusica(m = {}, nova = false) {
  const editando = !!m.id && !nova && S.musicas.some(x => x.id === m.id);
  abrirJanela(editando ? 'Editar música' : 'Nova música', `
    <form class="form" id="f-musica">
      <label>Nome da música<input id="f-titulo" required value="${esc(m.titulo || '')}"></label>
      <label>Artista<input id="f-artista" value="${esc(m.artista || '')}"></label>
      <label>Seções e acordes<textarea id="f-secoes" rows="7" placeholder="[Introdução] Em:4 D:4&#10;[Refrão x2] C:4 G:2 Am:2">${esc(m.secoes ? secoesParaTexto(m.secoes) : '')}</textarea>
        <small class="sub">Uma seção por linha. "Am7:4" = Am7 por 4 tempos (1 compasso). "x2" repete a seção.</small></label>
      <p class="sub" id="f-check"></p>
      <div class="form-linha">
        <label>Ritmo<select id="f-padrao">${PATTERNS.map(p => `<option value="${p.id}" ${p.id === (m.padrao || 'pop') ? 'selected' : ''}>${esc(p.genero)}</option>`).join('')}</select></label>
        <label>BPM<input id="f-bpm" type="number" min="40" max="220" value="${m.bpm || 80}"></label>
        <label>Capo<input id="f-capo" type="number" min="0" max="9" value="${m.capo || 0}"></label>
      </div>
      <div class="linha-botoes">${editando ? '<button type="button" class="btn perigo" id="f-apagar">Apagar</button>' : ''}<button class="btn primario" type="submit">Salvar</button></div>
    </form>`);
  const checar = () => {
    const secs = textoParaSecoes($('#f-secoes').value);
    const acs = [...new Set(secs.flatMap(s => lerSequencia(s.seq).map(x => x.acorde)))];
    const sem = acs.filter(a => !acordePorNome(a));
    $('#f-check').innerHTML = acs.length ? `${secs.length} seções, ${acs.length} acordes diferentes.${sem.length ? ` Sem desenho no app: <b>${esc(sem.join(' '))}</b>.` : ''}` : '';
  };
  $('#f-secoes').addEventListener('input', checar); checar();
  $('#f-apagar')?.addEventListener('click', e => {
    const b = e.currentTarget;
    if (b.dataset.confirmar) { S.musicas = S.musicas.filter(x => x.id !== m.id); Store.salvar(); fecharJanela(); renderMusicas(); toast('Música apagada'); }
    else { b.dataset.confirmar = '1'; b.textContent = 'Toque de novo para apagar'; }
  });
  $('#f-musica').addEventListener('submit', e => {
    e.preventDefault();
    const secoes = textoParaSecoes($('#f-secoes').value);
    if (!secoes.length) { $('#f-check').innerHTML = '<b>Coloque pelo menos um acorde.</b>'; return; }
    const dados = { ...m, id: editando ? m.id : 'm' + Date.now().toString(36), origem: m.origem === 'catalogo' ? 'minha' : (m.origem || 'minha'),
      titulo: $('#f-titulo').value.trim(), artista: $('#f-artista').value.trim(), padrao: $('#f-padrao').value,
      bpm: +$('#f-bpm').value || 80, capo: Math.max(0, +$('#f-capo').value || 0), secoes };
    delete dados.grupo;
    S.musicas = editando ? S.musicas.map(x => (x.id === m.id ? dados : x)) : [...S.musicas, dados];
    Store.salvar(); fecharJanela(); irPara('musicas'); toast('Música salva');
  });
}

/* ===== 11. Inicialização ===== */
function iniciarApp() {
  Store.carregarLocal();
  aplicarTema();
  $$('.nav button').forEach(b => b.addEventListener('click', () => irPara(b.dataset.view)));
  $('#janela-fechar').addEventListener('click', fecharJanela);
  $('#janela').addEventListener('click', e => { if (e.target.id === 'janela') fecharJanela(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#janela').hidden && !Jogo.atual) fecharJanela(); });
  $('#btn-ajustes').addEventListener('click', abrirAjustes);
  const inicial = (location.hash || '').slice(1);
  irPara(inicial || 'hoje');
  Store.conectarNuvem();
  verificarBoasVindas();
  IA.carregar();
  configurarPWA();
  // o som carrega no primeiro toque (o navegador só libera áudio depois de um toque)
  document.addEventListener('pointerdown', () => { try { Som.init(); } catch (e) {} }, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { Store.salvar(true); Jogo.atual?.pausar(); } });
}

/* App Android (Capacitor): "abrir em nova aba" não existe. Mandamos o link para a
   própria janela; o Capacitor percebe que é um site externo e abre no navegador. */
if (window.Capacitor) {
  document.documentElement.classList.add('app-android');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[target="_blank"]');
    if (!a || !/^https?:/.test(a.href)) return;
    e.preventDefault();
    location.href = a.href;
  });
  document.getElementById('instalar')?.remove();
  // botão "voltar" do Android: fecha o jogo / a janela antes de sair do app
  document.addEventListener('backbutton', () => {
    if (Jogo.atual) { Jogo.atual.pausado ? Jogo.atual.sair() : Jogo.atual.pausar(); return; }
    if (document.querySelector('.camada')) { document.querySelector('.camada').remove(); return; }
    if (!$('#janela').hidden) { fecharJanela(); return; }
    if (viewAtual !== 'hoje') { irPara('hoje'); return; }
    window.Capacitor?.Plugins?.App?.exitApp?.();
  });
}

/* PWA: o service worker (sw.js) guarda os arquivos, então o app abre sem internet. */
let pedidoInstalar = null;
function configurarPWA() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.claude && !window.Capacitor) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        novo?.addEventListener('statechange', () => { if (novo.state === 'installed' && navigator.serviceWorker.controller) toast('Nova versão instalada. Feche e abra o app para atualizar.'); });
      });
    }).catch(() => {});
  }
  const btn = $('#instalar');
  if (!btn) return;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; btn.hidden = false; });
  btn.addEventListener('click', async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    const { outcome } = await pedidoInstalar.userChoice;
    if (outcome === 'accepted') btn.hidden = true;
    pedidoInstalar = null;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; toast('Toca Aí instalado'); });
}

iniciarApp();
