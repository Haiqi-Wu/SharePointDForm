/**
 * Form Stepper
 */

import * as React from 'react';
import { PrimaryButton, DefaultButton } from '@fluentui/react';

export interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  canGoNext: boolean;
  canGoPrev: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onStepClick?: (stepIndex: number) => void;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  currentStep, totalSteps, stepTitles, canGoNext, canGoPrev, isValid, isSubmitting,
  onNext, onPrev, onSubmit, onStepClick,
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="form-stepper">
      <div className="form-stepper__steps">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div
              key={index}
              className={`form-stepper__step ${isActive ? 'form-stepper__step--active' : ''} ${isCompleted ? 'form-stepper__step--completed' : ''} ${isClickable ? 'form-stepper__step--clickable' : ''}`}
              onClick={isClickable ? () => onStepClick!(index) : undefined}
            >
              <div className="form-stepper__step-indicator">{isCompleted ? '✓' : index + 1}</div>
              {stepTitles[index] && <div className="form-stepper__step-title">{stepTitles[index]}</div>}
            </div>
          );
        })}
      </div>

      <div className="form-stepper__actions">
        <div className="form-stepper__actions-left">
          {canGoPrev && <DefaultButton onClick={onPrev} disabled={isSubmitting}>上一步</DefaultButton>}
        </div>
        <div className="form-stepper__actions-right">
          {isLastStep ? (
            <PrimaryButton onClick={onSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? '提交中...' : '提交'}
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={onNext} disabled={isSubmitting}>下一步</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};
