/* =========================================================
   TOCA AÍ — busca.js
   Encontra a música que você digitou e transforma em jogo.

   Ordem de tentativa:
   1. Catálogo do app e seu repertório (instantâneo, offline).
   2. IA (Claude) pesquisando a cifra na internet:
      - no app instalado: usa a SUA chave da API do Claude,
        guardada só neste aparelho;
      - dentro do Claude (página publicada): usa o Claude da sua
        conta, sem chave (mas sem pesquisa na web).
   3. Colar cifra: você cola a cifra copiada de um site e o app
      separa os acordes da letra (a letra é descartada).
   ========================================================= */
'use strict';

const CHAVE_LS = 'tocaai:chave-claude'; // fica só no localStorage deste aparelho, nunca no progresso salvo
const MODELO_BUSCA = 'claude-haiku-5-5';
const RITMOS_VALIDOS = ['pop', 'baiao', 'samba', 'pagode', 'bossa', 'dedilhado', 'sambarock'];

// "Magnólia" == "magnolia"
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const Busca = {
  chave() { try { return localStorage.getItem(CHAVE_LS) || ''; } catch (e) { return ''; } },
  salvarChave(k) { try { k ? localStorage.setItem(CHAVE_LS, k.trim()) : localStorage.removeItem(CHAVE_LS); } catch (e) {} },

  local(termo) {
    const q = semAcento(termo);
    if (!q) return [];
    const todas = [...CATALOGO.map(m => ({ ...m, origem: 'catalogo' })), ...S.musicas];
    return todas.filter(m => semAcento(m.titulo + ' ' + m.artista).includes(q) || q.split(/\s+/).every(p => semAcento(m.titulo + ' ' + m.artista).includes(p)));
  },

  // Qual IA está disponível agora?
  async modoIA() {
    if (window.claude && typeof window.claude.use === 'function') {
      try { if (await window.claude.use('sample')) return 'claude'; } catch (e) {}
    }
    return this.chave() ? 'api' : null;
  },

  instrucoes(termo, comWeb) {
    return `Você monta arranjos SIMPLIFICADOS de violão para um app de estudo brasileiro.
Música pedida pelo usuário: "${termo}".
${comWeb ? 'Pesquise na web a cifra dessa música (sites como Cifra Club, Recifra, Ultimate Guitar) e confira em mais de uma fonte se puder.' : 'Use o que você sabe sobre a cifra dessa música. Se não tiver certeza, diga em "observacao".'}

Regras:
- NUNCA inclua a letra da música, nem trechos dela (direitos autorais). Só acordes.
- Use cifra brasileira: 7M (não maj7), 7(9), m7(b5), ° para diminuto.
- Se a música tiver muitos acordes com pestana, use capotraste para que a mão faça desenhos abertos, e informe o "capo".
- Divida em seções (Introdução, Parte A, Refrão...) com "repetir".
- Em "seq", escreva "Acorde:tempos" separados por espaço, tempos em semínimas (4 = um compasso 4/4). Ex.: "Am7:4 D7:2 G:2".
- "ritmo" deve ser um destes: ${RITMOS_VALIDOS.join(', ')}.
- "bpm" aproximado da gravação.

Responda SOMENTE com um JSON neste formato, sem texto antes ou depois:
{"encontrada": true, "titulo": "...", "artista": "...", "genero": "...", "ritmo": "samba", "bpm": 100, "tom": "Am", "capo": 0,
 "secoes": [{"nome": "Introdução", "seq": "Am7:4 D7:4", "repetir": 2}],
 "observacao": "o que foi simplificado ou incerto", "fontes": ["https://..."]}
Se não encontrar a música, responda {"encontrada": false, "observacao": "motivo"}.`;
  },

  // Converte a resposta da IA numa música do app (e confere os campos)
  paraMusica(j, termo, fontes = []) {
    if (!j || j.encontrada === false || !Array.isArray(j.secoes) || !j.secoes.length) throw new Error(j?.observacao || 'A IA não encontrou essa música.');
    const secoes = j.secoes.map(s => ({ nome: String(s.nome || 'Parte').slice(0, 40), seq: String(s.seq || ''), repetir: Math.max(1, Math.min(8, +s.repetir || 1)) }))
      .filter(s => lerSequencia(s.seq).length);
    if (!secoes.length) throw new Error('A resposta não trouxe acordes.');
    return {
      id: 'ia-' + Date.now().toString(36), origem: 'ia',
      titulo: String(j.titulo || termo).slice(0, 80), artista: String(j.artista || '').slice(0, 80),
      genero: String(j.genero || ''), padrao: RITMOS_VALIDOS.includes(j.ritmo) ? j.ritmo : 'pop',
      bpm: Math.max(50, Math.min(200, +j.bpm || 90)), tom: String(j.tom || ''), capo: Math.max(0, Math.min(9, +j.capo || 0)),
      secoes, nota: String(j.observacao || ''), fontes: [...new Set([...(j.fontes || []), ...fontes])].filter(u => /^https?:\/\//.test(u)).slice(0, 6),
      status: 'aprendendo'
    };
  },

  async pesquisar(termo, { aoStatus, sinal } = {}) {
    const modo = await this.modoIA();
    if (!modo) throw Object.assign(new Error('sem-ia'), { codigo: 'sem-ia' });
    if (modo === 'claude') {
      aoStatus?.('Perguntando ao Claude…');
      const sample = await window.claude.use('sample');
      try {
        const j = await sample.json(this.instrucoes(termo, false), { signal: sinal });
        return this.paraMusica(j, termo);
      } catch (e) {
        if (e && e.code) throw new Error({ not_granted: 'Você não permitiu o uso do Claude nesta página.', rate_limited: 'Limite de uso atingido. Tente mais tarde.', cancelled: 'Busca cancelada.', invalid_json: 'A resposta veio num formato inesperado. Tente de novo.' }[e.code] || 'Não foi possível falar com o Claude agora.');
        throw e;
      }
    }
    return this.pesquisarAPI(termo, { aoStatus, sinal });
  },

  // Chama a API do Claude direto do aparelho, com a ferramenta de busca na web
  async pesquisarAPI(termo, { aoStatus, sinal } = {}) {
    const mensagens = [{ role: 'user', content: this.instrucoes(termo, true) }];
    const fontes = [];
    aoStatus?.('Pesquisando a cifra na internet…');
    for (let rodada = 0; rodada < 4; rodada++) {
      let r;
      try {
        r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: sinal,
          headers: {
            'x-api-key': this.chave(), 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({ model: MODELO_BUSCA, max_tokens: 3000, messages: mensagens,
            tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }] })
        });
      } catch (e) {
        if (e.name === 'AbortError') throw new Error('Busca cancelada.');
        throw new Error('Sem conexão com a internet (a busca por IA precisa de internet).');
      }
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = dados?.error?.message || '';
        if (r.status === 401) throw new Error('Chave da API inválida. Confira em Ferramentas > Busca com IA.');
        if (r.status === 429) throw new Error('Muitas buscas seguidas. Espere um minuto.');
        if (r.status === 400 && /credit|billing|balance/i.test(msg)) throw new Error('Sua conta da API está sem créditos.');
        throw new Error('A API respondeu com erro: ' + (msg || r.status));
      }
      for (const b of dados.content || []) {
        if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach(x => x.url && fontes.push(x.url));
        if (b.type === 'text' && b.citations) b.citations.forEach(c => c.url && fontes.push(c.url));
      }
      if (dados.stop_reason === 'pause_turn') { // a API pausou uma busca longa: devolvemos para continuar
        mensagens.push({ role: 'assistant', content: dados.content });
        aoStatus?.('Ainda pesquisando…');
        continue;
      }
      const texto = (dados.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const ini = texto.indexOf('{'), fim = texto.lastIndexOf('}');
      if (ini < 0 || fim < ini) throw new Error('A IA não devolveu os acordes no formato esperado. Tente de novo.');
      let j;
      try { j = JSON.parse(texto.slice(ini, fim + 1)); } catch (e) { throw new Error('A resposta da IA veio incompleta. Tente de novo.'); }
      return this.paraMusica(j, termo, fontes);
    }
    throw new Error('A pesquisa demorou demais. Tente um nome mais específico (música + artista).');
  },

  /* "Colar cifra": separa as linhas de acordes das linhas de letra.
     Uma linha é de acordes quando quase todas as "palavras" dela parecem acordes.
     A letra é descartada e nunca salva. */
  extrairDeCifra(texto, titulo = 'Minha música', artista = '') {
    const ehAcorde = tok => /^[A-G](#|b)?(m|M|maj|dim|aug|sus|add|°|º|ø|\+|-)?[0-9]*(M|\+)?(\([^)]*\))?(\/[A-G](#|b)?)?$/.test(tok);
    const secoes = [];
    let atual = { nome: 'Música', acordes: [] };
    for (const linha of String(texto).split(/\r?\n/)) {
      const cab = linha.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
      let resto = linha;
      if (cab) {
        if (atual.acordes.length) secoes.push(atual);
        atual = { nome: cab[1].trim().slice(0, 40), acordes: [] };
        resto = cab[2];
      }
      const toks = resto.replace(/[|()]/g, m => (m === '|' ? ' ' : m)).trim().split(/\s+/).filter(t => t && !/^x?\d+x?$/i.test(t) && !/^[-–.]+$/.test(t));
      if (!toks.length || /^[eBGDAE]\|/.test(resto.trim())) continue; // pula tablatura
      const acordes = toks.filter(ehAcorde);
      if (acordes.length / toks.length >= 0.75) atual.acordes.push(...acordes.map(normalizarAcorde));
    }
    if (atual.acordes.length) secoes.push(atual);
    if (!secoes.length) throw new Error('Não encontrei acordes nesse texto. Copie a cifra com os acordes acima da letra.');
    return {
      id: 'm' + Date.now().toString(36), origem: 'colada', titulo, artista, genero: '', padrao: 'pop', bpm: 90, capo: 0,
      secoes: secoes.map(s => ({ nome: s.nome, seq: s.acordes.map(a => a + ':4').join(' '), repetir: 1 })),
      nota: 'Extraído da cifra colada: cada acorde ficou com 1 compasso. Ajuste se precisar.', status: 'aprendendo'
    };
  }
};
