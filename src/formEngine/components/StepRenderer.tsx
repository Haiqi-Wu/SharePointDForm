/**
 * Step Renderer
 */

import * as React from 'react';
import { FormStep, FieldState, FormField } from '../core/types';
import { FieldContainer } from './FieldContainer';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface StepRendererProps {
  step: FormStep;
  fields: Record<string, FieldState>;
  onFieldChange: (fieldId: string, value: any) => void;
  onFieldBlur: (fieldId: string) => void;
  lookupOptions?: Record<string, any[]>;
  onResolveUsers?: (filter: string) => Promise<any[]>;
  labelPosition?: 'top' | 'left';
  showFieldDescription?: boolean;
  layout?: 'stack' | 'grid';
  columns?: number;
  spfxContext?: any;
  itemId?: number;
  disabled?: boolean;
}

export const StepRenderer: React.FC<StepRendererProps> = ({
  step, fields, onFieldChange, onFieldBlur, lookupOptions, onResolveUsers, labelPosition = 'top', showFieldDescription, layout = 'stack', columns = 1, spfxContext, itemId, disabled,
}) => {
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsNarrow(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);
  const visibleFields = step.fields.filter((field): field is FormField => {
    if (!field) return false; // 过滤 null 占位符
    const fieldState = fields[field.id];
    return fieldState && fieldState.visible;
  });

  if (visibleFields.length === 0) {
    return <div className="form-step--empty">{strings.StepEmptyNoVisibleFields}</div>;
  }

  // 判断是否使用网格布局
  const useGridLayout = layout === 'grid' && columns > 1;

  // 计算每个字段的网格样式
  const getFieldStyle = (field: FormField): React.CSSProperties => {
    if (!useGridLayout) return {};

    const columnSpan = field.columnSpan || 1;
    const width = '100%';
    const minWidth = 0;

    if (field.startNewRow) {
      return {
        gridColumn: '1 / -1',
        width,
        minWidth,
      };
    }

    return {
      gridColumn: `span ${Math.min(columnSpan, columns)}`,
      width,
      minWidth,
    };
  };

  const usePlaceholders = useGridLayout && step.fields.some(f => f === null);
  const effectiveColumns = useGridLayout ? (isNarrow ? 1 : columns) : columns;
  const gridStyle: React.CSSProperties = useGridLayout ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))`,
    gap: '16px',
    ...(usePlaceholders ? { gridAutoRows: 'minmax(60px, auto)' } : {}),
  } : {};
  const renderFields = usePlaceholders ? step.fields : visibleFields;

  return (
    <div className={`form-step form-step--${step.id}`}>
      {step.title && (
        <div className="form-step__title">
          <h2>{step.title}</h2>
          {step.description && <p className="form-step__description">{step.description}</p>}
        </div>
      )}
      <div className={`form-step__fields ${useGridLayout ? 'form-step__fields--grid' : ''}`} style={gridStyle}>
        {renderFields.map((field, index) => {
          if (!field) {
            return usePlaceholders ? (
              <div key={`empty-${index}`} style={{ minHeight: '60px', width: '100%' }} />
            ) : null;
          }

          const fieldState = fields[field.id];
          if (!fieldState || !fieldState.visible) {
            return usePlaceholders ? (
              <div key={`empty-${index}`} style={{ minHeight: '60px', width: '100%' }} />
            ) : null;
          }

          // 换行符字段直接渲染，不包裹 FieldContainer
          if (field.type === 'newline') {
            return (
              <div key={field.id} style={getFieldStyle(field)}>
                <div style={{
                  width: '100%',
                  gridColumn: '1 / -1',
                  height: '1px',
                  background: 'transparent',
                  margin: '8px 0',
                }} />
              </div>
            );
          }

          return (
            <div key={field.id} style={getFieldStyle(field)}>
              <FieldContainer
                field={field}
                state={fieldState}
                value={fieldState.value}
                onChange={(v) => onFieldChange(field.id, v)}
                onBlur={() => onFieldBlur(field.id)}
                lookupOptions={lookupOptions}
                onResolveUsers={onResolveUsers}
                labelPosition={labelPosition}
                showFieldDescription={showFieldDescription}
                spfxContext={spfxContext}
                itemId={itemId}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
