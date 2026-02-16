/**
 * MultiSelect Field
 */

import * as React from 'react';
import { Checkbox, Stack } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const MultiSelectField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, disabled,
}) => {
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value) return [value];
    return [];
  }, [value]);

  const handleChange = (choice: string, checked: boolean): void => {
    const newValues = checked
      ? [...selectedValues, choice]
      : selectedValues.filter(v => v !== choice);
    onChange(newValues);
  };

  if (!field.config?.choices || field.config.choices.length === 0) return null;

  return (
    <div className="form-field form-field--multiselect">
      <Stack tokens={{ childrenGap: 8 }}>
        {field.config.choices.map(choice => (
          <Checkbox
            key={choice}
            label={choice}
            checked={selectedValues.includes(choice)}
            onChange={(_ev, checked) => handleChange(choice, checked || false)}
            disabled={disabled || state.readOnly || state.disabled}
          />
        ))}
      </Stack>
    </div>
  );
};
