// Ajustes no projeto Android que o "npx cap add android" cria:
// 1. permissão de microfone (afinador e jogos que escutam o violão);
// 2. a tela gira (o jogo fica melhor deitado, como no Yousician);
// 3. número de versão que sobe a cada build (o Android só atualiza se o número aumentar).
import { readFileSync, writeFileSync } from 'node:fs';

const versao = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);

const manifestoCaminho = 'android/app/src/main/AndroidManifest.xml';
let man = readFileSync(manifestoCaminho, 'utf8');
for (const p of ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS']) {
  if (!man.includes(p)) man = man.replace('<application', `<uses-permission android:name="${p}" />\n    <application`);
}
man = man.replace(/\s*android:screenOrientation="[^"]*"/, '');
writeFileSync(manifestoCaminho, man);

const gradleCaminho = 'android/app/build.gradle';
let gradle = readFileSync(gradleCaminho, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versao}`).replace(/versionName\s+"[^"]*"/, `versionName "1.0.${versao}"`);
writeFileSync(gradleCaminho, gradle);

console.log(`Android configurado: microfone, tela que gira, versão 1.0.${versao} (código ${versao})`);
