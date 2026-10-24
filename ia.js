/* =========================================================
   TOCA AÍ — ia.js
   Roda no celular a rede neural treinada em Python (pasta ia/).

   1. extrairCaracteristicas: transforma 8192 amostras de áudio em
      24 números. É a CÓPIA EXATA de ia/caracteristicas.py.
   2. IA.prever: passa os 24 números pela rede neural e devolve a
      probabilidade de cada acorde.

   A rede é só matemática: multiplicar por matrizes (pesos que o
   Python aprendeu), aplicar ReLU (zera negativos) e no fim softmax
   (transforma em probabilidades que somam 1).
   ========================================================= */
'use strict';

/* ---------- FFT (Transformada Rápida de Fourier) ----------
   Separa o som nas frequências que o compõem, como um prisma
   separa a luz nas cores. Versão clássica "radix-2" iterativa. */
const _fftCache = {};
function fftMagnitudes(sinal) {
  const N = sinal.length;
  let c = _fftCache[N];
  if (!c) {
    const bits = Math.log2(N);
    const rev = new Uint32Array(N);
    for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
    const cos = new Float64Array(N / 2), sin = new Float64Array(N / 2);
    for (let i = 0; i < N / 2; i++) { cos[i] = Math.cos(-2 * Math.PI * i / N); sin[i] = Math.sin(-2 * Math.PI * i / N); }
    c = _fftCache[N] = { rev, cos, sin, re: new Float64Array(N), im: new Float64Array(N) };
  }
  const { rev, cos, sin, re, im } = c;
  for (let i = 0; i < N; i++) { re[rev[i]] = sinal[i]; im[rev[i]] = 0; }
  for (let tam = 2; tam <= N; tam <<= 1) {
    const meio = tam >> 1, passo = N / tam;
    for (let i = 0; i < N; i += tam) {
      for (let j = 0, k = 0; j < meio; j++, k += passo) {
        const a = i + j, b = a + meio;
        const tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  }
  const mag = new Float64Array(N / 2 + 1);
  for (let i = 0; i <= N / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

const IA_N_JANELA = 8192;
function _croma(mag, sr, f0, f1) {
  const c = new Float64Array(12), N = IA_N_JANELA;
  for (let k = 0; k < mag.length; k++) {
    const f = k * sr / N;
    if (f < f0 || f >= f1) continue;
    const midi = 69 + 12 * Math.log2(f / 440);
    // Math.round do JS arredonda .5 para cima; o numpy arredonda para o par.
    // Com estas faixas e taxas de amostragem isso nunca cai exatamente em .5.
    c[((Math.round(midi) % 12) + 12) % 12] += mag[k];
  }
  let n = 0; for (const v of c) n += v * v;
  n = Math.sqrt(n) + 1e-9;
  return Array.from(c, v => v / n);
}
function extrairCaracteristicas(quadro, sr) {
  const N = IA_N_JANELA, janela = new Float64Array(N);
  for (let i = 0; i < N; i++) janela[i] = quadro[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
  const mag = fftMagnitudes(janela);
  return [..._croma(mag, sr, 75, 1100), ..._croma(mag, sr, 75, 260)];
}

const IA = {
  modelo: null,
  async carregar(url = 'modelo-acordes.json') {
    // modelo-acordes.js já colocou o modelo na página: usa direto (funciona até em file://)
    if (window.MODELO_ACORDES) return (this.modelo = window.MODELO_ACORDES);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      this.modelo = await r.json();
    } catch (e) { this.modelo = window.MODELO_ACORDES || null; } // plano B: modelo-acordes.js
    return this.modelo;
  },
  // x: 24 números -> { acorde: probabilidade }
  prever(x) {
    const m = this.modelo;
    let h = x.map((v, i) => (v - m.media[i]) / m.desvio[i]); // padronização (igual ao StandardScaler)
    m.camadas.forEach((cam, idx) => {
      const saida = cam.b.slice();
      for (let i = 0; i < h.length; i++) {
        const hi = h[i], linha = cam.W[i];
        if (hi === 0) continue;
        for (let j = 0; j < saida.length; j++) saida[j] += hi * linha[j];
      }
      h = idx < m.camadas.length - 1 ? saida.map(v => Math.max(0, v)) : saida; // ReLU nas camadas escondidas
    });
    const max = Math.max(...h), exps = h.map(v => Math.exp(v - max)), soma = exps.reduce((a, b) => a + b, 0);
    const p = {};
    m.classes.forEach((c, i) => { p[c] = exps[i] / soma; });
    return p;
  }
};

// Funciona no navegador e no Node (para o teste de paridade com o Python)
if (typeof module !== 'undefined') module.exports = { extrairCaracteristicas, fftMagnitudes, IA };
