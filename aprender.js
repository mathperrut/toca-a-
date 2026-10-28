/* =========================================================
   TOCA AÍ — aprender.js
   Tudo o que ENSINA, no estilo dos apps de violão para iniciantes:
   1. Desenho de acorde para iniciante (cor por dedo, nome das cordas)
   2. Professor de acordes: ensina DEDO A DEDO e confere no microfone
   3. Player de lições: uma ideia por tela, botão "Continuar"
   4. Treinos: 1 minuto de trocas e mini afinador
   5. Telas: Aprender (curso, apostilas, treinos), Acordes e boas-vindas
   ========================================================= */
'use strict';

const ORD = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
const NOME_CORDA = ['Mi grave', 'Lá', 'Ré', 'Sol', 'Si', 'Mi agudo'];

/* ===== 1. Desenho de acorde =====
   Como o violão de pé na sua frente: 6ª corda (a mais grossa) à esquerda.
   passo: mostra só os dedos até esse passo (o atual pulsa). */
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
  // junta o mesmo dedo em várias cordas (ex.: dedo 3 deitado)
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
    return `${nome} <b>deitado</b> na <b>casa ${p.casa}</b>, cobrindo da ${ORD[de]} até a ${ORD[ate]} corda.`;
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
  return `${nomeAcorde(nome)}, ${n} ${n === 1 ? 'dedo' : 'dedos'}`;
}
// Toca corda por corda (ajuda a achar a corda abafada)
function tocarCordaPorCorda(nome) {
  const a = acordePorNome(nome);
  if (!a) return;
  Som.init();
  let t = Som.agora + 0.05;
  a.frets.forEach((f, i) => { if (f >= 0) { Som.nota(CORDAS_SOLTAS[i] * Math.pow(2, f / 12), t, 0.4, i); t += 0.45; } });
}
function ouvirAcorde(nome) { Som.init(); Som.golpe(nome, Som.agora + 0.03, 'D', 0.34); }

/* Acordes aprendidos (pelas lições concluídas ou marcados à mão) */
function acordesAprendidos() {
  const set = new Set(S.acordesSei || []);
  for (const l of LESSONS) if (S.licoes[l.id]) l.passos.forEach(p => { if (p.t === 'acorde') set.add(p.acorde); });
  return set;
}
function seiAcorde(nome) { const sei = acordesAprendidos(); return sei.has(nome) || sei.has(simplificar(nome)); }

/* ===== 2. Professor de acordes (dedo a dedo) ===== */
function ensinarAcorde(caixa, nome, { aoCompletar } = {}) {
  const passos = passosDoAcorde(nome), a = acordePorNome(nome);
  let k = 0, completou = false;
  const primeira = a ? a.frets.findIndex(f => f >= 0) : 0;
  caixa.innerHTML = `
    <div class="ens">
      <div class="ens-topo"><b class="ens-nome">${esc(nome)}</b><span class="sub">${esc(descricaoAcorde(nome))}</span></div>
      <div class="ens-diag" id="ens-diag"></div>
      <div class="ens-pontos" id="ens-pontos">${Array.from({ length: passos.length + 1 }, () => '<i></i>').join('')}</div>
      <p class="ens-texto" id="ens-texto" aria-live="polite"></p>
      <div class="ens-acoes">
        <button class="btn-icone" id="ens-volta" aria-label="Passo anterior">${IC.voltar}</button>
        <button class="btn" id="ens-ouvir">${IC.som} Ouvir</button>
        <button class="btn primario" id="ens-prox">Próximo</button>
      </div>
      <div class="ens-final" id="ens-final" hidden>
        <button class="btn" id="ens-corda">${IC.som} Corda por corda</button>
        <button class="btn" id="ens-mic">${IC.mic} Conferir no microfone</button>
      </div>
      <p class="ens-res" id="ens-res" aria-live="polite"></p>
    </div>`;
  const q = s => caixa.querySelector(s);
  const mostrar = () => {
    const final = k >= passos.length;
    q('#ens-diag').innerHTML = diagramaAcorde(nome, { tam: 'xl', passo: final ? null : k });
    q('#ens-texto').innerHTML = final
      ? `Agora toque as cordas, começando pela <b>${ORD[primeira]}</b>${a && a.frets.some(f => f < 0) ? ' (pule as que têm ×)' : ''}. Todas devem soar limpas.`
      : `<span class="ens-passo">Passo ${k + 1} de ${passos.length}</span> ${textoPasso(passos[k])}`;
    q('#ens-final').hidden = !final;
    q('#ens-prox').hidden = final;
    q('#ens-volta').disabled = k === 0;
    caixa.querySelectorAll('#ens-pontos i').forEach((b, j) => { b.classList.toggle('feito', j < k); b.classList.toggle('on', j === k); });
    if (final && !completou) { completou = true; aoCompletar?.(); }
  };
  q('#ens-prox').addEventListener('click', () => { k = Math.min(passos.length, k + 1); mostrar(); });
  q('#ens-volta').addEventListener('click', () => { k = Math.max(0, k - 1); mostrar(); q('#ens-res').textContent = ''; });
  q('#ens-ouvir').addEventListener('click', () => ouvirAcorde(nome));
  q('#ens-corda').addEventListener('click', () => tocarCordaPorCorda(nome));
  q('#ens-mic').addEventListener('click', () => conferirAcordeMic(nome, q('#ens-res'), q('#ens-mic')));
  mostrar();
}
// Escuta uma batida e diz se soou como o acorde pedido
async function conferirAcordeMic(nome, saida, botao) {
  try { await Detector.ligar(); } catch (e) { saida.textContent = msgSemMicrofone(e); return; }
  botao.disabled = true;
  saida.className = 'ens-res'; saida.textContent = 'Ouvindo… toque o acorde uma vez e deixe soar.';
  const vizinhos = ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm', 'D7', 'G7', 'E7', 'A7', 'C7', 'B7', 'Am7', 'Em7', 'Bm7'].filter(x => x !== nome);
  let feito = false;
  const fim = setTimeout(() => { if (!feito) { cancela(); botao.disabled = false; saida.textContent = 'Não ouvi nada. Toque mais forte, perto do celular.'; } }, 8000);
  const cancela = Detector.aoAtacar(async () => {
    if (feito) return;
    feito = true; cancela(); clearTimeout(fim);
    await new Promise(r => setTimeout(r, 160));
    const r = await Jogo.lerCroma(5, 60);
    botao.disabled = false;
    if (!r) { saida.textContent = 'Som muito baixo. Toque mais forte, perto do celular.'; return; }
    const av = Jogo.avaliarAcorde(r.croma, nome, vizinhos, 0);
    if (av.ok) { saida.className = 'ens-res ok'; saida.innerHTML = `${IC.check} Soou como <b>${esc(nome)}</b>. Muito bem!`; vibrar([15, 50, 15]); }
    else if (av.outro && av.simOutro > 0.6) saida.innerHTML = `Soou mais parecido com <b>${esc(av.outro)}</b>. Confira cada dedo e se as cordas soltas estão soando.`;
    else saida.textContent = 'Não reconheci o acorde. Alguma corda pode estar abafada: use "Corda por corda" e compare.';
  });
}

/* ===== 3. Player de lições ===== */
function unidadeDaLicao(id) { return CURSO.find(u => u.licoes.some(l => l.id === id)); }
function proximaLicao() { return LESSONS.find(l => !S.licoes[l.id]); }

function abrirLicao(id) {
  const l = lessonById(id), u = unidadeDaLicao(id);
  let i = 0, limpar = null, acaoFinal = null;
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
    $('#lc-barra').style.transform = `scaleX(${i / l.passos.length})`;
    cont.disabled = false; cont.textContent = 'Continuar';
    area.innerHTML = '';
    area.classList.remove('entrar'); void area.offsetWidth; area.classList.add('entrar');
    $('#janela-corpo').scrollTop = 0;
    limpar = PASSOS[p.t](area, p, { cont, l, u }) || null;
  };
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
    area.innerHTML = `<div class="ps-texto">${p.visual ? `<div class="ps-visual">${DESENHOS[p.visual]?.() || ''}</div>` : ''}<h3>${esc(p.titulo)}</h3><p>${p.texto}</p></div>`;
    area.querySelectorAll('[data-ouvir]').forEach(b => b.addEventListener('click', () => ouvirAcorde(b.dataset.ouvir)));
  },
  video(area, p) {
    area.innerHTML = `<div class="ps-video">${videoHTML(p.video)}</div>`;
    return () => area.querySelector('video')?.pause();
  },
  acorde(area, p, { cont }) {
    ensinarAcorde(area, p.acorde, { aoCompletar: () => { cont.textContent = 'Já sei, continuar'; } });
  },
  quiz(area, p, { cont }) {
    cont.disabled = true;
    area.innerHTML = `<div class="qz"><p class="qz-p">${esc(p.pergunta)}</p><div class="qz-opcoes">${p.opcoes.map((o, k) => `<button class="opcao" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="qz-exp" id="ps-explica" aria-live="polite"></p></div>`;
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
  // O jogo dentro da lição
  tocar(area, p, { cont }) {
    const m = p.musica ? acharMusica(p.musica) : null;
    const titulo = p.titulo || (m ? `${m.titulo}${p.secao != null ? ': ' + m.secoes[p.secao].nome : ''}` : 'Toque junto');
    const modo = p.modo || 'espera';
    const nomesModo = { espera: 'Esperar por mim: a música para em cada acorde até você acertar.', tempo: 'No tempo: a música não para, e o microfone dá os pontos.', pratica: 'Prática: o app toca junto, sem pontos.' };
    cont.textContent = 'Pular';
    area.innerHTML = `
      <div class="ps-tocar">
        <h3>${esc(titulo)}</h3>
        ${m?.capo ? `<p class="sub">Capotraste na ${m.capo}ª casa para soar como a gravação (opcional).</p>` : ''}
        <p class="sub">${nomesModo[modo]}</p>
        <div class="ps-acordes">${[...new Set((m ? musicaParaTrechos(m, p.secao ?? null) : lerSequencia(p.seq)).map(x => simplificar(x.acorde)))].map(a => `<figure>${diagramaAcorde(a, { tam: 'sm', rotulos: false })}<figcaption>${esc(a)}</figcaption></figure>`).join('')}</div>
        <button class="btn primario largo grande" id="ps-play">${IC.play} Começar</button>
        <div id="ps-fim"></div>
      </div>`;
    area.querySelector('#ps-play').addEventListener('click', () => {
      const fim = r => {
        cont.textContent = 'Continuar';
        const ok = r.pct === null || r.pct >= 50 || r.modo === 'espera';
        area.querySelector('#ps-fim').innerHTML = `<p class="ps-ok">${ok ? IC.check + ' Muito bem!' : 'Quase lá. Tente de novo ou continue.'}</p>`;
      };
      if (m) jogarMusica(m, p.secao ?? null, { modo, ritmo: p.ritmo, vel: modo === 'tempo' ? 60 : 60, aoFim: fim });
      else {
        let ini = 0;
        const trechos = lerSequencia(p.seq).map(x => { const t = { ...x, inicio: ini }; ini += x.tempos; return t; });
        Jogo.abrir({ titulo, trechos, padrao: patternById(p.padrao || 'quatro'), ritmo: p.ritmo || 'acorde', bpm: p.bpm || 60, bpmBase: p.bpm || 60,
          modo, entrada: modo === 'pratica' ? 'nenhuma' : 'mic', facil: true, aoFim: fim });
      }
    });
  },
  notas(area, p, { cont }) {
    const me = MELODIAS.find(x => x.id === p.melodia);
    cont.textContent = 'Pular';
    area.innerHTML = `
      <div class="ps-tocar">
        <h3>${esc(p.titulo || me.titulo)}</h3>
        <p class="sub">Cada bolinha é uma nota: a linha é a corda e o número é a casa (0 = solta). A música espera você tocar cada nota.</p>
        <button class="btn primario largo grande" id="ps-play">${IC.play} Começar</button>
        <div id="ps-fim"></div>
      </div>`;
    area.querySelector('#ps-play').addEventListener('click', () => jogarMelodia(me.id, { modo: 'espera', vel: 100, aoFim: () => { cont.textContent = 'Continuar'; area.querySelector('#ps-fim').innerHTML = `<p class="ps-ok">${IC.check} Muito bem!</p>`; } }));
  }
};

function concluirLicao(l, u, area, cont, limpar) {
  limpar();
  const novo = !S.licoes[l.id];
  S.licoes[l.id] = true;
  if (novo) { registrar('licoes', 1); ganharXP(20, 'lição concluída', true); }
  Store.salvar();
  $('#lc-barra').style.transform = 'scaleX(1)';
  const prox = LESSONS[LESSONS.findIndex(x => x.id === l.id) + 1];
  const musica = l.musicaFinal && u.musica ? acharMusica(u.musica) : null;
  const novos = l.passos.filter(p => p.t === 'acorde').map(p => p.acorde);
  area.innerHTML = `
    <div class="ps-fim">
      <span class="fim-bola" aria-hidden="true">${IC.check}</span>
      <h3>Lição concluída</h3>
      ${novos.length ? `<p>Você aprendeu: <b>${novos.join(', ')}</b></p>` : ''}
      ${musica ? `<p>Você já consegue tocar <b>${esc(musica.titulo)}</b> inteira.</p>` : ''}
    </div>`;
  vibrar([20, 60, 20]);
  cont.textContent = musica ? `Abrir ${musica.titulo}` : prox ? `Próxima: ${prox.titulo}` : 'Voltar';
  return () => {
    fecharJanela();
    if (musica) abrirMusica(musica.id);
    else if (prox) abrirLicao(prox.id);
    if (['hoje', 'aprender', 'acordes'].includes(viewAtual)) RENDER[viewAtual]();
  };
}

/* ===== 4. Treinos ===== */
// "1 minuto de trocas" (JustinGuitar): troque entre dois acordes o máximo que puder em 60 s
function trocaUmMinuto(area, a, b) {
  const chave = `${a}>${b}`;
  let n = 0, fim = 0, timer = null, vez = 0;
  area.innerHTML = `
    <div class="troca">
      <h3>1 minuto de trocas</h3>
      <p class="sub">Troque entre <b>${esc(a)}</b> e <b>${esc(b)}</b> o máximo que puder. A cada troca, toque em "Troquei". Recorde: <b>${S.recordes[chave] || 0}</b></p>
      <div class="troca-par">
        <figure data-i="0">${diagramaAcorde(a, { tam: 'md' })}<figcaption>${esc(a)}</figcaption></figure>
        <figure data-i="1">${diagramaAcorde(b, { tam: 'md' })}<figcaption>${esc(b)}</figcaption></figure>
      </div>
      <div class="troca-num"><span><b id="tr-tempo">60</b>segundos</span><span><b id="tr-n">0</b>trocas</span></div>
      <button class="btn primario largo grande" id="tr-btn">Começar</button>
    </div>`;
  const q = s => area.querySelector(s);
  const marcar = () => area.querySelectorAll('.troca-par figure').forEach(f => f.classList.toggle('vez', !!timer && +f.dataset.i === vez));
  q('#tr-btn').addEventListener('click', () => {
    if (!timer) {
      if (fim) { n = 0; vez = 0; q('#tr-n').textContent = 0; }
      fim = Date.now() + 60000;
      timer = setInterval(() => {
        const r = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
        q('#tr-tempo').textContent = r;
        if (r === 0) {
          clearInterval(timer); timer = null; marcar(); ativos.delete('trocas');
          const rec = S.recordes[chave] || 0;
          if (n > rec) S.recordes[chave] = n;
          registrar('trocas', n);
          q('#tr-btn').textContent = 'De novo';
          toast(n > rec && rec ? `Novo recorde: ${n} trocas!` : `${n} trocas. ${n >= 30 ? 'Ótimo!' : 'Amanhã o número sobe.'}`);
        }
      }, 200);
      q('#tr-btn').textContent = 'Troquei';
      ativos.add('trocas'); marcar();
      return;
    }
    n++; vez = 1 - vez; q('#tr-n').textContent = n; vibrar(8); marcar();
  });
  return () => { clearInterval(timer); timer = null; ativos.delete('trocas'); };
}

// Mini afinador para a lição
function miniAfinador(area) {
  let alvo = null, ligado = false, timer = null, leit = [];
  area.innerHTML = `
    <div class="mini-af">
      <h3>Afine as 6 cordas</h3>
      <p class="sub">Toque uma corda solta. Ponteiro à esquerda: aperte a tarraxa. À direita: afrouxe. Os botões tocam o som certo de cada corda.</p>
      <div class="af-nota pequena"><b id="maf-nota">—</b><span id="maf-dica">Toque em "Usar microfone"</span></div>
      <div class="af-escala" aria-hidden="true"><span class="af-zona"></span><i id="maf-ponteiro"></i></div>
      <div class="af-cordas">${[0, 1, 2, 3, 4, 5].map(i => `<button class="af-corda" data-c="${i}"><b>${'EADGBE'[i]}</b><small>${ORD[i]}</small></button>`).join('')}</div>
      <button class="btn primario largo" id="maf-mic">${IC.mic} Usar microfone</button>
    </div>`;
  area.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { alvo = +b.dataset.c; Som.init(); Som.nota(CORDAS_SOLTAS[alvo], Som.agora + 0.02, 0.5, alvo, { humano: false }); }));
  const ler = () => {
    const r = Detector.altura();
    if (r && r.freq > 60 && r.freq < 700) {
      leit.push(r.freq); if (leit.length > 5) leit.shift();
      const f = mediana(leit);
      let c = alvo;
      if (c === null) { c = 0; CORDAS_SOLTAS.forEach((x, i) => { if (Math.abs(Math.log2(f / x)) < Math.abs(Math.log2(f / CORDAS_SOLTAS[c]))) c = i; }); }
      const cents = Math.round(1200 * Math.log2(f / CORDAS_SOLTAS[c]));
      area.querySelector('#maf-nota').textContent = `${'EADGBE'[c]}, ${ORD[c]} corda`;
      area.querySelector('#maf-ponteiro').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
      const ok = Math.abs(cents) <= 5;
      area.querySelector('.mini-af').classList.toggle('certo', ok);
      area.querySelector('#maf-dica').textContent = ok ? 'Afinada' : cents < 0 ? 'Grave: aperte um pouco a tarraxa' : 'Aguda: afrouxe um pouco';
    }
    timer = setTimeout(ler, 80);
  };
  area.querySelector('#maf-mic').addEventListener('click', async e => {
    if (ligado) return;
    const b = e.currentTarget;
    try { await Detector.ligar(); } catch (err) { area.querySelector('#maf-dica').textContent = msgSemMicrofone(err); return; }
    ligado = true; b.textContent = 'Ouvindo…'; b.disabled = true; ler();
  });
  return () => clearTimeout(timer);
}

/* ===== 5. Telas ===== */
let abaAprender = 'curso';
function renderAprender() {
  const v = $('#view-aprender');
  v.innerHTML = `
    <header class="pagina-topo"><h2 class="titulo-grande">Aprender</h2></header>
    <div class="abas" role="tablist">${[['curso', 'Curso'], ['apostilas', 'Apostilas'], ['treinos', 'Treinos']].map(([k, n]) => `<button role="tab" aria-selected="${abaAprender === k}" data-aba="${k}">${n}</button>`).join('')}</div>
    <div id="aba-conteudo"></div>`;
  $$('[data-aba]', v).forEach(b => b.addEventListener('click', () => { abaAprender = b.dataset.aba; renderAprender(); }));
  const c = $('#aba-conteudo');
  if (abaAprender === 'curso') renderCurso(c);
  else if (abaAprender === 'apostilas') renderApostilas(c);
  else renderTreinos(c);
}
function renderCurso(c) {
  const prox = proximaLicao();
  c.innerHTML = CURSO.map((u, ui) => {
    const feitas = u.licoes.filter(l => S.licoes[l.id]).length, m = u.musica ? acharMusica(u.musica) : null;
    return `<section class="unidade ${feitas === u.licoes.length ? 'completa' : ''}">
      <header class="un-topo"><span class="un-num">${ui + 1}</span><div><h3>${esc(u.titulo)}</h3><p class="sub">${esc(u.resumo)}</p></div><span class="un-cont">${feitas}/${u.licoes.length}</span></header>
      <ol class="un-licoes">${u.licoes.map(l => {
        const feito = S.licoes[l.id], ehProx = prox && prox.id === l.id;
        const acs = l.passos.filter(p => p.t === 'acorde').map(p => p.acorde);
        return `<li><button class="un-licao ${feito ? 'feito' : ''} ${ehProx ? 'prox' : ''}" data-licao="${l.id}">
          <span class="un-marca" aria-hidden="true">${feito ? IC.check : l.musicaFinal ? IC.nota : ''}</span>
          <span class="un-txt"><b>${esc(l.titulo)}</b><small>${l.min} min${acs.length ? ', ' + acs.join(', ') : ''}</small></span>
          ${ehProx ? '<span class="un-agora">Começar</span>' : ''}
        </button></li>`;
      }).join('')}</ol>
      ${m ? `<p class="un-musica">${IC.nota} No fim desta unidade: <b>${esc(m.titulo)}</b></p>` : ''}
    </section>`;
  }).join('');
  $$('[data-licao]', c).forEach(b => b.addEventListener('click', () => abrirLicao(b.dataset.licao)));
}
function renderApostilas(c) {
  c.innerHTML = `
    <section class="secao">
      <div class="secao-topo"><h3>Mini vídeos</h3></div>
      <div class="videos">${Object.entries(VIDEOS).map(([id, v]) => `<button class="video-card" data-video="${id}"><span class="vc-capa"><img src="${v.arquivo.replace('.mp4', '.jpg')}" alt="" loading="lazy"><span class="vc-play" aria-hidden="true">${IC.play}</span></span><b>${esc(v.titulo)}</b></button>`).join('')}</div>
    </section>
    <section class="secao">
      <div class="secao-topo"><h3>Apostilas</h3><span class="sub">${APOSTILAS.length} textos curtos</span></div>
      <div class="lista">${APOSTILAS.map((a, i) => `<button class="linha-apostila" data-apostila="${a.id}"><span class="la-num">${i + 1}</span><span class="la-txt"><b>${esc(a.titulo)}</b><small>${esc(a.resumo)}</small></span><span class="la-dir">${S.apostilas?.[a.id] ? `<span class="la-feita">${IC.check}</span>` : `<small>${a.min} min</small>`}</span></button>`).join('')}</div>
    </section>`;
  $$('[data-video]', c).forEach(b => b.addEventListener('click', () => abrirVideo(b.dataset.video)));
  $$('[data-apostila]', c).forEach(b => b.addEventListener('click', () => abrirApostila(b.dataset.apostila)));
}
function renderTreinos(c) {
  const rec = Object.entries(S.recordes).sort((a, b) => b[1] - a[1])[0];
  c.innerHTML = `<div class="treinos">
    <button class="treino-card" data-treino="trocas">${icone('<path d="M7 7h11l-3-3M17 17H6l3 3"/>')}<b>1 minuto de trocas</b><span>Troque entre 2 acordes o máximo que puder.${rec ? ` Recorde: ${rec[1]}` : ''}</span></button>
    <button class="treino-card" data-treino="ritmo">${icone('<path d="M4 12h3l2-6 4 12 2-6h5"/>')}<b>Ritmo</b><span>Samba, pagode, bossa, baião e pop.</span></button>
    <button class="treino-card" data-treino="quiz">${icone('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>')}<b>Que acorde é este?</b><span>10 perguntas, corrige na hora.</span></button>
    <button class="treino-card" data-melodia="primeiras">${IC.nota}<b>Notas soltas</b><span>As primeiras casas da 1ª e da 2ª corda.</span></button>
  </div>`;
  $$('[data-treino]', c).forEach(b => b.addEventListener('click', () => JOGOS[b.dataset.treino]()));
  $$('[data-melodia]', c).forEach(b => b.addEventListener('click', () => jogarMelodia(b.dataset.melodia)));
}

// Acordes: os que você sabe e os grupos para aprender
const GRUPOS_ACORDES = [
  ['Para começar', ['Em', 'D', 'C', 'G', 'Am', 'A', 'E', 'Dm']],
  ['Com sétima', ['Em7', 'Am7', 'Bm7', 'Dm7', 'G7', 'C7', 'D7', 'A7', 'E7', 'B7']],
  ['Com nona e sétima maior', ['A9', 'D9', 'C9', 'C7M', 'F7M', 'G7M', 'D7M', 'D7(9)', 'E7(9)']],
  ['Com pestana', ['F', 'Bm', 'Bb', 'F#m', 'F#m7', 'Gm', 'Cm', 'Eb7M']]
];
function renderAcordes() {
  const sei = acordesAprendidos();
  const v = $('#view-acordes');
  const vistos = new Set(sei);
  v.innerHTML = `
    <header class="pagina-topo"><h2 class="titulo-grande">Acordes</h2><p class="sub">Toque num acorde para aprender dedo a dedo.</p></header>
    ${sei.size ? `<section class="secao"><div class="secao-topo"><h3>Você já sabe</h3><span class="sub">${sei.size}</span></div><div class="grade-acordes">${[...sei].map(cardAcorde).join('')}</div></section>` : ''}
    ${GRUPOS_ACORDES.map(([t, lista]) => { const so = lista.filter(x => !vistos.has(x)); so.forEach(x => vistos.add(x)); return so.length ? `<section class="secao"><div class="secao-topo"><h3>${t}</h3></div><div class="grade-acordes">${so.map(cardAcorde).join('')}</div></section>` : ''; }).join('')}`;
  $$('[data-acorde]', v).forEach(b => b.addEventListener('click', () => abrirAcorde(b.dataset.acorde)));
}
function cardAcorde(nome) {
  const sei = seiAcorde(nome);
  return `<button class="card-acorde ${sei ? 'sei' : ''}" data-acorde="${esc(nome)}">${diagramaAcorde(nome, { tam: 'sm', rotulos: false })}<b>${esc(nome)}</b>${sei ? `<span class="sei-marca" aria-label="Você sabe">${IC.check}</span>` : ''}</button>`;
}
function abrirAcorde(nome) {
  const usam = todasMusicas().filter(m => acordesUnicos(m).some(a => a === nome || simplificar(a) === nome));
  abrirJanela(nome, `<div id="ac-ens"></div>
    <div class="ac-extra">
      <label class="alternar"><input type="checkbox" id="ac-sei" ${seiAcorde(nome) ? 'checked' : ''}><span>Já sei este acorde</span></label>
      ${usam.length ? `<p class="sub">Aparece em: ${usam.slice(0, 8).map(m => `<button class="link" data-musica="${esc(m.id)}">${esc(m.titulo)}</button>`).join(', ')}</p>` : ''}
    </div>`);
  ensinarAcorde($('#ac-ens'), nome);
  $('#ac-sei').addEventListener('change', e => {
    const lista = new Set(S.acordesSei || []);
    e.target.checked ? lista.add(nome) : lista.delete(nome);
    S.acordesSei = [...lista]; Store.salvar();
    if (viewAtual === 'acordes') renderAcordes();
  });
  $$('#janela [data-musica]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.musica; fecharJanela(); abrirMusica(id); }));
}

/* Boas-vindas (primeiro uso): pergunta o seu nível e leva ao lugar certo */
function verificarBoasVindas() {
  if (S.onb) return;
  if (Object.keys(S.licoes || {}).length) { S.onb = true; return; }
  abrirJanela('Boas-vindas', `
    <div class="onb">
      <span class="onb-logo" aria-hidden="true"></span>
      <h2>Vamos tocar violão</h2>
      <p class="sub">Lições curtas, um acorde de cada vez e músicas brasileiras de verdade. O microfone escuta você tocar.</p>
      <h3>Você já toca?</h3>
      <div class="modos">
        <button class="modo" data-nivel="0"><b>Nunca toquei</b><small>Começar do zero</small></button>
        <button class="modo" data-nivel="1"><b>Sei alguns acordes</b><small>Pular o básico</small></button>
        <button class="modo" data-nivel="2"><b>Já toco músicas</b><small>Ir direto para as músicas</small></button>
      </div>
    </div>`);
  $('#janela').classList.add('cheia');
  $$('[data-nivel]').forEach(b => b.addEventListener('click', () => {
    const nivel = +b.dataset.nivel;
    S.onb = true;
    const pular = nivel === 0 ? [] : nivel === 1 ? ['u1', 'u2'] : ['u1', 'u2', 'u3', 'u4'];
    CURSO.filter(u => pular.includes(u.id)).forEach(u => u.licoes.forEach(l => { S.licoes[l.id] = true; }));
    if (nivel >= 1) S.cfg.modo = 'tempo';
    Store.salvar();
    fecharJanela();
    if (nivel === 2) irPara('musicas');
    else { irPara('hoje'); const p = proximaLicao(); if (p) abrirLicao(p.id); }
  }));
}
