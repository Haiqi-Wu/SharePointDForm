/**
 * Dropdown Field
 */

import * as React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export const DropdownField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  const options: IDropdownOption[] = React.useMemo(() => {
    if (!field.config?.choices) return [];
    return field.config.choices.map(choice => ({ key: choice, text: choice }));
  }, [field.config?.choices]);

  return (
    <div className="form-field form-field--dropdown">
      <Dropdown
        label={field.label}
        options={options}
        selectedKey={value}
        onChange={(_e, option) => onChange(option?.key ?? '')}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder || strings.FieldPlaceholderSelect}
        errorMessage={state.errors.length > 0 ? state.errors[0] : undefined}
      />
    </div>
  );
};
