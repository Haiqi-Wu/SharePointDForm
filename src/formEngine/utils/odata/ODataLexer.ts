/**
 * OData Lexer - Tokenizes OData filter expressions
 */

export enum TokenType {
  FIELD = 'FIELD',
  OPERATOR = 'OPERATOR',
  VALUE = 'VALUE',
  FUNCTION = 'FUNCTION',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class ODataLexer {
  private pos = 0;
  private input: string;
  private length: number;

  constructor(input: string) {
    this.input = input.trim();
    this.length = this.input.length;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.length) {
      const char = this.input[this.pos];

      if (this.isWhitespace(char)) {
        this.pos++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: TokenType.LPAREN, value: '(', position: this.pos });
        this.pos++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')', position: this.pos });
        this.pos++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: ',', position: this.pos });
        this.pos++;
        continue;
      }

      if (char === "'") {
        const token = this.readString();
        tokens.push(token);
        continue;
      }

      const token = this.readOperatorOrIdentifier();
      tokens.push(token);
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
    return tokens;
  }

  private readString(): Token {
    const start = this.pos;
    this.pos++;
    let value = '';

    while (this.pos < this.length) {
      const char = this.input[this.pos];

      if (char === "'" && this.pos + 1 < this.length && this.input[this.pos + 1] === "'") {
        value += "'";
        this.pos += 2;
        continue;
      }

      if (char === "'") {
        this.pos++;
        return { type: TokenType.VALUE, value, position: start };
      }

      value += char;
      this.pos++;
    }

    throw new Error(`Unterminated string at position ${start}`);
  }

  private readOperatorOrIdentifier(): Token {
    const start = this.pos;
    let value = '';

    while (this.pos < this.length) {
      const char = this.input[this.pos];
      if (this.isWhitespace(char) || char === '(' || char === ')' || char === ',' || char === "'") {
        break;
      }
      value += char;
      this.pos++;
    }

    const operators = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'and', 'or', 'not'];
    const functions = ['contains', 'startswith'];

    if (operators.includes(value.toLowerCase())) {
      return { type: TokenType.OPERATOR, value: value.toLowerCase(), position: start };
    }

    if (functions.includes(value.toLowerCase())) {
      return { type: TokenType.FUNCTION, value: value.toLowerCase(), position: start };
    }

    return { type: TokenType.FIELD, value, position: start };
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }
}
