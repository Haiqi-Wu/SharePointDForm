/**
 * Designer Canvas
 */

import * as React from 'react';
import { Text as CoreText } from '@microsoft/sp-core-library';
import { FormSchema, FormField, SPFieldInfo, FieldType } from '../../formEngine/core/types';
import { FieldLayout } from '../controls/FieldLayout';
import { PropertyPanel } from './PropertyPanel';
import { v4 as uuidv4 } from 'uuid';
import { TextField, PrimaryButton } from '@fluentui/react';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface DesignerCanvasProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
  spFields?: SPFieldInfo[];
  listName?: string;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({ schema, onChange, spFields, listName }) => {
  // Ensure spFields is always an array
  const safeSpFields = Array.isArray(spFields) ? spFields : [];
  const [selectedStepIndex, setSelectedStepIndex] = React.useState(0);
  const [selectedField, setSelectedField] = React.useState<FormField | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false);

  // Ensure currentStep exists to prevent undefined errors
  const currentStep = schema.steps?.[selectedStepIndex];
  if (!currentStep) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#605e5c' }}>
        {strings.DesignerStepNotFound}
      </div>
    );
  }
  const allFields = schema.steps.flatMap(s => s.fields).filter((f): f is FormField => f !== null && f.type !== 'newline');

  const handleSelectField = (field: FormField): void => {
    setSelectedField(field);
    setIsPropertyPanelOpen(true);
  };

  const handleDeleteField = (fieldId: string): void => {
    const newSteps = [...schema.steps];

    // 使用步骤级别的 theme
    const stepTheme = currentStep.theme || schema.theme;
    const themeLayout = stepTheme?.layout;
    const themeColumns = stepTheme?.columns;
    const isGridLayout = themeLayout === 'grid' && themeColumns && themeColumns > 1;

    if (isGridLayout) {
      // 网格布局：删除字段但保留 null 占位符
      const stepFields = [...currentStep.fields];
      const index = stepFields.findIndex(f => f !== null && f.id === fieldId);
      if (index >= 0) {
        stepFields[index] = null; // 替换为 null 而不是删除
        newSteps[selectedStepIndex] = { ...currentStep, fields: stepFields };
      }
    } else {
      // 垂直堆叠布局：过滤掉该字段和 null 值
      newSteps[selectedStepIndex] = { ...currentStep, fields: currentStep.fields.filter(f => f !== null && f.id !== fieldId) };
    }

    onChange({ ...schema, steps: newSteps });
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setIsPropertyPanelOpen(false);
    }
  };

  const handleSaveField = (field: FormField): void => {
    const newSteps = [...schema.steps];
    const stepFields = [...newSteps[selectedStepIndex].fields];
    const index = stepFields.findIndex(f => f !== null && f.id === field.id);
    if (index >= 0) {
      stepFields[index] = field;
      newSteps[selectedStepIndex] = { ...newSteps[selectedStepIndex], fields: stepFields };
      onChange({ ...schema, steps: newSteps });
    }
    setSelectedField(field);
  };

  const handleAddField = (
    index: number,
    spField: any,
    options?: { mode?: 'replace' | 'insert-row'; insertAt?: number; column?: number }
  ): void => {
    let insertIndex = index;
    const isCustom = Boolean(spField?.isCustom) || spField?.type === 'richtext';
    if (!isCustom) {
      // 检查是否为附件字段且是否已存在
      const isAttachmentField = spField.internalName === 'Attachments';
      if (isAttachmentField) {
        const hasExistingAttachment = schema.steps.some(step =>
          step.fields.some(field => field && field.fieldName === 'Attachments')
        );
        if (hasExistingAttachment) {
          alert(strings.DesignerAttachmentAlreadyExists);
          return;
        }
      }
    }

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
      'URL': 'url',
      'Hyperlink': 'url',
      'Image': 'image',
      'TaxonomyFieldType': 'taxonomy',
      'TaxonomyFieldTypeMulti': 'taxonomy',
      'Taxonomy': 'taxonomy',
      'TaxonomyMulti': 'taxonomy',
      'Attachments': 'attachment',
    };

    const fieldType = isCustom ? (spField.type as FieldType) : (typeMapping[spField.type] || 'text');

    // 构建 config 对象
    const config: Record<string, any> = {};
    if (!isCustom) {
      if (spField.lookupList) config.lookupList = spField.lookupList;
      if (spField.lookupField) config.lookupField = spField.lookupField;
      if (spField.choices && spField.choices.length > 0) {
        config.choices = spField.choices;
      }
      if (spField.allowMultipleValues) config.allowMultiple = spField.allowMultipleValues;
      if (spField.maxLength) config.maxLength = spField.maxLength;
      if (spField.termSetId) config.termSetId = spField.termSetId;
      // 为附件字段添加 listName
      if (spField.internalName === 'Attachments' && listName) {
        config.listName = listName;
      }
    }

    const fieldName = isCustom
      ? (spField.fieldName || `custom_${spField.type}_${Date.now()}`)
      : spField.internalName;

    // 创建新字段
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type: fieldType,
      label: String(spField.title ?? spField.label ?? spField.internalName ?? spField.fieldName ?? ''),
      fieldName: String(fieldName || ''),
      description: spField.description || undefined,
      required: Boolean(spField.required),
      config: Object.keys(config).length > 0 ? config : undefined,
    };

    // 插入字段到指定位置
    const newSteps = [...schema.steps];
    let stepFields = [...currentStep.fields];

    // 使用步骤级别的 theme（如果有的话），否则使用全局 theme
    const stepTheme = currentStep.theme || schema.theme;
    const themeLayout = stepTheme?.layout;
    const themeColumns = stepTheme?.columns;
    const isGridLayout = themeLayout === 'grid' && themeColumns && themeColumns > 1;

    if (isGridLayout) {
      // 网格布局：根据模式替换空位或插入整行
      const workingFields: (FormField | null)[] = [...stepFields];
      const cols = themeColumns || 1;

      if (options?.mode === 'insert-row' && cols > 1) {
        const insertAt = Math.max(0, options.insertAt ?? 0);
        const column = Math.max(0, Math.min(cols - 1, options.column ?? 0));

        // 确保插入点之前有足够占位符
        while (workingFields.length < insertAt) {
          workingFields.push(null);
        }

        const newRow: (FormField | null)[] = Array.from({ length: cols }, (_, i) => (i === column ? newField : null));
        workingFields.splice(insertAt, 0, ...newRow);
      } else {
        // 替换空位（按钮位置 -> 字段）
        while (workingFields.length <= insertIndex) {
          workingFields.push(null);
        }
        workingFields[insertIndex] = newField;
      }

      newSteps[selectedStepIndex] = { ...currentStep, fields: workingFields };
    } else {
      // 垂直堆叠布局：直接插入到指定位置，过滤掉 null
      const actualFields = stepFields.filter((f): f is FormField => f !== null && f.type !== 'newline');
      const safeInsertIndex = Math.min(insertIndex, actualFields.length);
      actualFields.splice(safeInsertIndex, 0, newField);
      newSteps[selectedStepIndex] = { ...currentStep, fields: actualFields };
    }

    onChange({ ...schema, steps: newSteps });
  };

  const handleAddStep = (): void => {
    // 新步骤使用默认布局（不继承全局或当前步骤的布局）
    const newStep = {
      id: uuidv4(),
      title: CoreText.format(strings.DesignerStepDefaultTitle, String(schema.steps.length + 1)),
      description: '',
      fields: [],
    };
    onChange({ ...schema, steps: [...schema.steps, newStep] });
    setSelectedStepIndex(schema.steps.length);
  };

  const handleDeleteStep = (): void => {
    if (schema.steps.length <= 1) return; // 至少保留一个步骤
    const newSteps = schema.steps.filter((_, index) => index !== selectedStepIndex);
    onChange({ ...schema, steps: newSteps });
    setSelectedStepIndex(Math.max(0, selectedStepIndex - 1));
  };

  const getStepTabStyle = (index: number): React.CSSProperties => ({
    padding: '8px 16px',
    background: index === selectedStepIndex ? '#0078d4' : 'white',
    color: index === selectedStepIndex ? 'white' : 'inherit',
    border: '1px solid #e1dfdd',
    borderRadius: '4px',
    cursor: 'pointer',
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        padding: '16px 24px',
        background: '#faf9f8',
        borderBottom: '1px solid #e1dfdd',
        gap: '8px',
        alignItems: 'center',
      }}>
        {schema.steps.map((step, index) => (
          <button
            key={step.id}
            style={getStepTabStyle(index)}
            onClick={() => setSelectedStepIndex(index)}
            onMouseEnter={(e) => {
              if (index !== selectedStepIndex) {
                e.currentTarget.style.background = '#f3f2f1';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== selectedStepIndex) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {step.title}
          </button>
        ))}
        <PrimaryButton
          onClick={handleAddStep}
          styles={{
            root: {
              marginLeft: 'auto',
              height: '32px',
            },
            label: {
              fontSize: '13px',
              fontWeight: 'normal',
            },
          }}
        >
          {strings.DesignerAddStep}
        </PrimaryButton>
        {schema.steps.length > 1 && (
          <button
            onClick={handleDeleteStep}
            style={{
              padding: '6px 12px',
              background: 'white',
              color: '#d13438',
              border: '1px solid #d13438',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fde7e9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            {strings.DesignerDeleteStep}
          </button>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e1dfdd',
        }}>
          <TextField
            value={currentStep.title}
            onChange={(_e, v) => {
              const newSteps = [...schema.steps];
              newSteps[selectedStepIndex] = { ...currentStep, title: v || '' };
              onChange({ ...schema, steps: newSteps });
            }}
            placeholder={strings.DesignerStepTitlePlaceholder}
            styles={{ root: { width: 300 } }}
          />
          <TextField
            value={currentStep.description || ''}
            onChange={(_e, v) => {
              const newSteps = [...schema.steps];
              newSteps[selectedStepIndex] = { ...currentStep, description: v || undefined };
              onChange({ ...schema, steps: newSteps });
            }}
            placeholder={strings.DesignerStepDescriptionPlaceholder}
            styles={{ root: { width: 400 } }}
          />
        </div>

        {/* 步骤可见性配置 - 只在单个步骤时显示 */}
        {schema.steps.length === 1 && (
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e1dfdd',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={currentStep.visible !== false}
                onChange={(e) => {
                  const newSteps = [...schema.steps];
                  newSteps[selectedStepIndex] = { ...currentStep, visible: e.target.checked };
                  onChange({ ...schema, steps: newSteps });
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{strings.DesignerShowStep}</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#605e5c' }}>
              {strings.DesignerShowStepHelp}
            </p>
          </div>
        )}

        {/* 步骤布局配置 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e1dfdd',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1, maxWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>{strings.DesignerStepLayout}</label>
            <select
              value={currentStep.theme?.layout || schema.theme?.layout || 'stack'}
              onChange={(e) => {
                const newLayout = e.target.value as 'stack' | 'grid';
                const newColumns = currentStep.theme?.columns || schema.theme?.columns || 3;

                // 如果切换到网格布局，需要初始化当前步骤的字段数组
                let updatedSteps = [...schema.steps];
                if (newLayout === 'grid' && newColumns > 1) {
                  // 切换到网格布局：为当前步骤添加 null 占位符
                  const stepFields = currentStep.fields;
                  const actualFields = stepFields.filter((f): f is FormField => f !== null);

                  // 如果字段数少于列数，添加 null 占位符
                  if (actualFields.length < newColumns) {
                    const paddedFields: (FormField | null)[] = [...actualFields];
                    while (paddedFields.length < newColumns) {
                      paddedFields.push(null);
                    }
                    updatedSteps[selectedStepIndex] = {
                      ...currentStep,
                      fields: paddedFields,
                      theme: { ...currentStep.theme, layout: newLayout, columns: newColumns }
                    };
                  } else {
                    updatedSteps[selectedStepIndex] = {
                      ...currentStep,
                      theme: { ...currentStep.theme, layout: newLayout, columns: newColumns }
                    };
                  }
                } else if (newLayout === 'stack') {
                  // 切换到垂直堆叠：移除所有 null 占位符
                  const stepFields = currentStep.fields;
                  const actualFields = stepFields.filter((f): f is FormField => f !== null);
                  updatedSteps[selectedStepIndex] = {
                    ...currentStep,
                    fields: actualFields,
                    theme: { ...currentStep.theme, layout: newLayout }
                  };
                }

                onChange({ ...schema, steps: updatedSteps });
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #8a8886',
                borderRadius: '4px',
                fontSize: 14,
              }}
            >
              <option value="stack">{strings.DesignerLayoutStack}</option>
              <option value="grid">{strings.DesignerLayoutGrid}</option>
            </select>
          </div>
          {(currentStep.theme?.layout || schema.theme?.layout) === 'grid' && (
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>{strings.DesignerColumns}</label>
              <select
                value={currentStep.theme?.columns || schema.theme?.columns || 1}
                onChange={(e) => {
                  const newColumns = parseInt(e.target.value, 10);

                  // 调整当前步骤的字段数组以适应新的列数
                  const stepFields = currentStep.fields;
                  const actualFields = stepFields.filter((f): f is FormField => f !== null);

                  // 计算需要的总位置数（向上取整到整行）
                  const currentRows = Math.ceil(actualFields.length / newColumns);
                  const targetPositions = Math.max(currentRows * newColumns, newColumns);

                  // 重建字段数组，保留 null 占位符
                  const rebuiltFields: (FormField | null)[] = [];
                  for (let i = 0; i < targetPositions; i++) {
                    if (i < actualFields.length) {
                      rebuiltFields.push(actualFields[i]);
                    } else {
                      rebuiltFields.push(null);
                    }
                  }

                  const newSteps = [...schema.steps];
                  newSteps[selectedStepIndex] = {
                    ...currentStep,
                    fields: rebuiltFields,
                    theme: { ...currentStep.theme, columns: newColumns }
                  };

                  onChange({ ...schema, steps: newSteps });
                }}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  border: '1px solid #8a8886',
                  borderRadius: '4px',
                  fontSize: 14,
                }}
              >
                <option value={1}>{CoreText.format(strings.DesignerColumnOption, '1')}</option>
                <option value={2}>{CoreText.format(strings.DesignerColumnOption, '2')}</option>
                <option value={3}>{CoreText.format(strings.DesignerColumnOption, '3')}</option>
                <option value={4}>{CoreText.format(strings.DesignerColumnOption, '4')}</option>
              </select>
            </div>
          )}
          {/* 标签位置配置 */}
          <div style={{ flex: 1, maxWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>{strings.PropLabelPositionLabel}</label>
            <select
              value={currentStep.theme?.labelPosition || schema.theme?.labelPosition || 'top'}
              onChange={(e) => {
                const newLabelPosition = e.target.value as 'top' | 'left';
                const newSteps = [...schema.steps];
                newSteps[selectedStepIndex] = {
                  ...currentStep,
                  theme: { ...currentStep.theme, labelPosition: newLabelPosition }
                };
                onChange({ ...schema, steps: newSteps });
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #8a8886',
                borderRadius: '4px',
                fontSize: 14,
              }}
            >
              <option value="top">{strings.PropLabelTop}</option>
              <option value="left">{strings.PropLabelLeft}</option>
            </select>
          </div>
        </div>

        <FieldLayout
          fields={currentStep.fields}
          allFields={allFields}
          onFieldSelect={handleSelectField}
          onFieldDelete={handleDeleteField}
          onFieldChange={handleSaveField}
          onAddField={handleAddField}
          layout={currentStep.theme?.layout || schema.theme?.layout}
          columns={currentStep.theme?.columns || schema.theme?.columns}
          spFields={safeSpFields}
        />
      </div>

      <PropertyPanel
        isOpen={isPropertyPanelOpen}
        field={selectedField || undefined}
        spFields={safeSpFields}
        allFields={allFields}
        onSave={handleSaveField}
        onClose={() => { setIsPropertyPanelOpen(false); setSelectedField(null); }}
      />
    </div>
  );
};
