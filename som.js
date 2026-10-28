/* =========================================================
   TOCA AÍ — som.js
   O som do app.

   VIOLÃO GRAVADO DE VERDADE
   Cada nota é uma gravação real de um violão (pasta sons/).
   Para tocar uma nota, pegamos a gravação mais próxima e ajustamos
   a velocidade um tiquinho para acertar a afinação.

   POR QUE O SOM ANTES PARECIA "DIGITAL"
   Um violonista de verdade nunca toca as 6 cordas no mesmo instante
   nem com a mesma força. A palheta (ou os dedos) passa pelas cordas
   uma de cada vez, em ~10 a 20 milissegundos, e cada corda soa um
   pouco diferente. Aqui imitamos isso ("humanizar"):
     • as cordas entram uma depois da outra, com pequenas variações;
     • cada nota tem força e afinação levemente diferentes;
     • batidas fortes soam mais brilhantes, as fracas mais escuras;
     • as cordas graves ficam um pouco à esquerda e as agudas à direita;
     • um "eco de sala" curtinho imita o corpo do violão e o ambiente.
   ========================================================= */
'use strict';

const CORDAS_SOLTAS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2 A2 D3 G3 B3 E4 (Hz)
const MIDI_SOLTAS = [40, 45, 50, 55, 59, 64];

/* Bancos de amostras (arquivo = número MIDI da nota). Ver sons/CREDITOS.txt */
const BANCOS = {
  classico: { nome: 'Clássico (nylon)', descricao: 'Violão de nylon, som macio e redondo. O mais comum no samba, na bossa e na MPB.', pasta: 'sons/classico',
    notas: [35, 38, 40, 42, 44, 45, 47, 49, 50, 52, 54, 55, 57, 59, 61, 63, 64, 66, 68, 69, 71, 73, 74, 76, 78, 79, 80, 81, 82] },
  acustico: { nome: 'Acústico', descricao: 'Violão acústico gravado nota por nota, som mais encorpado e com sustentação longa.', pasta: 'sons/acustico',
    notas: Array.from({ length: 37 }, (_, i) => 38 + i) }
};

const Som = {
  ctx: null, master: null, saida: null, fontes: [], vozes: [],
  amostras: {}, carregando: {}, _ruido: null,

  get banco() { const b = (typeof S !== 'undefined' && S.cfg && S.cfg.violao) || 'classico'; return BANCOS[b] ? b : 'classico'; },
  get somReal() { return !!(this.amostras[this.banco] && this.amostras[this.banco].size); },
  get agora() { return this.ctx ? this.ctx.currentTime : 0; },

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: 'interactive' });
      const c = this.ctx;
      // Cadeia: notas -> master -> [seco + sala] -> compressor -> alto-falante
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
      this.saida = c.createGain(); this.saida.gain.value = 1;
      const sala = c.createConvolver(); sala.buffer = this.respostaDeSala();
      const molhado = c.createGain(); molhado.gain.value = 0.16;
      this.master.connect(comp);
      this.master.connect(sala).connect(molhado).connect(comp);
      comp.connect(this.saida).connect(c.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.carregarAmostras();
    return this.ctx;
  },

  /* "Eco de sala": ruído que vai sumindo (como o som batendo nas paredes)
     com alguns reflexos iniciais. Estéreo levemente diferente em cada lado. */
  respostaDeSala() {
    const c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * 1.1);
    const b = c.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let filtro = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        filtro = filtro * 0.55 + (Math.random() * 2 - 1) * 0.45;      // ruído "abafado" (menos chiado)
        d[i] = filtro * Math.exp(-t / 0.22) * (t < 0.004 ? t / 0.004 : 1);
      }
      [0.011, 0.017, 0.023, 0.031, 0.043].forEach((tr, k) => { const i = Math.floor((tr + ch * 0.0017) * sr); if (i < n) d[i] += (0.55 - k * 0.08) * (k % 2 ? -1 : 1); });
    }
    return b;
  },

  carregarAmostras(nome = this.banco) {
    if (this.carregando[nome]) return this.carregando[nome];
    const banco = BANCOS[nome], mapa = new Map(), ctx = this.ctx;
    this.amostras[nome] = mapa;
    const um = m => fetch(`${banco.pasta}/${m}.mp3`)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then(b => new Promise((ok, erro) => ctx.decodeAudioData(b, ok, erro)))
      .then(buf => {
        // acha onde o som começa de verdade (o MP3 tem um pequeno silêncio no início)
        const d = buf.getChannelData(0);
        let pico = 0; for (let i = 0; i < Math.min(d.length, 8000); i++) pico = Math.max(pico, Math.abs(d[i]));
        let ini = 0; while (ini < d.length && Math.abs(d[ini]) < pico * 0.04) ini++;
        mapa.set(m, { buf, ini: Math.max(0, ini - 40) / buf.sampleRate });
      })
      .catch(() => {});
    this.carregando[nome] = Promise.all(banco.notas.map(um));
    return this.carregando[nome];
  },
  trocarBanco(nome) { if (BANCOS[nome]) { S.cfg.violao = nome; if (this.ctx) this.carregarAmostras(nome); } },

  // A gravação mais perto da nota pedida
  amostraPara(midi) {
    const mapa = this.amostras[this.banco];
    if (!mapa || !mapa.size) return null;
    let melhor = null, dist = 99;
    for (const [m, a] of mapa) { const d = Math.abs(m - midi); if (d < dist) { dist = d; melhor = { ...a, midi: m }; } }
    return melhor;
  },

  /* Plano B (se as gravações não carregarem): síntese Karplus-Strong,
     um ruído que se repete e vai sendo suavizado, como uma corda vibrando. */
  _cacheKS: new Map(),
  bufferSintetico(freq) {
    const chave = Math.round(freq * 10);
    if (this._cacheKS.has(chave)) return this._cacheKS.get(chave);
    const sr = this.ctx.sampleRate, len = Math.floor(sr * 1.8), N = Math.max(2, Math.round(sr / freq));
    const buf = this.ctx.createBuffer(1, len, sr), out = buf.getChannelData(0), anel = new Float32Array(N);
    let ant = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; anel[i] = (r + ant) / 2; ant = r; }
    const perda = freq > 200 ? 0.992 : 0.996;
    for (let i = 0, k = 0; i < len; i++) { const p = (k + 1) % N; out[i] = anel[k]; anel[k] = 0.5 * (anel[k] + anel[p]) * perda; k = p; }
    for (let i = len - 2000; i < len; i++) out[i] *= (len - i) / 2000;
    this._cacheKS.set(chave, buf);
    return buf;
  },

  /* Uma nota. freq em Hz. corda (0 = 6ª, a mais grossa) faz a nota anterior
     daquela corda parar, como num violão de verdade.
     op: { brilho (0..1), pan (-1..1), destino (nó de áudio), humano (bool) } */
  nota(freq, t, vol = 0.35, corda = null, op = {}) {
    const c = this.ctx, t0 = Math.max(t, this.agora);
    const humano = op.humano !== false;
    const cents = humano ? (Math.random() - 0.5) * 6 : 0;            // ±3 cents
    const midiExato = 69 + 12 * Math.log2(freq / 440) + cents / 100;
    const s = c.createBufferSource(), g = c.createGain();
    const am = this.amostraPara(Math.round(midiExato));
    let saida = g;
    if (am) {
      s.buffer = am.buf;
      s.playbackRate.value = Math.pow(2, (midiExato - am.midi) / 12);
      g.gain.value = vol * 2.4 * (humano ? 0.92 + Math.random() * 0.16 : 1);
    } else {
      s.buffer = this.bufferSintetico(freq);
      g.gain.value = vol;
    }
    if (op.pan !== undefined && c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = op.pan; g.connect(p); saida = p;
    }
    s.connect(g);
    saida.connect(op.destino || this.master);
    s.start(t0, am ? am.ini : 0);
    if (corda !== null) {
      const ant = this.vozes[corda];
      if (ant && ant.t0 <= t0) { ant.g.gain.setTargetAtTime(0, t0, 0.018); try { ant.s.stop(t0 + 0.2); } catch (e) {} }
      this.vozes[corda] = { s, g, t0 };
    }
    this.fontes.push(s);
    if (this.fontes.length > 400) this.fontes.splice(0, 150);
    return s;
  },
  // Abafa uma corda (a mão esquerda solta ou a direita encosta)
  abafar(corda, t) {
    const v = this.vozes[corda];
    if (v && v.t0 <= t) { v.g.gain.setTargetAtTime(0, t, 0.03); try { v.s.stop(t + 0.3); } catch (e) {} this.vozes[corda] = null; }
  },

  freqDe(acorde, corda) {
    const f = acorde.frets[corda];
    return f < 0 ? null : CORDAS_SOLTAS[corda] * Math.pow(2, f / 12);
  },

  /* Um "golpe" da mão direita num acorde.
     tipo: D (para baixo), U (para cima), B/p (polegar no baixo),
           F (dedos juntos), X (polegar + dedos), i/m/a (um dedo),
           T (tapa abafado, percussivo). capo = casa do capotraste. */
  golpe(acordeId, t, tipo = 'D', vol = 0.3, capo = 0, op = {}) {
    const a = typeof chordById === 'function' ? chordById(acordeId) : null;
    if (!a) return;
    const c = this.ctx, fCapo = Math.pow(2, capo / 12);
    const tocadas = [0, 1, 2, 3, 4, 5].filter(i => a.frets[i] >= 0);
    const baixo = tocadas[0];
    const forca = Math.max(0.2, Math.min(1.3, vol / 0.3)) * (0.94 + Math.random() * 0.12);
    // um filtro por golpe: golpe forte = brilhante, fraco = escuro
    const tom = c.createBiquadFilter();
    tom.type = 'lowpass'; tom.Q.value = 0.5;
    tom.frequency.value = 2200 + 5200 * Math.min(1, forca * (op.brilho ?? 0.8));
    tom.connect(this.master);
    const jitter = () => (Math.random() - 0.5) * 0.003;
    const toca = (cordas, espaco, v) => cordas.forEach((corda, i) => {
      const f = this.freqDe(a, corda);
      if (f) this.nota(f * fCapo, t + i * espaco + (i ? jitter() : 0), v * (1 - i * 0.03), corda, { destino: tom, pan: (corda - 2.5) * 0.06 });
    });
    const espacoBase = (op.espaco ?? 0.013) / Math.max(0.7, forca);
    switch (tipo) {
      case 'D':
        toca(tocadas, espacoBase, vol);
        [0, 1, 2, 3, 4, 5].forEach(i => { if (a.frets[i] < 0) this.abafar(i, t); });
        break;
      case 'U': toca(tocadas.filter(i => i >= 2).reverse(), espacoBase * 0.8, vol * 0.72); break;
      case 'B': case 'p': toca([baixo], 0, vol * 1.25); break;
      case 'F': toca([3, 4, 5].filter(i => a.frets[i] >= 0), 0.004, vol * 0.85); break;
      case 'X': toca([baixo], 0, vol * 1.25); toca([3, 4, 5].filter(i => a.frets[i] >= 0), 0.004, vol * 0.85); break;
      case 'i': toca([3], 0, vol); break;
      case 'm': toca([4], 0, vol); break;
      case 'a': toca([5], 0, vol); break;
      case 'T': this.tapa(t, vol); [0, 1, 2, 3, 4, 5].forEach(i => this.abafar(i, t)); break;
    }
  },

  /* Metrônomo: um "toc" de madeira (mais natural que um bipe) */
  click(t, forte = false, vol = 0.5) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(forte ? 1750 : 1250, t); o.frequency.exponentialRampToValueAtTime(forte ? 1100 : 800, t + 0.04);
    f.type = 'bandpass'; f.frequency.value = forte ? 1600 : 1150; f.Q.value = 2.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(f).connect(g).connect(this.saida); o.start(t); o.stop(t + 0.07);
    this.fontes.push(o);
  },

  /* Percussão leve para os acompanhamentos (não usa o microfone) */
  ruido() {
    if (this._ruido) return this._ruido;
    const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    return (this._ruido = b);
  },
  ganza(t, vol) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.ruido();
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5500;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(this.master); s.start(t, 0, 0.07); this.fontes.push(s);
  },
  surdo(t, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.28);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.45); this.fontes.push(o);
  },
  // Tapa: a mão bate nas cordas abafadas ("tchá"), comum no pagode e no samba
  tapa(t, vol = 0.3) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.ruido();
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.9;
    const g = c.createGain(); g.gain.setValueAtTime(vol * 1.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    s.connect(f).connect(g).connect(this.master); s.start(t); this.fontes.push(s);
  },

  pararTudo() {
    for (const f of this.fontes) { try { f.stop(); } catch (e) {} }
    this.fontes = []; this.vozes = [];
  }
};

/* Relógio musical: o setInterval atrasa às vezes. Por isso, a cada 25 ms
   agendamos no relógio de áudio (preciso) os sons dos próximos 120 ms. */
class Relogio {
  constructor({ bpm, sub = 1, aoPasso }) { Object.assign(this, { bpm, sub, aoPasso }); }
  get duracaoPasso() { return 60 / this.bpm / this.sub; }
  iniciar(atraso = 0.12) {
    Som.init();
    this.passo = 0; this.prox = Som.agora + atraso; this.inicio = this.prox;
    this.id = setInterval(() => this.agendar(), 25);
    this.agendar();
  }
  agendar() { while (this.prox < Som.agora + 0.12) { this.aoPasso(this.passo, this.prox); this.prox += this.duracaoPasso; this.passo++; } }
  parar() { clearInterval(this.id); this.id = null; }
}
// Executa uma função visual no momento em que o som toca
function quandoTocar(t, fn) { setTimeout(fn, Math.max(0, (t - Som.agora) * 1000)); }
