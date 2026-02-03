/**
 * Draggable Field Control
 */

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FieldType, SPFieldInfo, SPFieldType } from '../../formEngine/core/types';

export interface DraggableFieldProps {
  spField: SPFieldInfo;
}

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
  cursor: 'grab',
  marginBottom: '8px',
};

const draggableFieldHoverStyle: React.CSSProperties = {
  ...draggableFieldStyle,
  background: '#edebe9',
};

export const DraggableField: React.FC<DraggableFieldProps> = ({ spField }) => {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `spfield-${spField.internalName}`,
    data: {
      type: String(spField.type),
      label: String(spField.title || spField.internalName),
      fieldName: String(spField.internalName),
      required: Boolean(spField.required),
    },
  });

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...(isHovered ? draggableFieldHoverStyle : draggableFieldStyle),
        opacity: isDragging ? 0.5 : 1,
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

  if (fields.length === 0) {
    return (
      <div style={fieldPaletteStyle}>
        <div style={headerStyle}>
          <h3 style={h3Style}>列表字段</h3>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#605e5c' }}>
          未加载到字段
        </div>
      </div>
    );
  }

  return (
    <div style={fieldPaletteStyle}>
      <div style={headerStyle}>
        <h3 style={h3Style}>列表字段</h3>
        <p style={pStyle}>拖拽字段到画布 ({fields.length})</p>
      </div>
      <div style={fieldsContainerStyle}>
        {fields.map(spField => (
          <DraggableField key={spField.internalName} spField={spField} />
        ))}
      </div>
    </div>
  );
};
