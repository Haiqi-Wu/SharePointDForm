/**
 * Field Layout
 */

import * as React from 'react';
 
import { FormField } from '../../formEngine/core/types';
import { DesignerFieldRenderer } from '../components/DesignerFieldRenderer';

interface FieldBlockProps {
  field: FormField;
  onSelect?: (field: FormField) => void;
  onDelete?: (fieldId: string) => void;
  onFieldChange?: (field: FormField) => void;
  columnSpan?: number;
  totalColumns?: number;
  startNewRow?: boolean;
}

const fieldBlockStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  marginBottom: '8px',
  background: 'white',
  border: '1px solid #e1dfdd',
  borderRadius: '4px',
  cursor: 'default',
};

const fieldBlockGridStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  background: 'white',
  border: '1px solid #e1dfdd',
  borderRadius: '4px',
  cursor: 'default',
  minHeight: '60px',
};

const fieldBlockHoverStyle: React.CSSProperties = {
  ...fieldBlockStyle,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
};

const FieldBlock: React.FC<FieldBlockProps> = ({
  field,
  onSelect,
  onDelete,
  onFieldChange,
  columnSpan,
  totalColumns,
  startNewRow,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // 调试：检查字段数据
  React.useEffect(() => {
    if (typeof field.label !== 'string') {
    }
    if (field.config && typeof field.config !== 'object') {
    }
  }, [field]);

  const style = {
    ...(isHovered ? fieldBlockHoverStyle : fieldBlockStyle),
  };

  const gridStyle: React.CSSProperties = {
    ...fieldBlockGridStyle,
    ...(isHovered ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' } : {}),
    ...(totalColumns && (columnSpan || startNewRow) ? {
      ...(startNewRow ? {
        gridColumn: '1 / -1',
        width: '100%',
      } : {
        gridColumn: `span ${Math.min(columnSpan || 1, totalColumns)}`,
      }),
    } : {}),
  };

  // 富文本字段直接显示编辑器
  if (field.type === 'richtext') {
    return (
      <div
        style={totalColumns ? gridStyle : style}
      >
        <div style={{ position: 'relative' }}>
          {/* 控制栏 - 放在编辑器上方 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            background: '#f8f8f8',
            border: '1px solid #e1dfdd',
            borderBottom: 'none',
            borderRadius: '4px 4px 0 0',
          }}>
            <div style={{
              color: '#605e5c',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'white',
              border: '1px solid #e1dfdd',
              userSelect: 'none',
            }}>富文本</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                style={{
                  background: 'white',
                  border: '1px solid #e1dfdd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '14px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(field.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="删除"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fde7e9';
                  e.currentTarget.style.color = '#a80000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = 'inherit';
                }}
              >🗑️ 删除</button>
            </div>
          </div>
          <DesignerFieldRenderer
            field={field}
            onChange={onFieldChange || (() => {})}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={totalColumns ? gridStyle : style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
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
            {field.required && <span style={{ color: '#d13438', marginLeft: '4px' }}>*</span>}
          </div>
          {totalColumns && columnSpan && columnSpan > 1 && !startNewRow && (
            <div style={{
              padding: '2px 6px',
              background: '#0078d4',
              color: 'white',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {columnSpan}列
            </div>
          )}
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

export interface FieldLayoutProps {
  fields: (FormField | null)[]; // 允许 null 占位符以保持网格布局的正确位置
  allFields?: FormField[];
  onFieldSelect?: (field: FormField) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldChange?: (field: FormField) => void;
  onAddField?: (
    insertIndex: number,
    spField: any,
    options?: { mode?: 'replace' | 'insert-row'; insertAt?: number; column?: number }
  ) => void;
  layout?: 'stack' | 'grid';
  columns?: number;
  spFields?: any[];
}

const fieldLayoutStyle: React.CSSProperties = {
  minHeight: '400px',
  padding: '24px',
  background: '#faf9f8',
  border: '2px dashed #e1dfdd',
  borderRadius: '8px',
};

const fieldLayoutGridStyle: React.CSSProperties = {
  ...fieldLayoutStyle,
  display: 'grid',
  gap: '16px',
};


export const FieldLayout: React.FC<FieldLayoutProps> = ({
  fields,
  allFields,
  onFieldSelect,
  onFieldDelete,
  onFieldChange,
  onAddField,
  layout = 'stack',
  columns = 1,
  spFields = []
}) => {
  // Ensure fields is always an array to prevent undefined errors
  const safeFields = Array.isArray(fields) ? fields : [];
  const safeAllFields = Array.isArray(allFields)
    ? allFields
    : safeFields.filter((f): f is FormField => f !== null);

  const spInternalNames = React.useMemo(() => {
    return new Set(spFields.map((f: any) => f.internalName));
  }, [spFields]);

  const usedFieldNames = React.useMemo(() => {
    const names = new Set<string>();
    for (const field of safeAllFields) {
      if (!field?.fieldName) continue;
      if (field.type === 'richtext' || field.type === 'newline') continue;
      if (spInternalNames.size > 0 && !spInternalNames.has(field.fieldName)) continue;
      names.add(field.fieldName);
    }
    return names;
  }, [safeAllFields, spInternalNames]);

  // 判断是否使用网格布局
  const useGridLayout = layout === 'grid' && columns > 1;

  const gridFields = safeFields.map(f => (f && f.type === 'newline') ? null : f);
  const stackFields = safeFields.filter((f): f is FormField => f !== null && f.type !== 'newline');


  const [showFieldPicker, setShowFieldPicker] = React.useState(false);
  const [insertIndex, setInsertIndex] = React.useState(0);
  const [insertOptions, setInsertOptions] = React.useState<{ mode?: 'replace' | 'insert-row'; insertAt?: number; column?: number } | null>(null);

  // 计算容器样式
  const getContainerStyle = (): React.CSSProperties => {
    if (useGridLayout) {
      return {
        ...fieldLayoutStyle,
        ...fieldLayoutGridStyle,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      };
    }

    return fieldLayoutStyle;
  };

  // 处理添加字段
  const handleAddField = (gridPositionIndex: number, options?: { mode?: 'replace' | 'insert-row'; insertAt?: number; column?: number }) => {
    // 直接使用网格位置索引作为插入索引
    // 网格位置索引和字段数组索引是一一对应的
    setInsertIndex(gridPositionIndex);
    setInsertOptions(options || null);
    setShowFieldPicker(true);
  };

  // 渲染字段选择面板
  const renderFieldPicker = () => {
    if (!showFieldPicker) return null;
    const selectableSpFields = spFields.filter((spField: any) => !usedFieldNames.has(spField.internalName));
    const customPickerFields = [
      { type: 'richtext', title: '富文本编辑器', description: '用于输入说明文字、提示信息等', isCustom: true },
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }} onClick={() => setShowFieldPicker(false)}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          width: '400px',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e1dfdd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>选择要添加的字段</h3>
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
              onClick={() => setShowFieldPicker(false)}
            >
              ×
            </button>
          </div>
          <div style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
          }}>
            <div style={{ fontSize: '12px', color: '#605e5c', marginBottom: '8px' }}>自定义字段</div>
            {customPickerFields.map((customField) => (
              <div
                key={customField.type}
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid #c7e0f4',
                  background: '#e6f2ff',
                  marginBottom: '12px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dcefff';
                  e.currentTarget.style.borderColor = '#0078d4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e6f2ff';
                  e.currentTarget.style.borderColor = '#c7e0f4';
                }}
                onClick={() => {
                  const customFieldName = `custom_${customField.type}_${Date.now()}`;
                  onAddField?.(insertIndex, {
                    ...customField,
                    fieldName: customFieldName,
                    internalName: customFieldName,
                  }, insertOptions || undefined);
                  setShowFieldPicker(false);
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{customField.title}</div>
                <div style={{ fontSize: '12px', color: '#605e5c' }}>
                  {customField.description}
                </div>
              </div>
            ))}

            <div style={{ fontSize: '12px', color: '#605e5c', marginBottom: '8px' }}>SharePoint 字段</div>
            {selectableSpFields.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#605e5c', padding: '12px 0' }}>
                已没有可添加的字段
              </div>
            ) : (
              selectableSpFields.map((spField: any) => (
                <div
                  key={spField.internalName}
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #e1dfdd',
                    marginBottom: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f2f1';
                    e.currentTarget.style.borderColor = '#0078d4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e1dfdd';
                  }}
                  onClick={() => {
                    onAddField?.(insertIndex, spField, insertOptions || undefined);
                    setShowFieldPicker(false);
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{spField.title}</div>
                  <div style={{ fontSize: '12px', color: '#605e5c' }}>
                    类型: {spField.type} | 内部名称: {spField.internalName}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染"添加字段"按钮
  const renderAddButton = (
    positionIndex: number,
    options?: { mode?: 'replace' | 'insert-row'; insertAt?: number; column?: number },
    keyOverride?: string
  ) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (useGridLayout) {
        e.currentTarget.style.background = '#e6f2ff';
        e.currentTarget.style.borderColor = '#005a9e';
        e.currentTarget.style.color = '#005a9e';
      } else {
        e.currentTarget.style.background = '#e6f2ff';
        e.currentTarget.style.borderColor = '#005a9e';
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (useGridLayout) {
        e.currentTarget.style.background = '#f8f8f8';
        e.currentTarget.style.borderColor = '#c7e0f4';
        e.currentTarget.style.color = '#0078d4';
      } else {
        e.currentTarget.style.background = '#f8f8f8';
        e.currentTarget.style.borderColor = '#0078d4';
      }
    };

    // 网格布局：显示简洁的"+"按钮
    if (useGridLayout) {
      const gridButtonStyle: React.CSSProperties = {
        width: '100%',
        height: '80px',
        minHeight: '80px',
        background: '#f8f8f8',
        border: '2px dashed #c7e0f4',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '32px',
        color: '#0078d4',
        fontWeight: 300,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

      return (
        <button
          key={keyOverride || `add-${positionIndex}`}
          style={gridButtonStyle}
          onClick={() => handleAddField(positionIndex, options)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          title="点击添加字段"
        >
          +
        </button>
      );
    }

    // 垂直堆叠布局：单个添加按钮
    const stackButtonStyle: React.CSSProperties = {
      width: '100%',
      padding: '16px',
      background: '#f8f8f8',
      border: '2px dashed #0078d4',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#0078d4',
      fontWeight: 500,
      transition: 'all 0.2s',
      textAlign: 'center',
    };

    return (
      <div key={keyOverride || `add-${positionIndex}`} style={{ padding: '8px 0' }}>
        <button
          style={stackButtonStyle}
          onClick={() => handleAddField(positionIndex, options)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          + 在此处添加字段
        </button>
      </div>
    );
  };

  // 构建网格位置映射（仅用于网格布局）
  interface GridPosition {
    key: string;
    index: number;
    field: FormField | null; // null 表示按钮位置
    mode?: 'replace' | 'insert-row';
    insertAt?: number;
    column?: number;
  }

  const buildGridPositions = (): GridPosition[] => {
    // 初始状态（无字段）：返回1行按钮
    if (!useGridLayout) {
      return [];
    }

    // 计算最后一个非 null 的位置来确定现有行数
    let lastFilledIndex = -1;
    for (let i = gridFields.length - 1; i >= 0; i--) {
      if (gridFields[i] !== null) {
        lastFilledIndex = i;
        break;
      }
    }

    const baseRows = lastFilledIndex >= 0 ? Math.floor(lastFilledIndex / columns) + 1 : 1;
    const basePositions = Math.max(gridFields.length, baseRows * columns);

    // 添加了字段后，上下各增加一行按钮（初始化无字段不显示）
    const extraRows = lastFilledIndex >= 0 ? 2 : 0;
    const totalPositions = basePositions + extraRows * columns;
    const positions: GridPosition[] = [];

    // 顶部额外一行按钮
    if (extraRows > 0) {
      for (let c = 0; c < columns; c++) {
        positions.push({
          key: `add-top-${c}`,
          index: c,
          field: null,
          mode: 'insert-row',
          insertAt: 0,
          column: c,
        });
      }
    }

    // 中间现有网格
    for (let i = 0; i < basePositions; i++) {
      const fieldIndex = i;
      const field = fieldIndex < gridFields.length ? gridFields[fieldIndex] : null;
      positions.push({
        key: `pos-${i}`,
        index: fieldIndex,
        field: field,
        mode: 'replace',
      });
    }

    // 底部额外一行按钮
    if (extraRows > 0) {
      for (let c = 0; c < columns; c++) {
        positions.push({
          key: `add-bottom-${c}`,
          index: basePositions + c,
          field: null,
          mode: 'insert-row',
          insertAt: basePositions,
          column: c,
        });
      }
    }

    return positions;
  };

  return (
    <>
      {renderFieldPicker()}
      <div style={getContainerStyle()}>
        {useGridLayout ? (
          // 网格布局：使用位置映射渲染
          <>
            {buildGridPositions().map((position) => {
              if (position.field === null) {
                // 按钮位置
                return renderAddButton(
                  position.index,
                  position.mode ? { mode: position.mode, insertAt: position.insertAt, column: position.column } : undefined,
                  position.key
                );
              } else {
                // 字段位置
                const field = position.field;
                return (
                  <FieldBlock
                    key={field.id}
                    field={field}
                    onSelect={onFieldSelect}
                    onDelete={onFieldDelete}
                    onFieldChange={onFieldChange}
                    columnSpan={field.columnSpan || 1}
                    totalColumns={columns}
                    startNewRow={field.startNewRow}
                  />
                );
              }
            })}
          </>
        ) : (
          // 垂直堆叠布局：保持原有逻辑
          <>
            {stackFields.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '48px 24px',
                color: '#605e5c',
              }}>
                <div style={{ fontSize: '16px' }}>
                  点击下方按钮添加字段
                </div>
                <button
                  style={{
                    padding: '16px 32px',
                    background: '#0078d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                  onClick={() => handleAddField(0)}
                >
                  + 添加第一个字段
                </button>
              </div>
            ) : (
              <>
                {stackFields.map((field, index) => (
                  <React.Fragment key={field.id}>
                    {renderAddButton(index)}
                    <FieldBlock
                      field={field}
                      onSelect={onFieldSelect}
                      onDelete={onFieldDelete}
                      onFieldChange={onFieldChange}
                      columnSpan={field.columnSpan || 1}
                      totalColumns={undefined}
                      startNewRow={field.startNewRow}
                    />
                  </React.Fragment>
                ))}
                {renderAddButton(stackFields.length)}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
