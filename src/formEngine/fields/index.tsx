/**
 * Fields Module Entry
 */

import * as React from 'react';
import { FieldType } from '../core/types';
import { ReactNode } from 'react';

import { BaseFieldWrapper } from './BaseField';
import { TextField } from './TextField';
import { MultilineField } from './MultilineField';
import { NumberField } from './NumberField';
import { DateTimeField } from './DateTimeField';
import { DropdownField } from './DropdownField';
import { MultiSelectField } from './MultiSelectField';
import { BooleanField } from './BooleanField';
import { PersonField } from './PersonField';
import { LookupField } from './LookupField';

export { BaseFieldWrapper } from './BaseField';
export type { BaseFieldProps } from './BaseField';

export { TextField } from './TextField';
export { MultilineField } from './MultilineField';
export { NumberField } from './NumberField';
export { DateTimeField } from './DateTimeField';
export { DropdownField } from './DropdownField';
export { MultiSelectField } from './MultiSelectField';
export { BooleanField } from './BooleanField';
export { PersonField } from './PersonField';
export type { PersonFieldValue } from './PersonField';
export { LookupField } from './LookupField';
export type { LookupOption } from './LookupField';

export interface FieldComponentProps {
  field: any;
  state: any;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
  lookupOptions?: any[];
  onResolveUsers?: (filter: string) => Promise<any[]>;
  labelPosition?: 'top' | 'left';
}

export const FieldComponents: Record<FieldType, React.ComponentType<any>> = {
  text: TextField,
  multiline: MultilineField,
  number: NumberField,
  datetime: DateTimeField,
  dropdown: DropdownField,
  multiselect: MultiSelectField,
  lookup: LookupField,
  person: PersonField,
  boolean: BooleanField,
};

export function getFieldComponent(type: FieldType): React.ComponentType<any> {
  return FieldComponents[type] || TextField;
}

export function renderField(props: FieldComponentProps): ReactNode {
  const Component = getFieldComponent(props.field.type);

  // 使用 BaseFieldWrapper 包裹所有字段，确保统一显示必填星号
  return (
    <BaseFieldWrapper
      field={props.field}
      state={props.state}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      disabled={props.disabled}
      labelPosition={props.labelPosition}
    >
      <Component
        field={props.field}
        state={props.state}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        disabled={props.disabled}
        lookupOptions={props.lookupOptions}
        onResolveUsers={props.onResolveUsers}
      />
    </BaseFieldWrapper>
  );
}
