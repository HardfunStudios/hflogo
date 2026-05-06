# Dialeto Logo — HardFun Logo Editor

Especificação do subconjunto da linguagem Logo implementado no editor visual HardFun Logo. Os blocos Blockly geram chamadas a funções internas (`*CT`) que são executadas dentro de um sandbox JS-Interpreter.

---

## Sistema de coordenadas

- Origem `(0, 0)` no **centro** do canvas.
- Eixo X: positivo para a direita, negativo para a esquerda.
- Eixo Y: positivo para **cima**, negativo para baixo (convenção matemática, não de tela).
- Intervalo útil: aproximadamente `−500` a `+500` em ambos os eixos (dependendo do tamanho do canvas).
- Direção `0°` aponta para o **norte** (cima). Rotação no sentido horário.

---

## Tartaruga — Movimento

| Bloco | Comando interno | Descrição |
|---|---|---|
| `para frente N` | `moveCT(N)` | Move N passos na direção atual |
| `para trás N` | `moveCT(-N)` | Move N passos na direção oposta |
| `vira direita N°` | `turnCT(N)` | Gira N graus no sentido horário |
| `vira esquerda N°` | `turnCT(-N)` | Gira N graus no sentido anti-horário |
| `vai para casa` | `homeCT()` | Retorna à origem `(0,0)` com direção `0°` |
| `vai para posição x X y Y` | `setpositionCT(X, Y)` | Move para coordenada absoluta |
| `vai para posição x X` | `setpositionCT(X, undefined)` | Altera apenas X |
| `vai para posição y Y` | `setpositionCT(undefined, Y)` | Altera apenas Y |
| `muda direção N°` | `setheadingCT(N)` | Define direção absoluta em graus |
| `arco ângulo N° radius R` | `arcCT(N, R)` | Desenha arco de N graus com raio R |
| `aponta x X y Y` | `towardsCT(X, Y)` | Aponta a tartaruga para o ponto (X, Y) |

### Ângulos

O campo de ângulo aceita digitação livre ou seleção via transferidor visual. `0°` = norte. Sentido horário positivo.

---

## Tartaruga — Estado

| Bloco | Comando interno | Tipo | Descrição |
|---|---|---|---|
| `coordenada x` | `getxCT()` | Número | Posição X atual |
| `coordenada y` | `getyCT()` | Número | Posição Y atual |
| `direção` | `getheadingCT()` | Número | Direção atual em graus |
| `mostra tartaruga` | `showCT()` | — | Torna a tartaruga visível |
| `esconde tartaruga` | `hideCT()` | — | Oculta a tartaruga |

---

## Caneta

| Bloco | Comando interno | Descrição |
|---|---|---|
| `muda cor da caneta para N` | `setcolorCT(N)` | Define cor pelo índice (0–139) |
| `muda tamanho da caneta para N` | `setwidthCT(N)` | Define espessura da linha em pixels |
| `levanta caneta` | `penupCT()` | A tartaruga se move sem desenhar |
| `abaixa caneta` | `pendownCT()` | A tartaruga volta a desenhar |
| `preenche` | `fillCT()` | Preenche a área fechada com a cor atual |
| `cor da caneta` | `getcolorCT()` | Número — índice de cor atual |
| `tamanho da caneta` | `getwidthCT()` | Número — espessura atual |
| `caneta levantada?` | `ispendownCT()` | Booleano — `true` se caneta baixada |

### Bloco de cor

O bloco **swatch de cor** exibe um quadrado colorido ao lado do número. Ao alterar o número (0–139) o swatch atualiza; ao clicar no swatch e escolher uma cor, o número atualiza. O valor gerado é sempre o índice numérico.

---

## Paleta de cores

Implementa a paleta **StarLogo/NetLogo**: 140 cores, organizadas em 14 famílias × 10 tons.

| Família | Índice base | Cor |
|---|---|---|
| 0 | 0 | Cinza |
| 1 | 10 | Vermelho |
| 2 | 20 | Laranja |
| 3 | 30 | Marrom |
| 4 | 40 | Amarelo |
| 5 | 50 | Verde |
| 6 | 60 | Lima |
| 7 | 70 | Turquesa |
| 8 | 80 | Ciano |
| 9 | 90 | Azul Céu |
| 10 | 100 | Azul |
| 11 | 110 | Violeta |
| 12 | 120 | Magenta |
| 13 | 130 | Rosa |

Dentro de cada família, o índice `base + 0` é o tom mais escuro e `base + 9` é o mais claro. O tom médio (`base + 5`) é a cor pura da família. Índices fora do intervalo 0–139 são normalizados com módulo 140.

---

## Tela

| Bloco | Comando interno | Descrição |
|---|---|---|
| `limpa` | `clearCT()` | Apaga os desenhos, mantém posição e estado da tartaruga |
| `limpa tela` | `clearscreenCT()` | Apaga desenhos **e** retorna tartaruga à origem |
| `wrap` | `setturtlemodeCT("wrap")` | Tartaruga atravessa as bordas e reaparece no lado oposto |
| `fence` | `setturtlemodeCT("fence")` | Tartaruga para na borda |
| `window` | `setturtlemodeCT("window")` | Tartaruga pode sair da área visível (padrão) |

---

## Controle de fluxo

Usa os blocos padrão Blockly (Controle / Números):

| Bloco | Descrição |
|---|---|
| `Início` (`controls_start`) | Ponto de entrada do programa |
| `pare` (`controls_stop`) | Interrompe a execução |
| `repita N vezes` (`controls_repeat_ext`) | Laço com contador |
| `se … faça` (`controls_if`) | Condicional simples |
| `se … faça … senão` (`controls_if` + else) | Condicional com alternativa |

---

## Números e matemática

Blocos padrão Blockly, categoria **Números**:

| Bloco | Descrição |
|---|---|
| `math_number` | Literal numérico |
| `math_arithmetic` | Operações: `+`, `−`, `×`, `÷`, `^` |
| `math_single` | Funções: raiz, abs, neg, ln, log10, e^x, 10^x |
| `math_trig` | Funções trigonométricas: sin, cos, tan, asin, acos, atan |
| `logic_compare` | Comparações: `=`, `≠`, `<`, `≤`, `>`, `≥` |
| `logic_operation` | Lógica: `e`, `ou` |
| `logic_negate` | Negação lógica |
| `math_change` | Incrementa variável por N |
| `math_modulo` | Resto da divisão |
| `math_random_int` | Inteiro aleatório entre A e B |

---

## Variáveis

Gerenciadas pelo mecanismo nativo do Blockly (categoria **Variáveis**). Variáveis são criadas dinamicamente na interface; os blocos gerados usam `let` / atribuição direta no código JavaScript.

---

## Procedimentos (Ensinar)

Categoria **Ensinar**, mecanismo nativo Blockly:

| Bloco | Descrição |
|---|---|
| `aprenda algo novo` (sem retorno) | Define um procedimento sem valor de retorno |
| `aprenda algo novo` (com retorno) | Define uma função que retorna um valor |
| Chamada de procedimento | Invoca um procedimento definido |

---

## Execução e modo de tempo visível

- O código é compilado de Blockly para JavaScript e executado dentro de um **Web Worker** via `JS-Interpreter` (sandbox isolado).
- A cada instrução executada, o bloco correspondente é destacado no workspace.
- Com o modo **"Mostra passos"** ativo, cada comando de desenho salva um snapshot do canvas. O slider de tempo permite rever passo a passo toda a execução.
- A tartaruga retorna à posição e estado iniciais ao executar um novo programa.

---

## Estado inicial da tartaruga

| Propriedade | Valor padrão |
|---|---|
| Posição | `(0, 0)` — centro do canvas |
| Direção | `0°` — norte |
| Caneta | abaixada |
| Cor | `0` (preto/cinza escuro) |
| Espessura | `1` px |
| Visível | sim |
| Modo de tela | `window` |
