# Plano: Logo Interpreter nativo

Substituir o pipeline Blockly → JavaScript → JS-Interpreter por Blockly → texto Logo → Logo Interpreter próprio.

---

## Motivação

- O código gerado passa a ser legível e educacional (Logo real, não JS)
- Elimina JS-Interpreter, Acorn 0.4.1 e toda a camada de bridge `*CT()`
- Semântica Logo (recursão, `output`, `stop`, listas) fica natural de implementar
- Abre caminho para um editor de texto Logo ao lado dos blocos

---

## Visão geral da nova arquitetura

```
Blockly workspace
      │
      ▼ (Logo Generator)
  texto Logo
      │
      ▼ (Web Worker)
  Logo Lexer → Logo Parser (AST) → Logo Evaluator
                                        │
                                        ▼
                              postMessage({type:'cmd', ...})
                                        │
                                        ▼
                              Microworld (canvas, tartaruga)
```

O Microworld e o mecanismo de highlight/time-slider **não mudam**. A interface de mensagens do Worker (`cmd`, `highlight`, `done`, `ack`, `stop`) também se mantém idêntica. O que muda é o que está dentro do Worker.

---

## Etapas

### Etapa 1 — Definir a gramática Logo

Definir formalmente o subconjunto a implementar. Baseado no dialeto atual ([docs/dialeto-logo.md](dialeto-logo.md)):

**Primitivos**
- Números: inteiros e decimais (`100`, `-3.14`)
- Booleanos: `verdade`, `falso`
- Strings: `"palavra` (prefixo `"`, sem espaços — estilo Logo clássico)
- Listas: `[a b c]`

**Expressões**
- Operações aritméticas: `soma`, `diferença`, `produto`, `divisão`, `resto`, `potência`
- Notação infixa via parênteses: `(3 + 2)` ou chamada de primitivo: `soma 3 2`
- Comparações: `igual?`, `menor?`, `maior?`
- Lógica: `e`, `ou`, `não`
- Funções matemáticas: `raizq`, `abs`, `seno`, `cosseno`, `tangente`, `int`, `aleatório`

**Comandos de tartaruga** (mapeiam diretamente para as mensagens já existentes)
```
parafrente 100
paratras 50
viradireita 90
viraesquerda 45
vaipara x 0 y 0
mudadireção 180
arco 90 100
casa
mostra
esconde
```

**Caneta**
```
levantacaneta
abaixacaneta
mudacor 15
mudatamanho 2
preenche
```

**Tela**
```
limpa
limpatela
wrap
fence
window
```

**Controle de fluxo**
```
repita 10 [ ... ]
se <cond> [ ... ]
se <cond> [ ... ] [ ... ]   ; se/senão
enquanto <cond> [ ... ]
pare                         ; stop
retorna <expr>               ; output
```

**Variáveis**
```
faça "nome valor
faça "nome :outra + 1
```
Leitura: `:nome`

**Procedimentos**
```
aprenda nomeprocedimento :param1 :param2
  ...corpo...
fim
```

---

### Etapa 2 — Lexer

Arquivo: `editor/js/logo-interpreter/lexer.js`

Tokens:
| Token | Padrão |
|---|---|
| `NUMBER` | `-?[0-9]+(\.[0-9]+)?` |
| `WORD` | `"[^\s\[\]()]+` |
| `VARREF` | `:[a-zA-ZÀ-ú_][a-zA-ZÀ-ú0-9_]*` |
| `IDENT` | `[a-zA-ZÀ-ú_?][a-zA-ZÀ-ú0-9_?]*` |
| `LBRACKET` / `RBRACKET` | `[` / `]` |
| `LPAREN` / `RPAREN` | `(` / `)` |
| `NEWLINE` | separador de instruções |
| `EOF` | fim |

O lexer opera sobre uma string, retorna um array de tokens com `{type, value, line, col}`.

---

### Etapa 3 — Parser (AST)

Arquivo: `editor/js/logo-interpreter/parser.js`

Produz uma AST com os nós:

```js
{ type: 'Program',        body: [...stmts] }
{ type: 'Command',        name: 'parafrente', args: [...exprs] }
{ type: 'Repeat',         times: expr, body: [...stmts] }
{ type: 'If',             cond: expr, then: [...], else: [...] }
{ type: 'While',          cond: expr, body: [...stmts] }
{ type: 'Make',           name: string, value: expr }
{ type: 'ProcDef',        name: string, params: [...], body: [...stmts] }
{ type: 'ProcCall',       name: string, args: [...exprs] }
{ type: 'Stop' }
{ type: 'Output',         value: expr }
{ type: 'NumberLiteral',  value: number }
{ type: 'BoolLiteral',    value: boolean }
{ type: 'WordLiteral',    value: string }
{ type: 'ListLiteral',    items: [...] }
{ type: 'VarRef',         name: string }
{ type: 'BinOp',          op: string, left: expr, right: expr }
{ type: 'UnOp',           op: string, operand: expr }
{ type: 'InfixExpr',      op: string, left: expr, right: expr }
```

O parser é recursivo descendente (sem bibliotecas externas).

---

### Etapa 4 — Evaluator (interpreter)

Arquivo: `editor/js/logo-interpreter/evaluator.js`

- Executa a AST nó a nó
- Mantém uma pilha de **ambientes** (escopo léxico simples: global + 1 por chamada de procedimento)
- Comandos de tartaruga emitem `postMessage({type:'cmd', name, args})` — mesma interface atual
- `highlightBlock` continua sendo emitido para manter o time-slider funcionando
- `Stop` e `Output` implementados via exceções JS leves (`throw new StopSignal()`, `throw new OutputSignal(val)`)

**Pacing** (controle de velocidade) mantido igual ao atual: após cada comando de desenho, o evaluator pausa e aguarda `ack` do thread principal.

---

### Etapa 5 — Logo Generator para Blockly

Arquivo: `editor/js/logo-generator.js`

Substitui o `javascriptGenerator`. Cria um `Blockly.Generator` com nome `'Logo'` e redefine `forBlock` para cada tipo de bloco.

Exemplos de mapeamento:

| Bloco | JS atual | Logo gerado |
|---|---|---|
| `turtle_forward` | `moveCT(100);\n` | `parafrente 100\n` |
| `turtle_right` | `turnCT(90);\n` | `viradireita 90\n` |
| `controls_repeat_ext` | `for(...){...}` | `repita 10 [\n...\n]\n` |
| `controls_if` | `if(...){...}` | `se <cond> [\n...\n]\n` |
| `math_arithmetic` | `(A + B)` | `(A + B)` ou `soma A B` |
| `variables_set` | `x = valor` | `faça "x valor\n` |
| `variables_get` | `x` | `:x` |
| `procedures_defnoreturn` | `function nome(){...}` | `aprenda nome\n...\nfim\n` |

---

### Etapa 6 — Substituir o Worker

Arquivo: `public/editor-assets/js/logo-worker.js` (ou novo `logo-worker-v2.js`)

Remove toda dependência de `acorn_interpreter.js`. O worker passa a:
1. Receber `{type:'run', code: '<texto Logo>'}` 
2. Instanciar `Lexer → Parser → Evaluator`
3. Executar com pacing via `ack`
4. Emitir `{type:'done'}` ao final

A interface de mensagens com o thread principal não muda — `microworld.js` e `ui.js` não precisam de alteração.

---

### Etapa 7 — Painel de texto Logo (opcional, fase 2)

Adicionar um editor de texto (ex: CodeMirror lite ou `<textarea>` simples) que:
- Exibe o código Logo gerado pelos blocos em tempo real
- Permite edição direta do texto
- Ao executar pelo texto, os blocos ficam em modo somente leitura

---

## Ordem de implementação recomendada

1. Lexer + testes unitários (sem DOM, puro JS)
2. Parser + testes unitários
3. Evaluator apenas com comandos de tartaruga e controle básico (`repita`, `se`)
4. Worker substituído — validar que o canvas funciona igual ao atual
5. Logo Generator para Blockly — substituir `javascriptGenerator`
6. Variáveis e procedimentos
7. Funções matemáticas e lógica completa
8. Painel de texto (fase 2)

---

## O que **não** muda

- `microworld.js` — canvas e tartaruga
- `ui.js` — workspace Blockly, slider de tempo, botões run/stop
- Interface Worker ↔ main thread (`cmd`, `highlight`, `ack`, `done`, `stop`)
- Blocos Blockly e toolbox
- Autosave e persistência de projetos

---

## Riscos

| Risco | Mitigação |
|---|---|
| Procedimentos recursivos explodirem a pilha JS | Limite de profundidade configurável + erro claro |
| Expressões infixa vs. prefixo ambíguas | Definir claramente quais operadores aceitam infix (entre parênteses) vs. prefixo |
| Blocos Blockly padrão (math, logic) sem equivalente Logo claro | Mapear para primitivos Logo equivalentes; documentar |
| Pacing/highlight quebrar com o novo evaluator | Manter a mesma lógica de `commandExecuted` + `resumeAfterAck` |
