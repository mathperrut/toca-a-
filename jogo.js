/* =========================================================
   TOCA AÍ — jogo.js
   O jogo, no estilo do Yousician:

   • As 6 cordas do violão ficam deitadas na tela (a 1ª corda, a
     mais fina, em cima, como na tablatura).
   • Os acordes e as notas vêm da direita e deslizam até a LINHA
     VERMELHA. Quando chegam nela, você toca.
   • A BOLINHA vermelha pula de batida em batida: ela cai em cima
     do que você deve tocar, no instante exato.
   • O MICROFONE escuta o seu violão:
       - a batida: percebe o instante em que você toca (ataque);
       - o acorde: compara as notas que soam com as notas que o
         acorde deveria ter (cromagrama);
       - a nota: descobre a altura da nota (afinador).

   Três modos:
   ESPERA  a música para em cada acorde e só continua quando você
           acerta. Sem pressa: o melhor jeito de começar.
   TEMPO   a música não para. Pontos pelo tempo certo e pelo
           acorde certo. Estrelas no final.
   PRÁTICA o app toca junto (violão guia e metrônomo), sem pontos.
   ========================================================= */
'use strict';

const Jogo = (() => {
  // Cores dos blocos de acorde no palco preto (uma por acorde da música)
  const CORES = ['#5B8CFF', '#FFB020', '#2FD07A', '#FF5FA2', '#A77BFF', '#29C7E8', '#FF7A45', '#C4E04A'];
  const COR_DEDO = ['#FFFFFF', '#FFC400', '#3D7BFF', '#22C55E', '#A35CFF'];
  const JANELA = { perfeito: 0.075, bom: 0.15, ok: 0.26 };   // segundos (tolerante: é para iniciantes)
  const ehMovel = () => matchMedia('(pointer: coarse)').matches;

  /* ---------- Ouvido: o que o microfone escuta ---------- */
  // Modelo de cromagrama de um conjunto de notas MIDI (com harmônicos, como audio-detect.js)
  function modeloNotas(midis) {
    const v = new Array(12).fill(0);
    for (const n of midis) for (const [st, peso] of HARMONICOS) v[(n + st) % 12] += peso;
    const media = v.reduce((a, b) => a + b, 0) / 12;
    const c = v.map(x => x - media), norma = Math.hypot(...c) || 1;
    return c.map(x => x / norma);
  }
  function centralizar(croma) {
    const media = croma.reduce((a, b) => a + b, 0) / 12;
    const c = Array.from(croma, x => x - media), norma = Math.hypot(...c) || 1;
    return c.map(x => x / norma);
  }
  const produto = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

  /* Compara o som com o acorde esperado e com os outros da música.
     Aceita o acorde tocado com ou sem capotraste (muita gente não tem). */
  function avaliarAcorde(croma, esperado, outros, capo) {
    const c = centralizar(croma);
    const variantes = nome => [...new Set([0, capo || 0])].map(k => modeloNotas(notasDoAcorde(nome, k)));
    const sim = nome => Math.max(...variantes(nome).map(t => produto(c, t)));
    const sEsp = sim(esperado);
    let melhorOutro = null, sOutro = -1;
    for (const o of outros) {
      if (o === esperado || simplificar(o) === simplificar(esperado)) continue;
      const s = sim(o);
      if (s > sOutro) { sOutro = s; melhorOutro = o; }
    }
    const ok = sEsp >= 0.52 && sEsp >= sOutro - 0.04;
    return { ok, sim: sEsp, outro: melhorOutro, simOutro: sOutro };
  }
  // Qual acorde comum soou mais parecido? (só para mostrar "Ouvi Em" ao aluno)
  const COMUNS = ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em', 'Bm', 'A7', 'B7', 'C7', 'D7', 'E7', 'G7', 'Am7', 'Em7', 'Dm7'];
  function identificar(croma, extras = [], capo = 0) {
    const c = centralizar(croma);
    let melhor = null, s = -1;
    for (const nome of [...new Set([...extras, ...COMUNS])]) {
      const v = Math.max(...[...new Set([0, capo || 0])].map(k => produto(c, modeloNotas(notasDoAcorde(nome, k)))));
      if (v > s) { s = v; melhor = nome; }
    }
    return s > 0.6 ? melhor : null;
  }
  // Lê o cromagrama algumas vezes e tira a média (som mais estável)
  function lerCroma(vezes = 4, intervalo = 60) {
    return new Promise(ok => {
      const soma = new Float64Array(12);
      let n = 0, energia = 0;
      const ler = () => {
        const r = Detector.croma();
        if (r && r.energia > 1e-7) { for (let i = 0; i < 12; i++) soma[i] += r.croma[i]; energia += r.energia; n++; }
        if (--vezes > 0) setTimeout(ler, intervalo); else ok(n ? { croma: Array.from(soma, x => x / n), energia: energia / n } : null);
      };
      ler();
    });
  }
  // Lê a altura algumas vezes e devolve a nota MIDI (mediana)
  function lerNota(vezes = 4, intervalo = 45) {
    return new Promise(ok => {
      const fs = [];
      const ler = () => {
        const r = Detector.altura();
        if (r && r.freq > 70 && r.freq < 1400 && r.clareza > 0.75) fs.push(r.freq);
        if (--vezes > 0) setTimeout(ler, intervalo); else ok(fs.length ? 69 + 12 * Math.log2(mediana(fs) / 440) : null);
      };
      ler();
    });
  }

  /* ---------- Montagem dos eventos ---------- */
  function eventosDeAcordes(trechos, padrao, ritmo) {
    const ev = [];
    const nova = (beat, tok, k, primeiro) => ev.push({ tipo: 'golpe', beat, tok, k, acorde: trechos[k].acorde, cordas: cordasDoGolpe(trechos[k].acorde, tok), primeiro });
    if (ritmo === 'acorde') trechos.forEach((tr, k) => nova(tr.inicio, 'D', k, true));
    else if (ritmo === 'tempos') trechos.forEach((tr, k) => { for (let b = 0; b < Math.max(1, Math.round(tr.tempos)); b++) nova(tr.inicio + b, 'D', k, b === 0); });
    else {
      const total = trechos.at(-1).inicio + trechos.at(-1).tempos;
      let k = 0;
      for (let s = 0; s < Math.round(total * padrao.sub); s++) {
        const beat = s / padrao.sub;
        while (k < trechos.length - 1 && trechos[k + 1].inicio <= beat + 1e-6) k++;
        const tok = padrao.passos[s % padrao.passos.length];
        const primeiro = Math.abs(beat - trechos[k].inicio) < 1e-6;
        if (tok === '-' && !primeiro) continue;
        nova(beat, tok === '-' ? 'D' : tok, k, primeiro);
      }
    }
    return ev;
  }
  function eventosDeNotas(notas) {
    return notas.map((n, k) => ({ tipo: 'nota', beat: n.inicio, k, midi: n.midi, corda: n.corda, casa: n.casa, dedo: n.dedo, dur: n.tempos, primeiro: true }));
  }

  /* ---------- A partida ---------- */
  class Partida {
    constructor(cfg) {
      this.cfg = cfg;
      this.modo = cfg.modo || 'espera';
      this.bpm = cfg.bpm;
      this.capo = cfg.temCapo ? (cfg.capo || 0) : 0;            // capo usado no SOM do app
      this.capoDetect = cfg.capo || 0;                           // o microfone aceita com e sem
      this.melodia = !!cfg.notas;
      if (this.melodia) {
        this.trechos = cfg.notas.map(n => ({ acorde: null, inicio: n.inicio, tempos: n.tempos }));
        this.eventos = eventosDeNotas(cfg.notas);
      } else {
        this.trechos = cfg.trechos.map(t => ({ ...t, acorde: cfg.facil !== false ? simplificar(t.acorde) : t.acorde }));
        this.eventos = eventosDeAcordes(this.trechos, cfg.padrao, cfg.ritmo || 'acorde');
      }
      this.acordes = [...new Set(this.trechos.map(t => t.acorde).filter(Boolean))];
      this.corDe = Object.fromEntries(this.acordes.map((a, i) => [a, CORES[i % CORES.length]]));
      this.totalBeats = this.trechos.at(-1).inicio + this.trechos.at(-1).tempos;
      this.beatsPorCompasso = cfg.padrao && cfg.padrao.beats >= 3 ? cfg.padrao.beats : 4;
      this.entrada = cfg.entrada || 'mic';
      Object.assign(this, { pontos: 0, combo: 0, maxCombo: 0, perf: 0, bons: 0, oks: 0, perdidas: 0, errosAcorde: 0,
        acordesCertos: 0, acordesChecados: 0, desvios: [], fracos: {}, rodando: false, pausado: false, efeitos: [] });
    }

    /* ----- Tela ----- */
    montar() {
      const c = this.cfg;
      const el = document.createElement('div');
      el.className = 'jogo' + (c.gravacao ? ' com-video' : '');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Jogo: ' + c.titulo);
      el.innerHTML = `
        <header class="jg-topo">
          <button class="jg-btn" data-a="sair" aria-label="Sair do jogo">${IC.fechar}</button>
          <div class="jg-titulo"><b>${esc(c.titulo)}</b><small id="jg-sub"></small></div>
          <button class="jg-btn" data-a="pausa" aria-label="Pausar">${IC.pausa}</button>
        </header>
        <div class="jg-prog" aria-hidden="true"><i id="jg-prog"></i></div>
        <section class="jg-acordes" aria-live="polite">
          <div class="jg-agora"><div class="jg-diag" id="jg-diag"></div><div class="jg-nome"><b id="jg-nome">—</b><small id="jg-mao"></small></div></div>
          <div class="jg-depois" id="jg-depois"><small>Depois</small><div class="jg-diag mini" id="jg-diag2"></div><b id="jg-nome2"></b><span class="jg-falta" id="jg-falta"></span></div>
        </section>
        <div class="jg-palco" id="jg-palco">
          <canvas id="jg-canvas"></canvas>
          <div class="jg-aviso" id="jg-aviso" hidden></div>
          <div class="jg-contagem" id="jg-contagem" hidden></div>
          <div class="jg-feedback" id="jg-feedback"></div>
        </div>
        <footer class="jg-rodape">
          <div class="jg-mic" id="jg-mic"><span class="jg-nivel" aria-hidden="true"><i id="jg-nivel"></i></span><span id="jg-ouvi">${this.entrada === 'mic' ? 'Ligando o microfone…' : this.entrada === 'toque' ? 'Toque na tela a cada batida' : 'Toque junto'}</span></div>
          <div class="jg-tempos" id="jg-tempos">${Array.from({ length: this.beatsPorCompasso }, (_, i) => `<i>${i + 1}</i>`).join('')}</div>
          <div class="jg-pontos" ${this.modo !== 'tempo' ? 'hidden' : ''}><b id="jg-pontos">0</b><small>pontos</small></div>
        </footer>
        <div class="jg-camada" id="jg-camada" hidden></div>`;
      (c.container || document.body).appendChild(el);
      document.body.classList.add('travado', 'em-jogo');
      this.el = el;
      this.$ = s => el.querySelector(s);
      this.canvas = this.$('#jg-canvas');
      this.g = this.canvas.getContext('2d');
      el.querySelector('[data-a="sair"]').addEventListener('click', () => this.sair());
      el.querySelector('[data-a="pausa"]').addEventListener('click', () => this.pausar());
      // toque na tela: conta como uma batida (sem microfone) ou pula a espera
      this.$('#jg-palco').addEventListener('pointerdown', e => {
        if (this.entrada === 'toque' && this.rodando && !this.pausado) { e.preventDefault(); this.aoTocar(Som.agora, true); }
      });
      this.tecla = e => {
        if (e.key === 'Escape') { e.preventDefault(); this.pausado ? this.continuar() : this.pausar(); }
        if (e.code === 'Space' && this.entrada === 'toque' && this.rodando && !this.pausado) { e.preventDefault(); this.aoTocar(Som.agora, true); }
      };
      document.addEventListener('keydown', this.tecla);
      this.aoRedim = () => this.medir();
      window.addEventListener('resize', this.aoRedim);
      this.medir();
      this.atualizarSub();
    }
    atualizarSub() {
      const nomes = { espera: 'Esperando você', tempo: 'No tempo', pratica: 'Prática' };
      const pct = this.cfg.bpmBase ? Math.round(this.bpm / this.cfg.bpmBase * 100) : null;
      this.$('#jg-sub').textContent = `${nomes[this.modo]}, ${pct ? pct + '% da velocidade' : Math.round(this.bpm) + ' BPM'}`;
    }

    medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = this.canvas.clientWidth || 360, h = this.canvas.clientHeight || 260;
      this.W = w; this.H = h;
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.nowX = Math.round(Math.max(56, w * 0.2));
      // quantos tempos aparecem à frente: mais tempos em telas largas
      const tempos = Math.max(5, Math.min(12, (w - this.nowX) / 58));
      this.pxBeat = (w - this.nowX) / tempos;
      // as 6 cordas ficam centralizadas, sem espalhar demais em telas altas
      this.gap = Math.max(18, Math.min(38, (h - 64) / 5));
      this.topo = Math.max(34, Math.round((h - 5 * this.gap) / 2 + 6));
      this.base = this.topo + 5 * this.gap;
    }
    // y da corda i (0 = 6ª corda, a mais grossa). Padrão de tablatura: 1ª corda em cima.
    yCorda(i) { return S.cfg.cordaGraveEmCima ? this.topo + i * this.gap : this.topo + (5 - i) * this.gap; }

    /* ----- Começar ----- */
    async iniciar() {
      this.montar();
      Som.init(); Som.pararTudo();
      this.mostrarAcorde(0);
      if (this.entrada === 'mic') {
        try {
          await Detector.ligar();
          this.$('#jg-ouvi').textContent = 'Ouvindo';
          this.offAtaque = Detector.aoAtacar(a => { this.ultimoAtaqueMic = a.t; this.aoTocar(a.t - this.latencia(), false); });
          this.offNivel = Detector.aoNivel(e => { const n = this.$('#jg-nivel'); if (n) n.style.transform = `scaleX(${Math.min(1, Math.sqrt(e) * 4)})`; });
        } catch (e) {
          this.entrada = 'toque';
          this.$('#jg-ouvi').textContent = 'Sem microfone: toque na tela a cada batida';
          toast(msgSemMicrofone(e));
        }
      }
      if (this.modo === 'tempo' && this.entrada === 'mic' && !this.cfg.gravacao) this.mostrarAviso('Dica: com fone de ouvido o microfone escuta só o seu violão', 2600);
      ativos.add('jogo');
      this.rodando = true;
      const seg = 60 / this.bpm;
      if (this.modo === 'espera') {
        this.cursor = -2;                     // começa 2 tempos antes do 1º acorde
        this.ultimoQuadro = performance.now();
        this.esperando = null;
      } else {
        const conta = this.beatsPorCompasso;
        this.t0 = Som.agora + 0.6 + conta * seg;
        if (!this.cfg.gravacao) for (let b = 0; b < conta; b++) Som.click(this.t0 - (conta - b) * seg, b === 0, 0.55);
        this.inicioContagem = this.t0 - conta * seg;
        this.eventos.forEach(e => { e.t = this.t0 + e.beat * seg; });
        this.agendados = 0;
        this.proxClique = 0;
      }
      this.raf = requestAnimationFrame(() => this.quadro());
      return this;
    }
    latencia() { return Math.max(0, Math.min(0.3, S.cfg.latencia ?? this.latAuto ?? 0.06)); }
    tempoBeat(beat) { return this.t0 + beat * 60 / this.bpm; }
    beatAgora() {
      if (this.modo === 'espera') return this.cursor;
      return (Som.agora - this.t0) * this.bpm / 60;
    }

    /* ----- Loop principal (60 vezes por segundo) ----- */
    quadro() {
      if (!this.rodando) return;
      if (!this.pausado) {
        if (this.modo === 'espera') this.passoEspera();
        else this.passoTempo();
        if (!this.rodando) return; // terminou neste quadro
      }
      this.desenhar();
      this.raf = requestAnimationFrame(() => this.quadro());
    }

    passoTempo() {
      const agora = Som.agora, seg = 60 / this.bpm;
      if (this.cfg.gravacao?.mestre) this.seguirVideo(agora);
      // sons agendados um pouco à frente (violão guia e metrônomo, só na prática)
      if (this.modo === 'pratica') {
        while (this.agendados < this.eventos.length && this.eventos[this.agendados].t < agora + 0.3) {
          const e = this.eventos[this.agendados++];
          if (e.t > agora - 0.02 && this.cfg.guia !== false) {
            if (e.tipo === 'golpe') Som.golpe(e.acorde, e.t, e.tok, e.primeiro ? 0.32 : 0.26, this.capo);
            else Som.nota(440 * Math.pow(2, (e.midi - 69) / 12), e.t, 0.45, e.corda);
          }
        }
        const totalTempos = Math.ceil(this.totalBeats);
        while (this.proxClique < totalTempos && this.tempoBeat(this.proxClique) < agora + 0.3) {
          const b = this.proxClique++, t = this.tempoBeat(b);
          if (t > agora - 0.02 && this.cfg.metronomo !== false && !this.cfg.gravacao) Som.click(t, b % this.beatsPorCompasso === 0, 0.22);
        }
      } else if (this.cfg.metronomo && !this.cfg.gravacao) {
        const totalTempos = Math.ceil(this.totalBeats);
        while (this.proxClique < totalTempos && this.tempoBeat(this.proxClique) < agora + 0.3) {
          const b = this.proxClique++, t = this.tempoBeat(b);
          if (t > agora - 0.02) Som.click(t, b % this.beatsPorCompasso === 0, 0.18);
        }
      }
      // contagem regressiva
      const cont = this.$('#jg-contagem');
      if (agora < this.t0) { const n = Math.ceil((this.t0 - agora) / seg); cont.hidden = false; cont.textContent = n; }
      else cont.hidden = true;
      // perdidas
      if (this.modo === 'tempo') {
        for (const e of this.eventos) if (!e.estado && agora > e.t + JANELA.ok + 0.02) this.marcarPerdida(e);
      }
      const beat = this.beatAgora();
      this.atualizarPainel(beat);
      if (beat > this.totalBeats + 1) this.terminar();
    }

    passoEspera() {
      const agora = performance.now(), dt = Math.min(0.1, (agora - this.ultimoQuadro) / 1000);
      this.ultimoQuadro = agora;
      // próximo ponto de espera: o 1º golpe de cada acorde (ou cada nota)
      const prox = this.eventos.find(e => e.primeiro && !e.estado);
      const limite = prox ? prox.beat : this.totalBeats + 1;
      const antes = this.cursor;
      this.cursor = Math.min(limite, this.cursor + dt * this.bpm / 60);
      // golpes do meio (não obrigatórios) que passaram: só somem
      for (const e of this.eventos) if (!e.primeiro && !e.estado && e.beat < this.cursor - 0.3) e.estado = 'livre';
      // metrônomo suave enquanto anda (opcional)
      if (this.cfg.metronomo && Math.floor(antes) !== Math.floor(this.cursor) && this.cursor >= 0 && this.cursor < limite) Som.click(Som.agora + 0.01, Math.floor(this.cursor) % this.beatsPorCompasso === 0, 0.15);
      if (prox && this.cursor >= limite - 1e-6) {
        if (this.esperando !== prox) {
          this.esperando = prox; this.inicioEspera = Som.agora;
          this.mostrarEspera(prox);
          if (this.entrada === 'mic') this.ouvirEspera(prox);
        } else if (Som.agora - this.inicioEspera > 9 && !this.dicaPular) {
          this.dicaPular = true;
          this.mostrarEspera(prox, true);
        }
      } else if (this.esperando && this.esperando.estado) { this.esperando = null; this.$('#jg-aviso').hidden = true; }
      this.atualizarPainel(this.cursor);
      if (!prox && this.cursor >= this.totalBeats + 0.5) this.terminar();
    }

    mostrarEspera(e, comPular = false) {
      const a = this.$('#jg-aviso');
      const alvo = e.tipo === 'nota' ? `a nota da ${ORD[e.corda]} corda, casa ${e.casa}` : `<b>${esc(e.acorde)}</b>`;
      a.innerHTML = `<span>Toque ${alvo}</span>${comPular ? `<button class="jg-pular" type="button">Pular</button>` : ''}`;
      a.hidden = false;
      a.querySelector('.jg-pular')?.addEventListener('click', ev => { ev.stopPropagation(); this.acertarEspera(e, 'pulou'); });
    }
    // No modo espera, escuta continuamente até reconhecer o acorde/nota
    async ouvirEspera(e) {
      const minhaVez = this.esperando;
      let ultimoAtaque = this.ultimoAtaqueMic && Som.agora - this.ultimoAtaqueMic < 0.8 ? this.ultimoAtaqueMic : 0;
      const off = Detector.aoAtacar(a => { ultimoAtaque = a.t; });
      const checar = async () => {
        if (!this.rodando || this.esperando !== minhaVez || e.estado) { off(); return; }
        if (this.pausado) return setTimeout(checar, 200);
        if (ultimoAtaque && Som.agora - ultimoAtaque < 1.2) {
          if (e.tipo === 'nota') {
            const m = await lerNota(3, 40);
            if (m !== null && (Math.abs(m - e.midi - this.capoDetect) < 0.6 || Math.abs(m - e.midi) < 0.6 || Math.abs(Math.abs(m - e.midi) - 12) < 0.6)) { off(); return this.acertarEspera(e, 'ok'); }
            if (m !== null) this.mostrarOuvi(infoNota(440 * Math.pow(2, (m - 69) / 12)).nomePt, false);
          } else {
            const r = await lerCroma(3, 50);
            if (r) {
              const av = avaliarAcorde(r.croma, e.acorde, this.acordes, this.capoDetect);
              if (av.ok) { off(); return this.acertarEspera(e, 'ok'); }
              const ouvido = identificar(r.croma, this.acordes, this.capoDetect);
              this.mostrarOuvi(ouvido || 'outro som', false);
            }
          }
        }
        setTimeout(checar, 120);
      };
      checar();
    }
    acertarEspera(e, como) {
      if (e.estado) return;
      e.estado = como === 'pulou' ? 'pulou' : 'perfeito';
      this.dicaPular = false;
      if (como !== 'pulou') { this.perf++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.efeito(e, 'bom'); this.feedback(this.combo >= 3 ? `Isso! ${this.combo} seguidos` : 'Isso!', 'otimo'); vibrar(12); if (e.tipo === 'golpe') this.mostrarOuvi(e.acorde, true); }
      else { this.combo = 0; this.feedback('Pulou', 'neutro'); }
      this.$('#jg-aviso').hidden = true;
      this.esperando = null;
    }

    /* ----- Batidas detectadas (microfone ou toque) ----- */
    aoTocar(t, toque) {
      if (!this.rodando || this.pausado) return;
      if (this.modo === 'espera') {
        if (toque && this.esperando) this.acertarEspera(this.esperando, 'ok');
        else if (!this.esperando) {                      // golpes do meio: acende se bater perto
          const b = this.cursor;
          const e = this.eventos.find(x => !x.primeiro && !x.estado && Math.abs(x.beat - b) < 0.35);
          if (e) { e.estado = 'bom'; this.efeito(e, 'bom'); }
        }
        return;
      }
      if (this.modo !== 'tempo' || t < this.t0 - 0.4) return;
      let melhor = null;
      for (const e of this.eventos) if (!e.estado && Math.abs(e.t - t) <= JANELA.ok && (!melhor || Math.abs(e.t - t) < Math.abs(melhor.t - t))) melhor = e;
      if (!melhor) return; // batidas fora de hora não tiram pontos (iniciante não deve ser punido por ruído)
      const desvio = t - melhor.t, d = Math.abs(desvio);
      this.desvios.push(desvio);
      // sem calibração: aprende o atraso do microfone com as primeiras batidas
      if (!toque && S.cfg.latencia == null && this.desvios.length >= 6 && this.desvios.length <= 14) {
        const corr = mediana(this.desvios.slice(-6));
        this.latAuto = Math.max(0, Math.min(0.25, (this.latAuto ?? 0.06) + corr * 0.5));
      }
      const [estado, pts, txt] = d <= JANELA.perfeito ? ['perfeito', 100, 'Perfeito!'] : d <= JANELA.bom ? ['bom', 70, desvio < 0 ? 'Bom, um pouco cedo' : 'Bom, um pouco tarde'] : ['ok', 40, desvio < 0 ? 'Cedo' : 'Tarde'];
      melhor.estado = estado; melhor.pts = pts;
      if (estado === 'perfeito') this.perf++; else if (estado === 'bom') this.bons++; else this.oks++;
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.pontos += pts + Math.min(this.combo, 20) * 2;
      this.efeito(melhor, 'bom');
      this.feedback(this.combo >= 4 ? `${txt} ×${this.combo}` : txt, estado === 'perfeito' ? 'otimo' : 'bom');
      this.$('#jg-pontos').textContent = this.pontos;
      vibrar(estado === 'perfeito' ? 12 : 6);
      // confere o acorde (uma vez por acorde) ou a nota
      if (!toque && this.entrada === 'mic') {
        if (melhor.tipo === 'nota') this.conferirNota(melhor);
        else if (melhor.primeiro || !this.trechos[melhor.k].checado) this.conferirAcorde(melhor);
      }
    }
    async conferirAcorde(e) {
      const tr = this.trechos[e.k];
      if (tr.checado) return;
      tr.checado = true;
      await new Promise(r => setTimeout(r, 110));
      const r = await lerCroma(4, 55);
      if (!r || !this.rodando) { tr.checado = false; return; }
      const av = avaliarAcorde(r.croma, e.acorde, this.acordes, this.capoDetect);
      this.acordesChecados++;
      if (av.ok) { this.acordesCertos++; this.pontos += 50; e.acordeOk = true; this.mostrarOuvi(e.acorde, true); this.$('#jg-pontos').textContent = this.pontos; }
      else {
        e.estado = 'acordeErrado'; this.errosAcorde++; this.combo = 0;
        this.fracos[e.acorde] = (this.fracos[e.acorde] || 0) + 1;
        const ouvido = identificar(r.croma, this.acordes, this.capoDetect);
        this.mostrarOuvi(ouvido || 'outro som', false);
        this.feedback(ouvido ? `Soou como ${ouvido}` : `Confira o ${e.acorde}`, 'aviso');
      }
    }
    async conferirNota(e) {
      await new Promise(r => setTimeout(r, 50));
      const m = await lerNota(4, 40);
      if (m === null || !this.rodando) return;
      const certo = Math.abs(m - e.midi) < 0.6 || Math.abs(m - e.midi - this.capoDetect) < 0.6 || Math.abs(Math.abs(m - e.midi) - 12) < 0.6;
      this.acordesChecados++;
      if (certo) { this.acordesCertos++; this.pontos += 30; this.$('#jg-pontos').textContent = this.pontos; }
      else { e.estado = 'acordeErrado'; this.errosAcorde++; this.feedback('Nota diferente', 'aviso'); }
      this.mostrarOuvi(infoNota(440 * Math.pow(2, (m - 69) / 12)).nomePt, certo);
    }
    marcarPerdida(e) {
      e.estado = 'passou'; this.perdidas++; this.combo = 0;
      if (e.tipo === 'golpe' && e.primeiro) this.fracos[e.acorde] = (this.fracos[e.acorde] || 0) + 1;
      if (e.primeiro) this.feedback('Passou', 'neutro');
    }
    mostrarOuvi(nome, certo) {
      const el = this.$('#jg-ouvi');
      if (!el) return;
      el.innerHTML = `Ouvi <b>${esc(nome)}</b> ${certo ? IC.check : ''}`;
      el.parentElement.classList.toggle('certo', !!certo);
    }

    /* ----- Vídeo do YouTube como relógio-mestre ----- */
    seguirVideo(agora) {
      const g = this.cfg.gravacao, tc = g.tocador;
      if (!tc.tocando) return;
      const erro = (agora - this.t0) - (tc.posicao - g.pos0) / g.taxa;
      if (Math.abs(erro) > 0.25) this.deslocar(erro);
      else if (Math.abs(erro) > 0.025) this.deslocar(erro * 0.3);
    }
    deslocar(dt) { this.t0 += dt; this.eventos.forEach(e => { e.t += dt; }); }

    /* ----- Painel de cima: acorde atual, próximo, mão direita ----- */
    atualizarPainel(beat) {
      let k = this.trechos.findIndex(t => beat >= t.inicio - 0.08 && beat < t.inicio + t.tempos - 0.08);
      if (k < 0) k = beat < 0 ? 0 : this.trechos.length - 1;
      if (k !== this._k) { this._k = k; this.mostrarAcorde(k); }
      // "em 3, 2, 1": avisa a troca
      const prox = this.proxDiferente;
      const falta = prox ? Math.ceil(prox.inicio - beat - 0.02) : 99;
      const fx = this.$('#jg-falta');
      fx.textContent = falta >= 1 && falta <= 3 && this.modo !== 'espera' ? `em ${falta}` : '';
      this.$('#jg-depois').classList.toggle('chegando', falta >= 1 && falta <= 2 && this.modo !== 'espera');
      // mão direita: o que fazer no próximo golpe
      const pe = this.eventos.find(e => !e.estado && e.beat >= beat - 0.1);
      this.$('#jg-mao').textContent = pe && pe.tipo === 'golpe' ? NOME_GOLPE[pe.tok] : pe && pe.tipo === 'nota' ? `Dedo ${pe.dedo || '–'}, casa ${pe.casa}` : '';
      // bolinhas dos tempos do compasso
      const bi = beat >= 0 ? Math.floor(beat + 0.001) % this.beatsPorCompasso : -1;
      if (bi !== this._bi) { this._bi = bi; this.el.querySelectorAll('#jg-tempos i').forEach((x, i) => x.classList.toggle('on', i === bi)); }
      this.$('#jg-prog').style.transform = `scaleX(${Math.max(0, Math.min(1, beat / this.totalBeats))})`;
    }
    mostrarAcorde(k) {
      const tr = this.trechos[k];
      if (this.melodia) {
        const e = this.eventos[k];
        this.$('#jg-diag').innerHTML = bracoNotaSVG(e.corda, e.casa, e.dedo);
        this.$('#jg-nome').textContent = infoNota(440 * Math.pow(2, (e.midi - 69) / 12)).nomePt;
        const p = this.eventos[k + 1];
        this.proxDiferente = p ? this.trechos[k + 1] : null;
        this.$('#jg-diag2').innerHTML = p ? bracoNotaSVG(p.corda, p.casa, p.dedo, true) : '';
        this.$('#jg-nome2').textContent = p ? infoNota(440 * Math.pow(2, (p.midi - 69) / 12)).nomePt : 'fim';
        return;
      }
      this.$('#jg-diag').innerHTML = diagramaAcorde(tr.acorde, { tam: 'jogo', rotulos: false });
      this.$('#jg-nome').textContent = tr.acorde;
      const prox = this.trechos.slice(k + 1).find(t => t.acorde !== tr.acorde) || null;
      this.proxDiferente = prox;
      this.$('#jg-diag2').innerHTML = prox ? diagramaAcorde(prox.acorde, { tam: 'jogo', rotulos: false }) : '';
      this.$('#jg-nome2').textContent = prox ? prox.acorde : 'fim';
    }

    feedback(txt, cls) {
      const f = this.$('#jg-feedback');
      if (!f) return;
      f.textContent = txt; f.className = 'jg-feedback ' + cls;
      void f.offsetWidth; f.classList.add('pop');
    }
    mostrarAviso(txt, ms) {
      const a = this.$('#jg-aviso'); a.innerHTML = `<span>${esc(txt)}</span>`; a.hidden = false;
      setTimeout(() => { if (a.isConnected && !this.esperando) a.hidden = true; }, ms);
    }
    efeito(e, tipo) { this.efeitos.push({ beat: e.beat, y: this.yDoEvento(e), ini: performance.now(), tipo }); }
    yDoEvento(e) {
      if (e.tipo === 'nota') return this.yCorda(e.corda);
      const ys = (e.cordas.length ? e.cordas : [0, 5]).map(i => this.yCorda(i));
      return (Math.min(...ys) + Math.max(...ys)) / 2;
    }

    /* ----- Desenho do palco ----- */
    x(beat, agoraBeat) { return this.nowX + (beat - agoraBeat) * this.pxBeat; }
    desenhar() {
      const g = this.g, W = this.W, H = this.H, b = this.beatAgora();
      g.clearRect(0, 0, W, H);
      const deBeat = b - this.nowX / this.pxBeat - 1, ateBeat = b + (W - this.nowX) / this.pxBeat + 1;
      // grade dos tempos (compasso mais forte)
      for (let k = Math.max(0, Math.floor(deBeat)); k <= Math.min(Math.ceil(this.totalBeats), ateBeat); k++) {
        const x = this.x(k, b);
        const forte = k % this.beatsPorCompasso === 0;
        g.fillStyle = forte ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)';
        g.fillRect(Math.round(x), this.topo - 14, 1, this.base - this.topo + 28);
      }
      // cordas
      for (let i = 0; i < 6; i++) {
        const y = Math.round(this.yCorda(i)) + 0.5;
        g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 0.8 + (5 - i) * 0.32;
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      // nomes das cordas
      g.font = '600 11px Jost, system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText(LETRAS_CORDAS[i], 6, this.yCorda(i)); }
      if (this.melodia) this.desenharNotas(b, deBeat, ateBeat);
      else this.desenharAcordes(b, deBeat, ateBeat);
      // linha de tocar (vermelha) e a bolinha
      g.fillStyle = 'rgba(255,46,77,0.16)';
      g.fillRect(this.nowX - 7, this.topo - 18, 14, this.base - this.topo + 36);
      g.fillStyle = '#FF2E4D';
      g.fillRect(this.nowX - 1.5, this.topo - 18, 3, this.base - this.topo + 36);
      this.desenharBolinha(b);
      // efeitos de acerto
      const agora = performance.now();
      this.efeitos = this.efeitos.filter(f => agora - f.ini < 420);
      for (const f of this.efeitos) {
        const p = (agora - f.ini) / 420;
        g.strokeStyle = `rgba(47,208,122,${1 - p})`; g.lineWidth = 3 * (1 - p) + 1;
        g.beginPath(); g.arc(this.nowX, f.y, 12 + p * 30, 0, Math.PI * 2); g.stroke();
      }
    }
    desenharAcordes(b, deBeat, ateBeat) {
      const g = this.g;
      // blocos de acorde (a faixa colorida mostra as cordas que você toca)
      this.trechos.forEach(tr => {
        const ini = tr.inicio, fim = tr.inicio + tr.tempos;
        if (fim < deBeat || ini > ateBeat) return;
        const a = acordePorNome(tr.acorde), cor = this.corDe[tr.acorde];
        const cordas = a ? [0, 1, 2, 3, 4, 5].filter(i => a.frets[i] >= 0) : [0, 1, 2, 3, 4, 5];
        const ys = cordas.map(i => this.yCorda(i));
        const y1 = Math.min(...ys) - 10, y2 = Math.max(...ys) + 10;
        const x1 = this.x(ini, b) + 3, x2 = this.x(fim, b) - 3;
        const atual = b >= ini && b < fim;
        g.fillStyle = hexAlfa(cor, atual ? 0.26 : 0.15);
        retRedondo(g, x1, y1, Math.max(6, x2 - x1), y2 - y1, 8); g.fill();
        g.strokeStyle = hexAlfa(cor, atual ? 0.95 : 0.55); g.lineWidth = atual ? 2 : 1.2; g.stroke();
        // nome do acorde em cima do bloco (gruda na linha enquanto o acorde soa)
        const xn = Math.max(x1 + 6, Math.min(this.nowX + 8, x2 - 40));
        g.font = '800 17px Jost, system-ui, sans-serif'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
        g.fillStyle = atual ? '#FFFFFF' : hexAlfa('#FFFFFF', 0.8);
        if (x2 - xn > 22) g.fillText(tr.acorde, atual ? xn : x1 + 6, Math.max(14, y1 - 6));
      });
      // golpes: barra vertical nas cordas tocadas, com a seta da direção
      for (const e of this.eventos) {
        if (e.beat < deBeat || e.beat > ateBeat) continue;
        const x = this.x(e.beat, b);
        const ys = (e.cordas.length ? e.cordas : [0]).map(i => this.yCorda(i));
        const y1 = Math.min(...ys) - 6, y2 = Math.max(...ys) + 6;
        const cor = e.estado === 'perfeito' || e.estado === 'bom' || e.estado === 'ok' ? '#2FD07A'
          : e.estado === 'acordeErrado' ? '#FFB020' : e.estado === 'passou' ? 'rgba(255,255,255,0.22)'
          : e.estado === 'livre' || e.estado === 'pulou' ? 'rgba(255,255,255,0.3)' : '#FFFFFF';
        g.fillStyle = cor;
        const larg = e.primeiro ? 7 : 5;
        if (['B', 'p'].includes(e.tok) || e.cordas.length === 1) {
          g.beginPath(); g.arc(x, ys[0], 9, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#000'; g.font = '800 10px Jost, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText({ B: 'P', p: 'P', i: 'i', m: 'm', a: 'a' }[e.tok] || '•', x, ys[0] + 0.5);
        } else {
          retRedondo(g, x - larg / 2, y1, larg, y2 - y1, larg / 2); g.fill();
          if (e.tok === 'D' || e.tok === 'U' || e.tok === 'T') {
            // seta: ↓ para baixo (da grossa para a fina), ↑ para cima
            const yS = this.topo - 22, s = e.tok === 'U' ? -1 : 1;
            g.beginPath(); g.moveTo(x - 6, yS - 5 * s); g.lineTo(x + 6, yS - 5 * s); g.lineTo(x, yS + 5 * s); g.closePath(); g.fill();
          }
          if (e.tok === 'F' || e.tok === 'X') {
            g.font = '800 10px Jost, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(e.tok === 'F' ? 'd' : 'P+d', x, this.topo - 22);
          }
        }
      }
    }
    desenharNotas(b, deBeat, ateBeat) {
      const g = this.g;
      for (const e of this.eventos) {
        const fim = e.beat + (e.dur || 1);
        if (fim < deBeat || e.beat > ateBeat) continue;
        const x = this.x(e.beat, b), y = this.yCorda(e.corda);
        const cor = e.estado === 'perfeito' || e.estado === 'bom' || e.estado === 'ok' ? '#2FD07A' : e.estado === 'acordeErrado' ? '#FFB020' : e.estado === 'passou' ? '#555' : COR_DEDO[e.dedo || 0];
        // rastro (duração da nota)
        g.fillStyle = hexAlfa(cor === '#555' ? '#FFFFFF' : cor, 0.28);
        retRedondo(g, x, y - 4, Math.max(0, this.x(fim, b) - x - 6), 8, 4); g.fill();
        g.fillStyle = cor;
        g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#000'; g.font = '800 13px Jost, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(e.casa), x, y + 0.5);
      }
    }
    // A bolinha cai em cima do próximo golpe/nota no instante exato
    desenharBolinha(b) {
      const g = this.g;
      const futuros = this.eventos.filter(e => e.beat >= b - 1e-6);
      const prox = futuros[0];
      const ant = [...this.eventos].reverse().find(e => e.beat < b - 1e-6);
      if (!prox) return;
      const bAnt = ant ? ant.beat : Math.min(b, prox.beat - 1);
      const span = Math.max(0.25, prox.beat - bAnt);
      const p = Math.max(0, Math.min(1, (b - bAnt) / span));
      const yAlvo = prox.tipo === 'nota' ? this.yCorda(prox.corda) - 16 : Math.min(...(prox.cordas.length ? prox.cordas : [5]).map(i => this.yCorda(i))) - 14;
      const yAnt = ant ? (ant.tipo === 'nota' ? this.yCorda(ant.corda) - 16 : Math.min(...(ant.cordas.length ? ant.cordas : [5]).map(i => this.yCorda(i))) - 14) : yAlvo;
      const altura = Math.min(46, 18 + span * 14);
      const y = yAnt + (yAlvo - yAnt) * p - altura * 4 * p * (1 - p);
      const esperando = this.modo === 'espera' && this.esperando;
      const r = esperando ? 7 + Math.sin(performance.now() / 160) * 1.5 : 7;
      g.fillStyle = '#FF2E4D';
      g.beginPath(); g.arc(this.nowX, Math.max(8, y), r, 0, Math.PI * 2); g.fill();
    }

    /* ----- Pausa, saída e fim ----- */
    pausar() {
      if (!this.rodando || this.pausado) return;
      this.pausado = true;
      this.pausaEm = Som.agora;
      this.cfg.gravacao?.tocador?.pausar?.();
      Som.pararTudo();
      const cam = this.$('#jg-camada');
      cam.hidden = false;
      cam.innerHTML = `<div class="jg-menu">
        <h3>Pausado</h3>
        <button class="btn primario largo" data-m="cont">Continuar</button>
        <button class="btn largo" data-m="recomecar">Recomeçar</button>
        <div class="jg-vel"><span>Velocidade</span><div class="segmentado">${[40, 60, 80, 100].map(p => `<button type="button" aria-pressed="${Math.round(this.bpm / (this.cfg.bpmBase || this.bpm) * 100) === p}" data-v="${p}">${p}%</button>`).join('')}</div></div>
        <button class="btn largo" data-m="sair">Sair</button>
      </div>`;
      cam.querySelector('[data-m="cont"]').addEventListener('click', () => this.continuar());
      cam.querySelector('[data-m="recomecar"]').addEventListener('click', () => this.recomecar());
      cam.querySelector('[data-m="sair"]').addEventListener('click', () => this.sair());
      cam.querySelectorAll('[data-v]').forEach(bt => bt.addEventListener('click', () => this.recomecar({ bpm: Math.round((this.cfg.bpmBase || this.bpm) * +bt.dataset.v / 100) })));
    }
    continuar() {
      if (!this.pausado) return;
      const dt = Som.agora - this.pausaEm;
      if (this.modo !== 'espera') {
        // empurra o relógio do jogo para frente o tempo da pausa (e reagenda os sons)
        const seg = 60 / this.bpm;
        this.deslocar(dt + 3 * seg);
        for (let k = 0; k < 3; k++) Som.click(Som.agora + k * seg + 0.05, k === 0, 0.45);
        this.agendados = this.eventos.findIndex(e => e.t > Som.agora + 3 * seg);
        if (this.agendados < 0) this.agendados = this.eventos.length;
        this.proxClique = Math.max(0, Math.ceil(this.beatAgora() + 3));
        if (this.cfg.gravacao?.mestre) this.cfg.gravacao.tocador.continuar?.();
      }
      this.ultimoQuadro = performance.now();
      this.pausado = false;
      this.$('#jg-camada').hidden = true;
    }
    recomecar(novo = {}) {
      // com vídeo, quem sabe recomeçar (voltar o vídeo, mudar a velocidade) é quem abriu o jogo
      if (this.cfg.refazer) { const f = this.cfg.refazer; this.destruir(); return f(novo); }
      const cfg = { ...this.cfg, ...novo };
      this.destruir();
      Jogo.abrir(cfg);
    }
    destruir() {
      this.rodando = false;
      cancelAnimationFrame(this.raf);
      this.offAtaque?.(); this.offNivel?.();
      document.removeEventListener('keydown', this.tecla);
      window.removeEventListener('resize', this.aoRedim);
      Som.pararTudo();
      this.cfg.gravacao?.tocador?.parar?.();
      ativos.delete('jogo');
      this.el?.remove();
      document.body.classList.remove('em-jogo');
      if (!document.querySelector('.janela:not([hidden])')) document.body.classList.remove('travado');
      if (Jogo.atual === this) Jogo.atual = null;
    }
    sair() { this.destruir(); this.cfg.aoSair?.(); }

    resultado() {
      const n = this.eventos.length;
      const judged = this.eventos.filter(e => e.estado && e.estado !== 'livre');
      let pct = null;
      if (this.modo === 'tempo') {
        const max = n * 100 + this.acordesChecados * 50;
        const ganhos = this.eventos.reduce((s, e) => s + (e.pts || 0) * (e.estado === 'acordeErrado' ? 0.5 : 1), 0) + this.acordesCertos * 50;
        pct = max ? Math.round(ganhos / max * 100) : 0;
      } else if (this.modo === 'espera') {
        const obrig = this.eventos.filter(e => e.primeiro);
        pct = obrig.length ? Math.round(obrig.filter(e => e.estado === 'perfeito').length / obrig.length * 100) : 100;
      }
      const media = this.desvios.length >= 4 ? Math.round((mediana(this.desvios)) * 1000) : null;
      const estrelas = pct === null ? null : pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 45 ? 1 : 0;
      const fracos = Object.entries(this.fracos).sort((a, b) => b[1] - a[1]).map(([a]) => a);
      return { modo: this.modo, pct, estrelas, pontos: this.pontos, perf: this.perf, bons: this.bons, oks: this.oks, perdidas: this.perdidas,
        maxCombo: this.maxCombo, acordesCertos: this.acordesCertos, acordesChecados: this.acordesChecados, media, fracos, notas: n, julgadas: judged.length,
        bpm: this.bpm, bpmBase: this.cfg.bpmBase || this.bpm, entrada: this.entrada };
    }
    terminar() {
      if (!this.rodando) return;
      this.rodando = false;
      cancelAnimationFrame(this.raf);
      this.offAtaque?.(); this.offNivel?.();
      this.cfg.gravacao?.tocador?.parar?.();
      ativos.delete('jogo');
      const r = this.resultado();
      this.cfg.aoFim?.(r);
      this.mostrarResultado(r);
    }
    mostrarResultado(r) {
      const cam = this.$('#jg-camada');
      cam.hidden = false;
      const pctVel = Math.round(r.bpm / r.bpmBase * 100);
      const estrelas = r.estrelas === null ? '' : `<div class="jg-estrelas" aria-label="${r.estrelas} de 3 estrelas">${[0, 1, 2].map(i => `<i class="${i < r.estrelas ? 'on' : ''}"></i>`).join('')}</div>`;
      const tend = r.media === null ? '' : Math.abs(r.media) <= 30 ? 'Seu tempo está certinho.' : r.media < 0 ? `Você tende a tocar um pouco antes (${-r.media} ms).` : `Você tende a tocar um pouco depois (${r.media} ms).`;
      const titulo = r.modo === 'pratica' ? 'Você tocou até o fim!' : r.pct >= 90 ? 'Mandou muito bem!' : r.pct >= 70 ? 'Muito bom!' : r.pct >= 45 ? 'Bom começo!' : 'Continue praticando';
      let dica = '';
      if (r.fracos.length) dica = `O acorde que mais deu trabalho foi o <b>${esc(r.fracos[0])}</b>. Treine a troca para ele no "1 minuto de trocas".`;
      else if (r.modo === 'espera') dica = 'Quando acertar tudo sem pressa, jogue no modo "No tempo".';
      else if (r.modo === 'tempo' && r.pct >= 85 && pctVel < 100) dica = 'Pronto para subir a velocidade.';
      else if (r.modo === 'tempo' && r.pct < 45) dica = 'Tente o modo "Esperar por mim" ou uma velocidade menor.';
      cam.innerHTML = `<div class="jg-menu jg-fim">
        ${estrelas}
        <h3>${titulo}</h3>
        ${r.pct !== null ? `<p class="jg-pct"><b>${r.pct}%</b> ${r.modo === 'espera' ? 'acertos de primeira' : 'de precisão'}</p>` : ''}
        <dl class="jg-numeros">
          ${r.modo === 'tempo' ? `<div><dt>Perfeitos</dt><dd>${r.perf}</dd></div><div><dt>Maior sequência</dt><dd>${r.maxCombo}</dd></div>` : ''}
          ${r.acordesChecados ? `<div><dt>${this.melodia ? 'Notas certas' : 'Acordes certos'}</dt><dd>${r.acordesCertos} de ${r.acordesChecados}</dd></div>` : ''}
          ${r.modo === 'tempo' ? `<div><dt>Perdidas</dt><dd>${r.perdidas}</dd></div>` : ''}
        </dl>
        ${tend || dica ? `<p class="jg-dica">${tend} ${dica}</p>` : ''}
        <button class="btn primario largo" data-m="denovo">Jogar de novo</button>
        ${r.modo === 'tempo' && r.pct >= 85 && pctVel < 100 ? `<button class="btn largo" data-m="rapido">Jogar a ${Math.min(100, pctVel + 20)}%</button>` : ''}
        ${r.modo === 'tempo' && r.pct < 45 ? `<button class="btn largo" data-m="espera">Esperar por mim</button>` : ''}
        ${r.modo === 'espera' ? `<button class="btn largo" data-m="tempo">Jogar no tempo</button>` : ''}
        ${r.fracos.length && !this.melodia ? `<button class="btn largo" data-m="treino">Treinar ${esc(r.fracos[0])}</button>` : ''}
        <button class="btn largo sem-borda" data-m="sair">Voltar</button>
      </div>`;
      const ir = (m, f) => cam.querySelector(`[data-m="${m}"]`)?.addEventListener('click', f);
      ir('denovo', () => this.recomecar());
      ir('rapido', () => this.recomecar({ bpm: Math.round(r.bpmBase * Math.min(1, pctVel / 100 + 0.2)) }));
      ir('espera', () => this.recomecar({ modo: 'espera' }));
      ir('tempo', () => this.recomecar({ modo: 'tempo', bpm: Math.round(r.bpmBase * 0.6) }));
      ir('treino', () => {
        const a = r.fracos[0], ant = this.trechos.map(t => t.acorde).find((x, i, arr) => arr[i + 1] === a && x !== a) || this.acordes.find(x => x !== a) || a;
        this.sair(); JOGOS.trocas(ant, a);
      });
      ir('sair', () => this.sair());
    }
  }

  /* ---------- Utilidades de desenho ---------- */
  function retRedondo(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function hexAlfa(hex, a) {
    if (hex.startsWith('rgba')) return hex;
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }

  return {
    atual: null,
    avaliarAcorde, identificar, modeloNotas, lerCroma, lerNota,
    /* Abre o jogo em tela cheia. cfg:
       { titulo, trechos | notas, padrao, ritmo ('acorde'|'tempos'|'batida'), bpm, bpmBase, capo, temCapo,
         modo ('espera'|'tempo'|'pratica'), entrada ('mic'|'toque'), facil, guia, metronomo,
         gravacao?, aoFim(resultado), aoSair() } */
    abrir(cfg) {
      if (this.atual) this.atual.destruir();
      const p = new Partida(cfg);
      this.atual = p;
      p.iniciar();
      return p;
    }
  };
})();

/* Desenho pequeno do braço com UMA nota (para as melodias) */
function bracoNotaSVG(corda, casa, dedo, mini = false) {
  const W = 200, H = 110, x0 = 22, y0 = 14, dy = 16, casas = 5;
  const inicio = casa > 4 ? casa - 2 : 1, dx = (W - x0 - 8) / casas;
  const y = i => y0 + (5 - i) * dy, xc = f => x0 + (f - inicio + 0.5) * dx;
  let s = `<svg class="braco-nota ${mini ? 'mini' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ORD[corda]} corda, casa ${casa}">`;
  for (let k = 0; k <= casas; k++) s += `<line class="${k === 0 && inicio === 1 ? 'bn-pestana' : 'bn-traste'}" x1="${x0 + k * dx}" x2="${x0 + k * dx}" y1="${y0}" y2="${y0 + 5 * dy}"/>`;
  for (let i = 0; i < 6; i++) s += `<line class="bn-corda" x1="${x0}" x2="${W - 8}" y1="${y(i)}" y2="${y(i)}"/><text class="bn-letra" x="6" y="${y(i) + 4}">${LETRAS_CORDAS[i]}</text>`;
  for (let k = 0; k < casas; k++) s += `<text class="bn-num" x="${x0 + (k + 0.5) * dx}" y="${H - 4}" text-anchor="middle">${inicio + k}</text>`;
  if (casa === 0) s += `<circle class="bn-solta" cx="${x0 - 9}" cy="${y(corda)}" r="6"/>`;
  else s += `<circle class="dg-dedo d${dedo || 1}" cx="${xc(casa)}" cy="${y(corda)}" r="8"/><text class="dg-num" x="${xc(casa)}" y="${y(corda) + 3.5}" text-anchor="middle">${dedo || ''}</text>`;
  return s + '</svg>';
}
