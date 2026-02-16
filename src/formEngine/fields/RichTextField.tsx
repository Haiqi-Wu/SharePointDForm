/**
 * Rich Text Field - For Display Only
 * Shows pre-edited content from the design phase
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';

export const RichTextField: React.FC<BaseFieldProps> = ({
  field, state, value, onChange, onBlur, disabled,
}) => {
  // 使用 defaultValue 作为显示内容（设计阶段设置的内容）
  const displayValue = value || field.defaultValue || '';

  const contentStyle: React.CSSProperties = {
    padding: '12px 0',
    lineHeight: '1.6',
    color: '#323130',
    fontSize: '14px',
  };

  // 富文本内容在表单中是只读显示的
  return (
    <div style={contentStyle}>
      {displayValue ? (
        <div
          className="richtext-display"
          dangerouslySetInnerHTML={{ __html: displayValue }}
        />
      ) : (
        <div style={{ color: '#a19f9d', fontStyle: 'italic' }}>暂无内容</div>
      )}
    </div>
  );
};
