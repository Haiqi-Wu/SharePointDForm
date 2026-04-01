/**
 * Form Renderer
 */

import * as React from 'react';
import { Text } from '@microsoft/sp-core-library';
import { FormMode, FormSchema, FormState } from '../core/types';
import { FormStateManager } from '../core/FormStateManager';
import { ValidationEngine } from '../core/ValidationEngine';
import { StepRenderer } from './StepRenderer';
import { FormStepper } from './FormStepper';
import {
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogType,
  DialogFooter,
  Link,
} from '@fluentui/react';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface FormRendererProps {
  schema: FormSchema;
  mode?: FormMode;
  initialValues?: Record<string, any>;
  lookupOptions?: Record<string, any[]>;
  onResolveUsers?: (filter: string) => Promise<any[]>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  spfxContext?: any;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  mode,
  initialValues,
  lookupOptions,
  onResolveUsers,
  onSubmit,
  onCancel,
  spfxContext,
}) => {
  const stateManagerRef = React.useRef<FormStateManager | null>(null);
  const validationEngineRef = React.useRef<ValidationEngine | null>(null);
  const initialValuesRef = React.useRef<Record<string, any> | undefined>(initialValues);

  const [state, setState] = React.useState<FormState | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [stepValidationError, setStepValidationError] = React.useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [errorSummary, setErrorSummary] = React.useState<Array<{ id: string; label: string; message: string }> | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const effectiveMode: FormMode = mode || schema.mode;
  const isReadOnly = effectiveMode === 'view';
  const cancelLabel = schema.cancelButtonLabel || strings.CommonCancel;
  const cancelRedirectUrl = schema.cancelRedirectUrl?.trim() || '';
  const submitRedirectUrl = schema.submitRedirectUrl?.trim() || '';
  const submitRedirectDelay = Math.max(0, schema.submitRedirectDelayMs ?? 1500);
  const redirectTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  React.useEffect(() => {
    const manager = new FormStateManager(schema, initialValues, { forceReadOnly: isReadOnly });
    const validator = new ValidationEngine(schema);

    stateManagerRef.current = manager;
    validationEngineRef.current = validator;

    setSubmitError(null);
    setSubmitSuccess(false);
    setStepValidationError(null);
    setErrorSummary(null);
    setSubmitAttempted(false);
    setState(manager.getState());

    const unsubscribe = manager.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [schema, initialValues, isReadOnly]);

  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  const scrollToField = React.useCallback((fieldId: string): void => {
    setTimeout(() => {
      const errorElement = document.querySelector(`[data-field-id="${fieldId}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const buildErrorSummary = React.useCallback((errors: Record<string, string[]>) => {
    const items: Array<{ id: string; label: string; message: string }> = [];
    for (const [fieldId, fieldErrors] of Object.entries(errors)) {
      const field = findFieldById(schema, fieldId);
      if (!field) continue;
      items.push({
        id: fieldId,
        label: field.label || field.fieldName || fieldId,
        message: fieldErrors[0] || strings.FormInvalidMessageDefault,
      });
    }
    return items;
  }, [schema]);

  const handleFieldChange = React.useCallback((fieldId: string, value: any) => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.setFieldValue(fieldId, value);
    if (errorSummary) setErrorSummary(null);

    if (!validationEngineRef.current) return;
    const fieldState = stateManagerRef.current.getFieldState(fieldId);
    if (!fieldState) return;

    const shouldValidate = submitAttempted || fieldState.touched || fieldState.errors.length > 0;
    if (!shouldValidate) return;

    const field = findFieldById(schema, fieldId);
    if (!field) return;

    const context = stateManagerRef.current.getFieldValueContext();
    const errors = validationEngineRef.current.validateField(field, value, context);
    stateManagerRef.current.setFieldErrors(fieldId, errors);
  }, [schema, submitAttempted, errorSummary]);

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

    setSubmitAttempted(true);
    setStepValidationError(null); // 清除之前的步骤错误
    if (errorSummary) setErrorSummary(null);
    const currentState = stateManagerRef.current.getState();
    const currentStep = schema.steps[currentState.currentStep];
    const context = stateManagerRef.current!.getFieldValueContext();

    let hasErrors = false;
    let firstErrorFieldId: string | null = null;

    for (const field of currentStep.fields) {
      if (!field) continue; // 过滤 null 占位符
      const fieldState = currentState.fields[field.id];
      if (!fieldState || !fieldState.visible) continue;
      stateManagerRef.current.touchField(field.id);

      // 跳过富文本字段的验证，它们只是显示内容
      if (field.type === 'richtext') continue;

      const errors = validationEngineRef.current!.validateField(field, fieldState.value, context);

      if (errors.length > 0) {
        stateManagerRef.current.setFieldErrors(field.id, errors);
        hasErrors = true;
        if (!firstErrorFieldId) firstErrorFieldId = field.id;
      } else {
        stateManagerRef.current.setFieldErrors(field.id, []);
      }
    }

    if (hasErrors) {
      setStepValidationError(strings.FormStepValidationError);
      // 滚动到第一个错误字段
      if (firstErrorFieldId) {
        scrollToField(firstErrorFieldId);
      }
    } else {
      stateManagerRef.current.nextStep();
    }
  }, [schema, errorSummary, scrollToField]);

  const handlePrev = React.useCallback(() => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.prevStep();
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!stateManagerRef.current || !validationEngineRef.current) return;

    setSubmitAttempted(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setStepValidationError(null);
    setErrorSummary(null);
    stateManagerRef.current.setSubmitting(true);

    try {
      const values = stateManagerRef.current.getAllFieldValues();
      const currentState = stateManagerRef.current.getState();
      const visibleFields = new Set(
        Object.entries(currentState.fields)
          .filter(([_, fieldState]) => fieldState.visible)
          .map(([fieldId]) => fieldId)
      );

      // 触碰可见字段以触发校验提示
      for (const [fieldId, fieldState] of Object.entries(currentState.fields)) {
        if (!fieldState.visible) continue;
        const field = findFieldById(schema, fieldId);
        if (field && field.type === 'richtext') continue;
        stateManagerRef.current.touchField(fieldId);
      }

      const result = validationEngineRef.current.validateForm(values, visibleFields);

      if (!result.valid) {
        Array.from(visibleFields).forEach((fieldId) => {
          const errors = result.errors[fieldId] || [];
          stateManagerRef.current!.setFieldErrors(fieldId, errors);
        });
        const summary = buildErrorSummary(result.errors);
        if (summary.length > 0) {
          setErrorSummary(summary);
          scrollToField(summary[0].id);
        }
        stateManagerRef.current.setSubmitting(false);
        return;
      }

      Array.from(visibleFields).forEach((fieldId) => {
        stateManagerRef.current!.setFieldErrors(fieldId, []);
      });

      await onSubmit(values);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      if (submitRedirectUrl) {
        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          window.location.assign(submitRedirectUrl);
        }, submitRedirectDelay);
      }
    } catch (err: any) {
      setSubmitError(err.message || strings.FormSubmitFailedDefault);
    } finally {
      stateManagerRef.current.setSubmitting(false);
    }
  }, [onSubmit, schema, buildErrorSummary, scrollToField, submitRedirectUrl, submitRedirectDelay]);

  const handleStepClick = React.useCallback((stepIndex: number) => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.goToStep(stepIndex);
  }, []);

  const resetForm = React.useCallback(() => {
    if (!stateManagerRef.current) return;
    stateManagerRef.current.reset(initialValuesRef.current);
    setSubmitError(null);
    setSubmitSuccess(false);
    setStepValidationError(null);
    setErrorSummary(null);
    setSubmitAttempted(false);
  }, []);

  const handleCancelConfirmed = React.useCallback(() => {
    setShowCancelConfirm(false);
    if (cancelRedirectUrl) {
      window.location.assign(cancelRedirectUrl);
      return;
    }
    if (onCancel) {
      onCancel();
      return;
    }
    resetForm();
  }, [onCancel, resetForm, cancelRedirectUrl]);

  const handleCancel = React.useCallback(() => {
    if (!stateManagerRef.current) return;
    const currentState = stateManagerRef.current.getState();
    const hasDirty = Object.values(currentState.fields).some((f) => f.dirty);

    if (hasDirty && !isReadOnly) {
      setShowCancelConfirm(true);
      return;
    }

    if (onCancel) {
      onCancel();
      return;
    }

    resetForm();
  }, [onCancel, resetForm, isReadOnly]);

  if (!state) return <div className="form-loading">{strings.CommonLoading}</div>;

  const currentStepData = schema.steps[state.currentStep];
  const values = state.fields;
  const canGoPrev = state.currentStep > 0;
  const stepTitles = schema.steps.map(step => step.title);
  const submitLabel = schema.submitButtonLabel || (effectiveMode === 'edit' ? strings.FormSubmitLabelEdit : strings.CommonSubmit);
  const successMessage = schema.onSubmitMessage || (effectiveMode === 'edit' ? strings.FormSubmitSuccessEdit : strings.FormSubmitSuccessNew);
  const showCancelButton = !isReadOnly && schema.showCancelButton !== false;

  // 如果当前步骤不可见，显示提示
  if (currentStepData.visible === false) {
    return (
      <div className={`form-renderer form-renderer--${effectiveMode}`}>
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#605e5c',
        }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>{strings.FormStepHiddenTitle}</p>
          <p style={{ fontSize: 14 }}>{strings.FormStepHiddenDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`form-renderer form-renderer--${effectiveMode}`}>
      {submitError && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setSubmitError(null)}
          className="form-message"
          actions={
            <div className="form-message__actions">
              <DefaultButton onClick={handleSubmit} disabled={state.isSubmitting}>{strings.CommonRetry}</DefaultButton>
            </div>
          }
        >
          {submitError}
        </MessageBar>
      )}

      {errorSummary && errorSummary.length > 0 && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setErrorSummary(null)} className="form-message">
          <div className="form-error-summary">
            <div>{Text.format(strings.FormErrorSummaryTitle, String(errorSummary.length))}</div>
            <ul>
              {errorSummary.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link onClick={() => scrollToField(item.id)}>{item.label}</Link>: {item.message}
                </li>
              ))}
            </ul>
          </div>
        </MessageBar>
      )}

      {stepValidationError && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setStepValidationError(null)} className="form-message">
          {stepValidationError}
        </MessageBar>
      )}

      {submitSuccess && (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={() => setSubmitSuccess(false)}
          className="form-message"
          actions={effectiveMode === 'new' ? (
            <div className="form-message__actions">
              <DefaultButton onClick={() => {
                setSubmitSuccess(false);
                resetForm();
              }}>{strings.CommonContinueCreate}</DefaultButton>
            </div>
          ) : undefined}
        >
          {successMessage}
        </MessageBar>
      )}

      {schema.steps.length > 1 && (
        <FormStepper
          currentStep={state.currentStep}
          totalSteps={schema.steps.length}
          stepTitles={stepTitles}
          canGoPrev={canGoPrev}
          isSubmitting={state.isSubmitting}
          onNext={handleNext}
          onPrev={handlePrev}
          onSubmit={handleSubmit}
          onStepClick={handleStepClick}
          onCancel={showCancelButton ? handleCancel : undefined}
          readOnly={isReadOnly}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
        />
      )}

      <div className="form-content">
        <StepRenderer
          step={currentStepData}
          fields={values}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          lookupOptions={lookupOptions}
          onResolveUsers={onResolveUsers}
          labelPosition={currentStepData.theme?.labelPosition ?? schema.theme?.labelPosition}
          showFieldDescription={schema.showFieldDescription}
          layout={currentStepData.theme?.layout ?? schema.theme?.layout}
          columns={currentStepData.theme?.columns ?? schema.theme?.columns}
          spfxContext={spfxContext}
          itemId={schema.itemId}
          disabled={false}
        />
      </div>

      {schema.steps.length === 1 && !isReadOnly && (
        <div className="form-actions">
          <div className="form-actions__right" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {showCancelButton && (
              <DefaultButton onClick={handleCancel} disabled={state.isSubmitting}>{cancelLabel}</DefaultButton>
            )}
            <PrimaryButton onClick={handleSubmit} disabled={state.isSubmitting}>
              {state.isSubmitting ? strings.CommonSubmitting : submitLabel}
            </PrimaryButton>
          </div>
        </div>
      )}

      <Dialog
        hidden={!showCancelConfirm}
        onDismiss={() => setShowCancelConfirm(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: strings.DialogCancelTitle,
          subText: strings.DialogCancelSubText,
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={handleCancelConfirmed}>{strings.DialogDiscardChanges}</PrimaryButton>
          <DefaultButton onClick={() => setShowCancelConfirm(false)}>{strings.CommonContinueEditing}</DefaultButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

function findFieldById(schema: FormSchema, fieldId: string): any {
  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (field && field.id === fieldId) return field; // 添加 null 检查
    }
  }
  return null;
}
