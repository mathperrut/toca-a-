/* =========================================================
   TOCA AÍ — youtube.js
   Toca a GRAVAÇÃO ORIGINAL da música pelo player oficial do
   YouTube, e o jogo nas cordas anda junto com o vídeo.

   Por que pelo YouTube? As gravações têm direitos autorais. O
   app não copia o áudio: ele mostra o player oficial, que é a
   forma que o YouTube permite para usar o vídeo em outro app.
   Regras do YouTube que o app respeita:
   - o vídeo fica VISÍVEL na tela (no mínimo 200×200 px);
   - o áudio não é separado nem gravado;
   - mudar a velocidade é feito pela própria API do player.

   Como o jogo acompanha o vídeo: o VÍDEO é o relógio-mestre.
   A cada quadro o jogo compara onde está com onde o vídeo está
   e se ajusta (ver seguirVideo em jogo.js).
   ========================================================= */
'use strict';

// Aceita link completo, curto, de shorts, de embed, ou só o ID (11 caracteres)
function extrairIdYoutube(texto) {
  const t = String(texto || '').trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Carrega a API oficial do player (https://www.youtube.com/iframe_api) uma vez só
let _apiYT = null;
function carregarApiYouTube() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (_apiYT) return _apiYT;
  _apiYT = new Promise((ok, erro) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { anterior?.(); } catch (e) {} ok(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { _apiYT = null; erro(new Error('sem-api')); };
    document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { _apiYT = null; erro(new Error('tempo')); } }, 12000);
  });
  return _apiYT;
}

const ERROS_YT = {
  2: 'Link de vídeo inválido.',
  5: 'O player do YouTube não conseguiu tocar este vídeo aqui.',
  100: 'Vídeo não encontrado (foi removido ou é privado).',
  101: 'O dono do vídeo não permite tocar fora do YouTube. Tente outro link.',
  150: 'O dono do vídeo não permite tocar fora do YouTube. Tente outro link.',
  152: 'O YouTube recusou o player neste aparelho (erro 152).',
  153: 'O YouTube recusou o player neste aparelho (erro 153: falta a origem da página).'
};

/* Mesmo "formato" do TocadorGravacao (gravacao.js), para o jogo e a
   sincronização usarem os dois do mesmo jeito. */
class TocadorYouTube {
  constructor(caixa, videoId, { aoErro, aoEstado } = {}) {
    this.videoId = videoId;
    this.mestre = true;           // o jogo segue este tocador
    this.tocando = false;
    this.taxaAtual = 1;
    this._ultimo = { yt: 0, quando: performance.now() };
    this.aoErro = aoErro; this.aoEstado = aoEstado;
    const origem = location.origin.startsWith('http') ? location.origin : '';
    const params = new URLSearchParams({ enablejsapi: '1', playsinline: '1', rel: '0', iv_load_policy: '3' });
    if (origem) { params.set('origin', origem); params.set('widget_referrer', location.href.split('#')[0]); }
    // referrerpolicy: o YouTube precisa saber de que página vem o player (sem isso, erro 153)
    caixa.innerHTML = `<iframe class="yt-iframe" title="Vídeo da música no YouTube"
      src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}"
      allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    const iframe = caixa.querySelector('iframe');
    const self = this;
    // adaptador: abrirSincronia() usa tocador.el.paused / currentTime como num <audio>
    this.el = {
      get paused() { return !self.tocando; },
      get currentTime() { return self.posicao; },
      set currentTime(v) { self.player?.seekTo?.(Math.max(0, v), true); self._ancorar(v); },
      get duration() { return self.player?.getDuration?.() || Infinity; },
      addEventListener() {}
    };
    this.pronto = carregarApiYouTube().then(YT => new Promise((ok, erro) => {
      const limite = setTimeout(() => erro(new Error('tempo')), 15000);
      this.player = new YT.Player(iframe, {
        events: {
          onReady: () => { clearTimeout(limite); ok(this); },
          onStateChange: e => {
            const S_ = YT.PlayerState;
            this.tocando = e.data === S_.PLAYING;
            if (this.tocando) this._ancorar(this.player.getCurrentTime());
            this.aoEstado?.(e.data);
          },
          onPlaybackRateChange: e => { this.taxaAtual = e.data; this._ancorar(this.player.getCurrentTime()); },
          onError: e => { clearTimeout(limite); const msg = ERROS_YT[e.data] || `Erro do YouTube (${e.data}).`; this.aoErro?.(msg, e.data); erro(Object.assign(new Error(msg), { codigo: e.data })); }
        }
      });
    }));
  }

  _ancorar(yt) { this._ultimo = { yt, quando: performance.now() }; }

  /* getCurrentTime() do YouTube só muda algumas vezes por segundo.
     Entre uma leitura e outra, estimamos: última leitura + tempo passado × velocidade. */
  get posicao() {
    const p = this.player;
    if (!p || !p.getCurrentTime) return 0;
    const yt = p.getCurrentTime();
    if (yt !== this._ultimo.yt) this._ancorar(yt);
    if (!this.tocando) return yt;
    const est = this._ultimo.yt + (performance.now() - this._ultimo.quando) / 1000 * this.taxaAtual;
    return Math.min(est, this._ultimo.yt + 0.6);
  }

  // Pede uma velocidade; o YouTube pode arredondar. Devolve a velocidade que valeu de fato.
  async definirTaxa(fator) {
    const p = this.player;
    if (!p) return 1;
    p.setPlaybackRate(fator);
    await new Promise(r => setTimeout(r, 250));
    let real = p.getPlaybackRate();
    if (Math.abs(real - fator) > 0.01) {
      const lista = p.getAvailablePlaybackRates?.() || [0.5, 0.75, 1];
      const perto = lista.reduce((a, b) => (Math.abs(b - fator) < Math.abs(a - fator) ? b : a), 1);
      p.setPlaybackRate(perto);
      await new Promise(r => setTimeout(r, 200));
      real = p.getPlaybackRate();
    }
    this.taxaAtual = real;
    return real;
  }

  // Começa a tocar em "pos" e só resolve quando o vídeo realmente estiver tocando
  async tocarDe(pos, taxa = null) {
    await this.pronto;
    if (taxa !== null) await this.definirTaxa(taxa);
    this.player.seekTo(Math.max(0, pos), true);
    this.player.playVideo();
    this._ancorar(pos);
    await new Promise(ok => {
      const ini = performance.now();
      const ver = () => (this.tocando || performance.now() - ini > 8000 ? ok() : setTimeout(ver, 50));
      ver();
    });
  }
  parar() { try { this.player?.pauseVideo(); } catch (e) {} }
  pausar() { this.parar(); }
  continuar() { try { this.player?.playVideo(); } catch (e) {} }
  acompanhar() {}                 // no YouTube o vídeo manda; quem acompanha é o jogo
  destruir() { try { this.player?.destroy(); } catch (e) {} this.player = null; }
}

/* ---------- Painel "Gravação original" na tela da música ---------- */
function metaYouTube(m) {
  S.youtube = S.youtube || {};
  // músicas do catálogo já vêm com o vídeo oficial; "removido" = você tirou o vídeo
  if (S.youtube[m.id] === undefined && m.youtube) S.youtube[m.id] = { videoId: m.youtube, offset: 0, bpm: m.bpm, sincronizada: false, usar: true };
  const v = S.youtube[m.id];
  return v && !v.removido ? v : null;
}
function ytPronto(m) {
  const meta = S.youtube?.[m.id];
  return !!(meta && meta.sincronizada && painelYT.tocador && painelYT.ok);
}
const painelYT = { tocador: null, ok: false };

function painelYouTube(caixa, m) {
  painelYT.tocador?.destruir(); painelYT.tocador = null; painelYT.ok = false;
  const meta = metaYouTube(m);
  const busca = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${m.artista} ${m.titulo}`);
  if (!meta) {
    caixa.innerHTML = `
      <div class="yt-vazio">
        <p class="sub">Ouça a música original enquanto aprende. ${Cifras.automatico ? 'O app procura o vídeo oficial para você.' : 'Cole o link do vídeo no YouTube.'}</p>
        ${Cifras.automatico ? `<button class="btn" id="yt-auto">${IC.busca} Procurar a gravação</button>` : ''}
        <form class="busca pequena" id="yt-form">${IC.link}<input id="yt-link" type="url" inputmode="url" placeholder="Link do YouTube" aria-label="Link do YouTube"><button class="btn mini" type="submit">Usar</button></form>
        <p class="sub"><a href="${busca}" target="_blank" rel="noopener">Abrir o YouTube</a> e copiar o link (Compartilhar, Copiar link).</p>
        <p class="sub" id="yt-msg" aria-live="polite"></p>
      </div>`;
    const usar = id => { S.youtube[m.id] = { videoId: id, offset: 0, bpm: m.bpm, sincronizada: false, usar: true }; Store.salvar(); painelYouTube(caixa, m); };
    caixa.querySelector('#yt-form').addEventListener('submit', e => {
      e.preventDefault();
      const id = extrairIdYoutube(caixa.querySelector('#yt-link').value);
      if (!id) { caixa.querySelector('#yt-msg').textContent = 'Não reconheci esse link. Ele deve ser de um vídeo do YouTube.'; return; }
      usar(id);
    });
    caixa.querySelector('#yt-auto')?.addEventListener('click', async e => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner" aria-hidden="true"></span> Procurando…';
      try {
        const vids = await Cifras.youtube(m.titulo, m.artista);
        if (vids[0]) usar(vids[0].id); else throw new Error('Não achei a gravação.');
      } catch (err) { b.disabled = false; b.innerHTML = `${IC.busca} Procurar a gravação`; caixa.querySelector('#yt-msg').textContent = err.message || 'Sem conexão.'; }
    });
    return;
  }
  caixa.innerHTML = `
    <div class="yt-painel">
      <div class="yt-moldura" id="yt-moldura"><div class="yt-player" id="yt-player"></div></div>
      <p class="sub yt-status" id="yt-status">Carregando o player…</p>
      <div class="linha-botoes">
        <button class="btn primario" id="yt-junto" ${meta.sincronizada ? '' : 'hidden'}>${IC.play} Tocar junto com a gravação</button>
        <button class="btn" id="yt-sinc">${meta.sincronizada ? 'Sincronizar de novo' : 'Sincronizar para tocar junto'}</button>
        <button class="btn sem-borda" id="yt-trocar">Trocar vídeo</button>
      </div>
      <div id="yt-sinc-area"></div>
    </div>`;
  const q = s => caixa.querySelector(s);
  const status = t => { const el = q('#yt-status'); if (el) el.innerHTML = t; };
  const textoStatus = () => meta.sincronizada
    ? 'Sincronizado: no jogo, os acordes andam junto com o vídeo.'
    : 'Para o jogo andar junto com o vídeo, sincronize uma vez: leva 20 segundos.';
  const tc = new TocadorYouTube(q('#yt-player'), meta.videoId, {
    aoErro: msg => { painelYT.ok = false; status(`${esc(msg)} <a href="https://www.youtube.com/watch?v=${encodeURIComponent(meta.videoId)}" target="_blank" rel="noopener">Abrir no YouTube</a>`); }
  });
  painelYT.tocador = tc;
  tc.pronto.then(() => { painelYT.ok = true; status(textoStatus()); }).catch(e => {
    painelYT.ok = false;
    if (e.codigo) return;
    status('O player do YouTube não carregou (precisa de internet). <a href="https://www.youtube.com/watch?v=' + encodeURIComponent(meta.videoId) + '" target="_blank" rel="noopener">Abrir no YouTube</a>');
  });
  q('#yt-trocar').addEventListener('click', () => { S.youtube[m.id] = { removido: true }; Store.salvar(); painelYouTube(caixa, m); });
  q('#yt-sinc').addEventListener('click', async () => {
    try { await tc.pronto; } catch (e) { return; }
    await tc.definirTaxa(1);
    abrirSincronia(q('#yt-sinc-area'), m, meta, tc, () => { q('#yt-sinc-area').innerHTML = ''; status(textoStatus()); q('#yt-sinc').textContent = 'Sincronizar de novo'; q('#yt-junto').hidden = false; });
    q('#yt-sinc-area').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  q('#yt-junto').addEventListener('click', () => jogarComGravacao(m, $('#mu-parte')?.value === '' ? null : +($('#mu-parte')?.value)));
}

/* Jogo com o vídeo: o vídeo é o relógio-mestre e fica visível em cima do jogo
   (regra do YouTube: o player precisa aparecer na tela). */
async function jogarComGravacao(m, secao = null, opcoes = {}) {
  if (!ytPronto(m)) return toast('Sincronize o vídeo primeiro');
  const meta = S.youtube[m.id], tc = painelYT.tocador;
  const taxa = await tc.definirTaxa(Math.max(0.5, Math.min(1, (opcoes.vel || S.cfg.vel) / 100)));
  const pos0 = posicaoNaGravacao(meta, temposAteSecao(m, secao));
  const moldura = document.querySelector('#yt-moldura');
  moldura?.classList.add('no-jogo');
  // com o vídeo a música não pode parar, então "esperar por mim" vira "praticar"
  const pedido = opcoes.modo || S.cfg.modo;
  const modo = pedido === 'tempo' ? 'tempo' : 'pratica';
  jogarMusica(m, secao, {
    modo, bpm: meta.bpm * taxa, bpmBase: meta.bpm, gravacao: { tocador: tc, pos0, taxa, mestre: true }, container: $('#janela'),
    // "Jogar de novo", "Recomeçar" e troca de velocidade: volta o vídeo junto
    refazer: novo => jogarComGravacao(m, secao, {
      vel: novo.bpm ? Math.round(novo.bpm / meta.bpm * 100) : Math.round(taxa * 100),
      modo: novo.modo || modo
    }),
    aoSair: () => { moldura?.classList.remove('no-jogo'); tc.parar(); },
    aoFim: () => { moldura?.classList.remove('no-jogo'); }
  });
  await tc.tocarDe(Math.max(0, pos0 - 2.5 * taxa));   // começa 2,5 s antes do 1º acorde
}
