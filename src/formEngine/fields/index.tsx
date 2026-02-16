/**
 * Fields Module Entry
 */

import * as React from 'react';
import { FieldType } from '../core/types';
import { ReactNode } from 'react';

import { BaseFieldWrapper } from './BaseField';
import { TextField } from './TextField';
import { MultilineField } from './MultilineField';
import { RichTextField } from './RichTextField';
import { NumberField } from './NumberField';
import { DateTimeField } from './DateTimeField';
import { DropdownField } from './DropdownField';
import { MultiSelectField } from './MultiSelectField';
import { BooleanField } from './BooleanField';
import { PersonField } from './PersonField';
import { LookupField } from './LookupField';
import { ImageField } from './ImageField';
import { UrlField } from './UrlField';
import { TaxonomyField } from './TaxonomyField';
import { AttachmentField } from './AttachmentField';
import { NewLineField } from './NewLineField';

export { BaseFieldWrapper } from './BaseField';
export type { BaseFieldProps } from './BaseField';

export { TextField } from './TextField';
export { MultilineField } from './MultilineField';
export { RichTextField } from './RichTextField';
export { NumberField } from './NumberField';
export { DateTimeField } from './DateTimeField';
export { DropdownField } from './DropdownField';
export { MultiSelectField } from './MultiSelectField';
export { BooleanField } from './BooleanField';
export { PersonField } from './PersonField';
export type { PersonFieldValue } from './PersonField';
export { LookupField } from './LookupField';
export type { LookupOption } from './LookupField';
export { ImageField } from './ImageField';
export type { ImageFieldValue } from './ImageField';
export { UrlField } from './UrlField';
export type { UrlFieldValue } from './UrlField';
export { TaxonomyField } from './TaxonomyField';
export type { TaxonomyFieldValue } from './TaxonomyField';
export { AttachmentField } from './AttachmentField';
export type { AttachmentFieldValue } from './AttachmentField';
export { NewLineField } from './NewLineField';
export type { NewLineFieldValue } from './NewLineField';

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
  spfxContext?: any;
  itemId?: number;
}

export const FieldComponents: Record<FieldType, React.ComponentType<any>> = {
  text: TextField,
  multiline: MultilineField,
  richtext: RichTextField,
  number: NumberField,
  datetime: DateTimeField,
  dropdown: DropdownField,
  multiselect: MultiSelectField,
  lookup: LookupField,
  person: PersonField,
  boolean: BooleanField,
  image: ImageField,
  url: UrlField,
  taxonomy: TaxonomyField,
  attachment: AttachmentField,
  newline: NewLineField,
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
      spfxContext={props.spfxContext}
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
        spfxContext={props.spfxContext}
        itemId={props.itemId}
      />
    </BaseFieldWrapper>
  );
}
