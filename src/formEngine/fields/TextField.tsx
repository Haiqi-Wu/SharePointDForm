/**
 * Text Field
 */

import * as React from 'react';
import { TextField as FluentTextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const TextField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 确保 value 是字符串类型
  const stringValue = value == null ? '' : String(value);

  return (
    <div className="form-field form-field--text">
      <FluentTextField
        label={field.label}
        value={stringValue}
        onChange={(_e, v) => onChange(v == null ? '' : String(v))}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder}
        maxLength={field.config?.maxLength}
        type="text"
        errorMessage={state.errors[0]}
      />
    </div>
  );
};
