/* =========================================================
   TOCA AÍ — apostilas.js
   As apostilas: textos curtos que explicam COMO o violão funciona
   e COMO estudar. Cada uma tem:
     • um mini vídeo no começo;
     • seções curtas com desenhos;
     • "Analogia": uma comparação com algo do dia a dia;
     • "Pegadinha": o erro que quase todo iniciante comete;
     • um teste rápido que corrige na hora.
   ========================================================= */
'use strict';

/* ---------- Desenhos das apostilas (SVG) ---------- */
const DESENHOS = {
  // Violão inteiro com as partes
  partes: () => `<svg class="ap-svg" viewBox="0 0 360 520" role="img" aria-label="Partes do violão">
    <g class="pt-violao">
      <rect x="152" y="18" width="56" height="78" rx="10"/>
      ${[0, 1, 2].map(i => `<circle cx="144" cy="${34 + i * 22}" r="6"/><circle cx="216" cy="${34 + i * 22}" r="6"/>`).join('')}
      <rect class="pt-nut" x="160" y="96" width="40" height="5"/>
      <rect x="162" y="101" width="36" height="170"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<line class="pt-traste" x1="162" x2="198" y1="${118 + k * 20}" y2="${118 + k * 20}"/>`).join('')}
      <path d="M180 262 C 108 262 92 300 104 336 C 112 360 84 372 84 418 C 84 476 132 506 180 506 C 228 506 276 476 276 418 C 276 372 248 360 256 336 C 268 300 252 262 180 262 Z"/>
      <circle class="pt-boca" cx="180" cy="352" r="27"/>
      <circle class="pt-roseta" cx="180" cy="352" r="34"/>
      <rect class="pt-cavalete" x="138" y="438" width="84" height="16" rx="4"/>
      <line class="pt-rastilho" x1="150" x2="210" y1="444" y2="444"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<line class="pt-corda" x1="${166 + i * 5.6}" x2="${166 + i * 5.6}" y1="98" y2="446"/>`).join('')}
    </g>
    <g class="pt-rot">
      <text x="236" y="30">Tarraxas</text><path d="M232 26h-10"/>
      <text x="22" y="62">Cabeça (mão)</text><path d="M104 58h40"/>
      <text x="216" y="100">Pestana</text><path d="M212 98h-10"/>
      <text x="216" y="160">Trastes</text><path d="M212 157h-12"/>
      <text x="22" y="192">Braço</text><path d="M66 188h94"/>
      <text x="22" y="214" class="pt-mini">o espaço entre</text><text x="22" y="230" class="pt-mini">2 trastes é a casa</text>
      <text x="282" y="352">Boca</text><path d="M278 348h-62"/>
      <text x="282" y="300">Tampo</text><path d="M278 296h-40"/>
      <text x="282" y="448">Cavalete</text><path d="M278 444h-54"/>
      <text x="16" y="452">Rastilho</text><path d="M78 448h70"/>
      <text x="16" y="404">Caixa</text><path d="M58 400h28"/>
    </g></svg>`,

  // As 6 cordas com número, letra e nome
  cordas: () => `<svg class="ap-svg" viewBox="0 0 320 170" role="img" aria-label="As seis cordas">
    ${[0, 1, 2, 3, 4, 5].map(i => `<line class="dg-corda" style="stroke-width:${4.2 - i * 0.6}" x1="${30 + i * 52}" x2="${30 + i * 52}" y1="8" y2="104"/>
      <text class="ap-t-forte" x="${30 + i * 52}" y="126" text-anchor="middle">${ORD[i]}</text>
      <text class="ap-t" x="${30 + i * 52}" y="146" text-anchor="middle">${'EADGBE'[i]}</text>
      <text class="ap-t-fraco" x="${30 + i * 52}" y="164" text-anchor="middle">${NOME_CORDA[i].split(' ')[0]}</text>`).join('')}
  </svg>`,

  // Casas e trastes
  casas: () => `<svg class="ap-svg" viewBox="0 0 320 170" role="img" aria-label="Casas e trastes">
    <text class="ap-t-fraco" x="160" y="14" text-anchor="middle">cabeça do violão</text>
    <line class="dg-pestana" x1="40" x2="260" y1="26" y2="26"/>
    ${[1, 2, 3, 4].map(k => `<line class="dg-traste" x1="40" x2="260" y1="${26 + k * 32}" y2="${26 + k * 32}"/><text class="ap-t" x="270" y="${26 + k * 32 - 12}">casa ${k}</text>`).join('')}
    ${[0, 1, 2, 3, 4, 5].map(i => `<line class="dg-corda" x1="${40 + i * 44}" x2="${40 + i * 44}" y1="26" y2="154"/>`).join('')}
    <circle class="dg-dedo d1" cx="216" cy="44" r="10"/><text class="dg-num" x="216" y="48.5" text-anchor="middle">1</text>
    <text class="ap-t-fraco" x="34" y="62" text-anchor="end">traste</text>
  </svg>`,

  // Dedos numerados
  dedos: () => `<div class="ap-dedos">${[1, 2, 3, 4].map(d => `<span><i class="bola d${d}">${d}</i>${NOMES_DEDOS[d]}</span>`).join('')}<span><i class="bola polegar">P</i>polegar (atrás do braço)</span></div>`,

  // Como ler o diagrama
  diagrama: () => `<div class="ap-diag">${diagramaAcorde('Am7', { tam: 'lg' })}<ul>
    <li><span class="ap-o"></span> corda solta: toca sem apertar</li>
    <li><span class="ap-x">×</span> não toca essa corda</li>
    <li><i class="bola d1">1</i> aperte aqui com o dedo 1</li>
    <li><b>E A D G B E</b> embaixo: o nome de cada corda</li></ul></div>`,

  // Tablatura
  tab: () => `<svg class="ap-svg" viewBox="0 0 340 150" role="img" aria-label="Exemplo de tablatura">
    ${['e', 'B', 'G', 'D', 'A', 'E'].map((l, i) => `<text class="ap-t-forte" x="8" y="${24 + i * 20}">${l}</text><line class="dg-traste" x1="26" x2="330" y1="${20 + i * 20}" y2="${20 + i * 20}"/>`).join('')}
    ${[[3, 0, 60], [3, 0, 100], [2, 3, 140], [2, 3, 180], [1, 0, 220], [1, 1, 260], [1, 3, 300]].map(([c, f, x]) => `<rect class="ap-tab-fundo" x="${x - 9}" y="${20 + c * 20 - 9}" width="18" height="18" rx="4"/><text class="ap-tab-num" x="${x}" y="${20 + c * 20 + 5}" text-anchor="middle">${f}</text>`).join('')}
    <text class="ap-t-fraco" x="178" y="146" text-anchor="middle">leia da esquerda para a direita</text>
  </svg>`,

  // Notas na 6ª e na 5ª corda
  notasBraco: () => {
    const casas = 12, x0 = 30, dx = 24, notas6 = ['E', 'F', '', 'G', '', 'A', '', 'B', 'C', '', 'D', '', 'E'], notas5 = ['A', '', 'B', 'C', '', 'D', '', 'E', 'F', '', 'G', '', 'A'];
    let s = `<svg class="ap-svg" viewBox="0 0 340 120" role="img" aria-label="Notas na 6ª e 5ª corda">`;
    for (let k = 0; k <= casas; k++) s += `<line class="${k === 0 ? 'dg-pestana' : 'dg-traste'}" x1="${x0 + k * dx}" x2="${x0 + k * dx}" y1="30" y2="74"/>`;
    s += `<line class="dg-corda" x1="${x0}" x2="${x0 + casas * dx}" y1="40" y2="40"/><line class="dg-corda" style="stroke-width:2.6" x1="${x0}" x2="${x0 + casas * dx}" y1="64" y2="64"/>`;
    s += `<text class="ap-t-forte" x="8" y="44">5ª</text><text class="ap-t-forte" x="8" y="68">6ª</text>`;
    const pos = k => (k === 0 ? x0 - 12 : x0 + (k - 0.5) * dx);
    notas5.forEach((n, k) => { if (n) s += `<circle class="ap-nota" cx="${pos(k)}" cy="40" r="9"/><text class="ap-nota-t" x="${pos(k)}" y="44" text-anchor="middle">${n}</text>`; });
    notas6.forEach((n, k) => { if (n) s += `<circle class="ap-nota" cx="${pos(k)}" cy="64" r="9"/><text class="ap-nota-t" x="${pos(k)}" y="68" text-anchor="middle">${n}</text>`; });
    [3, 5, 7, 9, 12].forEach(k => { s += `<text class="ap-t-fraco" x="${x0 + (k - 0.5) * dx}" y="96" text-anchor="middle">${k}</text>`; });
    return s + `<text class="ap-t-fraco" x="170" y="114" text-anchor="middle">casas com marcação no braço</text></svg>`;
  },

  // Maior x menor: E e Em lado a lado
  maiorMenor: () => `<div class="ap-par">${['E', 'Em'].map(a => `<figure>${diagramaAcorde(a, { tam: 'md' })}<figcaption><b>${a}</b> ${a === 'E' ? 'maior: som alegre' : 'menor: som triste'}<button class="btn mini" data-ouvir="${a}">${IC.som} Ouvir</button></figcaption></figure>`).join('')}</div>`,

  // Campo harmônico de Sol
  campo: () => `<div class="ap-campo">${['G', 'Am', 'Bm', 'C', 'D', 'Em'].map((a, i) => `<span><b>${a}</b><small>${['I', 'ii', 'iii', 'IV', 'V', 'vi'][i]}</small></span>`).join('')}</div>`,

  // Batidas
  batida: () => `<div class="ap-batida">${['1', 'e', '2', 'e', '3', 'e', '4', 'e'].map((n, k) => `<span class="${k % 2 ? 'cima' : ''}"><b>${k % 2 ? '↑' : '↓'}</b><small>${n}</small></span>`).join('')}</div>`,

  // Ritmos com botão de ouvir
  ritmos: () => `<div class="ap-ritmos">${['samba', 'pagode', 'bossa', 'baiao', 'sambarock'].map(id => { const p = patternById(id); return `<div class="ap-ritmo"><b>${esc(p.genero)}</b>${batidaHTML(p)}<button class="btn mini" data-ritmo="${id}">${IC.som} Ouvir</button></div>`; }).join('')}</div>`,

  // Rotina de estudo
  rotina: () => `<ol class="ap-rotina">
    <li><b>1 min</b><span>Afinar</span></li><li><b>3 min</b><span>Acorde novo, dedo a dedo</span></li>
    <li><b>3 min</b><span>1 minuto de trocas</span></li><li><b>3 min</b><span>Uma música no jogo</span></li></ol>`
};

/* ---------- Conteúdo ---------- */
const APOSTILAS = [
  {
    id: 'violao', titulo: 'O violão por dentro', resumo: 'As partes do violão, como o som nasce e por que cada casa muda a nota.', video: 'partes', min: 5,
    secoes: [
      { titulo: 'As partes do violão', visual: 'partes', html: `<p>O violão tem três partes grandes: a <b>cabeça</b> (onde ficam as tarraxas), o <b>braço</b> (onde a mão esquerda aperta as cordas) e a <b>caixa</b> (o corpo oco que faz o som ficar forte).</p>
        <p>As <b>tarraxas</b> esticam ou afrouxam cada corda. É com elas que você afina. Os <b>trastes</b> são os ferrinhos do braço, e o espaço entre dois trastes se chama <b>casa</b>.</p>` },
      { titulo: 'Como o som nasce', html: `<p>Quando você bate na corda, ela vibra muito rápido. Essa vibração passa pelo <b>rastilho</b> e pelo <b>cavalete</b> até o <b>tampo</b> (a madeira da frente). O tampo vibra junto, e o ar dentro da caixa sai pela <b>boca</b>. Por isso o violão soa alto sem precisar de tomada.</p>` },
      { tipo: 'analogia', html: 'A corda é a sua voz e a caixa é um megafone. Sem a caixa, a corda faria um som fininho, quase sem volume.' },
      { titulo: 'Por que apertar uma casa muda a nota', visual: 'casas', html: `<p>Apertar uma casa <b>encurta</b> o pedaço da corda que vibra. Corda mais curta vibra mais rápido, e o som fica mais <b>agudo</b>.</p>
        <p>Cada casa sobe o som em <b>meio tom</b>. Doze casas sobem uma <b>oitava</b>: a mesma nota, mais aguda. Na casa 12 a corda vibra pela metade.</p>` },
      { titulo: 'Nylon ou aço?', html: `<p>O <b>violão de nylon</b> (clássico) tem som macio e é o mais usado no samba, na bossa nova e na MPB. As cordas machucam menos os dedos no começo.</p>
        <p>O <b>violão de aço</b> (folk) tem som mais brilhante e é comum no pop e no sertanejo. As cordas são mais duras.</p>` },
      { tipo: 'pegadinha', html: 'Nunca coloque cordas de aço num violão de nylon. Elas puxam com muito mais força e podem rachar o tampo ou entortar o braço.' },
      { tipo: 'pegadinha', html: 'A palavra <b>pestana</b> tem dois sentidos: é a peça entre a cabeça e o braço e também o acorde em que o dedo 1 deita sobre várias cordas.' }
    ],
    quiz: [
      { p: 'Para que servem as tarraxas?', o: ['Para afinar as cordas', 'Para aumentar o volume', 'Para trocar de acorde'], c: 0, e: 'As tarraxas esticam ou afrouxam a corda: é assim que se afina.' },
      { p: 'Apertar uma casa mais perto da boca do violão deixa o som…', o: ['Mais grave', 'Mais agudo', 'Igual'], c: 1, e: 'A parte da corda que vibra fica mais curta, então vibra mais rápido: som mais agudo.' },
      { p: 'Quantas casas sobem uma oitava?', o: ['7', '10', '12'], c: 2, e: 'Doze casas = doze meios tons = uma oitava. Por isso a casa 12 tem marcação dupla.' }
    ]
  },
  {
    id: 'afinar', titulo: 'Afinação', resumo: 'O nome de cada corda solta e dois jeitos de afinar: com o app e de ouvido.', video: 'afinar', min: 4,
    secoes: [
      { titulo: 'As notas das cordas soltas', visual: 'cordas', html: `<p>Da mais grossa (6ª) para a mais fina (1ª): <b>Mi, Lá, Ré, Sol, Si, Mi</b>. Na cifra: <b>E A D G B E</b>.</p>
        <p>Um jeito de decorar: <b>E</b>u <b>A</b>mo <b>D</b>oce <b>d</b>e <b>G</b>oiaba, <b>B</b>em <b>E</b>scuro.</p>` },
      { titulo: 'Afinando com o app', html: `<p>Abra a aba <b>Afinador</b> e toque uma corda solta. O ponteiro mostra se a nota está certa:</p>
        <ul><li>Ponteiro para a <b>esquerda</b>: está grave. Aperte a tarraxa (o som sobe).</li>
        <li>Ponteiro para a <b>direita</b>: está agudo. Afrouxe a tarraxa (o som desce).</li>
        <li>No centro e verde: afinada.</li></ul>` },
      { tipo: 'analogia', html: 'Afinar é como regular o volume de uma conversa: você vai devagar até encontrar o ponto certo. Gire a tarraxa aos poucos, um quarto de volta por vez.' },
      { titulo: 'Afinando de ouvido (método da casa 5)', html: `<p>Com a 6ª corda afinada, dá para afinar as outras comparando:</p>
        <ul><li>6ª corda na <b>casa 5</b> = 5ª corda solta (Lá)</li><li>5ª corda na casa 5 = 4ª solta (Ré)</li><li>4ª corda na casa 5 = 3ª solta (Sol)</li>
        <li>3ª corda na <b>casa 4</b> = 2ª solta (Si)</li><li>2ª corda na casa 5 = 1ª solta (Mi)</li></ul>` },
      { tipo: 'pegadinha', html: 'No método de ouvido, a 3ª corda é a exceção: ela usa a <b>casa 4</b>, e não a 5.' },
      { tipo: 'pegadinha', html: 'Se passar do ponto, afrouxe um pouco e chegue na nota <b>subindo</b>. Assim a corda segura a afinação por mais tempo.' },
      { titulo: 'Cordas novas desafinam', html: '<p>Cordas novas esticam nos primeiros dias e desafinam rápido. É normal: afine antes de cada treino.</p>' }
    ],
    quiz: [
      { p: 'Qual é a nota da 5ª corda solta?', o: ['Mi', 'Lá', 'Ré'], c: 1, e: 'E A D G B E: a 5ª corda é o Lá (A).' },
      { p: 'O ponteiro do afinador está para a esquerda. O que fazer?', o: ['Afrouxar a tarraxa', 'Apertar a tarraxa', 'Trocar a corda'], c: 1, e: 'Esquerda é grave. Apertar a tarraxa estica a corda e o som sobe.' },
      { p: 'No método de ouvido, que casa da 3ª corda dá a nota da 2ª corda solta?', o: ['Casa 5', 'Casa 4', 'Casa 3'], c: 1, e: 'É a única exceção: casa 4.' }
    ]
  },
  {
    id: 'postura', titulo: 'Postura e mãos', resumo: 'Como sentar, segurar o violão e usar cada mão sem dor.', video: 'postura', min: 4,
    secoes: [
      { titulo: 'Sentado do jeito certo', html: `<p>Costas retas, pés no chão. O violão encosta no seu corpo e a cintura dele fica sobre a perna. O braço do violão aponta um pouco para cima, nunca para o chão.</p>` },
      { titulo: 'A mão que aperta as cordas', visual: 'dedos', html: `<p>Os dedos têm número: <b>1</b> indicador, <b>2</b> médio, <b>3</b> anelar e <b>4</b> mindinho. O polegar fica <b>atrás do braço</b>, mais ou menos no meio.</p>
        <p>Use a <b>ponta</b> dos dedos, com eles curvados, e aperte <b>logo atrás do traste</b>. Unhas curtas ajudam muito.</p>` },
      { tipo: 'analogia', html: 'Pense nos dedos como martelinhos: a ponta cai firme e reta na corda. Dedo deitado encosta nas cordas vizinhas e abafa o som.' },
      { titulo: 'A mão da batida', html: `<p>Na batida, quem trabalha é o <b>pulso</b>, solto, como quem sacode água da mão. Com palheta, segure entre o polegar e o indicador deixando só a pontinha para fora.</p>
        <p>Nos ritmos com dedos (samba, bossa), o polegar (<b>P</b>) toca as cordas graves e os dedos (<b>i m a</b>) as agudas.</p>` },
      { tipo: 'pegadinha', html: 'Apertar com força demais cansa a mão e não melhora o som. Aperte só o suficiente para a nota soar limpa.' },
      { titulo: 'Dor nos dedos é normal', html: '<p>Nas primeiras semanas a ponta dos dedos dói. Em 2 a 3 semanas se formam calos e a dor passa. Treine pouco e todo dia, e pare se doer muito.</p>' }
    ],
    quiz: [
      { p: 'Qual é o dedo 3?', o: ['Médio', 'Anelar', 'Mindinho'], c: 1, e: '1 indicador, 2 médio, 3 anelar, 4 mindinho.' },
      { p: 'Onde apertar a corda dentro da casa?', o: ['No meio da casa', 'Logo atrás do traste', 'Em cima do traste'], c: 1, e: 'Logo atrás do traste o som sai limpo com menos força.' },
      { p: 'Quem faz o movimento da batida?', o: ['O ombro', 'O pulso solto', 'Só os dedos'], c: 1, e: 'O pulso solto deixa a batida leve e no tempo.' }
    ]
  },
  {
    id: 'ler', titulo: 'Diagramas, cifras e tablaturas', resumo: 'Os três jeitos de escrever música para violão, e como o jogo usa cada um.', video: 'diagrama', min: 5,
    secoes: [
      { titulo: 'O diagrama de acorde', visual: 'diagrama', html: `<p>É o violão <b>de pé na sua frente</b>. As linhas em pé são as cordas, com a 6ª (a mais grossa) à esquerda. As linhas deitadas são os trastes, e a linha grossa de cima é o começo do braço.</p>
        <p>Se aparecer um número ao lado, como <b>5ª</b>, o desenho começa naquela casa.</p>` },
      { titulo: 'A cifra', html: `<p>Na cifra, cada acorde tem uma letra: <b>C</b> Dó, <b>D</b> Ré, <b>E</b> Mi, <b>F</b> Fá, <b>G</b> Sol, <b>A</b> Lá, <b>B</b> Si. Depois da letra vêm detalhes:</p>
        <ul><li><b>m</b> = menor (Am = Lá menor)</li><li><b>7</b> = com sétima (G7)</li><li><b>7M</b> = com sétima maior (C7M)</li><li><b>9</b> = com nona (A9)</li>
        <li><b>/</b> = baixo diferente (G/B = Sol com Si no baixo)</li><li><b>#</b> = meio tom acima, <b>b</b> = meio tom abaixo</li></ul>` },
      { titulo: 'A tablatura', visual: 'tab', html: `<p>A tablatura tem <b>6 linhas</b>, uma para cada corda. Os <b>números</b> dizem a casa que você aperta, e <b>0</b> é corda solta. Leia da esquerda para a direita.</p>
        <p>O jogo do app é uma tablatura em movimento: as notas e os acordes andam pelas 6 cordas até a linha vermelha.</p>` },
      { tipo: 'pegadinha', html: 'Na tablatura, a linha de <b>cima</b> é a <b>1ª corda</b> (a mais fina). É o contrário do que você vê olhando para baixo enquanto toca. Se preferir, troque a ordem nos Ajustes.' },
      { tipo: 'analogia', html: 'O diagrama é uma foto da mão parada. A tablatura é um filme: mostra o que tocar e em que ordem.' }
    ],
    quiz: [
      { p: 'No diagrama, a linha da esquerda é…', o: ['A 1ª corda', 'A 6ª corda', 'O primeiro traste'], c: 1, e: 'O violão está de pé na sua frente: a corda grossa (6ª) fica à esquerda.' },
      { p: 'Na tablatura, o número 0 significa…', o: ['Não tocar', 'Corda solta', 'Casa 10'], c: 1, e: '0 = toca a corda sem apertar nenhuma casa.' },
      { p: 'O que é Am?', o: ['Lá maior', 'Lá menor', 'Lá com sétima'], c: 1, e: 'A = Lá, m = menor.' }
    ]
  },
  {
    id: 'notas', titulo: 'Notas no braço', resumo: 'As 7 notas, tons e semitons, e como achar qualquer nota.', min: 5,
    secoes: [
      { titulo: 'As 7 notas', html: `<p>A música usa 7 notas que se repetem: <b>Dó, Ré, Mi, Fá, Sol, Lá, Si</b> (C D E F G A B). Depois do Si vem o Dó de novo, mais agudo: isso é uma <b>oitava</b>.</p>` },
      { titulo: 'Tons e semitons', html: `<p>No violão, de uma casa para a vizinha a nota sobe um <b>semitom</b> (meio tom). Duas casas = um <b>tom</b>.</p>
        <p>Entre a maioria das notas há um tom (duas casas). Mas entre <b>Mi e Fá</b> e entre <b>Si e Dó</b> há só um semitom (uma casa).</p>` },
      { tipo: 'pegadinha', html: 'Por isso não se usa "Mi sustenido" nem "Si sustenido" no dia a dia: meio tom acima do Mi já é o Fá, e acima do Si já é o Dó.' },
      { titulo: 'Sustenido e bemol', html: `<p><b>#</b> (sustenido) sobe meio tom e <b>b</b> (bemol) desce meio tom. C# e Db são a <b>mesma casa</b> com dois nomes.</p>` },
      { titulo: 'Achando notas na 6ª e na 5ª corda', visual: 'notasBraco', html: `<p>Saber as notas dessas duas cordas ajuda a montar acordes com pestana: a nota mais grave do acorde dá o nome a ele.</p>` },
      { tipo: 'analogia', html: 'O braço é como um teclado de piano deitado em 6 fileiras: cada casa é uma tecla, branca ou preta.' }
    ],
    quiz: [
      { p: 'Quantas casas há entre Mi e Fá?', o: ['Uma', 'Duas', 'Três'], c: 0, e: 'Mi–Fá é um semitom: uma casa só.' },
      { p: 'Qual nota fica na casa 3 da 6ª corda?', o: ['Fá', 'Sol', 'Lá'], c: 1, e: 'Mi (solta), Fá (1), Fá# (2), Sol (3).' },
      { p: 'C# e Db são…', o: ['Notas diferentes', 'A mesma nota', 'Acordes'], c: 1, e: 'Mesma casa, dois nomes.' }
    ]
  },
  {
    id: 'acordes', titulo: 'Como os acordes funcionam', resumo: 'O que faz um acorde ser maior ou menor, a sétima, e o truque do capotraste.', min: 6,
    secoes: [
      { titulo: 'O que é um acorde', html: `<p>Acorde é um grupo de <b>3 ou mais notas</b> tocadas juntas. O básico é a <b>tríade</b>: a nota que dá o nome (fundamental), a <b>terça</b> e a <b>quinta</b>. Dó maior = Dó, Mi e Sol.</p>` },
      { tipo: 'analogia', html: 'Um acorde é uma receita com três ingredientes. Trocar um ingrediente só (a terça) muda o sabor de alegre para triste.' },
      { titulo: 'Maior ou menor', visual: 'maiorMenor', html: `<p>A diferença está na terça. No acorde <b>maior</b> ela fica 4 semitons acima da fundamental (som alegre). No <b>menor</b>, 3 semitons (som triste).</p>
        <p>No violão: do E para o Em você só tira o dedo 1. Ouça os dois.</p>` },
      { titulo: 'A sétima', html: `<p>Somar mais uma nota, a <b>sétima</b>, muda a cor do acorde. O <b>G7</b> tem uma tensão que "pede" para ir ao C. O <b>C7M</b> (sétima maior) tem aquele som sonhador da bossa nova.</p>` },
      { titulo: 'Acordes que combinam', visual: 'campo', html: `<p>Cada tom tem uma família de acordes que soam bem juntos: o <b>campo harmônico</b>. Em Sol maior a família é G, Am, Bm, C, D e Em.</p>
        <p>É por isso que G, C e D aparecem juntos em tantas músicas, como <b>Asa Branca</b>.</p>` },
      { titulo: 'O capotraste', html: `<p>O capotraste é uma "pestana de fora": você prende numa casa e todas as cordas sobem junto. Os desenhos dos acordes continuam os mesmos, só que soam mais agudos.</p>
        <p>Assim você toca no tom da gravação usando acordes fáceis. O app sugere a casa certa em cada música.</p>` },
      { tipo: 'pegadinha', html: 'Com o capotraste, as casas contam a partir dele. Um acorde "na casa 2" fica 2 casas depois do capo.' }
    ],
    quiz: [
      { p: 'O que muda entre um acorde maior e um menor?', o: ['A fundamental', 'A terça', 'A quinta'], c: 1, e: 'É a terça: 4 semitons no maior, 3 no menor.' },
      { p: 'Qual acorde "pede" para ir para o C?', o: ['G7', 'Em', 'A'], c: 0, e: 'O G7 tem tensão que se resolve no C.' },
      { p: 'Com o capotraste, os desenhos dos acordes…', o: ['Mudam todos', 'Continuam iguais, mas soam mais agudos', 'Ficam mais graves'], c: 1, e: 'O capo sobe todas as cordas junto.' }
    ]
  },
  {
    id: 'ritmo', titulo: 'Ritmo e batida', resumo: 'Pulso, compasso, a batida para baixo e para cima, e por que começar devagar.', video: 'batida', min: 4,
    secoes: [
      { titulo: 'O pulso', html: `<p>Toda música tem um <b>pulso</b>, como um coração batendo. A velocidade dele se mede em <b>BPM</b> (batidas por minuto). O metrônomo marca esse pulso.</p>` },
      { titulo: 'O compasso', html: `<p>Os tempos se juntam em grupos. <b>4 por 4</b> (1, 2, 3, 4) é o mais comum no pop e na MPB. <b>2 por 4</b> (1, 2) é o do samba e do baião. <b>3 por 4</b> (1, 2, 3) é o da valsa.</p>` },
      { titulo: 'Para baixo e para cima', visual: 'batida', html: `<p>Bata <b>para baixo</b> no número (1, 2, 3, 4) e <b>para cima</b> no "e" entre eles. A mão vai e volta o tempo todo, como um pêndulo. Nas pausas ela passa sem encostar nas cordas.</p>` },
      { tipo: 'pegadinha', html: 'Parar a mão nas pausas faz você perder o tempo. A mão nunca para: ela só deixa de encostar.' },
      { tipo: 'analogia', html: 'Andar de bicicleta devagar é mais difícil, mas é assim que se aprende o equilíbrio. Tocar devagar e certo ensina a mão; a velocidade vem depois sozinha.' },
      { titulo: 'Comece devagar', html: '<p>No jogo, comece em <b>40% ou 60%</b> da velocidade. Quando tirar 3 estrelas, suba 20%. É o caminho mais rápido para tocar a música inteira.</p>' }
    ],
    quiz: [
      { p: 'No 4 por 4, quando a mão vai para cima?', o: ['No número', 'No "e" entre os números', 'Nunca'], c: 1, e: 'Baixo no número, cima no "e".' },
      { p: 'O samba costuma ser em…', o: ['2 por 4', '3 por 4', '6 por 8'], c: 0, e: 'Samba e baião: 2 tempos por compasso.' },
      { p: 'Numa pausa da batida, a mão…', o: ['Para', 'Continua indo e voltando sem tocar', 'Bate mais forte'], c: 1, e: 'O movimento contínuo mantém o tempo.' }
    ]
  },
  {
    id: 'brasil', titulo: 'Ritmos brasileiros', resumo: 'Samba, pagode, bossa nova, baião e o samba-rock do Jorge Ben Jor.', video: 'samba', min: 6,
    secoes: [
      { titulo: 'Ouça cada ritmo', visual: 'ritmos', html: '<p><b>P</b> é o polegar nas cordas graves e <b>d</b> são os dedos juntos nas agudas. Toque em Ouvir para escutar.</p>' },
      { titulo: 'Samba', html: `<p>Em 2 por 4. O <b>polegar</b> faz o papel do surdo, marcando os dois tempos sem falhar. Os <b>dedos</b> fazem o tamborim, entrando fora do tempo forte (isso é a <b>síncope</b>).</p>` },
      { titulo: 'Pagode', html: '<p>A base é a do samba, com os dedos mais cheios e às vezes um <b>tapa</b> abafado nas cordas, que soa como percussão.</p>' },
      { titulo: 'Bossa nova', html: `<p>Criada no fim dos anos 1950, com João Gilberto no violão. O polegar marca os tempos como um relógio e os dedos fazem a síncope. Os acordes têm sétima e nona: Dm7, G7, C7M.</p>` },
      { titulo: 'Baião e xote', html: '<p>O ritmo de Luiz Gonzaga. O polegar imita a <b>zabumba</b> ("tum... tum") e os dedos respondem como o <b>triângulo</b>.</p>' },
      { titulo: 'Samba-rock', html: `<p>Nos anos 1960, Jorge Ben Jor criou um jeito próprio de tocar violão, misturando samba, rock e soul. A mão direita é solta, com acentos fora do tempo e muito balanço. É a batida de Mas Que Nada, Taj Mahal e País Tropical.</p>` },
      { tipo: 'analogia', html: 'Num ritmo brasileiro o violão é uma bateria inteira: o polegar é o bumbo e os dedos são a caixa e o chocalho.' },
      { tipo: 'pegadinha', html: 'Nos ritmos com polegar, não deixe o polegar acompanhar os dedos. Ele é o "chão" da música: regular, sempre no tempo.' }
    ],
    quiz: [
      { p: 'No samba, o polegar faz o papel de qual instrumento?', o: ['Tamborim', 'Surdo', 'Cuíca'], c: 1, e: 'O polegar marca os tempos como o surdo.' },
      { p: 'Quem criou o samba-rock no violão?', o: ['Tom Jobim', 'Jorge Ben Jor', 'Luiz Gonzaga'], c: 1, e: 'Jorge Ben Jor, nos anos 1960.' },
      { p: 'No baião, os dedos imitam…', o: ['O triângulo', 'O pandeiro', 'O surdo'], c: 0, e: 'Polegar = zabumba, dedos = triângulo.' }
    ]
  },
  {
    id: 'estudar', titulo: 'Como estudar violão', resumo: 'Uma rotina de 10 minutos por dia e como usar o jogo para aprender mais rápido.', video: 'estudar', min: 4,
    secoes: [
      { titulo: 'Pouco e todo dia', html: `<p>10 minutos por dia ensinam mais do que 2 horas só no domingo. A mão aprende pela <b>repetição espaçada</b>: cada noite de sono "grava" o que você treinou.</p>` },
      { titulo: 'Rotina de 10 minutos', visual: 'rotina', html: '<p>Faça nesta ordem. Se tiver mais tempo, repita a música.</p>' },
      { titulo: 'Os três modos do jogo', html: `<ul><li><b>Esperar por mim</b>: a música para em cada acorde e só continua quando você acerta. Use para aprender.</li>
        <li><b>No tempo</b>: a música não para e o microfone dá pontos. Use para testar.</li>
        <li><b>Prática</b>: o app toca junto, sem pontos. Use para sentir a música.</li></ul>` },
      { tipo: 'analogia', html: 'Estudar violão é como academia: a carga sobe aos poucos. Velocidade é a carga. Suba 20% quando ficar fácil.' },
      { tipo: 'pegadinha', html: 'O erro mais comum é querer tocar rápido logo no começo. A mão aprende o movimento errado e depois é difícil desaprender.' },
      { titulo: 'Grave você mesmo', html: '<p>Grave um vídeo tocando uma vez por semana. Ouvir a própria gravação mostra o que melhorar e também o quanto você já evoluiu.</p>' }
    ],
    quiz: [
      { p: 'O que ensina mais?', o: ['2 horas no domingo', '10 minutos por dia', 'Tanto faz'], c: 1, e: 'A repetição espaçada grava o movimento na memória.' },
      { p: 'Qual modo do jogo é melhor para aprender uma música nova?', o: ['No tempo', 'Esperar por mim', 'Prática'], c: 1, e: 'Sem pressa, você acerta cada acorde antes de seguir.' },
      { p: 'Quando subir a velocidade?', o: ['No primeiro dia', 'Quando tirar 3 estrelas', 'Nunca'], c: 1, e: 'Ficou fácil? Suba 20%.' }
    ]
  }
];

/* ---------- Mini vídeos ----------
   Vídeos curtos (30 a 50 s) com narração e legenda, feitos para o app.
   Ficam na pasta videos/. */
const VIDEOS = {
  partes: { titulo: 'As partes do violão', arquivo: 'videos/partes.mp4' },
  cordas: { titulo: 'As 6 cordas', arquivo: 'videos/cordas.mp4' },
  afinar: { titulo: 'Como afinar', arquivo: 'videos/afinar.mp4' },
  postura: { titulo: 'Postura e mãos', arquivo: 'videos/postura.mp4' },
  diagrama: { titulo: 'Como ler um acorde', arquivo: 'videos/diagrama.mp4' },
  batida: { titulo: 'A batida', arquivo: 'videos/batida.mp4' },
  tab: { titulo: 'Como ler tablatura', arquivo: 'videos/tab.mp4' },
  jogo: { titulo: 'Como funciona o jogo', arquivo: 'videos/jogo.mp4' },
  samba: { titulo: 'Ritmos brasileiros', arquivo: 'videos/samba.mp4' },
  estudar: { titulo: 'Como estudar', arquivo: 'videos/estudar.mp4' }
};

function videoHTML(id, { auto = false } = {}) {
  const v = VIDEOS[id];
  if (!v) return '';
  return `<figure class="video"><video src="${v.arquivo}" poster="${v.arquivo.replace('.mp4', '.jpg')}" controls playsinline preload="none" ${auto ? 'autoplay' : ''}></video><figcaption>${esc(v.titulo)}</figcaption></figure>`;
}
function abrirVideo(id) {
  const v = VIDEOS[id];
  if (!v) return;
  abrirJanela(v.titulo, videoHTML(id, { auto: true }));
  $('#janela').classList.add('janela-video');
}

/* ---------- Leitor de apostila ---------- */
function abrirApostila(id) {
  const a = APOSTILAS.find(x => x.id === id);
  if (!a) return;
  const corpo = a.secoes.map(s => {
    if (s.tipo === 'analogia') return `<aside class="ap-caixa analogia"><b>Analogia</b><p>${s.html}</p></aside>`;
    if (s.tipo === 'pegadinha') return `<aside class="ap-caixa pegadinha"><b>Pegadinha</b><p>${s.html}</p></aside>`;
    return `<section class="ap-secao"><h3>${esc(s.titulo)}</h3>${s.visual ? `<div class="ap-visual">${DESENHOS[s.visual]()}</div>` : ''}${s.html}</section>`;
  }).join('');
  abrirJanela(a.titulo, `
    <article class="apostila">
      <p class="ap-resumo">${esc(a.resumo)}</p>
      ${a.video ? videoHTML(a.video) : ''}
      ${corpo}
      <section class="ap-teste"><h3>Teste rápido</h3><div id="ap-quiz"></div></section>
    </article>`);
  $('#janela').classList.add('cheia');
  const raiz = $('#janela-corpo');
  raiz.querySelectorAll('[data-ouvir]').forEach(b => b.addEventListener('click', () => ouvirAcorde(b.dataset.ouvir)));
  raiz.querySelectorAll('[data-ritmo]').forEach(b => b.addEventListener('click', () => ouvirBatida(patternById(b.dataset.ritmo), 2)));
  montarQuiz($('#ap-quiz'), a.quiz, acertos => {
    S.apostilas = S.apostilas || {};
    const antes = S.apostilas[a.id] || 0;
    S.apostilas[a.id] = Math.max(antes, acertos);
    if (!antes) ganharXP(15, 'apostila lida');
    Store.salvar();
  });
}

// Quiz que corrige na hora (uma pergunta por vez)
function montarQuiz(area, perguntas, aoFim) {
  let i = 0, acertos = 0;
  const mostrar = () => {
    if (i >= perguntas.length) {
      area.innerHTML = `<div class="qz-fim"><b>${acertos} de ${perguntas.length}</b><span>${acertos === perguntas.length ? 'Tudo certo!' : 'Releia as partes que ficaram em dúvida.'}</span><button class="btn mini" id="qz-de-novo">Refazer</button></div>`;
      area.querySelector('#qz-de-novo').addEventListener('click', () => { i = 0; acertos = 0; mostrar(); });
      aoFim?.(acertos);
      return;
    }
    const q = perguntas[i];
    area.innerHTML = `<div class="qz"><p class="qz-num">Pergunta ${i + 1} de ${perguntas.length}</p><p class="qz-p">${esc(q.p)}</p>
      <div class="qz-opcoes">${q.o.map((o, k) => `<button class="opcao" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="qz-exp" aria-live="polite"></p></div>`;
    area.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      if (area.querySelector('.opcao[disabled]')) return;
      const ok = +b.dataset.k === q.c;
      if (ok) acertos++;
      area.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (+x.dataset.k === q.c) x.classList.add('certa'); else if (x === b) x.classList.add('errada'); });
      area.querySelector('.qz-exp').innerHTML = `<b>${ok ? 'Isso!' : 'Quase.'}</b> ${esc(q.e)} <button class="btn mini" id="qz-prox">${i + 1 < perguntas.length ? 'Próxima' : 'Ver resultado'}</button>`;
      vibrar(ok ? 12 : [8, 40, 8]);
      area.querySelector('#qz-prox').addEventListener('click', () => { i++; mostrar(); });
    }));
  };
  mostrar();
}
