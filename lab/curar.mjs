// Dados extras para as músicas escolhidas: tom/capo da cifra ORIGINAL (para
// tocar junto com a gravação), BPM aproximado e vídeo oficial que deixa tocar
// dentro de apps (oEmbed responde 200). Nada de letra.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { DOMParser } from 'linkedom';
const espera = ms => new Promise(r => setTimeout(r, ms));
for (const f of ['data.js', 'acordes.js', 'cifras.js']) vm.runInThisContext(readFileSync('../app/' + f, 'utf8').replace(/^'use strict';/m, ''), { filename: f });
let ultimo = 0;
const get = async (url, ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36') => {
  const dt = Date.now() - ultimo; if (dt < 800) await espera(800 - dt); ultimo = Date.now();
  try { const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'pt-BR,pt;q=0.9' } }); return { status: r.status, texto: await r.text(), url: r.url }; }
  catch (e) { return { status: 0, texto: '', url }; }
};
Cifras.configurar({ DOMParser, http: (url, { ua }) => get(url, ua) });
const lista = readFileSync('curadoria.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean).map(l => l.split('|').map(s => s.trim()));
const saida = [];
mkdirSync('saida', { recursive: true });
for (const [art, mus, buscaYt] of lista) {
  const item = { art, mus };
  try {
    const orig = await Cifras.baixar(art, mus, { simplificada: false });
    Object.assign(item, { tomOriginal: orig.tom, formaOriginal: orig.formaTom, capoOriginal: orig.capo, genero: orig.genero, titulo: orig.titulo, artista: orig.artista, acordesOriginal: [...new Set(orig.secoes.flatMap(s => lerSequencia(s.seq).map(x => x.acorde)))] });
    const simp = await Cifras.baixar(art, mus, { simplificada: true });
    Object.assign(item, { simplificada: simp.simplificada, tomSimp: simp.tom, capoSimp: simp.capo, secoes: simp.secoes });
  } catch (e) { item.erro = String(e.message || e); }
  // BPM (songbpm.com)
  const bp = await get(`https://songbpm.com/@${art}/${mus}`);
  const mb = bp.texto.match(/(?:tempo of|Tempo)\D{0,40}?(\d{2,3})\s*BPM/i) || bp.texto.match(/(\d{2,3})\s*BPM/);
  item.bpm = mb ? +mb[1] : null; item.bpmStatus = bp.status;
  // YouTube
  const yt = await Cifras.youtube(item.titulo || mus, item.artista || art);
  const extra = buscaYt ? await (async () => {
    const r = await get('https://www.youtube.com/results?hl=pt&gl=BR&search_query=' + encodeURIComponent(buscaYt));
    const ids = [...r.texto.matchAll(/"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"[\s\S]{0,3000}?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"[\s\S]{0,1500}?"(?:ownerText|longBylineText)":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g)].slice(0, 5);
    return ids.map(m => ({ id: m[1], titulo: m[2], canal: m[3], pontos: 0 }));
  })() : [];
  const cands = [...yt.slice(0, 4), ...extra];
  for (const v of cands) {
    const o = await get('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + v.id));
    v.embed = o.status;
  }
  item.youtube = cands;
  saida.push(item);
  console.log(`\n# ${art}/${mus}: ${item.erro || ''}\n  original: tom ${item.tomOriginal}${item.formaOriginal ? ' (forma ' + item.formaOriginal + ')' : ''} capo ${item.capoOriginal} | simplificada: ${item.simplificada} tom ${item.tomSimp} capo ${item.capoSimp} | gênero ${item.genero} | bpm ${item.bpm} (${item.bpmStatus})`);
  console.log(`  acordes originais: ${(item.acordesOriginal || []).join(' ')}`);
  cands.forEach(v => console.log(`  yt ${v.id} embed=${v.embed} [${v.pontos}] ${v.titulo} / ${v.canal}`));
}
writeFileSync('saida/curadoria.json', JSON.stringify(saida, null, 1));
console.log('\nFIM');
