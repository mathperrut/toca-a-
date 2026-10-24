# Toca Aí — app de violão com música brasileira

App **Android (.apk)** para aprender violão com samba, pagode, MPB, bossa nova e baião: jogo nas cordas, músicas tocando junto com a **gravação original pelo YouTube**, e uma **IA treinada em Python** que reconhece os acordes que você toca.

| Parte | Linguagem | O que faz |
|---|---|---|
| App (raiz da pasta) | HTML, CSS, JavaScript | Telas, lições, jogos, afinador, metrônomo |
| `capacitor.config.json`, `package.json`, `android-build/` | JSON + JavaScript (Node) | Empacotam o app como **app Android (.apk)** com o Capacitor |
| `.github/workflows/apk.yml` | YAML (GitHub Actions) | Robô que **gera o .apk sozinho** na nuvem a cada atualização |
| `youtube.js` | JavaScript | Player oficial do YouTube sincronizado com o jogo |
| `ia/` | **Python** (NumPy, SciPy, scikit-learn) | Gera dados, treina a rede neural e exporta `modelo-acordes.json` |

---

## 1. Instalar no seu Android (.apk)

O .apk é gerado de graça pelo **GitHub Actions** (um computador do GitHub compila o app para você). Você faz isso **uma vez** e depois só baixa o app no celular.

### 1.1 Subir o projeto para o GitHub
1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Clique em **New repository**, nome `toca-ai`, marque **Public** e clique em **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Extraia o `toca-ai.zip` no computador, abra a pasta `toca-ai` e **arraste tudo que está dentro dela** para a página (não a pasta em si). Clique em **Commit changes**.

> **Atenção à pasta `.github`:** ela começa com ponto e fica **oculta** em alguns computadores (Mac e Linux), então pode não ser enviada. Confira se o repositório mostra a pasta `.github`. Se não mostrar: **Add file → Create new file**, digite o nome `.github/workflows/apk.yml`, cole o conteúdo do arquivo `apk.yml` (abra com o Bloco de Notas ou o VS Code) e clique em **Commit changes**.

### 1.2 Esperar o robô gerar o app
1. Abra a aba **Actions** do repositório. Vai aparecer **"Gerar APK Android"** rodando (bolinha amarela).
2. Leva **5 a 10 minutos**. Quando ficar verde ✓, está pronto.
3. Se ficar vermelho ✗, clique nele, depois no passo que falhou, copie o erro e me mande.

### 1.3 Instalar no celular
1. No **celular**, abra `https://github.com/SEU-USUARIO/toca-ai/releases/latest`.
2. Toque em **TocaAi.apk** para baixar e depois em **Abrir**.
3. O Android vai avisar que é um app de "fonte desconhecida" (ele não veio da Play Store). Toque em **Configurações → Permitir desta fonte** e volte para instalar.
4. Pronto: o **Toca Aí** aparece na tela inicial como qualquer app.

Na primeira vez que usar o afinador ou um jogo com microfone, o Android pergunta se o app pode usar o microfone: toque em **Permitir**.

### Atualizar o app
Toda vez que você mudar algo e enviar para o GitHub, o robô gera uma versão nova em **Releases**. Baixe e instale **por cima**: o seu progresso continua, porque toda versão usa a mesma assinatura (`android-build/debug.keystore`).

> **Sobre a assinatura:** o arquivo `debug.keystore` é uma chave de "uso pessoal" (senha `android`). Ela serve para instalar no seu celular. Para publicar na **Play Store** você precisaria criar uma chave própria e secreta (e nunca colocá-la num repositório público).

### Outras formas de usar
- **Pelo navegador (PWA):** em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. O app fica em `https://SEU-USUARIO.github.io/toca-ai/`; no Chrome do celular, toque em **Instalar app**.
- **No computador:** na pasta, rode `python -m http.server 8000` e abra `http://localhost:8000`.
- **Gerar o .apk no seu PC** (opcional, precisa do Android Studio): `npm install`, `npm run android`, `npx cap open android` e, no Android Studio, **Build → Build APK**.

---

## 2. Músicas com a gravação original (YouTube)

As gravações do Jorge Ben Jor têm **direitos autorais**. Estar no YouTube ou no Spotify não deixa uma música livre para copiar. Por isso o app **não baixa nem guarda o áudio**: ele usa o **player oficial do YouTube**, que é a forma permitida de tocar um vídeo dentro de outro app.

- As 5 músicas do catálogo já vêm com o vídeo do canal oficial **"Jorge Ben Jor - Topic"** (publicado pela gravadora).
- Para qualquer outra música: na tela dela, cole o link do YouTube (no app do YouTube: **Compartilhar → Copiar link**).
- **Sincronize uma vez** (uns 20 segundos): toque o vídeo e, quando entrar o 1º acorde, toque em **Bater no tempo** junto com a música. Depois disso, o **jogo nas cordas anda junto com o vídeo**, e por cima do vídeo aparece o acorde da vez.
- **Velocidades:** o YouTube aceita só algumas velocidades. O app pede 60%/80%/100% e usa a mais próxima que o YouTube permitir (mostra no topo do jogo, por exemplo "vídeo a 75%").
- Precisa de **internet**. Sem internet, o jogo usa o violão gravado do app.

**Como o jogo acompanha o vídeo:** o vídeo é o "relógio-mestre". A cada quadro o jogo compara onde ele está com onde o vídeo está. Diferença pequena: corrige 30% por quadro, sem tranco. Diferença grande (o vídeo parou para carregar): o jogo pula junto. Nos testes, o jogo ficou a menos de 30 ms do vídeo, e depois de uma travada de 1 s ele se realinhou no quadro seguinte.

**Regras do YouTube que o app segue:** o vídeo fica visível (no mínimo 200×200 px), o áudio não é separado nem gravado, e a velocidade é mudada pela própria API do player.

**Se aparecer "erro 153" ou "erro 152":** o YouTube recusou o player naquele aparelho. O app já envia a origem da página (o robô configura o app com o endereço `SEU-USUARIO.github.io`), o que costuma resolver. Se mesmo assim acontecer, use o botão **Abrir no YouTube** ou importe um arquivo de áudio seu (seção "Tocar junto com a gravação").

---

## 3. Como o app ensina (baseado nos apps de violão para iniciantes)

O formato foi inspirado em como os principais apps ensinam quem nunca tocou:
- **JustinGuitar:** poucos acordes por vez, a batida mais simples primeiro (4 para baixo) e o treino **"1 minuto de trocas"**.
- **Simply Guitar:** uma pergunta no começo ("você já toca?") que leva ao ponto certo, e músicas liberadas conforme você aprende os acordes.
- **Chordify:** tocar junto com uma **linha do tempo de acordes** sincronizada com a gravação, com **acordes simplificados** por padrão.

### O curso
6 unidades, 24 lições de 2 a 5 minutos. Cada lição tem **uma ideia por tela** e um botão **Continuar**. Toda unidade termina com uma **música de verdade** que usa só o que você aprendeu:

| Unidade | Você aprende | Música no fim |
|---|---|---|
| 1. Comece aqui | partes do violão, afinar, ler um acorde | — |
| 2. Seus primeiros acordes | Em7 (1 dedo), Am7 (2), Bm7 (3), batida ↓↓↓↓ | Taj Mahal |
| 3. C e Dm7 | C, Dm7, batida ↓↑ | Magnólia |
| 4. Acordes com sétima | G7, C7, D7 | País Tropical |
| 5. Bossa | A7, E7 | Chove Chuva |
| 6. Acordes maiores básicos | G, D, A, E, Am, Em | — |

Nada fica trancado: o app só sugere a ordem.

### Como um acorde é ensinado
1. Desenho grande, como o violão em pé na sua frente (6ª corda à esquerda, nome das cordas embaixo).
2. **Dedo a dedo:** "Dedo 1 (indicador) na casa 1 da 2ª corda (Si)". Só aparece o dedo da vez, piscando.
3. **Ouvir** o acorde ou **corda por corda** (para achar a corda abafada).
4. **Conferir no microfone:** a IA diz se soou como o acorde certo.

### Tocar junto
- **Em cima:** o acorde da vez (grande, com o desenho) e o **próximo**, com aviso "troca em 3, 2, 1".
- **Embaixo:** blocos de acordes passando, com as setas da batida (↓ ↑) e a contagem 1 2 3 4.
- **Mão direita:** "Só na troca" (1 batida por acorde), "1 por tempo" ou "Ritmo da música".
- **Acordes fáceis** (ligado por padrão): troca cada acorde pela versão com menos dedos e sem pestana da mesma família (ex.: Em → Em7, E7(9) → E7, Bm → Bm7).
- **Sem pontos** por padrão: é só tocar junto. Pontuação na tela ou pelo microfone fica em "Mais opções".

### Som de violão de verdade
- Os acordes tocam com **45 notas gravadas de um violão de náilon** (de Mi2, a 6ª corda solta, até Dó6), na pasta `sons/violao-nylon/`.
- Para cada nota o app pega a gravação mais próxima e ajusta a velocidade um tiquinho para acertar a afinação exata (assim o capotraste também soa certo).
- Quando a mesma corda é tocada de novo, a nota anterior para, como num violão real.
- Em **Ferramentas > Som do violão** dá para trocar entre **Gravado** e **Sintetizado**.
- **Créditos:** soundfont *Fluid R3 GM* (Frank Wen), convertido pelo projeto [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), licença [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/). Detalhes em `sons/CREDITOS.txt`.
- Abrindo o `index.html` direto (dois cliques), o navegador bloqueia o carregamento dos sons e o app usa o sintetizado. Com Live Server ou GitHub Pages, o som gravado funciona (e fica guardado para uso offline).

### Tocar junto com a gravação da música
O app **não inclui as gravações originais** (direitos autorais). Mas você pode usar um arquivo de áudio que **você** tenha:
1. Abra a música e toque em **Importar áudio** (MP3, M4A, WAV). O arquivo fica **só no seu aparelho** (IndexedDB) e não é enviado para lugar nenhum.
2. Toque em **Sincronizar**: dê play e, quando entrar o 1º acorde, toque em **Bater no tempo** junto com a música, pelo menos 8 vezes.
3. O app traça a **reta que melhor passa pelas suas batidas** (regressão linear): a inclinação dá o andamento (BPM) e o ponto inicial dá onde começa o 1º acorde. Toque em **Testar** para ouvir o metrônomo junto com a música e ajuste com −/+ se precisar.
4. Pronto: a **prévia** passa a tocar a música de verdade mostrando o acorde da vez, e o **jogo** anda junto com a gravação.

Como funciona por dentro (`gravacao.js`):
- **Lento/Médio**: o `<audio>` muda a velocidade **sem mudar o tom** (`preservesPitch`).
- O app compara a cada quadro onde a gravação está com onde deveria estar e acelera ou freia até 6% para alcançar. Nos testes, o atraso caiu de ~65 ms para ~10 ms em 3 segundos.
- **Limitação:** o jogo segue a sequência de acordes do app. Se o arranjo do app for diferente da gravação (repetições, introdução), use **Copiar para editar** e ajuste as seções. Músicas tocadas por pessoas também "respiram" no andamento, então em músicas longas pode haver pequenas diferenças.

### A IA que pesquisa músicas (`busca.js`)
- Usa a **API do Claude** com a ferramenta de **busca na web** (modelo `claude-haiku-5-5`, o mais barato).
- É **paga por uso**: cada busca na web custa US$ 0,01 mais o processamento (no total, alguns centavos de dólar por música). Crie a chave em [platform.claude.com](https://platform.claude.com/) e cole em **Ferramentas > Busca com IA**.
- A chave fica só no `localStorage` do seu celular. **Não coloque a chave no código nem no GitHub**: qualquer pessoa que abrir o site veria.
- A IA devolve um JSON com seções e acordes; o app confere os campos, gera o desenho de acordes que não conhece (pestana E/A) e simplifica extensões (ex.: `C7(9)` vira desenho de `C7`).
- Sempre confira com a gravação: a IA pode errar.

## 4. A IA de reconhecimento (pasta `ia/`)

### O problema
Descobrir qual acorde está soando a partir do som do microfone.

### O caminho (pipeline clássico de machine learning)

1. **Dados** (`sintetizador.py`): gravar milhares de acordes à mão é inviável, então um "violão sintético" (algoritmo Karplus-Strong) gera os exemplos. Para ficar parecido com a vida real, cada exemplo varia: afinação imperfeita, corda abafada, batida pra cima ou pra baixo, ruído de fundo, acorde anterior ainda soando, corpo do violão. Isso se chama **aumento de dados**.
2. **Características** (`caracteristicas.py`): cada pedaço de áudio (~0,18 s) vira **24 números**: a força de cada uma das 12 notas (cromagrama) + as 12 notas só nos graves (ajuda a achar o baixo do acorde).
3. **Modelo** (`treinar.py`): uma **rede neural** pequena (24 → 96 neurônios → 33 saídas: 32 acordes + "nenhum").
4. **Avaliação**: testamos em dados que o modelo **nunca viu**, e comparamos com o método antigo (moldes de acorde).
5. **Exportação**: os pesos viram `modelo-acordes.json`. O `ia.js` refaz as mesmas contas no celular.

### Resultado (teste sintético)

| Método | Acerto entre 32 acordes |
|---|---|
| Moldes (método antigo) | 63,3% |
| **Rede neural** | **84,6%** |
| Rede neural escolhendo entre 2 acordes (jogo de Trocas) | 99,4% |

Os erros que sobram fazem sentido musicalmente: G × G7M, E7 × E7(9), D7 × D7(9) (diferem em uma nota só). No jogo da música, no modo microfone, a IA confere o acorde a cada troca.

**Garantia de que Python e celular calculam igual:** o teste de paridade comparou as características do Python e do JavaScript: diferença máxima de 0,00000000000000017.

### Rodar o treino no seu PC

```bash
cd ia
pip install -r requirements.txt
python treinar.py
```

Leva alguns minutos (usa todos os núcleos do processador). Ele substitui o `modelo-acordes.json` e o `modelo-acordes.js` na raiz.

### Ensinar a IA com o SEU violão (o passo que mais melhora)

A IA aprendeu com violão sintético. Violão de verdade, microfone de celular e o seu quarto são diferentes. Para ela se adaptar:

1. No app: **Ferramentas → Ensinar a IA com o seu violão**.
2. Escolha um acorde, toque em **Gravar 5 batidas** e toque. Repita com vários acordes (quanto mais, melhor; tente 3 rodadas de cada).
3. Toque em **Exportar amostras** (ou Copiar e cole num arquivo `amostras-toca-ai.json`).
4. No PC:
   ```bash
   python treinar.py --amostras amostras-toca-ai.json
   ```
   As suas amostras valem 10× mais no treino. O script mostra o acerto nas suas amostras de teste.
5. Envie os novos `modelo-acordes.json` e `modelo-acordes.js` para o GitHub e aumente a `VERSAO` no `sw.js`.

Isso se chama **ajuste fino com dados reais**, uma técnica usada em IA de verdade.

---

## 5. Como o código está organizado

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura das telas |
| `style.css` | Visual, tema claro/escuro |
| `data.js` | Conteúdo: acordes, lições, ritmos, missões. **O Python também lê os acordes daqui** |
| `audio-detect.js` | Microfone: afinador, detector de batidas, reconhecimento de acorde |
| `ia.js` | FFT, características e rede neural no celular |
| `estrada.js` | Jogo nas cordas (canvas), braço do violão, prévia sonora, desenho de qualquer acorde |
| `busca.js` | Busca de músicas: catálogo, IA com busca na web, colar cifra |
| `gravacao.js` | Importar sua gravação, sincronizar batendo no tempo, tocar junto |
| `youtube.js` | Player oficial do YouTube, vídeo como relógio-mestre do jogo |
| `aprender.js` | Curso: desenho de acorde, professor dedo a dedo, lições em passos, Início, Aprender, Acordes, boas-vindas |
| `minimal.css` | Visual minimalista (v3): cores, fontes e as telas novas |
| `capacitor.config.json` | Configuração do app Android (nome, ID, cores, barras do sistema) |
| `android-build/` | Scripts do build Android e a chave de assinatura pessoal |
| `assets/` | Ícone e tela de abertura do app Android |
| `.github/workflows/apk.yml` | Robô do GitHub que gera e publica o .apk |
| `sons/` | Notas gravadas de violão (CC BY 3.0) e créditos |
| `app.js` | Lógica: XP, jogos, telas, salvamento, PWA |
| `sw.js` | Service worker: guarda o app no celular para abrir offline |
| `manifest.webmanifest` | Nome, ícone e cores do app instalado |
| `modelo-acordes.json` / `.js` | Pesos da rede neural treinada (o `.js` é cópia para abrir o app direto do arquivo) |
| `ia/` | Código Python de treino |

### Detecção sonora (resumo)
- **Afinador**: método MPM. Compara a onda com ela mesma deslocada; quando encaixa, o deslocamento é um período. Frequência = 1 / período.
- **Batidas**: detecta o "estalo" do ataque (`x[n] − x[n−1]`), não o volume, porque no ritmo a batida anterior ainda está soando. Calibre o atraso em Ferramentas → Microfone.
- **Acordes**: rede neural (acima). Sem o modelo, o app volta para o método de moldes.

### Limitações
- Use **fone de ouvido** nos jogos com microfone: sem ele o microfone escuta o clique.
- Ambientes barulhentos atrapalham. Ajuste a **Sensibilidade**.
- O acerto de 84,6% é em dados sintéticos. No violão real será menor até você ensinar a IA com suas amostras.
- Não é publicado na Play Store (PWA instala direto do navegador).

---

## 6. Próximos desafios para você

1. **Rede convolucional (CNN)** sobre o espectrograma inteiro, em vez de 24 números. Biblioteca: `tensorflow` ou `pytorch`, exportando para `tensorflow.js`.
2. **Detectar acorde + tempo juntos** no "Tocar junto" das músicas.
3. **Publicar na Play Store**: criar uma chave de assinatura própria (guardada como segredo no GitHub) e gerar um `.aab` com `./gradlew bundleRelease`.
4. **Exportar/importar progresso** para trocar de celular.

## Sobre as músicas
O app **não traz letras nem cifras completas**, por direitos autorais. Você procura a cifra e cola só a sequência de acordes na aba Músicas.
