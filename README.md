# ⏳ Crônicas do Relógio Partido

RPG tático no navegador, inspirado em *Final Fantasy Tactics* e *Chrono Trigger*, com regras ao estilo D&D (d20, classe de armadura, testes de resistência, níveis 1–12).

**▶ Jogar:** abra o `index.html` (ou a página do GitHub Pages deste repositório).

## O jogo
- **8 raças** e **10 classes**, com habilidades novas nos níveis 3, 6 e 9 e técnicas em dupla.
- **Campanha em 7 eras:** 21 capítulos e 5 missões paralelas, com escolhas e testes de atributo.
- Mapas isométricos grandes e contínuos, com altura, rotação e câmera que acompanha a ação. Efeitos de luz no estilo HD‑2D.
- Música orquestral, efeitos sonoros e sons de ambiente por cenário (passarinhos, chuva, vento, caverna, fogo…).
- Joga no PC, no celular e na **smart TV com controle** (Gamepad API, teclado ou controle remoto).
- **Cooperativo no sofá:** cada jogador comanda o próprio herói com o seu controle.

- **Mesa online:** um jogador cria a mesa e os outros entram com o código de 4 letras. Tem chat, ditado e **voz ao vivo** (WebRTC, de navegador para navegador). A comunicação passa pelo Firebase Realtime Database (`src/fbnet.js`).

## Código
`index.html` é o jogo completo em um único arquivo. As fontes estão em `src/`; para gerar de novo o arquivo: `cd src && python3 build.py`.

## Créditos e licenças
- **Personagens e monstros:** sprites do [Liberated Pixel Cup (LPC)](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator), sob CC‑BY‑SA 3.0 / GPL 3.0 / OGA‑BY. Os autores estão em [`CREDITOS-SPRITES.txt`](CREDITOS-SPRITES.txt).
- **Música, efeitos e ambiente:** [FLARE](https://github.com/flareteam/flare-game) — música de Brandon Morris e sons da equipe Flare e colaboradores do OpenGameArt, sob CC‑BY‑SA 3.0 (convertidos para MP3 na pasta `audio/`).
- **Itens e objetos:** [0x72 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) (CC0).
- **Fontes:** Cinzel, Cinzel Decorative e Alegreya (Google Fonts, SIL OFL).
- **Ideias de campanha:** adaptadas livremente de campanhas oficiais de D&D 5ª edição e de ideias de campanha de mestres da comunidade.
- **Criação:** Prof. Alex S. Vieira, com Claude.

Como os sprites LPC são CC‑BY‑SA, as artes derivadas deste projeto seguem a mesma licença (CC‑BY‑SA 3.0).
