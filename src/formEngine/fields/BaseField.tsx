/**
 * Base Field Component
 */

import * as React from 'react';
import { Label } from '@fluentui/react';
import { FormField, FieldState } from '../core/types';

export interface BaseFieldProps {
  field: FormField;
  state: FieldState;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const BaseFieldWrapper: React.FC<BaseFieldProps & { children: React.ReactNode }> = ({
  field, state, children,
}) => {
  const hasError = state.errors.length > 0;

  return (
    <div className={`form-field ${state.required ? 'form-field--required' : ''} ${hasError ? 'form-field--invalid' : ''}`}>
      {field.label && (
        <Label required={state.required} disabled={state.readOnly || state.disabled}>
          {field.label}
        </Label>
      )}
      <div className="form-field__content">{children}</div>
      {hasError && (
        <div className="form-field__errors">
          {state.errors.map((error, i) => (
            <div key={i} className="form-field__error">{error}</div>
          ))}
        </div>
      )}
      {field.config?.placeholder && !hasError && (
        <div className="form-field__help">{field.config.placeholder}</div>
      )}
    </div>
  );
};
