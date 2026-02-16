/**
 * Form State Manager
 */

import { FormSchema, FormState, FieldState, FieldAction, FilterExpression } from './types';
import { ODataConditionEngine } from '../utils/odata';

export type StateChangeListener = (state: FormState) => void;
export type FieldChangeListener = (fieldId: string, value: any) => void;

export class FormStateManager {
  private schema: FormSchema;
  private state: FormState;
  private conditionEngine: ODataConditionEngine;
  private stateListeners: StateChangeListener[] = [];
  private fieldListeners: Map<string, FieldChangeListener[]> = new Map();

  constructor(schema: FormSchema, initialValues?: Record<string, any>) {
    this.schema = schema;
    this.conditionEngine = new ODataConditionEngine();
    this.state = this.initializeState(initialValues);
  }

  getState(): FormState {
    return { ...this.state };
  }

  getFieldState(fieldId: string): FieldState | undefined {
    return this.state.fields[fieldId];
  }

  getFieldValue(fieldId: string): any {
    return this.state.fields[fieldId]?.value;
  }

  getAllFieldValues(): Record<string, any> {
    const values: Record<string, any> = {};
    for (const [fieldId, fieldState] of Object.entries(this.state.fields)) {
      const field = this.findFieldById(fieldId);
      // 跳过富文本字段，它们只是显示内容，不应该提交到 SharePoint
      if (field && field.type === 'richtext') continue;
      values[fieldId] = fieldState.value;
    }
    return values;
  }

  setFieldValue(fieldId: string, value: any): void {
    const field = this.findFieldById(fieldId);
    if (!field) return;

    const fieldState = this.state.fields[fieldId];
    if (!fieldState) return;

    fieldState.value = value;
    fieldState.dirty = true;
    this.reevaluateAllFields();

    if (field.onChange) {
      this.triggerFieldActions(field.onChange);
    }

    this.notifyFieldListeners(fieldId, value);
    this.notifyStateListeners();
  }

  touchField(fieldId: string): void {
    const fieldState = this.state.fields[fieldId];
    if (fieldState) {
      fieldState.touched = true;
      this.notifyStateListeners();
    }
  }

  setFieldErrors(fieldId: string, errors: string[]): void {
    const fieldState = this.state.fields[fieldId];
    if (fieldState) {
      fieldState.errors = errors;
      fieldState.valid = errors.length === 0;
      this.updateFormValidity();
      this.notifyStateListeners();
    }
  }

  nextStep(): boolean {
    // 找到下一个可见的步骤
    for (let i = this.state.currentStep + 1; i < this.schema.steps.length; i++) {
      if (this.schema.steps[i].visible !== false) {
        this.state.currentStep = i;
        this.notifyStateListeners();
        return true;
      }
    }
    return false;
  }

  prevStep(): boolean {
    // 找到上一个可见的步骤
    for (let i = this.state.currentStep - 1; i >= 0; i--) {
      if (this.schema.steps[i].visible !== false) {
        this.state.currentStep = i;
        this.notifyStateListeners();
        return true;
      }
    }
    return false;
  }

  goToStep(stepIndex: number): boolean {
    // 如果目标步骤不可见，找到最近的可见步骤
    if (this.schema.steps[stepIndex]?.visible === false) {
      // 尝试向前找可见步骤
      for (let i = stepIndex - 1; i >= 0; i--) {
        if (this.schema.steps[i].visible !== false) {
          this.state.currentStep = i;
          this.notifyStateListeners();
          return true;
        }
      }
      // 如果向前找不到，尝试向后找
      for (let i = stepIndex + 1; i < this.schema.steps.length; i++) {
        if (this.schema.steps[i].visible !== false) {
          this.state.currentStep = i;
          this.notifyStateListeners();
          return true;
        }
      }
      return false;
    }

    if (stepIndex >= 0 && stepIndex < this.schema.steps.length) {
      this.state.currentStep = stepIndex;
      this.notifyStateListeners();
      return true;
    }
    return false;
  }

  subscribe(listener: StateChangeListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      const index = this.stateListeners.indexOf(listener);
      if (index > -1) this.stateListeners.splice(index, 1);
    };
  }

  subscribeField(fieldId: string, listener: FieldChangeListener): () => void {
    if (!this.fieldListeners.has(fieldId)) {
      this.fieldListeners.set(fieldId, []);
    }
    this.fieldListeners.get(fieldId)!.push(listener);
    return () => {
      const listeners = this.fieldListeners.get(fieldId);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  setSubmitting(isSubmitting: boolean): void {
    this.state.isSubmitting = isSubmitting;
    this.notifyStateListeners();
  }

  isFormValid(): boolean {
    return this.state.isValid;
  }

  reset(initialValues?: Record<string, any>): void {
    this.state = this.initializeState(initialValues);
    this.notifyStateListeners();
  }

  private initializeState(initialValues?: Record<string, any>): FormState {
    const fields: Record<string, FieldState> = {};
    const context = initialValues || {};

    for (const step of this.schema.steps) {
      for (const field of step.fields) {
        if (!field) continue; // 过滤 null 占位符
        const hasFieldNameValue = initialValues && Object.prototype.hasOwnProperty.call(initialValues, field.fieldName);
        const hasFieldIdValue = initialValues && Object.prototype.hasOwnProperty.call(initialValues, field.id);
        const initialValue = hasFieldNameValue
          ? initialValues![field.fieldName]
          : (hasFieldIdValue ? initialValues![field.id] : this.getDefaultValue(field));
        const evaluation = this.evaluateFieldConditions(field, context);

        fields[field.id] = {
          value: initialValue,
          touched: false,
          dirty: false,
          visible: evaluation.visible,
          required: evaluation.required,
          readOnly: evaluation.readOnly,
          disabled: false,
          valid: true,
          errors: [],
        };
      }
    }

    // 找到第一个可见的步骤作为当前步骤
    let initialStepIndex = 0;
    for (let i = 0; i < this.schema.steps.length; i++) {
      if (this.schema.steps[i].visible !== false) {
        initialStepIndex = i;
        break;
      }
    }

    return {
      fields,
      currentStep: initialStepIndex,
      isSubmitting: false,
      isValid: true,
    };
  }

  private getDefaultValue(field: any): any {
    // 如果字段定义了 defaultValue，优先使用
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }
    if (field.type === 'boolean') return false;
    if (field.type === 'multiselect') return [];
    return '';
  }

  private evaluateFieldConditions(field: any, context: Record<string, any>): { visible: boolean; required: boolean; readOnly: boolean } {
    // 处理 visible 属性
    let visible: boolean;
    if (typeof field.visible === 'boolean') {
      visible = field.visible;
    } else if (typeof field.visible === 'string') {
      visible = this.conditionEngine.evaluate(field.visible, context);
    } else {
      visible = true;
    }

    // 处理 required 属性
    let required: boolean;
    if (field.required === undefined || field.required === null) {
      required = false; // 默认非必填
    } else if (typeof field.required === 'boolean') {
      required = field.required;
    } else if (typeof field.required === 'string') {
      // 处理简单的 'true'/'false' 字符串
      const trimmed = field.required.trim().toLowerCase();
      if (trimmed === 'true') {
        required = true;
      } else if (trimmed === 'false') {
        required = false;
      } else {
        // 作为条件表达式计算
        required = this.conditionEngine.evaluate(field.required, context);
      }
    } else {
      // 任何其他真值都视为必填
      required = Boolean(field.required);
    }

    // 处理 readOnly 属性
    let readOnly: boolean;
    if (typeof field.readOnly === 'boolean') {
      readOnly = field.readOnly;
    } else if (typeof field.readOnly === 'string') {
      readOnly = this.conditionEngine.evaluate(field.readOnly, context);
    } else {
      readOnly = false;
    }

    return { visible, required, readOnly };
  }

  private reevaluateAllFields(): void {
    const context = this.getFieldValueContext();

    for (const step of this.schema.steps) {
      for (const field of step.fields) {
        if (!field) continue; // 过滤 null 占位符
        const fieldState = this.state.fields[field.id];
        if (!fieldState) continue;

        const evaluation = this.evaluateFieldConditions(field, context);
        fieldState.visible = evaluation.visible;
        fieldState.required = evaluation.required;
        fieldState.readOnly = evaluation.readOnly;
      }
    }
  }

  public getFieldValueContext(): Record<string, any> {
    const context: Record<string, any> = {};
    for (const [fieldId, fieldState] of Object.entries(this.state.fields)) {
      const field = this.findFieldById(fieldId);
      // 排除富文本字段，它们只是显示内容，不参与条件表达式计算
      if (field && field.type !== 'richtext') {
        context[field.fieldName] = fieldState.value;
      }
    }
    return context;
  }

  private triggerFieldActions(actions: FieldAction[]): void {
    const context = this.getFieldValueContext();

    for (const action of actions) {
      switch (action.type) {
        case 'show':
          this.executeShowAction(action, context);
          break;
        case 'hide':
          this.executeHideAction(action);
          break;
        case 'set-value':
          this.executeSetValueAction(action);
          break;
        case 'clear':
          this.executeClearAction(action);
          break;
        case 'enable':
          this.executeEnableAction(action);
          break;
        case 'disable':
          this.executeDisableAction(action);
          break;
      }
    }
  }

  private executeShowAction(action: any, context: Record<string, any>): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) {
      fieldState.visible = action.condition ? this.conditionEngine.evaluate(action.condition, context) : true;
    }
  }

  private executeHideAction(action: any): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) fieldState.visible = false;
  }

  private executeSetValueAction(action: any): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) {
      fieldState.value = action.value;
      fieldState.dirty = true;
    }
  }

  private executeClearAction(action: any): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) {
      fieldState.value = '';
      fieldState.dirty = true;
    }
  }

  private executeEnableAction(action: any): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) fieldState.disabled = false;
  }

  private executeDisableAction(action: any): void {
    const fieldState = this.state.fields[action.target];
    if (fieldState) fieldState.disabled = true;
  }

  private updateFormValidity(): void {
    let isValid = true;
    for (const fieldState of Object.values(this.state.fields)) {
      if (fieldState.visible && !fieldState.valid) {
        isValid = false;
        break;
      }
    }
    this.state.isValid = isValid;
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      listener(this.getState());
    }
  }

  private notifyFieldListeners(fieldId: string, value: any): void {
    const listeners = this.fieldListeners.get(fieldId);
    if (listeners) {
      for (const listener of listeners) {
        listener(fieldId, value);
      }
    }
  }

  private findFieldById(fieldId: string): any {
    for (const step of this.schema.steps) {
      for (const field of step.fields) {
        if (field && field.id === fieldId) return field; // 添加 null 检查
      }
    }
    return null;
  }
}
