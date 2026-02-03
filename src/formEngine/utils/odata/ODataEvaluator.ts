/**
 * OData Evaluator - Evaluates AST against context
 */

import { ODataParser } from './ODataParser';
import { ASTNode, FilterExpression } from '../../core/types';

export class ODataEvaluator {
  evaluate(expression: FilterExpression, context: Record<string, any>): boolean {
    if (!expression || expression.trim() === '') return true;

    try {
      const parser = new ODataParser();
      const ast = parser.parse(expression);
      return this.evaluateNode(ast, context);
    } catch (error) {
      console.error('Error evaluating OData expression:', expression, error);
      return false;
    }
  }

  private evaluateNode(node: ASTNode, context: Record<string, any>): any {
    switch (node.type) {
      case 'BinaryOp':
        return this.evaluateBinaryOp(node, context);
      case 'UnaryOp':
        return this.evaluateUnaryOp(node, context);
      case 'FunctionCall':
        return this.evaluateFunctionCall(node, context);
      case 'Field':
        return this.evaluateField(node, context);
      case 'Value':
        return (node as any).value;
      case 'Group':
        return this.evaluateNode((node as any).expression, context);
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  private evaluateBinaryOp(node: any, context: Record<string, any>): any {
    const left = this.evaluateNode(node.left, context);
    const right = this.evaluateNode(node.right, context);

    switch (node.operator) {
      case 'eq': return this.compareEq(left, right);
      case 'ne': return !this.compareEq(left, right);
      case 'gt': return this.compareGt(left, right);
      case 'ge': return this.compareGe(left, right);
      case 'lt': return this.compareLt(left, right);
      case 'le': return this.compareLe(left, right);
      case 'and': return this.toBoolean(left) && this.toBoolean(right);
      case 'or': return this.toBoolean(left) || this.toBoolean(right);
      default: throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  private evaluateUnaryOp(node: any, context: Record<string, any>): any {
    const operand = this.evaluateNode(node.operand, context);
    return node.operator === 'not' ? !this.toBoolean(operand) : operand;
  }

  private evaluateFunctionCall(node: any, context: Record<string, any>): any {
    const args = node.args.map((arg: ASTNode) => this.evaluateNode(arg, context));

    switch (node.name) {
      case 'contains':
        return this.evaluateContains(args[0], args[1]);
      case 'startswith':
        return this.evaluateStartsWith(args[0], args[1]);
      default:
        throw new Error(`Unknown function: ${node.name}`);
    }
  }

  private evaluateField(node: any, context: Record<string, any>): any {
    const parts = node.name.split('/');
    let value = context;
    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }
    return value;
  }

  private compareEq(left: any, right: any): boolean {
    if (left === null || left === undefined) return right === null || right === undefined;
    if (right === null || right === undefined) return false;
    return left == right;
  }

  private compareGt(left: any, right: any): boolean {
    return this.compareValues(left, right, (a, b) => a > b);
  }

  private compareGe(left: any, right: any): boolean {
    return this.compareValues(left, right, (a, b) => a >= b);
  }

  private compareLt(left: any, right: any): boolean {
    return this.compareValues(left, right, (a, b) => a < b);
  }

  private compareLe(left: any, right: any): boolean {
    return this.compareValues(left, right, (a, b) => a <= b);
  }

  private compareValues(left: any, right: any, compareFn: (a: any, b: any) => boolean): boolean {
    if (typeof left === 'number' && typeof right === 'number') return compareFn(left, right);

    if (typeof left === 'string' && typeof right === 'number') {
      const numLeft = parseFloat(left);
      if (!isNaN(numLeft)) return compareFn(numLeft, right);
    }

    if (typeof left === 'number' && typeof right === 'string') {
      const numRight = parseFloat(right);
      if (!isNaN(numRight)) return compareFn(left, numRight);
    }

    if (typeof left === 'string' && typeof right === 'string') {
      return compareFn(left.toLowerCase(), right.toLowerCase());
    }

    return compareFn(String(left), String(right));
  }

  private evaluateContains(field: any, value: any): boolean {
    const fieldStr = String(field || '').toLowerCase();
    const valueStr = String(value || '').toLowerCase();
    return fieldStr.includes(valueStr);
  }

  private evaluateStartsWith(field: any, prefix: any): boolean {
    const fieldStr = String(field || '').toLowerCase();
    const prefixStr = String(prefix || '').toLowerCase();
    return fieldStr.startsWith(prefixStr);
  }

  private toBoolean(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return true;
  }
}

export class ODataConditionEngine {
  private evaluator: ODataEvaluator;

  constructor() {
    this.evaluator = new ODataEvaluator();
  }

  evaluate(expression: FilterExpression, context: Record<string, any>): boolean {
    return this.evaluator.evaluate(expression, context);
  }

  evaluateMultiple(
    expressions: Partial<Record<string, FilterExpression>>,
    context: Record<string, any>
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, expr] of Object.entries(expressions)) {
      result[key] = expr ? this.evaluate(expr, context) : true;
    }
    return result;
  }
}
