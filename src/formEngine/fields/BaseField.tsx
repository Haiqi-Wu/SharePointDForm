/**
 * Base Field Component
 */

import * as React from 'react';
import { Label } from '@fluentui/react';
import { FormField, FieldState } from '../core/types';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface BaseFieldProps {
  field: FormField;
  state: FieldState;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
  labelPosition?: 'top' | 'left';
  showFieldDescription?: boolean;
  spfxContext?: any;
}

export const BaseFieldWrapper: React.FC<BaseFieldProps & { children: React.ReactNode }> = ({
  field, state, children, labelPosition = 'top', disabled, showFieldDescription,
}) => {
  const hasError = state.errors.length > 0;
  const isReadOnly = Boolean(state.readOnly);
  const isDisabled = Boolean(disabled || state.disabled);

  // 这些字段类型的组件自己会显示 label，不需要 BaseFieldWrapper 显示
  const fieldHasOwnLabel = ['text', 'dropdown', 'multiline', 'datetime', 'lookup', 'image', 'url', 'taxonomy'].includes(field.type);
  // 富文本字段不显示标签
  const showLabel = field.label && !fieldHasOwnLabel && field.type !== 'richtext';
  const helpText = field.config?.helpText || field.config?.placeholder;
  const descriptionText = showFieldDescription ? field.description : undefined;

  // 这些字段类型的组件不支持 required 属性，需要自定义显示 *
  const needsCustomRequiredIndicator = ['number', 'multiselect', 'boolean', 'person'].includes(field.type);
  const showRequiredIndicator = state.required && needsCustomRequiredIndicator;

  // 这些字段类型的组件不支持 errorMessage 属性，需要自定义显示错误
  const needsCustomErrorDisplay = ['number', 'multiselect', 'boolean', 'richtext', 'datetime', 'person'].includes(field.type);
  const showError = hasError && needsCustomErrorDisplay;

  // 标签在左侧的布局
  if (labelPosition === 'left') {
    return (
      <div data-field-id={field.id} className={`form-field form-field--horizontal ${isReadOnly || isDisabled ? 'form-field--readonly' : ''}`} style={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '16px' }}>
        {showLabel && (
          <div style={{ minWidth: '120px', paddingTop: '4px' }}>
            <Label disabled={isDisabled}>
              {field.label}
              {showRequiredIndicator && (
                <span style={{ color: '#d13438', marginLeft: '4px' }} aria-hidden="true">
                  *
                </span>
              )}
              {(isReadOnly || isDisabled) && (
                <span className="form-field__readonly-tag">{strings.CommonReadOnly}</span>
              )}
            </Label>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div className="form-field__content">{children}</div>
          {showError && (
            <div className="form-field__errors">
              {state.errors.map((error, i) => (
                <div key={i} className="form-field__error">{error}</div>
              ))}
            </div>
          )}
          {descriptionText && !hasError && (
            <div className="form-field__description" style={{ marginTop: '4px', fontSize: '12px', color: '#8a8886' }}>
              {descriptionText}
            </div>
          )}
          {helpText && !hasError && (
            <div className="form-field__help" style={{ marginTop: '4px', fontSize: '12px', color: '#605e5c' }}>
              {helpText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 标签在上方的布局（默认）
  return (
    <div data-field-id={field.id} className={`form-field ${state.required ? 'form-field--required' : ''} ${hasError ? 'form-field--invalid' : ''} ${isReadOnly || isDisabled ? 'form-field--readonly' : ''}`}>
      {showLabel && (
        <Label disabled={isDisabled}>
          {field.label}
          {showRequiredIndicator && (
            <span style={{ color: '#d13438', marginLeft: '4px' }} aria-hidden="true">
              *
            </span>
          )}
          {(isReadOnly || isDisabled) && (
            <span className="form-field__readonly-tag">{strings.CommonReadOnly}</span>
          )}
        </Label>
      )}
      <div className="form-field__content">
        {children}
      </div>
      {showError && (
        <div className="form-field__errors">
          {state.errors.map((error, i) => (
            <div key={i} className="form-field__error">{error}</div>
          ))}
        </div>
      )}
      {descriptionText && !hasError && (
        <div className="form-field__description" style={{ marginTop: '4px', fontSize: '12px', color: '#8a8886' }}>
          {descriptionText}
        </div>
      )}
      {helpText && !hasError && (
        <div className="form-field__help">{helpText}</div>
      )}
    </div>
  );
};
