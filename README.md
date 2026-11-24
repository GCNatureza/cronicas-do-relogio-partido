# ⏳ Crônicas do Relógio Partido

RPG tático no navegador, inspirado em *Final Fantasy Tactics* e *Chrono Trigger*, com regras ao estilo D&D (d20, classe de armadura, testes de resistência, níveis 1–12).

**▶ Jogar:** abra o `index.html` (ou a página do GitHub Pages deste repositório).

## O jogo
- **8 raças** e **10 classes**, com habilidades novas nos níveis 3, 6 e 9 e técnicas em dupla.
- **Campanha em 7 eras:** 21 capítulos e 5 missões paralelas, com escolhas e testes de atributo.
- Mapas isométricos grandes e contínuos, com altura, rotação e câmera que acompanha a ação. Efeitos de luz no estilo HD‑2D.
- Música e efeitos sonoros gerados em tempo real (WebAudio).
- Joga no PC, no celular e na **smart TV com controle** (Gamepad API, teclado ou controle remoto).
- **Cooperativo no sofá:** cada jogador comanda o próprio herói com o seu controle.

> A **mesa online** (multijogador por código, chat e rádio de voz) só funciona quando o jogo é aberto como artefato do Claude. Na versão do GitHub, o modo solo e o cooperativo no sofá funcionam normalmente.

## Código
`index.html` é o jogo completo em um único arquivo. As fontes estão em `src/`; para gerar de novo o arquivo: `cd src && python3 build.py`.

## Créditos e licenças
- **Personagens e monstros:** sprites do [Liberated Pixel Cup (LPC)](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator), sob CC‑BY‑SA 3.0 / GPL 3.0 / OGA‑BY. Os autores estão em [`CREDITOS-SPRITES.txt`](CREDITOS-SPRITES.txt).
- **Itens e objetos:** [0x72 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) (CC0).
- **Fontes:** Cinzel, Cinzel Decorative e Alegreya (Google Fonts, SIL OFL).
- **Ideias de campanha:** adaptadas livremente de campanhas oficiais de D&D 5ª edição e de ideias de campanha de mestres da comunidade.
- **Criação:** Prof. Alex S. Vieira, com Claude.

Como os sprites LPC são CC‑BY‑SA, as artes derivadas deste projeto seguem a mesma licença (CC‑BY‑SA 3.0).
