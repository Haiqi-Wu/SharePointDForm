/**
 * OData Parser - Parses tokens into AST
 */

import { ODataLexer, Token, TokenType } from './ODataLexer';
import { ASTNode, BinaryOpNode, UnaryOpNode, FunctionCallNode, FieldNode, ValueNode, GroupNode } from '../../core/types';

export class ODataParser {
  private tokens: Token[] = [];
  private pos = 0;

  parse(expression: string): ASTNode {
    const lexer = new ODataLexer(expression);
    this.tokens = lexer.tokenize();
    this.pos = 0;

    const node = this.parseOr();

    if (this.current().type !== TokenType.EOF) {
      throw new Error(`Unexpected token at position ${this.current().position}: ${this.current().value}`);
    }

    return node;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (this.matchOperator('or')) {
      const right = this.parseAnd();
      left = { type: 'BinaryOp', operator: 'or', left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();

    while (this.matchOperator('and')) {
      const right = this.parseNot();
      left = { type: 'BinaryOp', operator: 'and', left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseNot(): ASTNode {
    if (this.matchOperator('not')) {
      const operand = this.parseComparison();
      return { type: 'UnaryOp', operator: 'not', operand } as UnaryOpNode;
    }

    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    const left = this.parsePrimary();

    const token = this.current();
    if (token.type === TokenType.OPERATOR && ['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(token.value)) {
      this.advance();
      const operator = token.value as 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';
      const right = this.parsePrimary();
      return { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseOr();
      this.consume(TokenType.RPAREN, "Expected ')'");
      return { type: 'Group', expression: expr } as GroupNode;
    }

    if (token.type === TokenType.FUNCTION) {
      return this.parseFunctionCall();
    }

    if (token.type === TokenType.FIELD) {
      this.advance();
      return { type: 'Field', name: token.value } as FieldNode;
    }

    if (token.type === TokenType.VALUE) {
      this.advance();
      const numValue = this.parseNumber(token.value);
      if (numValue !== null) {
        return { type: 'Value', value: numValue } as ValueNode;
      }
      if (token.value.toLowerCase() === 'true') {
        return { type: 'Value', value: true } as ValueNode;
      }
      if (token.value.toLowerCase() === 'false') {
        return { type: 'Value', value: false } as ValueNode;
      }
      if (token.value.toLowerCase() === 'null') {
        return { type: 'Value', value: null } as ValueNode;
      }
      return { type: 'Value', value: token.value } as ValueNode;
    }

    throw new Error(`Unexpected token at position ${token.position}: ${token.value}`);
  }

  private parseFunctionCall(): ASTNode {
    const token = this.current();
    const funcName = token.value;
    this.advance();

    this.consume(TokenType.LPAREN, `Expected '(' after function ${funcName}`);

    const args: ASTNode[] = [];
    if (this.current().type !== TokenType.RPAREN) {
      args.push(this.parseOr());
      while (this.matchOperator(',')) {
        args.push(this.parseOr());
      }
    }

    this.consume(TokenType.RPAREN, `Expected ')' after function arguments`);

    return {
      type: 'FunctionCall',
      name: funcName as 'contains' | 'startswith',
      args,
    } as FunctionCallNode;
  }

  private parseNumber(value: string): number | null {
    if (value === '' || value === 'null') return null;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    return null;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: '', position: 0 };
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private matchOperator(operator: string): boolean {
    const token = this.current();
    if (token.type === TokenType.OPERATOR && token.value === operator) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`${message} at position ${token.position}, found: ${token.value}`);
    }
    return this.advance();
  }
}
