/**
 * Drop Zone Control
 */

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '../../formEngine/core/types';

interface SortableFieldProps {
  field: FormField;
  onSelect?: (field: FormField) => void;
  onDelete?: (fieldId: string) => void;
}

const sortableFieldStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  marginBottom: '8px',
  background: 'white',
  border: '1px solid #e1dfdd',
  borderRadius: '4px',
  cursor: 'grab',
};

const sortableFieldHoverStyle: React.CSSProperties = {
  ...sortableFieldStyle,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
};

const SortableField: React.FC<SortableFieldProps> = ({ field, onSelect, onDelete }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const [isHovered, setIsHovered] = React.useState(false);

  // 调试：检查字段数据
  React.useEffect(() => {
    if (typeof field.label !== 'string') {
      console.warn('Invalid field label:', field.id, field.label, field);
    }
    if (field.config && typeof field.config !== 'object') {
      console.warn('Invalid field config:', field.id, field.config, field);
    }
  }, [field]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isHovered ? sortableFieldHoverStyle : sortableFieldStyle),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <div {...listeners} style={{ color: '#605e5c', cursor: 'grab' }} title="拖拽">⋮⋮</div>
        <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            padding: '4px 8px',
            background: '#f3f2f1',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: '#605e5c',
          }}>{field.type}</div>
          <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
            {typeof field.label === 'string' ? field.label : '[Invalid Label]'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(field);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="编辑"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f2f1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >✏️</button>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(field.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="删除"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fde7e9'; e.currentTarget.style.color = '#a80000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}
          >🗑️</button>
        </div>
      </div>
    </div>
  );
};

export interface DropZoneProps {
  stepId: string;
  fields: FormField[];
  onFieldSelect?: (field: FormField) => void;
  onFieldDelete?: (fieldId: string) => void;
}

const dropZoneStyle: React.CSSProperties = {
  minHeight: '400px',
  padding: '24px',
  background: '#faf9f8',
  border: '2px dashed #e1dfdd',
  borderRadius: '8px',
};

const dropZoneOverStyle: React.CSSProperties = {
  ...dropZoneStyle,
  background: '#edebe9',
  borderColor: '#0078d4',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  color: '#605e5c',
};

export const DropZone: React.FC<DropZoneProps> = ({ stepId, fields, onFieldSelect, onFieldDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dropzone-${stepId}` });
  // Ensure fields is always an array to prevent undefined errors
  const safeFields = Array.isArray(fields) ? fields : [];
  const fieldIds = safeFields.map(f => f.id);

  return (
    <div ref={setNodeRef} style={isOver ? dropZoneOverStyle : dropZoneStyle}>
      {safeFields.length === 0 ? (
        <div style={emptyStateStyle}>拖拽字段到此处</div>
      ) : (
        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
          {safeFields.map(field => (
            <SortableField key={field.id} field={field} onSelect={onFieldSelect} onDelete={onFieldDelete} />
          ))}
        </SortableContext>
      )}
    </div>
  );
};
