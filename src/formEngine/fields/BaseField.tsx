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
  labelPosition?: 'top' | 'left';
}

export const BaseFieldWrapper: React.FC<BaseFieldProps & { children: React.ReactNode }> = ({
  field, state, children, labelPosition = 'top',
}) => {
  const hasError = state.errors.length > 0;

  // 标签在左侧的布局
  if (labelPosition === 'left') {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '16px' }}>
        {field.label && (
          <div style={{ minWidth: '120px', paddingTop: '4px' }}>
            <Label disabled={state.readOnly || state.disabled}>
              {field.label}
              {state.required && (
                <span style={{ color: '#d13438', marginLeft: '4px' }} aria-hidden="true">
                  *
                </span>
              )}
            </Label>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div className="form-field__content">{children}</div>
          {hasError && (
            <div className="form-field__errors">
              {state.errors.map((error, i) => (
                <div key={i} className="form-field__error">{error}</div>
              ))}
            </div>
          )}
          {field.config?.placeholder && !hasError && (
            <div className="form-field__help" style={{ marginTop: '4px', fontSize: '12px', color: '#605e5c' }}>
              {field.config.placeholder}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 标签在上方的布局（默认）
  return (
    <div className={`form-field ${state.required ? 'form-field--required' : ''} ${hasError ? 'form-field--invalid' : ''}`}>
      {field.label && (
        <Label disabled={state.readOnly || state.disabled}>
          {field.label}
          {state.required && (
            <span style={{ color: '#d13438', marginLeft: '4px' }} aria-hidden="true">
              *
            </span>
          )}
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
