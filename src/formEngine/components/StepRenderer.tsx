/**
 * Step Renderer
 */

import * as React from 'react';
import { FormStep, FieldState } from '../core/types';
import { FieldContainer } from './FieldContainer';

export interface StepRendererProps {
  step: FormStep;
  fields: Record<string, FieldState>;
  onFieldChange: (fieldId: string, value: any) => void;
  onFieldBlur: (fieldId: string) => void;
  lookupOptions?: Record<string, any[]>;
  onResolveUsers?: (filter: string) => Promise<any[]>;
  labelPosition?: 'top' | 'left';
}

export const StepRenderer: React.FC<StepRendererProps> = ({
  step, fields, onFieldChange, onFieldBlur, lookupOptions, onResolveUsers, labelPosition = 'top',
}) => {
  const visibleFields = step.fields.filter(field => {
    const fieldState = fields[field.id];
    return fieldState && fieldState.visible;
  });

  if (visibleFields.length === 0) {
    return <div className="form-step--empty">此步骤没有可显示的字段</div>;
  }

  return (
    <div className={`form-step form-step--${step.id}`}>
      {step.title && (
        <div className="form-step__title">
          <h2>{step.title}</h2>
          {step.description && <p className="form-step__description">{step.description}</p>}
        </div>
      )}
      <div className="form-step__fields">
        {visibleFields.map(field => {
          const fieldState = fields[field.id];
          if (!fieldState) return null;
          return (
            <FieldContainer
              key={field.id}
              field={field}
              state={fieldState}
              value={fieldState.value}
              onChange={(v) => onFieldChange(field.id, v)}
              onBlur={() => onFieldBlur(field.id)}
              lookupOptions={lookupOptions}
              onResolveUsers={onResolveUsers}
              labelPosition={labelPosition}
            />
          );
        })}
      </div>
    </div>
  );
};
