// Copia só os arquivos do app (não a pasta ia/, nem o projeto Android) para www/,
// que é a pasta que o Capacitor coloca dentro do .apk.
// Também ajusta o capacitor.config.json com o "hostname" do app (ver README).
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const ARQUIVOS = [
  'index.html', 'tema.css', 'manifest.webmanifest',
  'data.js', 'acordes.js', 'som.js', 'modelo-acordes.js', 'modelo-acordes.json', 'ia.js', 'audio-detect.js',
  'cifras.js', 'gravacao.js', 'youtube.js', 'apostilas.js', 'aprender.js', 'jogo.js', 'app.js'
];
const PASTAS = ['icones', 'sons', 'fontes', 'videos'];

rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of ARQUIVOS) {
  if (!existsSync(f)) { console.error('Arquivo faltando: ' + f); process.exit(1); }
  cpSync(f, `www/${f}`);
}
for (const p of PASTAS) if (existsSync(p)) cpSync(p, `www/${p}`, { recursive: true });

// O player do YouTube precisa saber de que "site" ele está sendo aberto.
// No GitHub Actions usamos SEU-USUARIO.github.io (o mesmo endereço do seu site);
// rodando no PC, fica "localhost".
const dono = (process.env.GITHUB_REPOSITORY_OWNER || '').toLowerCase();
const cfg = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
cfg.server.hostname = dono ? `${dono}.github.io` : 'localhost';
writeFileSync('capacitor.config.json', JSON.stringify(cfg, null, 2) + '\n');
console.log(`www/ pronto (${ARQUIVOS.length} arquivos + ${PASTAS.join(', ')}); hostname = ${cfg.server.hostname}`);
