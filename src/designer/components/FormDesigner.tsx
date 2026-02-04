/**
 * Form Designer
 */

import * as React from 'react';
import { FormSchema, SPFieldInfo, FieldType } from '../../formEngine/core/types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { FieldPalette } from '../controls/DraggableField';
import { DesignerCanvas } from './DesignerCanvas';
import { SharePointDataSource } from '../../formEngine/data/SharePointDataSource';

export interface FormDesignerProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
  onSave?: () => void;
  context?: any;
  listName?: string;
}

export const FormDesigner: React.FC<FormDesignerProps> = ({ schema, onChange, context, listName }) => {
  const [draggedField, setDraggedField] = React.useState<{ type: FieldType; label: string; fieldName: string } | null>(null);
  const [spFields, setSpFields] = React.useState<SPFieldInfo[]>([]);
  const [isLoadingFields, setIsLoadingFields] = React.useState(true);
  const [fieldsError, setFieldsError] = React.useState<string | null>(null);

  // 获取已使用的字段名集合
  const usedFieldNames = React.useMemo(() => {
    const used = new Set<string>();
    for (const step of schema.steps) {
      for (const field of step.fields) {
        used.add(field.fieldName);
      }
    }
    return used;
  }, [schema]);

  // 过滤后的可用字段
  const availableFields = React.useMemo(() => {
    return spFields.filter(field => !usedFieldNames.has(field.internalName));
  }, [spFields, usedFieldNames]);

  // 加载 SharePoint 字段
  React.useEffect(() => {
    const loadFields = async (): Promise<void> => {
      setIsLoadingFields(true);
      setFieldsError(null);
      if (context && listName) {
        try {
          const dataSource = new SharePointDataSource(context);
          const fields = await dataSource.getListFields(listName);
          setSpFields(fields);
        } catch (error: any) {
          console.error('Error loading fields:', error);
          setFieldsError(error?.message || '加载字段失败');
        }
      } else if (!listName) {
        setFieldsError('未选择列表');
      }
      setIsLoadingFields(false);
    };
    void loadFields();
  }, [context, listName]);

  const handleDragStart = (event: DragStartEvent): void => {
    const data = event.active.data.current as { type: FieldType; label: string; fieldName: string } | undefined;
    if (data) setDraggedField(data);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { over, active } = event;

    // 处理已有字段的排序
    if (active.id.toString().startsWith('f_')) {
      if (over && over.id.toString().startsWith('f_')) {
        // 找到包含这些字段的步骤
        let sourceStepIndex = -1;
        let targetStepIndex = -1;
        let sourceFieldIndex = -1;
        let targetFieldIndex = -1;

        for (let i = 0; i < schema.steps.length; i++) {
          const step = schema.steps[i];
          const sourceIdx = step.fields.findIndex(f => f.id === active.id);
          const targetIdx = step.fields.findIndex(f => f.id === over.id);

          if (sourceIdx >= 0) {
            sourceStepIndex = i;
            sourceFieldIndex = sourceIdx;
          }
          if (targetIdx >= 0) {
            targetStepIndex = i;
            targetFieldIndex = targetIdx;
          }
        }

        if (sourceStepIndex >= 0 && targetStepIndex >= 0) {
          const newSteps = [...schema.steps];
          const sourceStep = { ...newSteps[sourceStepIndex], fields: [...newSteps[sourceStepIndex].fields] };
          const [movedField] = sourceStep.fields.splice(sourceFieldIndex, 1);

          if (sourceStepIndex === targetStepIndex) {
            // 同一步骤内排序
            sourceStep.fields.splice(targetFieldIndex, 0, movedField);
            newSteps[sourceStepIndex] = sourceStep;
          } else {
            // 跨步骤移动
            const targetStep = { ...newSteps[targetStepIndex], fields: [...newSteps[targetStepIndex].fields] };
            targetStep.fields.splice(targetFieldIndex, 0, movedField);
            newSteps[sourceStepIndex] = sourceStep;
            newSteps[targetStepIndex] = targetStep;
          }

          onChange({ ...schema, steps: newSteps });
        }
      }
      setDraggedField(null);
      return;
    }

    // 处理从字段面板拖拽新字段
    if (over && over.id.toString().startsWith('dropzone-')) {
      const data = active.data.current as {
        type: FieldType;
        label: string;
        fieldName: string;
        required?: boolean;
        lookupList?: string;
        lookupField?: string;
        choices?: string[];
        allowMultipleValues?: boolean;
        maxLength?: number;
      } | undefined;
      if (data) {
        const stepId = over.id.toString().replace('dropzone-', '');
        const stepIndex = schema.steps.findIndex(s => s.id === stepId);
        if (stepIndex >= 0) {
          // SPFieldType 到 FormField type 的映射
          const typeMapping: Record<string, FieldType> = {
            'Text': 'text',
            'Note': 'multiline',
            'Number': 'number',
            'Integer': 'number',
            'DateTime': 'datetime',
            'Choice': 'dropdown',
            'MultiChoice': 'multiselect',
            'Lookup': 'lookup',
            'User': 'person',
            'UserMulti': 'person',
            'Boolean': 'boolean',
          };

          const fieldType = typeMapping[data.type] || 'text';

          // 构建 config 对象，包含 SP 特定属性
          const config: Record<string, any> = {};
          if (data.lookupList) config.lookupList = data.lookupList;
          if (data.lookupField) config.lookupField = data.lookupField;
          if (data.choices && data.choices.length > 0) config.choices = data.choices;
          if (data.allowMultipleValues) config.allowMultiple = data.allowMultipleValues;
          if (data.maxLength) config.maxLength = data.maxLength;

          // 确保所有值都是正确的类型
          const newField = {
            id: `f_${Date.now()}`,
            type: fieldType,
            label: String(data.label || ''),
            fieldName: String(data.fieldName || ''),
            // 直接使用 SharePoint 字段的必填设置
            required: data.required,
            config: Object.keys(config).length > 0 ? config : undefined,
          };
          const newSteps = [...schema.steps];
          newSteps[stepIndex] = { ...newSteps[stepIndex], fields: [...newSteps[stepIndex].fields, newField] };
          onChange({ ...schema, steps: newSteps });
        }
      }
    }
    setDraggedField(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f3f2f1' }}>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '280px', background: 'white', borderRight: '1px solid #e1dfdd', overflowY: 'auto' }}>
            <FieldPalette spFields={availableFields} isLoading={isLoadingFields} error={fieldsError} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <DesignerCanvas schema={schema} onChange={onChange} spFields={spFields} />
          </div>
        </div>

        <DragOverlay>
          {draggedField && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#0078d4',
              color: 'white',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              opacity: 0.9,
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '18px' }}>📝</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{draggedField.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
