/**
 * Text Field
 */

import * as React from 'react';
import { TextField as FluentTextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const TextField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 本地输入值（即时更新 UI）
  const [localValue, setLocalValue] = React.useState<string>('');

  // 确保 value 是字符串类型
  const stringValue = React.useMemo(() => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return String(obj.Title || obj.displayName || obj.Id || obj.value || JSON.stringify(value));
    }
    return String(value);
  }, [value]);

  // 同步外部值到本地
  React.useEffect(() => {
    setLocalValue(stringValue);
  }, [stringValue]);

  // 处理输入变化
  const handleChange = React.useCallback((_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const newStr = newValue || '';
    setLocalValue(newStr); // 即时更新 UI
    onChange(newStr); // 立即更新表单状态，避免提交旧值
  }, [onChange]);

  // 处理失焦：立即同步值并触发 onBlur
  const handleBlur = React.useCallback(() => {
    // 立即同步最新值
    onChange(localValue);
    onBlur?.();
  }, [localValue, onChange, onBlur]);

  return (
    <FluentTextField
      label={field.label}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled || state.readOnly || state.disabled}
      required={state.required}
      placeholder={field.config?.placeholder}
      maxLength={field.config?.maxLength}
      type="text"
      errorMessage={state.errors.length > 0 ? state.errors[0] : undefined}
    />
  );
};
