/**
 * Field Container
 */

import * as React from 'react';
import { FormField, FieldState } from '../core/types';
import { renderField } from '../fields';

export interface FieldContainerProps {
  field: FormField;
  state: FieldState;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  lookupOptions?: Record<string, any[]>;
  onResolveUsers?: (filter: string) => Promise<any[]>;
}

export const FieldContainer: React.FC<FieldContainerProps> = ({
  field, state, value, onChange, onBlur, lookupOptions, onResolveUsers,
}) => {
  if (!state.visible) return null;

  return (
    <div className="form-field-container">
      {renderField({
        field,
        state,
        value,
        onChange,
        onBlur,
        disabled: state.disabled || state.readOnly,
        lookupOptions: lookupOptions?.[field.id],
        onResolveUsers,
      })}
    </div>
  );
};
