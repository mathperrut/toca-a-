// Testa o cifras.js do app contra o site real (roda no GitHub Actions).
// Guarda SÓ acordes, nomes de seções e dados do YouTube (nada de letra).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { DOMParser } from 'linkedom';
const UA = 'Mozilla/5.0';
const espera = ms => new Promise(r => setTimeout(r, ms));
// Carrega os scripts do app como se fossem <script> da página
for (const f of ['data.js', 'estrada.js', 'cifras.js']) vm.runInThisContext(readFileSync('../app/' + f, 'utf8').replace(/^'use strict';/m, ''), { filename: f });
let ultimo = 0;
Cifras.configurar({
  DOMParser,
  http: async (url, { ua }) => {
    const dt = Date.now() - ultimo; if (dt < 900) await espera(900 - dt); ultimo = Date.now();
    const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'pt-BR,pt;q=0.9' } });
    return { status: r.status, texto: await r.text(), url: r.url };
  }
});
const custo = n => custoAcorde(acordePorNome(n));
const buscas = readFileSync('musicas.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const saida = [];
mkdirSync('saida', { recursive: true });
for (const q of buscas) {
  const item = { busca: q };
  try {
    const res = await Cifras.procurar(q);
    item.resultados = res.slice(0, 3).map(r => `${r.titulo} — ${r.artista} (${r.slugArtista}/${r.slugMusica})`);
    const alvo = res[0];
    if (!alvo) throw new Error('sem resultados');
    const d = await Cifras.baixar(alvo.slugArtista, alvo.slugMusica);
    const todos = d.secoes.flatMap(s => lerSequencia(s.seq).map(x => x.acorde));
    const unicos = [...new Set(todos)];
    const basicos = [...new Set(todos.map(Cifras.basico))];
    const k = Cifras.melhorCapo(basicos, custo);
    Object.assign(item, {
      titulo: d.titulo, artista: d.artista, genero: d.genero, url: d.fonte, simplificada: d.simplificada,
      tom: d.tom, formaTom: d.formaTom, capo: d.capo, videoAula: d.videoAula,
      secoes: d.secoes, acordes: unicos, basicos, custoBasicos: basicos.map(custo),
      capoSugerido: k, comCapo: k ? basicos.map(a => Cifras.transpor(a, -k)) : null,
      totalTempos: todos.length
    });
    const yt = await Cifras.youtube(d.titulo, d.artista);
    item.youtube = yt.slice(0, 4).map(v => ({ id: v.id, titulo: v.titulo, canal: v.canal, duracao: v.duracao, pontos: v.pontos }));
  } catch (e) { item.erro = String(e && e.message || e); }
  saida.push(item);
  const yt0 = item.youtube?.[0];
  console.log(`\n# ${q}\n  ${item.erro ? 'ERRO: ' + item.erro : `${item.titulo} — ${item.artista} | gênero ${item.genero} | ${item.simplificada ? 'simplificada' : 'original'} | tom ${item.tom}${item.formaTom ? ' (forma ' + item.formaTom + ')' : ''} capo ${item.capo}`}`);
  if (!item.erro) {
    console.log(`  acordes: ${item.acordes.join(' ')}\n  básicos: ${item.basicos.join(' ')} (custos ${item.custoBasicos.join(',')})${item.capoSugerido ? ` | capo +${item.capoSugerido}: ${item.comCapo.join(' ')}` : ''}`);
    console.log(`  seções: ${item.secoes.map(s => s.nome + '[' + lerSequencia(s.seq).length + ']').join(', ')} | ${item.totalTempos} acordes`);
    item.secoes.slice(0, 3).forEach(s => console.log(`    ${s.nome}: ${s.seq}`));
    if (yt0) console.log(`  youtube: ${item.youtube.map(v => `${v.id} [${v.pontos}] ${v.titulo} / ${v.canal} ${v.duracao}`).join('\n           ')}`);
  }
}
writeFileSync('saida/cifras.json', JSON.stringify(saida, null, 1));
console.log('\nFIM', saida.length, 'músicas,', saida.filter(x => x.erro).length, 'erros');
