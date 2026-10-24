/* =========================================================
   TOCA AÍ — data.js
   Aqui fica só o CONTEÚDO do app (acordes, lições, ritmos).
   A lógica fica no app.js. Separar dados de lógica deixa o
   código mais fácil de manter: para criar uma lição nova,
   você só mexe neste arquivo.
   ========================================================= */

/* ---------- ACORDES ----------
   frets:   casa apertada em cada corda, da 6ª (Mi grave) até a 1ª (Mi agudo)
            -1 = não tocar a corda | 0 = corda solta
   fingers: dedo da mão esquerda em cada corda (1 indicador ... 4 mindinho)
   barre:   casa da pestana (quando o dedo 1 deita sobre várias cordas)
*/
const CHORDS = [
  { id: 'C',   frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { id: 'D',   frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { id: 'E',   frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { id: 'G',   frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { id: 'A',   frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { id: 'Am',  frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { id: 'Dm',  frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  { id: 'Em',  frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { id: 'A7',  frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { id: 'B7',  frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  { id: 'C7',  frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { id: 'D7',  frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { id: 'E7',  frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { id: 'G7',  frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  { id: 'Am7', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  { id: 'Dm7', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  { id: 'Em7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  { id: 'Bm7', frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  { id: 'C7M', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { id: 'F7M', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  { id: 'D7M', frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  { id: 'Eb7M', frets: [-1, -1, 1, 3, 3, 3], fingers: [0, 0, 1, 3, 3, 3] },   // dedo 3 deitado nas 3 cordas finas
  { id: 'G7M', frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  { id: 'E7(9)', frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
  { id: 'D7(9)', frets: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] },
  { id: 'F#m7', frets: [-1, -1, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1], barre: 2 }, // pestana pequena
  { id: 'F',   frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  { id: 'Bb',  frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: 1 },
  { id: 'Bm',  frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },
  { id: 'F#m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: 2 },
  { id: 'Gm',  frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },
  { id: 'Cm',  frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: 3 },
];

/* ---------- RITMOS (BATIDAS) ----------
   Cada batida é uma lista de "passos". sub = passos por tempo.
   Símbolos:
     D = palhetada para baixo (↓)      U = para cima (↑)
     B = polegar no baixo (o "surdo")  F = dedos puxam as cordas agudas juntas
     X = polegar + dedos ao mesmo tempo
     p i m a = dedilhado (polegar, indicador, médio, anelar)
     - = pausa (não toca)
*/
const PATTERNS = [
  {
    id: 'pop', nome: 'Batida básica', genero: 'Pop / balada',
    beats: 4, sub: 2, bpm: 80,
    passos: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'],
    demo: ['G', 'D', 'Em', 'C'],
    dica: 'A mão direita nunca para: ela sobe e desce o tempo todo, como um pêndulo. Nas pausas ela só passa sem encostar nas cordas.'
  },
  {
    id: 'baiao', nome: 'Baião', genero: 'Baião / forró',
    beats: 2, sub: 4, bpm: 90,
    passos: ['B', '-', '-', 'B', 'F', '-', 'F', '-'],
    demo: ['G', 'C', 'D7', 'G'],
    dica: 'O polegar imita a zabumba: "tum... tum". Os dedos respondem como o triângulo.'
  },
  {
    id: 'samba', nome: 'Samba', genero: 'Samba',
    beats: 2, sub: 4, bpm: 85,
    passos: ['B', 'F', '-', 'F', 'B', '-', 'F', '-'],
    demo: ['Am', 'Dm', 'E7', 'Am'],
    dica: 'O polegar é o surdo: marca os 2 tempos sem falhar. Os dedos são o tamborim, sempre fora do tempo forte.'
  },
  {
    id: 'pagode', nome: 'Pagode', genero: 'Pagode',
    beats: 2, sub: 4, bpm: 85,
    passos: ['B', '-', 'F', 'F', 'B', 'F', '-', 'F'],
    demo: ['C', 'A7', 'Dm', 'G7'],
    dica: 'Mesma base do samba, mas os dedos ficam mais "cheios". Solte o pulso e deixe o polegar firme.'
  },
  {
    id: 'bossa', nome: 'Bossa nova', genero: 'Bossa nova',
    beats: 4, sub: 4, bpm: 70,
    passos: ['X', '-', '-', 'F', 'B', '-', 'F', '-', 'B', '-', 'F', '-', 'B', 'F', '-', '-'],
    demo: ['Dm7', 'G7', 'C7M', 'C7M'],
    dica: 'Polegar regular como um relógio em todos os tempos. Os dedos fazem a "síncope": entram antes ou depois do polegar, quase nunca junto.'
  },
  {
    id: 'sambarock', nome: 'Samba-rock', genero: 'Samba-rock',
    beats: 4, sub: 4, bpm: 104,
    passos: ['D', '-', 'U', 'D', '-', 'U', 'D', 'U', '-', 'U', 'D', '-', 'U', 'D', 'U', '-'],
    demo: ['C', 'Dm7', 'Em7', 'Dm7'],
    dica: 'A batida do Jorge Ben: mão direita solta, acentos fora do tempo e muito "balanço". Mantenha o pulso girando sem parar.'
  },
  {
    id: 'dedilhado', nome: 'Dedilhado MPB', genero: 'MPB',
    beats: 4, sub: 2, bpm: 70,
    passos: ['p', 'i', 'm', 'a', 'm', 'i', 'm', 'i'],
    demo: ['Am', 'C', 'G', 'D'],
    dica: 'Cada dedo cuida de uma corda: polegar no baixo, indicador na 3ª, médio na 2ª, anelar na 1ª. Não olhe para a mão direita.'
  },
];

/* ---------- TRILHA DE LIÇÕES ----------
   pratica.tipo: 'trocas' | 'batida' | 'quiz' | 'afinador' | 'metronomo' | 'musicas'
*/
const MODULES = [
  { id: 'm1', nome: 'Primeiros passos' },
  { id: 'm2', nome: 'Acordes abertos' },
  { id: 'm3', nome: 'Ritmos brasileiros' },
  { id: 'm4', nome: 'Subindo de nível' },
];

const LESSONS = [
  {
    id: 'l1', mod: 'm1', titulo: 'Conhecendo o violão', xp: 20,
    corpo: `
      <p>O violão tem <b>6 cordas</b>. A numeração começa pela mais <b>fina</b> (1ª) e termina na mais <b>grossa</b> (6ª).</p>
      <p>Afinação padrão, da 6ª para a 1ª: <span class="mono">E A D G B E</span> (Mi, Lá, Ré, Sol, Si, Mi).</p>
      <p><b>Cifra</b> é o "apelido" das notas: A = Lá, B = Si, C = Dó, D = Ré, E = Mi, F = Fá, G = Sol. Um <span class="mono">m</span> depois da letra quer dizer <b>menor</b> (Am = Lá menor).</p>
      <p>Dedos da mão esquerda: 1 indicador, 2 médio, 3 anelar, 4 mindinho. Na direita: p polegar, i indicador, m médio, a anelar.</p>
      <div class="box analogia"><b>Analogia:</b> as casas do braço são como os andares de um prédio. Quanto mais perto do corpo do violão, mais aguda a nota.</div>
      <div class="box pegadinha"><b>Pegadinha:</b> a 1ª corda fica embaixo quando você segura o violão, mesmo sendo a "primeira".</div>`,
    pratica: { tipo: 'quiz' }
  },
  {
    id: 'l2', mod: 'm1', titulo: 'Afinando o violão', xp: 20,
    corpo: `
      <p>Violão desafinado faz até o acorde certo soar errado. Afine <b>toda vez</b> antes de treinar.</p>
      <p>No afinador do app, toque o som de referência de cada corda e gire a tarraxa até as duas notas soarem iguais. Se o som "ondular" (uaa-uaa), ainda está diferente.</p>
      <div class="box analogia"><b>Analogia:</b> afinar é como sintonizar rádio antigo. Quando chega na estação, o chiado some.</div>
      <div class="box pegadinha"><b>Pegadinha:</b> corda nova de náilon estica por alguns dias e desafina rápido. Isso é normal.</div>`,
    pratica: { tipo: 'afinador' }
  },
  {
    id: 'l3', mod: 'm1', titulo: 'Primeiros acordes: Em e Am', xp: 30,
    corpo: `
      <p>Estes são os dois acordes mais fáceis. Repare que o <b>formato dos dedos</b> é parecido: no Am você só "desce" os dedos uma corda e acrescenta o indicador.</p>
      <p>Aperte com a <b>ponta</b> dos dedos, logo atrás do traste (o ferrinho), não no meio da casa.</p>
      <div class="box analogia"><b>Analogia:</b> apertar a corda é como apertar um botão de elevador. Ponta firme, sem amassar o vizinho.</div>
      <div class="box pegadinha"><b>Pegadinha:</b> no Am a 6ª corda não toca (o X no desenho). Comece a palhetada pela 5ª.</div>`,
    acordes: ['Em', 'Am'],
    pratica: { tipo: 'trocas', a: 'Em', b: 'Am' }
  },
  {
    id: 'l4', mod: 'm1', titulo: 'A batida básica', xp: 30,
    corpo: `
      <p>Ritmo é mais importante que acorde. Um acorde "sujo" no tempo certo soa melhor que um acorde perfeito fora do tempo.</p>
      <p>A batida básica é <span class="mono">↓ · ↓↑ · ↑ ↓↑</span>. Conte em voz alta: <i>"um, dois-e, e-quatro-e"</i>.</p>
      <div class="box analogia"><b>Analogia:</b> a mão direita é um limpador de para-brisa. Ela vai e volta sempre, mesmo quando não encosta.</div>`,
    padrao: 'pop',
    pratica: { tipo: 'batida', padrao: 'pop' }
  },
  {
    id: 'l5', mod: 'm2', titulo: 'C e G', xp: 30,
    corpo: `
      <p>Dó e Sol aparecem em quase toda música brasileira. O C pede um "esticão" dos dedos; o G usa as cordas das pontas.</p>
      <p>Treine trocando devagar. Velocidade vem depois da precisão.</p>
      <div class="box pegadinha"><b>Pegadinha:</b> no C a 6ª corda não toca. Se o som ficar embolado, você está batendo nela.</div>`,
    acordes: ['C', 'G'],
    pratica: { tipo: 'trocas', a: 'C', b: 'G' }
  },
  {
    id: 'l6', mod: 'm2', titulo: 'D e A', xp: 30,
    corpo: `
      <p>O D tem formato de triângulo e só usa as 4 cordas finas. O A coloca três dedos lado a lado na 2ª casa.</p>
      <div class="box analogia"><b>Analogia:</b> no A os dedos ficam "espremidos no ônibus lotado". Se não couber, incline um pouco o pulso.</div>`,
    acordes: ['D', 'A'],
    pratica: { tipo: 'trocas', a: 'D', b: 'A' }
  },
  {
    id: 'l7', mod: 'm2', titulo: 'Acordes com sétima: E7, A7, D7', xp: 35,
    corpo: `
      <p>O <span class="mono">7</span> deixa o acorde com sensação de "quero voltar para casa". Por isso ele aparece logo antes do acorde principal da música.</p>
      <p>No samba, o <span class="mono">E7</span> chama o <span class="mono">Am</span>; no baião, o <span class="mono">D7</span> chama o <span class="mono">G</span>.</p>
      <div class="box analogia"><b>Analogia:</b> o acorde com 7 é a vírgula; o acorde principal é o ponto final.</div>`,
    acordes: ['E7', 'A7', 'D7'],
    pratica: { tipo: 'trocas', a: 'Am', b: 'E7' }
  },
  {
    id: 'l8', mod: 'm2', titulo: 'Sua primeira sequência', xp: 35,
    corpo: `
      <p>Duas sequências que abrem centenas de músicas:</p>
      <p><b>Baião em Sol:</b> <span class="mono">G – C – D7 – G</span></p>
      <p><b>Samba em Lá menor:</b> <span class="mono">Am – Dm – E7 – Am</span></p>
      <p>Toque cada acorde por 4 tempos no metrônomo a 60 BPM. Só aumente quando trocar sem parar.</p>
      <div class="box pegadinha"><b>Pegadinha:</b> não espere o acorde ficar perfeito para trocar. Troque no tempo, mesmo errando. O dedo aprende com a repetição.</div>`,
    acordes: ['G', 'C', 'D7', 'Am', 'Dm', 'E7'],
    pratica: { tipo: 'metronomo' }
  },
  {
    id: 'l9', mod: 'm3', titulo: 'Baião', xp: 40,
    corpo: `
      <p>Ritmo nordestino de Luiz Gonzaga. Compasso de 2 tempos. O polegar faz o "tum" da zabumba e os dedos respondem.</p>
      <p>Comece com <span class="mono">G – C – D7 – G</span>.</p>`,
    padrao: 'baiao', acordes: ['G', 'C', 'D7'],
    pratica: { tipo: 'batida', padrao: 'baiao' }
  },
  {
    id: 'l10', mod: 'm3', titulo: 'Samba', xp: 40,
    corpo: `
      <p>O samba também tem 2 tempos por compasso. O segredo é <b>separar as mãos em duas funções</b>: polegar = surdo (tempo), dedos = tamborim (balanço).</p>
      <p>Treine primeiro só o polegar até ficar automático. Depois coloque os dedos.</p>
      <div class="box analogia"><b>Analogia:</b> é como andar e mascar chiclete. Parece impossível no começo, depois você nem pensa.</div>`,
    padrao: 'samba', acordes: ['Am', 'Dm', 'E7'],
    pratica: { tipo: 'batida', padrao: 'samba' }
  },
  {
    id: 'l11', mod: 'm3', titulo: 'Pagode', xp: 40,
    corpo: `
      <p>O pagode nasceu do samba de roda e usa a mesma base, com os dedos mais presentes. Progressão típica: <span class="mono">C – A7 – Dm – G7</span>.</p>
      <div class="box pegadinha"><b>Pegadinha:</b> o polegar acelera sozinho quando você empolga. Use o metrônomo.</div>`,
    padrao: 'pagode', acordes: ['C', 'A7', 'Dm', 'G7'],
    pratica: { tipo: 'batida', padrao: 'pagode' }
  },
  {
    id: 'l12', mod: 'm3', titulo: 'Bossa nova', xp: 45,
    corpo: `
      <p>Criada no Rio no fim dos anos 50. Usa acordes com sétima maior (<span class="mono">7M</span>), que soam "suaves".</p>
      <p>Sequência clássica: <span class="mono">Dm7 – G7 – C7M</span>. Na cifra brasileira escrevemos <span class="mono">7M</span>; em cifra gringa aparece <span class="mono">maj7</span>.</p>
      <div class="box analogia"><b>Analogia:</b> o polegar é o tique-taque do relógio; os dedos conversam por cima dele.</div>`,
    padrao: 'bossa', acordes: ['Dm7', 'G7', 'C7M'],
    pratica: { tipo: 'batida', padrao: 'bossa' }
  },
  {
    id: 'l13', mod: 'm3', titulo: 'Dedilhado MPB', xp: 45,
    corpo: `
      <p>Em vez de bater nas cordas, cada dedo toca uma corda. Muito usado em MPB e baladas.</p>
      <p>Regra: polegar no baixo do acorde (a corda mais grave que toca), <b>i</b> na 3ª, <b>m</b> na 2ª, <b>a</b> na 1ª.</p>`,
    padrao: 'dedilhado', acordes: ['Am', 'C', 'G', 'D'],
    pratica: { tipo: 'batida', padrao: 'dedilhado' }
  },
  {
    id: 'l14', mod: 'm4', titulo: 'Primeira pestana: F e Bm', xp: 50,
    corpo: `
      <p>Pestana é quando o indicador deita sobre várias cordas. Dói no começo, e tudo bem.</p>
      <p>Use o <b>lado</b> do indicador (mais ossudo), puxe o braço do violão com o peso do braço, não com força do polegar.</p>
      <div class="box pegadinha"><b>Pegadinha:</b> enquanto a pestana não sai, toque o F "pequeno" (F7M no app). Ninguém precisa sofrer no 1º mês.</div>`,
    acordes: ['F', 'Bm', 'F7M'],
    pratica: { tipo: 'trocas', a: 'C', b: 'F' }
  },
  {
    id: 'l15', mod: 'm4', titulo: 'Tirando música pela cifra', xp: 50,
    corpo: `
      <p>Agora é com você. Escolha uma música que você gosta, procure a cifra e cadastre <b>só os acordes, na ordem</b> na aba Músicas.</p>
      <p>O app toca o metrônomo e mostra o próximo acorde no tempo certo, para você tocar junto.</p>
      <div class="box pegadinha"><b>Pegadinha:</b> se a música tiver acorde difícil, procure a versão "simplificada" da cifra ou use um acorde parecido (ex.: F7M no lugar de F).</div>`,
    pratica: { tipo: 'musicas' }
  },
];

/* ---------- CATÁLOGO DE MÚSICAS ----------
   Só a sequência de ACORDES (sem letra, por direitos autorais).
   Arranjos SIMPLIFICADOS para estudo, baseados nas cifras da fonte.

   seq: "Acorde:tempos" separados por espaço. Tempos = batidas de
        semínima (no 4/4, 4 tempos = 1 compasso).
   capo: casa do capotraste. Com capo, os desenhos são os da mão,
         e o som sai mais agudo (é assim que fica igual à gravação).
   bpm: aproximado. Use Lento/Médio/Rápido no jogo.
   youtube: ID do vídeo oficial (canal "Jorge Ben Jor - Topic", publicado pela
            gravadora). O app toca pelo player do YouTube, sem copiar o áudio. */
const CATALOGO = [
  {
    id: 'magnolia', youtube: 'NE0FAmjSE_8', youtubeCanal: 'Jorge Ben Jor - Topic', titulo: 'Magnólia', artista: 'Jorge Ben Jor', genero: 'Samba-rock', padrao: 'sambarock',
    bpm: 104, capo: 2, tom: 'D',
    original: 'No tom original: D – Em7 – F#m7 – Em7. Com capo na 2ª casa você toca C – Dm7 – Em7 – Dm7 e soa igual.',
    nota: 'Versão fácil: no original aparecem Gm e Fm (pestana), trocados aqui pelos vizinhos abertos.',
    secoes: [
      { nome: 'Refrão', seq: 'C:4 Dm7:4 Em7:4 Dm7:4', repetir: 3 },
      { nome: 'Parte', seq: 'Dm7:4 Em7:4 Dm7:4 Em7:4', repetir: 2 },
      { nome: 'Refrão final', seq: 'C:4 Dm7:4 Em7:4 Dm7:4', repetir: 2 },
    ],
    fonte: 'https://www.recifra.com/jorge-ben-jor/magnolia/'
  },
  {
    id: 'amante-amado', youtube: 'gASmm3bqWow', youtubeCanal: 'Jorge Ben Jor - Topic', titulo: 'Amante Amado', artista: 'Jorge Ben Jor', genero: 'Samba-rock', padrao: 'sambarock',
    bpm: 112, capo: 0, tom: 'D',
    original: 'A marca da música é a descida E7(9) → Eb7M → D7M. Repare: o Eb7M e o D7M são o MESMO desenho, só uma casa abaixo.',
    nota: 'O F#m7 aqui é uma pestana pequena só nas 4 cordas finas.',
    secoes: [
      { nome: 'Introdução', seq: 'E7(9):4 Eb7M:4 D7M:8', repetir: 1 },
      { nome: 'Parte A', seq: 'E7(9):4 Eb7M:4 D7M:8', repetir: 2 },
      { nome: 'Parte B', seq: 'G7M:4 F#m7:4 Em7:4 A7:4 D7M:4 G7M:4 F#m7:4 Em7:4 C:4 A7:4 D7M:8', repetir: 1 },
      { nome: 'Refrão', seq: 'E7(9):4 Eb7M:4 D7M:8', repetir: 4 },
    ],
    fonte: 'https://www.recifra.com/jorge-ben-jor/amante-amado/'
  },
  {
    id: 'taj-mahal', youtube: 'c8AuG1W59ig', youtubeCanal: 'Jorge Ben Jor - Topic', titulo: 'Taj Mahal', artista: 'Jorge Ben Jor', genero: 'Samba-rock', padrao: 'sambarock',
    bpm: 116, capo: 2, tom: 'F#m',
    original: 'No tom original: Bm7 – C#m7 – F#m (tudo com pestana). Com capo na 2ª casa vira Am7 – Bm7 – Em, todos abertos.',
    nota: 'Os dois primeiros acordes duram meio compasso cada: troca rápida!',
    secoes: [
      { nome: 'Primeira parte', seq: 'Am7:2 Bm7:2 Em:4', repetir: 4 },
      { nome: 'Refrão', seq: 'Am7:2 Bm7:2 Em:4', repetir: 4 },
      { nome: 'Segunda parte', seq: 'Am7:2 D7(9):2 Em:4 Am7:2 D7(9):2 Em:4 Am7:2 D7(9):2 Em:4 Am7:2 Bm7:2 Em:4', repetir: 1 },
    ],
    fonte: 'https://www.recifra.com/jorge-ben-jor/taj-mahal/'
  },
  {
    id: 'pais-tropical', youtube: 'cgxDgzH8ino', youtubeCanal: 'Jorge Ben Jor - Topic', titulo: 'País Tropical', artista: 'Jorge Ben Jor', genero: 'Samba-rock', padrao: 'sambarock',
    bpm: 120, capo: 0, tom: 'Em',
    original: 'Só acordes abertos: Em7, D, C, D7, G7 e C7.',
    nota: 'Durações aproximadas: escute a gravação e ajuste no seu repertório se quiser.',
    secoes: [
      { nome: 'Ponte', seq: 'G7:2 C7:2 D7:4', repetir: 4 },
      { nome: 'Refrão', seq: 'Em7:2 D:1 C:1 D7:4', repetir: 4 },
      { nome: 'Segunda parte', seq: 'C7:4 G7:4 C7:4 G7:4 C7:4 D7:4', repetir: 2 },
      { nome: 'Final', seq: 'C7:4 D7:4 G7:8', repetir: 1 },
    ],
    fonte: 'https://www.recifra.com/jorge-ben-jor/pais-tropical/'
  },
  {
    id: 'chove-chuva', youtube: 'QNBO7wIU3yI', youtubeCanal: 'Jorge Ben Jor - Topic', titulo: 'Chove Chuva', artista: 'Jorge Ben Jor', genero: 'Samba-bossa', padrao: 'bossa',
    bpm: 96, capo: 0, tom: 'Am',
    original: 'Acordes com sétima e nona, bem bossa nova. O D7(9) é o D7 com o dedo 3 tirado da 1ª corda.',
    nota: 'Arranjo simplificado; o Cm7 opcional da introdução foi omitido.',
    secoes: [
      { nome: 'Introdução', seq: 'Am7:4 Dm7:4 Am7:4 Dm7:4', repetir: 1 },
      { nome: 'Parte A', seq: 'A7:4 Dm7:4 G7:4 Am7:2 D7(9):2', repetir: 2 },
      { nome: 'Parte B', seq: 'D7(9):4 G7:4 Am7:2 D7(9):2 Dm7:4 G7:4 Am7:2 D7(9):2 E7(9):4 Am7:4', repetir: 1 },
    ],
    fonte: 'https://www.recifra.com/jorge-ben-jor/chove-chuva/'
  },
];

/* ---------- MISSÕES DIÁRIAS ----------
   metrica: o que é contado no dia | alvo: quanto precisa */
const MISSOES = [
  { id: 'licao', texto: 'Conclua 1 lição da trilha', metrica: 'licoes', alvo: 1, xp: 30 },
  { id: 'trocas', texto: 'Faça 20 trocas de acorde', metrica: 'trocas', alvo: 20, xp: 25 },
  { id: 'quiz', texto: 'Acerte 7 acordes no quiz', metrica: 'quiz', alvo: 7, xp: 20 },
  { id: 'batida', texto: 'Tire 70% ou mais no jogo da Batida', metrica: 'batida', alvo: 70, xp: 30 },
  { id: 'minutos', texto: 'Treine 10 minutos', metrica: 'min', alvo: 10, xp: 25 },
  { id: 'musica', texto: 'Toque 1 música do repertório até o fim', metrica: 'musicas', alvo: 1, xp: 30 },
];

const TITULOS = ['Calouro', 'Aprendiz', 'Batuqueiro', 'Seresteiro', 'Partideiro', 'Bamba', 'Mestre da roda'];
