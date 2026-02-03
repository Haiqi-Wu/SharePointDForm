/**
 * Multiline Field
 */

import * as React from 'react';
import { TextField as FluentTextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const MultilineField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  return (
    <div className="form-field form-field--multiline">
      <FluentTextField
        label={field.label}
        value={value || ''}
        onChange={(_e, v) => onChange(v || '')}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder}
        maxLength={field.config?.maxLength}
        multiline
        rows={4}
        errorMessage={state.errors[0]}
      />
    </div>
  );
};
