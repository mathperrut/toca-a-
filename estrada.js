/* =========================================================
   TOCA AÍ — estrada.js
   1. Acordes por nome: acha o desenho de QUALQUER acorde
      (inclusive os que não estão no data.js, gerando pestana).
   2. Músicas: transforma as seções em uma linha do tempo.
   3. Braço do violão: desenho horizontal com os dedos coloridos.
   4. Estrada: o jogo. As 6 cordas correm na tela com as casas e
      os golpes; você toca quando chegam na linha amarela.
   5. Prévia: toca a música com violão, baixo e percussão sintéticos.
   ========================================================= */
'use strict';

/* ===== 1. Acordes por nome ===== */
const RAIZ_PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const NOMES_PC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ENARMONICO = { 'C#': 'Db', Db: 'C#', 'D#': 'Eb', Eb: 'D#', 'F#': 'Gb', Gb: 'F#', 'G#': 'Ab', Ab: 'G#', 'A#': 'Bb', Bb: 'A#' };

// Deixa a cifra no padrão do app: Cmaj7 -> C7M, C7/9 -> C7(9), Cdim -> C°
function normalizarAcorde(nome) {
  let s = String(nome || '').trim().replace(/\s+/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
  s = s.replace(/maj7|M7|7\+|Δ7?/g, '7M').replace(/º|dim/g, '°').replace(/7\/9/g, '7(9)').replace(/m7\/9/g, 'm7(9)');
  return s;
}
function partesAcorde(nome) {
  const m = normalizarAcorde(nome).match(/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/);
  return m ? { raiz: m[1], qual: m[2], baixo: m[3] || null, pc: RAIZ_PC[m[1]] } : null;
}

// Extensões viram a versão mais simples que ainda soa parecido
const SIMPLIFICACOES = [
  [/^(7\(9\)|9|7\(13\)|13|7\(4\)|7sus4|7\(b9\)|7\(#9\)|7\(#11\)|7\(b13\)|7\(9\/13\))$/, '7'],
  [/^(m7\(9\)|m9|m7\(11\)|m11)$/, 'm7'],
  [/^(7M\(9\)|7M\(13\)|7M\(#11\))$/, '7M'],
  [/^(m7\(b5\)|ø|°7)$/, '°'],
  [/^(m6|m\(9\)|madd9|m7M|m\(7M\)|m6\(9\))$/, 'm'],
  [/^(6|6\(9\)|add9|\(9\)|sus2|sus4|4|\+|aug|5)$/, ''],
];
// Moldes de pestana. r = casa da pestana. [casas relativas], [dedos]. null = não toca
const MOLDES = {
  E: { base: 4, formas: {
    '': [[0, 2, 2, 1, 0, 0], [1, 3, 4, 2, 1, 1]], m: [[0, 2, 2, 0, 0, 0], [1, 3, 4, 1, 1, 1]],
    '7': [[0, 2, 0, 1, 0, 0], [1, 3, 1, 2, 1, 1]], m7: [[0, 2, 0, 0, 0, 0], [1, 3, 1, 1, 1, 1]],
    '7M': [[0, null, 1, 1, 0, null], [1, 0, 3, 4, 2, 0]] } },
  A: { base: 9, formas: {
    '': [[null, 0, 2, 2, 2, 0], [0, 1, 2, 3, 4, 1]], m: [[null, 0, 2, 2, 1, 0], [0, 1, 3, 4, 2, 1]],
    '7': [[null, 0, 2, 0, 2, 0], [0, 1, 3, 1, 4, 1]], m7: [[null, 0, 2, 0, 1, 0], [0, 1, 3, 1, 2, 1]],
    '7M': [[null, 0, 2, 1, 2, 0], [0, 1, 3, 2, 4, 1]], '°': [[null, 0, 1, 2, 1, null], [0, 1, 2, 4, 3, 0]] } },
};
function gerarForma(pc, qual) {
  let melhor = null;
  for (const molde of Object.values(MOLDES)) {
    const f = molde.formas[qual];
    if (!f) continue;
    const r = (pc - molde.base + 12) % 12;
    if (!melhor || r < melhor.r) melhor = { r, f };
  }
  if (!melhor) return null;
  const { r, f } = melhor;
  const frets = f[0].map(x => x === null ? -1 : x + r);
  // na casa 0 não há pestana: o dedo é o número da casa (formas pequenas)
  const fingers = r === 0 ? frets.map(x => (x > 0 ? Math.min(4, x) : 0)) : f[1].slice();
  const umas = fingers.filter(d => d === 1).length;
  return { frets, fingers, barre: umas > 1 && r > 0 ? r : undefined };
}

const _cacheAcordes = new Map();
// Devolve { id, frets, fingers, barre, aproximado? } ou null
function acordePorNome(nome) {
  if (!nome) return null;
  if (_cacheAcordes.has(nome)) return _cacheAcordes.get(nome);
  const achar = id => CHORDS.find(c => c.id === id);
  let r = achar(nome);
  if (!r) {
    const p = partesAcorde(nome);
    if (p) {
      const raizes = [p.raiz, ENARMONICO[p.raiz]].filter(Boolean);
      let qual = p.qual;
      const tentativas = [qual];
      for (const [re, troca] of SIMPLIFICACOES) if (re.test(qual)) { tentativas.push(troca); break; }
      if (!tentativas.includes(qual.startsWith('m') && !qual.startsWith('7M') ? 'm' : '')) tentativas.push(qual.startsWith('m') && !qual.startsWith('7M') ? 'm' : '');
      for (const q of tentativas) {
        for (const rz of raizes) { const c = achar(rz + q); if (c) { r = { ...c, id: nome, aproximado: q !== qual ? c.id : null }; break; } }
        if (r) break;
        const g = gerarForma(p.pc, q);
        if (g) { r = { ...g, id: nome, aproximado: q !== qual ? p.raiz + q : null, gerado: true }; break; }
      }
    }
  }
  _cacheAcordes.set(nome, r || null);
  return r || null;
}

/* ===== 2. Músicas -> linha do tempo ===== */
// "Am7:2 Bm7:2 Em:4" -> [{acorde:'Am7', tempos:2}, ...]
function lerSequencia(seq, temposPadrao = 4) {
  return String(seq || '').replace(/[|,;]/g, ' ').split(/\s+/).filter(Boolean).map(tok => {
    const [a, t] = tok.split(':');
    return { acorde: normalizarAcorde(a), tempos: Math.max(0.5, +t || temposPadrao) };
  });
}
// Junta as seções (com repetições) em uma lista de trechos com início em tempos
function musicaParaTrechos(musica, indiceSecao = null) {
  const secoes = indiceSecao === null ? musica.secoes : [musica.secoes[indiceSecao]];
  const trechos = [];
  let inicio = 0;
  secoes.forEach(sec => {
    for (let r = 0; r < (sec.repetir || 1); r++) {
      lerSequencia(sec.seq).forEach(x => { trechos.push({ ...x, inicio, secao: sec.nome }); inicio += x.tempos; });
    }
  });
  return trechos;
}
function acordesUnicos(musica) {
  return [...new Set(musica.secoes.flatMap(s => lerSequencia(s.seq).map(x => x.acorde)))];
}
function duracaoMusica(musica, bpm = musica.bpm) {
  const t = musicaParaTrechos(musica);
  const tempos = t.length ? t.at(-1).inicio + t.at(-1).tempos : 0;
  return tempos * 60 / bpm;
}
function dificuldade(musica) {
  const acs = acordesUnicos(musica).map(acordePorNome);
  const pestanas = acs.filter(a => a && a.barre).length;
  const semForma = acs.filter(a => !a).length;
  if (pestanas + semForma >= 2 || acs.length > 7) return 'Difícil';
  if (pestanas || acs.length > 4) return 'Médio';
  return 'Fácil';
}

// Quais cordas cada golpe atinge (0 = 6ª corda, a mais grossa)
function cordasDoGolpe(acorde, tok) {
  const a = acordePorNome(acorde);
  if (!a) return [];
  const tocadas = [0, 1, 2, 3, 4, 5].filter(i => a.frets[i] >= 0);
  const baixo = tocadas[0];
  const finas = [3, 4, 5].filter(i => a.frets[i] >= 0);
  switch (tok) {
    case 'D': return tocadas;
    case 'U': return tocadas.filter(i => i >= 2);
    case 'B': case 'p': return [baixo];
    case 'F': return finas;
    case 'X': return [baixo, ...finas];
    case 'i': return [3]; case 'm': return [4]; case 'a': return [5];
  }
  return [];
}
const NOME_GOLPE = {
  D: 'Para baixo ↓', U: 'Para cima ↑', B: 'Polegar no baixo', F: 'Dedos juntos (i m a)',
  X: 'Polegar + dedos', p: 'Polegar (p)', i: 'Indicador (i)', m: 'Médio (m)', a: 'Anelar (a)'
};
const NOMES_DEDOS = ['', 'indicador', 'médio', 'anelar', 'mindinho'];
const NOMES_CORDAS = ['6ª (Mi grave)', '5ª (Lá)', '4ª (Ré)', '3ª (Sol)', '2ª (Si)', '1ª (Mi agudo)'];
const LETRAS_CORDAS = ['E', 'A', 'D', 'G', 'B', 'e'];

/* ===== 3. Braço do violão (horizontal, mesma ordem das cordas do jogo) ===== */
function bracoSVG(atual, proximo = null, capo = 0) {
  const A = acordePorNome(atual), P = proximo ? acordePorNome(proximo) : null;
  const W = 380, H = 150, x0 = 44, y0 = 18, dy = 22, casas = 5, dx = (W - x0 - 14) / casas;
  const usadas = [A, P].filter(Boolean).flatMap(c => c.frets.filter(f => f > 0));
  const maior = usadas.length ? Math.max(...usadas) : 0;
  const inicio = maior > casas ? Math.max(1, Math.min(...usadas)) : 1;
  const yCorda = i => y0 + (5 - i) * dy;            // 1ª corda em cima
  const xCasa = f => x0 + (f - inicio + 0.5) * dx;
  let s = `<svg class="braco" viewBox="0 0 ${W} ${H}" role="img" aria-label="Braço do violão com o acorde ${esc(atual || '')}">`;
  s += `<rect class="braco-madeira" x="${x0}" y="${y0 - 10}" width="${W - x0 - 14}" height="${5 * dy + 20}" rx="4"/>`;
  [3, 5, 7, 9, 12].forEach(f => { if (f >= inicio && f < inicio + casas) s += `<circle class="braco-marca" cx="${xCasa(f)}" cy="${y0 + 2.5 * dy}" r="5"/>`; });
  for (let k = 0; k <= casas; k++) {
    const x = x0 + k * dx;
    s += `<line class="${k === 0 && inicio === 1 ? 'braco-pestana' : 'braco-traste'}" x1="${x}" y1="${y0 - 10}" x2="${x}" y2="${y0 + 5 * dy + 10}"/>`;
    if (k < casas) s += `<text class="braco-num" x="${x + dx / 2}" y="${H - 4}" text-anchor="middle">${inicio + k}</text>`;
  }
  for (let i = 0; i < 6; i++) {
    s += `<line class="braco-corda" style="stroke-width:${1 + (5 - i) * 0.35}" x1="${x0}" y1="${yCorda(i)}" x2="${W - 14}" y2="${yCorda(i)}"/>`;
    s += `<text class="braco-letra" x="10" y="${yCorda(i) + 4}">${LETRAS_CORDAS[i]}</text>`;
  }
  if (P) P.frets.forEach((f, i) => { if (f > 0) s += `<circle class="braco-prox" cx="${xCasa(f)}" cy="${yCorda(i)}" r="9"/>`; });
  if (A) {
    if (A.barre) {
      const cs = A.frets.map((f, i) => f === A.barre ? i : -1).filter(i => i >= 0);
      s += `<rect class="dedo-fill d1" x="${xCasa(A.barre) - 9}" y="${yCorda(Math.max(...cs)) - 9}" width="18" height="${(Math.max(...cs) - Math.min(...cs)) * dy + 18}" rx="9"/>`;
    }
    A.frets.forEach((f, i) => {
      const y = yCorda(i);
      if (f < 0) s += `<text class="braco-x" x="${x0 - 12}" y="${y + 4}" text-anchor="middle">×</text>`;
      else if (f === 0) s += `<circle class="braco-solta" cx="${x0 - 12}" cy="${y}" r="5"/>`;
      else if (!(A.barre && f === A.barre && A.fingers[i] === 1 && A.frets.filter(x => x === A.barre).length > 1)) {
        const d = A.fingers[i] || 0;
        s += `<circle class="dedo-fill d${d}" cx="${xCasa(f)}" cy="${y}" r="10"/><text class="braco-dedo" x="${xCasa(f)}" y="${y + 4}" text-anchor="middle">${d || ''}</text>`;
      }
    });
  }
  if (capo) s += `<text class="braco-capo" x="${x0}" y="10">Capo na ${capo}ª casa: as casas contam a partir dele</text>`;
  return s + '</svg>';
}
// Lista em texto: que dedo vai onde
function dedosHTML(nome) {
  const A = acordePorNome(nome);
  if (!A) return `<li>Acorde <b>${esc(nome)}</b> sem desenho no app.</li>`;
  const itens = [];
  if (A.barre) {
    const cs = A.frets.map((f, i) => f === A.barre ? i : -1).filter(i => i >= 0);
    itens.push(`<li><i class="bola d1">1</i><span>Indicador deitado (pestana) na <b>casa ${A.barre}</b>, da ${NOMES_CORDAS[Math.min(...cs)].split(' ')[0]} à ${NOMES_CORDAS[Math.max(...cs)].split(' ')[0]} corda</span></li>`);
  }
  A.frets.forEach((f, i) => {
    const d = A.fingers[i];
    if (f > 0 && !(A.barre && f === A.barre && d === 1)) itens.push(`<li><i class="bola d${d}">${d}</i><span>${NOMES_DEDOS[d] || 'dedo'}: <b>casa ${f}</b>, corda ${NOMES_CORDAS[i]}</span></li>`);
  });
  const soltas = A.frets.map((f, i) => f === 0 ? LETRAS_CORDAS[i] : null).filter(Boolean);
  const mudas = A.frets.map((f, i) => f < 0 ? LETRAS_CORDAS[i] : null).filter(Boolean);
  if (soltas.length) itens.push(`<li><i class="bola solta">0</i><span>Soltas: ${soltas.join(' ')}</span></li>`);
  if (mudas.length) itens.push(`<li><i class="bola muda">×</i><span>Não tocar: ${mudas.join(' ')}</span></li>`);
  if (A.aproximado) itens.push(`<li class="sub">Desenho simplificado: tocando ${esc(A.aproximado)}</li>`);
  return itens.join('');
}

/* ===== 4. A Estrada (jogo) ===== */
class Estrada {
  /* cfg: { trechos, padrao, bpm, capo, modo:'tela'|'mic', guia, candidatos, aoFim(res),
            gravacao?: { tocador, pos0 (segundo da gravação no 1º acorde), taxa } } */
  constructor(container, cfg) {
    Object.assign(this, cfg);
    this.box = container;
    container.innerHTML = `
      <div class="estrada">
        <div class="estrada-hud">
          <div class="hud-agora"><small>Agora</small><b class="mono" id="e-acorde">—</b></div>
          <div class="hud-prox"><small>Depois</small><b class="mono" id="e-prox">—</b></div>
          <div class="hud-pontos"><small>Pontos</small><b class="mono" id="e-pontos">0</b><span class="hud-combo" id="e-combo"></span></div>
        </div>
        <div class="estrada-palco">
          <span class="mao-chip" id="e-mao">—</span>
          <canvas class="estrada-canvas" id="e-canvas"></canvas>
          <div class="estrada-feedback" id="e-feedback"></div>
          <div class="estrada-contagem" id="e-contagem" hidden></div>
        </div>
        <div class="trilho estrada-prog"><i id="e-prog"></i></div>
        <details class="legenda" ${S.cfg.viuLegenda ? '' : 'open'}><summary>Como ler as bolinhas</summary><div class="legenda-dedos" aria-label="Legenda">
          <span>Número = casa · cor = dedo:</span>
          <span><i class="bola d1">1</i>indicador</span><span><i class="bola d2">2</i>médio</span>
          <span><i class="bola d3">3</i>anelar</span><span><i class="bola d4">4</i>mindinho</span>
          <span><i class="bola solta">0</i>solta</span><span>contorno amarelo = polegar</span>
        </div></details>
      </div>
      <div class="braco-area">
        <div class="braco-box" id="e-braco"></div>
        <div><span class="eyebrow">Mão esquerda</span><ul class="dedos-lista" id="e-dedos"></ul></div>
      </div>`;
    this.canvas = container.querySelector('#e-canvas');
    container.querySelector('.legenda').addEventListener('toggle', () => { S.cfg.viuLegenda = true; });
    this.ctx2d = this.canvas.getContext('2d');
    this.vib = new Float32Array(6);
    this.rodando = false;
  }

  cores() {
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
    this.cor = {
      fundo: v('--estrada-bg'), fundo2: v('--estrada-bg-2'), corda: v('--estrada-corda'), texto: v('--estrada-texto'),
      grade: v('--estrada-grade'), alvo: v('--sun'), acento: v('--accent'), ruim: v('--bad'), bom: v('--good'),
      dedo: ['#888', v('--dedo1'), v('--dedo2'), v('--dedo3'), v('--dedo4')], polegar: v('--sun')
    };
  }
  medir() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.W = w; this.H = h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.labelW = 26;
    this.hitX = this.labelW + (w - this.labelW) * 0.16;
    this.topo = 34; this.base = h - 14;
    this.dy = (this.base - this.topo) / 5;
    const passo = 60 / this.bpm / this.padrao.sub;
    this.pxPorSeg = Math.max((w - this.hitX) / 3.2, 30 / passo);
  }
  yCorda(i) { return this.topo + (5 - i) * this.dy; }
  x(t) { return this.hitX + (t - Som.agora) * this.pxPorSeg; }

  iniciar() {
    Som.init(); Som.pararTudo();
    this.cores(); this.medir();
    const seg = 60 / this.bpm, passo = seg / this.padrao.sub;
    const contagem = this.padrao.beats >= 3 ? this.padrao.beats : 4;
    this.t0 = Som.agora + 0.5 + contagem * seg;
    this.contagemTempos = contagem;
    this.inicioContagem = Som.agora + 0.5;
    const totalTempos = this.trechos.at(-1).inicio + this.trechos.at(-1).tempos;
    this.trechos.forEach(tr => { tr.t = this.t0 + tr.inicio * seg; tr.fim = tr.t + tr.tempos * seg; tr.checado = false; });
    this.notas = [];
    let iTrecho = 0;
    for (let k = 0; k < Math.round(totalTempos * this.padrao.sub); k++) {
      const tok = this.padrao.passos[k % this.padrao.passos.length];
      if (tok === '-') continue;
      const tempo = k / this.padrao.sub;
      while (iTrecho < this.trechos.length - 1 && this.trechos[iTrecho + 1].inicio <= tempo + 1e-6) iTrecho++;
      const tr = this.trechos[iTrecho];
      this.notas.push({ t: this.t0 + k * passo, tok, tr, cordas: cordasDoGolpe(tr.acorde, tok), julgada: false, agendada: false });
    }
    this.cliques = [];
    for (let b = -contagem; b < totalTempos; b++) this.cliques.push({ t: this.t0 + b * seg, forte: b % (this.padrao.beats || 4) === 0, conta: b < 0, agendado: false });
    Object.assign(this, { pontos: 0, combo: 0, maxCombo: 0, perf: 0, bons: 0, erros: 0, foras: 0, desvios: [], ultimoAcerto: -1,
      acordesCertos: 0, acordesChecados: 0, trechoAtual: null, fim: this.notas.at(-1).t + 0.8 });
    this.margemPerda = 0.18 + (this.modo === 'mic' ? Math.max(0, S.cfg.latencia || 0) + 0.08 : 0);
    if (this.modo === 'mic') this.cancelaMic = Detector.aoAtacar(a => this.julgar(a.t - (S.cfg.latencia || 0)));
    this.aoRedimensionar = () => this.medir();
    window.addEventListener('resize', this.aoRedimensionar);
    this.rodando = true;
    window.__estradaAtual = this; // ajuda a depurar pelo console do navegador
    this.mostrarTrecho(this.trechos[0]);
    this.loop();
  }

  /* Vídeo do YouTube como relógio-mestre: o jogo se ajusta ao vídeo.
     erro = quanto o jogo está adiantado em relação ao vídeo.
     Erro grande (vídeo carregando, pulo): o jogo pula junto.
     Erro pequeno: corrige 30% por quadro, sem tranco. */
  seguirVideo(agora) {
    const g = this.gravacao, tc = g.tocador;
    if (!tc.tocando) return;
    const erro = (agora - this.t0) - (tc.posicao - g.pos0) / g.taxa;
    if (Math.abs(erro) > 0.25) this.deslocar(erro);
    else if (Math.abs(erro) > 0.025) this.deslocar(erro * 0.3);
  }
  // Empurra todo o jogo (notas, trechos, cliques) dt segundos para frente
  deslocar(dt) {
    this.t0 += dt; this.fim += dt; this.inicioContagem += dt;
    this.trechos.forEach(tr => { tr.t += dt; tr.fim += dt; });
    this.notas.forEach(n => { n.t += dt; });
    this.cliques.forEach(c => { c.t += dt; });
  }

  parar() {
    this.rodando = false;
    this.gravacao?.tocador.parar();
    cancelAnimationFrame(this.raf);
    this.cancelaMic?.(); this.cancelaMic = null;
    window.removeEventListener('resize', this.aoRedimensionar);
  }

  // Agenda os sons só um pouco à frente (não milhares de uma vez)
  agendarAudio(agora) {
    const ate = agora + 0.25;
    for (const c of this.cliques) {
      if (c.agendado || c.t > ate) continue;
      c.agendado = true;
      // com a gravação tocando, o metrônomo só faz a contagem inicial (e nada, se o vídeo manda)
      if (c.t >= agora - 0.02 && !this.gravacao?.mestre && (!this.gravacao || c.conta)) Som.click(c.t, c.forte, c.conta ? 0.6 : 0.22);
    }
    if (!this.guia) return;
    for (const n of this.notas) {
      if (n.agendada || n.t > ate) continue;
      n.agendada = true;
      if (n.t >= agora - 0.02) Som.golpe(n.tr.acorde, n.t, n.tok, 0.22, this.capo || 0);
    }
  }

  mostrarTrecho(tr) {
    if (this.trechoAtual === tr) return;
    this.trechoAtual = tr;
    const i = this.trechos.indexOf(tr), prox = this.trechos[i + 1];
    const $b = s => this.box.querySelector(s);
    $b('#e-acorde').textContent = tr.acorde;
    $b('#e-prox').textContent = prox ? prox.acorde : 'fim';
    $b('#e-braco').innerHTML = bracoSVG(tr.acorde, prox && prox.acorde !== tr.acorde ? prox.acorde : null, this.capo);
    $b('#e-dedos').innerHTML = dedosHTML(tr.acorde);
  }

  feedback(txt, cls) {
    const f = this.box.querySelector('#e-feedback');
    f.textContent = txt; f.className = 'estrada-feedback ' + cls; void f.offsetWidth; f.classList.add('pop');
  }

  julgar(t) {
    if (!this.rodando || t < this.t0 - 0.25) return;
    let melhor = null;
    for (const n of this.notas) if (!n.julgada && Math.abs(n.t - t) <= 0.18 && (!melhor || Math.abs(n.t - t) < Math.abs(melhor.t - t))) melhor = n;
    if (!melhor) {
      if (this.modo === 'mic' && t - this.ultimoAcerto < 0.2) return;
      this.combo = 0; this.foras++; this.feedback('Fora do tempo', 'ruim'); return;
    }
    const desvio = t - melhor.t, dt = Math.abs(desvio);
    melhor.julgada = true; melhor.acertou = true;
    this.desvios.push(desvio); this.ultimoAcerto = t;
    const [pts, txt, cls] = dt <= 0.06 ? [100, 'Perfeito!', 'otimo'] : dt <= 0.12 ? [60, desvio < 0 ? 'Bom (adiantou)' : 'Bom (atrasou)', 'bom'] : [30, desvio < 0 ? 'Adiantou' : 'Atrasou', 'ok'];
    if (pts === 100) this.perf++; else this.bons++;
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.pontos += pts + Math.min(this.combo, 20) * 2;
    melhor.cordas.forEach(i => { this.vib[i] = 1; });
    this.feedback(this.combo > 3 ? `${txt} ×${this.combo}` : txt, cls);
    this.box.querySelector('#e-pontos').textContent = this.pontos;
    const combo = this.box.querySelector('#e-combo');
    combo.textContent = this.combo >= 4 ? `×${this.combo}` : '';
    if (this.combo >= 4 && this.combo % 4 === 0) { combo.classList.remove('pulsa'); void combo.offsetWidth; combo.classList.add('pulsa'); }
    vibrar(pts === 100 ? 14 : 8);
  }

  // No modo microfone a IA confere se o acorde está certo logo após cada troca
  conferirAcorde(tr) {
    tr.checado = true;
    if (this.modo !== 'mic' || !this.candidatos?.length) return;
    const alvo = nomeNoModelo(tr.acorde);
    if (!alvo) return;
    const r = Detector.reconhecer(this.candidatos);
    if (!r.acorde) return;
    this.acordesChecados++;
    if (r.acorde === alvo) { this.acordesCertos++; this.pontos += 50; this.feedback(`Acorde ${tr.acorde} certo! +50`, 'otimo'); }
    else this.feedback(`Ouvi ${r.acorde}, era ${tr.acorde}`, 'ruim');
  }

  loop() {
    if (!this.rodando) return;
    const agora = Som.agora;
    this.agendarAudio(agora);
    // gravação: onde ela deveria estar agora = pos0 + tempo desde o 1º acorde × velocidade
    if (this.gravacao?.mestre) this.seguirVideo(agora);
    else if (this.gravacao) this.gravacao.tocador.acompanhar(this.gravacao.pos0 + (agora - this.t0) * this.gravacao.taxa, this.gravacao.taxa);
    // contagem regressiva
    const cont = this.box.querySelector('#e-contagem');
    if (agora < this.t0) {
      const n = Math.ceil((this.t0 - agora) / (60 / this.bpm));
      cont.hidden = false; cont.textContent = n <= this.contagemTempos ? n : '';
    } else cont.hidden = true;
    // notas perdidas
    for (const n of this.notas) if (!n.julgada && agora > n.t + this.margemPerda) { n.julgada = true; n.errou = true; this.erros++; this.combo = 0; this.feedback('Passou', 'ruim'); }
    // trecho atual
    const atual = this.trechos.find(tr => agora >= tr.t - 0.05 && agora < tr.fim - 0.05) || (agora < this.t0 ? this.trechos[0] : null);
    if (atual) this.mostrarTrecho(atual);
    for (const tr of this.trechos) if (!tr.checado && agora > tr.t + 0.45 + Math.max(0, S.cfg.latencia || 0)) this.conferirAcorde(tr);
    // próximo golpe (instrução da mão direita)
    const prox = this.notas.find(n => !n.julgada && n.t > agora - 0.1);
    this.box.querySelector('#e-mao').textContent = prox ? NOME_GOLPE[prox.tok] : '—';
    this.box.querySelector('#e-prog').style.width = Math.min(100, Math.max(0, (agora - this.t0) / (this.fim - this.t0) * 100)) + '%';
    this.desenhar(agora);
    if (agora > this.fim + this.margemPerda) return this.terminar();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  desenhar(agora) {
    const c = this.ctx2d, W = this.W, H = this.H, cor = this.cor;
    // fundo de madeira
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, cor.fundo); g.addColorStop(1, cor.fundo2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const seg = 60 / this.bpm, visivelAte = agora + (W - this.hitX) / this.pxPorSeg + 0.3, visivelDe = agora - this.hitX / this.pxPorSeg - 0.3;
    // faixas de cada acorde + nome
    this.trechos.forEach((tr, i) => {
      if (tr.fim < visivelDe || tr.t > visivelAte) return;
      const x1 = Math.max(this.labelW, this.x(tr.t)), x2 = Math.min(W, this.x(tr.fim));
      c.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
      c.fillRect(x1, this.topo - 12, x2 - x1, this.base - this.topo + 24);
      const xn = tr.t < agora && tr.fim > agora ? Math.max(this.labelW + 6, this.x(tr.t) + 6) : this.x(tr.t) + 6;
      c.fillStyle = cor.texto; c.font = '700 15px "IBM Plex Mono", monospace'; c.textBaseline = 'alphabetic';
      if (xn < x2 - 10) c.fillText(tr.acorde, xn, 20);
    });
    // linhas de tempo (compasso mais forte)
    const compasso = this.padrao.beats || 4;
    for (let b = Math.floor((visivelDe - this.t0) / seg); b * seg + this.t0 < visivelAte; b++) {
      const x = this.x(this.t0 + b * seg);
      if (x < this.labelW) continue;
      c.strokeStyle = cor.grade; c.lineWidth = b % compasso === 0 ? 2 : 1; c.globalAlpha = b % compasso === 0 ? 0.9 : 0.4;
      c.beginPath(); c.moveTo(x, this.topo - 8); c.lineTo(x, this.base + 8); c.stroke();
    }
    c.globalAlpha = 1;
    // cordas (vibram quando você acerta)
    for (let i = 0; i < 6; i++) {
      const y = this.yCorda(i), amp = this.vib[i] * 3;
      c.strokeStyle = cor.corda; c.lineWidth = 1 + (5 - i) * 0.35; // 6ª corda (i=0) mais grossa
      c.beginPath();
      for (let x = this.labelW; x <= W; x += 6) c.lineTo(x, y + Math.sin(x * 0.25 + agora * 60) * amp);
      c.stroke();
      this.vib[i] *= 0.9;
      c.fillStyle = cor.texto; c.font = '600 12px "IBM Plex Mono", monospace'; c.textBaseline = 'middle';
      c.fillText(LETRAS_CORDAS[i], 8, y);
    }
    // marca de troca de acorde (portão vertical)
    this.trechos.forEach(tr => {
      const x = this.x(tr.t) - 10;
      if (x < this.labelW || x > W) return;
      c.strokeStyle = cor.alvo; c.globalAlpha = 0.55; c.lineWidth = 2; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(x, 26); c.lineTo(x, this.base + 10); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
    });
    // golpes: em cada corda tocada, a CASA (número) na cor do DEDO
    const r = Math.max(6, Math.min(9, this.dy * 0.42));
    for (const n of this.notas) {
      if (n.t < visivelDe || n.t > visivelAte || !n.cordas.length) continue;
      if (n.acertou && agora - n.t > 0.12) continue;
      const x = this.x(n.t), A = acordePorNome(n.tr.acorde);
      c.globalAlpha = n.errou ? 0.28 : 1;
      const polegar = n.tok === 'B' || n.tok === 'p' || n.tok === 'X';
      const cMin = Math.min(...n.cordas), cMax = Math.max(...n.cordas);
      const yTopo = this.yCorda(cMax), yBase = this.yCorda(cMin);
      // haste do golpe + seta da direção
      c.strokeStyle = n.errou ? cor.ruim : n.acertou ? cor.bom : cor.acento; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, yTopo); c.lineTo(x, yBase); c.stroke();
      c.fillStyle = c.strokeStyle;
      if (n.tok === 'D' || n.tok === 'U') {
        const yp = n.tok === 'D' ? yBase + r + 3 : yTopo - r - 3, s2 = n.tok === 'D' ? 1 : -1;
        c.beginPath(); c.moveTo(x - 5, yp - 4 * s2); c.lineTo(x + 5, yp - 4 * s2); c.lineTo(x, yp + 3 * s2); c.closePath(); c.fill();
      }
      // uma bolinha por corda: número da casa, cor do dedo
      for (const i of n.cordas) {
        const y = this.yCorda(i), f = A ? A.frets[i] : 0, d = A ? A.fingers[i] : 0;
        const ehBaixo = polegar && i === cMin;
        c.fillStyle = f > 0 ? (cor.dedo[d] || cor.acento) : '#2a2018';
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (ehBaixo) { c.strokeStyle = cor.polegar; c.lineWidth = 2.5; c.stroke(); }
        else if (f === 0) { c.strokeStyle = cor.corda; c.lineWidth = 1.5; c.stroke(); }
        c.fillStyle = '#fff'; c.font = `700 ${Math.round(r * 1.25)}px "IBM Plex Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(Math.max(0, f)), x, y + 0.5);
      }
      // dedilhado: letra da mão direita embaixo
      if ('pima'.includes(n.tok) && n.tok.length === 1) {
        c.fillStyle = cor.polegar; c.font = '700 10px "IBM Plex Mono", monospace'; c.textAlign = 'center';
        c.fillText(n.tok, x, this.base + 9);
      }
      c.globalAlpha = 1; c.textAlign = 'start'; c.lineCap = 'butt';
    }
    // linha de ataque
    c.strokeStyle = cor.alvo; c.lineWidth = 3; c.shadowColor = cor.alvo; c.shadowBlur = 10;
    c.beginPath(); c.moveTo(this.hitX, this.topo - 16); c.lineTo(this.hitX, this.base + 12); c.stroke();
    c.shadowBlur = 0;
    // máscara à esquerda das letras
    c.fillStyle = cor.fundo; c.globalAlpha = 0.85; c.fillRect(0, 0, this.labelW - 4, H); c.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { c.fillStyle = cor.texto; c.font = '600 12px "IBM Plex Mono", monospace'; c.textBaseline = 'middle'; c.fillText(LETRAS_CORDAS[i], 8, this.yCorda(i)); }
  }
  retRedondo(x, y, w, h, r) {
    const c = this.ctx2d; r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  terminar() {
    this.parar();
    const n = this.notas.length;
    const pct = Math.round((this.perf * 100 + this.bons * 60) / (n * 100) * 100);
    const media = this.desvios.length >= 4 ? Math.round(this.desvios.reduce((a, b) => a + b, 0) / this.desvios.length * 1000) : null;
    this.aoFim?.({ pct, pontos: this.pontos, maxCombo: this.maxCombo, perf: this.perf, erros: this.erros, foras: this.foras, media, notas: n,
      acordesCertos: this.acordesCertos, acordesChecados: this.acordesChecados });
  }
}

// Nome do acorde que a rede neural conhece (ou um parecido)
function nomeNoModelo(nome) {
  if (!IA.modelo) return chordById(nome) ? nome : null;
  const cls = IA.modelo.classes;
  if (cls.includes(nome)) return nome;
  const a = acordePorNome(nome);
  if (a && a.aproximado && cls.includes(a.aproximado)) return a.aproximado;
  return null;
}

/* ===== 5. Prévia: violão + baixo + percussão ===== */
const Previa = {
  tocando: null, timer: null,
  _ruido: null,
  ruido() {
    if (this._ruido) return this._ruido;
    const b = Som.ctx.createBuffer(1, Math.floor(Som.ctx.sampleRate * 0.08), Som.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    return (this._ruido = b);
  },
  ganza(t, vol) {
    const s = Som.ctx.createBufferSource(); s.buffer = this.ruido();
    const f = Som.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
    const g = Som.ctx.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(Som.master); s.start(t); Som.fontes.push(s);
  },
  surdo(t, vol) {
    const o = Som.ctx.createOscillator(), g = Som.ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(Som.master); o.start(t); o.stop(t + 0.4); Som.fontes.push(o);
  },
  baixo(acorde, t, capo) {
    const p = partesAcorde(acorde);
    if (!p) return;
    const pc = p.baixo ? RAIZ_PC[p.baixo] : p.pc;
    const midi = 40 + ((pc - 4 + 12) % 12) + (capo || 0);
    Som.nota(440 * Math.pow(2, (midi - 69) / 12), t, 0.5);
  },
  // Toca até "segundos" da música. aoAcorde(trecho) avisa a tela.
  tocar(musica, { segundos = 24, bpm = musica.bpm, aoAcorde, aoFim } = {}) {
    this.parar();
    Som.init();
    const padrao = patternById(musica.padrao), seg = 60 / bpm, passo = seg / padrao.sub;
    const trechos = musicaParaTrechos(musica);
    const t0 = Som.agora + 0.15;
    const total = Math.min(segundos, duracaoMusica(musica, bpm));
    let k = 0, iTr = 0;
    const estado = { musica, fim: t0 + total };
    this.tocando = estado;
    const agendar = () => {
      if (this.tocando !== estado) return;
      while (t0 + k * passo < Som.agora + 0.2) {
        const t = t0 + k * passo, tempo = k / padrao.sub;
        if (t > estado.fim) { const fim = () => { if (this.tocando === estado) { this.parar(); aoFim?.(); } }; setTimeout(fim, (estado.fim - Som.agora + 0.3) * 1000); clearInterval(this.timer); return; }
        while (iTr < trechos.length - 1 && trechos[iTr + 1].inicio <= tempo + 1e-6) iTr++;
        const tr = trechos[iTr];
        if (Math.abs(tempo - tr.inicio) < 1e-6) { this.baixo(tr.acorde, t, musica.capo); quandoTocar(t, () => { if (this.tocando === estado) aoAcorde?.(tr); }); }
        const tok = padrao.passos[k % padrao.passos.length];
        if (tok !== '-') Som.golpe(tr.acorde, t, tok, 0.2, musica.capo || 0);
        this.ganza(t, k % 2 ? 0.05 : 0.09);
        if (k % (padrao.sub * 2) === padrao.sub) this.surdo(t, 0.5);       // surdo no 2º tempo
        if (k % (padrao.sub * 2) === 0) this.surdo(t, 0.25);
        k++;
      }
    };
    agendar();
    this.timer = setInterval(agendar, 40);
    return estado;
  },
  parar() {
    clearInterval(this.timer);
    if (this.tocando) { const t = this.tocando; this.tocando = null; t.parar?.(); Som.pararTudo(); }
  }
};
