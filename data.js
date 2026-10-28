/* =========================================================
   TOCA AÍ — data.js
   Aqui fica só o CONTEÚDO do app: acordes, ritmos, curso,
   melodias e músicas. A lógica fica nos outros arquivos.
   Separar dados de lógica deixa o código fácil de manter:
   para criar uma lição nova, você só mexe aqui.
   ========================================================= */
'use strict';

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
  // Acordes "com nona" muito usados nas cifras brasileiras (mais fáceis que o acorde comum!)
  { id: 'A9',  frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  { id: 'D9',  frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  { id: 'C9',  frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  { id: 'Em9', frets: [0, 2, 0, 0, 0, 2], fingers: [0, 1, 0, 0, 0, 2] },
];

/* ---------- RITMOS (batidas da mão direita) ----------
   passos: um símbolo por subdivisão do tempo
   D para baixo, U para cima, B polegar no baixo, F dedos juntos,
   X polegar + dedos, p/i/m/a um dedo, - pausa (a mão passa sem tocar) */
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
   Unidades curtas, um acorde novo de cada vez, sempre terminando
   numa música de verdade que usa só o que você aprendeu
   (o método do JustinGuitar e do Simply Guitar).
   Tipos de passo:
     texto   explicação curta (visual = desenho das apostilas)
     video   mini vídeo
     acorde  ensina um acorde dedo a dedo
     troca   1 minuto de trocas entre dois acordes
     quiz    pergunta que corrige na hora
     afinar  mini afinador
     tocar   o jogo (seq = sequência curta, ou musica = id do catálogo)
     notas   o jogo com notas soltas (melodia = id de MELODIAS) */
const CURSO = [
  {
    id: 'u1', titulo: 'Conhecendo o violão', resumo: 'As partes, as cordas, a afinação e as primeiras notas.',
    licoes: [
      { id: 'u1l1', titulo: 'As partes do violão', min: 3, passos: [
        { t: 'video', video: 'partes' },
        { t: 'texto', titulo: 'Cabeça, braço e caixa', visual: 'partes',
          texto: 'As <b>tarraxas</b> da cabeça afinam as cordas. No <b>braço</b> a mão esquerda aperta as cordas nas <b>casas</b>. A <b>caixa</b> é oca: ela faz o som ficar forte.' },
        { t: 'quiz', pergunta: 'Para que servem as tarraxas?', opcoes: ['Para afinar', 'Para aumentar o volume', 'Para trocar de acorde'], certa: 0,
          explica: 'Elas esticam ou afrouxam a corda. É assim que se afina.' }
      ] },
      { id: 'u1l2', titulo: 'As 6 cordas', min: 2, passos: [
        { t: 'texto', titulo: 'Da mais grossa para a mais fina', visual: 'cordas',
          texto: 'A corda <b>mais grossa</b> é a <b>6ª</b> e a mais fina é a <b>1ª</b>. Os nomes, da grossa para a fina: <b>Mi, Lá, Ré, Sol, Si, Mi</b> (E A D G B E). Para decorar: <b>E</b>u <b>A</b>mo <b>D</b>oce <b>d</b>e <b>G</b>oiaba, <b>B</b>em <b>E</b>scuro.' },
        { t: 'quiz', pergunta: 'Qual é a corda mais grossa?', opcoes: ['A 1ª', 'A 6ª', 'A 3ª'], certa: 1,
          explica: 'A contagem começa pela mais fina, então a mais grossa é a 6ª (Mi grave).' }
      ] },
      { id: 'u1l3', titulo: 'Afinar o violão', min: 3, passos: [
        { t: 'video', video: 'afinar' },
        { t: 'texto', titulo: 'Sempre antes de tocar', visual: null,
          texto: 'Violão desafinado faz até o acorde certo soar errado. Toque uma corda solta e olhe o ponteiro: para a <b>esquerda</b> está grave (aperte a tarraxa), para a <b>direita</b> está agudo (afrouxe).' },
        { t: 'afinar' }
      ] },
      { id: 'u1l4', titulo: 'Postura e mãos', min: 3, passos: [
        { t: 'video', video: 'postura' },
        { t: 'texto', titulo: 'Os dedos têm número', visual: 'dedos',
          texto: 'Na mão que aperta as cordas: <b>1</b> indicador, <b>2</b> médio, <b>3</b> anelar, <b>4</b> mindinho. O polegar fica atrás do braço. Aperte com a <b>ponta</b> do dedo, logo atrás do traste.' },
        { t: 'quiz', pergunta: 'Qual é o dedo 2?', opcoes: ['Indicador', 'Médio', 'Anelar'], certa: 1, explica: '1 indicador, 2 médio, 3 anelar, 4 mindinho.' }
      ] },
      { id: 'u1l5', titulo: 'Suas primeiras notas', min: 4, passos: [
        { t: 'texto', titulo: 'Como funciona o jogo', visual: null,
          texto: 'As cordas aparecem deitadas: a <b>1ª corda em cima</b>, como numa tablatura. As notas deslizam até a <b>linha vermelha</b>, e a bolinha vermelha cai em cima delas na hora de tocar. O número é a casa: <b>0</b> é corda solta.' },
        { t: 'video', video: 'jogo' },
        { t: 'notas', melodia: 'soltas', titulo: 'Toque as cordas soltas' }
      ] }
    ]
  },
  {
    id: 'u2', titulo: 'Primeiro acorde: Em', resumo: 'Leia um diagrama, monte o Em e faça a primeira batida.',
    licoes: [
      { id: 'u2l1', titulo: 'Como ler um acorde', min: 3, passos: [
        { t: 'video', video: 'diagrama' },
        { t: 'texto', titulo: 'O desenho do acorde', visual: 'diagrama',
          texto: 'É o violão <b>de pé na sua frente</b>: a linha da <b>esquerda é a 6ª corda</b>. A bolinha mostra onde apertar e o número é o dedo. <b>O</b> é corda solta e <b>×</b> é corda que não toca.' },
        { t: 'quiz', pergunta: 'Um × em cima da corda quer dizer…', opcoes: ['Apertar com o dedo 1', 'Não tocar essa corda', 'Tocar mais forte'], certa: 1, explica: 'A corda com × fica de fora da batida.' }
      ] },
      { id: 'u2l2', titulo: 'Em (Mi menor)', min: 4, passos: [
        { t: 'texto', titulo: 'Dois dedos e seis cordas', visual: null,
          texto: 'O <b>Em</b> usa só os dedos 2 e 3, e você toca <b>todas as 6 cordas</b>. É um dos acordes mais usados do violão.' },
        { t: 'acorde', acorde: 'Em' },
        { t: 'tocar', titulo: 'Toque o Em quando a bolinha cair', seq: 'Em:4 Em:4 Em:4 Em:4', padrao: 'quatro', ritmo: 'acorde', bpm: 60, modo: 'espera' }
      ] },
      { id: 'u2l3', titulo: 'A batida para baixo', min: 4, passos: [
        { t: 'video', video: 'batida' },
        { t: 'texto', titulo: 'Contando até 4', visual: 'batida',
          texto: 'Bata <b>para baixo</b> uma vez em cada tempo e conte em voz alta: <b>1, 2, 3, 4</b>. O pulso fica solto, como quem sacode água da mão.' },
        { t: 'tocar', titulo: 'Em, quatro batidas por compasso', seq: 'Em:4 Em:4 Em:4 Em:4', padrao: 'quatro', ritmo: 'tempos', bpm: 60, modo: 'tempo' }
      ] }
    ]
  },
  {
    id: 'u3', titulo: 'Dois acordes: Em e D', resumo: 'Com dois acordes você já toca uma música inteira.', musica: 'pra-nao-dizer',
    licoes: [
      { id: 'u3l1', titulo: 'D (Ré maior)', min: 4, passos: [
        { t: 'texto', titulo: 'Um triângulo de dedos', visual: null,
          texto: 'O <b>D</b> forma um triângulo com os dedos 1, 2 e 3 nas três cordas mais finas. Toque só as <b>4 cordas finas</b>: a 6ª e a 5ª têm ×.' },
        { t: 'acorde', acorde: 'D' },
        { t: 'tocar', titulo: 'Toque o D', seq: 'D:4 D:4 D:4 D:4', padrao: 'quatro', ritmo: 'acorde', bpm: 60, modo: 'espera' }
      ] },
      { id: 'u3l2', titulo: 'Trocar Em e D', min: 4, passos: [
        { t: 'texto', titulo: 'O segredo da troca', visual: null,
          texto: 'Levante <b>todos os dedos juntos</b> e pouse todos juntos no acorde novo. Olhe para onde os dedos vão, não para onde estavam.' },
        { t: 'troca', a: 'Em', b: 'D' },
        { t: 'tocar', titulo: 'Em e D no tempo', seq: 'Em:4 D:4 Em:4 D:4 Em:4 D:4', padrao: 'quatro', ritmo: 'acorde', bpm: 60, modo: 'espera' }
      ] },
      { id: 'u3l3', titulo: 'Música: Pra Não Dizer Que Não Falei das Flores', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'Sua primeira música', visual: null,
          texto: 'Esta música de Geraldo Vandré tem só <b>Em e D</b> do começo ao fim. Comece no modo <b>Esperar por mim</b>: a música para em cada acorde até você acertar.' },
        { t: 'tocar', musica: 'pra-nao-dizer', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  },
  {
    id: 'u4', titulo: 'Três acordes: Em, C e D', resumo: 'O C entra na turma e o rock nacional fica ao alcance.', musica: 'que-pais-e-este',
    licoes: [
      { id: 'u4l1', titulo: 'C (Dó maior)', min: 4, passos: [
        { t: 'texto', titulo: 'Uma escadinha', visual: null,
          texto: 'O <b>C</b> parece uma escadinha: dedo 3 na 5ª corda, dedo 2 na 4ª e dedo 1 na 2ª. A 6ª corda fica de fora.' },
        { t: 'acorde', acorde: 'C' },
        { t: 'troca', a: 'C', b: 'D' }
      ] },
      { id: 'u4l2', titulo: 'Em, C e D juntos', min: 4, passos: [
        { t: 'tocar', titulo: 'Em, C e D', seq: 'Em:4 C:4 D:4 Em:4 C:4 D:4', padrao: 'quatro', ritmo: 'acorde', bpm: 60, modo: 'espera' },
        { t: 'tocar', titulo: 'Agora no tempo', seq: 'Em:4 C:4 D:4 Em:4 C:4 D:4', padrao: 'quatro', ritmo: 'tempos', bpm: 66, modo: 'tempo' }
      ] },
      { id: 'u4l3', titulo: 'Música: Que País É Este', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'Rock com três acordes', visual: null,
          texto: 'A Legião Urbana fez este clássico só com <b>Em, C e D</b> e batidas para baixo. Comece com a Introdução.' },
        { t: 'tocar', musica: 'que-pais-e-este', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  },
  {
    id: 'u5', titulo: 'G e o baião', resumo: 'O G completa o trio G, C e D, e você toca Luiz Gonzaga.', musica: 'asa-branca',
    licoes: [
      { id: 'u5l1', titulo: 'G (Sol maior)', min: 4, passos: [
        { t: 'acorde', acorde: 'G' },
        { t: 'troca', a: 'G', b: 'C' },
        { t: 'troca', a: 'G', b: 'D' }
      ] },
      { id: 'u5l2', titulo: 'Ritmos brasileiros: o baião', min: 4, passos: [
        { t: 'video', video: 'samba' },
        { t: 'texto', titulo: 'Polegar e dedos', visual: null,
          texto: 'No baião o <b>polegar</b> faz a zabumba nas cordas graves ("tum... tum") e os <b>dedos</b> respondem nas agudas, como o triângulo. Se ficar difícil, use batidas para baixo: tudo bem.' },
        { t: 'tocar', titulo: 'G, C e D no baião', seq: 'G:4 C:4 D:4 G:4', padrao: 'baiao', ritmo: 'batida', bpm: 70, modo: 'pratica' }
      ] },
      { id: 'u5l3', titulo: 'Música: Asa Branca', min: 5, musicaFinal: true, passos: [
        { t: 'tocar', musica: 'asa-branca', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  },
  {
    id: 'u6', titulo: 'Am e a batida pop', resumo: 'Am, a batida para cima e duas músicas de MPB e pop.', musica: 'o-sol',
    licoes: [
      { id: 'u6l1', titulo: 'Am (Lá menor)', min: 4, passos: [
        { t: 'texto', titulo: 'Parece o E, uma corda abaixo', visual: null,
          texto: 'O <b>Am</b> tem o mesmo desenho do E, só que uma corda mais para baixo. A 6ª corda fica de fora.' },
        { t: 'acorde', acorde: 'Am' },
        { t: 'troca', a: 'Am', b: 'Em' }
      ] },
      { id: 'u6l2', titulo: 'Para baixo e para cima', min: 4, passos: [
        { t: 'texto', titulo: 'A mão nunca para', visual: 'batida',
          texto: 'Bata <b>para baixo</b> no número e <b>para cima</b> no "e": 1 e 2 e 3 e 4 e. A mão vai e volta como um pêndulo.' },
        { t: 'tocar', titulo: 'Baixo e cima com Em e Am', seq: 'Em:4 Am:4 Em:4 Am:4', padrao: 'baixocima', ritmo: 'batida', bpm: 56, modo: 'pratica' }
      ] },
      { id: 'u6l3', titulo: 'Música: Velha Infância', min: 5, musicaFinal: true, passos: [
        { t: 'tocar', musica: 'velha-infancia', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] },
      { id: 'u6l4', titulo: 'Música: O Sol', min: 5, musicaFinal: true, passos: [
        { t: 'tocar', musica: 'o-sol', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  },
  {
    id: 'u7', titulo: 'A, E e a tablatura', resumo: 'Mais dois acordes, a primeira melodia e Trem-Bala.', musica: 'trem-bala',
    licoes: [
      { id: 'u7l1', titulo: 'A (Lá maior)', min: 4, passos: [
        { t: 'texto', titulo: 'Três dedos na mesma casa', visual: null,
          texto: 'No <b>A</b> os dedos 1, 2 e 3 ficam lado a lado na casa 2. Se não couberem, deixe-os um pouco inclinados.' },
        { t: 'acorde', acorde: 'A' },
        { t: 'troca', a: 'A', b: 'D' }
      ] },
      { id: 'u7l2', titulo: 'E (Mi maior)', min: 4, passos: [
        { t: 'acorde', acorde: 'E' },
        { t: 'troca', a: 'A', b: 'E' }
      ] },
      { id: 'u7l3', titulo: 'Lendo tablatura', min: 4, passos: [
        { t: 'video', video: 'tab' },
        { t: 'texto', titulo: 'Seis linhas e números', visual: 'tab',
          texto: 'Cada linha é uma corda, com a <b>1ª em cima</b>. O número diz a casa e <b>0</b> é corda solta. Toque as notas uma de cada vez, da esquerda para a direita.' },
        { t: 'notas', melodia: 'estrelinha', titulo: 'Brilha, Brilha Estrelinha' }
      ] },
      { id: 'u7l4', titulo: 'Música: Trem-Bala', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'A9 e D9', visual: null,
          texto: 'Na cifra aparecem <b>A9</b> e <b>D9</b>: são o A e o D com um dedo a menos (fica uma corda solta soando). Mais fácil e mais bonito.' },
        { t: 'tocar', musica: 'trem-bala', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  },
  {
    id: 'u8', titulo: 'Sétimas e Jorge Ben Jor', resumo: 'Am7, Bm7, B7 e D7, o samba-rock e as músicas do Jorge Ben.', musica: 'taj-mahal',
    licoes: [
      { id: 'u8l1', titulo: 'Am7 e Bm7', min: 4, passos: [
        { t: 'texto', titulo: 'O som da sétima', visual: null,
          texto: 'Somar a <b>sétima</b> deixa o acorde com mais "balanço". O <b>Am7</b> é o Am sem o dedo 3, e o <b>Bm7</b> substitui o Bm, que tem pestana.' },
        { t: 'acorde', acorde: 'Am7' },
        { t: 'acorde', acorde: 'Bm7' },
        { t: 'troca', a: 'Am7', b: 'Bm7' }
      ] },
      { id: 'u8l2', titulo: 'O samba-rock', min: 4, passos: [
        { t: 'texto', titulo: 'A batida do Jorge Ben', visual: null,
          texto: 'Mão direita solta, acentos fora do tempo e muito balanço. Comece ouvindo a prática e acompanhando só com batidas para baixo.' },
        { t: 'tocar', titulo: 'Am7, Bm7 e Em', seq: 'Am7:2 Bm7:2 Em:4 Am7:2 Bm7:2 Em:4', padrao: 'sambarock', ritmo: 'batida', bpm: 76, modo: 'pratica' }
      ] },
      { id: 'u8l3', titulo: 'Música: Taj Mahal', min: 5, musicaFinal: true, passos: [
        { t: 'texto', titulo: 'O capotraste', visual: null,
          texto: 'Para soar igual à gravação, coloque o <b>capotraste na 2ª casa</b>. Sem capo também vale: o desenho é o mesmo, só fica mais grave.' },
        { t: 'tocar', musica: 'taj-mahal', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] },
      { id: 'u8l4', titulo: 'B7 e D7', min: 4, passos: [
        { t: 'acorde', acorde: 'B7' },
        { t: 'acorde', acorde: 'D7' },
        { t: 'troca', a: 'Em7', b: 'B7' }
      ] },
      { id: 'u8l5', titulo: 'Música: Mas Que Nada', min: 5, musicaFinal: true, passos: [
        { t: 'tocar', musica: 'mas-que-nada', secao: 0, ritmo: 'acorde', modo: 'espera' }
      ] }
    ]
  }
];
const LESSONS = CURSO.flatMap(u => u.licoes.map(l => ({ ...l, mod: u.id })));

/* ---------- MELODIAS (notas soltas) ----------
   Só músicas de DOMÍNIO PÚBLICO (folclore e compositores antigos).
   Nota = nome + oitava (G3 = Sol da 3ª corda solta) : duração em tempos.
   O app escolhe a corda e a casa na 1ª posição (casas 0 a 4). */
const MELODIAS = [
  { id: 'soltas', titulo: 'Cordas soltas', origem: 'Exercício', bpm: 60, beats: 4,
    notas: 'E2:2 A2:2 D3:2 G3:2 B3:2 E4:2 E4:2 B3:2 G3:2 D3:2 A2:2 E2:4' },
  { id: 'primeiras', titulo: 'Primeiras casas', origem: 'Exercício', bpm: 60, beats: 4,
    notas: 'B3:2 C4:2 D4:2 C4:2 B3:2 C4:2 D4:4 E4:2 F4:2 G4:2 F4:2 E4:2 F4:2 G4:4' },
  { id: 'escala-do', titulo: 'Escala de Dó', origem: 'Exercício', bpm: 60, beats: 4,
    notas: 'C3:1 D3:1 E3:1 F3:1 G3:1 A3:1 B3:1 C4:1 C4:1 B3:1 A3:1 G3:1 F3:1 E3:1 D3:1 C3:1' },
  { id: 'estrelinha', titulo: 'Brilha, Brilha Estrelinha', origem: 'Canção tradicional (domínio público)', bpm: 72, beats: 4,
    notas: 'G3:1 G3:1 D4:1 D4:1 E4:1 E4:1 D4:2 C4:1 C4:1 B3:1 B3:1 A3:1 A3:1 G3:2 D4:1 D4:1 C4:1 C4:1 B3:1 B3:1 A3:2 D4:1 D4:1 C4:1 C4:1 B3:1 B3:1 A3:2 G3:1 G3:1 D4:1 D4:1 E4:1 E4:1 D4:2 C4:1 C4:1 B3:1 B3:1 A3:1 A3:1 G3:2' },
  { id: 'ode', titulo: 'Ode à Alegria', origem: 'Beethoven, 1824 (domínio público)', bpm: 76, beats: 4,
    notas: 'B3:1 B3:1 C4:1 D4:1 D4:1 C4:1 B3:1 A3:1 G3:1 G3:1 A3:1 B3:1 B3:1.5 A3:0.5 A3:2 B3:1 B3:1 C4:1 D4:1 D4:1 C4:1 B3:1 A3:1 G3:1 G3:1 A3:1 B3:1 A3:1.5 G3:0.5 G3:2' },
  { id: 'parabens', titulo: 'Parabéns pra Você', origem: 'Melodia de 1893 (domínio público)', bpm: 84, beats: 3,
    notas: 'D3:0.75 D3:0.25 E3:1 D3:1 G3:1 F#3:2 D3:0.75 D3:0.25 E3:1 D3:1 A3:1 G3:2 D3:0.75 D3:0.25 D4:1 B3:1 G3:1 F#3:1 E3:2 C4:0.75 C4:0.25 B3:1 G3:1 A3:1 G3:3' },
  { id: 'jingle', titulo: 'Jingle Bells', origem: 'James Pierpont, 1857 (domínio público)', bpm: 96, beats: 4,
    notas: 'B3:1 B3:1 B3:2 B3:1 B3:1 B3:2 B3:1 D4:1 G3:1.5 A3:0.5 B3:4 C4:1 C4:1 C4:1.5 C4:0.5 C4:1 B3:1 B3:1 B3:0.5 B3:0.5 B3:1 A3:1 A3:1 B3:1 A3:2 D4:2 B3:1 B3:1 B3:2 B3:1 B3:1 B3:2 B3:1 D4:1 G3:1.5 A3:0.5 B3:4 C4:1 C4:1 C4:1.5 C4:0.5 C4:1 B3:1 B3:1 B3:0.5 B3:0.5 D4:1 D4:1 C4:1 A3:1 G3:4' }
];

// Transforma "G3:1 D4:2" em notas com corda, casa e dedo (1ª posição: casas 0 a 4)
const _NOTA_PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const _SOLTAS = [40, 45, 50, 55, 59, 64];
function lerMelodia(texto) {
  let inicio = 0;
  return String(texto).trim().split(/\s+/).map(tok => {
    const [n, t] = tok.split(':');
    const m = n.match(/^([A-G](?:#|b)?)(-?\d)$/);
    const midi = 12 * (+m[2] + 1) + _NOTA_PC[m[1]];
    let corda = 0, casa = 99;
    _SOLTAS.forEach((s, i) => { const f = midi - s; if (f >= 0 && f <= 4 && f < casa) { casa = f; corda = i; } });
    if (casa === 99) { corda = 5; casa = Math.max(0, midi - 64); }
    const nota = { midi, corda, casa, dedo: casa > 0 ? Math.min(4, casa) : 0, tempos: +t || 1, inicio };
    inicio += nota.tempos;
    return nota;
  });
}

/* ---------- CATÁLOGO DE MÚSICAS ----------
   Só a sequência de ACORDES (sem letra, por direitos autorais), tirada das
   versões simplificadas do Cifra Club. A duração de cada acorde foi estimada
   pela posição dele na cifra.
   capo: casa do capotraste para soar igual à gravação. Os desenhos são os da mão.
   youtube: vídeo oficial (o app toca pelo player do YouTube, sem copiar o áudio). */
const CATALOGO = [
 {
  "id": "pra-nao-dizer",
  "grupo": "iniciante",
  "titulo": "Pra Não Dizer Que Não Falei das Flores",
  "artista": "Geraldo Vandré",
  "genero": "MPB",
  "padrao": "pop",
  "bpm": 110,
  "capo": 1,
  "youtube": "KdvsXn8oVPY",
  "nota": "Só dois acordes, Em e D, a música inteira. Com capotraste na 1ª casa soa igual à gravação.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em:4 D:4 Em:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Solo Intro",
    "seq": "Em:2 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Ponte",
    "seq": "D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4",
    "repetir": 2
   },
   {
    "nome": "Ponte",
    "seq": "D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4 D:4 Em:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/geraldo-vandre/pra-nao-dizer-que-nao-falei-das-flores/simplificada.html"
 },
 {
  "id": "que-pais-e-este",
  "grupo": "iniciante",
  "titulo": "Que País É Este",
  "artista": "Legião Urbana",
  "genero": "Rock",
  "padrao": "quatro",
  "bpm": 140,
  "capo": 0,
  "youtube": "kFpkyT_KPpc",
  "nota": "Três acordes e batida só para baixo, bem rock. Ótima para treinar a troca C ↔ D.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em:4 C:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Ritmo",
    "seq": "Em:4 C:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:4 D:2 Em:2 C:2 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Em:4 C:4 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4 Em:4 C:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Ponte",
    "seq": "Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:4 Em:4 C:2 D:2 Em:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/legiao-urbana/que-pais-e-esse/simplificada.html"
 },
 {
  "id": "asa-branca",
  "grupo": "iniciante",
  "titulo": "Asa Branca",
  "artista": "Luiz Gonzaga",
  "genero": "Baião",
  "padrao": "baiao",
  "bpm": 116,
  "capo": 0,
  "youtube": "0kCm1XTZ_qA",
  "nota": "G, C e D: os três acordes mais usados da música brasileira.",
  "secoes": [
   {
    "nome": "Primeira Parte",
    "seq": "G:4 C:4 G:2 D:2 G:4 G:4 C:4 D:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "G:4 C:4 G:2 D:2 G:4 G:4 C:4 D:4 G:4 G:4 C:4 D:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Terceira Parte",
    "seq": "G:4 C:4 G:2 D:2 G:4 G:4 C:4 D:4 G:4 G:4 C:4 D:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Quarta Parte",
    "seq": "G:4 C:4 G:2 D:2 G:4 G:4 C:4 D:4 G:4 G:4 C:4 D:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Quinta Parte",
    "seq": "G:4 C:4 G:2 D:2 G:4 G:4 C:4 D:4 G:4 G:4 C:4 D:4 G:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/luiz-gonzaga/asa-branca/simplificada.html"
 },
 {
  "id": "velha-infancia",
  "grupo": "iniciante",
  "titulo": "Velha Infância",
  "artista": "Tribalistas",
  "genero": "MPB",
  "padrao": "pop",
  "bpm": 92,
  "capo": 2,
  "youtube": "Fub2qOHlyOE",
  "nota": "Em, Am e D se repetindo. Com capotraste na 2ª casa fica igual à gravação.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em:4 Am:4 D:4 Em:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Ponte",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Final",
    "seq": "Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4 Am:4 D:4 Em:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/tribalistas/velha-infancia/simplificada.html"
 },
 {
  "id": "o-sol",
  "grupo": "iniciante",
  "titulo": "O Sol",
  "artista": "Vitor Kley",
  "genero": "Pop",
  "padrao": "pop",
  "bpm": 98,
  "capo": 2,
  "youtube": "yOwwSByMd0k",
  "nota": "Quatro acordes abertos. Com capotraste na 2ª casa fica igual à gravação.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em:4 Am:4 Em:4 Am:4",
    "repetir": 1
   },
   {
    "nome": "Primeira parte",
    "seq": "Em:4 Am:4 Em:4 Am:4 Em:4 Am:4 Em:4 Am:4",
    "repetir": 1
   },
   {
    "nome": "Pré-refrão",
    "seq": "C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Primeira parte",
    "seq": "Em:4 Am:4 Em:4 Am:4 Em:4 Am:4 Em:4 Am:4",
    "repetir": 1
   },
   {
    "nome": "Pré-refrão",
    "seq": "C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4",
    "repetir": 1
   },
   {
    "nome": "Segunda parte",
    "seq": "C:4 Am:4 Em:8 D:4 C:8 Am:4 Em:8 D:4 C:2 D:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4 C:4 Am:4 Em:4 D:4 C:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/vitor-kley/o-sol/simplificada.html"
 },
 {
  "id": "trem-bala",
  "grupo": "iniciante",
  "titulo": "Trem-Bala",
  "artista": "Ana Vilela",
  "genero": "MPB",
  "padrao": "pop",
  "bpm": 93,
  "capo": 2,
  "youtube": "sWhy1VcvvgY",
  "nota": "A, D e E (o A9 e o D9 são o A e o D com um dedo a menos). Capotraste na 2ª casa para soar como a gravação.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "A9:4 D9:4 A9:4 E:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "A9:4 D9:4 A9:4 E:4 A9:4 D9:4 A9:4 E:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "D9:4 E:4 A9:4 D9:4 E:4 A9:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "D9:4 A9:4 E:4 A9:4 D9:4 A9:4 E:4",
    "repetir": 1
   },
   {
    "nome": "Refrão 2",
    "seq": "D9:4 E:4 A9:4 D9:4 E:4 A9:4",
    "repetir": 1
   },
   {
    "nome": "Terceira Parte",
    "seq": "D9:4 A9:4 E:4 A9:4 D9:4 A9:4 E:4",
    "repetir": 1
   },
   {
    "nome": "Refrão 3",
    "seq": "D9:4 E:4 A9:4 D9:4 E:4 A9:4",
    "repetir": 1
   },
   {
    "nome": "Ponte",
    "seq": "D9:4 E:4 A9:4 D9:4 E:4 A9:4",
    "repetir": 1
   },
   {
    "nome": "Refrão Final",
    "seq": "D9:4 E:4 A9:4 D9:4 E:4 A9:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/ana-vilela/trem-bala/simplificada.html"
 },
 {
  "id": "so-os-loucos-sabem",
  "grupo": "iniciante",
  "titulo": "Só os Loucos Sabem",
  "artista": "Charlie Brown Jr.",
  "genero": "Pop rock",
  "padrao": "pop",
  "bpm": 82,
  "capo": 0,
  "youtube": "JRJj4z-prvM",
  "nota": "G, Em, C, D e Am: a sequência mais famosa do pop.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "G:4 Em:4 C:4 G:4 Em:4 C:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Em:4 C:4 G:4 Em:4 G:4 D:4 Em:2 C:4 G:4 Am:4 C:4 Em:4 C:4 G:4 Em:4 G:4 D:4 Em:4 C:4 G:4 Am:8 C:8",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em:2 C:2 G:4 Em:2 G:2 D:4 Em:2 C:2 G:4 Am:4 C:4 G:4 Em:4 C:4 G:4 Em:4 C:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Em:2 C:4 G:4 Em:2 G:4 D:4 Em:4 C:4 G:4 Am:4 C:4 Em:2 C:2 G:4 Em:2 G:2 D:4 Em:4 C:4 G:4 Am:4 C:4 G:4 Em:4 C:4 G:4 Em:4 C:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Em:4 C:4 G:4 Em:4 G:4 D:4 Em:2 C:4 G:4 Am:4 C:4",
    "repetir": 1
   },
   {
    "nome": "Final",
    "seq": "G:4 Em:4 C:4 G:4 Em:4 C:4 G:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/charlie-brown-jr/so-os-loucos-sabem/simplificada.html"
 },
 {
  "id": "tempo-perdido",
  "grupo": "iniciante",
  "titulo": "Tempo Perdido",
  "artista": "Legião Urbana",
  "genero": "Rock",
  "padrao": "pop",
  "bpm": 93,
  "capo": 0,
  "youtube": "SLaNv85zvCk",
  "nota": "C, Am7, Bm e Em. O Bm vira Bm7 (sem pestana) no modo fácil.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "C:4 Am7:4 Bm:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "C:4 Am7:4 Bm:4 Em:4 C:4 Am7:4 Bm:4 Em:4 C:4 Am7:4 Bm:8 Em:4 C:4 Am7:4 Bm:4 Em:4 C:4 Am7:4 Bm:4 Em:4 C:2 Am7:4 Bm:2 Em:4 Bm:2 Em:4 Bm:2 Em:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "C:4 Am7:4 Bm:4 Em:4 C:4 Am7:4 Bm:2 Em:4 C:4 Am7:4 Bm:4 Em:2 C:4 Am7:4 Bm:4 Em:4 Bm:4 Em:4 Bm:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Terceira Parte",
    "seq": "C:2 Am7:4 Bm:4 Em:2 C:2 Am7:4 Bm:2 Em:4 C:4 Am7:4 Bm:4 Em:4 C:4 Am7:4 Bm:2 Em:4 Bm:2 Em:4 Bm:2 Em:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/simplificada.html"
 },
 {
  "id": "andar-com-fe",
  "grupo": "iniciante",
  "titulo": "Andar com Fé",
  "artista": "Gilberto Gil",
  "genero": "MPB",
  "padrao": "pop",
  "bpm": 95,
  "capo": 3,
  "youtube": "h0cKwTOPsmU",
  "nota": "No tom original tem F (pestana). Com capotraste na 3ª casa você toca A, E7 e D e soa igual.",
  "secoes": [
   {
    "nome": "Início",
    "seq": "A:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4 D:4 E7:4 A:4 E7:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/gilberto-gil/andar-com-fe/simplificada.html"
 },
 {
  "id": "anunciacao",
  "grupo": "iniciante",
  "titulo": "Anunciação",
  "artista": "Alceu Valença",
  "genero": "Forró",
  "padrao": "baiao",
  "bpm": 102,
  "capo": 0,
  "youtube": "OR74idpsweg",
  "nota": "G, Am, C, Em e F. No modo fácil o F vira F7M, sem pestana.",
  "secoes": [
   {
    "nome": "Primeira Parte",
    "seq": "G:8 Am:4 C:4 G:4 Am:4 C:4 G:4 Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "G:2 Em:4 F:4 C:4 G:4 Em:4 F:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "G:2 Em:4 F:4 C:4 G:4 G:2 Em:4 F:4 C:4 G:4 Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "G:2 Em:4 F:4 C:4 G:4 Em:4 F:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "G:2 Em:4 F:4 C:4 G:4 G:2 Em:4 F:4 C:4 G:4",
    "repetir": 1
   },
   {
    "nome": "Final",
    "seq": "Am:4 C:4 G:4 Am:4 C:4 G:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/alceu-valenca/anunciacao/simplificada.html"
 },
 {
  "id": "taj-mahal",
  "grupo": "jorge",
  "titulo": "Taj Mahal",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 120,
  "capo": 2,
  "youtube": "c8AuG1W59ig",
  "nota": "No tom original é tudo com pestana. Com capotraste na 2ª casa vira Am7, Bm7, Em e D7.",
  "secoes": [
   {
    "nome": "Primeira Parte",
    "seq": "Am7:4 Bm7:4 Em:4 Am7:2 Bm7:4 Em:4 Am7:4 Bm7:4 Em:4 Am7:4 Bm7:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Am7:4 Bm7:4 Em:4 Am7:4 Bm7:4 Em:4 Am7:2 Bm7:4 Em:4 Am7:2 Bm7:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Segunda Parte",
    "seq": "Am7:4 D7(9):4 Em:4 Am7:4 D7(9):4 Em:4 Am7:4 Am7:4 Em:4 Am7:4 Am7:4 Em:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Am7:4 Bm7:4 Em:4 Am7:4 Bm7:4 Em:4 Am7:2 Bm7:4 Em:4 Am7:2 Bm7:4 Em:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/taj-mahal/simplificada.html"
 },
 {
  "id": "pais-tropical",
  "grupo": "jorge",
  "titulo": "País Tropical",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 118,
  "capo": 0,
  "youtube": "JzByVhWju88",
  "nota": "Só acordes abertos: G7, C7, D7, Em, D e C.",
  "secoes": [
   {
    "nome": "Início",
    "seq": "G7:2 C7:2 D7:4 Em:2 D:2 C:2 D:2 Em:4 D:2 C:2 D:2 Em:4 D:2 C:2 D:2 Em:4 D:2 C:4 D:2 Em:2 D:2 C:4 D:2 Em:2 D:2 C:4 D:4 Em:2 D:4 C:4 D:4 G7:4 C7:4 G7:4 C7:4 G7:4 C7:4 D7:4 Em:2 D:2 C:2 D:2 Em:4 D:2 C:2 D:2 Em:4 D:2 C:2 D:2 Em:4 D:2 C:4 D:2 Em:2 D:2 C:4 D:2 Em:2 D:2 C:4 D:4 Em:2 D:4 C:4 D:4 G7:4 C7:4 G7:4 C7:4 G7:4 C7:4 D7:4 Em:2 D:2 C:4 D:2 Em:2 D:2 C:4 D:2 Em:2 D:4 D:2 C:4 D:2 Em:2 D:2 C:4 D:2 Em:2 D:2 C:4 D:2 Em:2 D:4 C:4 D:2 G7:4 C7:4 D7:2 G7:4 C7:4 D7:2 G7:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/pais-tropical/simplificada.html"
 },
 {
  "id": "mas-que-nada",
  "grupo": "jorge",
  "titulo": "Mas Que Nada",
  "artista": "Jorge Ben Jor",
  "genero": "Samba",
  "padrao": "sambarock",
  "bpm": 100,
  "capo": 3,
  "youtube": "",
  "nota": "No tom original (Gm) tudo tem pestana. Com capotraste na 3ª casa vira Em7, B7, D7 e Am7.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4 D7:4 Em7:4 B7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4 Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4",
    "repetir": 1
   },
   {
    "nome": "Pré-Refrão",
    "seq": "Am7:4 D7:4 Em7:4 Am7:4 D7:4 Em7:4 B7:2 Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4 Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4",
    "repetir": 1
   },
   {
    "nome": "Solo",
    "seq": "Em7:4 Am7:4 D7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4 Am7:4 D7:4 Em7:4 B7:4 Em7:4 B7:4",
    "repetir": 1
   },
   {
    "nome": "Pré-Refrão",
    "seq": "Am7:4 D7:4 Em7:4 Am7:4 D7:4 Em7:4 B7:2 Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4 Em7:2 Am7:2 D7:2 Em7:4 B7:2 Em7:2 B7:4",
    "repetir": 1
   },
   {
    "nome": "Final",
    "seq": "Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4 B7:4 Em7:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/mas-que-nada/simplificada.html"
 },
 {
  "id": "w-brasil",
  "grupo": "jorge",
  "titulo": "W/Brasil (Chama o Síndico)",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 105,
  "capo": 3,
  "youtube": "bkM1u4GxHzw",
  "nota": "Dois acordes a música toda. Com capotraste na 3ª casa: A e D.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "A:4 D:4 A:2 D:2 A:2 D:2 A:2 D:4 A:2 D:2 A:2 D:2 A:2 D:4 A:2 D:2 A:4 D:4 A:2 D:4 A:4 D:4 A:4 D:4 A:4 D:2 A:2 D:2 A:2 D:2 A:2 D:4 A:4 D:4 A:4 D:2 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:4 A:2 D:4 A:4 D:4 A:4 A:2 D:2 A:2 D:4 A:2 D:2 A:2 D:4 A:4 D:2 A:2 D:2 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:2 A:2 D:4 A:2 D:4 A:2 D:4 A:2 D:4 A:4 D:2 A:2 D:4 A:4 D:4 A:4 D:2 A:4 A:4 D:4 A:2 D:2 A:2 D:4 A:4 D:2 A:2 D:4 A:4 D:4 A:2 D:4 A:2 D:2 A:2 D:4 A:2 D:2 A:4 D:4 A:2 D:2 A:4 D:2 A:2 D:2 A:2 D:4 A:2 D:2 A:2 D:2 A:2 D:4 A:2 D:4 A:2 D:4 A:4 D:2 A:2 D:4 A:4 D:2 A:4 D:2 A:2 D:4 A:4 D:4 A:4 D:4 A:4 D:2 A:4 D:4 A:2 D:4 A:2 D:2 A:4 D:4 A:2 D:4 A:2 D:2 A:2 D:2 A:2 D:4 A:2 D:4 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:2 A:4 D:4 A:2 D:4 A:4 D:4 A:4 D:2 A:2 D:4 A:2 D:2 A:2 D:2 A:4 D:4 A:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/wbrasil-chama-sindico/simplificada.html"
 },
 {
  "id": "filho-maravilha",
  "grupo": "jorge",
  "titulo": "Filho Maravilha",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 110,
  "capo": 0,
  "youtube": "RXqfj88I-p8",
  "nota": "Em, C, D e as sétimas Em7, Am7 e Bm7: tudo aberto.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Em:4 C:4 D:4 Em7:4 C:2 D9:4 Em7:2 C:2 D9:2 Em7:4 C:4 D9:2 Em7:4 C:2 D9:4 Em7:4 C:2 D9:4 Em7:4 C:2 D9:2 Em7:4 C:2 Em7:2 C:2 D9:4 Em7:4 C:2 D9:4 Em7:4 C:2 D9:4 Em7:8 C:4 D9:2 Em7:4 C:2 D9:4 Em7:8 C:4 D9:4 Em7:4 C:2 D9:4 Em7:4 C:4 D9:2 Em7:4 C:4 D9:4 Em7:4 C:4 D9:4 Em7:4 C:4 D9:4 Em7:4 Am7:2 Bm7:4 Em7:2 Am7:2 Bm7:4 Em7:4 Am7:2 Bm7:4 Em7:2 Am7:2 Bm7:4 Em7:4 Am7:2 Bm7:4 Em7:2 Am7:2 Bm7:4 Em7:4 C:4 D9:4 Em7:2 C:2 D9:4 Em7:4 Am7:2 Bm7:4 Em7:2 Am7:2 Bm7:4 Em7:4 C:4 D9:4 Em7:2 C:2 D9:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/filho-maravilha/simplificada.html"
 },
 {
  "id": "chove-chuva",
  "grupo": "jorge",
  "titulo": "Chove Chuva",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-bossa",
  "padrao": "bossa",
  "bpm": 100,
  "capo": 0,
  "youtube": "Ubol9NyLWZc",
  "nota": "Acordes com sétima, bem bossa nova.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Am7:4 Dm7:4 Am7:4 Dm7:4 Am7:4 Dm7:4 Am7:4 A7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "D7:4 Am7:4 D7:4 Am7:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "D7:4 G7:4 Am7:2 A7:4 D7:4 G7:4 Am7:4 D7:4 Am7:4 D7:4 Am7:4 D7:2 Dm7:4 G7:4 Am7:4 A7:4 D7:4 G7:4 Am7:4 A7:4 D7:4 G7:4 Am7:2 A7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "D7:4 Am7:4 D7:4 Am7:4",
    "repetir": 1
   },
   {
    "nome": "Primeira Parte",
    "seq": "D7:4 G7:4 Am7:2 A7:4 D7:4 G7:4 Am7:4 D7:4 Am7:4 D7:4 Am7:4 D7:2 Dm7:4 G7:4 Am7:4 A7:4 D7:4 G7:4 Am7:4 A7:4 D7:4 G7:4 Am7:2 A7:4",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "D7:4 Am7:4 D7:4 Am7:4 D7:4 Am7:4 D7:4 Am7:4",
    "repetir": 1
   },
   {
    "nome": "Final",
    "seq": "D7:4 Am7:4 D7:4 Am7:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/chove-chuva/simplificada.html"
 },
 {
  "id": "magnolia",
  "grupo": "jorge",
  "titulo": "Magnólia",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 121,
  "capo": 0,
  "youtube": "NE0FAmjSE_8",
  "nota": "Mais difícil: tem Gm, F#m e Fm com pestana. Deixe para depois de Taj Mahal.",
  "secoes": [
   {
    "nome": "Intro",
    "seq": "Gm:4 F#m:4 Em:4 F#m:4 Em:4 D7M:4 Em7:8 D7M:4 Em7:8 F#m7:4 Em7:4 F#m7:4 Em7:4 F#m7:4 Em7:4 D7M:2 Em7:4 F#m7:4 Em7:4 D7M:2 Em7:4 F#m7:4 Em7:4 D7M:2 Em7:4 F#m:2 Gm:2 Fm:4 Em7:4 F#m:2 Gm:2 F#m:4 Em7:4 F#m:2 Gm:2 F#m:4 Em7:4 F#m:2 Gm:2 F#m:4 Em7:8 F#m:4 Gm:4 F#m:4 Em7:8 F#m:2 Gm:2 F#m:4 Em7:4 F#m7:4 Em7:4 D7M:2 Em7:4 F#m7:4 Em7:4 D7M:2 Em7:4 F#m7:4 Em7:4 F#m7:4 Em7:4 F#m7:4 Em7:4 F#m7:4 Em7:4 F#m7:2 Em7:2 F#m7:2 Em7:4 F#m7:2 Em7:2 F#m7:2 Em7:4 F#m7:2 Em7:4 F#m7:2 Em7:4 F#m7:2 Em7:4",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/magnolia/simplificada.html"
 },
 {
  "id": "amante-amado",
  "grupo": "jorge",
  "titulo": "Amante Amado",
  "artista": "Jorge Ben Jor",
  "genero": "Samba-rock",
  "padrao": "sambarock",
  "bpm": 100,
  "capo": 0,
  "youtube": "gASmm3bqWow",
  "nota": "A marca da música é a descida E7(9) → Eb7M → D7M: o mesmo desenho descendo uma casa.",
  "secoes": [
   {
    "nome": "Introdução",
    "seq": "E7(9):4 Eb7M:4 D7M:8",
    "repetir": 1
   },
   {
    "nome": "Primeira parte",
    "seq": "E7(9):4 Eb7M:4 D7M:8 E7(9):4 Eb7M:4 D7M:8",
    "repetir": 1
   },
   {
    "nome": "Segunda parte",
    "seq": "G7M:4 F#m7:4 Em7:4 A7:4 D7M:4 G7M:4 F#m7:4 Em7:4 C:4 A7:4 D7M:8",
    "repetir": 1
   },
   {
    "nome": "Refrão",
    "seq": "E7(9):4 Eb7M:4 D7M:8 E7(9):4 Eb7M:4 D7M:8",
    "repetir": 1
   },
   {
    "nome": "Segunda parte",
    "seq": "G7M:4 F#m7:4 Em7:4 A7:4 D7M:4 G7M:4 F#m7:4 Em7:4 C:4 A7:4 D7M:8",
    "repetir": 1
   },
   {
    "nome": "Refrão final",
    "seq": "E7(9):4 Eb7M:4 D7M:8 E7(9):4 Eb7M:4 D7M:8 E7(9):4 Eb7M:4 D7M:8",
    "repetir": 1
   }
  ],
  "fonte": "https://www.cifraclub.com.br/jorge-ben-jor/amante-amado/simplificada.html"
 }
];

/* ---------- MISSÕES DIÁRIAS ----------
   metrica: o que é contado no dia | alvo: quanto precisa */
const MISSOES = [
  { id: 'licao', texto: 'Conclua 1 lição', metrica: 'licoes', alvo: 1, xp: 30 },
  { id: 'trocas', texto: 'Faça 20 trocas de acorde', metrica: 'trocas', alvo: 20, xp: 25 },
  { id: 'quiz', texto: 'Acerte 7 acordes no quiz', metrica: 'quiz', alvo: 7, xp: 20 },
  { id: 'batida', texto: 'Tire 70% ou mais num jogo no tempo', metrica: 'batida', alvo: 70, xp: 30 },
  { id: 'minutos', texto: 'Treine 10 minutos', metrica: 'min', alvo: 10, xp: 25 },
  { id: 'musica', texto: 'Toque 1 música até o fim', metrica: 'musicas', alvo: 1, xp: 30 },
];

const TITULOS = ['Calouro', 'Aprendiz', 'Batuqueiro', 'Seresteiro', 'Partideiro', 'Bamba', 'Mestre da roda'];
