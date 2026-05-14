# Dialeto Logo — HardFun Logo Editor

Especificação do subconjunto da linguagem Logo implementado no editor visual HardFun Logo. Os blocos Blockly geram código Logo que é executado dentro de um Web Worker via avaliador próprio.

---

## Sistema de coordenadas

- Origem `(0, 0)` no **centro** do canvas.
- Eixo X: positivo para a direita, negativo para a esquerda.
- Eixo Y: positivo para **cima**, negativo para baixo (convenção matemática, não de tela).
- Intervalo útil: aproximadamente `−500` a `+500` em ambos os eixos (dependendo do tamanho do canvas).
- Direção `0°` aponta para o **norte** (cima). Rotação no sentido horário.

---

## Tartaruga — Movimento

| Logo | Bloco Blockly | Descrição |
|---|---|---|
| `parafrente N` / `pf N` | `para frente N` | Move N passos na direção atual |
| `paratras N` / `pt N` | `para trás N` | Move N passos na direção oposta |
| `viradireita N` / `vd N` | `vira direita N°` | Gira N graus no sentido horário |
| `viraesquerda N` / `ve N` | `vira esquerda N°` | Gira N graus no sentido anti-horário |
| `casa` | `vai para casa` | Retorna à origem `(0,0)` com direção `0°` |
| `vaipara X Y` | `vai para posição x X y Y` | Move para coordenada absoluta |
| `vaipara_x X` | `vai para posição x X` | Altera apenas X |
| `vaipara_y Y` | `vai para posição y Y` | Altera apenas Y |
| `mudadirecao N` | `muda direção N°` | Define direção absoluta em graus |
| `arco A R` | `arco ângulo A° raio R` | Desenha arco de A graus com raio R |
| `aponta X Y` | `aponta para x X y Y` | Aponta a tartaruga para o ponto (X, Y) |

---

## Tartaruga — Estado (consulta)

| Logo | Bloco Blockly | Tipo | Descrição |
|---|---|---|---|
| `coordenadax` / `xcor` | `coordenada x` | Número | Posição X atual |
| `coordenaday` / `ycor` | `coordenada y` | Número | Posição Y atual |
| `direcao` / `direção` / `heading` | `direção` | Número | Direção atual em graus |
| `distancia X Y` | `distância para x X y Y` | Número | Distância euclidiana da tartaruga até o ponto (X, Y) |
| `direcao_ate X Y` | `direção até x X y Y` | Número | Ângulo (graus) da tartaruga até o ponto (X, Y) |
| `mostra` | `mostra tartaruga` | — | Torna a tartaruga visível |
| `esconde` | `esconde tartaruga` | — | Oculta a tartaruga |

---

## Caneta

| Logo | Bloco Blockly | Descrição |
|---|---|---|
| `mudacor N` | `muda cor da caneta para N` | Define cor pelo índice (0–139) |
| `mudatamanho N` | `muda tamanho da caneta para N` | Define espessura da linha em pixels |
| `mudatom N` | `muda tom N` | Define o tom da cor (0–99; 50 = cor pura) |
| `levantacaneta` / `lc` | `levanta caneta` | A tartaruga se move sem desenhar |
| `abaixacaneta` / `ac` | `abaixa caneta` | A tartaruga volta a desenhar |
| `preenche` | `preenche` | Preenche a área fechada com a cor atual |
| `corcaneta` | `cor da caneta` | Número — índice de cor atual |
| `tamanhocaneta` | `tamanho da caneta` | Número — espessura atual |
| `tomcaneta` | `tom da caneta` | Número — tom atual (0–99) |

---

## Sistema de tom (shade)

O tom modula o brilho da cor ativa, compatível com TurtleArt:

| Tom | Efeito |
|---|---|
| `0` | Preto |
| `1–49` | A cor mesclada com preto (mais escura) |
| `50` | A cor pura (padrão) |
| `51–99` | A cor mesclada com branco (mais clara) |

O tom é aplicado globalmente: todos os comandos de desenho subsequentes usam o tom vigente até que `mudatom` seja chamado novamente. A tela limpa (`limpatela`) reseta o tom para `50`.

---

## Paleta de cores

Implementa a paleta **StarLogo/NetLogo/TurtleArt**: 140 cores, organizadas em 14 famílias × 10 tons.

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

O bloco **swatch de cor** exibe um quadrado colorido ao lado do número. Ao clicar no swatch, uma grade de 14×10 cores é exibida para seleção direta.

---

## Tela

| Logo | Bloco Blockly | Descrição |
|---|---|---|
| `limpa` | `limpa` | Apaga os desenhos, mantém posição e estado da tartaruga |
| `limpatela` | `limpa tela` | Apaga desenhos **e** retorna tartaruga à origem |
| `wrap` | `wrap` | Tartaruga atravessa as bordas e reaparece no lado oposto |
| `fence` | `fence` | Tartaruga para na borda |
| `window` | `window` | Tartaruga pode sair da área visível (padrão) |

---

## Controle de fluxo

| Logo | Bloco Blockly | Descrição |
|---|---|---|
| `repita N [corpo]` | `repita N vezes` | Laço com contador fixo |
| `enquanto [cond] [corpo]` | `enquanto … faça` | Laço condicional |
| `se [cond] [então]` | `se … faça` | Condicional simples |
| `se [cond] [então] [senão]` | `se … faça … senão` | Condicional com alternativa |
| `pare` | `pare` | Interrompe o procedimento atual |
| `retorna expr` | bloco de retorno | Retorna um valor de um procedimento-função |

A condição do `enquanto` e do `se` pode ser escrita entre colchetes: `[(:x <= 230)]` é equivalente a `(:x <= 230)`.

---

## Números e matemática

### Operadores aritméticos

| Logo | Descrição |
|---|---|
| `A + B` | Adição |
| `A - B` | Subtração |
| `A * B` | Multiplicação |
| `A / B` | Divisão |
| `A ^ B` | Potenciação |
| `A % B` | Resto (módulo) |

### Funções numéricas

| Logo | Descrição |
|---|---|
| `abs N` | Valor absoluto |
| `int N` | Truncamento inteiro |
| `arredonda N` | Arredondamento |
| `raizq N` | Raiz quadrada |
| `potencia A B` | A elevado a B |
| `maximo A B` | Máximo entre A e B |
| `minimo A B` | Mínimo entre A e B |
| `resto A B` | Resto da divisão |
| `soma A B` | Soma (alternativa ao `+`) |
| `diferenca A B` | Subtração (alternativa ao `-`) |
| `produto A B` | Multiplicação (alternativa ao `*`) |
| `divisao A B` | Divisão (alternativa ao `/`) |

### Funções trigonométricas (graus)

| Logo | Descrição |
|---|---|
| `seno N` | Seno |
| `cosseno N` | Cosseno |
| `tangente N` | Tangente |
| `arcoseno N` | Arcoseno |
| `arcocosseno N` | Arcocosseno |
| `arcotangente N` | Arcotangente |
| `ln N` | Logaritmo natural |
| `log N` | Logaritmo base 10 |
| `exp N` | e^N |

### Aleatório

| Logo | Bloco Blockly | Descrição |
|---|---|---|
| `aleatorio N` | — | Inteiro aleatório em `[0, N)` |
| `inteiroentre A B` | `inteiro entre A e B` | Inteiro aleatório em `[A, B]` |

### Comparações e lógica

| Logo | Descrição |
|---|---|
| `A = B` | Igualdade |
| `A <> B` | Diferença |
| `A < B` / `A <= B` / `A > B` / `A >= B` | Comparações |
| `A e B` / `A and B` | E lógico |
| `A ou B` / `A or B` | Ou lógico |
| `nao A` / `not A` | Negação |

---

## Variáveis

```logo
faça "nome valor       ; atribui valor à variável "nome"
:nome                  ; lê o valor da variável "nome"
```

Variáveis são globais por padrão. Dentro de procedimentos, os parâmetros têm escopo local.

---

## Procedimentos

```logo
aprenda nome_proc :param1 :param2
  ; corpo
fim

aprenda nome_func :param
  ; corpo
  retorna expressão
fim
```

- Procedimentos sem `retorna` são chamados como comandos: `nome_proc arg1 arg2`.
- Procedimentos com `retorna` são chamados como expressões: `faça "x (nome_func arg)`.
- Chamadas dentro de expressões (e.g. `faça "x (junco :x)`) executam todos os comandos de desenho normalmente — o valor de retorno é o resultado de `retorna`.

---

## Execução e modo de tempo visível

- O código é executado dentro de um **Web Worker** com avaliador próprio (sem `eval`/`new Function`).
- A cada instrução executada, o bloco correspondente é destacado no workspace.
- Com o modo **"Mostra passos"** ativo, cada comando de desenho salva um snapshot do canvas. O slider de tempo permite rever passo a passo toda a execução.
- Erros de execução são exibidos em um banner vermelho na interface; clicar em ✕ o fecha.
- A tartaruga retorna à posição e estado iniciais ao executar um novo programa.

---

## Estado inicial da tartaruga

| Propriedade | Valor padrão |
|---|---|
| Posição | `(0, 0)` — centro do canvas |
| Direção | `0°` — norte |
| Caneta | abaixada |
| Cor | `0` (cinza escuro) |
| Espessura | `1` px |
| Tom | `50` (cor pura) |
| Visível | sim |
| Modo de tela | `window` |

---

## Syntax highlight (editor Logo)

O editor de texto Logo destaca automaticamente:

| Categoria | Cor | Exemplos |
|---|---|---|
| Comentário | itálico | `; comentário` |
| String/word | — | `"nome` |
| Variável | — | `:x` |
| Número | — | `42`, `-3.14` |
| Controle | negrito | `repita`, `enquanto`, `se`, `pare`, `retorna` |
| Definição | negrito | `aprenda`, `para` |
| Atribuição | — | `faça` |
| Booleano | — | `verdade`, `falso` |
| Operador lógico | — | `e`, `ou`, `nao` |
| Movimento | — | `parafrente`, `pf`, `arco`, `aponta`, … |
| Caneta | — | `mudacor`, `mudatamanho`, `mudatom`, … |
| Tela | — | `limpa`, `limpatela`, `wrap`, … |
| Funções/consultas | — | `coordenadax`, `tamanhocaneta`, `inteiroentre`, `distancia`, … |
