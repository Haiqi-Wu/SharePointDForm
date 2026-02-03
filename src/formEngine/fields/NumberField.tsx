/**
 * Number Field
 */

import * as React from 'react';
import { SpinButton } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const NumberField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  const handleChange = (_e: React.SyntheticEvent, newValue?: string): void => {
    if (newValue === undefined || newValue === '') {
      onChange('');
      return;
    }
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) onChange(numValue);
  };

  return (
    <div className="form-field form-field--number">
      <SpinButton
        label={field.label}
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        min={field.config?.min}
        max={field.config?.max}
        precision={field.config?.decimals ?? 2}
      />
      {state.errors.length > 0 && (
        <div className="form-field__error">{state.errors[0]}</div>
      )}
    </div>
  );
};
