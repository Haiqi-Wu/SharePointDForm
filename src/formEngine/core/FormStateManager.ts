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
    if (this.state.currentStep < this.schema.steps.length - 1) {
      this.state.currentStep++;
      this.notifyStateListeners();
      return true;
    }
    return false;
  }

  prevStep(): boolean {
    if (this.state.currentStep > 0) {
      this.state.currentStep--;
      this.notifyStateListeners();
      return true;
    }
    return false;
  }

  goToStep(stepIndex: number): boolean {
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
        const initialValue = initialValues?.[field.fieldName] ?? this.getDefaultValue(field);
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

    return {
      fields,
      currentStep: 0,
      isSubmitting: false,
      isValid: true,
    };
  }

  private getDefaultValue(field: any): any {
    if (field.type === 'boolean') return false;
    if (field.type === 'multiselect') return [];
    return '';
  }

  private evaluateFieldConditions(field: any, context: Record<string, any>): { visible: boolean; required: boolean; readOnly: boolean } {
    // 处理布尔值类型
    if (typeof field.visible === 'boolean') {
      return {
        visible: field.visible,
        required: typeof field.required === 'boolean' ? field.required : false,
        readOnly: typeof field.readOnly === 'boolean' ? field.readOnly : false,
      };
    }

    // 处理表达式类型
    return {
      visible: field.visible ? this.conditionEngine.evaluate(field.visible, context) : true,
      required: field.required ? this.conditionEngine.evaluate(field.required, context) : false,
      readOnly: field.readOnly ? this.conditionEngine.evaluate(field.readOnly, context) : false,
    };
  }

  private reevaluateAllFields(): void {
    const context = this.getFieldValueContext();

    for (const step of this.schema.steps) {
      for (const field of step.fields) {
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
      if (field) context[field.fieldName] = fieldState.value;
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
        if (field.id === fieldId) return field;
      }
    }
    return null;
  }
}
