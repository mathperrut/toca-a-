/* =========================================================
   TOCA AÍ — app.js
   Organização (procure pelos títulos ===== ):
   1. Utilidades
   2. Estado e armazenamento (salvar progresso)
   3. XP, níveis, missões e sequência de dias
   4. Som (Web Audio: violão sintetizado e clique)
   5. Relógio musical (base do metrônomo e dos jogos)
   6. Desenho dos acordes (SVG)
   7. Telas: Hoje, Trilha, Jogos, Acordes, Músicas, Ferramentas
   8. Janelas: lição, jogos, player de música
   9. Inicialização
   ========================================================= */
'use strict';

/* ===== 1. Utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// acordePorNome (estrada.js) também acha acordes fora da lista, gerando pestana
const chordById = id => (typeof acordePorNome === 'function' ? acordePorNome(id) : CHORDS.find(c => c.id === id));
const patternById = id => PATTERNS.find(p => p.id === id) || PATTERNS[0];
const lessonById = id => LESSONS.find(l => l.id === id);

function dayKey(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// Gera números "aleatórios" sempre iguais para a mesma semente (usado nas missões do dia)
function rngFrom(seed) {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

// Nome do acorde por extenso: "Am" -> "Lá menor"
const NOTAS_PT = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
function nomeAcorde(id) {
  const m = id.match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return id;
  let nome = NOTAS_PT[m[1]] + (m[2] === '#' ? ' sustenido' : m[2] === 'b' ? ' bemol' : '');
  const resto = m[3];
  const mapa = { '': ' maior', 'm': ' menor', '7': ' com sétima', 'm7': ' menor com sétima', '7M': ' com sétima maior' };
  return nome + (mapa[resto] ?? ' ' + resto);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ===== 2. Estado e armazenamento =====
   Todo o progresso fica num único objeto "S".
   Ele é salvo no navegador (localStorage) e, quando o app
   roda publicado no Claude, também na sua conta. */
const LS_KEY = 'tocaai:v1';
function novoEstado() {
  return { v: 1, updatedAt: 0, xp: 0, licoes: {}, favs: [], musicas: [], log: {}, recordes: {}, cfg: { bpm: 80, guia: true, sens: 5, latencia: null, entrada: 'tela', vel: 'medio', somReal: true }, amostras: [], recordesMusica: {}, gravacoes: {} };
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
      if (raw) { S = Object.assign(novoEstado(), JSON.parse(raw)); S.cfg = Object.assign(novoEstado().cfg, S.cfg); }
      migrarMusicas();
    } catch (e) { /* navegador sem armazenamento: segue com estado novo */ }
  },
  salvarLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} },
  salvar(imediato = false) {
    S.updatedAt = Date.now();
    this.salvarLocal();
    if (!this.ref) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.ref.set({ json: JSON.stringify(S) }).catch(() => {});
    }, imediato ? 0 : 1500);
  },
  // Só funciona quando o app está publicado no Claude. No seu PC, window.claude não existe.
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
          this.salvarLocal();
          renderTudo();
        } else if ((S.updatedAt || 0) > (remoto.updatedAt || 0)) {
          this.salvar(true);
        }
      } else if (S.updatedAt) {
        this.salvar(true);
      }
      $('#sync').textContent = 'Progresso salvo na sua conta';
    } catch (e) { this.ref = null; }
  }
};

/* ===== 3. XP, níveis, missões e sequência ===== */
// Nível n começa em 50·n·(n-1) XP: 0, 100, 300, 600, 1000...
const xpDoNivel = n => 50 * n * (n - 1);
function nivelAtual(xp = S.xp) { let n = 1; while (xp >= xpDoNivel(n + 1)) n++; return n; }

function ganharXP(qtd, motivo) {
  const antes = nivelAtual();
  S.xp += qtd;
  const depois = nivelAtual();
  toast(depois > antes ? `Nível ${depois}! Agora você é ${tituloNivel(depois)}.` : `+${qtd} XP · ${motivo}`);
  Store.salvar();
  renderHeader();
  animarXP(qtd, depois > antes);
}
// Microinterações: "+N XP" sobe da barra; ao subir de nível, um anel dourado se expande
function animarXP(qtd, subiuNivel) {
  const caixa = $('.nivel-box');
  if (!caixa || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = document.createElement('span');
  f.className = 'xp-flutua'; f.textContent = `+${qtd} XP`;
  caixa.appendChild(f);
  setTimeout(() => f.remove(), 1200);
  caixa.classList.remove('pulsa'); void caixa.offsetWidth; caixa.classList.add('pulsa');
  if (subiuNivel) {
    const anel = document.createElement('div'); anel.className = 'nivel-anel'; anel.innerHTML = `<b>Nível ${nivelAtual()}</b>`;
    document.body.appendChild(anel); vibrar([20, 60, 20, 60, 40]);
    setTimeout(() => anel.remove(), 1800);
  }
}
// Vibração curta (Android): confirma o toque sem precisar olhar
function vibrar(padrao) { try { if (S.cfg.vibrar !== false) navigator.vibrate?.(padrao); } catch (e) {} }
const tituloNivel = n => TITULOS[Math.min(n - 1, TITULOS.length - 1)];

function missoesDoDia(k = dayKey()) {
  const r = rngFrom('missao' + k);
  const pool = [...MISSOES];
  const escolhidas = [];
  while (escolhidas.length < 3) escolhidas.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return escolhidas;
}
function valorMetrica(d, metrica) { return metrica === 'min' ? Math.floor(d.seg / 60) : (d[metrica] || 0); }

// Registra algo que aconteceu hoje. modo 'max' guarda o melhor valor (ex.: % na batida)
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
      missaoRecente = m.id;
      vibrar([12, 40, 12]);
      ganharXP(m.xp, 'missão concluída');
    }
  }
  if ($('#view-hoje') && !$('#view-hoje').hidden) renderHoje();
}
function diaAtivo(d) { return d && (d.seg >= 60 || d.licoes || d.trocas || d.quiz || d.batida || d.musicas); }
function sequencia() {
  let n = 0, d = new Date();
  if (!diaAtivo(S.log[dayKey(d)])) d = addDays(d, -1); // hoje ainda não conta como falha
  while (diaAtivo(S.log[dayKey(d)])) { n++; d = addDays(d, -1); }
  return n;
}

// Tempo de treino: enquanto algo "ativo" estiver rodando, conta 1 segundo por segundo
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
  atualizarCronometro();
  if (d.seg % 15 === 0) { verificarMissoes(); Store.salvar(); }
}, 1000);

/* ===== 4. Som =====
   O som de violão é sintetizado com o algoritmo Karplus-Strong:
   um pedaço de ruído que é repetido e suavizado várias vezes,
   imitando a vibração de uma corda. Nenhum arquivo de áudio é usado. */
const CORDAS_SOLTAS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2 A2 D3 G3 B3 E4 (Hz)
const Som = {
  ctx: null, master: null, cache: new Map(), fontes: [],
  amostras: new Map(), carregando: null, vozes: [],
  /* Som REAL: 45 notas gravadas de um violão de náilon (pasta sons/violao-nylon,
     arquivo = número MIDI da nota). Para tocar uma nota, pegamos a gravação mais
     próxima e ajustamos a velocidade um tiquinho para acertar a afinação exata.
     Se os arquivos não carregarem (ex.: abrindo o index.html direto), o app usa o
     som sintetizado (Karplus-Strong) como plano B. */
  carregarAmostras() {
    if (this.carregando) return this.carregando;
    const ctx = this.ctx;
    const um = m => fetch(`sons/violao-nylon/${m}.mp3`)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then(b => new Promise((ok, erro) => ctx.decodeAudioData(b, ok, erro)))
      .then(buf => { this.amostras.set(m, buf); })
      .catch(() => {});
    this.carregando = Promise.all(Array.from({ length: 45 }, (_, i) => um(40 + i)));
    return this.carregando;
  },
  get somReal() { return S.cfg.somReal !== false && this.amostras.size > 0; },
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.carregarAmostras();
    return this.ctx;
  },
  get agora() { return this.ctx ? this.ctx.currentTime : 0; },
  buffer(freq) {
    const chave = Math.round(freq * 10);
    if (this.cache.has(chave)) return this.cache.get(chave);
    const sr = this.ctx.sampleRate, len = Math.floor(sr * 1.8), N = Math.max(2, Math.round(sr / freq));
    const buf = this.ctx.createBuffer(1, len, sr), out = buf.getChannelData(0);
    const anel = new Float32Array(N);
    let ant = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; anel[i] = (r + ant) / 2; ant = r; } // ruído "abafado" = náilon
    const perda = freq > 200 ? 0.992 : 0.996;
    for (let i = 0, k = 0; i < len; i++) {
      const prox = (k + 1) % N;
      out[i] = anel[k];
      anel[k] = 0.5 * (anel[k] + anel[prox]) * perda;
      k = prox;
    }
    for (let i = len - 2000; i < len; i++) out[i] *= (len - i) / 2000; // fade final
    this.cache.set(chave, buf);
    return buf;
  },
  // corda (0 a 5): quando a mesma corda é tocada de novo, a nota anterior para,
  // como num violão de verdade (a corda só vibra uma nota por vez)
  nota(freq, t, vol = 0.35, corda = null) {
    const t0 = Math.max(t, this.agora);
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
    const midiExato = 69 + 12 * Math.log2(freq / 440), m = Math.round(midiExato);
    const amostra = S.cfg.somReal !== false ? this.amostras.get(m) : null;
    if (amostra) {
      s.buffer = amostra;
      s.playbackRate.value = Math.pow(2, (midiExato - m) / 12); // correção fina (capo, desafinação)
      g.gain.value = vol * 2.6;                                   // as gravações vêm com volume mais baixo
      s.connect(g).connect(this.master);
      s.start(t0, 0.006);                                         // pula 6 ms de silêncio do arquivo
    } else {
      s.buffer = this.buffer(freq);
      g.gain.value = vol;
      s.connect(g).connect(this.master);
      s.start(t0);
    }
    if (corda !== null) {
      const ant = this.vozes[corda];
      if (ant && ant.t0 <= t0) { ant.g.gain.setTargetAtTime(0, t0, 0.012); try { ant.s.stop(t0 + 0.15); } catch (e) {} }
      this.vozes[corda] = { s, g, t0 };
    }
    this.fontes.push(s);
    if (this.fontes.length > 300) this.fontes.splice(0, 100);
    return s;
  },
  click(t, forte = false, vol = 0.5) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.value = forte ? 1600 : 1050;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.06);
    this.fontes.push(o);
  },
  freqDe(acorde, corda) {
    const f = acorde.frets[corda];
    return f < 0 ? null : CORDAS_SOLTAS[corda] * Math.pow(2, f / 12);
  },
  // Toca um "golpe" de mão direita num acorde. tipo = símbolo da batida. capo = casa do capotraste
  golpe(acordeId, t, tipo = 'D', vol = 0.3, capo = 0) {
    const a = chordById(acordeId);
    if (!a) return;
    const fCapo = Math.pow(2, capo / 12);
    const tocadas = [0, 1, 2, 3, 4, 5].filter(i => a.frets[i] >= 0);
    const baixo = tocadas[0];
    const toca = (cordas, espaco = 0.012, v = vol) => cordas.forEach((c, i) => { const f = this.freqDe(a, c); if (f) this.nota(f * fCapo, t + i * espaco, v, c); });
    switch (tipo) {
      case 'D': toca(tocadas); break;
      case 'U': toca(tocadas.filter(c => c >= 2).reverse(), 0.01, vol * 0.8); break;
      case 'B': case 'p': toca([baixo], 0, vol * 1.3); break;
      case 'F': toca([3, 4, 5], 0.004, vol * 0.85); break;
      case 'X': toca([baixo], 0, vol * 1.3); toca([3, 4, 5], 0.004, vol * 0.85); break;
      case 'i': toca([3]); break;
      case 'm': toca([4]); break;
      case 'a': toca([5]); break;
    }
  },
  pararTudo() {
    for (const f of this.fontes) { try { f.stop(); } catch (e) {} }
    this.fontes = []; this.vozes = [];
  }
};

/* ===== 5. Relógio musical =====
   O setInterval do JavaScript atrasa às vezes. Por isso usamos o
   truque do "olhar para frente": a cada 25 ms agendamos no relógio
   de áudio (preciso) os sons dos próximos 120 ms. */
class Relogio {
  constructor({ bpm, sub = 1, aoPasso }) { Object.assign(this, { bpm, sub, aoPasso }); }
  get duracaoPasso() { return 60 / this.bpm / this.sub; }
  iniciar(atraso = 0.12) {
    Som.init();
    this.passo = 0;
    this.prox = Som.agora + atraso;
    this.inicio = this.prox;
    this.id = setInterval(() => this.agendar(), 25);
    this.agendar();
  }
  agendar() {
    while (this.prox < Som.agora + 0.12) {
      this.aoPasso(this.passo, this.prox);
      this.prox += this.duracaoPasso;
      this.passo++;
    }
  }
  parar() { clearInterval(this.id); this.id = null; }
}
// Executa uma função visual no momento em que o som toca
function quandoTocar(t, fn) { setTimeout(fn, Math.max(0, (t - Som.agora) * 1000)); }

/* ===== 6. Desenho dos acordes (SVG) ===== */
function acordeSVG(id, tam = 'md') {
  const a = chordById(id);
  if (!a) return `<div class="sem-acorde">${esc(id)}<small>sem desenho</small></div>`;
  const W = 120, H = 140, x0 = 22, y0 = 32, dx = 16, dy = 22, casas = 4;
  const usadas = a.frets.filter(f => f > 0);
  const base = Math.max(...usadas, 0) > 4 ? Math.min(...usadas) : 1;
  let s = `<svg class="diagrama ${tam}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Acorde ${esc(id)}">`;
  // trastes (linhas horizontais) e cordas (verticais)
  for (let i = 0; i <= casas; i++) s += `<line class="${i === 0 && base === 1 ? 'pestana-nut' : 'traste'}" x1="${x0}" y1="${y0 + i * dy}" x2="${x0 + 5 * dx}" y2="${y0 + i * dy}"/>`;
  for (let c = 0; c < 6; c++) s += `<line class="corda" x1="${x0 + c * dx}" y1="${y0}" x2="${x0 + c * dx}" y2="${y0 + casas * dy}"/>`;
  if (base > 1) s += `<text class="casa-num" x="${x0 - 8}" y="${y0 + dy * 0.5 + 4}" text-anchor="end">${base}ª</text>`;
  // pestana
  if (a.barre) {
    const cordas = a.frets.map((f, i) => f === a.barre ? i : -1).filter(i => i >= 0);
    const c1 = Math.min(...cordas), c2 = Math.max(...cordas), y = y0 + (a.barre - base + 0.5) * dy;
    s += `<rect class="ponto" x="${x0 + c1 * dx - 6}" y="${y - 6}" width="${(c2 - c1) * dx + 12}" height="12" rx="6"/>`;
  }
  a.frets.forEach((f, c) => {
    const x = x0 + c * dx;
    if (f < 0) s += `<text class="marca" x="${x}" y="${y0 - 10}" text-anchor="middle">×</text>`;
    else if (f === 0) s += `<circle class="solta" cx="${x}" cy="${y0 - 14}" r="4.5"/>`;
    else if (!(a.barre && f === a.barre && a.fingers[c] === 1)) {
      const y = y0 + (f - base + 0.5) * dy;
      s += `<circle class="ponto" cx="${x}" cy="${y}" r="7"/><text class="dedo" x="${x}" y="${y + 3.5}" text-anchor="middle">${a.fingers[c] || ''}</text>`;
    }
  });
  return s + '</svg>';
}

// Mostra os símbolos de uma batida
const SIMBOLO = { D: '↓', U: '↑', B: 'P', F: 'd', X: 'P+d', p: 'p', i: 'i', m: 'm', a: 'a', '-': '·' };
function batidaHTML(p) {
  return `<div class="batida-tira" style="--n:${p.passos.length}">${p.passos.map((t, i) =>
    `<span class="${t === '-' ? 'pausa' : ''} ${i % p.sub === 0 ? 'tempo' : ''}">${SIMBOLO[t]}</span>`).join('')}</div>
    <p class="legenda">${p.beats} tempos por compasso · ${p.sub === 2 ? 'colcheias' : 'semicolcheias'} · <b>P</b> polegar, <b>d</b> dedos juntos</p>`;
}
function ouvirBatida(p, compassos = 2, acordes = p.demo) {
  Som.init(); Som.pararTudo();
  const dur = 60 / p.bpm / p.sub, t0 = Som.agora + 0.1;
  for (let b = 0; b < compassos; b++) p.passos.forEach((tok, s) => {
    const t = t0 + (b * p.passos.length + s) * dur;
    if (s % p.sub === 0) Som.click(t, s === 0, 0.15);
    if (tok !== '-') Som.golpe(acordes[b % acordes.length], t, tok);
  });
}

/* ===== 7. Telas ===== */
const CADEADO = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const VIEWS = ['hoje', 'trilha', 'jogos', 'acordes', 'musicas', 'ferramentas'];
let viewAtual = 'hoje';

function irPara(v) {
  if (v === 'jogos') v = 'trilha';            // Jogos agora mora dentro de "Aprender"
  if (!VIEWS.includes(v)) v = 'hoje';
  viewAtual = v;
  VIEWS.forEach(n => { $('#view-' + n).hidden = n !== v; });
  $$('.nav button').forEach(b => b.setAttribute('aria-current', b.dataset.view === v ? 'page' : 'false'));
  if (v !== 'ferramentas') { pararMetronomo(); afinador.parar(); qualAcorde.parar(); }
  if (v !== 'musicas') { Previa.parar(); }
  RENDER[v]();
  try { history.replaceState(null, '', '#' + v); } catch (e) {}
  window.scrollTo(0, 0);
}

function renderHeader() {
  const n = nivelAtual(), ini = xpDoNivel(n), fim = xpDoNivel(n + 1);
  $('#nivel').textContent = n;
  $('#titulo-nivel').textContent = tituloNivel(n);
  $('#xp-txt').textContent = `${S.xp - ini} / ${fim - ini} XP`;
  $('#xp-barra').style.width = ((S.xp - ini) / (fim - ini) * 100) + '%';
  $('#seq').textContent = sequencia();
}

function proximaLicao() { return LESSONS.find(l => !S.licoes[l.id]); }
function licaoLiberada(l) { const i = LESSONS.indexOf(l); return i === 0 || S.licoes[LESSONS[i - 1].id]; }

function renderHoje() {
  const d = hoje(), prox = proximaLicao();
  const missoes = missoesDoDia();
  const feitas = missoes.filter(m => d.missoes[m.id]).length;
  const semTreino = totalSemana() === 0 && !Object.values(S.log).some(x => x.seg > 0);
  $('#view-hoje').innerHTML = `
    ${prox ? `<button class="continuar" data-licao="${prox.id}">
        <span class="eyebrow">Próxima lição · ${esc(MODULES.find(m => m.id === prox.mod).nome)}</span>
        <span class="c-titulo">${esc(prox.titulo)}</span>
        <span class="c-rodape"><span class="c-xp">+${prox.xp} XP</span><span class="c-seta" aria-hidden="true">Começar →</span></span>
      </button>` : `<button class="continuar" data-ir="musicas"><span class="eyebrow">Trilha completa</span><span class="c-titulo">Escolha uma música para tocar</span><span class="c-rodape"><span class="c-seta">Ir para Músicas →</span></span></button>`}

    <section class="bloco">
      <div class="bloco-topo"><h2>Missões de hoje</h2><span class="pill ${feitas === 3 ? 'pill-ok' : ''}">${feitas}/3</span></div>
      <ul class="missoes">${missoes.map(m => {
        const v = Math.min(valorMetrica(d, m.metrica), m.alvo), ok = d.missoes[m.id];
        const un = m.metrica === 'batida' ? '%' : '';
        return `<li class="${ok ? 'ok' : ''} ${ok && m.id === missaoRecente ? 'recem' : ''}">
          <span class="m-check" aria-hidden="true">${ok ? '✓' : ''}</span>
          <div class="m-corpo">
            <div class="m-txt"><span>${esc(m.texto)}</span><span class="m-num">${ok ? 'Feito' : `${v}${un}/${m.alvo}${un}`}</span></div>
            <div class="trilho"><i style="width:${v / m.alvo * 100}%"></i></div>
          </div>
          <span class="m-xp">+${m.xp}</span></li>`;
      }).join('')}</ul>
    </section>

    <section class="bloco">
      <div class="bloco-topo"><h2>Seu treino</h2><span class="sub">${totalSemana()} min nesta semana</span></div>
      ${semTreino ? `<p class="vazio-grafico">Seu gráfico aparece aqui depois do primeiro treino. Cada minuto em lições, jogos e músicas conta.</p>` : graficoDias()}
      <div class="treino-livre">
        <div><b>Tocando fora do app?</b><span class="sub">Ligue o cronômetro e o tempo conta igual.</span></div>
        <button class="btn ${ativos.has('livre') ? 'perigo' : ''}" id="btn-livre">${ativos.has('livre') ? `■ <span id="cron-hoje">${fmtMin(d.seg)}</span>` : '▶ Cronômetro'}</button>
      </div>
    </section>`;
  missaoRecente = null;
  $('[data-licao]', $('#view-hoje'))?.addEventListener('click', e => abrirLicao(e.currentTarget.dataset.licao));
  $('[data-ir]', $('#view-hoje'))?.addEventListener('click', e => irPara(e.currentTarget.dataset.ir));
  $('#btn-livre').addEventListener('click', () => {
    if (ativos.has('livre')) { ativos.delete('livre'); Store.salvar(); }
    else ativos.add('livre');
    renderHoje();
  });
  renderHeader();
}
let missaoRecente = null;
function fmtMin(seg) { const m = Math.floor(seg / 60), s = seg % 60; return `${m}:${String(s).padStart(2, '0')} min`; }
function atualizarCronometro() { const el = $('#cron-hoje'); if (el) el.textContent = fmtMin(hoje().seg); }
function totalSemana() { let t = 0; for (let i = 0; i < 7; i++) t += (S.log[dayKey(addDays(new Date(), -i))]?.seg || 0); return Math.round(t / 60); }

function graficoDias() {
  const dias = [];
  for (let i = 13; i >= 0; i--) { const d = addDays(new Date(), -i); dias.push({ d, min: Math.round((S.log[dayKey(d)]?.seg || 0) / 60) }); }
  const max = Math.max(15, ...dias.map(x => x.min));
  const topo = Math.ceil(max / 15) * 15;
  const W = 560, H = 170, pl = 30, pb = 26, pt = 10, larg = (W - pl) / 14;
  const y = v => pt + (H - pt - pb) * (1 - v / topo);
  let s = `<div class="grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutos de treino por dia">`;
  [0, topo / 2, topo].forEach(v => s += `<line class="grade" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="eixo" x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`);
  dias.forEach((x, i) => {
    const h = H - pb - y(x.min), cx = pl + i * larg + larg * 0.18, w = larg * 0.64, ehHoje = i === 13;
    if (x.min > 0) s += `<rect class="barra ${ehHoje ? 'hoje' : ''}" x="${cx}" y="${y(x.min)}" width="${w}" height="${Math.max(h, 2)}" rx="3"><title>${x.min} min</title></rect>`;
    else s += `<rect class="barra vazia" x="${cx}" y="${H - pb - 2}" width="${w}" height="2" rx="1"/>`;
    if (i % 2 === 1 || ehHoje) s += `<text class="eixo" x="${cx + w / 2}" y="${H - 8}" text-anchor="middle">${ehHoje ? 'hoje' : x.d.getDate()}</text>`;
  });
  return s + '</svg></div>';
}

function renderTrilha() {
  $('#view-trilha').innerHTML = `<section class="jogos-rapidos"><div class="bloco-topo"><h2>Treinos rápidos</h2><span class="sub">2 a 5 minutos</span></div><div id="jogos-lista"></div></section>` + MODULES.map(mod => {
    const ls = LESSONS.filter(l => l.mod === mod.id);
    const feitas = ls.filter(l => S.licoes[l.id]).length;
    return `<section class="modulo">
      <div class="bloco-topo"><h2>${esc(mod.nome)}</h2><span class="pill">${feitas}/${ls.length}</span></div>
      <ol class="trilha">${ls.map(l => {
        const feito = S.licoes[l.id], livre = licaoLiberada(l);
        const estado = feito ? 'feito' : livre ? 'livre' : 'travado';
        return `<li class="no ${estado}"><button data-licao="${l.id}" ${livre ? '' : 'aria-disabled="true"'}>
          <span class="no-icone">${feito ? '✓' : livre ? LESSONS.indexOf(l) + 1 : CADEADO}</span>
          <span class="no-txt"><b>${esc(l.titulo)}</b><small>${feito ? 'Concluída' : livre ? `+${l.xp} XP` : 'Conclua a anterior'}</small></span>
        </button></li>`;
      }).join('')}</ol></section>`;
  }).join('');
  renderJogos($('#jogos-lista'));
  $$('#view-trilha [data-licao]').forEach(b => b.addEventListener('click', () => {
    const l = lessonById(b.dataset.licao);
    if (!licaoLiberada(l)) return toast('Conclua a lição anterior primeiro.');
    abrirLicao(l.id);
  }));
}

function renderJogos(alvo = $('#view-jogos')) {
  const rec = Object.entries(S.recordes).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const icone = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  alvo.innerHTML = `
    <div class="jogos">
      <button class="jogo" data-jogo="batida">${icone('<path d="M4 12h3l2-6 4 12 2-6h5"/>')}<b>Batida</b><span>Ritmo no tempo certo</span><small>${hoje().batida ? `Melhor hoje: <b>${hoje().batida}%</b>` : 'Ainda não jogou hoje'}</small></button>
      <button class="jogo" data-jogo="trocas">${icone('<path d="M7 7h11l-3-3M17 17H6l3 3"/>')}<b>Trocas</b><span>2 acordes, 1 minuto</span><small>${rec.length ? `Recorde: <b>${rec[0][1]}</b>` : 'Sem recorde ainda'}</small></button>
      <button class="jogo" data-jogo="quiz">${icone('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>')}<b>Quiz</b><span>Reconheça acordes</span><small>${hoje().quiz ? `Acertos hoje: <b>${hoje().quiz}</b>` : '10 perguntas'}</small></button>
    </div>`;
  $$('[data-jogo]', alvo).forEach(b => b.addEventListener('click', () => JOGOS[b.dataset.jogo]()));
}

let filtroAcorde = 'todos';
function renderAcordes() {
  const v = $('#view-acordes');
  if (!$('#busca-acorde', v)) {
    v.innerHTML = `
      <div class="filtros">
        <input id="busca-acorde" type="search" placeholder="Buscar acorde (ex.: Am, G7, Sol)" autocomplete="off">
        <div class="chips">${[['todos', 'Todos'], ['maior', 'Maiores'], ['menor', 'Menores'], ['setima', 'Com 7'], ['pestana', 'Pestana'], ['favs', 'Favoritos']].map(([k, t]) => `<button class="chip" data-f="${k}">${t}</button>`).join('')}</div>
      </div>
      <div class="grade-acordes" id="grade-acordes"></div>`;
    $('#busca-acorde').addEventListener('input', desenharGradeAcordes);
    $$('.chip', v).forEach(c => c.addEventListener('click', () => { filtroAcorde = c.dataset.f; desenharGradeAcordes(); }));
  }
  desenharGradeAcordes();
}
function desenharGradeAcordes() {
  const q = $('#busca-acorde').value.trim().toLowerCase();
  $$('#view-acordes .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.f === filtroAcorde));
  const lista = CHORDS.filter(c => {
    const suf = c.id.replace(/^[A-G](#|b)?/, '');
    const ok = { todos: true, maior: suf === '', menor: suf.startsWith('m'), setima: suf.includes('7'), pestana: !!c.barre, favs: S.favs.includes(c.id) }[filtroAcorde];
    return ok && (!q || c.id.toLowerCase().startsWith(q) || nomeAcorde(c.id).toLowerCase().includes(q));
  });
  $('#grade-acordes').innerHTML = lista.length ? lista.map(c => `
    <article class="card-acorde">
      <header><b>${esc(c.id)}</b><button class="fav" data-fav="${c.id}" aria-pressed="${S.favs.includes(c.id)}" aria-label="Favoritar ${c.id}">★</button></header>
      ${acordeSVG(c.id)}
      <small>${nomeAcorde(c.id)}</small>
      <button class="btn mini" data-ouvir="${c.id}">Ouvir</button>
    </article>`).join('') : `<p class="vazio">${filtroAcorde === 'favs' ? 'Toque na estrela de um acorde para salvar aqui.' : 'Nenhum acorde encontrado.'}</p>`;
  $$('#grade-acordes [data-ouvir]').forEach(b => b.addEventListener('click', () => { Som.init(); Som.golpe(b.dataset.ouvir, Som.agora + 0.02, 'D', 0.35); }));
  $$('#grade-acordes [data-fav]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.fav;
    S.favs = S.favs.includes(id) ? S.favs.filter(x => x !== id) : [...S.favs, id];
    Store.salvar(); desenharGradeAcordes();
  }));
}

/* ----- Músicas: busca, catálogo e repertório ----- */
const CORES_RITMO = { sambarock: '#B5452B', bossa: '#2D6A8C', samba: '#A0611B', pagode: '#7A3E9D', baiao: '#9C7A12', pop: '#3F6E3A', dedilhado: '#4B5D8C' };
const VELOCIDADES = [['lento', 0.6, 'Lento'], ['medio', 0.8, 'Médio'], ['rapido', 1, 'Rápido']];
let buscaControle = null, iaTemporaria = null;

// Músicas antigas ({acordes, cpa}) viram o formato novo ({secoes})
function migrarMusicas() {
  S.musicas = (S.musicas || []).map(m => {
    if (m.secoes) return m;
    const p = patternById(m.padrao);
    const tempos = (m.cpa || 1) * (p.beats || 4);
    const acs = String(m.acordes || '').replace(/[|,;]/g, ' ').split(/\s+/).filter(Boolean);
    return { ...m, capo: 0, secoes: [{ nome: 'Música', seq: acs.map(a => `${a}:${tempos}`).join(' '), repetir: 1 }] };
  });
  S.recordesMusica = S.recordesMusica || {};
}
const todasMusicas = () => [...CATALOGO.map(m => ({ ...m, origem: 'catalogo' })), ...S.musicas];
const acharMusica = id => todasMusicas().find(m => m.id === id) || (iaTemporaria && iaTemporaria.id === id ? iaTemporaria : null);

function capaHTML(m, mini = false) {
  const sigla = m.titulo.split(/\s+/).filter(w => w.length > 2 || /^[A-ZÀ-Ú]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || m.titulo[0];
  return `<div class="capa ${mini ? 'mini' : ''}" style="--cor-capa:${CORES_RITMO[m.padrao] || '#3F6E3A'}" aria-hidden="true"><b>${esc(sigla)}</b>${mini ? '' : `<span>${esc(patternById(m.padrao).genero)}</span>`}</div>`;
}
function cardMusica(m) {
  const acs = acordesUnicos(m), rec = S.recordesMusica?.[m.id];
  const melhor = rec ? Math.max(...Object.values(rec)) : null;
  return `<article class="musica-card" data-id="${esc(m.id)}">
    ${capaHTML(m)}
    <div class="mc-corpo">
      <div class="mc-topo"><h3>${esc(m.titulo)}</h3><span class="nivel-tag ${dificuldade(m).toLowerCase().replace('é', 'e').replace('í', 'i').replace('á', 'a')}">${dificuldade(m)}</span></div>
      <p class="sub">${esc(m.artista || 'Artista não informado')}${m.capo ? ` · Capo ${m.capo}ª` : ''} · ~${m.bpm} BPM${m.origem === 'ia' ? ' · achada pela IA' : ''}</p>
      ${m.youtube || S.youtube?.[m.id]?.videoId ? '<span class="selo-yt">▶ Gravação original</span>' : ''}
      <div class="mc-acordes">${acs.slice(0, 7).map(a => `<span class="chip-acorde mono">${esc(a)}</span>`).join('')}${acs.length > 7 ? `<span class="sub">+${acs.length - 7}</span>` : ''}</div>
      <div class="mc-previa" hidden><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><b class="mono mc-agora"></b><span class="sub mc-secao"></span></div>
      <div class="mc-acoes">
        <button class="btn" data-previa="${esc(m.id)}">▶ Prévia</button>
        <button class="btn primario" data-abrir="${esc(m.id)}">Jogar</button>
        ${melhor !== null ? `<span class="mono sub">Recorde ${melhor}%</span>` : ''}
      </div>
    </div>
  </article>`;
}
function ligarCards(raiz) {
  $$('[data-previa]', raiz).forEach(b => b.addEventListener('click', () => alternarPrevia(b.dataset.previa, b)));
  $$('[data-abrir]', raiz).forEach(b => b.addEventListener('click', () => { Previa.parar(); abrirMusica(b.dataset.abrir); }));
}
function alternarPrevia(id, botao) {
  const card = botao.closest('.musica-card');
  if (Previa.tocando && Previa.tocando.musica.id === id) { Previa.parar(); return limparPrevias(); }
  limparPrevias();
  const m = acharMusica(id);
  botao.textContent = '■ Parar';
  card.classList.add('tocando');
  const box = $('.mc-previa', card); box.hidden = false;
  const opcoes = {
    segundos: 30,
    aoAcorde: tr => { $('.mc-agora', card).textContent = tr.acorde; $('.mc-secao', card).textContent = tr.secao; },
    aoFim: limparPrevias
  };
  // com gravação importada e sincronizada, a prévia é a música de verdade
  previaComGravacao(m, opcoes).then(usou => { if (!usou && card.classList.contains('tocando')) Previa.tocar(m, opcoes); });
}
function limparPrevias() {
  $$('.musica-card.tocando').forEach(c => { c.classList.remove('tocando'); $('.mc-previa', c).hidden = true; $('[data-previa]', c).textContent = '▶ Prévia'; });
}

function renderMusicas() {
  const v = $('#view-musicas');
  const jorge = CATALOGO.filter(m => m.artista === 'Jorge Ben Jor');
  v.innerHTML = `
    <section class="busca-bloco">
      <h2>Que música você quer tocar?</h2>
      <form class="busca-linha" id="busca-form">
        <input id="busca-termo" type="search" placeholder="Nome da música ou artista" autocomplete="off" aria-label="Buscar música">
        <button class="btn primario" type="submit">Buscar</button>
      </form>
      <div id="busca-res"></div>
    </section>
    <section class="prateleira">
      <div class="bloco-topo"><h2>Jorge Ben Jor</h2><span class="sub">${jorge.length} músicas · arranjos fáceis</span></div>
      <div class="grade-musicas">${jorge.map(cardMusica).join('')}</div>
    </section>
    <section class="prateleira">
      <div class="bloco-topo"><h2>Meu repertório</h2><div class="linha-ctrl"><button class="btn mini" id="colar-cifra">Colar cifra</button><button class="btn mini" id="nova-musica">Adicionar à mão</button></div></div>
      ${S.musicas.length ? `<div class="grade-musicas">${S.musicas.map(cardMusica).join('')}</div>`
        : `<div class="vazio"><p><b>Seu repertório está vazio.</b> Busque uma música acima: se ela não estiver no app, a IA pesquisa a cifra e monta o jogo.</p></div>`}
    </section>`;
  ligarCards(v);
  $('#busca-form').addEventListener('submit', e => { e.preventDefault(); buscar($('#busca-termo').value); });
  $('#colar-cifra').addEventListener('click', () => abrirColarCifra());
  $('#nova-musica').addEventListener('click', () => abrirFormMusica());
}

function buscar(termo) {
  termo = termo.trim();
  const res = $('#busca-res');
  if (!termo) { res.innerHTML = ''; return; }
  const locais = Busca.local(termo);
  res.innerHTML = `
    ${locais.length ? `<p class="sub">No app:</p><div class="grade-musicas">${locais.map(cardMusica).join('')}</div>` : `<p class="sub">"${esc(termo)}" não está no app ainda.</p>`}
    <div class="ia-box" id="ia-box">
      <div><b>Pesquisar com IA</b><p class="sub">A IA procura a cifra de "${esc(termo)}" e monta um jogo com ela.</p></div>
      <button class="btn primario" id="ia-ir">Pesquisar "${esc(termo)}"</button>
    </div>`;
  ligarCards(res);
  $('#ia-ir').addEventListener('click', () => pesquisarIA(termo));
}

async function pesquisarIA(termo) {
  const box = $('#ia-box');
  const modo = await Busca.modoIA();
  if (!modo) {
    box.innerHTML = `<div><b>A busca com IA precisa de uma chave da API do Claude.</b>
      <p class="sub">Configure em <b>Ferramentas > Busca com IA</b> (pago por uso, poucos centavos por busca). Sem chave, use <b>Colar cifra</b>: copie a cifra de um site e o app separa os acordes.</p></div>
      <div class="linha-ctrl"><button class="btn" id="ia-config">Configurar chave</button><button class="btn primario" id="ia-colar">Colar cifra</button></div>`;
    $('#ia-config').addEventListener('click', () => irPara('ferramentas'));
    $('#ia-colar').addEventListener('click', () => abrirColarCifra(termo));
    return;
  }
  buscaControle?.abort();
  buscaControle = new AbortController();
  box.innerHTML = `<div class="ia-status"><span class="spinner" aria-hidden="true"></span><span id="ia-msg">Começando…</span></div><button class="btn" id="ia-cancelar">Cancelar</button>`;
  $('#ia-cancelar').addEventListener('click', () => buscaControle.abort());
  try {
    const m = await Busca.pesquisar(termo, { aoStatus: t => { const el = $('#ia-msg'); if (el) el.textContent = t; }, sinal: buscaControle.signal });
    iaTemporaria = m;
    box.outerHTML = `<div class="ia-resultado">
      <p class="sub">${modo === 'claude' ? 'Resposta do Claude (sem pesquisa na web): confira com a gravação.' : 'Encontrado pela IA pesquisando na internet. Arranjo simplificado: confira com a gravação.'}</p>
      <div class="grade-musicas">${cardMusica(m)}</div>
      ${m.nota ? `<p class="sub">${esc(m.nota)}</p>` : ''}
      ${m.fontes?.length ? `<p class="fontes">Fontes: ${m.fontes.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname.replace('www.', ''))}</a>`).join(' · ')}</p>` : ''}
      <button class="btn primario" id="ia-salvar">Salvar no meu repertório</button>
    </div>`;
    ligarCards($('#busca-res'));
    $('#ia-salvar').addEventListener('click', () => { S.musicas.push(m); iaTemporaria = null; Store.salvar(); toast('Música salva no repertório'); renderMusicas(); });
  } catch (e) {
    const b = $('#ia-box');
    if (b) b.innerHTML = `<div><b>Não deu certo.</b><p class="sub">${esc(e.message)}</p></div><div class="linha-ctrl"><button class="btn" id="ia-tentar">Tentar de novo</button><button class="btn" id="ia-colar">Colar cifra</button></div>`;
    $('#ia-tentar')?.addEventListener('click', () => pesquisarIA(termo));
    $('#ia-colar')?.addEventListener('click', () => abrirColarCifra(termo));
  }
}

/* ----- Ferramentas: metrônomo e afinador ----- */
let metro = null;
function renderFerramentas() {
  const v = $('#view-ferramentas');
  v.innerHTML = `
    <section class="bloco ferramenta">
      <div class="bloco-topo"><h2>Som do violão</h2><button class="btn mini" id="som-teste">▶ Ouvir um Dó</button></div>
      <div class="segmentado duas" role="radiogroup" aria-label="Som do violão">
        <button type="button" role="radio" aria-checked="${S.cfg.somReal !== false}" data-som="real"><b>Gravado</b><small>violão de náilon real</small></button>
        <button type="button" role="radio" aria-checked="${S.cfg.somReal === false}" data-som="sint"><b>Sintetizado</b><small>gerado por código</small></button>
      </div>
      <p class="sub" id="som-status">${Som.amostras.size ? `${Som.amostras.size} notas gravadas carregadas.` : 'As notas gravadas carregam no primeiro som que você tocar.'} Gravações do soundfont FluidR3 (licença CC BY 3.0).</p>
    </section>

    <section class="bloco ferramenta">
      <h2>Metrônomo</h2>
      <div class="metro">
        <div class="bpm-grande"><button class="btn redondo" data-bpm="-5" aria-label="Diminuir 5">−</button><output id="bpm-out" class="mono">${S.cfg.bpm}</output><button class="btn redondo" data-bpm="5" aria-label="Aumentar 5">+</button></div>
        <span class="sub center">BPM · batidas por minuto</span>
        <input type="range" id="bpm-range" min="40" max="200" value="${S.cfg.bpm}" aria-label="BPM">
        <div class="linha-ctrl">
          <label>Compasso <select id="compasso"><option value="2">2/4 (samba, baião)</option><option value="3">3/4 (valsa)</option><option value="4" selected>4/4 (pop, MPB)</option></select></label>
          <button class="btn" id="tap">Bater tempo</button>
        </div>
        <div class="luzes" id="luzes"></div>
        <button class="btn primario largo" id="metro-play">${metro ? 'Parar' : 'Começar'}</button>
      </div>
    </section>

    <section class="bloco ferramenta">
      <div class="bloco-topo"><h2>Afinador</h2><button class="btn primario" id="af-mic">${afinador.ligado ? 'Parar de ouvir' : 'Ouvir pelo microfone'}</button></div>
      <div class="af-display" id="af-display">
        <div class="af-nota"><b id="af-nome" class="mono">—</b><span id="af-alvo" class="sub">Ligue o microfone e toque uma corda solta</span></div>
        <div class="agulha-box"><div class="zona-ok"></div><div class="escala"><span>−50</span><span>0</span><span>+50</span></div><div class="agulha" id="agulha"></div></div>
        <p class="leitura"><b id="af-dica">Aguardando som…</b> <span id="af-hz" class="mono sub"></span></p>
      </div>
      <p class="sub">Escolha uma corda para afinar só ela, ou deixe em <b>Auto</b> para o app descobrir qual você tocou. Tocar o botão também toca o som de referência.</p>
      <div class="cordas">
        <button class="corda-btn ${afinador.alvo === null ? 'ativa' : ''}" data-corda="auto"><b>Auto</b><small>qualquer</small></button>
        ${['E', 'A', 'D', 'G', 'B', 'E'].map((n, i) => `<button class="corda-btn ${afinador.alvo === i ? 'ativa' : ''} ${afinador.ok[i] ? 'afinada' : ''}" data-corda="${i}"><b>${n}</b><small>${6 - i}ª</small><i class="ok-dot" aria-hidden="true"></i></button>`).join('')}
      </div>
      <label class="check"><input type="checkbox" id="repetir"> Repetir o som de referência</label>
      <p class="sub" id="af-msg"></p>
    </section>

    <section class="bloco ferramenta">
      <div class="bloco-topo"><h2>Qual acorde é este?</h2><span class="pill">IA</span></div>
      <p class="sub" id="qa-info">${IA.modelo ? `Uma rede neural treinada em Python escuta e diz o que você tocou. No teste, ela acertou ${Math.round(IA.modelo.metricas.acerto_ia * 100)}% entre ${IA.modelo.classes.length - 1} acordes (o método antigo acertava ${Math.round(IA.modelo.metricas.acerto_metodo_antigo * 100)}%).` : 'O modelo de IA não carregou. Confira se o arquivo modelo-acordes.json está na pasta do app.'}</p>
      <button class="btn primario" id="qa-btn" ${IA.modelo ? '' : 'disabled'}>${qualAcorde.ligado ? 'Parar' : 'Começar a ouvir'}</button>
      <div class="qa-res" id="qa-res"><p class="sub">Toque um acorde e deixe soar.</p></div>
    </section>

    <section class="bloco ferramenta">
      <div class="bloco-topo"><h2>Busca de músicas com IA</h2><span class="pill">IA</span></div>
      <p class="sub">Na aba Músicas, quando a música não está no app, a IA pesquisa a cifra na internet e monta o jogo. Ela usa a API do Claude, que é paga por uso (cada busca custa alguns centavos de dólar). Crie uma chave em <a href="https://platform.claude.com/" target="_blank" rel="noopener">platform.claude.com</a>. A chave fica guardada só neste aparelho.</p>
      <label class="faixa">Chave da API<input type="password" id="api-chave" placeholder="sk-ant-…" autocomplete="off" value=""></label>
      <div class="linha-ctrl"><button class="btn primario" id="api-salvar">Salvar chave</button><button class="btn" id="api-apagar">Apagar chave</button></div>
      <p class="sub" id="api-status">${Busca.chave() ? 'Chave salva neste aparelho.' : window.claude ? 'Dentro do Claude a busca funciona sem chave (usando sua conta).' : 'Sem chave: use "Colar cifra" na aba Músicas.'}</p>
    </section>

    <section class="bloco ferramenta">
      <h2>Ensinar a IA com o seu violão</h2>
      <p class="sub">A IA aprendeu com um violão sintético. Gravando o <b>seu</b> violão, ela fica mais precisa para você. Escolha o acorde, toque 5 batidas e repita com outros acordes. Depois exporte e rode o treino em Python (veja o README).</p>
      <div class="linha-ctrl">
        <label>Acorde <select id="en-acorde">${CHORDS.map(c => `<option>${c.id}</option>`).join('')}</select></label>
        <button class="btn primario" id="en-gravar">Gravar 5 batidas</button>
      </div>
      <p class="leitura" id="en-status"></p>
      <div class="chips" id="en-contagem"></div>
      <div class="linha-ctrl">
        <button class="btn" id="en-exportar">Exportar amostras (.json)</button>
        <button class="btn" id="en-copiar">Copiar amostras</button>
        <button class="btn perigo" id="en-apagar">Apagar amostras</button>
      </div>
    </section>

    <section class="bloco ferramenta">
      <h2>Microfone</h2>
      <p class="sub">Ajuste uma vez. Vale para o afinador e para os jogos. Use <b>fone de ouvido</b> nos jogos: sem ele o microfone escuta o clique do metrônomo.</p>
      <div class="linha-ctrl"><button class="btn" id="mc-ligar">${Detector.ligado ? 'Desligar microfone' : 'Ligar microfone'}</button><span class="flash" id="mc-flash">Batida detectada</span></div>
      <div class="medidor" aria-label="Volume do microfone"><i id="mc-nivel"></i></div>
      <label class="faixa">Sensibilidade <span class="mono" id="mc-sens-v">${S.cfg.sens}</span>
        <input type="range" id="mc-sens" min="1" max="10" value="${S.cfg.sens}">
        <small class="sub">Se o app perde batidas, aumente. Se marca batidas que você não fez, diminua.</small></label>
      <div class="calibra">
        <div><b>Atraso do microfone</b><br><span class="sub" id="mc-lat">${S.cfg.latencia === null ? 'Ainda não calibrado' : `Calibrado: ${Math.round(S.cfg.latencia * 1000)} ms`}</span></div>
        <button class="btn" id="mc-calibrar">Calibrar</button>
      </div>
      <div class="luzes" id="mc-luzes" hidden></div>
      <p class="sub" id="mc-msg"></p>
    </section>
    </section>`;
  // Som do violão
  $$('[data-som]', v).forEach(b => b.addEventListener('click', () => {
    S.cfg.somReal = b.dataset.som === 'real'; Store.salvar();
    $$('[data-som]', v).forEach(x => x.setAttribute('aria-checked', x === b));
  }));
  $('#som-teste').addEventListener('click', async () => {
    Som.init(); await Som.carregando;
    $('#som-status').textContent = `${Som.amostras.size} notas gravadas carregadas. Gravações do soundfont FluidR3 (licença CC BY 3.0).`;
    Som.golpe('C', Som.agora + 0.05, 'D', 0.3);
  });
  // Metrônomo
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
  const desenhaLuzes = () => { $('#luzes').innerHTML = Array.from({ length: +$('#compasso').value }, () => '<i></i>').join(''); };
  $('#compasso').addEventListener('change', () => { desenhaLuzes(); if (metro) { pararMetronomo(); iniciarMetronomo(); } });
  desenhaLuzes();
  $('#metro-play').addEventListener('click', () => metro ? pararMetronomo() : iniciarMetronomo());
  // Afinador
  $$('[data-corda]', v).forEach(b => b.addEventListener('click', () => {
    const c = b.dataset.corda;
    afinador.alvo = c === 'auto' ? null : +c;
    $$('[data-corda]', v).forEach(x => x.classList.toggle('ativa', x === b));
    if (afinador.alvo !== null) { Som.init(); Som.nota(CORDAS_SOLTAS[afinador.alvo], Som.agora + 0.02, 0.5); }
  }));
  $('#repetir').addEventListener('change', e => {
    clearInterval(afinador.loopRef);
    if (e.target.checked) afinador.loopRef = setInterval(() => {
      if (afinador.alvo !== null && viewAtual === 'ferramentas') Som.nota(CORDAS_SOLTAS[afinador.alvo], Som.agora + 0.02, 0.5);
    }, 1800);
  });
  $('#af-mic').addEventListener('click', () => afinador.ligado ? afinador.parar() : afinador.iniciar());
  if (afinador.ligado) afinador.loop();
  // Microfone: ligar, medidor, sensibilidade, calibração
  const ligarMic = async () => {
    try { await Detector.ligar(); $('#mc-msg').textContent = ''; } catch (e) { $('#mc-msg').textContent = msgSemMicrofone(e); return false; }
    $('#mc-ligar').textContent = 'Desligar microfone';
    conectarMedidor();
    return true;
  };
  const conectarMedidor = () => {
    const nivel = $('#mc-nivel'), flash = $('#mc-flash');
    const offN = Detector.aoNivel(e => { if (!nivel.isConnected) return offN(); nivel.style.width = Math.min(100, Math.sqrt(e) * 350) + '%'; });
    const offA = Detector.aoAtacar(() => { if (!flash.isConnected) return offA(); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); });
  };
  if (Detector.ligado) conectarMedidor();
  $('#mc-ligar').addEventListener('click', async () => {
    if (Detector.ligado) { afinador.parar(); Detector.desligar(); $('#mc-ligar').textContent = 'Ligar microfone'; $('#mc-nivel').style.width = '0'; }
    else await ligarMic();
  });
  $('#mc-sens').addEventListener('input', e => { S.cfg.sens = +e.target.value; $('#mc-sens-v').textContent = S.cfg.sens; Detector.aplicarSensibilidade(S.cfg.sens); Store.salvar(); });
  $('#mc-calibrar').addEventListener('click', async () => { if (Detector.ligado || await ligarMic()) calibrarAtraso(); });
  configurarIA();
  organizarFerramentas(v);
  $('#api-salvar').addEventListener('click', () => {
    const k = $('#api-chave').value.trim();
    if (!/^sk-ant-/.test(k)) { $('#api-status').textContent = 'Essa não parece uma chave da API do Claude (começa com sk-ant-).'; return; }
    Busca.salvarChave(k); $('#api-chave').value = ''; $('#api-status').textContent = 'Chave salva neste aparelho.';
  });
  $('#api-apagar').addEventListener('click', () => { Busca.salvarChave(''); $('#api-status').textContent = 'Chave apagada.'; });
}

/* ===== IA na tela Ferramentas ===== */
// "Qual acorde é este?": a cada batida, escuta 4 vezes (~0,25 s) e tira a média das probabilidades
const qualAcorde = {
  ligado: false, cancelar: null,
  async iniciar() {
    try { await Detector.ligar(); } catch (e) { $('#qa-res').innerHTML = `<p class="sub">${esc(msgSemMicrofone(e))}</p>`; return; }
    this.ligado = true; ativos.add('ia');
    $('#qa-btn').textContent = 'Parar';
    $('#qa-res').innerHTML = '<p class="sub">Ouvindo… toque um acorde.</p>';
    this.cancelar = Detector.aoAtacar(() => {
      const leituras = [];
      [120, 180, 240, 300].forEach(ms => setTimeout(() => {
        const r = Detector.ouvirIA();
        if (r && !r.silencio) leituras.push(r.probs);
        if (ms === 300) this.mostrar(leituras);
      }, ms));
    });
  },
  parar() {
    this.cancelar?.(); this.cancelar = null; this.ligado = false; ativos.delete('ia');
    const b = $('#qa-btn'); if (b) b.textContent = 'Começar a ouvir';
  },
  mostrar(leituras) {
    const area = $('#qa-res');
    if (!area) return this.parar();
    if (!leituras.length) { area.innerHTML = '<p class="sub">Som muito baixo. Toque mais forte ou aproxime o celular.</p>'; return; }
    const media = {};
    for (const p of leituras) for (const [c, v] of Object.entries(p)) media[c] = (media[c] || 0) + v / leituras.length;
    const top = Object.entries(media).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const [venc, pv] = top[0];
    const titulo = venc === 'nenhum' ? 'Não reconheci um acorde' : pv < 0.5 ? `Talvez ${venc}?` : venc;
    area.innerHTML = `
      <div class="qa-topo">${venc !== 'nenhum' ? acordeSVG(venc, 'sm') : ''}
        <div><b class="qa-nome mono">${esc(titulo)}</b><span class="sub">${venc === 'nenhum' ? 'Pode ser corda abafada, ruído ou nota solta.' : nomeAcorde(venc) + (pv < 0.5 ? ' · a IA ficou em dúvida' : '')}</span></div></div>
      <ul class="qa-lista">${top.map(([c, v]) => `<li><span class="mono">${c === 'nenhum' ? 'nenhum' : esc(c)}</span><span class="trilho"><i style="width:${Math.round(v * 100)}%"></i></span><span class="mono">${Math.round(v * 100)}%</span></li>`).join('')}</ul>`;
  }
};

// "Ensinar a IA": grava as 24 características de 2 momentos de cada batida
function configurarIA() {
  $('#qa-btn')?.addEventListener('click', () => qualAcorde.ligado ? qualAcorde.parar() : qualAcorde.iniciar());
  const contagem = () => {
    const por = {};
    S.amostras.forEach(a => { por[a.acorde] = (por[a.acorde] || 0) + 1; });
    const el = $('#en-contagem');
    el.innerHTML = S.amostras.length
      ? Object.entries(por).map(([c, n]) => `<span class="chip">${esc(c)} · ${n}</span>`).join('') + `<span class="sub">${S.amostras.length} amostras no total</span>`
      : '<span class="sub">Nenhuma amostra gravada ainda.</span>';
  };
  contagem();
  let gravando = null;
  $('#en-gravar').addEventListener('click', async () => {
    if (gravando) return;
    try { await Detector.ligar(); } catch (e) { $('#en-status').textContent = msgSemMicrofone(e); return; }
    const acorde = $('#en-acorde').value;
    let batidas = 0;
    $('#en-status').innerHTML = `Toque <b>${esc(acorde)}</b>: batida 0 de 5`;
    $('#en-gravar').disabled = true;
    gravando = Detector.aoAtacar(() => {
      if (batidas >= 5) return;
      batidas++;
      $('#en-status').innerHTML = `Toque <b>${esc(acorde)}</b>: batida ${batidas} de 5`;
      [150, 320].forEach(ms => setTimeout(() => {
        const r = Detector.ouvirIA();
        if (r && !r.silencio) S.amostras.push({ acorde, x: r.x.map(v => Math.round(v * 1e4) / 1e4) });
        if (batidas === 5 && ms === 320) {
          gravando?.(); gravando = null;
          $('#en-gravar').disabled = false;
          $('#en-status').textContent = `Pronto! Amostras de ${acorde} salvas. Escolha outro acorde.`;
          Store.salvar(); contagem();
        }
      }, ms));
    });
  });
  const json = () => JSON.stringify({ versao: 1, app: 'toca-ai', exportado_em: new Date().toISOString(), amostras: S.amostras });
  $('#en-exportar').addEventListener('click', () => {
    if (!S.amostras.length) return toast('Grave algumas amostras primeiro');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
    a.download = 'amostras-toca-ai.json';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Arquivo amostras-toca-ai.json baixado');
  });
  $('#en-copiar').addEventListener('click', async () => {
    if (!S.amostras.length) return toast('Grave algumas amostras primeiro');
    try { await navigator.clipboard.writeText(json()); toast('Copiado! Cole num arquivo amostras-toca-ai.json'); }
    catch (e) { toast('Não foi possível copiar aqui. Use Exportar.'); }
  });
  const apagar = $('#en-apagar');
  apagar.addEventListener('click', () => {
    if (!apagar.dataset.confirmar) { apagar.dataset.confirmar = '1'; apagar.textContent = 'Toque de novo para apagar'; return; }
    S.amostras = []; Store.salvar(); contagem();
    delete apagar.dataset.confirmar; apagar.textContent = 'Apagar amostras';
  });
}

// Afinador e metrônomo (uso diário) primeiro; IA, chave e microfone num grupo recolhível
function organizarFerramentas(v) {
  const secs = [...v.querySelectorAll(':scope > section')];
  const por = t => secs.find(s => (s.querySelector('h2')?.textContent || '').startsWith(t));
  const av = document.createElement('details');
  av.className = 'avancado';
  av.open = Detector.ligado || !!S.cfg.avancadoAberto;
  av.innerHTML = '<summary><span><b>IA e microfone</b><small>Reconhecer acordes, busca com IA, calibrar microfone</small></span></summary>';
  av.addEventListener('toggle', () => { S.cfg.avancadoAberto = av.open; });
  ['Microfone', 'Qual acorde', 'Busca', 'Ensinar'].forEach(t => { const s = por(t); if (s) av.appendChild(s); });
  ['Afinador', 'Metrônomo', 'Som do violão'].forEach(t => { const s = por(t); if (s) v.appendChild(s); });
  v.appendChild(av);
}

/* Afinador: lê a altura ~14 vezes por segundo e usa a mediana
   das últimas leituras para a agulha não ficar tremendo. */
const afinador = {
  ligado: false, alvo: null, ok: {}, leituras: [], firme: { corda: null, desde: 0 }, timer: null, loopRef: null,
  async iniciar() {
    try { await Detector.ligar(); } catch (e) { $('#af-msg').textContent = msgSemMicrofone(e); return; }
    this.ligado = true; ativos.add('afinador');
    $('#af-mic').textContent = 'Parar de ouvir'; $('#af-msg').textContent = '';
    const b = $('#mc-ligar'); if (b) b.textContent = 'Desligar microfone';
    this.loop();
  },
  parar() {
    this.ligado = false; ativos.delete('afinador'); clearTimeout(this.timer);
    const b = $('#af-mic'); if (b) b.textContent = 'Ouvir pelo microfone';
  },
  loop() {
    clearTimeout(this.timer);
    if (!this.ligado || viewAtual !== 'ferramentas' || !$('#af-nome')) return;
    const r = Detector.altura();
    if (r && r.freq > 60 && r.freq < 700) {
      this.leituras.push(r.freq); if (this.leituras.length > 5) this.leituras.shift();
      this.mostrar(mediana(this.leituras));
    } else if (!r) {
      this.leituras = [];
      $('#af-dica').textContent = 'Aguardando som…';
    }
    this.timer = setTimeout(() => this.loop(), 70);
  },
  mostrar(f) {
    // qual corda estamos afinando?
    let corda = this.alvo;
    if (corda === null) {
      corda = 0;
      CORDAS_SOLTAS.forEach((c, i) => { if (Math.abs(Math.log2(f / c)) < Math.abs(Math.log2(f / CORDAS_SOLTAS[corda]))) corda = i; });
    }
    const cents = Math.round(1200 * Math.log2(f / CORDAS_SOLTAS[corda]));
    const n = infoNota(f);
    $('#af-nome').textContent = n.nome + n.oitava;
    $('#af-alvo').textContent = `${n.nomePt} · afinando a ${6 - corda}ª corda (${['E', 'A', 'D', 'G', 'B', 'E'][corda]})`;
    $('#af-hz').textContent = f.toFixed(1) + ' Hz';
    const ag = $('#agulha');
    ag.style.transform = `translateX(-50%) rotate(${Math.max(-50, Math.min(50, cents)) * 0.9}deg)`;
    const certo = Math.abs(cents) <= 5;
    ag.classList.toggle('certo', certo);
    $('#af-dica').textContent = certo ? 'Afinada!'
      : Math.abs(cents) > 100 ? (cents < 0 ? 'Muito grave: aperte bastante a tarraxa' : 'Muito aguda: afrouxe bastante a tarraxa')
      : cents < 0 ? `${cents} cents · aperte um pouco (som sobe)` : `+${cents} cents · afrouxe um pouco (som desce)`;
    // corda segura afinada por 0,8 s = marca como afinada
    const agora = performance.now();
    if (certo) {
      if (this.firme.corda !== corda) this.firme = { corda, desde: agora };
      else if (agora - this.firme.desde > 800 && !this.ok[corda]) {
        this.ok[corda] = true;
        $(`[data-corda="${corda}"]`)?.classList.add('afinada');
        if (Object.keys(this.ok).length === 6) {
          toast('Violão todo afinado!');
          if (!hoje().afinou) { hoje().afinou = true; ganharXP(10, 'violão afinado'); }
        }
      }
    } else this.firme = { corda: null, desde: 0 };
  }
};

/* Calibração: o app toca 4 cliques de contagem e depois 8 cliques.
   Você bate nas cordas junto com os 8. A diferença média entre o clique
   e a sua batida detectada é o atraso do seu microfone + fone. */
function calibrarAtraso() {
  Som.init(); Som.pararTudo();
  const intervalo = 60 / 80, t0 = Som.agora + 0.4, conta = 4, n = 8;
  const cliques = [], ataques = [];
  const luzes = $('#mc-luzes');
  luzes.hidden = false;
  luzes.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
  $('#mc-msg').textContent = 'Escute 4 cliques de contagem. Depois bata nas cordas junto com os próximos 8.';
  for (let i = 0; i < conta + n; i++) {
    const t = t0 + i * intervalo;
    Som.click(t, i < conta, 0.6);
    if (i >= conta) {
      cliques.push(t);
      quandoTocar(t, () => $$('#mc-luzes i').forEach((l, k) => l.classList.toggle('on', k === i - conta)));
    }
  }
  const off = Detector.aoAtacar(a => ataques.push(a.t));
  setTimeout(() => {
    off();
    luzes.hidden = true;
    const desvios = [];
    for (const c of cliques) {
      let melhor = null;
      for (const a of ataques) if (Math.abs(a - c) < 0.35 && (melhor === null || Math.abs(a - c) < Math.abs(melhor - c))) melhor = a;
      if (melhor !== null) desvios.push(melhor - c);
    }
    if (desvios.length < 4) {
      $('#mc-msg').textContent = `Só ouvi ${desvios.length} de 8 batidas. Toque mais forte, aproxime o violão ou aumente a sensibilidade e tente de novo.`;
      return;
    }
    S.cfg.latencia = Math.max(-0.05, Math.min(0.4, mediana(desvios)));
    Store.salvar();
    $('#mc-lat').textContent = `Calibrado: ${Math.round(S.cfg.latencia * 1000)} ms`;
    $('#mc-msg').textContent = `Pronto! Ouvi ${desvios.length} de 8 batidas. O app vai descontar ${Math.round(S.cfg.latencia * 1000)} ms nos jogos.`;
  }, (t0 + (conta + n) * intervalo - Som.agora + 0.6) * 1000);
}
function iniciarMetronomo() {
  const beats = +$('#compasso').value;
  metro = new Relogio({
    bpm: S.cfg.bpm, sub: 1,
    aoPasso: (p, t) => {
      Som.click(t, p % beats === 0);
      quandoTocar(t, () => $$('#luzes i').forEach((l, i) => l.classList.toggle('on', i === p % beats)));
    }
  });
  metro.iniciar();
  ativos.add('metro');
  $('#metro-play').textContent = 'Parar';
}
function pararMetronomo() {
  if (!metro) return;
  metro.parar(); metro = null; ativos.delete('metro'); Store.salvar();
  const b = $('#metro-play'); if (b) b.textContent = 'Começar';
  $$('#luzes i').forEach(l => l.classList.remove('on'));
}

const RENDER = { hoje: renderHoje, trilha: renderTrilha, jogos: renderJogos, acordes: renderAcordes, musicas: renderMusicas, ferramentas: renderFerramentas };
function renderTudo() { renderHeader(); RENDER[viewAtual](); }

/* ===== 8. Janelas (lição, jogos, player) ===== */
let limparJanela = null;
function abrirJanela(titulo, html, aoFechar) {
  fecharJanela();
  $('#janela-titulo').textContent = titulo;
  $('#janela-corpo').innerHTML = html;
  $('#janela').hidden = false;
  document.body.classList.add('travado');
  limparJanela = aoFechar || null;
  $('#janela-corpo').scrollTop = 0;
  $('#janela-fechar').focus();
}
function fecharJanela() {
  if (limparJanela) { try { limparJanela(); } catch (e) {} limparJanela = null; }
  Som.pararTudo();
  $('#janela').hidden = true;
  document.body.classList.remove('travado');
}

function abrirLicao(id) {
  const l = lessonById(id), p = l.padrao ? patternById(l.padrao) : null, feito = S.licoes[id];
  const botaoPratica = {
    trocas: `Treinar trocas ${l.pratica.a} ⇄ ${l.pratica.b}`, batida: 'Jogar a Batida', quiz: 'Fazer o quiz de acordes',
    afinador: 'Abrir o afinador', metronomo: 'Abrir o metrônomo', musicas: 'Ir para Músicas'
  }[l.pratica.tipo];
  abrirJanela(l.titulo, `
    <article class="licao">
      <span class="eyebrow">${esc(MODULES.find(m => m.id === l.mod).nome)} · lição ${LESSONS.indexOf(l) + 1}</span>
      ${l.corpo}
      ${l.acordes ? `<div class="mini-acordes">${l.acordes.map(a => `<figure>${acordeSVG(a, 'sm')}<figcaption><b>${a}</b><button class="btn mini" data-ouvir="${a}">Ouvir</button></figcaption></figure>`).join('')}</div>` : ''}
      ${p ? `<div class="box"><b>Batida: ${esc(p.nome)}</b>${batidaHTML(p)}<p>${esc(p.dica)}</p><button class="btn mini" id="ouvir-batida">Ouvir a batida</button></div>` : ''}
      <div class="acoes-licao">
        <button class="btn" id="praticar">${botaoPratica}</button>
        <button class="btn primario" id="concluir" ${feito ? 'disabled' : ''}>${feito ? 'Lição concluída' : `Concluir lição · +${l.xp} XP`}</button>
      </div>
    </article>`);
  $$('#janela [data-ouvir]').forEach(b => b.addEventListener('click', () => { Som.init(); Som.golpe(b.dataset.ouvir, Som.agora + 0.02, 'D', 0.35); }));
  $('#ouvir-batida')?.addEventListener('click', () => ouvirBatida(p, 2, l.acordes?.length ? l.acordes : p.demo));
  $('#praticar').addEventListener('click', () => {
    const pr = l.pratica;
    if (pr.tipo === 'trocas') JOGOS.trocas(pr.a, pr.b);
    else if (pr.tipo === 'batida') JOGOS.batida(pr.padrao);
    else if (pr.tipo === 'quiz') JOGOS.quiz();
    else { fecharJanela(); irPara(pr.tipo === 'musicas' ? 'musicas' : 'ferramentas'); }
  });
  $('#concluir').addEventListener('click', () => {
    if (S.licoes[id]) return;
    S.licoes[id] = true;
    registrar('licoes', 1);
    ganharXP(l.xp, 'lição concluída');
    fecharJanela();
    RENDER[viewAtual]();
  });
}

const JOGOS = {
  /* ----- Jogo da Batida -----
     As notas andam da direita para a esquerda. Toque quando
     cruzarem a linha. Quanto mais perto, mais pontos. */
  /* ----- Jogo da Batida: as cordas correm e você toca no tempo ----- */
  batida(padraoInicial = 'samba') {
    abrirJanela('Batida', `
      <div id="bt-config">
        <label>Ritmo <select id="bt-padrao">${PATTERNS.map(p => `<option value="${p.id}" ${p.id === padraoInicial ? 'selected' : ''}>${esc(p.genero)}</option>`).join('')}</select></label>
        <div id="bt-tira"></div>
        ${configJogoHTML()}
        <button class="btn primario largo grande" id="bt-jogar">Jogar</button>
      </div>
      <div id="bt-jogo" hidden></div>`, () => pararJogo?.());
    let pararJogo = null;
    const sel = $('#bt-padrao');
    const tira = () => { const p = patternById(sel.value); $('#bt-tira').innerHTML = `${batidaHTML(p)}<p class="sub">${esc(p.dica)}</p>`; };
    sel.addEventListener('change', tira); tira();
    ligarConfigJogo($('#bt-config'));
    $('#bt-jogar').addEventListener('click', async () => {
      const p = patternById(sel.value);
      const tempos = p.passos.length / p.sub;                 // um ciclo da batida
      const trechos = [];
      p.demo.forEach((a, i) => { for (let r = 0; r < 2; r++) trechos.push({ acorde: a, tempos, inicio: (i * 2 + r) * tempos, secao: p.genero }); });
      $('#bt-config').hidden = true;
      const area = $('#bt-jogo'); area.hidden = false;
      area.innerHTML = `<div class="jogo-topo"><span class="sub">${esc(p.genero)}</span><button class="btn mini" id="bt-parar">■ Parar</button></div><div id="bt-estrada"></div>`;
      $('#janela-corpo').scrollTop = 0;
      const voltar = () => { pararJogo?.(); pararJogo = null; area.hidden = true; $('#bt-config').hidden = false; };
      $('#bt-parar').addEventListener('click', voltar);
      pararJogo = await iniciarEstrada($('#bt-estrada'), {
        trechos, padrao: p, bpm: Math.round(p.bpm * (fatorVelocidade() / 0.8)), candidatos: p.demo,
        aoFim: r => {
          pararJogo?.(); pararJogo = null;
          registrar('batida', r.pct, 'max');
          ganharXP(5 + Math.round(r.pct / 10) + (S.cfg.entrada === 'mic' ? 5 : 0), 'jogo da Batida');
          area.innerHTML = `${resultadoHTML(r)}<div class="acoes-licao"><button class="btn" id="bt-voltar">Voltar</button><button class="btn primario" id="bt-denovo">Jogar de novo</button></div>`;
          $('#bt-voltar').addEventListener('click', voltar);
          $('#bt-denovo').addEventListener('click', () => { voltar(); $('#bt-jogar').click(); });
        }
      });
    });
  },

  /* ----- Trocas de 1 minuto -----
     No modo microfone, depois de cada batida o app escuta ~0,35 s,
     faz uma "votação" entre os dois acordes e conta a troca sozinho. */
  trocas(a = 'Em', b = 'Am') {
    const opts = sel => CHORDS.map(c => `<option ${c.id === sel ? 'selected' : ''}>${c.id}</option>`).join('');
    abrirJanela('Trocas de 1 minuto', `
      <div class="jogo-cfg">
        <label>Acorde 1 <select id="t-a">${opts(a)}</select></label>
        <label>Acorde 2 <select id="t-b">${opts(b)}</select></label>
        <label>Contagem <select id="t-entrada"><option value="tela">Eu toco no botão</option><option value="mic" ${S.cfg.entrada === 'mic' ? 'selected' : ''}>O app ouve o acorde (microfone)</option></select></label>
      </div>
      <div id="t-aviso" class="box pegadinha" hidden></div>
      <div class="dupla" id="t-dupla"></div>
      <div class="ouvindo" id="t-ouvindo" hidden><span class="sub">Ouvi:</span> <b id="t-ouvi" class="mono">—</b><span class="medidor mini"><i id="t-conf"></i></span></div>
      <div class="palco center">
        <div class="relogio-grande mono" id="t-tempo">60</div>
        <div class="sub" id="t-recorde"></div>
        <button class="btn primario largo grande" id="t-btn">Começar</button>
        <p class="sub" id="t-instrucao"></p>
        <div id="t-res"></div>
      </div>`, () => { clearInterval(st.id); clearInterval(st.escuta); ativos.delete('trocas'); document.removeEventListener('keydown', tecla); st.cancelaMic?.(); });
    const st = { rodando: false, n: 0, id: null, modo: 'tela', ultimoAc: null, votacao: null, escuta: null, cancelaMic: null };
    const par = () => `${$('#t-a').value}>${$('#t-b').value}`;
    const desenha = (ouvido = null) => {
      $('#t-dupla').innerHTML = [$('#t-a').value, $('#t-b').value].map((c, i) => {
        const vez = st.modo === 'mic' ? ouvido === c : st.rodando && st.n % 2 === i;
        return `<figure class="${vez ? 'vez' : ''}"><figcaption>${c}</figcaption><div class="braco-box">${bracoSVG(c)}</div><ul class="dedos-lista compacta">${dedosHTML(c)}</ul></figure>`;
      }).join('<span class="seta" aria-hidden="true">⇅</span>');
      $('#t-recorde').textContent = S.recordes[par()] ? `Seu recorde neste par: ${S.recordes[par()]}` : 'Primeira vez com este par';
    };
    $('#t-a').addEventListener('change', () => desenha()); $('#t-b').addEventListener('change', () => desenha()); desenha();

    // Ao detectar uma batida, abre uma "votação" de 0,35 s
    const aoAtaque = () => { if (st.rodando || st.modo === 'mic') st.votacao = { ate: Som.agora + 0.35, votos: {}, leituras: 0 }; };
    const escutar = () => {
      if (!st.votacao) return;
      const r = Detector.reconhecer([$('#t-a').value, $('#t-b').value]);
      st.votacao.leituras++;
      if (r.acorde && r.sim > 0.5 && r.margem > 0.05) st.votacao.votos[r.acorde] = (st.votacao.votos[r.acorde] || 0) + 1;
      $('#t-conf').style.width = Math.max(0, Math.round((r.sim || 0) * 100)) + '%';
      if (Som.agora < st.votacao.ate) return;
      const [venc, votos] = Object.entries(st.votacao.votos).sort((x, y) => y[1] - x[1])[0] || [null, 0];
      st.votacao = null;
      if (!venc || votos < 2) { $('#t-ouvi').textContent = 'não reconheci'; $('#t-ouvi').className = 'mono ruim'; return; }
      $('#t-ouvi').textContent = venc; $('#t-ouvi').className = 'mono bom';
      if (st.rodando && st.ultimoAc && venc !== st.ultimoAc) {
        st.n++; $('#t-btn').textContent = `Trocas: ${st.n}`;
      }
      st.ultimoAc = venc;
      desenha(venc);
    };
    const definirModo = async m => {
      const aviso = $('#t-aviso');
      st.cancelaMic?.(); clearInterval(st.escuta);
      if (m === 'mic') {
        try { await Detector.ligar(); }
        catch (e) { aviso.hidden = false; aviso.textContent = msgSemMicrofone(e); $('#t-entrada').value = 'tela'; return definirModo('tela'); }
        st.modo = 'mic';
        aviso.hidden = false;
        aviso.innerHTML = (IA.modelo ? '<b>Reconhecimento por IA.</b>' : '<b>Experimental.</b>') + ' Bata o acorde inteiro e deixe soar. Se o app não reconhecer, confira se alguma corda está abafada: isso também é um treino! Ambientes barulhentos atrapalham.';
        $('#t-ouvindo').hidden = false;
        $('#t-instrucao').textContent = 'Toque um acorde, depois o outro. O app conta cada troca que ele ouvir com o acorde limpo.';
        st.cancelaMic = Detector.aoAtacar(aoAtaque);
        st.escuta = setInterval(escutar, 50);
      } else {
        st.modo = 'tela';
        aviso.hidden = true; $('#t-ouvindo').hidden = true;
        $('#t-instrucao').innerHTML = 'Cada vez que o acorde soar limpo depois de trocar, toque no botão (ou <span class="mono">espaço</span>).';
      }
      S.cfg.entrada = st.modo; Store.salvar();
      desenha();
    };
    $('#t-entrada').addEventListener('change', e => definirModo(e.target.value));
    definirModo(S.cfg.entrada === 'mic' ? 'mic' : 'tela');

    const acao = () => {
      if (!st.rodando) {
        Som.init(); st.rodando = true; st.n = 0; st.ultimoAc = null; st.fim = Date.now() + 60000; ativos.add('trocas');
        $('#t-btn').textContent = st.modo === 'mic' ? 'Trocas: 0' : 'Troquei! (0)'; $('#t-res').innerHTML = '';
        st.id = setInterval(() => {
          const r = Math.max(0, Math.ceil((st.fim - Date.now()) / 1000));
          $('#t-tempo').textContent = r;
          if (r === 0) fim();
        }, 200);
        desenha();
        return;
      }
      if (st.modo === 'mic') return; // no microfone quem conta é o app
      st.n++; Som.click(Som.agora + 0.01, false, 0.3);
      $('#t-btn').textContent = `Troquei! (${st.n})`;
      desenha();
    };
    const fim = () => {
      clearInterval(st.id); st.rodando = false; ativos.delete('trocas');
      const p = par(), antigo = S.recordes[p] || 0;
      if (st.n > antigo) S.recordes[p] = st.n;
      registrar('trocas', st.n);
      if (st.n) ganharXP(Math.max(3, Math.round(st.n / 2)) + (st.modo === 'mic' ? 5 : 0), 'trocas de acorde');
      $('#t-btn').textContent = 'De novo';
      $('#t-res').innerHTML = `<div class="resultado"><div><span class="mono grande-num">${st.n}</span><small>trocas${st.modo === 'mic' ? ' ouvidas' : ''}</small></div>
        <p>${st.n > antigo && antigo ? 'Novo recorde!' : ''} ${st.n >= 30 ? 'Troca fluida. Hora de usar numa música.' : st.n >= 15 ? 'Está evoluindo. Repita amanhã.' : 'Normal no começo. Mire em 15, depois 30.'}</p></div>`;
      desenha();
    };
    const tecla = e => { if (e.code === 'Space' && !$('#janela').hidden && document.activeElement?.tagName !== 'SELECT') { e.preventDefault(); acao(); } };
    document.addEventListener('keydown', tecla);
    $('#t-btn').addEventListener('click', acao);
  },

  /* ----- Quiz de acordes ----- */
  quiz() {
    const basicos = ['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'A7', 'E7', 'D7', 'G7'];
    const estudados = LESSONS.filter(l => S.licoes[l.id] && l.acordes).flatMap(l => l.acordes);
    const pool = [...new Set([...basicos, ...estudados])];
    const perguntas = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    let i = 0, acertos = 0;
    abrirJanela('Quiz de acordes', `<div id="q"></div>`);
    const mostrar = () => {
      if (i >= perguntas.length) {
        registrar('quiz', acertos);
        ganharXP(acertos * 2 + 2, 'quiz');
        $('#q').innerHTML = `<div class="resultado"><div><span class="mono grande-num">${acertos}/10</span><small>acertos</small></div>
          <p>${acertos >= 8 ? 'Mandou bem!' : 'Volte na aba Acordes e revise os que errou.'}</p></div><button class="btn primario largo" id="q-de-novo">Jogar de novo</button>`;
        $('#q-de-novo').addEventListener('click', () => JOGOS.quiz());
        return;
      }
      const certo = perguntas[i];
      const opcoes = [certo, ...pool.filter(x => x !== certo).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
      $('#q').innerHTML = `<div class="quiz">
        <span class="eyebrow">Pergunta ${i + 1} de 10 · ${acertos} acertos</span>
        <h3>Que acorde é este?</h3>
        <div class="braco-box quiz-braco">${bracoSVG(certo)}</div>
        <div class="opcoes">${opcoes.map(o => `<button class="btn opcao" data-o="${o}">${o}</button>`).join('')}</div>
        <p id="q-exp" class="sub"></p></div>`;
      $$('#q [data-o]').forEach(b => b.addEventListener('click', () => {
        if ($('#q .opcao[disabled]')) return;
        const ok = b.dataset.o === certo;
        if (ok) acertos++;
        $$('#q [data-o]').forEach(x => { x.disabled = true; if (x.dataset.o === certo) x.classList.add('certa'); else if (x === b) x.classList.add('errada'); });
        Som.init(); Som.golpe(certo, Som.agora + 0.02, 'D', 0.3);
        $('#q-exp').innerHTML = `${ok ? '<b>Isso!</b>' : '<b>Quase.</b>'} Este é o <b>${certo}</b> (${nomeAcorde(certo)}).`;
        setTimeout(() => { i++; mostrar(); }, ok ? 1100 : 2000);
      }));
    };
    mostrar();
  }
};

/* ----- Tela da música: estudo + jogo nas cordas ----- */
function configJogoHTML() {
  const vel = S.cfg.vel || 'medio';
  return `<div class="config-jogo">
    <div class="segmentado" role="radiogroup" aria-label="Velocidade">${VELOCIDADES.map(([k, f, n]) => `<button type="button" role="radio" aria-checked="${k === vel}" data-vel="${k}"><b>${n}</b><small>${Math.round(f * 100)}%</small></button>`).join('')}</div>
    <div class="linha-ctrl">
      <label>Você responde <select id="cj-entrada"><option value="tela">Tocando na tela</option><option value="mic" ${S.cfg.entrada === 'mic' ? 'selected' : ''}>Tocando o violão (microfone)</option></select></label>
      <label class="check"><input type="checkbox" id="cj-guia" ${S.cfg.guia ? 'checked' : ''}> Violão guia</label>
    </div>
    <p class="sub" id="cj-aviso"></p>
  </div>`;
}
function ligarConfigJogo(raiz) {
  $$('[data-vel]', raiz).forEach(b => b.addEventListener('click', () => {
    S.cfg.vel = b.dataset.vel; Store.salvar();
    $$('[data-vel]', raiz).forEach(x => x.setAttribute('aria-checked', x === b));
  }));
  const aviso = () => { $('#cj-aviso', raiz).innerHTML = $('#cj-entrada', raiz).value === 'mic' ? '<b>Use fone de ouvido</b>: sem ele, o microfone escuta o clique. A IA também confere se o acorde está certo.' : 'Toque na tela (ou espaço) no momento de cada golpe. Dá para tocar o violão junto.'; };
  $('#cj-entrada', raiz).addEventListener('change', e => { S.cfg.entrada = e.target.value; Store.salvar(); aviso(); });
  $('#cj-guia', raiz).addEventListener('change', e => { S.cfg.guia = e.target.checked; Store.salvar(); });
  aviso();
}
const fatorVelocidade = () => (VELOCIDADES.find(v => v[0] === (S.cfg.vel || 'medio')) || VELOCIDADES[1])[1];

// Inicia a Estrada dentro de "area". Devolve uma função que para o jogo.
async function iniciarEstrada(area, { trechos, padrao, bpm, capo = 0, candidatos = [], aoFim, gravacao = null }) {
  let modo = S.cfg.entrada === 'mic' ? 'mic' : 'tela';
  if (modo === 'mic') {
    try { await Detector.ligar(); } catch (e) { toast('Microfone indisponível: usando a tela'); modo = 'tela'; }
  }
  const jogo = new Estrada(area, { trechos, padrao, bpm, capo, modo, guia: modo === 'mic' || gravacao ? false : S.cfg.guia, candidatos: candidatos.map(nomeNoModelo).filter(Boolean), aoFim, gravacao });
  const tocar = () => jogo.julgar(Som.agora);
  const tecla = e => { if (e.code === 'Space' && !$('#janela').hidden && !['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) { e.preventDefault(); if (modo === 'tela') tocar(); } };
  document.addEventListener('keydown', tecla);
  if (modo === 'tela') $('.estrada-palco', area).addEventListener('pointerdown', e => { e.preventDefault(); tocar(); });
  else $('.estrada-palco', area).classList.add('mic');
  jogo.iniciar();
  ativos.add('estrada');
  return () => { jogo.parar(); ativos.delete('estrada'); document.removeEventListener('keydown', tecla); Som.pararTudo(); };
}
function resultadoHTML(r, extra = '') {
  const tend = r.media === null ? '' : Math.abs(r.media) <= 20 ? `Tempo médio certinho (${r.media > 0 ? '+' : ''}${r.media} ms).` : r.media < 0 ? `Você tende a <b>adiantar</b> ${-r.media} ms.` : `Você tende a <b>atrasar</b> ${r.media} ms.`;
  return `<div class="resultado">
    <div><span class="mono grande-num">${r.pct}%</span><small>precisão</small></div>
    <div><span class="mono grande-num">${r.maxCombo}</span><small>maior combo</small></div>
    <div><span class="mono grande-num">${r.perf}</span><small>perfeitos</small></div>
    ${r.acordesChecados ? `<div><span class="mono grande-num">${r.acordesCertos}/${r.acordesChecados}</span><small>acordes certos (IA)</small></div>` : `<div><span class="mono grande-num">${r.erros}</span><small>perdidas</small></div>`}
    <p>${tend} ${r.pct >= 85 ? 'Mandou bem! Tente a velocidade seguinte.' : r.pct >= 60 ? 'Bom! Repita até passar de 85%.' : 'Vá para o Lento e acerte primeiro, depois acelere.'} ${extra}</p></div>`;
}

function abrirMusica(id) {
  const m = acharMusica(id);
  if (!m) return;
  const acs = acordesUnicos(m);
  const editavel = m.origem !== 'catalogo' && S.musicas.some(x => x.id === m.id);
  abrirJanela(m.titulo, `
    <div class="musica-tela">
      <header class="mt-cabeca">${capaHTML(m, true)}<div><h3>${esc(m.titulo)}</h3><p class="sub">${esc(m.artista)} · ${esc(patternById(m.padrao).genero)} · ~${m.bpm} BPM${m.tom ? ` · Tom ${esc(m.tom)}` : ''}</p></div></header>
      ${m.capo ? `<div class="box pegadinha"><b>Capotraste na ${m.capo}ª casa.</b> Os desenhos e as casas do jogo contam a partir do capo.</div>` : ''}
      ${m.original ? `<p>${esc(m.original)}</p>` : ''}
      ${m.nota ? `<p class="sub">${esc(m.nota)}</p>` : ''}
      <div class="yt-box" id="mt-yt"></div>
      <div id="mt-estudo">
        <div class="mt-secoes">${m.secoes.map(s => `<div class="mt-secao"><span class="eyebrow">${esc(s.nome)}${s.repetir > 1 ? ` · ${s.repetir}x` : ''}</span><div class="mc-acordes">${lerSequencia(s.seq).map(x => `<span class="chip-acorde mono">${esc(x.acorde)}<small>${x.tempos}</small></span>`).join('')}</div></div>`).join('')}</div>
        <details class="mt-acordes"><summary>Como fazer os ${acs.length} acordes</summary><div class="mini-acordes">${acs.map(a => `<figure>${acordeSVG(a, 'sm')}<figcaption><b>${esc(a)}</b><button class="btn mini" data-ouvir="${esc(a)}">Ouvir</button></figcaption></figure>`).join('')}</div></details>
        <div class="grav-box" id="mt-grav"></div>
        <label>Trecho <select id="mt-trecho"><option value="">Música inteira (${Math.round(duracaoMusica(m, m.bpm * fatorVelocidade()))} s)</option>${m.secoes.map((s, i) => `<option value="${i}">${esc(s.nome)}</option>`).join('')}</select></label>
        ${configJogoHTML()}
        <div class="acoes-licao">
          ${editavel ? '<button class="btn" id="mt-editar">Editar</button>' : '<button class="btn" id="mt-copiar">Copiar para editar</button>'}
          <button class="btn" id="mt-previa">▶ Ouvir prévia</button>
          <button class="btn primario grande" id="mt-jogar">Jogar</button>
        </div>
        ${m.fontes?.length || m.fonte ? `<p class="fontes">Fonte dos acordes: ${[m.fonte, ...(m.fontes || [])].filter(Boolean).map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname.replace('www.', ''))}</a>`).join(' · ')} · <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.titulo + ' ' + m.artista)}" target="_blank" rel="noopener">ouvir a gravação</a></p>` : ''}
      </div>
      <div id="mt-jogo" hidden></div>
    </div>`, () => { pararJogo?.(); Previa.parar(); $('#mt-grav')?._limpar?.(); $('#gv-sinc-area')?._limpar?.(); $('#yt-sinc-area')?._limpar?.(); clearInterval(painelYT.timerAcorde); painelYT.tocador?.destruir(); painelYT.tocador = null; });
  let pararJogo = null;
  montarBarraMusica();
  painelGravacao($('#mt-grav'), m);
  painelYouTube($('#mt-yt'), m);
  $('#mt-copiar')?.addEventListener('click', () => {
    const copia = { ...JSON.parse(JSON.stringify(m)), id: 'm' + Date.now().toString(36), origem: 'minha', titulo: m.titulo + ' (minha versão)' };
    if (S.gravacoes[m.id]) toast('A gravação importada fica na música original; importe de novo na cópia se quiser.');
    abrirFormMusica(copia, true);
  });
  $$('#janela [data-ouvir]').forEach(b => b.addEventListener('click', () => { Som.init(); Som.golpe(b.dataset.ouvir, Som.agora + 0.02, 'D', 0.35, m.capo || 0); }));
  ligarConfigJogo($('#janela-corpo'));
  $('#mt-editar')?.addEventListener('click', () => abrirFormMusica(m));
  $('#mt-previa').addEventListener('click', async e => {
    const b = e.currentTarget;
    // 1º: o vídeo original (se sincronizado); 2º: seu arquivo; 3º: violão sintetizado
    const yt = await previaComYouTube(m);
    if (yt) { b.textContent = yt === 'parou' ? '▶ Ouvir prévia' : '■ Parar prévia'; return; }
    if (Previa.tocando) { Previa.parar(); b.textContent = '▶ Ouvir prévia'; return; }
    b.textContent = '■ Parar prévia';
    const fim = () => { b.textContent = '▶ Ouvir prévia'; };
    if (!(await previaComGravacao(m, { segundos: 45, aoFim: fim }))) Previa.tocar(m, { segundos: 45, bpm: m.bpm * fatorVelocidade(), aoFim: fim });
  });
  $('#mt-jogar').addEventListener('click', async () => {
    Previa.parar();
    const sel = $('#mt-trecho').value, idx = sel === '' ? null : +sel;
    // com a gravação sincronizada, o andamento é o da gravação
    const meta = S.gravacoes[m.id];
    const reg = meta && meta.usar && meta.sincronizada ? await BancoAudio.ler(m.id) : null;
    let bpm = (reg ? meta.bpm : m.bpm) * fatorVelocidade();
    let gravacao = reg ? { tocador: new TocadorGravacao(reg.blob), pos0: posicaoNaGravacao(meta, temposAteSecao(m, idx)), taxa: fatorVelocidade() } : null;
    let rotuloVel = VELOCIDADES.find(x => x[0] === (S.cfg.vel || 'medio'))[2];
    // Vídeo do YouTube sincronizado tem prioridade: o jogo anda junto com a gravação original
    if (ytPronto(m)) {
      const metaY = S.youtube[m.id], tc = painelYT.tocador;
      const taxa = await tc.definirTaxa(fatorVelocidade());
      const pos0 = posicaoNaGravacao(metaY, temposAteSecao(m, idx));
      gravacao = { tocador: tc, pos0, taxa, mestre: true };
      bpm = metaY.bpm * taxa;
      rotuloVel = `vídeo a ${Math.round(taxa * 100)}%`;
      await tc.tocarDe(Math.max(0, pos0 - 2.5 * taxa));   // começa 2,5 s antes do 1º acorde
    }
    $('#mt-estudo').hidden = true;
    $('.musica-tela').classList.add('jogando');
    const area = $('#mt-jogo'); area.hidden = false;
    area.innerHTML = `<div class="jogo-topo"><span class="sub">${esc(m.titulo)} · ${rotuloVel}</span><button class="btn mini" id="mt-parar">■ Parar</button></div><div id="mt-estrada"></div>`;
    $('#janela-corpo').scrollTop = 0;
    const voltar = () => { pararJogo?.(); pararJogo = null; if (gravacao?.mestre) gravacao.tocador.parar(); else gravacao?.tocador.destruir(); area.hidden = true; $('#mt-estudo').hidden = false; $('.musica-tela').classList.remove('jogando'); };
    $('#mt-parar').addEventListener('click', voltar);
    pararJogo = await iniciarEstrada($('#mt-estrada'), {
      trechos: musicaParaTrechos(m, idx), padrao: patternById(m.padrao), bpm, capo: m.capo || 0, candidatos: acs, gravacao,
      aoFim: r => {
        pararJogo?.(); pararJogo = null;
        S.recordesMusica[m.id] = S.recordesMusica[m.id] || {};
        const chave = (S.cfg.vel || 'medio') + (idx === null ? '' : ':' + idx);
        S.recordesMusica[m.id][chave] = Math.max(S.recordesMusica[m.id][chave] || 0, r.pct);
        registrar('batida', r.pct, 'max');
        if (idx === null) registrar('musicas', 1);
        ganharXP(10 + Math.round(r.pct / 5), `"${m.titulo}"`);
        area.innerHTML = `${resultadoHTML(r)}<div class="acoes-licao"><button class="btn" id="mt-voltar">Voltar</button><button class="btn primario" id="mt-denovo">Jogar de novo</button></div>`;
        $('#mt-voltar').addEventListener('click', voltar);
        $('#mt-denovo').addEventListener('click', () => { voltar(); $('#mt-jogar').click(); });
      }
    });
  });
}

// Reorganiza a tela da música: a ação principal fica sempre visível no rodapé
function montarBarraMusica() {
  const est = $('#mt-estudo');
  const seg = $('.segmentado', est), jogar = $('#mt-jogar'), previa = $('#mt-previa');
  const barra = document.createElement('div');
  barra.className = 'barra-acao';
  barra.append(seg);
  const linha = document.createElement('div'); linha.className = 'barra-botoes';
  previa.classList.add('previa-btn'); jogar.classList.add('jogar-btn');
  jogar.innerHTML = '▶ Jogar';
  linha.append(previa, jogar); barra.append(linha);
  // opções menos usadas vão para um "Opções do jogo"
  const cfg = $('.config-jogo', est);
  const op = document.createElement('details'); op.className = 'mt-opcoes';
  op.innerHTML = '<summary>Opções do jogo</summary>';
  [...cfg.children].forEach(c => op.appendChild(c));
  cfg.replaceWith(op);
  const secoes = $('.mt-secoes', est);
  const det = document.createElement('details'); det.className = 'mt-seq'; det.open = true;
  det.innerHTML = '<summary>Sequência de acordes</summary>';
  secoes.replaceWith(det); det.appendChild(secoes);
  est.appendChild(barra);
}

/* ----- Colar cifra ----- */
function abrirColarCifra(termo = '') {
  abrirJanela('Colar cifra', `
    <form class="form" id="f-colar">
      <p class="sub">Copie a cifra inteira de um site (Cifra Club, por exemplo) e cole aqui. O app pega só as linhas de acordes; a letra é descartada.</p>
      <label>Nome da música<input id="fc-titulo" required value="${esc(termo)}"></label>
      <label>Artista<input id="fc-artista"></label>
      <label>Cifra<textarea id="fc-texto" rows="9" placeholder="[Intro] Am7  D7&#10;Am7          D7&#10;(linha da letra...)"></textarea></label>
      <p class="sub" id="fc-msg"></p>
      <div class="acoes-licao"><a class="btn" target="_blank" rel="noopener" id="fc-buscar" href="#">Buscar cifra na web</a><button class="btn primario" type="submit">Extrair acordes</button></div>
    </form>`);
  const link = () => { $('#fc-buscar').href = 'https://www.google.com/search?q=' + encodeURIComponent('cifra ' + $('#fc-titulo').value + ' ' + $('#fc-artista').value); };
  $('#fc-titulo').addEventListener('input', link); $('#fc-artista').addEventListener('input', link); link();
  $('#f-colar').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const m = Busca.extrairDeCifra($('#fc-texto').value, $('#fc-titulo').value.trim(), $('#fc-artista').value.trim());
      abrirFormMusica(m, true);
    } catch (err) { $('#fc-msg').textContent = err.message; }
  });
}

/* ----- Cadastro / edição de música -----
   Seções em texto: "[Refrão x2] Am7:4 D7:2 G:2" (uma por linha). */
const secoesParaTexto = secoes => secoes.map(s => `[${s.nome}${s.repetir > 1 ? ' x' + s.repetir : ''}] ${s.seq}`).join('\n');
function textoParaSecoes(txt) {
  return String(txt).split(/\r?\n/).map((l, i) => {
    const m = l.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    let nome = `Parte ${i + 1}`, resto = l, repetir = 1;
    if (m) { nome = m[1].trim(); resto = m[2]; const r = nome.match(/\s+x(\d+)$/i); if (r) { repetir = +r[1]; nome = nome.replace(/\s+x\d+$/i, ''); } }
    return { nome, seq: lerSequencia(resto).map(x => `${x.acorde}:${x.tempos}`).join(' '), repetir };
  }).filter(s => s.seq);
}
function abrirFormMusica(m = {}, novaDeCifra = false) {
  const editando = !!m.id && !novaDeCifra && S.musicas.some(x => x.id === m.id);
  abrirJanela(editando ? 'Editar música' : 'Nova música', `
    <form class="form" id="f-musica">
      <label>Nome da música<input id="f-titulo" required value="${esc(m.titulo || '')}"></label>
      <label>Artista<input id="f-artista" value="${esc(m.artista || '')}"></label>
      <label>Seções e acordes
        <textarea id="f-secoes" rows="6" placeholder="[Introdução] Am7:4 D7:4&#10;[Refrão x2] C:4 G:2 Am:2">${esc(m.secoes ? secoesParaTexto(m.secoes) : '')}</textarea>
        <small class="sub">Uma seção por linha. "Am7:4" = Am7 por 4 tempos (1 compasso). Sem número, vale 4. "x2" repete a seção.</small>
      </label>
      <div id="f-check" class="checagem"></div>
      <div class="linha-ctrl">
        <label>Ritmo<select id="f-padrao">${PATTERNS.map(p => `<option value="${p.id}" ${p.id === (m.padrao || 'pop') ? 'selected' : ''}>${esc(p.genero)}</option>`).join('')}</select></label>
        <label>BPM<input id="f-bpm" type="number" min="40" max="200" value="${m.bpm || patternById(m.padrao || 'pop').bpm}"></label>
        <label>Capo<input id="f-capo" type="number" min="0" max="9" value="${m.capo || 0}"></label>
        <label>Status<select id="f-status"><option value="aprendendo">Aprendendo</option><option value="pronta" ${m.status === 'pronta' ? 'selected' : ''}>Já toco</option></select></label>
      </div>
      <label>Anotações<textarea id="f-notas" rows="2">${esc(m.nota || m.notas || '')}</textarea></label>
      <div class="acoes-licao">
        ${editando ? '<button type="button" class="btn perigo" id="f-apagar">Apagar</button>' : ''}
        <button class="btn primario" type="submit">Salvar</button>
      </div>
    </form>`);
  const checar = () => {
    const secs = textoParaSecoes($('#f-secoes').value);
    const acs = [...new Set(secs.flatMap(s => lerSequencia(s.seq).map(x => x.acorde)))];
    const sem = acs.filter(a => !acordePorNome(a)), aprox = acs.filter(a => acordePorNome(a)?.aproximado);
    $('#f-check').innerHTML = acs.length ? `${secs.length} seção(ões), ${acs.length} acordes diferentes.${aprox.length ? ` Simplificados: <span class="mono">${esc(aprox.join(' '))}</span>.` : ''}${sem.length ? ` Sem desenho: <span class="mono">${esc(sem.join(' '))}</span>.` : ''}` : '';
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
    const dados = {
      ...m, id: editando ? m.id : 'm' + Date.now().toString(36), origem: m.origem === 'catalogo' ? 'minha' : (m.origem || 'minha'),
      titulo: $('#f-titulo').value.trim(), artista: $('#f-artista').value.trim(), padrao: $('#f-padrao').value,
      bpm: +$('#f-bpm').value || 90, capo: Math.max(0, +$('#f-capo').value || 0), status: $('#f-status').value, nota: $('#f-notas').value.trim(), secoes
    };
    delete dados.acordes; delete dados.cpa;
    S.musicas = editando ? S.musicas.map(x => x.id === m.id ? dados : x) : [...S.musicas, dados];
    Store.salvar(); fecharJanela(); irPara('musicas'); toast('Música salva');
  });
}

/* ===== 9. Inicialização ===== */
function iniciarApp() {
  Store.carregarLocal();
  $$('.nav button').forEach(b => b.addEventListener('click', () => irPara(b.dataset.view)));
  $('#janela-fechar').addEventListener('click', fecharJanela);
  $('#janela').addEventListener('click', e => { if (e.target.id === 'janela') fecharJanela(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#janela').hidden) fecharJanela(); });
  const inicial = (location.hash || '').slice(1);
  irPara(VIEWS.includes(inicial) ? inicial : 'hoje');
  Store.conectarNuvem();
  IA.carregar().then(m => { if (m && viewAtual === 'ferramentas') renderFerramentas(); }); // atualiza o texto da IA quando o modelo chegar
  configurarPWA();
  // salva ao sair da página
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Store.salvar(true); });
}
/* ===== App Android (Capacitor) =====
   Dentro do app, "abrir em nova aba" não existe. Mandamos o link para a
   própria janela; o Capacitor percebe que é um site externo e abre no
   navegador ou no app do YouTube. */
if (window.Capacitor) {
  document.documentElement.classList.add('app-android');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[target="_blank"]');
    if (!a || !/^https?:/.test(a.href)) return;
    e.preventDefault();
    location.href = a.href;
  });
  const bi = document.getElementById('instalar'); if (bi) bi.remove();
}

/* ===== PWA: app instalável e offline =====
   O service worker (sw.js) guarda os arquivos no celular, então o
   app abre mesmo sem internet. O botão "Instalar" aparece quando o
   Chrome do Android oferece a instalação. */
let pedidoInstalar = null;
function configurarPWA() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.claude && !window.Capacitor) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        novo?.addEventListener('statechange', () => {
          if (novo.state === 'installed' && navigator.serviceWorker.controller) toast('Nova versão instalada. Feche e abra o app para atualizar.');
        });
      });
    }).catch(() => {});
  }
  const btn = $('#instalar');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; btn.hidden = false; });
  btn.addEventListener('click', async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    const { outcome } = await pedidoInstalar.userChoice;
    if (outcome === 'accepted') btn.hidden = true;
    pedidoInstalar = null;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; toast('Toca Aí instalado!'); });
}

iniciarApp();
