# Toca Aí — violão com música brasileira

App **Android (.apk)** para aprender violão do zero com MPB, rock nacional, baião e samba-rock. Você escolhe uma música, o app monta um **jogo parecido com o Yousician** e o **microfone confere** se você tocou o acorde certo, na hora certa.

| Parte | Linguagem | O que faz |
|---|---|---|
| App (raiz da pasta) | HTML, CSS, JavaScript | Telas, jogo, curso, apostilas, afinador |
| `capacitor.config.json`, `package.json`, `android-build/` | JSON + JavaScript (Node) | Empacotam o site como **app Android** com o Capacitor |
| `.github/workflows/apk.yml` | YAML (GitHub Actions) | Robô que **gera o .apk sozinho** a cada atualização |
| `ia/` | **Python** (NumPy, SciPy, scikit-learn) | Projeto de estudo: rede neural que reconhece acordes |

---

## 1. Instalar no celular

1. No **celular**, abra `https://github.com/mathperrut/toca-a-/releases/latest`.
2. Toque em **TocaAi.apk**, depois em **Abrir**.
3. O Android avisa que o app não veio da Play Store: **Configurações → Permitir desta fonte** e volte para instalar.
4. Na primeira vez que o app pedir o **microfone**, toque em **Permitir** (sem isso o jogo não consegue conferir o que você toca).

**Atualizar:** baixe a versão nova em Releases e instale **por cima**. O progresso continua, porque toda versão usa a mesma assinatura (`android-build/debug.keystore`, chave de uso pessoal, senha `android`; para a Play Store seria preciso uma chave própria e secreta).

**Como o .apk nasce:** cada envio para a branch `main` faz o GitHub Actions copiar o app para um projeto Android, gerar ícones, compilar e publicar uma versão nova em **Releases** (5 a 10 minutos). Para gerar no PC (precisa do Android Studio): `npm install`, `npm run android`, `npx cap open android`.

**Pelo navegador:** dá para abrir como site (`python -m http.server 8000` e `http://localhost:8000`), mas a **busca automática de cifras só funciona no .apk** (explicação na seção 3).

---

## 2. O que tem no app

### Jogo (inspirado no Yousician)
- **Seis cordas deitadas**, a 1ª (mais fina) em cima, como na tablatura. Em Ajustes dá para inverter.
- Os acordes chegam como **blocos coloridos**; cada batida é uma **barra com seta** (▼ para baixo, ▲ para cima); notas soltas são **bolinhas com o número da casa**.
- A **linha vermelha** é o "agora" e uma **bolinha vermelha quica** marcando o tempo.
- Em cima: o acorde da vez com o desenho, o próximo e o aviso **"em 3, 2, 1"** antes da troca.

| Modo | Para quem | Como funciona |
|---|---|---|
| **Esperar por mim** (padrão) | Quem está começando | A música **para em cada acorde** até o microfone ouvir o acorde certo |
| **No tempo** | Quem já troca os acordes | Pontua cada batida (Perfeito, Bom, Ok) e dá +50 quando o acorde soa certo |
| **Praticar** | Para ouvir e acompanhar | Sem pontos, com o violão do app tocando junto |

- **Velocidade:** 40%, 60% (padrão), 80% ou 100%, inclusive no meio do jogo (botão de pausa).
- **Resultado:** porcentagem, até 3 estrelas (45%, 70% e 90%), o acorde que mais deu trabalho e um botão para treiná-lo.

### Buscar qualquer música (no .apk)
1. Aba **Músicas** → digite o nome → **Montar jogo**.
2. O app baixa a **cifra simplificada do Cifra Club**, pega só os acordes, coloca **capotraste** se isso deixar os acordes mais fáceis, troca acordes difíceis por versões sem pestana e procura a **gravação oficial no YouTube**.
3. A música fica salva em **Minhas músicas**, pronta para jogar.

No navegador, o botão abre a busca do Cifra Club; você copia a cifra e cola em **Colar cifra**.

### Músicas para começar
| Música | Artista | Acordes | Capo |
|---|---|---|---|
| Pra Não Dizer Que Não Falei das Flores | Geraldo Vandré | Em D | 1 |
| Que País É Este | Legião Urbana | Em C D | — |
| Asa Branca | Luiz Gonzaga | G C D | — |
| Velha Infância | Tribalistas | Em Am D | 2 |
| O Sol | Vitor Kley | Em Am C D | 2 |
| Trem-Bala | Ana Vilela | A9 D9 E | 2 |
| Só os Loucos Sabem | Charlie Brown Jr. | G Em C D Am | — |
| Tempo Perdido | Legião Urbana | C Am7 Bm Em | — |
| Andar com Fé | Gilberto Gil | A E7 D | 3 |
| Anunciação | Alceu Valença | G Am C Em F | — |

Mais 8 do **Jorge Ben Jor** (Taj Mahal, Mas Que Nada, W/Brasil, País Tropical...) e 7 **melodias de domínio público** para treinar notas soltas.

### Curso, apostilas e vídeos
- **Curso:** 8 unidades, 30 lições curtas (uma ideia por tela). Cada unidade termina numa música que usa só o que você aprendeu: Em → Em e D → Em, C e D → G e baião → Am e batida pop → A, E e tablatura → sétimas e Jorge Ben.
- **Apostilas (9):** como o violão funciona, afinar, postura, ler diagrama e tablatura, notas, como os acordes se formam, ritmo, ritmos brasileiros e como estudar. Cada uma tem analogias, "pegadinhas" e um quiz de 3 perguntas.
- **Mini vídeos (10):** de 25 a 57 segundos, com narração e o som do violão: partes do violão, cordas, afinar, postura, diagrama, batida, tablatura, como jogar, samba e rotina de estudo.

### Som de violão gravado
- Duas coleções de **notas gravadas de violões reais**: **clássico (náilon)** e **acústico**, escolhidas em Ajustes.
- A batida é montada em tempo real: as cordas entram uma depois da outra, cada nota varia um pouco de força e afinação, a nota anterior da mesma corda é abafada e há um eco curto de sala.

### Afinador e metrônomo
Afinador corda por corda (marca cada corda afinada) e metrônomo com luzes.

---

## 3. Como funciona por dentro (para estudar)

**Microfone conferindo o acorde** (`audio-detect.js`, `jogo.js`)
1. Um *AudioWorklet* procura o **ataque** (o "estalo" da palhetada), não o volume, porque a batida anterior ainda está soando.
2. O som vira um **cromagrama**: 12 números, a força de cada nota (Dó, Dó#, Ré...).
3. O app monta o **molde** do acorde esperado a partir do desenho de verdade (cordas e casas, com os harmônicos de cada corda e o capotraste).
4. Compara os dois com a **similaridade de cosseno** (o "ângulo" entre dois vetores). Se o esperado for parecido o bastante e não perder para outro acorde da música, conta como certo. Se errar, o app diz com qual acorde soou ("Soou como Am").
5. Notas soltas usam o **método MPM** (o mesmo do afinador) para achar a frequência.
6. O atraso do microfone é medido sozinho durante o jogo (ou em Ajustes → Calibrar).

**Busca automática** (`cifras.js`)
- No .apk, o plugin `CapacitorHttp` faz o pedido pelo Android, sem a regra de **CORS** que impede um site de ler outro. É por isso que no navegador não funciona.
- A página da cifra é lida como HTML: cada acorde está num `<b>`; o app guarda **só os acordes**, nunca a letra.
- A **duração** de cada acorde é estimada pela distância até o próximo na linha (cifra não traz o tempo).
- **Capotraste inteligente:** testa capo de 0 a 7, transpõe os acordes e soma o "custo" de cada um (pestana custa caro, acorde aberto custa pouco). Fica com o menor total.

**Gravação do YouTube como relógio** (`youtube.js`): o vídeo é o "relógio-mestre". A cada quadro o jogo compara a posição dele com a do vídeo: diferença pequena, corrige 30% por quadro; diferença grande (o vídeo travou), pula junto. O app usa o player oficial e não baixa nem separa o áudio.

**Som** (`som.js`): para cada nota, pega a gravação mais próxima e muda a velocidade um pouquinho para acertar a afinação exata (assim o capotraste soa certo).

**Vídeos** (`videos/`): os quadros foram desenhados em HTML e fotografados com Playwright; a narração é uma voz sintética (Piper) e o violão vem das mesmas notas gravadas do app; o ffmpeg junta tudo.

---

## 4. A IA em Python (pasta `ia/`)

Projeto de estudo de **machine learning** (o jogo usa o método dos moldes, que aceita capotraste e qualquer acorde).

1. **Dados** (`sintetizador.py`): um violão sintético (Karplus-Strong) gera milhares de acordes com variações (afinação, corda abafada, ruído, sala). Isso é **aumento de dados**.
2. **Características** (`caracteristicas.py`): cada pedaço de áudio vira 24 números (cromagrama + cromagrama só dos graves).
3. **Modelo** (`treinar.py`): rede neural 24 → 96 → 33 (32 acordes + "nenhum").
4. **Resultado** em dados que o modelo nunca viu: **84,6%** (o método antigo de moldes fazia 63,3%).
5. **Exportação:** os pesos viram `modelo-acordes.json`, e o `ia.js` refaz as contas no celular.

```bash
cd ia
pip install -r requirements.txt
python treinar.py
```

**Desafio:** gravar acordes do seu violão, treinar a rede com eles e comparar com o método dos moldes do jogo.

---

## 5. Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura das telas |
| `tema.css` | Visual (preto, branco e vermelho, fonte Jost), tema claro e escuro |
| `data.js` | Acordes, ritmos, curso, melodias e as músicas do catálogo |
| `acordes.js` | Nomes e desenhos de acordes, versões fáceis, sequências |
| `som.js` | Violão gravado, batidas, metrônomo |
| `jogo.js` | O jogo: desenho das cordas, modos, pontuação, microfone |
| `cifras.js` | Busca e leitura de cifras, capotraste inteligente, YouTube |
| `aprender.js` | Curso, lições, professor de acordes, tela Acordes |
| `apostilas.js` | Apostilas, quizzes e mini vídeos |
| `youtube.js`, `gravacao.js` | Player do YouTube, sincronia e tocar junto |
| `audio-detect.js`, `ia.js` | Microfone (ataque, cromagrama, afinador) e rede neural |
| `app.js` | Telas, progresso, ajustes, afinador, integração com o Android |
| `sw.js`, `manifest.webmanifest` | Funcionar offline e instalar como app |
| `sons/`, `fontes/`, `videos/`, `icones/`, `assets/` | Notas gravadas, fonte, mini vídeos, ícones e tela de abertura |

## 6. Limitações
- Use **fone de ouvido** no modo No tempo: sem ele o microfone também ouve o violão do app.
- Lugar barulhento atrapalha: ajuste a **Sensibilidade** em Ajustes.
- A duração dos acordes de músicas buscadas é estimada. Com a gravação sincronizada, o jogo fica bem mais fiel.
- A busca depende do formato das páginas do Cifra Club; se ele mudar, a busca pode parar e o app avisa (dá para colar a cifra).

## 7. Créditos e direitos
- **Sons:** notas gravadas da University of Iowa Electronic Music Studios e de *quartertone* (Freesound), reunidas pelo projeto [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments), licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Detalhes em `sons/CREDITOS.txt`.
- **Fonte:** Jost (SIL Open Font License, `fontes/OFL-Jost.txt`).
- **Narração dos vídeos:** voz "faber" do [Piper](https://github.com/rhasspy/piper).
- **Músicas:** o app não traz letras nem gravações. Guarda só a sequência de acordes; as gravações tocam pelo player oficial do YouTube. As melodias inclusas são de domínio público.
