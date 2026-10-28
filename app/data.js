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
    id: 'quatro', nome: '4 para baixo', genero: 'Iniciante',
    beats: 4, sub: 1, bpm: 66,
    passos: ['D', 'D', 'D', 'D'],
    demo: ['Am7', 'Em7'],
    dica: 'Uma batida para baixo em cada tempo. Conte 1, 2, 3, 4.'
  },
  {
    id: 'baixocima', nome: 'Baixo e cima', genero: 'Iniciante',
    beats: 4, sub: 2, bpm: 60,
    passos: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'],
    demo: ['C', 'Dm7'],
    dica: 'No número, para baixo; no "e", para cima. A mão nunca para.'
  },
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

/* ---------- CURSO ----------
   Inspirado em como os apps de violão para iniciantes ensinam
   (JustinGuitar, Simply Guitar, Yousician):
   - poucos acordes por vez, começando pelos de 1 e 2 dedos;
   - cada acorde ensinado DEDO A DEDO;
   - treino de troca de acordes ("um minuto de trocas");
   - batida simples primeiro (só para baixo), depois para cima;
   - toda unidade termina com uma MÚSICA DE VERDADE que usa só o que você aprendeu.

   Cada lição é uma lista de PASSOS (uma ideia por tela). Tipos de passo:
   texto  { titulo, texto, visual: 'violao' | 'diagrama' | 'maos' }
   acorde { acorde }                 → ensina o acorde dedo a dedo
   quiz   { pergunta, opcoes, certa, explica }
   troca  { a, b }                   → 1 minuto trocando entre dois acordes
   tocar  { titulo, seq, padrao, bpm, ritmo } ou { musica, secao, ritmo }
          ritmo: 'acorde' (1 batida por acorde) | 'tempos' (↓ em cada tempo) | 'batida' (ritmo completo)
   afinar {}                         → afinador embutido
*/
const CURSO = [
  {
    id: 'u1', titulo: 'Comece aqui', resumo: 'Conheça o violão, afine e aprenda a ler um acorde.',
    licoes: [
      { id: 'u1l1', titulo: 'Seu violão', min: 2, passos: [
        { t: 'texto', titulo: 'As 6 cordas', visual: 'violao',
          texto: 'Segure o violão e olhe para baixo. A corda <b>mais grossa</b> é a <b>6ª</b>, a mais fina é a <b>1ª</b>. Da mais grossa para a mais fina, os nomes são <b>Mi, Lá, Ré, Sol, Si, Mi</b> (em inglês: E A D G B E).' },
        { t: 'texto', titulo: 'Casas e trastes', visual: 'casas',
          texto: 'O braço é dividido por ferrinhos chamados <b>trastes</b>. O espaço entre eles é a <b>casa</b>. A casa 1 é a mais perto da cabeça do violão (onde ficam as tarraxas).' },
        { t: 'texto', titulo: 'Os dedos têm número', visual: 'maos',
          texto: 'Na mão que aperta as cordas: <b>1</b> indicador, <b>2</b> médio, <b>3</b> anelar, <b>4</b> mindinho. O polegar fica atrás do braço, como se fosse segurar um copo.' },
        { t: 'quiz', pergunta: 'Qual é a corda mais grossa?', opcoes: ['1ª corda', '6ª corda', '3ª corda'], certa: 1,
          explica: 'A mais grossa é a 6ª (Mi grave). A contagem começa pela mais fina.' },
      ] },
      { id: 'u1l2', titulo: 'Afinar o violão', min: 3, passos: [
        { t: 'texto', titulo: 'Por que afinar?', visual: null,
          texto: 'Violão desafinado deixa até o acorde certo com som errado. Afine <b>sempre</b> antes de tocar: leva 1 minuto.' },
        { t: 'afinar' },
      ] },
      { id: 'u1l3', titulo: 'Como ler um acorde', min: 2, passos: [
        { t: 'texto', titulo: 'O desenho do acorde', visual: 'diagrama',
          texto: 'É como olhar o violão <b>de pé na sua frente</b>. As linhas em pé são as cordas: a da <b>esquerda é a 6ª</b> (mais grossa). As linhas deitadas são os trastes.' },
        { t: 'texto', titulo: 'Bolinhas, O e X', visual: 'diagrama',
          texto: 'A <b>bolinha</b> mostra onde apertar; o <b>número</b> é o dedo. <b>O</b> em cima = corda solta (toca sem apertar). <b>X</b> = não toca essa corda.' },
        { t: 'quiz', pergunta: 'No desenho, um X em cima da corda significa…', opcoes: ['Apertar com o dedo 1', 'Não tocar essa corda', 'Tocar mais forte'], certa: 1,
          explica: 'X = essa corda fica de fora da batida.' },
      ] },
    ]
  },
  {
    id: 'u2', titulo: 'Seus primeiros acordes', resumo: 'Em7, Am7 e Bm7, e você já toca Taj Mahal.', musica: 'taj-mahal',
    licoes: [
      { id: 'u2l1', titulo: 'Em7: 1 dedo só', min: 3, passos: [
        { t: 'texto', titulo: 'O acorde mais fácil', visual: null,
          texto: 'O <b>Em7</b> (Mi menor com sétima) usa <b>um dedo só</b>. Ele aparece em muita música brasileira. Aperte com a <b>ponta</b> do dedo, logo atrás do traste.' },
        { t: 'acorde', acorde: 'Em7' },
        { t: 'tocar', titulo: 'Toque junto: Em7', seq: 'Em7:16', padrao: 'quatro', bpm: 60, ritmo: 'tempos' },
      ] },
      { id: 'u2l2', titulo: 'Am7: 2 dedos', min: 3, passos: [
        { t: 'acorde', acorde: 'Am7' },
        { t: 'texto', titulo: 'Cuidado com a 6ª corda', visual: null,
          texto: 'No Am7 a 6ª corda tem um <b>X</b>: comece a batida pela <b>5ª corda</b>. Se bater na 6ª sem querer, tudo bem no começo: com o tempo a mão aprende.' },
        { t: 'tocar', titulo: 'Toque junto: Am7', seq: 'Am7:16', padrao: 'quatro', bpm: 60, ritmo: 'tempos' },
      ] },
      { id: 'u2l3', titulo: 'Trocar Am7 ↔ Em7', min: 3, passos: [
        { t: 'texto', titulo: 'O segredo da troca', visual: null,
          texto: 'Trocar de acorde no tempo é o que faz soar como música. Truque: <b>levante todos os dedos juntos</b> e pouse todos juntos no acorde novo, em vez de um por um.' },
        { t: 'troca', a: 'Am7', b: 'Em7' },
        { t: 'tocar', titulo: 'Agora no tempo', seq: 'Am7:4 Em7:4 Am7:4 Em7:4 Am7:4 Em7:4', padrao: 'quatro', bpm: 60, ritmo: 'tempos' },
      ] },
      { id: 'u2l4', titulo: 'Bm7: 3 dedos', min: 3, passos: [
        { t: 'acorde', acorde: 'Bm7' },
        { t: 'troca', a: 'Am7', b: 'Bm7' },
      ] },
      { id: 'u2l5', titulo: 'Batida: ↓ ↓ ↓ ↓', min: 3, passos: [
        { t: 'texto', titulo: 'Contando até 4', visual: 'batida',
          texto: 'A batida mais simples: <b>4 batidas para baixo</b>, uma em cada tempo. Conte em voz alta <b>"1, 2, 3, 4"</b> e bata junto. Mão relaxada, como quem sacode água da mão.' },
        { t: 'tocar', titulo: 'Batida com Am7, Bm7 e Em7', seq: 'Am7:4 Bm7:4 Em7:8 Am7:4 Bm7:4 Em7:8', padrao: 'quatro', bpm: 66, ritmo: 'tempos' },
      ] },
      { id: 'u2l6', titulo: 'Música: Taj Mahal', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'Você já consegue!', visual: null,
          texto: '<b>Taj Mahal</b>, do Jorge Ben Jor, usa exatamente <b>Am7, Bm7 e Em</b>. Com <b>capotraste na 2ª casa</b>, soa igual à gravação. Sem capo, também dá para treinar.' },
        { t: 'tocar', musica: 'taj-mahal', secao: 0, ritmo: 'tempos' },
      ] },
    ]
  },
  {
    id: 'u3', titulo: 'C e Dm7', resumo: 'Dois acordes novos para tocar Magnólia.', musica: 'magnolia',
    licoes: [
      { id: 'u3l1', titulo: 'C (Dó maior)', min: 3, passos: [
        { t: 'acorde', acorde: 'C' },
        { t: 'texto', titulo: 'Dedos "em escada"', visual: null,
          texto: 'No C os dedos 3, 2 e 1 ficam em <b>escada</b>, cada um numa casa. Deixe os dedos <b>arqueados</b> para não abafar a 1ª corda solta.' },
        { t: 'tocar', titulo: 'Toque junto: C', seq: 'C:16', padrao: 'quatro', bpm: 60, ritmo: 'tempos' },
      ] },
      { id: 'u3l2', titulo: 'Dm7', min: 3, passos: [
        { t: 'acorde', acorde: 'Dm7' },
        { t: 'troca', a: 'C', b: 'Dm7' },
      ] },
      { id: 'u3l3', titulo: 'Batida com "para cima"', min: 4, passos: [
        { t: 'texto', titulo: '↓ e ↑', visual: 'batida2',
          texto: 'Agora a mão volta <b>para cima</b> entre os tempos. Conte <b>"1 e 2 e 3 e 4 e"</b>: no número, para baixo ↓; no "e", para cima ↑. Na subida, pegue só as cordas mais finas.' },
        { t: 'tocar', titulo: 'Treino: C e Dm7', seq: 'C:4 Dm7:4 C:4 Dm7:4', padrao: 'baixocima', bpm: 60, ritmo: 'batida' },
      ] },
      { id: 'u3l4', titulo: 'Música: Magnólia', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'C, Dm7 e Em7', visual: null,
          texto: '<b>Magnólia</b> gira em <b>C → Dm7 → Em7 → Dm7</b>. Você já sabe os três! Com <b>capo na 2ª casa</b>, soa igual à gravação.' },
        { t: 'tocar', musica: 'magnolia', secao: 0, ritmo: 'tempos' },
      ] },
    ]
  },
  {
    id: 'u4', titulo: 'Acordes com sétima', resumo: 'G7, C7 e D7 para tocar País Tropical.', musica: 'pais-tropical',
    licoes: [
      { id: 'u4l1', titulo: 'G7', min: 3, passos: [{ t: 'acorde', acorde: 'G7' }, { t: 'troca', a: 'G7', b: 'C' }] },
      { id: 'u4l2', titulo: 'C7', min: 3, passos: [
        { t: 'texto', titulo: 'C7 é o C + 1 dedo', visual: null, texto: 'Faça o <b>C</b> e acrescente o <b>dedo 4 (mindinho)</b> na 3ª casa da 3ª corda. Pronto: <b>C7</b>.' },
        { t: 'acorde', acorde: 'C7' }, { t: 'troca', a: 'G7', b: 'C7' }] },
      { id: 'u4l3', titulo: 'D7', min: 3, passos: [{ t: 'acorde', acorde: 'D7' }, { t: 'troca', a: 'C7', b: 'D7' }] },
      { id: 'u4l4', titulo: 'Música: País Tropical', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'G7 – C7 – D7', visual: null, texto: 'A ponte de <b>País Tropical</b> é <b>G7, C7, D7</b>. Comece só por ela; depois tente a música inteira.' },
        { t: 'tocar', musica: 'pais-tropical', secao: 0, ritmo: 'tempos' },
      ] },
    ]
  },
  {
    id: 'u5', titulo: 'Bossa: Chove Chuva', resumo: 'A7 e E7, e a batida da bossa nova.', musica: 'chove-chuva',
    licoes: [
      { id: 'u5l1', titulo: 'A7', min: 3, passos: [{ t: 'acorde', acorde: 'A7' }, { t: 'troca', a: 'A7', b: 'Dm7' }] },
      { id: 'u5l2', titulo: 'E7', min: 3, passos: [{ t: 'acorde', acorde: 'E7' }, { t: 'troca', a: 'E7', b: 'Am7' }] },
      { id: 'u5l3', titulo: 'Música: Chove Chuva', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'Versão fácil', visual: null, texto: 'Na versão fácil, o <b>D7(9)</b> vira <b>D7</b> e o <b>E7(9)</b> vira <b>E7</b>: o app troca sozinho quando "Acordes fáceis" está ligado.' },
        { t: 'tocar', musica: 'chove-chuva', secao: 0, ritmo: 'tempos' },
      ] },
    ]
  },
  {
    id: 'u6', titulo: 'Acordes maiores básicos', resumo: 'G, D, A, E e Am: os mais usados em qualquer música.',
    licoes: [
      { id: 'u6l1', titulo: 'G', min: 3, passos: [{ t: 'acorde', acorde: 'G' }, { t: 'troca', a: 'G', b: 'C' }] },
      { id: 'u6l2', titulo: 'D', min: 3, passos: [{ t: 'acorde', acorde: 'D' }, { t: 'troca', a: 'D', b: 'G' }] },
      { id: 'u6l3', titulo: 'A e E', min: 4, passos: [{ t: 'acorde', acorde: 'A' }, { t: 'acorde', acorde: 'E' }, { t: 'troca', a: 'A', b: 'E' }] },
      { id: 'u6l4', titulo: 'Am e Em', min: 3, passos: [{ t: 'acorde', acorde: 'Am' }, { t: 'acorde', acorde: 'Em' }, { t: 'troca', a: 'Am', b: 'Em' }] },
    ]
  },
];
// Lista "achatada" (o resto do app usa)
const LESSONS = CURSO.flatMap(u => u.licoes.map(l => ({ ...l, mod: u.id })));
const MODULES = CURSO.map(u => ({ id: u.id, nome: u.titulo }));

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
