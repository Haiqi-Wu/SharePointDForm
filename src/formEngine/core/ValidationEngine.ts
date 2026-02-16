/**
 * Validation Engine
 */

import { FormSchema, FormField, ValidationRule, ValidationResult, FilterExpression, SPFieldType } from './types';
import { ODataConditionEngine } from '../utils/odata';

export class ValidationEngine {
  private schema: FormSchema;
  private conditionEngine: ODataConditionEngine;

  constructor(schema: FormSchema) {
    this.schema = schema;
    this.conditionEngine = new ODataConditionEngine();
  }

  validateField(field: FormField, value: any, context: Record<string, any>): string[] {
    const errors: string[] = [];

    // 检查 required 属性
    if (field.required !== undefined && field.required !== null && field.required !== false) {
      let isRequired: boolean;
      if (typeof field.required === 'boolean') {
        isRequired = field.required;
      } else if (typeof field.required === 'string') {
        // 处理简单的 'true'/'false' 字符串
        const trimmed = field.required.trim().toLowerCase();
        if (trimmed === 'true') {
          isRequired = true;
        } else if (trimmed === 'false') {
          isRequired = false;
        } else {
          // 作为条件表达式计算
          isRequired = this.conditionEngine.evaluate(field.required, context);
        }
      } else {
        isRequired = Boolean(field.required);
      }

      if (isRequired) {
        const requiredError = this.validateRequired(value, `${field.label}为必填项`);
        if (requiredError) {
          errors.push(requiredError);
        }
      }
    }

    // 检查 validation 规则
    if (!field.validation || field.validation.length === 0) return errors;

    for (const rule of field.validation) {
      if (rule.applyWhen) {
        const shouldApply = this.conditionEngine.evaluate(rule.applyWhen, context);
        if (!shouldApply) continue;
      }

      const error = this.validateRule(field, value, rule);
      if (error) errors.push(error);
    }

    return errors;
  }

  validateForm(fieldValues: Record<string, any>, visibleFields?: Set<string>): ValidationResult {
    const errors: Record<string, string[]> = {};

    for (const step of this.schema.steps) {
      for (const field of step.fields) {
        if (!field) continue; // 过滤 null 占位符
        if (visibleFields && !visibleFields.has(field.id)) continue;

        // 跳过富文本字段的验证，它们只是显示内容
        if (field.type === 'richtext') continue;

        const value = fieldValues[field.id];
        const fieldErrors = this.validateField(field, value, fieldValues);

        if (fieldErrors.length > 0) {
          errors[field.id] = fieldErrors;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private validateRule(field: FormField, value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required': return this.validateRequired(value, rule.message);
      case 'minLength': return this.validateMinLength(value, rule.value, rule.message);
      case 'maxLength': return this.validateMaxLength(value, rule.value, rule.message);
      case 'min': return this.validateMin(value, rule.value, rule.message);
      case 'max': return this.validateMax(value, rule.value, rule.message);
      case 'pattern': return this.validatePattern(value, rule.value, rule.message);
      case 'custom': return typeof rule.value === 'function' ? rule.value(value) : null;
      default: return null;
    }
  }

  private validateRequired(value: any, message: string): string | null {
    if (value === null || value === undefined || value === '') return message || '此字段为必填项';
    if (Array.isArray(value) && value.length === 0) return message || '此字段为必填项';
    return null;
  }

  private validateMinLength(value: any, minLength: number, message: string): string | null {
    if (!value) return null;
    const strValue = String(value);
    if (strValue.length < minLength) return message || `最小长度为 ${minLength}`;
    return null;
  }

  private validateMaxLength(value: any, maxLength: number, message: string): string | null {
    if (!value) return null;
    const strValue = String(value);
    if (strValue.length > maxLength) return message || `最大长度为 ${maxLength}`;
    return null;
  }

  private validateMin(value: any, min: number, message: string): string | null {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    if (numValue < min) return message || `最小值为 ${min}`;
    return null;
  }

  private validateMax(value: any, max: number, message: string): string | null {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    if (numValue > max) return message || `最大值为 ${max}`;
    return null;
  }

  private validatePattern(value: any, pattern: string, message: string): string | null {
    if (!value) return null;
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(String(value))) return message || '格式不正确';
    } catch (error) {
      console.error('Invalid regex pattern:', pattern);
    }
    return null;
  }

  validateTextField(field: FormField, value: any): string[] {
    const errors: string[] = [];
    if (field.config?.maxLength && value) {
      const maxError = this.validateMaxLength(value, field.config.maxLength, `最大长度为 ${field.config.maxLength}`);
      if (maxError) errors.push(maxError);
    }
    return errors;
  }

  validateNumberField(field: FormField, value: any): string[] {
    const errors: string[] = [];
    if (!value) return errors;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push('请输入有效的数字');
      return errors;
    }

    if (field.config?.min !== undefined && numValue < field.config.min) {
      errors.push(`最小值为 ${field.config.min}`);
    }

    if (field.config?.max !== undefined && numValue > field.config.max) {
      errors.push(`最大值为 ${field.config.max}`);
    }

    if (field.config?.decimals !== undefined) {
      const decimalPart = value.toString().split('.')[1];
      if (decimalPart && decimalPart.length > field.config.decimals) {
        errors.push(`最多 ${field.config.decimals} 位小数`);
      }
    }

    return errors;
  }

  validateDateTimeField(field: FormField, value: any): string[] {
    const errors: string[] = [];
    if (!value) return errors;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push('请输入有效的日期');
    }

    return errors;
  }

  validateEmail(value: any): string | null {
    if (!value) return null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) return '请输入有效的邮箱地址';
    return null;
  }

  validateUrl(value: any): string | null {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的 URL';
    }
  }
}

export class FieldValidator {
  static required(message?: string): ValidationRule {
    return { type: 'required', message: message || '此字段为必填项' };
  }

  static minLength(min: number, message?: string): ValidationRule {
    return { type: 'minLength', value: min, message: message || `最小长度为 ${min}` };
  }

  static maxLength(max: number, message?: string): ValidationRule {
    return { type: 'maxLength', value: max, message: message || `最大长度为 ${max}` };
  }

  static min(min: number, message?: string): ValidationRule {
    return { type: 'min', value: min, message: message || `最小值为 ${min}` };
  }

  static max(max: number, message?: string): ValidationRule {
    return { type: 'max', value: max, message: message || `最大值为 ${max}` };
  }

  static pattern(pattern: string, message?: string): ValidationRule {
    return { type: 'pattern', value: pattern, message: message || '格式不正确' };
  }

  static requiredWhen(condition: FilterExpression, message?: string): ValidationRule {
    return { type: 'required', message: message || '此字段为必填项', applyWhen: condition };
  }

  static email(message?: string): ValidationRule {
    return { type: 'pattern', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: message || '请输入有效的邮箱地址' };
  }

  static url(message?: string): ValidationRule {
    return { type: 'pattern', value: '^https?://[^\\s/$.?#].[^\\s]*$', message: message || '请输入有效的 URL' };
  }

  static phone(message?: string): ValidationRule {
    return { type: 'pattern', value: '^1[3-9]\\d{9}$', message: message || '请输入有效的手机号' };
  }
}
