/* =========================================================
   TOCA AÍ — aprender.js
   Tudo o que ENSINA, no estilo dos apps de violão para iniciantes:
   1. Desenho de acorde para iniciante (cordas com nome, cor por dedo)
   2. Professor de acordes: ensina DEDO A DEDO
   3. Player de lições: uma ideia por tela, botão "Continuar"
   4. Treino "1 minuto de trocas" e mini afinador
   5. Telas: Início, Aprender, Acordes e boas-vindas
   ========================================================= */
'use strict';

const ORD = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
const NOME_CORDA = ['Mi grave', 'Lá', 'Ré', 'Sol', 'Si', 'Mi agudo'];
const icone = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
const IC = {
  play: icone('<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>'),
  som: icone('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mic: icone('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  check: icone('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  voltar: icone('<path d="M15 5l-7 7 7 7"/>'),
  seta: icone('<path d="M9 5l7 7-7 7"/>'),
  nota: icone('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  relogio: icone('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  fogo: icone('<path d="M12 3c1.5 4 6 5.5 6 11a6 6 0 0 1-12 0c0-2.8 1.5-4.2 2.6-5.6.4 1.8 1.4 2.8 2.4 3.2C11 8.6 11 5.6 12 3z" fill="currentColor" stroke="none"/>'),
  engrenagem: icone('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  fechar: icone('<path d="M6 6l12 12M18 6L6 18"/>')
};

/* ===== 1. Desenho de acorde =====
   Como o violão em pé na sua frente: 6ª corda (mais grossa) à esquerda.
   passo: mostra só os dedos até esse passo (o atual pisca). */
function passosDoAcorde(nome) {
  const a = acordePorNome(nome);
  if (!a) return [];
  const out = [];
  if (a.barre) {
    const cs = a.frets.map((f, i) => (f === a.barre ? i : -1)).filter(i => i >= 0);
    if (cs.length > 1) out.push({ dedo: 1, casa: a.barre, cordas: cs, pestana: true });
  }
  a.frets.forEach((f, i) => {
    const d = a.fingers[i] || 1;
    if (f > 0 && !(out[0]?.pestana && f === a.barre && d === 1)) out.push({ dedo: d, casa: f, cordas: [i] });
  });
  // agrupa o mesmo dedo em várias cordas (ex.: dedo 3 deitado)
  const junto = [];
  for (const p of out.sort((x, y) => x.dedo - y.dedo || x.cordas[0] - y.cordas[0])) {
    const ant = junto.at(-1);
    if (ant && !ant.pestana && ant.dedo === p.dedo && ant.casa === p.casa) ant.cordas.push(...p.cordas);
    else junto.push({ ...p, cordas: [...p.cordas] });
  }
  return junto;
}
function textoPasso(p) {
  const nome = `<b>Dedo ${p.dedo}</b> (${NOMES_DEDOS[p.dedo] || 'dedo'})`;
  if (p.pestana || p.cordas.length > 1) {
    const de = Math.min(...p.cordas), ate = Math.max(...p.cordas);
    return `${nome} <b>deitado</b> na <b>casa ${p.casa}</b>, cobrindo da ${ORD[de]} à ${ORD[ate]} corda.`;
  }
  const c = p.cordas[0];
  return `${nome} na <b>casa ${p.casa}</b> da <b>${ORD[c]} corda</b> (${NOME_CORDA[c]}).`;
}
function diagramaAcorde(nome, { tam = 'md', passo = null, rotulos = true } = {}) {
  const a = acordePorNome(nome);
  if (!a) return `<div class="diag-vazio diag-${tam}">${esc(nome)}</div>`;
  const W = 170, x0 = 30, dx = 22, y0 = 34, dy = 34, casas = 4, H = y0 + casas * dy + (rotulos ? 30 : 10);
  const usadas = a.frets.filter(f => f > 0);
  const base = usadas.length && Math.max(...usadas) > casas ? Math.min(...usadas) : 1;
  const passos = passosDoAcorde(nome);
  const visivel = k => passo === null || k <= passo;
  const xC = i => x0 + i * dx, yF = f => y0 + (f - base + 0.5) * dy;
  let s = `<svg class="diag diag-${tam}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Acorde ${esc(nome)}">`;
  for (let k = 0; k <= casas; k++) s += `<line class="${k === 0 && base === 1 ? 'dg-pestana' : 'dg-traste'}" x1="${x0}" x2="${x0 + 5 * dx}" y1="${y0 + k * dy}" y2="${y0 + k * dy}"/>`;
  for (let i = 0; i < 6; i++) s += `<line class="dg-corda" style="stroke-width:${2.4 - i * 0.28}" x1="${xC(i)}" x2="${xC(i)}" y1="${y0}" y2="${y0 + casas * dy}"/>`;
  if (base > 1) s += `<text class="dg-casa" x="${x0 - 9}" y="${yF(base) + 4}" text-anchor="end">${base}ª</text>`;
  a.frets.forEach((f, i) => {
    if (f < 0) s += `<text class="dg-x" x="${xC(i)}" y="${y0 - 11}" text-anchor="middle">×</text>`;
    else if (f === 0) s += `<circle class="dg-solta" cx="${xC(i)}" cy="${y0 - 15}" r="5.5"/>`;
  });
  passos.forEach((p, k) => {
    if (!visivel(k)) return;
    const atual = passo !== null && k === passo, cls = `dg-dedo d${p.dedo}${atual ? ' dg-atual' : ''}`;
    if (p.cordas.length > 1) {
      const x1 = xC(Math.min(...p.cordas)), x2 = xC(Math.max(...p.cordas));
      s += `<rect class="${cls}" x="${x1 - 10}" y="${yF(p.casa) - 10}" width="${x2 - x1 + 20}" height="20" rx="10"/>`;
      s += `<text class="dg-num" x="${(x1 + x2) / 2}" y="${yF(p.casa) + 4.5}" text-anchor="middle">${p.dedo}</text>`;
    } else {
      s += `<circle class="${cls}" cx="${xC(p.cordas[0])}" cy="${yF(p.casa)}" r="10.5"/>`;
      s += `<text class="dg-num" x="${xC(p.cordas[0])}" y="${yF(p.casa) + 4.5}" text-anchor="middle">${p.dedo}</text>`;
    }
  });
  if (rotulos) LETRAS_CORDAS.forEach((l, i) => { s += `<text class="dg-rot" x="${xC(i)}" y="${y0 + casas * dy + 20}" text-anchor="middle">${l === 'e' ? 'E' : l}</text>`; });
  return s + '</svg>';
}
function descricaoAcorde(nome) {
  const n = passosDoAcorde(nome).length;
  return `${nomeAcorde(nome)} · ${n} ${n === 1 ? 'dedo' : 'dedos'}`;
}
// Toca corda por corda (ajuda a achar a corda abafada)
function tocarCordaPorCorda(nome) {
  const a = acordePorNome(nome);
  if (!a) return;
  Som.init();
  let t = Som.agora + 0.05;
  a.frets.forEach((f, i) => { if (f >= 0) { Som.nota(CORDAS_SOLTAS[i] * Math.pow(2, f / 12), t, 0.4); t += 0.45; } });
}
function ouvirAcorde(nome) { Som.init(); Som.golpe(nome, Som.agora + 0.03, 'D', 0.35); }

/* ===== Acordes aprendidos (pelas lições concluídas ou marcados à mão) ===== */
function acordesAprendidos() {
  const set = new Set(S.acordesSei || []);
  for (const l of LESSONS) if (S.licoes[l.id]) l.passos.forEach(p => { if (p.t === 'acorde') set.add(p.acorde); });
  return set;
}
function seiAcorde(nome) {
  const sei = acordesAprendidos();
  return sei.has(nome) || sei.has(simplificar(nome));
}
// Lição que ensina um acorde
function licaoDoAcorde(nome) { return LESSONS.find(l => l.passos.some(p => p.t === 'acorde' && (p.acorde === nome || p.acorde === simplificar(nome)))); }

/* ===== 2. Professor de acordes (dedo a dedo) ===== */
function ensinarAcorde(caixa, nome, { aoCompletar } = {}) {
  const passos = passosDoAcorde(nome), a = acordePorNome(nome);
  const total = passos.length + 1; // + passo final "toque"
  let k = 0, completou = false;
  const primeira = a ? a.frets.findIndex(f => f >= 0) : 0;
  caixa.innerHTML = `
    <div class="ens">
      <div class="ens-topo"><b class="ens-nome">${esc(nome)}</b><span class="sub">${esc(descricaoAcorde(nome))}</span></div>
      <div class="ens-diag" id="ens-diag"></div>
      <div class="ens-bolinhas" id="ens-bolinhas">${Array.from({ length: total }, () => '<i></i>').join('')}</div>
      <p class="ens-texto" id="ens-texto" aria-live="polite"></p>
      <div class="ens-acoes">
        <button class="btn btn-ic" id="ens-volta" aria-label="Passo anterior">${IC.voltar}</button>
        <button class="btn" id="ens-ouvir">${IC.som} Ouvir</button>
        <button class="btn primario" id="ens-prox">Próximo ${IC.seta}</button>
      </div>
      <div class="ens-final" id="ens-final" hidden>
        <button class="btn" id="ens-corda">${IC.som} Corda por corda</button>
        <button class="btn" id="ens-mic">${IC.mic} Conferir no microfone</button>
      </div>
      <p class="ens-res" id="ens-res"></p>
    </div>`;
  const q = s => caixa.querySelector(s);
  const mostrar = () => {
    const final = k >= passos.length;
    q('#ens-diag').innerHTML = diagramaAcorde(nome, { tam: 'xl', passo: final ? null : k });
    q('#ens-texto').innerHTML = final
      ? `Agora toque as cordas de cima para baixo, começando pela <b>${ORD[primeira]} corda</b>${a.frets.some(f => f < 0) ? ' (pule as que têm ×)' : ''}. Todas devem soar limpas.`
      : `<span class="ens-passo">Passo ${k + 1} de ${passos.length}</span> ${textoPasso(passos[k])}`;
    q('#ens-final').hidden = !final;
    q('#ens-prox').hidden = final;
    q('#ens-volta').disabled = k === 0;
    caixa.querySelectorAll('#ens-bolinhas i').forEach((b, j) => { b.classList.toggle('feito', j < k); b.classList.toggle('on', j === k); });
    if (final && !completou) { completou = true; aoCompletar?.(); }
  };
  q('#ens-prox').addEventListener('click', () => { k = Math.min(passos.length, k + 1); mostrar(); });
  q('#ens-volta').addEventListener('click', () => { k = Math.max(0, k - 1); mostrar(); q('#ens-res').textContent = ''; });
  q('#ens-ouvir').addEventListener('click', () => ouvirAcorde(nome));
  q('#ens-corda').addEventListener('click', () => tocarCordaPorCorda(nome));
  q('#ens-mic').addEventListener('click', () => conferirAcordeMic(nome, q('#ens-res'), q('#ens-mic')));
  mostrar();
}
// Escuta uma batida e diz se soou como o acorde pedido (usa a IA de reconhecimento)
async function conferirAcordeMic(nome, saida, botao) {
  if (!IA.modelo) { saida.textContent = 'O reconhecimento de acordes não carregou.'; return; }
  try { await Detector.ligar(); } catch (e) { saida.textContent = msgSemMicrofone(e); return; }
  botao.disabled = true;
  saida.className = 'ens-res'; saida.textContent = 'Ouvindo… toque o acorde uma vez e deixe soar.';
  const alvo = nomeNoModelo(nome);
  let feito = false;
  const fim = setTimeout(() => { if (!feito) { cancela(); botao.disabled = false; saida.textContent = 'Não ouvi nada. Toque mais forte, perto do celular.'; } }, 8000);
  const cancela = Detector.aoAtacar(() => {
    if (feito) return;
    feito = true; cancela(); clearTimeout(fim);
    const leituras = [];
    [200, 300, 400, 500].forEach(ms => setTimeout(() => {
      const r = Detector.ouvirIA();
      if (r && !r.silencio) leituras.push(r.probs);
      if (ms !== 500) return;
      botao.disabled = false;
      if (!leituras.length) { saida.textContent = 'Som muito baixo. Toque mais forte, perto do celular.'; return; }
      const media = {};
      for (const p of leituras) for (const [c, v] of Object.entries(p)) media[c] = (media[c] || 0) + v / leituras.length;
      const [venc] = Object.entries(media).sort((x, y) => y[1] - x[1])[0];
      if (venc === alvo) { saida.className = 'ens-res ok'; saida.innerHTML = `${IC.check} Soou como <b>${esc(nome)}</b>! Muito bem.`; vibrar([15, 50, 15]); }
      else if (venc === 'nenhum') saida.textContent = 'Não reconheci um acorde. Alguma corda pode estar abafada: use "Corda por corda" e compare.';
      else saida.innerHTML = `Soou parecido com <b>${esc(venc)}</b>. Confira cada dedo e se as cordas soltas estão soando.`;
    }, ms));
  });
}

/* ===== 3. Player de lições ===== */
function unidadeDaLicao(id) { return CURSO.find(u => u.licoes.some(l => l.id === id)); }
function proximaLicao() { return LESSONS.find(l => !S.licoes[l.id]); }
function licaoLiberada() { return true; } // nada trancado: o app só SUGERE a ordem

function abrirLicao(id) {
  const l = lessonById(id), u = unidadeDaLicao(id);
  let i = 0, limpar = null;
  abrirJanela(l.titulo, `
    <div class="lc">
      <div class="lc-prog" aria-hidden="true"><i id="lc-barra"></i></div>
      <div class="lc-passo" id="lc-passo"></div>
      <div class="lc-rodape"><button class="btn primario largo grande" id="lc-cont">Continuar</button></div>
    </div>`, () => { limpar?.(); limpar = null; });
  $('#janela').classList.add('cheia');
  const area = $('#lc-passo'), cont = $('#lc-cont');
  const mostrar = () => {
    limpar?.(); limpar = null;
    const p = l.passos[i];
    $('#lc-barra').style.width = (i / l.passos.length * 100) + '%';
    cont.disabled = false; cont.textContent = 'Continuar';
    area.innerHTML = '';
    area.classList.remove('entrar'); void area.offsetWidth; area.classList.add('entrar');
    $('#janela-corpo').scrollTop = 0;
    limpar = PASSOS[p.t](area, p, { cont, l, u }) || null;
  };
  let acaoFinal = null;   // depois de concluir, o botão leva à próxima coisa
  cont.addEventListener('click', () => {
    if (cont.disabled) return;
    if (acaoFinal) return acaoFinal();
    if (i < l.passos.length - 1) { i++; mostrar(); }
    else acaoFinal = concluirLicao(l, u, area, cont, () => { limpar?.(); limpar = null; });
  });
  mostrar();
}

const PASSOS = {
  texto(area, p) {
    area.innerHTML = `<div class="ps-texto">${p.visual ? `<div class="ps-visual">${VISUAIS[p.visual]?.() || ''}</div>` : ''}<h3>${esc(p.titulo)}</h3><p>${p.texto}</p></div>`;
  },
  acorde(area, p, { cont }) {
    cont.textContent = 'Continuar';
    ensinarAcorde(area, p.acorde, { aoCompletar: () => { cont.textContent = 'Já sei, continuar'; } });
  },
  quiz(area, p, { cont }) {
    cont.disabled = true;
    area.innerHTML = `<div class="ps-quiz"><h3>${esc(p.pergunta)}</h3><div class="ps-opcoes">${p.opcoes.map((o, k) => `<button class="btn opcao2" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="ps-explica" id="ps-explica"></p></div>`;
    area.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const certo = +b.dataset.k === p.certa;
      area.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (+x.dataset.k === p.certa) x.classList.add('certa'); else if (x === b) x.classList.add('errada'); });
      area.querySelector('#ps-explica').innerHTML = `<b>${certo ? 'Isso!' : 'Quase.'}</b> ${esc(p.explica)}`;
      vibrar(certo ? 15 : [10, 40, 10]);
      cont.disabled = false;
    }));
  },
  troca(area, p) { return trocaUmMinuto(area, p.a, p.b); },
  afinar(area) { return miniAfinador(area); },
  tocar(area, p, { cont }) {
    const m = p.musica ? acharMusica(p.musica) : null;
    const trechos = m ? musicaParaTrechos(m, p.secao ?? null) : lerSequencia(p.seq).reduce((acc, x) => { acc.push({ ...x, inicio: acc.length ? acc.at(-1).inicio + acc.at(-1).tempos : 0, secao: '' }); return acc; }, []);
    const padrao = patternById(p.padrao || m?.padrao || 'quatro');
    const bpmBase = p.bpm || (m ? Math.round(m.bpm * 0.7) : 66);
    const titulo = p.titulo || (m ? `${m.titulo}${p.secao != null ? ' · ' + m.secoes[p.secao].nome : ''}` : 'Toque junto');
    cont.textContent = 'Pular';
    let parar = null;
    area.innerHTML = `
      <div class="ps-tocar">
        <h3>${esc(titulo)}</h3>
        ${m?.capo ? `<p class="sub">Capotraste na ${m.capo}ª casa (opcional)</p>` : ''}
        <div id="ps-pista"><div class="ps-inicio"><p class="sub">Siga o acorde de cima e bata nas cordas quando a seta cruzar a linha verde. Comece devagar.</p>
          <div class="segmentado" role="radiogroup" aria-label="Velocidade">${[['lento', 'Devagar'], ['medio', 'Normal']].map(([k, n]) => `<button type="button" role="radio" aria-checked="${(S.cfg.velLicao || 'lento') === k}" data-vl="${k}"><b>${n}</b></button>`).join('')}</div>
          <button class="btn primario largo grande" id="ps-play">${IC.play} Começar</button></div></div>
      </div>`;
    area.querySelectorAll('[data-vl]').forEach(b => b.addEventListener('click', () => { S.cfg.velLicao = b.dataset.vl; area.querySelectorAll('[data-vl]').forEach(x => x.setAttribute('aria-checked', x === b)); }));
    area.querySelector('#ps-play').addEventListener('click', async () => {
      const bpm = Math.round(bpmBase * ((S.cfg.velLicao || 'lento') === 'lento' ? 0.8 : 1));
      const pista = area.querySelector('#ps-pista');
      pista.innerHTML = '<div id="ps-estrada"></div>';
      parar = await iniciarEstrada(pista.querySelector('#ps-estrada'), {
        trechos, padrao, bpm, capo: 0, ritmo: p.ritmo || 'tempos', modo: 'livre', facil: true,
        aoFim: () => {
          parar?.(); parar = null;
          cont.textContent = 'Continuar';
          pista.innerHTML = `<div class="ps-fim">${IC.check}<b>Você tocou até o fim!</b><button class="btn" id="ps-denovo">Tocar de novo</button></div>`;
          pista.querySelector('#ps-denovo').addEventListener('click', () => PASSOS.tocar(area, p, { cont }));
        }
      });
    });
    return () => parar?.();
  }
};

// Ilustrações dos passos de texto
const VISUAIS = {
  violao: () => `<svg class="vis" viewBox="0 0 300 150" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(i => `<line class="dg-corda" style="stroke-width:${4 - i * 0.55}" x1="${30 + i * 48}" x2="${30 + i * 48}" y1="10" y2="100"/><text class="vis-ord" x="${30 + i * 48}" y="122" text-anchor="middle">${ORD[i]}</text><text class="vis-nome" x="${30 + i * 48}" y="140" text-anchor="middle">${'EADGBE'[i]} · ${NOME_CORDA[i].split(' ')[0]}</text>`).join('')}</svg>`,
  casas: () => `<svg class="vis" viewBox="0 0 300 160" aria-hidden="true"><text class="vis-nome" x="150" y="14" text-anchor="middle">cabeça do violão (tarraxas) ↑</text><line class="dg-pestana" x1="40" x2="260" y1="26" y2="26"/>${[1, 2, 3, 4].map(k => `<line class="dg-traste" x1="40" x2="260" y1="${26 + k * 30}" y2="${26 + k * 30}"/><text class="vis-ord" x="270" y="${26 + k * 30 - 10}">casa ${k}</text>`).join('')}${[0, 1, 2, 3, 4, 5].map(i => `<line class="dg-corda" x1="${40 + i * 44}" x2="${40 + i * 44}" y1="26" y2="146"/>`).join('')}<text class="vis-nome" x="34" y="60" text-anchor="end">traste →</text></svg>`,
  maos: () => `<div class="vis-dedos">${[1, 2, 3, 4].map(d => `<span><i class="bola d${d}">${d}</i>${NOMES_DEDOS[d]}</span>`).join('')}</div>`,
  diagrama: () => `<div class="vis-diag">${diagramaAcorde('Am7', { tam: 'lg' })}<ul><li><span class="vis-o"></span> corda solta</li><li><span class="vis-x">×</span> não toca</li><li><i class="bola d1">1</i> dedo 1 aqui</li><li><b>E A D G B E</b> = cordas</li></ul></div>`,
  batida: () => `<div class="vis-batida">${['1', '2', '3', '4'].map(n => `<span><b>↓</b><small>${n}</small></span>`).join('')}</div>`,
  batida2: () => `<div class="vis-batida">${['1', 'e', '2', 'e', '3', 'e', '4', 'e'].map((n, k) => `<span class="${k % 2 ? 'cima' : ''}"><b>${k % 2 ? '↑' : '↓'}</b><small>${n}</small></span>`).join('')}</div>`
};

function concluirLicao(l, u, area, cont, limpar) {
  limpar();
  const novo = !S.licoes[l.id];
  S.licoes[l.id] = true;
  if (novo) { registrar('licoes', 1); ganharXP(20, 'lição concluída', true); }
  Store.salvar();
  $('#lc-barra').style.width = '100%';
  const prox = LESSONS[LESSONS.findIndex(x => x.id === l.id) + 1];
  const musica = l.musicaFinal && u.musica ? acharMusica(u.musica) : null;
  const acordesNovos = l.passos.filter(p => p.t === 'acorde').map(p => p.acorde);
  area.innerHTML = `
    <div class="ps-fim grande">
      <span class="fim-check">${IC.check}</span>
      <h3>Lição concluída!</h3>
      ${acordesNovos.length ? `<p>Você aprendeu: <b>${acordesNovos.join(', ')}</b></p>` : ''}
      ${musica ? `<p>Você já consegue tocar <b>${esc(musica.titulo)}</b>. Toque com a gravação original na aba Músicas.</p>` : ''}
    </div>`;
  vibrar([20, 60, 20]);
  cont.textContent = musica ? `Tocar ${musica.titulo}` : prox ? `Próxima: ${prox.titulo}` : 'Voltar';
  return () => {
    fecharJanela();
    if (musica) abrirMusica(musica.id);
    else if (prox) abrirLicao(prox.id);
    if (['hoje', 'trilha', 'acordes'].includes(viewAtual)) RENDER[viewAtual]();
  };
}

/* ===== 4. Treinos ===== */
// "1 minuto de trocas" (JustinGuitar): troque entre dois acordes o máximo que puder em 60 s
function trocaUmMinuto(area, a, b) {
  const chave = `${a}>${b}`;
  let n = 0, fim = 0, timer = null, vez = 0;
  area.innerHTML = `
    <div class="troca2">
      <h3>1 minuto de trocas</h3>
      <p class="sub">Troque entre <b>${esc(a)}</b> e <b>${esc(b)}</b> o máximo que puder. A cada troca, toque no botão. Seu recorde: <b>${S.recordes[chave] || 0}</b></p>
      <div class="troca2-par">
        <figure data-i="0">${diagramaAcorde(a, { tam: 'md' })}<figcaption>${esc(a)}</figcaption></figure>
        <figure data-i="1">${diagramaAcorde(b, { tam: 'md' })}<figcaption>${esc(b)}</figcaption></figure>
      </div>
      <div class="troca2-num"><b id="tr-tempo">60</b><span>segundos</span><b id="tr-n">0</b><span>trocas</span></div>
      <button class="btn primario largo grande" id="tr-btn">Começar</button>
    </div>`;
  const q = s => area.querySelector(s);
  const marcar = () => area.querySelectorAll('.troca2-par figure').forEach(f => f.classList.toggle('vez', timer && +f.dataset.i === vez));
  q('#tr-btn').addEventListener('click', () => {
    if (!timer) {
      if (fim) { n = 0; vez = 0; q('#tr-n').textContent = 0; }
      fim = Date.now() + 60000;
      timer = setInterval(() => {
        const r = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
        q('#tr-tempo').textContent = r;
        if (r === 0) {
          clearInterval(timer); timer = null; marcar();
          const rec = S.recordes[chave] || 0;
          if (n > rec) S.recordes[chave] = n;
          registrar('trocas', n);
          q('#tr-btn').textContent = 'De novo';
          toast(n > rec && rec ? `Novo recorde: ${n} trocas!` : `${n} trocas. ${n >= 30 ? 'Ótimo!' : 'Repita amanhã e veja o número subir.'}`);
        }
      }, 200);
      q('#tr-btn').textContent = 'Troquei!';
      ativos.add('trocas');
      marcar();
      return;
    }
    n++; vez = 1 - vez; q('#tr-n').textContent = n; vibrar(8); marcar();
  });
  return () => { clearInterval(timer); timer = null; ativos.delete('trocas'); };
}

// Mini afinador para a lição (usa o mesmo detector de altura do afinador completo)
function miniAfinador(area) {
  let alvo = null, ligado = false, timer = null, leit = [];
  area.innerHTML = `
    <div class="mini-af">
      <h3>Afine as 6 cordas</h3>
      <p class="sub">Toque uma corda solta. O ponteiro mostra se está grave (aperte a tarraxa) ou agudo (afrouxe). Ou toque um botão para ouvir o som certo.</p>
      <div class="maf-mostrador"><b id="maf-nota">—</b><div class="maf-barra"><i id="maf-ponteiro"></i><span class="maf-ok"></span></div><span id="maf-dica" class="sub">Toque em "Usar microfone"</span></div>
      <div class="maf-cordas">${[0, 1, 2, 3, 4, 5].map(i => `<button class="btn" data-c="${i}"><b>${'EADGBE'[i]}</b><small>${ORD[i]}</small></button>`).join('')}</div>
      <button class="btn primario largo" id="maf-mic">${IC.mic} Usar microfone</button>
    </div>`;
  area.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { alvo = +b.dataset.c; Som.init(); Som.nota(CORDAS_SOLTAS[alvo], Som.agora + 0.02, 0.5); }));
  const ler = () => {
    const r = Detector.altura();
    if (r && r.freq > 60 && r.freq < 700) {
      leit.push(r.freq); if (leit.length > 5) leit.shift();
      const f = mediana(leit);
      let c = alvo;
      if (c === null) { c = 0; CORDAS_SOLTAS.forEach((x, i) => { if (Math.abs(Math.log2(f / x)) < Math.abs(Math.log2(f / CORDAS_SOLTAS[c]))) c = i; }); }
      const cents = Math.round(1200 * Math.log2(f / CORDAS_SOLTAS[c]));
      area.querySelector('#maf-nota').textContent = `${'EADGBE'[c]} · ${ORD[c]}`;
      area.querySelector('#maf-ponteiro').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
      const ok = Math.abs(cents) <= 5;
      area.querySelector('.maf-mostrador').classList.toggle('ok', ok);
      area.querySelector('#maf-dica').textContent = ok ? 'Afinada!' : cents < 0 ? 'Grave: aperte um pouco a tarraxa' : 'Aguda: afrouxe um pouco';
    }
    timer = setTimeout(ler, 80);
  };
  area.querySelector('#maf-mic').addEventListener('click', async e => {
    if (ligado) return;
    try { await Detector.ligar(); } catch (err) { area.querySelector('#maf-dica').textContent = msgSemMicrofone(err); return; }
    ligado = true; e.currentTarget.textContent = 'Ouvindo…'; e.currentTarget.disabled = true; ler();
  });
  return () => clearTimeout(timer);
}

/* ===== 5. Telas ===== */
function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
const META_MIN = 10;

function musicasQueDaPraTocar() {
  return todasMusicas().filter(m => acordesUnicos(m).every(seiAcorde));
}

function renderHoje() {
  const d = hoje(), prox = proximaLicao(), u = prox ? unidadeDaLicao(prox.id) : null;
  const min = Math.floor(d.seg / 60), pct = Math.min(1, min / META_MIN);
  const feitas = u ? u.licoes.filter(l => S.licoes[l.id]).length : 0;
  const daPra = musicasQueDaPraTocar();
  const R = 26, C = 2 * Math.PI * R;
  $('#view-hoje').innerHTML = `
    <header class="hj-topo">
      <div><h2>${saudacao()}!</h2><p class="sub">${min >= META_MIN ? 'Meta de hoje cumprida. Mandou bem!' : `Faltam ${META_MIN - min} min para a meta de hoje.`}</p></div>
      <div class="anel" aria-label="${min} de ${META_MIN} minutos hoje"><svg viewBox="0 0 64 64"><circle class="anel-fundo" cx="32" cy="32" r="${R}"/><circle class="anel-cheio" cx="32" cy="32" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg><b>${min}<small>min</small></b></div>
    </header>
    ${prox ? `<button class="card-continuar" data-licao="${prox.id}">
        <span class="eyebrow">${esc(u.titulo)} · ${feitas}/${u.licoes.length}</span>
        <span class="cc-titulo">${esc(prox.titulo)}</span>
        <span class="cc-rodape"><span class="sub">${IC.relogio} ${prox.min} min</span><span class="cc-botao">${S.licoes[LESSONS[0].id] ? 'Continuar' : 'Começar'} ${IC.seta}</span></span>
        <span class="cc-prog"><i style="width:${feitas / u.licoes.length * 100}%"></i></span>
      </button>` : `<div class="card-continuar"><span class="cc-titulo">Curso concluído!</span><span class="sub">Agora é repertório: escolha músicas na aba Músicas.</span></div>`}
    <section class="secao">
      <div class="secao-topo"><h3>Você já pode tocar</h3><button class="link" data-ir="musicas">Ver todas</button></div>
      ${daPra.length ? `<div class="lista-simples">${daPra.slice(0, 4).map(m => `<button class="linha-musica" data-musica="${esc(m.id)}">${capaHTML(m, true)}<span><b>${esc(m.titulo)}</b><small>${esc(m.artista)} · ${acordesUnicos(m).map(simplificar).filter((x, i, a) => a.indexOf(x) === i).join(' ')}</small></span>${IC.seta}</button>`).join('')}</div>`
        : `<p class="sub vazio-suave">Termine a unidade "${esc(CURSO[1].titulo)}" e a primeira música aparece aqui.</p>`}
    </section>
    <section class="secao atalhos">
      <button class="atalho" data-ir="ferramentas">${icone('<path d="M9 21h6l-1-15h-4z"/><path d="M12 15l5-11"/>')}<span>Afinar</span></button>
      <button class="atalho" data-ir="acordes">${icone('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9.5 3v18M14.5 3v18M5 8h14M5 13h14"/>')}<span>Acordes</span></button>
      <button class="atalho" data-jogo="trocas">${icone('<path d="M7 7h11l-3-3M17 17H6l3 3"/>')}<span>1 min de trocas</span></button>
    </section>`;
  const v = $('#view-hoje');
  v.querySelector('[data-licao]')?.addEventListener('click', e => abrirLicao(e.currentTarget.dataset.licao));
  v.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => irPara(b.dataset.ir)));
  v.querySelectorAll('[data-musica]').forEach(b => b.addEventListener('click', () => abrirMusica(b.dataset.musica)));
  v.querySelector('[data-jogo]')?.addEventListener('click', () => JOGOS.trocas());
  renderHeader();
}

function renderTrilha() {
  const prox = proximaLicao();
  $('#view-trilha').innerHTML = CURSO.map((u, ui) => {
    const feitas = u.licoes.filter(l => S.licoes[l.id]).length, m = u.musica ? acharMusica(u.musica) : null;
    return `<section class="unidade ${feitas === u.licoes.length ? 'completa' : ''}">
      <header class="un-topo"><span class="un-num">${ui + 1}</span><div><h2>${esc(u.titulo)}</h2><p class="sub">${esc(u.resumo)}</p></div><span class="un-cont">${feitas}/${u.licoes.length}</span></header>
      <ol class="un-licoes">${u.licoes.map(l => {
        const feito = S.licoes[l.id], ehProx = prox && prox.id === l.id;
        const acs = l.passos.filter(p => p.t === 'acorde').map(p => p.acorde);
        return `<li><button class="un-licao ${feito ? 'feito' : ''} ${ehProx ? 'prox' : ''}" data-licao="${l.id}">
          <span class="un-marca">${feito ? IC.check : l.musicaFinal ? IC.nota : ''}</span>
          <span class="un-txt"><b>${esc(l.titulo)}</b><small>${l.min} min${acs.length ? ' · ' + acs.join(', ') : ''}</small></span>
          ${ehProx ? `<span class="un-agora">Começar</span>` : ''}
        </button></li>`;
      }).join('')}</ol>
      ${m ? `<p class="un-musica">${IC.nota} No fim: <b>${esc(m.titulo)}</b></p>` : ''}
    </section>`;
  }).join('') + `<section class="secao"><div class="secao-topo"><h3>Treinos</h3></div><div id="jogos-lista"></div></section>`;
  renderJogos($('#jogos-lista'));
  $$('#view-trilha [data-licao]').forEach(b => b.addEventListener('click', () => abrirLicao(b.dataset.licao)));
}

// Acordes: os que você sabe, os próximos do curso e todos
const GRUPOS_ACORDES = [
  ['Para começar', ['Em7', 'Am7', 'Bm7', 'C', 'Dm7', 'G7', 'C7', 'D7', 'A7', 'E7']],
  ['Básicos', ['G', 'D', 'A', 'E', 'Am', 'Em', 'Dm']],
  ['Com sétima e nona', ['Em7', 'Am7', 'Dm7', 'B7', 'D7(9)', 'E7(9)', 'C7M', 'F7M', 'G7M', 'D7M']],
  ['Com pestana', ['F', 'Bm', 'Bb', 'F#m', 'F#m7', 'Gm', 'Cm', 'Eb7M']]
];
function renderAcordes() {
  const sei = acordesAprendidos();
  const v = $('#view-acordes');
  v.innerHTML = `
    <header class="hj-topo"><div><h2>Acordes</h2><p class="sub">Toque num acorde para aprender dedo a dedo.</p></div></header>
    ${sei.size ? `<section class="secao"><div class="secao-topo"><h3>Você já sabe (${sei.size})</h3></div><div class="grade-acordes2">${[...sei].map(cardAcorde).join('')}</div></section>` : ''}
    ${(() => { const vistos = new Set(sei); return GRUPOS_ACORDES.map(([t, lista]) => { const so = lista.filter(x => !vistos.has(x)); so.forEach(x => vistos.add(x)); return so.length ? `<section class="secao"><div class="secao-topo"><h3>${t}</h3></div><div class="grade-acordes2">${so.map(cardAcorde).join('')}</div></section>` : ''; }).join(''); })()}`;
  v.querySelectorAll('[data-acorde]').forEach(b => b.addEventListener('click', () => abrirAcorde(b.dataset.acorde)));
}
function cardAcorde(nome) {
  const sei = seiAcorde(nome);
  return `<button class="card-acorde2 ${sei ? 'sei' : ''}" data-acorde="${esc(nome)}">${diagramaAcorde(nome, { tam: 'sm', rotulos: false })}<b>${esc(nome)}</b>${sei ? `<span class="sei-marca">${IC.check}</span>` : ''}</button>`;
}
function abrirAcorde(nome) {
  const usam = todasMusicas().filter(m => acordesUnicos(m).some(a => a === nome || simplificar(a) === nome));
  abrirJanela(nome, `<div id="ac-ens"></div>
    <div class="ac-extra">
      <label class="check"><input type="checkbox" id="ac-sei" ${seiAcorde(nome) ? 'checked' : ''}> Já sei este acorde</label>
      ${usam.length ? `<p class="sub">Aparece em: ${usam.map(m => `<button class="link" data-musica="${esc(m.id)}">${esc(m.titulo)}</button>`).join(', ')}</p>` : ''}
    </div>`);
  ensinarAcorde($('#ac-ens'), nome);
  $('#ac-sei').addEventListener('change', e => {
    const lista = new Set(S.acordesSei || []);
    e.target.checked ? lista.add(nome) : lista.delete(nome);
    S.acordesSei = [...lista]; Store.salvar();
    if (viewAtual === 'acordes') renderAcordes();
  });
  $$('#janela [data-musica]').forEach(b => b.addEventListener('click', () => { fecharJanela(); abrirMusica(b.dataset.musica); }));
}

/* ===== Boas-vindas (primeiro uso) =====
   Como o Simply Guitar: pergunta o seu nível e já leva você ao lugar certo. */
function verificarBoasVindas() {
  if (S.onb) return;
  if (Object.keys(S.licoes || {}).length) { S.onb = true; return; } // quem já usava o app
  abrirJanela('Bem-vindo', `
    <div class="onb">
      <span class="onb-logo" aria-hidden="true"></span>
      <h2>Vamos tocar violão</h2>
      <p class="sub">Lições curtas, um acorde de cada vez, e músicas brasileiras de verdade.</p>
      <h3>Você já toca?</h3>
      <div class="onb-opcoes">
        <button class="btn opcao2" data-nivel="0"><b>Nunca toquei</b><small>Começar do zero</small></button>
        <button class="btn opcao2" data-nivel="1"><b>Sei alguns acordes</b><small>Pular o básico</small></button>
        <button class="btn opcao2" data-nivel="2"><b>Já toco músicas</b><small>Ir direto para as músicas</small></button>
      </div>
    </div>`);
  $('#janela').classList.add('cheia');
  $$('[data-nivel]').forEach(b => b.addEventListener('click', () => {
    const nivel = +b.dataset.nivel;
    S.onb = true;
    const pular = nivel === 0 ? [] : nivel === 1 ? ['u1'] : ['u1', 'u2'];
    CURSO.filter(u => pular.includes(u.id)).forEach(u => u.licoes.forEach(l => { S.licoes[l.id] = true; }));
    Store.salvar();
    fecharJanela();
    if (nivel === 2) irPara('musicas');
    else { irPara('hoje'); const p = proximaLicao(); if (p) abrirLicao(p.id); }
  }));
}
