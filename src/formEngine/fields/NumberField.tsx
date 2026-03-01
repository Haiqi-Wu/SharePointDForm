/**
 * Number Field
 */

import * as React from 'react';
import { SpinButton } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export const NumberField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 本地输入值
  const [localValue, setLocalValue] = React.useState<string>('');

  // 同步外部值到本地
  React.useEffect(() => {
    setLocalValue(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  // 处理输入变化
  const handleChange = React.useCallback((_e: React.SyntheticEvent, newValue?: string): void => {
    const newStr = newValue || '';
    setLocalValue(newStr); // 即时更新 UI

    if (newStr === '') {
      onChange('');
      return;
    }
    const numValue = parseFloat(newStr);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  }, [onChange]);

  // 处理失焦
  const handleBlur = React.useCallback(() => {
    // 立即同步最新值
    if (localValue === '') {
      onChange('');
    } else {
      const numValue = parseFloat(localValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
    onBlur?.();
  }, [localValue, onChange, onBlur]);

  return (
    <div className="form-field form-field--number">
      <SpinButton
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled || state.readOnly || state.disabled}
        min={field.config?.min}
        max={field.config?.max}
        precision={field.config?.decimals ?? 2}
      />
    </div>
  );
};
