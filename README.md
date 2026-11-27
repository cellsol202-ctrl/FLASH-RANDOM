# ⚡ Flash Random

Aplicativo de sorteios feito em **React Native (Expo)** com foco em **imersão e usabilidade**. Cada sorteio tem sua própria animação, seus sons e seu clima, sempre com a identidade neon do app.

> Projeto da faculdade (Tecnologia da Informação) e peça de portfólio.

<!-- Coloque aqui as capturas de tela, por exemplo:
![Início](docs/home.png) ![Roleta](docs/roleta.png) ![Resultado](docs/resultado.png)
-->

## Modos de sorteio

| Modo | Como funciona |
|---|---|
| ⚡ **Tambor** | Os nomes giram na vertical, como um caça-níquel; começa em GIRAR e para na hora quando você toca em PARAR (o nome do centro vence). O próprio tambor 3D de bingo (azul, com aros dourados, suporte de dois cavaletes em A de tábuas planas e manivela, como no ícone do modo; tudo desenhado em SVG) é a janela do sorteio: cada nome fica numa faixa arredondada com bonequinho, como no ícone do modo, e as faixas dão a volta no corpo do tambor (30° por nome). A faixa do centro brilha, o tambor gira junto (emendas e manivela) e para com o nome sorteado, que toma a cor do participante. O nome sempre cabe na faixa (a letra encolhe e nomes longos são abreviados). O azul do tambor segue o tema de cor do app (as cores do desenho foram medidas nos pixels do ícone do modo; para voltar à paleta antiga basta trocar `PALETA` para `'classica'` no topo de `DrumArt.js`; também há a chave `MODELO`: `'eletrico'` (padrão: sem manivela, com um motor de ponta brilhante, neon nos aros, núcleo de energia no disco e arcos elétricos enquanto gira, no motor e na borda do aro da esquerda, que somem no modo de movimento reduzido; não há mais raios no fundo da tela); duas setinhas bem pequenas, uma de cada lado do tambor (no mesmo estilo do ponteiro da roleta, inclusive o escolhido no botão de paleta), apontam para a faixa do meio e marcam onde sai o nome vencedor ou `'manivela'` (o modelo com manivela de mão)) |
| 🎡 **Roleta** | Roleta imersiva: toque ou deslize o dedo em qualquer lugar da área (esquerda = horário, direita = anti-horário), com setas de néon de apoio e botão PARAR que para na hora; listas prontas e som de ticks; 6 estilos de roda à escolha (botão de paleta); o estilo **Ouro com luzes** usa o aro dourado com lâmpadas, o botão azul e o ponteiro desenhados pela Alex (`assets/roleta/aro.png`), com as fatias e os nomes desenhados pelo app por baixo do aro; nele o ponteiro é parte da imagem (não balança) e as lâmpadas ficam fixas, e as setinhas do Tambor viram gotas douradas |
| 🎲 **Dados** | Dados 3D em quantidade escolhida (1, 2, 3 ou mais), com cores à escolha e 4 estilos de dado (botão de paleta); o maior número vence. Com mais de 12 participantes, o sorteio é feito em baterias, até 48 |
| 🏁 **Corrida de bolinhas** | Cada participante é uma bolinha brilhante numa pista neon (borda acesa, raias com linhas de luz, largada e chegada iluminadas); a primeira a chegar vence, quem está na frente ganha um anel dourado e os raios podem eliminar bolinhas no caminho. Com mais de 12 participantes, a corrida é feita em baterias (até 48) e os vencedores disputam a final |
| 🪙 **Cara ou coroa** | A moeda gira com física própria e decide entre dois lados: **Cara** (moeda azul com estrela) e **Coroa** (moeda dourada com coroa) |
| #️⃣ **Número** | Escolha o intervalo (por exemplo, de 1 a 100) e quantos números sortear; os dígitos giram como numa slot machine e os sorteados aparecem em bolas de bingo (a última fica dourada). Serve para rifas e bingos, com atalhos prontos, opção de não repetir, lista dos últimos sorteados e compartilhamento do resultado |
| 👆 **Quem começa?** | Todos encostam um dedo na tela e, depois de uma contagem de 3 s, um raio com vibração escolhe um dos dedos (a bolinha de quem foi escolhido fica dourada). O limite de dedos é o número de pessoas escolhido (de 2 a 10), e há uma opção sem toque para quem não consegue usar vários dedos |

Todos os modos terminam numa tela de resultado com troféu, cadeia de raios e som de vitória (nas disputas de Dados e Corrida o troféu leva o selo "1º LUGAR", escrito no idioma escolhido). O resultado pode ser **compartilhado como imagem** (por exemplo, no WhatsApp).

## Recursos

- **7 modos de sorteio**, cada um com animações e sons próprios
- **Dois perfis visuais**, trocáveis em *Ajustes → Perfil*:
  - **Normal**: tema neon com lista de modos
  - **Vidro**: visual de vidro translúcido, com os modos em órbita do raio do app e barra de navegação flutuante
- **4 idiomas** (com bandeiras): Português, English, Español e Deutsch
- **Histórico** dos sorteios feitos
- **Duração configurável** de cada sorteio com botões − e + (Roleta e Corrida de 5 a 60 s, Moeda de 3 a 5 s); os modos de tempo fixo ou automático aparecem com cadeado e explicação
- **Estilo da roleta e dos dados**: botão flutuante de paleta que o usuário **arrasta para onde quiser** (a posição fica salva). Para o menu abrir, é preciso **segurar o botão por 1 segundo** (um anel mostra o progresso), o que evita abrir sem querer; um toque rápido só mostra uma dica. Quem usa leitor de tela abre com toque duplo e move o botão pelas ações do leitor
- **Listas prontas** (jantar, lugares, meses, animais, cores...); no modelo *Cores*, cada bolinha tem a cor do nome escrito
- **Catálogo de 24 cores** para os participantes não repetirem cor em listas grandes
- **Bolinhas brilhantes** na cor de cada participante, com reflexo e cores vivas, na lista de participantes, na Corrida, nos Dados, no Cara ou coroa e no Quem começa?
- **Compartilhar** o resultado como imagem, com dados opcionais do sorteio (nome, local, quem realizou e observações)
- **Acessibilidade**: leitura por voz, texto grande, alto contraste, reduzir movimento, cores com números, alvos de toque maiores, ritmo mais lento e vibração opcional
- **Efeitos** de tela (raios, faíscas, clarões) que podem ser desligados
- **Volume** ajustável e sons sintetizados sob medida para cada modo
- Textos neutros quanto a gênero
- Funciona **offline**, sem conta e sem coletar dados

## Tecnologias

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (JavaScript)
- `expo-audio` (sons), `expo-speech` (voz), `expo-sharing` e `react-native-view-shot` (compartilhar resultado)
- `react-native-svg` e `expo-linear-gradient` (arte, raios e fundos)
- `@react-native-async-storage/async-storage` (configurações e histórico)
- `react-native-safe-area-context`
- Navegação própria, feita com uma pilha de telas no `App.js`

## Como rodar

Requisitos: [Node.js](https://nodejs.org/) (versão LTS) e um celular com o app **Expo Go** ou um emulador Android.

```bash
# 1. clonar o repositório
git clone https://github.com/cellsol202-ctrl/FLASH-RANDOM.git
cd FLASH-RANDOM

# 2. instalar as dependências
npm install

# 3. iniciar o app
npx expo start
```

Depois, escaneie o QR code com o Expo Go (Android) ou pressione `a` no terminal para abrir no emulador.

## Gerar o APK

O APK é gerado na nuvem com o [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

O perfil `preview` do `eas.json` precisa estar configurado com `"buildType": "apk"`. Para publicar na Play Store, use o perfil `production`, que gera o `.aab`.

## Estrutura do projeto

```
flash-random/
├── App.js                 # pilha de telas, configurações e fundo
├── index.js               # ponto de entrada do Expo
├── assets/                # ícone do app, logo, ícones dos modos (o dado tem faces com 3, 4 e 5 bolinhas), aro da roleta (roleta/), moedas, troféus, fontes e sons
└── src/
    ├── screens/           # telas: início, sorteios, resultado, histórico, ajustes
    │   └── home/          # início nos perfis Normal e Vidro
    ├── components/        # botões, cabeçalho, fundo, raios, troféu, moeda, bolinhas (Sphere.js) etc.
    │                      # (DrumArt.js: tambor 3D do modo Tambor, desenhado em SVG em 3 camadas empilhadas, com suporte de tábuas (cavaletes em A abertos 25° da vertical, por fora dos aros, travessa baixa e longarinas no chão) e motor elétrico na ponta do eixo; a tela DrawNamesScreen.js põe as faixas dos nomes e as duas setinhas do vencedor sobre ele)
    ├── looks.js           # estilos de roleta e dados disponíveis no menu e o estilo padrão
    ├── i18n.js            # textos em 4 idiomas
    ├── settings.js        # configurações e perfis
    ├── themes.js          # 7 cores de tema (o azul do app vira outra cor)
    ├── heats.js           # baterias: divide listas grandes em grupos de até 12
    ├── skin.js            # estilos do perfil Vidro
    ├── sounds.js          # catálogo de sons
    ├── raceEngine.js      # lógica da corrida de bolinhas
    └── dice3d.js          # dados 3D
```

## Autores

- **Celso Morais Siqueira Filho**: [LinkedIn](https://www.linkedin.com/in/cellsomsf/)
- **Alex Albuquerque Marcos Vilela**: [GitHub](https://github.com/AlexBr93)

Desenvolvido com apoio de IA (Claude, da Anthropic), com a permissão do professor.

## Licença

Projeto acadêmico. Defina aqui a licença que preferir (por exemplo, MIT) antes de publicar.
