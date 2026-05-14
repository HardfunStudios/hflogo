'use strict';
import { COLORS as C } from './logo-colors.js';

// ── Token patterns (order matters) ───────────────────────────────────────────
const TOKENS = [
  // Comments — must come first
  { re: /;[^\n]*/g,                                          cls: 'hl-comment' },

  // Quoted word (Logo string literal like "nome)
  { re: /"[^\s\[\]()]+/g,                                   cls: 'hl-string' },

  // Variable reference :nome
  { re: /:[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*/g,   cls: 'hl-varref' },

  // Numbers
  { re: /-?\b\d+(\.\d+)?\b/g,                               cls: 'hl-number' },

  // Control keywords
  { re: /\b(repita|enquanto|se|senão|senao|fim|pare|retorna|output)\b/gi, cls: 'hl-control' },

  // Procedure definition
  { re: /\b(aprenda|para)\b/gi,                             cls: 'hl-proc' },

  // Variable assignment
  { re: /\b(faça|faca|make)\b/gi,                           cls: 'hl-variable' },

  // Boolean literals
  { re: /\b(verdade|falso|true|false)\b/gi,                 cls: 'hl-boolean' },

  // Logical operators
  { re: /\b(e|ou|nao|não|and|or|not)\b/gi,                 cls: 'hl-operator' },

  // Turtle / motion commands
  { re: /\b(parafrente|pf|paratras|pt|viradireita|vd|viraesquerda|ve|vaipara|vaipara_x|vaipara_y|mudadirecao|mudadireção|casa|mostra|esconde|arco|aponta)\b/gi, cls: 'hl-turtle' },

  // Pen commands
  { re: /\b(mudacor|mudatamanho|mudatom|levantacaneta|lc|abaixacaneta|ac|preenche)\b/gi, cls: 'hl-pen' },

  // Screen commands
  { re: /\b(limpa|limpatela|wrap|fence|window)\b/gi,        cls: 'hl-screen' },

  // Math / query functions
  { re: /\b(inteiroentre|aleat[oó]rio(entre)?|aleatorioentree|aleatorio_entre|coordenadax|xcor|coordenaday|ycor|dire[cç][aã]o|heading|tamanhocaneta|corcaneta|tomcaneta|distancia|direcao_ate|abs|int|arredonda|raizq|seno|cosseno|tangente|arcoseno|arcocosseno|arcotangente|ln|log|exp|soma|produto|resto|pot[eê]ncia|diferen[cç]a|m[aá]ximo|m[ií]nimo)\b/gi, cls: 'hl-number' },

  // Arithmetic operators
  { re: /[+\-*/^%=<>]/g,                                    cls: 'hl-operator' },

  // Brackets
  { re: /[\[\]()]/g,                                        cls: 'hl-punctuation' },
];

// ── CSS injected once ─────────────────────────────────────────────────────────
const CSS = `
.hl-comment     { color: ${C.comment};     font-style:italic }
.hl-string      { color: ${C.string}      }
.hl-varref      { color: ${C.varref}      }
.hl-number      { color: ${C.number}      }
.hl-control     { color: ${C.control};    font-weight:600 }
.hl-proc        { color: ${C.proc};       font-weight:600 }
.hl-variable    { color: ${C.variable}    }
.hl-boolean     { color: ${C.boolean}     }
.hl-operator    { color: ${C.operator}    }
.hl-turtle      { color: ${C.turtle}      }
.hl-pen         { color: ${C.pen}         }
.hl-screen      { color: ${C.screen}      }
.hl-punctuation { color: ${C.punctuation} }
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ── Escape HTML (before we wrap with <span>) ──────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Core tokeniser ────────────────────────────────────────────────────────────
// Returns an array of {start, end, cls} sorted by position (non-overlapping).
function tokenise(code) {
  const spans = [];
  const taken = new Uint8Array(code.length); // 1 if position already claimed

  for (const { re, cls } of TOKENS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(code)) !== null) {
      const s = m.index, e = m.index + m[0].length;
      // Skip if any character in this range is already claimed
      let clash = false;
      for (let i = s; i < e; i++) { if (taken[i]) { clash = true; break; } }
      if (clash) continue;
      for (let i = s; i < e; i++) taken[i] = 1;
      spans.push({ s, e, cls });
    }
  }

  spans.sort((a, b) => a.s - b.s);
  return spans;
}

// ── Build highlighted HTML ────────────────────────────────────────────────────
export function highlightLogo(code) {
  const spans = tokenise(code);
  let html = '';
  let pos = 0;
  for (const { s, e, cls } of spans) {
    if (pos < s) html += escHtml(code.slice(pos, s));
    html += `<span class="${cls}">${escHtml(code.slice(s, e))}</span>`;
    pos = e;
  }
  if (pos < code.length) html += escHtml(code.slice(pos));
  return html;
}

// ── Mount: wire a textarea to a backdrop <pre> ────────────────────────────────
//
// DOM structure expected:
//   #logoEditorWrap (position:relative)
//     #logoHighlightBackdrop  ← we create this
//     #logoCodeEditor         (textarea, position:relative; z-index:0)
//
// The backdrop sits behind the textarea and shows coloured text.
// The textarea is made colour:transparent / caret-color:white so only the
// backdrop colours are visible, while keyboard input still goes to the textarea.

// CSS properties that affect text layout and must match exactly between
// the textarea and the pre backdrop.
const MIRROR_PROPS = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
  'lineHeight', 'letterSpacing', 'wordSpacing',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'boxSizing', 'tabSize',
];

export function mountHighlighter(textarea) {
  injectCSS();

  const wrap = textarea.parentElement;

  const pre = document.createElement('pre');
  pre.id = 'logoHighlightPre';

  // Mirror textarea's computed layout so text positions match pixel-perfect
  const cs = window.getComputedStyle(textarea);
  MIRROR_PROPS.forEach(p => { pre.style[p] = cs[p]; });

  Object.assign(pre.style, {
    position:      'absolute',
    top:           '0', left: '0', right: '0', bottom: '0',
    margin:        '0',
    whiteSpace:    'pre',
    wordWrap:      'normal',
    overflowX:     'auto',
    overflowY:     'auto',
    // Hide scrollbars — textarea's scrollbars are on top and are the ones used
    scrollbarWidth: 'none',
    color:         '#d4d4d4', // default text colour; spans override with token colours
    background:    'transparent',
    pointerEvents: 'none',
    zIndex:        '0',
  });

  // Hide webkit scrollbar on pre
  const noScrollStyle = document.createElement('style');
  noScrollStyle.textContent = '#logoHighlightPre::-webkit-scrollbar { display:none }';
  document.head.appendChild(noScrollStyle);

  wrap.insertBefore(pre, textarea);

  // Make selection visible on transparent textarea
  const selStyle = document.createElement('style');
  selStyle.textContent = '#logoCodeEditor::selection { background: rgba(255,255,255,0.18); color: transparent; }';
  document.head.appendChild(selStyle);

  // Ensure textarea is above pre
  textarea.style.zIndex      = '1';
  textarea.style.position    = 'absolute';
  textarea.style.top         = '0';
  textarea.style.left        = '0';
  textarea.style.right       = '0';
  textarea.style.bottom      = '0';
  textarea.style.color       = 'transparent';
  textarea.style.caretColor  = '#d4d4d4';
  textarea.style.background  = 'transparent';

  function sync() {
    pre.innerHTML  = highlightLogo(textarea.value) + '\n';
    pre.scrollTop  = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('input',  sync);
  textarea.addEventListener('scroll', () => {
    pre.scrollTop  = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  });

  sync();
  return { sync };
}
