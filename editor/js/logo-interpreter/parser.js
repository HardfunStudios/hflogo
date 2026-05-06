'use strict';
import { T } from './lexer.js';

// ── AST node helpers ──────────────────────────────────────────────────────────
const n = (type, props) => ({ type, ...props });

// ── Parser ────────────────────────────────────────────────────────────────────
export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos    = 0;
  }

  error(msg, tok) {
    const t = tok || this.peek();
    throw new SyntaxError(`[Parser] linha ${t.line}, col ${t.col}: ${msg}`);
  }

  peek()  { return this.tokens[this.pos]; }
  peek2() { return this.tokens[this.pos + 1]; }

  advance() {
    const t = this.tokens[this.pos];
    if (t.type !== T.EOF) this.pos++;
    return t;
  }

  check(type)  { return this.peek().type === type; }
  checkVal(v)  { return this.peek().type === T.IDENT && this.peek().value === v; }

  eat(type, msg) {
    if (!this.check(type)) this.error(msg || `esperado ${type}, encontrado ${this.peek().type}`);
    return this.advance();
  }

  skipNewlines() {
    while (this.check(T.NEWLINE)) this.advance();
  }

  // ── Top level ───────────────────────────────────────────────────────────────

  parse() {
    const body = this.parseStatements();
    this.eat(T.EOF);
    return n('Program', { body });
  }

  parseStatements() {
    const stmts = [];
    this.skipNewlines();
    while (!this.check(T.EOF) && !this.checkVal('fim') && !this.check(T.RBRACKET)) {
      const s = this.parseStatement();
      if (s) stmts.push(s);
      this.skipNewlines();
    }
    return stmts;
  }

  parseStatement() {
    this.skipNewlines();
    const tok = this.peek();

    if (tok.type === T.EOF || tok.type === T.RBRACKET) return null;

    if (tok.type === T.IDENT) {
      switch (tok.value) {
        case 'aprenda':    return this.parseProcDef();
        case 'repita':     return this.parseRepeat();
        case 'enquanto':   return this.parseWhile();
        case 'se':         return this.parseIf();
        case 'faça':
        case 'faca':       return this.parseMake();
        case 'pare':       this.advance(); return n('Stop',   {});
        case 'retorna':    return this.parseOutput();
        case 'resultado':  return this.parseOutput();
        default:           return this.parseCommandOrCall();
      }
    }
    this.error(`instrução inesperada: "${tok.value || tok.type}"`);
  }

  // ── Control structures ──────────────────────────────────────────────────────

  parseProcDef() {
    this.eat(T.IDENT); // 'aprenda'
    const name = this.eat(T.IDENT, 'esperado nome do procedimento').value;
    const params = [];
    while (this.check(T.VARREF)) params.push(this.advance().value);
    this.skipNewlines();
    const body = this.parseStatements();
    if (!this.checkVal('fim')) this.error('"fim" esperado após corpo do procedimento');
    this.advance(); // 'fim'
    return n('ProcDef', { name, params, body });
  }

  parseRepeat() {
    this.eat(T.IDENT); // 'repita'
    const times = this.parseExpr();
    this.skipNewlines();
    const body = this.parseBlock();
    return n('Repeat', { times, body });
  }

  parseWhile() {
    this.eat(T.IDENT); // 'enquanto'
    const cond = this.parseExpr();
    this.skipNewlines();
    const body = this.parseBlock();
    return n('While', { cond, body });
  }

  parseIf() {
    this.eat(T.IDENT); // 'se'
    const cond = this.parseExpr();
    this.skipNewlines();
    const then = this.parseBlock();
    this.skipNewlines();
    let elseBody = null;
    // optional else block
    if (this.checkVal('senão') || this.checkVal('senao')) {
      this.advance();
      this.skipNewlines();
      elseBody = this.parseBlock();
    } else if (this.check(T.LBRACKET)) {
      // shorthand: se cond [then] [else]
      elseBody = this.parseBlock();
    }
    return n('If', { cond, then, else: elseBody });
  }

  parseMake() {
    this.eat(T.IDENT); // 'faça'/'faca'
    const nameTok = this.peek();
    let varName;
    if (nameTok.type === T.WORD) {
      varName = this.advance().value;
    } else if (nameTok.type === T.VARREF) {
      varName = this.advance().value;
    } else {
      this.error('esperado nome de variável (":nome" ou ""nome") após faça');
    }
    const value = this.parseExpr();
    return n('Make', { name: varName, value });
  }

  parseOutput() {
    this.advance(); // 'retorna' / 'resultado'
    const value = this.parseExpr();
    return n('Output', { value });
  }

  parseCommandOrCall() {
    const name = this.advance().value;
    const args  = [];
    // consume arguments until newline, EOF, ], or another statement keyword
    while (!this.atStatementEnd()) {
      args.push(this.parseExpr());
    }
    return n('Command', { name, args });
  }

  atStatementEnd() {
    const tok = this.peek();
    if (tok.type === T.NEWLINE) return true;
    if (tok.type === T.EOF)     return true;
    if (tok.type === T.RBRACKET) return true;
    if (tok.type === T.IDENT) {
      const kw = ['aprenda','repita','enquanto','se','faça','faca','pare','retorna','resultado','fim','senão','senao'];
      if (kw.includes(tok.value)) return true;
    }
    return false;
  }

  // ── Block: [ statements ] ───────────────────────────────────────────────────

  parseBlock() {
    this.eat(T.LBRACKET, 'esperado "[" para início do bloco');
    this.skipNewlines();
    const stmts = [];
    while (!this.check(T.RBRACKET) && !this.check(T.EOF)) {
      const s = this.parseStatement();
      if (s) stmts.push(s);
      this.skipNewlines();
    }
    this.eat(T.RBRACKET, 'esperado "]" para fim do bloco');
    return stmts;
  }

  // ── Expressions ─────────────────────────────────────────────────────────────
  // Precedence (low → high):
  //   comparison (=, <>, <, >, <=, >=)
  //   additive   (+ -)
  //   multiplicative (* /)
  //   power      (^)
  //   unary      (- not)
  //   primary

  parseExpr() { return this.parseComparison(); }

  parseComparison() {
    let left = this.parseAdditive();
    const ops = [T.EQ, T.NEQ, T.LT, T.GT, T.LTE, T.GTE];
    while (ops.includes(this.peek().type)) {
      const op = this.advance().value;
      left = n('BinOp', { op, left, right: this.parseAdditive() });
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.check(T.PLUS) || this.check(T.MINUS)) {
      const op = this.advance().value;
      left = n('BinOp', { op, left, right: this.parseMultiplicative() });
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parsePower();
    while (this.check(T.STAR) || this.check(T.SLASH)) {
      const op = this.advance().value;
      left = n('BinOp', { op, left, right: this.parsePower() });
    }
    return left;
  }

  parsePower() {
    let base = this.parseUnary();
    if (this.check(T.CARET)) {
      this.advance();
      return n('BinOp', { op: '^', left: base, right: this.parsePower() });
    }
    return base;
  }

  parseUnary() {
    if (this.check(T.MINUS)) {
      this.advance();
      return n('UnOp', { op: '-', operand: this.parsePrimary() });
    }
    if (this.checkVal('não') || this.checkVal('nao')) {
      this.advance();
      return n('UnOp', { op: 'not', operand: this.parsePrimary() });
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const tok = this.peek();

    // Number literal
    if (tok.type === T.NUMBER) {
      this.advance();
      return n('NumberLiteral', { value: tok.value });
    }

    // Quoted word literal
    if (tok.type === T.WORD) {
      this.advance();
      const lc = tok.value.toLowerCase();
      if (lc === 'verdade' || lc === 'true')  return n('BoolLiteral', { value: true  });
      if (lc === 'falso'   || lc === 'false') return n('BoolLiteral', { value: false });
      return n('WordLiteral', { value: tok.value });
    }

    // Variable reference :name
    if (tok.type === T.VARREF) {
      this.advance();
      return n('VarRef', { name: tok.value });
    }

    // List literal [ ... ]
    if (tok.type === T.LBRACKET) {
      return this.parseListLiteral();
    }

    // Parenthesised infix expression or function call: (expr op expr) or (fn arg arg ...)
    if (tok.type === T.LPAREN) {
      return this.parseParenExpr();
    }

    // Identifier — could be boolean literal, built-in function, or proc call used as expression
    if (tok.type === T.IDENT) {
      const val = tok.value;
      if (val === 'verdade') { this.advance(); return n('BoolLiteral', { value: true  }); }
      if (val === 'falso')   { this.advance(); return n('BoolLiteral', { value: false }); }
      // treat as function call returning a value
      this.advance();
      const args = [];
      while (!this.atExprEnd()) args.push(this.parsePrimary());
      return n('FuncCall', { name: val, args });
    }

    this.error(`expressão inesperada: "${tok.value || tok.type}"`, tok);
  }

  atExprEnd() {
    const tok = this.peek();
    const type = tok.type;
    if (type === T.NEWLINE || type === T.EOF || type === T.RBRACKET ||
        type === T.RPAREN  || type === T.LBRACKET) return true;
    if (type === T.PLUS || type === T.MINUS || type === T.STAR ||
        type === T.SLASH || type === T.CARET) return true;
    if (type === T.EQ || type === T.NEQ || type === T.LT ||
        type === T.GT || type === T.LTE || type === T.GTE) return true;
    if (type === T.IDENT) {
      const kw = ['aprenda','repita','enquanto','se','faça','faca','pare','retorna',
                  'resultado','fim','senão','senao','e','ou','não','nao'];
      if (kw.includes(tok.value)) return true;
    }
    return false;
  }

  parseListLiteral() {
    this.eat(T.LBRACKET);
    const items = [];
    this.skipNewlines();
    while (!this.check(T.RBRACKET) && !this.check(T.EOF)) {
      items.push(this.parseExpr());
      this.skipNewlines();
    }
    this.eat(T.RBRACKET);
    return n('ListLiteral', { items });
  }

  parseParenExpr() {
    this.eat(T.LPAREN);
    // peek: if second token is an operator → infix expr
    // otherwise treat as function call with explicit arg count
    const expr = this.parseExpr();
    this.eat(T.RPAREN, 'esperado ")" para fechar expressão');
    return expr;
  }
}
