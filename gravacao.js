/* =========================================================
   TOCA AÍ — gravacao.js
   Tocar junto com a GRAVAÇÃO da música.

   O app não traz as gravações originais (direitos autorais).
   Você importa um arquivo de áudio que já tem no aparelho (MP3,
   M4A...). Ele fica guardado SÓ no seu aparelho (IndexedDB) e
   nunca é enviado para lugar nenhum.

   Para o jogo andar junto com a gravação, o app precisa saber:
   - em que segundo da gravação começa o 1º acorde (offset);
   - o andamento da gravação (BPM).
   Você descobre os dois batendo no tempo junto com a música:
   o app faz uma REGRESSÃO LINEAR das suas batidas (a reta que
   melhor passa pelos pontos). Inclinação = duração de um tempo;
   ponto inicial = onde começa o 1º acorde.
   ========================================================= */
'use strict';

/* ---------- Banco de áudios no aparelho (IndexedDB) ----------
   localStorage só guarda texto pequeno. IndexedDB guarda arquivos grandes. */
const BancoAudio = {
  _db: null,
  abrir() {
    if (!this._db) this._db = new Promise((ok, erro) => {
      const r = indexedDB.open('tocaai-audios', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('gravacoes');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
    return this._db;
  },
  async _tx(modo, fn) {
    const db = await this.abrir();
    return new Promise((ok, erro) => {
      const t = db.transaction('gravacoes', modo), req = fn(t.objectStore('gravacoes'));
      t.oncomplete = () => ok(req ? req.result : undefined);
      t.onerror = () => erro(t.error);
      t.onabort = () => erro(t.error);
    });
  },
  salvar(id, arquivo) { return this._tx('readwrite', st => st.put({ blob: arquivo, nome: arquivo.name, tipo: arquivo.type }, id)); },
  async ler(id) { try { return await this._tx('readonly', st => st.get(id)); } catch (e) { return null; } },
  apagar(id) { return this._tx('readwrite', st => st.delete(id)); }
};

/* ---------- Tocador que se mantém alinhado ao relógio do jogo ----------
   O <audio> do navegador muda a velocidade SEM mudar o tom (preservesPitch).
   Ele não é perfeito no tempo, então a cada quadro comparamos onde ele está
   com onde deveria estar e, se errar mais de 80 ms, corrigimos. */
class TocadorGravacao {
  constructor(blob) {
    this.url = URL.createObjectURL(blob);
    this.el = new Audio(this.url);
    this.el.preload = 'auto';
    this.el.preservesPitch = true; this.el.mozPreservesPitch = true; this.el.webkitPreservesPitch = true;
    this.ultimaCorrecao = 0;
    this.erroMedido = 0;
  }
  get posicao() { return this.el.currentTime; }
  // posDesejada: segundo da gravação que deveria estar tocando agora
  acompanhar(posDesejada, taxa) {
    if (posDesejada < 0) { if (!this.el.paused) this.el.pause(); return; }
    if (this.el.paused) {
      this.el.playbackRate = taxa;
      if (posDesejada >= (this.el.duration || Infinity)) return;
      this.el.currentTime = posDesejada;
      this.el.play().catch(() => {});
      this.ultimaCorrecao = performance.now();
      return;
    }
    // média móvel do erro (o currentTime do <audio> oscila um pouco a cada leitura)
    const e = this.el.currentTime - posDesejada;
    this.erroMedido = this.erroMedido * 0.8 + e * 0.2;
    if (Math.abs(e) > 0.25 && performance.now() - this.ultimaCorrecao > 600) {
      // muito longe: pula para o ponto certo
      this.el.currentTime = posDesejada;
      this.erroMedido = 0;
      this.ultimaCorrecao = performance.now();
    } else {
      // perto: acelera ou freia até 6% para alcançar, sem pulo e sem mudar o tom
      const ajuste = Math.abs(this.erroMedido) > 0.015 ? Math.max(-0.06, Math.min(0.06, -this.erroMedido * 0.6)) : 0;
      const alvo = taxa * (1 + ajuste);
      if (Math.abs(this.el.playbackRate - alvo) > 0.002) this.el.playbackRate = alvo;
    }
  }
  tocarDe(pos, taxa = 1) { this.el.playbackRate = taxa; this.el.currentTime = Math.max(0, pos); return this.el.play().catch(() => {}); }
  parar() { this.el.pause(); }
  destruir() { this.el.pause(); this.el.removeAttribute('src'); URL.revokeObjectURL(this.url); }
}

/* ---------- Matemática da sincronização ----------
   batidas: posições (em segundos na gravação) em que você bateu no tempo.
   Algumas batidas podem ter sido puladas: numeramos cada uma pelo
   intervalo mediano antes de traçar a reta. */
function calcularSincronia(batidas) {
  if (batidas.length < 6) return null;
  const difs = batidas.slice(1).map((b, i) => b - batidas[i]).filter(d => d > 0.2 && d < 2);
  if (difs.length < 4) return null;
  const tempo0 = mediana(difs);
  const k = batidas.map(b => Math.round((b - batidas[0]) / tempo0));
  // regressão linear: posição = a + b·k
  const n = k.length, mk = k.reduce((x, y) => x + y, 0) / n, mp = batidas.reduce((x, y) => x + y, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (k[i] - mk) * (batidas[i] - mp); den += (k[i] - mk) ** 2; }
  if (!den) return null;
  const b = num / den, a = mp - b * mk;
  const residuos = batidas.map((p, i) => Math.abs(p - (a + b * k[i])));
  return { offset: Math.max(0, a), bpm: 60 / b, erroMedioMs: Math.round(residuos.reduce((x, y) => x + y, 0) / n * 1000) };
}

// Em que segundo da gravação começa um trecho (em tempos desde o início da música)
function posicaoNaGravacao(meta, tempos) { return meta.offset + tempos * 60 / meta.bpm; }

// Tempo (em batidas) em que começa a seção "indice" da música
function temposAteSecao(musica, indice) {
  if (indice === null || indice === undefined) return 0;
  let t = 0;
  for (let i = 0; i < indice; i++) {
    const s = musica.secoes[i];
    t += lerSequencia(s.seq).reduce((a, x) => a + x.tempos, 0) * (s.repetir || 1);
  }
  return t;
}

/* ---------- Painel "Gravação da música" dentro da tela da música ---------- */
async function painelGravacao(caixa, m, aoMudar) {
  const meta = S.gravacoes[m.id];
  const reg = meta ? await BancoAudio.ler(m.id) : null;
  if (!meta || !reg) {
    caixa.innerHTML = `
      <div class="grav-vazia">
        <div><b>Tocar com a gravação da música</b>
        <p class="sub">Importe um arquivo de áudio que você tenha (MP3, M4A, WAV). Ele fica só neste aparelho. Depois você sincroniza batendo no tempo e o jogo anda junto com a música de verdade.</p>
        ${meta && !reg ? '<p class="sub">O arquivo dessa música foi importado em outro aparelho. Importe de novo aqui.</p>' : ''}</div>
        <label class="btn" for="gv-arquivo">Importar áudio</label>
        <input type="file" id="gv-arquivo" accept="audio/*" hidden>
      </div>`;
    caixa.querySelector('#gv-arquivo').addEventListener('change', async e => {
      const arq = e.target.files[0];
      if (!arq) return;
      if (arq.size > 60 * 1024 * 1024) { toast('Arquivo grande demais (máximo 60 MB)'); return; }
      try {
        await BancoAudio.salvar(m.id, arq);
        S.gravacoes[m.id] = { nome: arq.name, offset: 0, bpm: m.bpm, usar: true, sincronizada: false };
        Store.salvar();
        toast('Áudio importado. Agora sincronize.');
        await painelGravacao(caixa, m, aoMudar);
        caixa.querySelector('#gv-sinc')?.click();
      } catch (err) { toast('Não foi possível guardar o arquivo neste aparelho.'); }
    });
    aoMudar?.();
    return;
  }
  caixa.innerHTML = `
    <div class="grav-cheia">
      <div class="grav-linha">
        <span class="grav-icone" aria-hidden="true">♪</span>
        <div class="grav-info"><b>${esc(meta.nome)}</b><span class="sub">${meta.sincronizada ? `1º acorde em ${meta.offset.toFixed(2)} s · ${Math.round(meta.bpm)} BPM` : 'Ainda não sincronizada'}</span></div>
      </div>
      <label class="check"><input type="checkbox" id="gv-usar" ${meta.usar ? 'checked' : ''}> Tocar a gravação na prévia e no jogo</label>
      <div class="linha-ctrl">
        <button class="btn" id="gv-ouvir">▶ Ouvir</button>
        <button class="btn primario" id="gv-sinc">${meta.sincronizada ? 'Sincronizar de novo' : 'Sincronizar'}</button>
        <button class="btn" id="gv-remover">Remover</button>
      </div>
      <div id="gv-sinc-area"></div>
    </div>`;
  let tocador = null;
  const pararTudo = () => { tocador?.destruir(); tocador = null; };
  caixa.querySelector('#gv-usar').addEventListener('change', e => { meta.usar = e.target.checked; Store.salvar(); aoMudar?.(); });
  caixa.querySelector('#gv-ouvir').addEventListener('click', e => {
    if (tocador) { pararTudo(); e.target.textContent = '▶ Ouvir'; return; }
    tocador = new TocadorGravacao(reg.blob);
    tocador.el.addEventListener('ended', () => { pararTudo(); e.target.textContent = '▶ Ouvir'; });
    tocador.tocarDe(Math.max(0, meta.offset - 1));
    e.target.textContent = '■ Parar';
  });
  caixa.querySelector('#gv-remover').addEventListener('click', async e => {
    const b = e.currentTarget;
    if (!b.dataset.confirmar) { b.dataset.confirmar = '1'; b.textContent = 'Toque de novo para remover'; return; }
    pararTudo();
    await BancoAudio.apagar(m.id).catch(() => {});
    delete S.gravacoes[m.id]; Store.salvar();
    await painelGravacao(caixa, m, aoMudar);
  });
  caixa.querySelector('#gv-sinc').addEventListener('click', () => { pararTudo(); abrirSincronia(caixa.querySelector('#gv-sinc-area'), m, meta, reg.blob, () => painelGravacao(caixa, m, aoMudar)); });
  caixa._limpar = pararTudo;
  aoMudar?.();
}

function abrirSincronia(area, m, meta, fonte, aoSalvar) {
  const proprio = fonte instanceof Blob;            // arquivo: criamos e destruímos o tocador aqui
  const tocador = proprio ? new TocadorGravacao(fonte) : fonte;
  const primeiro = lerSequencia(m.secoes[0].seq)[0]?.acorde || '';
  area.innerHTML = `
    <div class="sinc">
      <ol class="sinc-passos">
        <li>Toque <b>▶ Tocar</b> e escute.</li>
        <li>Quando entrar o <b>1º acorde (${esc(primeiro)})</b>, toque em <b>Bater no tempo</b> junto com cada tempo da música (1, 2, 3, 4…). Pelo menos 8 vezes.</li>
        <li>Toque <b>Testar</b>: o metrônomo deve bater junto com a música. Ajuste com −/+ se precisar.</li>
      </ol>
      <div class="linha-ctrl">
        <button class="btn" id="sc-play">▶ Tocar</button>
        <button class="btn" id="sc-zerar">Recomeçar</button>
      </div>
      <button class="btn primario largo grande sc-bater" id="sc-bater">Bater no tempo</button>
      <p class="sub" id="sc-info">Nenhuma batida ainda.</p>
      <div class="linha-ctrl">
        <label>1º acorde em (s)<input type="number" id="sc-off" step="0.01" min="0" value="${meta.offset.toFixed(2)}"></label>
        <label>Andamento (BPM)<input type="number" id="sc-bpm" step="0.1" min="40" max="220" value="${(+meta.bpm).toFixed(1)}"></label>
      </div>
      <div class="linha-ctrl">
        <button class="btn mini" data-aj="-0.05">−50 ms</button><button class="btn mini" data-aj="-0.01">−10 ms</button>
        <button class="btn mini" data-aj="0.01">+10 ms</button><button class="btn mini" data-aj="0.05">+50 ms</button>
      </div>
      <div class="acoes-licao"><button class="btn" id="sc-testar">Testar com metrônomo</button><button class="btn primario" id="sc-salvar">Salvar sincronia</button></div>
    </div>`;
  let batidas = [], testeTimer = null;
  const q = s => area.querySelector(s);
  const parar = () => { tocador.parar(); clearInterval(testeTimer); Som.pararTudo(); q('#sc-play').textContent = '▶ Tocar'; };
  q('#sc-play').addEventListener('click', () => { if (!tocador.el.paused) return parar(); tocador.tocarDe(tocador.el.currentTime || 0); q('#sc-play').textContent = '■ Pausar'; });
  q('#sc-zerar').addEventListener('click', () => { parar(); tocador.el.currentTime = 0; batidas = []; q('#sc-info').textContent = 'Nenhuma batida ainda.'; });
  q('#sc-bater').addEventListener('pointerdown', e => {
    e.preventDefault();
    if (tocador.el.paused) { q('#sc-info').textContent = 'Primeiro toque ▶ Tocar.'; return; }
    batidas.push(tocador.el.currentTime);
    const r = calcularSincronia(batidas);
    if (r) {
      q('#sc-off').value = r.offset.toFixed(2); q('#sc-bpm').value = r.bpm.toFixed(1);
      q('#sc-info').innerHTML = `${batidas.length} batidas · variação média de ${r.erroMedioMs} ms${r.erroMedioMs > 60 ? ' (tente bater mais regular)' : ''}`;
    } else q('#sc-info').textContent = `${batidas.length} batidas (continue até 8)`;
  });
  area.querySelectorAll('[data-aj]').forEach(b => b.addEventListener('click', () => { q('#sc-off').value = Math.max(0, +q('#sc-off').value + +b.dataset.aj).toFixed(2); }));
  // Teste: toca a gravação um pouco antes do 1º acorde, com cliques nos tempos calculados
  q('#sc-testar').addEventListener('click', () => {
    parar(); Som.init();
    const off = +q('#sc-off').value, bpm = +q('#sc-bpm').value, seg = 60 / bpm;
    const inicio = Math.max(0, off - 1.5);
    tocador.tocarDe(inicio).then(() => {
      q('#sc-play').textContent = '■ Pausar';
      let proximo = 0;
      testeTimer = setInterval(() => {
        if (tocador.el.paused) return clearInterval(testeTimer);
        const pos = tocador.el.currentTime;
        while (off + proximo * seg < pos + 0.15) {
          const alvo = off + proximo * seg;
          if (alvo >= pos - 0.02) Som.click(Som.agora + (alvo - pos), proximo % 4 === 0, 0.7);
          proximo++;
          if (proximo > 16) { setTimeout(parar, 800); clearInterval(testeTimer); break; }
        }
      }, 25);
    });
  });
  q('#sc-salvar').addEventListener('click', () => {
    meta.offset = Math.max(0, +q('#sc-off').value || 0);
    meta.bpm = Math.min(220, Math.max(40, +q('#sc-bpm').value || m.bpm));
    meta.sincronizada = true; meta.usar = true;
    Store.salvar(); parar(); if (proprio) tocador.destruir();
    toast('Sincronia salva');
    aoSalvar?.();
  });
  area._limpar = () => { parar(); if (proprio) tocador.destruir(); };
}

// Prévia usando a gravação: toca a música e mostra o acorde da vez
async function previaComGravacao(m, { segundos = 30, aoAcorde, aoFim } = {}) {
  const meta = S.gravacoes[m.id];
  const reg = meta && meta.usar && meta.sincronizada ? await BancoAudio.ler(m.id) : null;
  if (!reg) return false;
  Previa.parar();
  const tocador = new TocadorGravacao(reg.blob);
  const trechos = musicaParaTrechos(m);
  const inicio = Math.max(0, meta.offset - 1);
  let ultimo = null;
  const estado = { musica: m, gravacao: true };
  Previa.tocando = estado;
  await tocador.tocarDe(inicio);
  const timer = setInterval(() => {
    if (Previa.tocando !== estado || tocador.el.paused || tocador.el.currentTime > inicio + segundos) { fim(); return; }
    const tempos = (tocador.el.currentTime - meta.offset) * meta.bpm / 60;
    const tr = trechos.filter(t => t.inicio <= tempos).at(-1);
    if (tr && tr !== ultimo) { ultimo = tr; aoAcorde?.(tr); }
  }, 50);
  const fim = () => { clearInterval(timer); tocador.destruir(); if (Previa.tocando === estado) { Previa.tocando = null; aoFim?.(); } };
  estado.parar = fim;
  return true;
}
