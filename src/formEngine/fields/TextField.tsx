/**
 * Text Field
 */

import * as React from 'react';
import { TextField as FluentTextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const TextField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 确保 value 是字符串类型
  const stringValue = React.useMemo(() => {
    if (value == null) return '';

    // 如果已经是字符串，直接返回
    if (typeof value === 'string') return value;

    // 如果是对象（如 Person/Lookup 字段），提取显示值
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      // 优先使用 Title，然后是 displayName，最后是其他属性
      return String(obj.Title || obj.displayName || obj.Id || obj.value || JSON.stringify(value));
    }

    // 其他类型转换为字符串
    return String(value);
  }, [value]);

  return (
    <div className="form-field form-field--text">
      <FluentTextField
        label={field.label}
        value={stringValue}
        onChange={(_e, newValue) => {
          onChange(newValue || '')
        }}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder}
        maxLength={field.config?.maxLength}
        type="text"
        errorMessage={state.errors[0]}
      />
    </div>
  );
};