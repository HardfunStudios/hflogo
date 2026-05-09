'use strict';

// ── Token types ───────────────────────────────────────────────────────────────
export const T = {
  NUMBER:    'NUMBER',    // 42, -3.14
  WORD:      'WORD',      // "hello  (Logo quoted word, prefix ")
  VARREF:    'VARREF',    // :name
  IDENT:     'IDENT',     // parafrente, repita, se, ...
  LBRACKET:  'LBRACKET',  // [
  RBRACKET:  'RBRACKET',  // ]
  LPAREN:    'LPAREN',    // (
  RPAREN:    'RPAREN',    // )
  PLUS:      'PLUS',      // +
  MINUS:     'MINUS',     // -
  STAR:      'STAR',      // *
  SLASH:     'SLASH',     // /
  CARET:     'CARET',     // ^
  EQ:        'EQ',        // =
  NEQ:       'NEQ',       // <>
  LT:        'LT',        // <
  GT:        'GT',        // >
  LTE:       'LTE',       // <=
  GTE:       'GTE',       // >=
  NEWLINE:   'NEWLINE',
  EOF:       'EOF',
};

export class Token {
  constructor(type, value, line, col) {
    this.type  = type;
    this.value = value;
    this.line  = line;
    this.col   = col;
  }
  toString() { return `Token(${this.type}, ${JSON.stringify(this.value)})`; }
}

// ── Lexer ─────────────────────────────────────────────────────────────────────
export class Lexer {
  constructor(source) {
    this.src  = source;
    this.pos  = 0;
    this.line = 1;
    this.col  = 1;
  }

  error(msg) {
    throw new SyntaxError(`[Lexer] linha ${this.line}, col ${this.col}: ${msg}`);
  }

  peek(offset = 0) { return this.src[this.pos + offset]; }

  advance() {
    const ch = this.src[this.pos++];
    if (ch === '\n') { this.line++; this.col = 1; }
    else             { this.col++; }
    return ch;
  }

  skipWhitespaceAndComments() {
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      // inline whitespace (not newline)
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance(); continue;
      }
      // semicolon comment — skip to end of line
      if (ch === ';') {
        while (this.pos < this.src.length && this.src[this.pos] !== '\n')
          this.advance();
        continue;
      }
      break;
    }
  }

  readNumber(startedWithMinus = false) {
    const start = this.pos - (startedWithMinus ? 1 : 0);
    let   str   = startedWithMinus ? '-' : '';
    while (this.pos < this.src.length && /[0-9]/.test(this.src[this.pos]))
      str += this.advance();
    if (this.src[this.pos] === '.' && /[0-9]/.test(this.src[this.pos + 1])) {
      str += this.advance(); // '.'
      while (this.pos < this.src.length && /[0-9]/.test(this.src[this.pos]))
        str += this.advance();
    }
    return str;
  }

  readIdent() {
    let str = '';
    // ident chars: letters (including accented), digits, _, ?, +, -, *, /
    // but we stop at whitespace, brackets, parens, operators, quotes
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (/[\s\[\]();,]/.test(ch)) break;
      // stop at standalone operators that are not part of an identifier
      if ((ch === '+' || ch === '*' || ch === '/' || ch === '^' ||
           ch === '=' || ch === '<' || ch === '>') && str.length > 0) break;
      str += this.advance();
    }
    return str;
  }

  tokenize() {
    const tokens = [];
    while (true) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.src.length) {
        tokens.push(new Token(T.EOF, null, this.line, this.col));
        break;
      }

      const line = this.line;
      const col  = this.col;
      const ch   = this.src[this.pos];

      // Newline
      if (ch === '\n') {
        this.advance();
        // collapse multiple newlines; only emit one
        if (tokens.length > 0 && tokens[tokens.length - 1].type !== T.NEWLINE)
          tokens.push(new Token(T.NEWLINE, '\n', line, col));
        continue;
      }

      // Brackets / parens
      if (ch === '[') { this.advance(); tokens.push(new Token(T.LBRACKET, '[', line, col)); continue; }
      if (ch === ']') { this.advance(); tokens.push(new Token(T.RBRACKET, ']', line, col)); continue; }
      if (ch === '(') { this.advance(); tokens.push(new Token(T.LPAREN,   '(', line, col)); continue; }
      if (ch === ')') { this.advance(); tokens.push(new Token(T.RPAREN,   ')', line, col)); continue; }

      // Operators
      if (ch === '+') { this.advance(); tokens.push(new Token(T.PLUS,  '+', line, col)); continue; }
      if (ch === '*') { this.advance(); tokens.push(new Token(T.STAR,  '*', line, col)); continue; }
      if (ch === '/') { this.advance(); tokens.push(new Token(T.SLASH, '/', line, col)); continue; }
      if (ch === '^') { this.advance(); tokens.push(new Token(T.CARET, '^', line, col)); continue; }
      if (ch === '=') { this.advance(); tokens.push(new Token(T.EQ,    '=', line, col)); continue; }
      if (ch === '<') {
        this.advance();
        if (this.src[this.pos] === '>') { this.advance(); tokens.push(new Token(T.NEQ, '<>', line, col)); }
        else if (this.src[this.pos] === '=') { this.advance(); tokens.push(new Token(T.LTE, '<=', line, col)); }
        else tokens.push(new Token(T.LT, '<', line, col));
        continue;
      }
      if (ch === '>') {
        this.advance();
        if (this.src[this.pos] === '=') { this.advance(); tokens.push(new Token(T.GTE, '>=', line, col)); }
        else tokens.push(new Token(T.GT, '>', line, col));
        continue;
      }

      // Quoted word: "palavra
      if (ch === '"') {
        this.advance();
        let word = '';
        while (this.pos < this.src.length && !/[\s\[\]();]/.test(this.src[this.pos]))
          word += this.advance();
        tokens.push(new Token(T.WORD, word, line, col));
        continue;
      }

      // Variable reference: :name
      if (ch === ':') {
        this.advance();
        let name = '';
        while (this.pos < this.src.length && /[a-zA-ZÀ-ú0-9_?]/.test(this.src[this.pos]))
          name += this.advance();
        if (!name) this.error('esperado nome de variável após ":"');
        tokens.push(new Token(T.VARREF, name, line, col));
        continue;
      }

      // Negative number: - followed immediately by digit
      if (ch === '-') {
        const next = this.src[this.pos + 1];
        if (next && /[0-9]/.test(next)) {
          this.advance(); // consume '-'
          const str = this.readNumber(true);
          tokens.push(new Token(T.NUMBER, parseFloat(str), line, col));
          continue;
        }
        // standalone minus operator
        this.advance();
        tokens.push(new Token(T.MINUS, '-', line, col));
        continue;
      }

      // Number
      if (/[0-9]/.test(ch)) {
        const str = this.readNumber();
        tokens.push(new Token(T.NUMBER, parseFloat(str), line, col));
        continue;
      }

      // Identifier / keyword
      if (/[a-zA-ZÀ-ú_]/.test(ch)) {
        const ident = this.readIdent();
        tokens.push(new Token(T.IDENT, ident.toLowerCase(), line, col));
        continue;
      }

      this.error(`caractere inesperado: "${ch}"`);
    }
    return tokens;
  }
}
