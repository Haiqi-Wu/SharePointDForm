/**
 * Boolean Field
 */

import * as React from 'react';
import { Toggle } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const BooleanField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  return (
    <div className="form-field form-field--boolean">
      <Toggle
        label={field.label}
        checked={value === true}
        onChange={(_ev, checked) => onChange(checked ?? false)}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        onText="是"
        offText="否"
      />
    </div>
  );
};
