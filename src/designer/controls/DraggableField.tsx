/**
 * Draggable Field Control
 */

import * as React from 'react';
import { SPFieldInfo, SPFieldType, FieldType } from '../../formEngine/core/types';

export interface DraggableFieldProps {
  spField: SPFieldInfo;
}

// 自定义字段类型接口
export interface CustomFieldType {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}

// 自定义字段组件
export interface DraggableCustomFieldProps {
  fieldType: CustomFieldType;
}

export const DraggableCustomField: React.FC<DraggableCustomFieldProps> = ({ fieldType }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const customFieldStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: isHovered ? '#bae7ff' : '#e6f7ff',
    border: isHovered ? '1px solid #40a9ff' : '1px solid #91d5ff',
    borderRadius: '4px',
    cursor: 'default',
    marginBottom: '8px',
    transition: 'all 0.2s',
    opacity: 1,
  };

  return (
    <div
      style={customFieldStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={fieldType.description}
    >
      <span style={{ fontSize: '18px' }}>{fieldType.icon}</span>
      <span style={{ flex: 1, fontSize: '14px' }}>{fieldType.label}</span>
    </div>
  );
};

// 字段类型图标映射
const getFieldIcon = (type: SPFieldType): string => {
  const iconMap: Record<string, string> = {
    'Text': '📝',
    'Note': '📄',
    'Number': '🔢',
    'Integer': '🔢',
    'DateTime': '📅',
    'Choice': '▼',
    'MultiChoice': '☑️',
    'Lookup': '🔍',
    'User': '👤',
    'UserMulti': '👥',
    'Boolean': '☑️',
    'URL': '🔗',
    'Hyperlink': '🔗',
    'Image': '🖼️',
    'Taxonomy': '🏷️',
    'TaxonomyMulti': '🏷️',
    'Attachments': '📎',
    'Calculated': '📊',
  };
  return iconMap[type] || '📝';
};

const draggableFieldStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  background: '#f3f2f1',
  border: '1px solid #e1dfdd',
  borderRadius: '4px',
  cursor: 'default',
  marginBottom: '8px',
};

const draggableFieldHoverStyle: React.CSSProperties = {
  ...draggableFieldStyle,
  background: '#edebe9',
};

export const DraggableField: React.FC<DraggableFieldProps> = ({ spField }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        ...(isHovered ? draggableFieldHoverStyle : draggableFieldStyle),
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '18px' }}>{getFieldIcon(spField.type)}</span>
      <span style={{ flex: 1, fontSize: '14px' }}>{spField.title}</span>
      {spField.required && (
        <span style={{ color: '#d13438', fontSize: '16px' }} title="必填">*</span>
      )}
    </div>
  );
};

export interface FieldPaletteProps {
  spFields?: SPFieldInfo[];
  isLoading?: boolean;
  error?: string | null;
}

const fieldPaletteStyle: React.CSSProperties = {
  padding: '16px',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const h3Style: React.CSSProperties = {
  margin: '0',
  fontSize: '16px',
  fontWeight: 600,
};

const pStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '12px',
  color: '#605e5c',
};

const fieldsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

export const FieldPalette: React.FC<FieldPaletteProps> = ({ spFields, isLoading = false, error = null }) => {
  // Ensure spFields is always an array to prevent undefined errors
  const fields = Array.isArray(spFields) ? spFields : [];

  // 自定义字段类型
  const customFieldTypes: CustomFieldType[] = [
    { type: 'richtext', label: '富文本编辑器', icon: '📝', description: '用于输入说明文字、提示信息等' },
  ];

  if (isLoading) {
    return (
      <div style={fieldPaletteStyle}>
        <div style={headerStyle}>
          <h3 style={h3Style}>列表字段</h3>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#605e5c' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={fieldPaletteStyle}>
        <div style={headerStyle}>
          <h3 style={h3Style}>列表字段</h3>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#d13438', fontSize: '13px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={fieldPaletteStyle}>
      {/* 自定义字段类型 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={headerStyle}>
          <h3 style={{ ...h3Style, color: '#0078d4' }}>自定义字段</h3>
          <p style={{ ...pStyle, color: '#0078d4' }}>
            通过右侧按钮添加字段（不保存到 SharePoint）
          </p>
        </div>
        <div style={fieldsContainerStyle}>
          {customFieldTypes.map(fieldType => (
            <DraggableCustomField key={fieldType.type} fieldType={fieldType} />
          ))}
        </div>
      </div>

      {/* SharePoint 列表字段 */}
      <div>
        <div style={headerStyle}>
          <h3 style={h3Style}>SharePoint 字段</h3>
          <p style={pStyle}>可添加字段（{fields.length}）</p>
        </div>
        <div style={fieldsContainerStyle}>
          {fields.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#605e5c', fontSize: '12px' }}>
              已没有可添加的字段
            </div>
          ) : (
            fields.map(spField => (
              <DraggableField key={spField.internalName} spField={spField} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
