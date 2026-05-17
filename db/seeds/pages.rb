pages = [
  {
    slug: "sobre-a-plataforma",
    title: "Sobre a Plataforma",
    nav_label: "Sobre a Plataforma",
    position: 1,
    published: true,
    content: <<~HTML
      <h2>O que é o HardFun Logo?</h2>
      <p>HardFun Logo é um ambiente de programação visual educacional inspirado no ensaio <em>Learnable Programming</em> de Bret Victor. Nossa missão é tornar o aprendizado de programação tangível, concreto e visível.</p>
      <p>A plataforma combina três ideias centrais:</p>
      <ul>
        <li><strong>Blocos visuais</strong> — você constrói programas arrastando e encaixando peças, sem precisar decorar sintaxe.</li>
        <li><strong>Tartaruga gráfica</strong> — cada comando move uma tartaruga na tela, desenhando o resultado do seu código de forma imediata.</li>
        <li><strong>Tempo visível</strong> — você pode pausar, voltar e avançar na execução do programa, vendo exatamente o que aconteceu em cada passo.</li>
      </ul>
      <h2>Para quem é?</h2>
      <p>HardFun Logo foi criado para estudantes do ensino fundamental e médio que estão dando os primeiros passos na programação. Professores podem usar a plataforma para criar projetos e compartilhá-los com turmas.</p>
      <h2>Como começar?</h2>
      <p>Crie uma conta gratuita, clique em <strong>Novo Projeto</strong> e comece a arrastar blocos. Não há nada para instalar — tudo roda no navegador.</p>
    HTML
  },
  {
    slug: "o-editor",
    title: "O Editor",
    nav_label: "O Editor",
    position: 2,
    published: true,
    content: <<~HTML
      <h2>Interface do editor</h2>
      <p>O editor é dividido em três áreas principais:</p>
      <ul>
        <li><strong>Área de blocos (esquerda)</strong> — onde você monta seu programa. Arraste blocos da paleta e encaixe-os em sequência.</li>
        <li><strong>Tela da tartaruga (centro)</strong> — exibe o resultado do seu programa em tempo real.</li>
        <li><strong>Barra de controles (baixo)</strong> — botões para executar, pausar e controlar a velocidade.</li>
      </ul>
      <h2>Controles de execução</h2>
      <ul>
        <li><strong>▶ Executar (F5)</strong> — executa o programa do início ao fim.</li>
        <li><strong>■ Parar</strong> — interrompe a execução em andamento.</li>
        <li><strong>→ Passo</strong> — executa um bloco de cada vez, ideal para entender o que cada parte faz.</li>
        <li><strong>Velocidade</strong> — o controle deslizante ajusta a velocidade de execução, da tartaruga lenta à rápida.</li>
      </ul>
      <h2>Mostra passos</h2>
      <p>Quando ativado, o modo <strong>Mostra passos</strong> registra a posição da tartaruga em cada comando. Após a execução, um controle deslizante de tempo aparece — você pode arrastar para ver exatamente o que aconteceu em cada momento do programa.</p>
      <h2>Zoom e navegação</h2>
      <p>Use os botões <strong>+</strong> e <strong>−</strong> para aproximar ou afastar a visão da área de blocos. O botão <strong>⊡</strong> ajusta todos os blocos para caberem na tela.</p>
    HTML
  },
  {
    slug: "tempo-visivel",
    title: "Tempo Visível",
    nav_label: "Tempo Visível",
    position: 3,
    published: true,
    content: <<~HTML
      <h2>O que é Tempo Visível?</h2>
      <p>A ideia de <em>tempo visível</em> vem do ensaio <a href="http://worrydream.com/LearnableProgramming/">Learnable Programming</a> de Bret Victor. Em vez de um programa ser uma caixa preta que produz um resultado, o HardFun Logo torna o processo de execução algo que pode ser observado, pausado e reexaminado.</p>
      <blockquote>
        "A programação é um esporte de espectador? Não deveria ser." — Bret Victor
      </blockquote>
      <h2>Como funciona?</h2>
      <p>Ative o modo <strong>Mostra passos</strong> no editor. Quando você executa um programa:</p>
      <ol>
        <li>A plataforma registra a posição da tartaruga após cada comando.</li>
        <li>Um controle deslizante aparece abaixo da tela.</li>
        <li>Arraste o controle para frente e para trás — a tartaruga salta para a posição registrada naquele momento.</li>
      </ol>
      <p>Além disso, <strong>fantasmas da tartaruga</strong> aparecem em todas as posições anteriores, com opacidade crescente, criando um rastro temporal visível.</p>
      <h2>Por que isso ajuda a aprender?</h2>
      <p>Quando o aluno pode "scrubbar" no tempo, ele relaciona diretamente cada bloco com seu efeito visual. Erros deixam de ser mensagens misteriosas — o estudante vê exatamente onde o programa saiu do esperado e pode voltar ao passo anterior para investigar.</p>
    HTML
  },
  {
    slug: "historia-do-logo",
    title: "História do Logo",
    nav_label: "História do Logo",
    position: 4,
    published: true,
    content: <<~HTML
      <h2>Origens</h2>
      <p>A linguagem Logo foi criada em 1967 por <strong>Seymour Papert</strong>, Wally Feurzeig e Daniel Bobrow no MIT. Papert era matemático e psicólogo, fortemente influenciado por Jean Piaget — ele acreditava que crianças aprendem melhor quando <em>constroem</em> coisas concretas.</p>
      <h2>A tartaruga</h2>
      <p>O elemento mais icônico do Logo é a tartaruga — inicialmente um robô físico que se movia pelo chão e deixava um rastro com uma caneta. Depois, a tartaruga migrou para a tela do computador.</p>
      <p>A ideia era que a criança pudesse se colocar no lugar da tartaruga: <em>"Se eu fosse a tartaruga, o que faria para desenhar um quadrado?"</em> Esse pensamento concreto e corpóreo é chamado de <strong>aprendizado construcionista</strong>.</p>
      <h2>Legado</h2>
      <p>Logo influenciou gerações de linguagens educacionais — de Scratch a Processing, de Python Turtle ao HardFun Logo. A ideia central permanece: programação como meio de expressão e exploração, não apenas como ferramenta técnica.</p>
      <h2>HardFun Logo</h2>
      <p>O nome "HardFun" é uma referência a um conceito do próprio Papert: <em>hard fun</em> — a experiência de resolver algo difícil que ao mesmo tempo é prazerosa. Aprender a programar pode e deve ser assim.</p>
    HTML
  },
  {
    slug: "conceitos-basicos",
    title: "Conceitos Básicos",
    nav_label: "Conceitos Básicos",
    position: 5,
    published: true,
    content: <<~HTML
      <h2>Sequência</h2>
      <p>Programas são listas de instruções executadas em ordem, de cima para baixo. Cada bloco é uma instrução.</p>
      <h2>Variáveis</h2>
      <p>Uma variável é um nome que guarda um valor. No HardFun Logo, você cria variáveis com o bloco <strong>definir</strong> e as usa em qualquer expressão.</p>
      <h2>Repetição</h2>
      <p>O bloco <strong>repita N vezes</strong> executa os blocos internos N vezes seguidas. É perfeito para desenhar formas regulares:</p>
      <pre>repita 4 vezes
  andar 100
  girar 90</pre>
      <p>Isso desenha um quadrado perfeito!</p>
      <h2>Condicionais</h2>
      <p>O bloco <strong>se … então</strong> executa código apenas quando uma condição for verdadeira. Por exemplo: "se o contador for maior que 5, pare".</p>
      <h2>Procedimentos</h2>
      <p>Você pode agrupar blocos em um <strong>procedimento</strong> e dar a ele um nome. Depois, basta chamar esse nome para repetir toda a sequência. É como criar seu próprio bloco personalizado.</p>
      <h2>Funções com retorno</h2>
      <p>Funções são como procedimentos, mas devolvem um valor. Use o bloco <strong>retorna</strong> para especificar o valor de saída.</p>
    HTML
  },
  {
    slug: "referencia-de-comandos",
    title: "Referência de Comandos",
    nav_label: "Referência de Comandos",
    position: 6,
    published: true,
    content: <<~HTML
      <h2>Movimento</h2>
      <table>
        <tr><th>Comando</th><th>Descrição</th></tr>
        <tr><td><code>andar N</code></td><td>Move a tartaruga N passos para frente.</td></tr>
        <tr><td><code>recuar N</code></td><td>Move a tartaruga N passos para trás.</td></tr>
        <tr><td><code>girar N</code></td><td>Gira a tartaruga N graus à direita.</td></tr>
        <tr><td><code>girar esquerda N</code></td><td>Gira a tartaruga N graus à esquerda.</td></tr>
        <tr><td><code>ir para x y</code></td><td>Move a tartaruga para a posição (x, y).</td></tr>
        <tr><td><code>direção N</code></td><td>Define o ângulo absoluto da tartaruga.</td></tr>
        <tr><td><code>origem</code></td><td>Move a tartaruga para o centro (0, 0).</td></tr>
      </table>
      <h2>Caneta</h2>
      <table>
        <tr><th>Comando</th><th>Descrição</th></tr>
        <tr><td><code>caneta baixo</code></td><td>Começa a desenhar ao mover.</td></tr>
        <tr><td><code>caneta cima</code></td><td>Para de desenhar ao mover.</td></tr>
        <tr><td><code>cor caneta</code></td><td>Define a cor da linha.</td></tr>
        <tr><td><code>espessura N</code></td><td>Define a espessura da linha.</td></tr>
        <tr><td><code>cor fundo</code></td><td>Define a cor de fundo da tela.</td></tr>
        <tr><td><code>limpar tela</code></td><td>Apaga todos os desenhos.</td></tr>
      </table>
      <h2>Tartaruga</h2>
      <table>
        <tr><th>Comando</th><th>Descrição</th></tr>
        <tr><td><code>mostrar tartaruga</code></td><td>Torna a tartaruga visível.</td></tr>
        <tr><td><code>esconder tartaruga</code></td><td>Oculta a tartaruga.</td></tr>
      </table>
      <h2>Sensores</h2>
      <table>
        <tr><th>Valor</th><th>Descrição</th></tr>
        <tr><td><code>posição x</code></td><td>Coordenada X atual da tartaruga.</td></tr>
        <tr><td><code>posição y</code></td><td>Coordenada Y atual da tartaruga.</td></tr>
        <tr><td><code>ângulo</code></td><td>Direção atual da tartaruga em graus.</td></tr>
      </table>
      <h2>Controle</h2>
      <table>
        <tr><th>Bloco</th><th>Descrição</th></tr>
        <tr><td><code>repita N vezes</code></td><td>Repete os blocos internos N vezes.</td></tr>
        <tr><td><code>repita sempre</code></td><td>Repete indefinidamente (para com o botão Stop).</td></tr>
        <tr><td><code>repita até</code></td><td>Repete enquanto a condição for falsa.</td></tr>
        <tr><td><code>se … então</code></td><td>Executa blocos se a condição for verdadeira.</td></tr>
        <tr><td><code>se … então … senão</code></td><td>Dois caminhos: verdadeiro ou falso.</td></tr>
        <tr><td><code>aguardar N</code></td><td>Pausa por N milissegundos.</td></tr>
      </table>
    HTML
  },
  {
    slug: "para-educadores",
    title: "Para Educadores",
    nav_label: "Para Educadores",
    position: 7,
    published: true,
    content: <<~HTML
      <h2>Usando HardFun Logo em sala de aula</h2>
      <p>HardFun Logo foi projetado para ser usado por professores de computação, matemática e ciências que querem trazer programação para suas aulas sem precisar instalar nada.</p>
      <h2>Criando projetos para turmas</h2>
      <p>Você pode criar um projeto, desenvolver o código inicial e compartilhar o link com seus alunos. Eles podem fazer um <strong>remix</strong> — uma cópia pessoal — e modificar livremente sem alterar o original.</p>
      <h2>Atividades sugeridas</h2>
      <ul>
        <li><strong>Polígonos regulares</strong> — peça que os alunos desenhem triângulo, quadrado, pentágono e hexágono usando repetição.</li>
        <li><strong>Espirais</strong> — combine repetição com incremento de variável para criar espirais de ângulo fixo.</li>
        <li><strong>Fractais simples</strong> — introduza recursão com procedimentos que chamam a si mesmos.</li>
        <li><strong>Arte generativa</strong> — use números aleatórios para criar desenhos únicos a cada execução.</li>
      </ul>
      <h2>Avaliação com Tempo Visível</h2>
      <p>O modo <strong>Mostra passos</strong> é uma ferramenta de avaliação poderosa: peça ao aluno que explique o que aconteceu em cada passo do programa enquanto arrasta o controle de tempo. Isso revela a compreensão real do código.</p>
      <h2>Conexões curriculares</h2>
      <p>HardFun Logo conecta-se naturalmente com:</p>
      <ul>
        <li><strong>Matemática</strong> — ângulos, coordenadas, polígonos, proporções.</li>
        <li><strong>Arte</strong> — simetria, padrões, composição visual.</li>
        <li><strong>Pensamento computacional</strong> — decomposição, abstração, reconhecimento de padrões.</li>
      </ul>
    HTML
  },
]

pages.each do |attrs|
  page = Page.find_or_initialize_by(slug: attrs[:slug])
  page.assign_attributes(attrs)
  page.save!
  puts "Page: #{page.slug} — #{page.persisted? ? 'saved' : 'error'}"
end
