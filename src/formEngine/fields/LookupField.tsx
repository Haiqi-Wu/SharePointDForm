/**
 * Lookup Field
 */

import * as React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export interface LookupOption {
  Id: number;
  Title: string;
  [key: string]: any;
}

export const LookupField: React.FC<BaseFieldProps & { lookupOptions: LookupOption[] }> = ({
  field, state, value, onChange, onBlur, disabled, lookupOptions,
}) => {
  console.log('LookupField rendered:', { fieldId: field.id, lookupOptions, value });

  const options: IDropdownOption[] = React.useMemo(() => {
    if (!lookupOptions) {
      console.log('lookupOptions is undefined or null');
      return [];
    }
    const opts = lookupOptions.map(opt => ({
      key: String(opt.Id),
      text: opt.Title,
      data: opt,
    }));
    console.log('Processed dropdown options:', opts);
    return opts;
  }, [lookupOptions]);

  const selectedKey = React.useMemo(() => {
    if (!value) return undefined;
    if (typeof value === 'object') {
      return value.Id ? String(value.Id) : undefined;
    }
    return String(value);
  }, [value]);

  return (
    <div className="form-field form-field--lookup">
      <Dropdown
        label={field.label}
        options={options}
        selectedKey={selectedKey}
        onChange={(_e, option) => onChange(option ? { Id: parseInt(String(option.key), 10), Title: option.text } : null)}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder || '请选择'}
        errorMessage={state.errors[0]}
      />
    </div>
  );
};
