/**
 * Form Stepper
 */

import * as React from 'react';
import { PrimaryButton, DefaultButton } from '@fluentui/react';

export interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  canGoPrev: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onStepClick?: (stepIndex: number) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  currentStep, totalSteps, stepTitles, canGoPrev, isSubmitting,
  onNext, onPrev, onSubmit, onStepClick, onCancel, readOnly, submitLabel, cancelLabel,
}) => {
  const isLastStep = currentStep === totalSteps - 1;
  const finalSubmitLabel = submitLabel || '提交';
  const finalCancelLabel = cancelLabel || '取消';

  const stepStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: '#f3f2f1',
    borderRadius: '4px',
  };

  const stepIndicatorStyle = (isActive: boolean, isCompleted: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive ? '#0078d4' : (isCompleted ? '#107c10' : '#ffffff'),
    color: isActive || isCompleted ? '#ffffff' : '#605e5c',
    border: '2px solid ' + (isActive ? '#0078d4' : (isCompleted ? '#107c10' : '#e1dfdd')),
    fontWeight: 600,
    fontSize: '14px',
  });

  const stepTitleStyle = (isActive: boolean, isClickable: boolean): React.CSSProperties => ({
    fontSize: '14px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#0078d4' : '#323130',
    cursor: isClickable ? 'pointer' : 'default',
  });

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e1dfdd',
  };

  return (
    <div style={stepStyle}>
      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div
              key={index}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isClickable ? 'pointer' : 'default' }}
              onClick={isClickable ? () => onStepClick!(index) : undefined}
            >
              <div style={stepIndicatorStyle(isActive, isCompleted)}>
                {isCompleted ? '✓' : index + 1}
              </div>
              {stepTitles[index] && (
                <div style={stepTitleStyle(isActive, !!isClickable)}>
                  {stepTitles[index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div style={actionsStyle}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {canGoPrev && <DefaultButton onClick={onPrev} disabled={isSubmitting}>上一步</DefaultButton>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {onCancel && <DefaultButton onClick={onCancel} disabled={isSubmitting}>{finalCancelLabel}</DefaultButton>}
            {isLastStep ? (
              <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : finalSubmitLabel}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={onNext} disabled={isSubmitting}>下一步</PrimaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
