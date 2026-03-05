/**
 * Boolean Field
 */

import * as React from 'react';
import { Toggle } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export const BooleanField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  return (
    <div className="form-field form-field--boolean">
      <Toggle
        checked={value === true}
        onChange={(_ev, checked) => onChange(checked ?? false)}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        onText={strings.FieldBooleanYes}
        offText={strings.FieldBooleanNo}
      />
    </div>
  );
};
