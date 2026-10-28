/* =========================================================
   TOCA AÍ — acordes.js
   1. Acordes por nome: acha o desenho de QUALQUER acorde
      (inclusive os que não estão no data.js, gerando pestana).
   2. Acordes fáceis: troca cada acorde pela forma mais fácil.
   3. Músicas: transforma as seções em uma linha do tempo.
   4. Notas de um acorde (para o microfone saber o que esperar).
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
  // a qualidade pode ter barras dentro de parênteses: D7(4/9)
  const m = normalizarAcorde(nome).match(/^([A-G](?:#|b)?)((?:[^/(]|\([^)]*\))*)(?:\/([A-G](?:#|b)?))?$/);
  return m ? { raiz: m[1], qual: m[2], baixo: m[3] || null, pc: RAIZ_PC[m[1]] } : null;
}

// Extensões viram a versão mais simples que ainda soa parecido.
// Na cifra brasileira "A9" é o Lá com nona (add9): vira Lá maior.
const SIMPLIFICACOES = [
  [/^(7\(9\)|7\(13\)|7\(4\)|7sus4|7\(b9\)|7\(#9\)|7\(#11\)|7\(b13\)|7\(9\/13\)|7\(4\/9\)|13|11)$/, '7'],
  [/^(m7\(9\)|m9|m7\(11\)|m11)$/, 'm7'],
  [/^(7M\(9\)|7M\(13\)|7M\(#11\))$/, '7M'],
  [/^(m7\(b5\)|ø|°7)$/, '°'],
  [/^(m6|m\(9\)|madd9|m7M|m\(7M\)|m6\(9\))$/, 'm'],
  [/^(9|6|6\(9\)|add9|\(9\)|sus2|sus4|4|\+|aug|5|5\(9\))$/, ''],
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
      const qual = p.qual;
      const tentativas = [qual];
      for (const [re, troca] of SIMPLIFICACOES) if (re.test(qual)) { tentativas.push(troca); break; }
      const familia = qual.startsWith('m') && !qual.startsWith('7M') ? 'm' : '';
      if (!tentativas.includes(familia)) tentativas.push(familia);
      for (const q of tentativas) {
        for (const rz of raizes) { const c = achar(rz + q); if (c) { r = { ...c, id: nome, aproximado: q !== qual || p.baixo ? c.id : null }; break; } }
        if (r) break;
        const g = gerarForma(p.pc, q);
        if (g) { r = { ...g, id: nome, aproximado: q !== qual || p.baixo ? p.raiz + q : null, gerado: true }; break; }
      }
    }
  }
  _cacheAcordes.set(nome, r || null);
  return r || null;
}
const chordById = id => acordePorNome(id);

/* ===== 2. Acordes fáceis =====
   Troca cada acorde pela forma MAIS FÁCIL da mesma família
   (como o "Simplify chords" do Chordify). Custo = dedos usados
   + 3 se tem pestana + 2 se o desenho foi gerado pelo app.
   Ex.: E7(9) -> E7, Bm -> Bm7, F -> F7M (dica clássica de professor:
   o F7M soa parecido e não tem pestana). */
function custoAcorde(a) {
  if (!a) return 99;
  const dedos = new Set(a.frets.map((f, i) => (f > 0 ? a.fingers[i] || 1 : 0)).filter(Boolean)).size;
  return dedos + (a.barre ? 3 : 0) + (a.gerado ? 2 : 0);
}
function simplificar(nome) {
  const p = partesAcorde(nome);
  if (!p) return nome;
  // acorde que já é fácil (desenho aberto, até 3 dedos) fica como está
  const original = acordePorNome(nome);
  if (original && !original.barre && !original.gerado && !original.aproximado && custoAcorde(original) <= 3) return nome;
  const q = p.qual, menor = q.startsWith('m') && !q.startsWith('7M');
  const cands = [nome];
  for (const [re, troca] of SIMPLIFICACOES) if (re.test(q)) cands.push(p.raiz + troca);
  if (p.baixo) cands.push(p.raiz + q);                              // G/B -> G
  if (menor) cands.push(p.raiz + 'm', p.raiz + 'm7');
  else if (/7/.test(q) && !q.startsWith('7M')) cands.push(p.raiz + '7');
  else { cands.push(p.raiz); if (q === '' || q === '9' || q === 'add9') cands.push(p.raiz + '7M'); }
  // desenho aproximado (ex.: G/B mostrado como G): o nome exato do desenho ganha no empate
  let melhor = nome, custo = custoAcorde(original) + (original && original.aproximado ? 0.5 : 0);
  for (const c of cands) {
    const ac = acordePorNome(c);
    const k = custoAcorde(ac) + (ac && ac.aproximado ? 0.5 : 0) + (c.endsWith('7M') && !q.startsWith('7M') ? 1 : 0); // 7M só se ajudar muito
    if (k < custo) { melhor = c; custo = k; }
  }
  return melhor;
}

/* ===== 3. Músicas -> linha do tempo ===== */
// "Am7:2 Bm7:2 Em:4" -> [{acorde:'Am7', tempos:2}, ...]
function lerSequencia(seq, temposPadrao = 4) {
  return String(seq || '').replace(/[|,;]/g, ' ').split(/\s+/).filter(Boolean).map(tok => {
    const i = tok.lastIndexOf(':');
    const a = i > 0 ? tok.slice(0, i) : tok, t = i > 0 ? tok.slice(i + 1) : '';
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
function totalTempos(musica) { const t = musicaParaTrechos(musica); return t.length ? t.at(-1).inicio + t.at(-1).tempos : 0; }
function duracaoMusica(musica, bpm = musica.bpm) { return totalTempos(musica) * 60 / bpm; }
function dificuldade(musica) {
  const acs = [...new Set(acordesUnicos(musica).map(simplificar))].map(acordePorNome);
  const pestanas = acs.filter(a => a && a.barre).length;
  const semForma = acs.filter(a => !a).length;
  if (pestanas + semForma >= 2 || acs.length > 8) return 'Difícil';
  if (pestanas || acs.length > 5) return 'Médio';
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
    case 'T': return tocadas;
    case 'i': return [3]; case 'm': return [4]; case 'a': return [5];
  }
  return [];
}
const NOME_GOLPE = {
  D: 'Para baixo', U: 'Para cima', B: 'Polegar no baixo', F: 'Dedos juntos',
  X: 'Polegar e dedos', T: 'Tapa abafado', p: 'Polegar', i: 'Indicador', m: 'Médio', a: 'Anelar'
};
const NOMES_DEDOS = ['', 'indicador', 'médio', 'anelar', 'mindinho'];
const NOMES_CORDAS = ['6ª (Mi grave)', '5ª (Lá)', '4ª (Ré)', '3ª (Sol)', '2ª (Si)', '1ª (Mi agudo)'];
const LETRAS_CORDAS = ['E', 'A', 'D', 'G', 'B', 'e'];

/* ===== 4. Notas de um acorde =====
   Cada corda solta tem uma nota (MIDI 40 = Mi grave). Apertar a casa f
   sobe f semitons. O capotraste sobe todas as cordas junto. */
function notasDoAcorde(nome, capo = 0) {
  const a = acordePorNome(nome);
  if (!a) return [];
  return a.frets.map((f, i) => (f < 0 ? null : MIDI_SOLTAS[i] + f + capo)).filter(n => n !== null);
}

// Nome do acorde que a rede neural conhece (ou um parecido)
function nomeNoModelo(nome) {
  if (typeof IA === 'undefined' || !IA.modelo) return null;
  const cls = IA.modelo.classes;
  if (cls.includes(nome)) return nome;
  const a = acordePorNome(nome);
  if (a && a.aproximado && cls.includes(a.aproximado)) return a.aproximado;
  return null;
}

// Nome por extenso: "Am" -> "Lá menor"
const NOTAS_PT = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
function nomeAcorde(id) {
  const m = String(id).match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return id;
  const nome = NOTAS_PT[m[1]] + (m[2] === '#' ? ' sustenido' : m[2] === 'b' ? ' bemol' : '');
  const mapa = { '': ' maior', m: ' menor', '7': ' com sétima', m7: ' menor com sétima', '7M': ' com sétima maior', '°': ' diminuto', 'm7(b5)': ' meio-diminuto' };
  return nome + (mapa[m[3]] ?? ' ' + m[3]);
}
