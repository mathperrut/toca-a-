// Sonda (roda no GitHub Actions, que tem internet): descobre a estrutura atual
// do Cifra Club e da busca do YouTube. NÃO imprime letras: o texto fora dos
// acordes é mascarado com "x".
import { writeFileSync, mkdirSync } from 'node:fs';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const espera = ms => new Promise(r => setTimeout(r, ms));
async function get(url, extra = {}) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', ...extra }, redirect: 'follow' });
    const t = await r.text();
    return { status: r.status, url: r.url, tipo: r.headers.get('content-type'), text: t };
  } catch (e) { return { status: 'ERRO ' + e.message, text: '' }; }
}
const mascarar = s => s.replace(/(<b>[^<]*<\/b>)|(<[^>]+>)|([A-Za-zÀ-ÿ]+)/g, (m, b, tag, pal) => b || tag || 'x'.repeat(pal.length));
mkdirSync('saida', { recursive: true });

console.log('===== 1. ENDPOINTS DE BUSCA =====');
const q = encodeURIComponent('trem bala');
for (const u of [
  `https://solr.sscdn.co/cc/h2/?q=${q}`,
  `https://solr.sscdn.co/cc/h1/?q=${q}`,
  `https://studiosolsolr-a.akamaihd.net/cc/h2/?q=${q}`,
  `https://solr.sscdn.co/letras/m1/?q=${q}`,
  `https://www.cifraclub.com.br/?q=${q}`,
  `https://www.cifraclub.com.br/busca/?q=${q}`,
]) {
  const r = await get(u);
  console.log(`\n--- ${u}\n status=${r.status} tipo=${r.tipo} final=${r.url} tam=${r.text.length}`);
  console.log(r.text.slice(0, 900).replace(/\s+/g, ' '));
  await espera(700);
}

console.log('\n===== 2. JS DA HOME: onde a busca é feita =====');
const home = await get('https://www.cifraclub.com.br/');
console.log('home status', home.status, 'tam', home.text.length);
const scripts = [...home.text.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).slice(0, 25);
console.log('scripts:', scripts.join('\n  '));
for (const m of home.text.matchAll(/(solr|suggest|sscdn|autocomplete|search)[^"'\s<]{0,120}/gi)) { console.log('  home>', m[0].slice(0, 160)); }
let n = 0;
for (let s of scripts) {
  if (n > 12) break;
  if (s.startsWith('//')) s = 'https:' + s; else if (s.startsWith('/')) s = 'https://www.cifraclub.com.br' + s;
  const r = await get(s); n++;
  const achados = [...r.text.matchAll(/.{0,90}(solr\.|sscdn\.co\/cc|\/cc\/h\d|suggest_callback|akamaihd).{0,140}/g)].slice(0, 6);
  if (achados.length) { console.log('\n  JS', s, r.status); achados.forEach(a => console.log('    >', a[0])); }
  await espera(300);
}

console.log('\n===== 3. ESTRUTURA DE UMA PÁGINA DE CIFRA =====');
for (const slug of ['ana-vilela/trem-bala/', 'jorge-ben-jor/mas-que-nada/', 'ana-vilela/trem-bala/simplificada.html']) {
  const r = await get('https://www.cifraclub.com.br/' + slug);
  const h = r.text;
  console.log(`\n--- ${slug} status=${r.status} final=${r.url} tam=${h.length}`);
  console.log(' title:', (h.match(/<title>([^<]*)<\/title>/) || [])[1]);
  for (const re of [/<h1[^>]*>[\s\S]{0,200}?<\/h1>/, /<h2[^>]*>[\s\S]{0,300}?<\/h2>/, /.{0,120}cifra_tom.{0,200}/, /.{0,120}cifra_capo.{0,200}/, /.{0,100}[Cc]apotraste.{0,160}/, /.{0,80}simplificad.{0,120}/]) {
    const m = h.match(re); console.log(' ', re.source.slice(0, 18), '=>', m ? m[0].replace(/\s+/g, ' ').slice(0, 400) : '(nada)');
  }
  const pres = [...h.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)];
  console.log(' <pre> encontrados:', pres.length, pres.map(p => p[0].slice(0, 60).replace(/\s+/g, ' ')));
  if (pres[0]) console.log(' PRE (mascarado, 2500 chars):\n' + mascarar(pres[0][1]).slice(0, 2500));
  const yts = [...h.matchAll(/.{0,60}(youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/|ytimg\.com\/vi\/|"youtube[^"]{0,20}"\s*:\s*"|data-(?:video|yt)[a-z-]*=")([A-Za-z0-9_-]{11}).{0,40}/g)].slice(0, 8);
  console.log(' youtube:', yts.length); yts.forEach(m => console.log('   >', m[0].replace(/\s+/g, ' ')));
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  ld.forEach(x => { try { const j = JSON.parse(x[1]); console.log(' ld+json tipo:', JSON.stringify(Object.keys(j)).slice(0, 300), j['@type']); } catch (e) { console.log(' ld+json inválido'); } });
  for (const m of h.matchAll(/.{0,60}(window\.__|__NEXT_DATA__|__NUXT__|var\s+cifra\w*\s*=|"tom"\s*:|"key"\s*:).{0,120}/g)) console.log('  js-data>', m[0].replace(/\s+/g, ' ').slice(0, 220));
  await espera(800);
}

console.log('\n===== 4. BUSCA DO YOUTUBE =====');
const yt = await get('https://www.youtube.com/results?search_query=' + encodeURIComponent('Ana Vilela Trem-Bala'));
console.log('status', yt.status, 'tam', yt.text.length, 'consent?', /consent\.youtube|before you continue/i.test(yt.text));
const ids = [...yt.text.matchAll(/"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})".{0,1500}?"title":\{"runs":\[\{"text":"([^"]+)"/g)].slice(0, 6);
ids.forEach(m => console.log('  ', m[1], '|', m[2]));
const ids2 = [...new Set([...yt.text.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map(m => m[1]))].slice(0, 8);
console.log('  ids simples:', ids2.join(' '));
console.log('\nFIM');
