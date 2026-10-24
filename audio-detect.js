/* =========================================================
   TOCA AÍ — audio-detect.js
   Detecção sonora pelo microfone. Três "ouvidos":

   1. ATAQUES  → percebe o instante em que você bate nas cordas.
                 Usado no jogo da Batida para conferir o tempo.
   2. ALTURA   → descobre a frequência (nota) de uma corda.
                 Usado no afinador.
   3. ACORDE   → compara as notas que soam com o desenho de cada
                 acorde. Usado no jogo de Trocas.

   Depende de: Som (app.js) para usar o mesmo relógio de áudio,
   CHORDS (data.js) para saber as notas de cada acorde.
   ========================================================= */
'use strict';

/* ---------- 1. Processador de ataques (roda numa thread de áudio) ----------
   O AudioWorklet recebe o som em blocos de 128 amostras (~3 ms).
   Não olhamos o volume puro: quando você toca rápido, a batida
   anterior ainda está soando e o volume quase não muda.
   Olhamos o "ruído de ataque": a diferença entre uma amostra e a
   anterior (x[n] − x[n−1]). Ela é grande no instante em que a
   palheta/dedo bate nas cordas e pequena enquanto a nota só soa.
   Um ataque é quando essa energia salta k vezes acima da média
   dos últimos ~23 ms. Depois, ignoramos 90 ms (anti-repique).

   Analogia: numa sala com música alta, você ainda percebe alguém
   batendo palma, porque a palma é um estalo "seco" e diferente. */
const CODIGO_WORKLET = `
class Ataques extends AudioWorkletProcessor {
  constructor() {
    super();
    this.hist = new Float32Array(8).fill(1e-7); this.h = 0;
    this.amostraAnt = 0; this.ultimo = -1;
    this.k = 3.6; this.piso = 2e-6; this.cont = 0; this.pico = 0;
    this.port.onmessage = e => { if (e.data.k) this.k = e.data.k; if (e.data.piso) this.piso = e.data.piso; };
  }
  process(inputs) {
    const canal = inputs[0] && inputs[0][0];
    if (!canal) return true;
    let eAtaque = 0, eVolume = 0, ant = this.amostraAnt;
    for (let i = 0; i < canal.length; i++) {
      const d = canal[i] - ant; ant = canal[i];
      eAtaque += d * d; eVolume += canal[i] * canal[i];
    }
    this.amostraAnt = ant;
    eAtaque /= canal.length; eVolume /= canal.length;
    let media = 0; for (let i = 0; i < 8; i++) media += this.hist[i]; media /= 8;
    const t = currentTime;
    if (eAtaque > media * this.k && eAtaque > this.piso && t - this.ultimo > 0.09) {
      this.ultimo = t;
      this.port.postMessage({ tipo: 'ataque', t, e: eAtaque });
    }
    this.hist[this.h] = eAtaque; this.h = (this.h + 1) % 8;
    this.pico = Math.max(this.pico, eVolume);
    if (++this.cont % 12 === 0) { this.port.postMessage({ tipo: 'nivel', e: this.pico }); this.pico = 0; }
    return true;
  }
}
registerProcessor('ataques', Ataques);
`;

const Detector = {
  stream: null, fonte: null, analisador: null, analisadorFreq: null, no: null,
  ligado: false, nivel: 0, ouvintes: new Set(), ouvintesNivel: new Set(),

  // Sensibilidade 1 (só sons fortes) a 10 (qualquer ruído)
  aplicarSensibilidade(s) {
    const k = 2 + (10 - s) * 0.35;              // quanto o ataque precisa saltar acima da média
    const piso = 2e-6 * Math.pow(1.8, 5 - s);    // energia mínima (ignora ruído de fundo)
    if (this.no && this.no.port) this.no.port.postMessage({ k, piso });
    this._k = k; this._piso = piso;
  },

  async ligar() {
    if (this.ligado) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('sem-suporte');
    Som.init();
    const ctx = Som.ctx;
    // Desligamos os "filtros de chamada de vídeo": eles cortam justamente o som do violão
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    this.fonte = ctx.createMediaStreamSource(this.stream);

    // Filtro passa-alta: remove ronco grave (ar-condicionado, mesa batendo)
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'highpass'; filtro.frequency.value = 70;
    this.fonte.connect(filtro);

    // Analisador de forma de onda (afinador)
    this.analisador = ctx.createAnalyser();
    this.analisador.fftSize = 4096;
    filtro.connect(this.analisador);

    // Analisador de espectro (acordes): FFT grande = mais precisão nas notas graves
    this.analisadorFreq = ctx.createAnalyser();
    this.analisadorFreq.fftSize = 8192;
    this.analisadorFreq.smoothingTimeConstant = 0.4;
    filtro.connect(this.analisadorFreq);

    // Analisador da IA: recebe o som SEM filtro, igual ao treino em Python
    this.analisadorIA = ctx.createAnalyser();
    this.analisadorIA.fftSize = 8192;
    this.fonte.connect(this.analisadorIA);

    // Saída muda: o nó precisa estar ligado até o destino para ser processado
    const mudo = ctx.createGain(); mudo.gain.value = 0;
    mudo.connect(ctx.destination);

    const receber = msg => {
      if (msg.tipo === 'ataque') this.ouvintes.forEach(fn => fn(msg));
      else if (msg.tipo === 'nivel') { this.nivel = msg.e; this.ouvintesNivel.forEach(fn => fn(msg.e)); }
    };
    try {
      // data: URL funciona até abrindo o arquivo direto (file://); blob: é o plano B
      try { await ctx.audioWorklet.addModule('data:application/javascript,' + encodeURIComponent(CODIGO_WORKLET)); }
      catch (e1) { await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([CODIGO_WORKLET], { type: 'application/javascript' }))); }
      this.no = new AudioWorkletNode(ctx, 'ataques');
      this.no.port.onmessage = e => receber(e.data);
    } catch (e) {
      console.warn('AudioWorklet indisponível, usando ScriptProcessor:', e && e.message);
      // Navegadores antigos: ScriptProcessor (mais lento, mas funciona)
      this.no = this._processadorAntigo(ctx, receber);
    }
    filtro.connect(this.no);
    this.no.connect(mudo);
    this.ligado = true;
    this.aplicarSensibilidade(S.cfg.sens ?? 5);
    return true;
  },

  _processadorAntigo(ctx, receber) {
    const no = ctx.createScriptProcessor(512, 1, 1);
    const hist = new Float32Array(8).fill(1e-7);
    let h = 0, ant = 0, ultimo = -1, cont = 0, pico = 0;
    no.onaudioprocess = ev => {
      const c = ev.inputBuffer.getChannelData(0);
      for (let b = 0; b < c.length; b += 128) {
        let ea = 0, ev2 = 0;
        for (let i = b; i < b + 128; i++) { const d = c[i] - ant; ant = c[i]; ea += d * d; ev2 += c[i] * c[i]; }
        ea /= 128; ev2 /= 128;
        let media = 0; for (let i = 0; i < 8; i++) media += hist[i]; media /= 8;
        const t = ev.playbackTime - (c.length - b) / ctx.sampleRate;
        if (ea > media * this._k && ea > this._piso && t - ultimo > 0.09) { ultimo = t; receber({ tipo: 'ataque', t, e: ea }); }
        hist[h] = ea; h = (h + 1) % 8; pico = Math.max(pico, ev2);
        if (++cont % 12 === 0) { receber({ tipo: 'nivel', e: pico }); pico = 0; }
      }
    };
    no.port = null;
    return no;
  },

  desligar() {
    if (!this.ligado) return;
    this.stream.getTracks().forEach(t => t.stop());
    try { this.fonte.disconnect(); this.no.disconnect(); } catch (e) {}
    this.ligado = false; this.ouvintes.clear(); this.ouvintesNivel.clear();
  },

  // Inscreve uma função para ser chamada a cada ataque. Devolve a função para cancelar.
  aoAtacar(fn) { this.ouvintes.add(fn); return () => this.ouvintes.delete(fn); },
  aoNivel(fn) { this.ouvintesNivel.add(fn); return () => this.ouvintesNivel.delete(fn); },

  /* ---------- 2. Altura (frequência) ----------
     Método MPM (McLeod): compara a onda com ela mesma deslocada.
     Quando o deslocamento é exatamente um período, as duas cópias
     ficam quase iguais. 1 / período = frequência.
     "clareza" (0 a 1) diz o quanto o som é uma nota limpa. */
  _bufOnda: null,
  altura() {
    if (!this.ligado) return null;
    const N = this.analisador.fftSize;
    if (!this._bufOnda) this._bufOnda = new Float32Array(N);
    const buf = this._bufOnda;
    this.analisador.getFloatTimeDomainData(buf);
    return detectarAltura(buf, Som.ctx.sampleRate);
  },

  /* ---------- 3. Cromagrama ----------
     Soma a força de todas as frequências que caem na mesma NOTA
     (Dó, Dó#, Ré...), não importa a oitava. Resultado: 12 números.
     Um acorde de Lá menor acende Lá, Dó e Mi. */
  _bufEsp: null,
  croma() {
    if (!this.ligado) return null;
    const an = this.analisadorFreq, n = an.frequencyBinCount, sr = Som.ctx.sampleRate;
    if (!this._bufEsp) this._bufEsp = new Float32Array(n);
    const db = this._bufEsp;
    an.getFloatFrequencyData(db);
    const c = new Float32Array(12);
    let energia = 0;
    const hzPorBin = sr / an.fftSize;
    for (let i = Math.floor(75 / hzPorBin); i < Math.min(n, Math.ceil(1100 / hzPorBin)); i++) {
      const mag = Math.pow(10, db[i] / 20);
      if (!isFinite(mag)) continue;
      const midi = 69 + 12 * Math.log2((i * hzPorBin) / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      c[pc] += mag;
      energia += mag * mag;
    }
    return { croma: c, energia };
  },

  /* ---------- 4. IA (rede neural treinada em Python) ----------
     Pega os últimos 8192 pontos do som, extrai as 24 características
     e pergunta à rede: "qual a chance de ser cada acorde?" */
  _bufIA: null,
  ouvirIA() {
    if (!this.ligado || !IA.modelo) return null;
    if (!this._bufIA) this._bufIA = new Float32Array(this.analisadorIA.fftSize);
    this.analisadorIA.getFloatTimeDomainData(this._bufIA);
    let rms = 0; for (const v of this._bufIA) rms += v * v;
    rms = Math.sqrt(rms / this._bufIA.length);
    if (rms < 0.004) return { silencio: true, probs: null, x: null };
    const x = extrairCaracteristicas(this._bufIA, Som.ctx.sampleRate);
    return { silencio: false, probs: IA.prever(x), x };
  },

  // Diz qual acorde, dentre os candidatos, combina com o que está soando.
  // Usa a IA quando o modelo carregou; senão, o método antigo (moldes).
  reconhecer(candidatos) {
    if (IA.modelo) {
      const r = this.ouvirIA();
      if (!r || r.silencio) return { acorde: null, sim: 0, margem: 0, energia: 0 };
      const ps = candidatos.map(c => [c, r.probs[c] || 0]).sort((a, b) => b[1] - a[1]);
      const total = ps.reduce((acc, p) => acc + p[1], 0);
      if (total < 0.15 || (r.probs.nenhum || 0) > 0.6) return { acorde: null, sim: 0, margem: 0, energia: 1, ia: true };
      const p1 = ps[0][1] / total, p2 = ps[1] ? ps[1][1] / total : 0;
      return { acorde: ps[0][0], sim: p1, margem: p1 - p2, energia: 1, ia: true };
    }
    return this.reconhecerPorMoldes(candidatos);
  },

  reconhecerPorMoldes(candidatos) {
    const r = this.croma();
    if (!r || r.energia < 1e-6) return { acorde: null, sim: 0, energia: r ? r.energia : 0 };
    // "centralizar" (subtrair a média) faz a comparação olhar para quais notas
    // se destacam, e não para o volume geral
    const mediaC = r.croma.reduce((a, b) => a + b, 0) / 12;
    const cc = r.croma.map(v => v - mediaC);
    const norma = Math.hypot(...cc) || 1;
    const c = cc.map(v => v / norma);
    let melhor = null, sim = 0, segundo = 0;
    for (const id of candidatos) {
      const t = modeloAcorde(id);
      if (!t) continue;
      const s = c.reduce((acc, v, i) => acc + v * t[i], 0);
      if (s > sim) { segundo = sim; sim = s; melhor = id; } else if (s > segundo) segundo = s;
    }
    return { acorde: melhor, sim, margem: sim - segundo, energia: r.energia, croma: c };
  }
};

/* ----- Funções puras (sem estado): fáceis de testar sozinhas ----- */
const NOMES_NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOMES_NOTAS_PT = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
const MIDI_CORDAS = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4

function detectarAltura(buf, sr) {
  const N = buf.length;
  let rms = 0;
  for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / N);
  if (rms < 0.008) return null; // silêncio
  const minL = Math.floor(sr / 1000), maxL = Math.min(Math.floor(sr / 60), N >> 1);
  const nsdf = new Float32Array(maxL + 2);
  for (let tau = minL; tau <= maxL + 1; tau++) {
    let acf = 0, m = 0;
    for (let i = 0; i < N - tau; i++) { const a = buf[i], b = buf[i + tau]; acf += a * b; m += a * a + b * b; }
    nsdf[tau] = m ? 2 * acf / m : 0;
  }
  // picos positivos depois que a curva cruza o zero pela primeira vez
  let t = minL;
  while (t < maxL && nsdf[t] > 0) t++;
  const picos = [];
  let maxPico = 0;
  for (; t <= maxL; t++) {
    if (nsdf[t] > 0 && nsdf[t] > nsdf[t - 1] && nsdf[t] >= nsdf[t + 1]) {
      picos.push(t);
      if (nsdf[t] > maxPico) maxPico = nsdf[t];
    }
  }
  if (maxPico < 0.6) return null;
  const T = picos.find(p => nsdf[p] >= 0.9 * maxPico);
  const a = nsdf[T - 1], b = nsdf[T], c = nsdf[T + 1];
  const den = a - 2 * b + c;
  const Tfino = den ? T + 0.5 * (a - c) / den : T;
  return { freq: sr / Tfino, clareza: b };
}

// Hz -> { nome: 'A', nomePt: 'Lá', oitava: 2, cents: -12, midi: 45 }
function infoNota(freq) {
  const midiExato = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(midiExato);
  return {
    midi, cents: Math.round((midiExato - midi) * 100),
    nome: NOMES_NOTAS[(midi % 12 + 12) % 12], nomePt: NOMES_NOTAS_PT[(midi % 12 + 12) % 12],
    oitava: Math.floor(midi / 12) - 1
  };
}

/* Modelo do acorde: 12 posições com as notas que ele tem.
   Uma corda não toca só a sua nota: ela também soa os HARMÔNICOS
   (a mesma nota uma oitava acima, a quinta, a terça...). Incluímos
   esses harmônicos com peso menor, senão o Lá menor (que tem Mi)
   se confunde com o Mi menor. Depois centralizamos como na croma. */
const HARMONICOS = [[0, 1], [12, 0.5], [19, 0.33], [24, 0.25], [28, 0.2], [31, 0.16]]; // [semitons acima, peso]
const _modelos = {};
function modeloAcorde(id) {
  if (_modelos[id]) return _modelos[id];
  const a = CHORDS.find(c => c.id === id);
  if (!a) return null;
  const v = new Array(12).fill(0);
  a.frets.forEach((f, i) => {
    if (f < 0) return;
    const nota = MIDI_CORDAS[i] + f;
    for (const [st, peso] of HARMONICOS) v[(nota + st) % 12] += peso;
  });
  const media = v.reduce((x, y) => x + y, 0) / 12;
  const cc = v.map(x => x - media);
  const n = Math.hypot(...cc) || 1;
  return (_modelos[id] = cc.map(x => x / n));
}

// Mediana: valor do meio. Ignora leituras malucas isoladas.
function mediana(arr) { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; }

// Mensagem padrão quando o microfone não está disponível
function msgSemMicrofone(err) {
  if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError'))
    return 'O microfone foi bloqueado. Na página publicada no Claude o navegador não libera o microfone: abra o app pelos arquivos no seu PC (veja o README). Se já estiver no PC, clique no cadeado da barra de endereço e permita o microfone.';
  if (err && err.name === 'NotFoundError') return 'Nenhum microfone encontrado. Conecte um fone com microfone ou use o do notebook.';
  return 'O microfone não está disponível aqui. Abra o app pelos arquivos no seu PC com "python -m http.server" (veja o README).';
}
