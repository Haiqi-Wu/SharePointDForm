/**
 * Form Renderer
 */

import * as React from 'react';
import { FormSchema, FormState } from '../core/types';
import { FormStateManager } from '../core/FormStateManager';
import { ValidationEngine } from '../core/ValidationEngine';
import { StepRenderer } from './StepRenderer';
import { FormStepper } from './FormStepper';
import { MessageBar, MessageBarType, DefaultButton, PrimaryButton } from '@fluentui/react';

export interface FormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, any>;
  lookupOptions?: Record<string, any[]>;
  onResolveUsers?: (filter: string) => Promise<any[]>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema, initialValues, lookupOptions, onResolveUsers, onSubmit, onCancel,
}) => {
  const stateManagerRef = React.useRef<FormStateManager | null>(null);
  const validationEngineRef = React.useRef<ValidationEngine | null>(null);

  const [state, setState] = React.useState<FormState | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  React.useEffect(() => {
    const manager = new FormStateManager(schema, initialValues);
    const validator = new ValidationEngine(schema);

    stateManagerRef.current = manager;
    validationEngineRef.current = validator;

    setState(manager.getState());

    const unsubscribe = manager.subscribe((newState) => {
      setState(newState);
    });

    return () => unsubscribe();
  }, [schema, initialValues]);

  const handleFieldChange = React.useCallback((fieldId: string, value: any) => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.setFieldValue(fieldId, value);
  }, []);

  const handleFieldBlur = React.useCallback((fieldId: string) => {
    if (!stateManagerRef.current || !validationEngineRef.current) return;

    const field = findFieldById(schema, fieldId);
    if (!field) return;

    stateManagerRef.current.touchField(fieldId);

    const fieldState = stateManagerRef.current.getFieldState(fieldId);
    if (!fieldState) return;

    const context = stateManagerRef.current!.getFieldValueContext();
    const errors = validationEngineRef.current.validateField(field, fieldState.value, context);
    stateManagerRef.current.setFieldErrors(fieldId, errors);
  }, [schema]);

  const handleNext = React.useCallback(() => {
    if (!stateManagerRef.current) return;

    const currentState = stateManagerRef.current.getState();
    const currentStep = schema.steps[currentState.currentStep];

    let hasErrors = false;

    for (const field of currentStep.fields) {
      const fieldState = currentState.fields[field.id];
      if (!fieldState || !fieldState.visible) continue;

      const context = stateManagerRef.current!.getFieldValueContext();
      const errors = validationEngineRef.current!.validateField(field, fieldState.value, context);

      if (errors.length > 0) {
        stateManagerRef.current.setFieldErrors(field.id, errors);
        hasErrors = true;
      }
    }

    if (!hasErrors) stateManagerRef.current.nextStep();
  }, [schema]);

  const handlePrev = React.useCallback(() => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.prevStep();
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!stateManagerRef.current || !validationEngineRef.current) return;

    setSubmitError(null);
    setSubmitSuccess(false);
    stateManagerRef.current.setSubmitting(true);

    try {
      const values = stateManagerRef.current.getAllFieldValues();
      const result = validationEngineRef.current.validateForm(values);

      if (!result.valid) {
        for (const [fieldId, errors] of Object.entries(result.errors)) {
          stateManagerRef.current!.setFieldErrors(fieldId, errors);
        }
        stateManagerRef.current.setSubmitting(false);
        return;
      }

      await onSubmit(values);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(err.message || '提交失败，请重试');
    } finally {
      stateManagerRef.current.setSubmitting(false);
    }
  }, [onSubmit]);

  const handleStepClick = React.useCallback((stepIndex: number) => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.goToStep(stepIndex);
  }, []);

  const handleCancel = React.useCallback(() => {
    if (onCancel) onCancel();
  }, [onCancel]);

  if (!state) return <div className="form-loading">加载中...</div>;

  const currentStepData = schema.steps[state.currentStep];
  const values = state.fields;
  const canGoNext = state.currentStep < schema.steps.length - 1;
  const canGoPrev = state.currentStep > 0;
  const stepTitles = schema.steps.map(step => step.title);

  return (
    <div className={`form-renderer form-renderer--${schema.mode}`}>
      {submitError && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setSubmitError(null)} className="form-message">
          {submitError}
        </MessageBar>
      )}

      {submitSuccess && (
        <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSubmitSuccess(false)} className="form-message">
          提交成功！
        </MessageBar>
      )}

      {schema.steps.length > 1 && (
        <FormStepper
          currentStep={state.currentStep}
          totalSteps={schema.steps.length}
          stepTitles={stepTitles}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          isValid={state.isValid}
          isSubmitting={state.isSubmitting}
          onNext={handleNext}
          onPrev={handlePrev}
          onSubmit={handleSubmit}
          onStepClick={handleStepClick}
        />
      )}

      <div className="form-content">
        <StepRenderer
          step={currentStepData}
          fields={values}
          values={values}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          lookupOptions={lookupOptions}
          onResolveUsers={onResolveUsers}
        />
      </div>

      {schema.steps.length === 1 && (
        <div className="form-actions">
          {onCancel && <DefaultButton onClick={handleCancel} disabled={state.isSubmitting}>取消</DefaultButton>}
          <PrimaryButton onClick={handleSubmit} disabled={!state.isValid || state.isSubmitting}>
            {state.isSubmitting ? '提交中...' : (schema.submitButtonLabel || '提交')}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

function findFieldById(schema: FormSchema, fieldId: string): any {
  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (field.id === fieldId) return field;
    }
  }
  return null;
}
