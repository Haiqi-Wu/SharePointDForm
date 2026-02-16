/**
 * DateTime Field
 */

import * as React from 'react';
import { DatePicker } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';
import { format } from 'date-fns';

export const DateTimeField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  const parseDate = (val: any): Date | undefined => {
    if (!val) return undefined;

    // Handle different date formats
    let date: Date;
    if (typeof val === 'string') {
      // ISO string or other string format
      date = new Date(val);
    } else if (val instanceof Date) {
      // Already a Date object
      date = val;
    } else if (typeof val === 'number') {
      // Timestamp
      date = new Date(val);
    } else {
      return undefined;
    }

    return isNaN(date.getTime()) ? undefined : date;
  };

  const isDateOnly = field.config?.displayFormat === 'dateOnly';

  const handleDateChange = (date: Date | null | undefined): void => {
    if (!date) {
      onChange(null);
      return;
    }

    // Set time to noon for date-only fields to avoid timezone issues
    if (isDateOnly) {
      date.setHours(12, 0, 0, 0);
    }

    onChange(date.toISOString());
  };

  const parsedValue = parseDate(value);

  return (
    <div className="form-field form-field--datetime">
      <DatePicker
        label={field.label}
        value={parsedValue}
        onSelectDate={handleDateChange}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        isRequired={state.required}
        placeholder={field.config?.placeholder}
        showMonthPickerAsOverlay
        formatDate={isDateOnly ? (d) => format(d ?? new Date(), 'PPP') : (d) => format(d ?? new Date(), 'Pp')}
      />
    </div>
  );
};
