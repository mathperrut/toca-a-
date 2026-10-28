/* =========================================================
   TOCA AÍ — cifras.js
   Busca de músicas na internet, SEM chave e SEM pagar nada.

   1. PROCURAR: usa o mesmo índice que o site do Cifra Club usa
      para sugerir músicas enquanto você digita.
   2. BAIXAR A CIFRA: lê a página e separa SÓ os acordes.
      A letra é descartada na hora: o app guarda só o tamanho de
      cada linha (um número), que serve para estimar a duração
      de cada acorde.
   3. MONTAR O JOGO: transforma as linhas em seções com
      "Acorde:tempos" (o mesmo formato do catálogo do app).
   4. GRAVAÇÃO ORIGINAL: procura no YouTube o áudio oficial para
      você ouvir e tocar junto.

   Por que só funciona no app Android?
   Navegadores bloqueiam uma página de ler outro site (regra de
   segurança chamada CORS). O app Android pede as páginas pelo
   "HTTP nativo" do Capacitor, como um navegador faria, então não
   existe esse bloqueio. No navegador comum, o app abre a busca
   numa nova aba e você cola a cifra.
   ========================================================= */
'use strict';

const Cifras = (() => {
  const UA_CEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
  const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const BASE = 'https://www.cifraclub.com.br';

  // No Node (testes) o DOMParser e o http são injetados por configurar()
  const amb = {
    DOMParser: typeof DOMParser !== 'undefined' ? DOMParser : null,
    http: null
  };

  /* ---------- Rede ---------- */
  const temNativo = () => typeof window !== 'undefined' && !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.nativePromise);

  async function http(url, { pc = false } = {}) {
    if (amb.http) return amb.http(url, { ua: pc ? UA_PC : UA_CEL });
    if (temNativo()) {
      const r = await window.Capacitor.nativePromise('CapacitorHttp', 'request', {
        url, method: 'GET', responseType: 'text', connectTimeout: 15000, readTimeout: 20000,
        headers: { 'User-Agent': pc ? UA_PC : UA_CEL, 'Accept-Language': 'pt-BR,pt;q=0.9' }
      });
      // Respostas "JSON" podem vir já convertidas em objeto
      const texto = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
      return { status: r.status, texto, url: r.url || url };
    }
    const r = await fetch(url); // no navegador comum isso falha por CORS (é esperado)
    return { status: r.status, texto: await r.text(), url: r.url };
  }

  /* ---------- Texto ---------- */
  const semAcento = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const slug = s => semAcento(s).replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
  const decodificar = s => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTIDADES[e.toLowerCase()] ?? m;
  });

  /* ---------- Acordes ---------- */
  // Um "token" parece acorde? (para a cifra colada, que não tem marcação)
  const RE_ACORDE = /^[A-G](#|b)?(m|M|maj|min|dim|aug|sus|add|°|º|ø|\+|-)?[0-9]*(M|\+|-)?(\([^)\s]*\))?(\/[A-G](#|b)?)?$/;
  const ehAcorde = tok => RE_ACORDE.test(tok);

  // "D7(4/9)" -> "D7(4/9)" padronizado; "D7(9+)" -> "D7(#9)"; "Cmaj7" -> "C7M"
  function padronizar(nome) {
    let s = String(nome || '').trim().replace(/\s+/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
    s = s.replace(/\((\d+)\+\)/g, '(#$1)').replace(/\((\d+)-\)/g, '(b$1)');
    if (typeof normalizarAcorde === 'function') s = normalizarAcorde(s);
    return s;
  }

  /* Versão "de iniciante" de um nome de acorde (antes do simplificar()
     do app escolher o desenho mais fácil):
     tira extensões entre parênteses, o baixo invertido (/G#) e
     troca 9, 6, sus e add pelo acorde básico. */
  function basico(nome) {
    const s = padronizar(nome);
    const m = s.match(/^([A-G](?:#|b)?)([^/]*)(?:\/.*)?$/);
    if (!m) return s;
    let [, raiz, q] = m;
    if (/^(m7\(b5\)|m7b5|ø)/.test(q)) return raiz + 'm7(b5)';
    q = q.replace(/\(.*\)$/, '');                       // D7(4/9) -> D7
    if (/^(°|°7|dim|dim7)$/.test(q)) return raiz + '°';
    if (/^(7M|maj7|M7)/.test(q)) return raiz + '7M';
    if (/^m7M/.test(q)) return raiz + 'm';
    if (/^m7/.test(q)) return raiz + 'm7';
    if (/^m/.test(q)) return raiz + 'm';                // m6, m9, madd9 -> m
    if (/^7/.test(q)) return raiz + '7';                // 7(9), 7(13), 7sus4 -> 7
    return raiz;                                        // 9 (= add9 na cifra brasileira), 6, sus4, 4, 5, + -> maior
  }

  /* Transpor: sobe/desce n semitons, escrevendo com # ou b de forma legível */
  const PCS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const ESCRITA = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  function transpor(nome, n) {
    if (!n) return nome;
    return padronizar(nome).replace(/^([A-G](?:#|b)?)|\/([A-G](?:#|b)?)/g, (m, raiz, baixo) => {
      const nota = raiz || baixo, pc = PCS[nota];
      if (pc === undefined) return m;
      const nova = ESCRITA[((pc + n) % 12 + 12) % 12];
      return raiz ? nova : '/' + nova;
    });
  }

  /* Capotraste inteligente: testa descer o tom de 0 a 7 casas e escolhe
     onde os acordes ficam mais fáceis. Com o capo na casa k, os
     desenhos "descidos" k casas soam no tom original. */
  function melhorCapo(acordes, custo) {
    const unicos = [...new Set(acordes)];
    let melhor = { k: 0, custo: Infinity };
    for (let k = 0; k <= 7; k++) {
      const c = unicos.reduce((t, a) => t + custo(transpor(a, -k)), 0) + k * 0.35; // capo alto conta um pouco
      if (c < melhor.custo - 0.01) melhor = { k, custo: c };
    }
    return melhor.k;
  }

  /* ---------- Duração estimada ----------
     Numa cifra, cada acorde fica em cima da sílaba em que ele entra.
     A distância (em letras) até o próximo acorde dá uma ideia de quanto
     ele dura: ~16 letras ≈ 1 compasso de 4 tempos.
     Arredondamos para 2, 4 ou 8 tempos, que é o que mais aparece. */
  function temposPorDistancia(dist, ultimo) {
    let t = dist < 10 ? 2 : dist <= 26 ? 4 : 8;
    if (ultimo) t = Math.max(4, t);
    return t;
  }

  /* Linhas -> seções. Cada linha: { secao?, acordes:[{nome,col}], largura, letra(bool), tab(bool) } */
  function linhasParaSecoes(linhas) {
    const secoes = [];
    let atual = null;
    const nova = nome => { atual = { nome: nome || 'Música', itens: [], soTab: [] }; secoes.push(atual); };
    for (const l of linhas) {
      if (l.secao) nova(l.secao);
      if (!atual) nova('Início');
      if (!l.acordes.length) continue;
      if (l.tab) { atual.soTab.push(...l.acordes.map(a => ({ acorde: a.nome, tempos: 4 }))); continue; }
      const semLetra = !l.letra;
      l.acordes.forEach((a, i) => {
        const prox = l.acordes[i + 1];
        const tempos = semLetra ? 4 : temposPorDistancia((prox ? prox.col : Math.max(l.largura, a.col + 6)) - a.col, !prox);
        atual.itens.push({ acorde: a.nome, tempos });
      });
    }
    // Uma seção que só tem tablatura usa os acordes da tablatura.
    // "Tab - Intro" depois de uma "Intro" com acordes é repetição: sai.
    const nomes = new Set(secoes.filter(s => s.itens.length).map(s => semAcento(s.nome)));
    return secoes
      .map(s => {
        const base = s.nome.replace(/^tab\s*[-–:]\s*/i, '');
        if (!s.itens.length && s.soTab.length && !(base !== s.nome && nomes.has(semAcento(base)))) s.itens = s.soTab;
        return { nome: base.slice(0, 40), itens: s.itens };
      })
      .filter(s => s.itens.length)
      .map(s => ({ nome: s.nome, seq: s.itens.map(x => `${x.acorde}:${x.tempos}`).join(' '), repetir: 1 }));
  }

  /* ---------- Página do Cifra Club ----------
     Estrutura (out/2026): <pre data-chord-content> com blocos <div>,
     acordes em <b data-chord-name="A9">, tablaturas em <span class="tab">,
     seções escritas como [Intro], [Refrão]...
     Tom em data-anchor="--chord-tone", capo em data-anchor="--chord-capo". */
  function lerPaginaCifraClub(html, url = '') {
    if (!amb.DOMParser) throw new Error('DOMParser indisponível');
    const doc = new amb.DOMParser().parseFromString(html, 'text/html');
    const pre = doc.querySelector('pre[data-chord-content]') || doc.querySelector('pre');
    if (!pre) throw new Error('Não achei a cifra nessa página.');

    // título e artista: dados estruturados (ld+json) ou o <title>
    let titulo = '', artista = '', genero = '';
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent);
        const tipos = [].concat(j['@type'] || []);
        if (tipos.includes('MusicRecording')) { titulo = titulo || j.name || ''; artista = artista || (j.byArtist && (j.byArtist.name || j.byArtist[0]?.name)) || ''; }
        if (tipos.includes('BreadcrumbList') && Array.isArray(j.itemListElement)) {
          const nomes = j.itemListElement.map(x => x.name || x.item?.name || '').filter(Boolean);
          // [Cifra Club, Gênero, Artista, Música] -> o gênero é o 2º quando há 4 itens
          if (nomes.length >= 4) genero = nomes[1];
        }
      } catch (e) {}
    }
    if (!titulo) {
      const t = (doc.querySelector('title')?.textContent || '').split(' - ');
      titulo = t[0] || ''; artista = artista || t[1] || '';
    }
    // às vezes o nome vem como "Artista - Música" ou com "- Cifra Club" no fim
    artista = String(artista || '').trim();
    titulo = String(titulo || '').replace(/\s*[-|]\s*Cifra Club.*$/i, '').replace(/\s*\((?:versão\s+)?simplificada\)\s*$/i, '').trim();
    if (artista) {
      const a = artista.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      titulo = titulo.replace(new RegExp('^' + a + '\\s*[-–]\\s*', 'i'), '').replace(new RegExp('\\s*[-–]\\s*' + a + '$', 'i'), '').trim();
    }
    const ancora = nome => doc.querySelector(`[data-anchor="${nome}"]`) || doc.querySelector(`[style*="${nome}"]`);
    const tomTxt = (ancora('--chord-tone')?.textContent || '').replace(/\s+/g, ' ').trim();
    const tomM = tomTxt.match(/^([A-G](?:#|b)?m?)(?:.*forma de ([A-G](?:#|b)?m?))?/);
    const capoTxt = ancora('--chord-capo')?.textContent || '';
    const capo = Math.max(0, Math.min(11, parseInt(capoTxt, 10) || 0));

    // Videoaula (vídeo que a página mostra) — só o ID e o título
    const v = html.match(/ytimg\.com\/vi\/([A-Za-z0-9_-]{11})\/[a-z]*default\.jpg\\?",\\?"title\\?":\\?"([^"\\]{1,120})/);

    // Acordes, linha a linha
    let h = pre.innerHTML;
    const tabs = [];
    h = h.replace(/<span class="tab">([\s\S]*?)<\/span>/g, (m, dentro) => { tabs.push(dentro); return `\n\u0003${tabs.length - 1}\n`; });
    // Cada acorde vira  \u0001 texto-visível \u0004 nome \u0002  (o texto visível ocupa as mesmas colunas)
    const marcar = trecho => trecho.replace(/<b\b[^>]*?data-chord-name="([^"]*)"[^>]*>([\s\S]*?)<\/b>|<b>([^<]*)<\/b>/g, (m, nome, vis, simples) => {
      const n = nome !== undefined ? decodificar(nome) : simples;
      const visivel = decodificar(String(vis !== undefined ? vis : simples).replace(/<[^>]+>/g, '')).replace(/[\u0001-\u0004]/g, '');
      return '\u0001' + visivel + '\u0004' + padronizar(n).replace(/[\u0001-\u0004]/g, '') + '\u0002';
    });
    const limpar = t => decodificar(t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[\u200b\u00a0\r]/g, m => (m === '\u00a0' ? ' ' : ''));
    const linhas = [];
    const lerLinhas = (texto, ehTab) => {
      const brutas = texto.split('\n');
      brutas.forEach((bruta, k) => {
        const tabRef = bruta.match(/^\u0003(\d+)$/);
        if (tabRef) { lerLinhas(limpar(marcar(tabs[+tabRef[1]])), true); return; }
        const acordes = [];
        let col = 0, semAcordes = '';
        for (let i = 0; i < bruta.length; i++) {
          const ch = bruta[i];
          if (ch === '\u0001') {
            const meio = bruta.indexOf('\u0004', i), fim = bruta.indexOf('\u0002', i);
            if (meio < 0 || fim < meio) { i = bruta.length; break; }
            const vis = bruta.slice(i + 1, meio);
            acordes.push({ nome: bruta.slice(meio + 1, fim), col });
            col += vis.length; i = fim;
          } else { semAcordes += ch; col++; }
        }
        const sec = semAcordes.match(/^\s*\[([^\]]{1,40})\]/);
        const resto = sec ? semAcordes.replace(/^\s*\[[^\]]*\]/, '') : semAcordes;
        const letra = /[A-Za-zÀ-ÿ]{2,}/.test(resto.replace(/\b(Parte|de|x|bis|vezes|vez)\b|\d+x|x\d+/gi, ''));
        // largura útil = a maior entre esta linha e a linha de letra logo abaixo
        let largura = bruta.replace(/\u0004[^\u0002]*\u0002/g, '').replace(/\u0001/g, '').trimEnd().length;
        const abaixo = brutas[k + 1];
        if (acordes.length && abaixo && !abaixo.includes('\u0001') && /[A-Za-zÀ-ÿ]/.test(abaixo)) largura = Math.max(largura, abaixo.trimEnd().length);
        const ehLinhaDeTab = /^\s*[eBGDAE]?\|?[-0-9hpb\/\\~|x ]{8,}\|?\s*$/.test(semAcordes) && /-{3,}/.test(semAcordes);
        if (ehLinhaDeTab) return;
        linhas.push({
          secao: sec ? sec[1].trim() : null, acordes,
          letra: letra || (acordes.length > 0 && !!(abaixo && !abaixo.includes('\u0001') && /[A-Za-zÀ-ÿ]{2,}/.test(abaixo) && !/^\s*\[/.test(abaixo))),
          largura, tab: ehTab
        });
      });
    };
    lerLinhas(limpar(marcar(h)), false);
    const secoes = linhasParaSecoes(linhas);
    if (!secoes.length) throw new Error('Essa cifra não tem acordes que eu consiga ler.');
    return {
      titulo: titulo.trim(), artista: String(artista).trim(), genero, capo,
      tom: tomM ? tomM[1] : '', formaTom: tomM && tomM[2] ? tomM[2] : '',
      secoes, videoAula: v ? { id: v[1], titulo: decodificar(v[2]) } : null,
      fonte: url
    };
  }

  /* ---------- Cifra colada (texto puro) ---------- */
  function lerTextoCifra(texto) {
    const brutas = String(texto || '').replace(/\t/g, '    ').split(/\r?\n/);
    const linhas = [];
    brutas.forEach((bruta, k) => {
      const sec = bruta.match(/^\s*\[([^\]]{1,40})\]/);
      const resto = sec ? bruta.replace(/^\s*\[[^\]]*\]/, m => ' '.repeat(m.length)) : bruta;
      if (/^\s*[eBGDAE]\|/.test(resto) || (/-{4,}/.test(resto) && /\|/.test(resto))) return; // tablatura
      const toks = [...resto.matchAll(/\S+/g)].map(m => ({ t: m[0].replace(/[()]/g, m2 => m2), col: m.index }));
      const validos = toks.filter(x => !/^(\d+x|x\d+|\|+|-+|\.+)$/i.test(x.t));
      const acordes = validos.filter(x => ehAcorde(x.t));
      const ehLinhaDeAcordes = validos.length > 0 && acordes.length / validos.length >= 0.75;
      const abaixo = brutas[k + 1] || '';
      const temLetraAbaixo = ehLinhaDeAcordes && /[A-Za-zÀ-ÿ]{2,}/.test(abaixo) && !(() => { const t = abaixo.trim().split(/\s+/); return t.filter(ehAcorde).length / t.length >= 0.75; })();
      linhas.push({
        secao: sec ? sec[1].trim() : null,
        acordes: ehLinhaDeAcordes ? acordes.map(a => ({ nome: padronizar(a.t), col: a.col })) : [],
        letra: temLetraAbaixo,
        largura: Math.max(resto.trimEnd().length, temLetraAbaixo ? abaixo.trimEnd().length : 0),
        tab: false
      });
    });
    const secoes = linhasParaSecoes(linhas);
    if (!secoes.length) throw new Error('Não encontrei acordes nesse texto. Copie a cifra com os acordes em cima da letra.');
    return secoes;
  }

  /* ---------- Ritmo pelo gênero ---------- */
  function ritmoDoGenero(g) {
    const s = semAcento(g);
    if (/bossa/.test(s)) return 'bossa';
    if (/pagode/.test(s)) return 'pagode';
    if (/samba/.test(s)) return 'samba';
    if (/forro|baiao|xote|xaxado/.test(s)) return 'baiao';
    return 'pop';
  }

  /* ---------- API pública ---------- */
  const api = {
    temNativo, slug, semAcento, basico, transpor, melhorCapo, padronizar,
    lerPaginaCifraClub, lerTextoCifra, ritmoDoGenero, linhasParaSecoes,
    configurar(o) { Object.assign(amb, o); },
    get automatico() { return !!amb.http || temNativo(); },

    // Procura músicas: [{ titulo, artista, slugArtista, slugMusica, url }]
    async procurar(termo) {
      const q = String(termo || '').trim();
      if (!q) return [];
      const r = await http('https://solr.sscdn.co/cc/h2/?q=' + encodeURIComponent(q));
      if (r.status !== 200) throw new Error('A busca do Cifra Club não respondeu (' + r.status + ').');
      const ini = r.texto.indexOf('{'), fim = r.texto.lastIndexOf('}');
      let j;
      try { j = JSON.parse(r.texto.slice(ini, fim + 1)); } catch (e) { throw new Error('A busca do Cifra Club mudou de formato.'); }
      const docs = (j.response && j.response.docs) || [];
      return docs
        .filter(d => String(d.t) === '2' && d.d && d.u && d.m)
        .slice(0, 12)
        .map(d => ({ titulo: d.m, artista: d.a || '', slugArtista: d.d, slugMusica: d.u, url: `${BASE}/${d.d}/${d.u}/` }));
    },

    // Baixa e lê a cifra. Tenta a versão simplificada primeiro (feita para iniciantes).
    async baixar(slugArtista, slugMusica, { simplificada = true } = {}) {
      const base = `${BASE}/${slugArtista}/${slugMusica}/`;
      const tentativas = simplificada ? [base + 'simplificada.html', base] : [base];
      let erro = null;
      for (const url of tentativas) {
        try {
          const r = await http(url);
          if (r.status !== 200) { erro = new Error('Página não encontrada (' + r.status + ').'); continue; }
          const dados = lerPaginaCifraClub(r.texto, url);
          dados.simplificada = url.endsWith('simplificada.html');
          dados.slugArtista = slugArtista; dados.slugMusica = slugMusica;
          return dados;
        } catch (e) { erro = e; }
      }
      throw erro || new Error('Não consegui ler essa cifra.');
    },

    /* YouTube: procura a gravação. Dá preferência ao canal "Artista - Topic"
       (áudio oficial publicado pela gravadora) e evita aulas, covers e karaokê. */
    async youtube(titulo, artista) {
      const termo = `${artista} ${titulo}`.trim();
      const r = await http('https://www.youtube.com/results?hl=pt&gl=BR&search_query=' + encodeURIComponent(termo), { pc: true });
      const html = r.texto.replace(/\\x22/g, '"').replace(/\\x7b/g, '{').replace(/\\x7d/g, '}').replace(/\\x5b/g, '[').replace(/\\x5d/g, ']').replace(/\\x3a/g, ':');
      const itens = [];
      const re = /"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"/g;
      let m;
      while ((m = re.exec(html)) && itens.length < 12) {
        const trecho = html.slice(m.index, m.index + 6000);
        const tit = (trecho.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/) || [])[1] || '';
        const canal = (trecho.match(/"(?:ownerText|longBylineText)":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/) || [])[1] || '';
        const dur = (trecho.match(/"lengthText":\{[^}]*?"simpleText":"([0-9:]+)"/) || [])[1] || '';
        const des = s => { try { return JSON.parse('"' + s + '"'); } catch (e) { return s; } };
        itens.push({ id: m[1], titulo: des(tit), canal: des(canal), duracao: dur });
      }
      const a = semAcento(artista), t = semAcento(titulo).replace(/[^a-z0-9 ]/g, ' ').trim();
      const pontuar = v => {
        const vt = semAcento(v.titulo), vc = semAcento(v.canal);
        let p = 0;
        if (vc.endsWith(' - topic')) p += 6;
        if (vc.includes(a.split(' ')[0] || '~')) p += 3;
        if (t.split(/\s+/).every(w => vt.includes(w))) p += 4;
        if (/oficial|official|clipe/.test(vt)) p += 1;
        if (/aula|cover|karaok|tutorial|como tocar|instrumental|playback|reacao|react|acustico cover|letra/.test(vt)) p -= 6;
        const seg = v.duracao.split(':').reduce((s, x) => s * 60 + (+x || 0), 0);
        if (seg && (seg < 90 || seg > 600)) p -= 3;
        return p;
      };
      itens.forEach(v => { v.pontos = pontuar(v); });
      itens.sort((x, y) => y.pontos - x.pontos);
      return itens;
    },

    // Dados da cifra -> música do app
    paraMusica(d, extra = {}) {
      return {
        id: 'cc-' + (d.slugArtista || slug(d.artista)) + '--' + (d.slugMusica || slug(d.titulo)),
        origem: 'cifraclub', titulo: d.titulo, artista: d.artista, genero: d.genero || '',
        padrao: ritmoDoGenero(d.genero), bpm: 80, bpmEstimado: true,
        capo: d.capo || 0, tom: d.tom || '', formaTom: d.formaTom || '',
        secoes: d.secoes, fonte: d.fonte, simplificada: !!d.simplificada,
        videoAula: d.videoAula || null,
        nota: (d.simplificada ? 'Versão simplificada do Cifra Club. ' : 'Cifra do Cifra Club. ') +
          'A duração de cada acorde foi estimada pela posição dele na cifra.',
        status: 'aprendendo', ...extra
      };
    },

    // Texto colado -> música do app
    deTexto(texto, titulo = 'Minha música', artista = '') {
      return {
        id: 'm' + Date.now().toString(36), origem: 'colada', titulo, artista, genero: '', padrao: 'pop',
        bpm: 80, bpmEstimado: true, capo: 0, secoes: lerTextoCifra(texto),
        nota: 'Extraído da cifra colada. A duração de cada acorde foi estimada pela posição dele na cifra.',
        status: 'aprendendo'
      };
    },

    // Endereço para abrir a busca no navegador (quando não dá para buscar sozinho)
    urlBusca(termo) { return 'https://www.cifraclub.com.br/?q=' + encodeURIComponent(termo); }
  };
  return api;
})();

if (typeof module !== 'undefined') module.exports = { Cifras };
