/**
 * Multiline Field
 */

import * as React from 'react';
import { TextField as FluentTextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';
import { useDebouncedCallback } from '../hooks/useDebounce';

export const MultilineField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 本地输入值（即时更新 UI）
  const [localValue, setLocalValue] = React.useState<string>('');

  // 同步外部值到本地
  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // 防抖回调
  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  // 处理输入变化
  const handleChange = React.useCallback((_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const newStr = newValue || '';
    setLocalValue(newStr);
    debouncedOnChange(newStr);
  }, [debouncedOnChange]);

  // 处理失焦
  const handleBlur = React.useCallback(() => {
    onChange(localValue);
    onBlur?.();
  }, [localValue, onChange, onBlur]);

  return (
    <div className="form-field form-field--multiline">
      <FluentTextField
        label={field.label}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        placeholder={field.config?.placeholder}
        maxLength={field.config?.maxLength}
        multiline
        rows={4}
        errorMessage={state.errors.length > 0 ? state.errors[0] : undefined}
      />
    </div>
  );
};
