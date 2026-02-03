/**
 * Property Panel
 */

import * as React from 'react';
import { Panel, TextField, Dropdown, PrimaryButton, DefaultButton, Toggle } from '@fluentui/react';
import { FormField, FieldType, SPFieldInfo } from '../../formEngine/core/types';

export interface PropertyPanelProps {
  isOpen: boolean;
  field?: FormField;
  spFields?: SPFieldInfo[];
  onSave: (field: FormField) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  isOpen, field, spFields, onSave, onClose,
}) => {
  const [editedField, setEditedField] = React.useState<FormField | null>(null);

  React.useEffect(() => {
    setEditedField(field ? { ...field } : null);
  }, [field]);

  // 安全地更新 config 对象
  const updateConfig = React.useCallback((updates: Partial<FormField['config']>) => {
    if (!editedField) return;
    setEditedField({
      ...editedField,
      config: {
        ...(editedField.config || {}),
        ...updates,
      },
    });
  }, [editedField]);

  // 清理对象中的 undefined 值
  const cleanField = React.useCallback((fieldToClean: FormField): FormField => {
    const cleaned = { ...fieldToClean };
    if (cleaned.config && Object.keys(cleaned.config).length === 0) {
      delete cleaned.config;
    }
    return cleaned;
  }, []);

  const handleSave = React.useCallback((): void => {
    if (editedField) {
      onSave(cleanField(editedField));
      onClose();
    }
  }, [editedField, onSave, onClose, cleanField]);

  const renderFooter = React.useCallback(() => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <DefaultButton onClick={onClose}>取消</DefaultButton>
      <PrimaryButton onClick={handleSave} disabled={!editedField}>保存</PrimaryButton>
    </div>
  ), [onClose, handleSave, editedField]);

  // Ensure spFields is always an array
  const safeSpFields = spFields ?? [];

  const fieldTypes = [
    { key: 'text', text: '单行文本' },
    { key: 'multiline', text: '多行文本' },
    { key: 'number', text: '数字' },
    { key: 'datetime', text: '日期时间' },
    { key: 'dropdown', text: '下拉选择' },
    { key: 'multiselect', text: '多选' },
    { key: 'lookup', text: '查找' },
    { key: 'person', text: '人员' },
    { key: 'boolean', text: '是/否' },
  ];

  // SharePoint 字段选项
  const spFieldOptions = React.useMemo(() => {
    return safeSpFields.map(f => ({
      key: f.internalName,
      text: `${f.title} (${f.internalName})`,
    }));
  }, [safeSpFields]);

  // 是否有 SharePoint 字段可用
  const hasSpFields = safeSpFields.length > 0;

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onClose}
      headerText="字段属性"
      isFooterAtBottom={true}
      onRenderFooterContent={renderFooter}
    >
      <div style={{ padding: '16px 0' }}>
        {!editedField ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#605e5c' }}>加载中...</div>
        ) : (
          <>
            <TextField label="字段 ID" value={editedField.id} onChange={(_e, v) => setEditedField({ ...editedField, id: v || '' })} required readOnly={!!field} styles={{ root: { marginBottom: 12 } }} />
            <Dropdown label="字段类型" options={fieldTypes} selectedKey={editedField.type} onChange={(_e, opt) => setEditedField({ ...editedField, type: opt!.key as FieldType })} required styles={{ root: { marginBottom: 12 } }} />
            <TextField label="字段标签" value={editedField.label} onChange={(_e, v) => setEditedField({ ...editedField, label: v || '' })} required styles={{ root: { marginBottom: 12 } }} />
            {hasSpFields ? (
              <Dropdown
                label="SP 字段名"
                placeholder="选择 SharePoint 列表字段"
                options={spFieldOptions}
                selectedKey={editedField.fieldName}
                onChange={(_e, opt) => setEditedField({ ...editedField, fieldName: opt!.key as string })}
                required
                styles={{ root: { marginBottom: 12 } }}
              />
            ) : (
              <TextField
                label="SP 字段名"
                value={editedField.fieldName}
                onChange={(_e, v) => setEditedField({ ...editedField, fieldName: v || '' })}
                required
                placeholder="输入 SharePoint 字段内部名称"
                styles={{ root: { marginBottom: 12 } }}
              />
            )}
            {!hasSpFields && (
              <div style={{ marginBottom: 12, padding: '12px', background: '#fff4ce', border: '1px solid #ffb900', borderRadius: '4px', fontSize: '12px' }}>
                ⚠️ 未加载到 SharePoint 字段。请确保已选择列表并刷新页面。
              </div>
            )}
            <TextField
              label="占位符"
              value={typeof editedField.config?.placeholder === 'string' ? editedField.config.placeholder : ''}
              onChange={(_e, v) => updateConfig({ placeholder: v || undefined })}
              styles={{ root: { marginBottom: 12 } }}
            />
            <div style={{ marginBottom: 12 }}>
              <Toggle
                label="默认可见"
                checked={editedField.visible !== false}
                onChange={(_e, checked) => setEditedField({ ...editedField, visible: checked ? undefined : false })}
                styles={{ root: { marginBottom: 8 } }}
              />
              <TextField
                label="或输入可见条件表达式"
                value={typeof editedField.visible === 'string' ? editedField.visible : ''}
                onChange={(_e, v) => setEditedField({ ...editedField, visible: v || undefined })}
                placeholder="例如：{{Department}} eq 'IT'"
                styles={{ root: { marginBottom: 0 } }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Toggle
                label="必填字段"
                checked={typeof editedField.required === 'boolean' ? editedField.required : false}
                onChange={(_e, checked) => setEditedField({ ...editedField, required: checked ? true : undefined })}
                styles={{ root: { marginBottom: 8 } }}
              />
              <TextField
                label="或输入必填条件表达式"
                value={typeof editedField.required === 'string' ? editedField.required : ''}
                onChange={(_e, v) => setEditedField({ ...editedField, required: v || undefined })}
                placeholder="例如：{{Status}} eq 'Approved'"
                styles={{ root: { marginBottom: 0 } }}
              />
            </div>
            {(editedField.type === 'dropdown' || editedField.type === 'multiselect') && (
              <TextField
                label="选项（逗号分隔）"
                value={Array.isArray(editedField.config?.choices) ? editedField.config.choices.join(', ') : ''}
                onChange={(_e, v) => updateConfig({ choices: v ? v.split(',').map(s => s.trim()) : undefined })}
                multiline
                rows={3}
                styles={{ root: { marginBottom: 12 } }}
              />
            )}
            {editedField.type === 'number' && (
              <>
                <TextField
                  label="最小值"
                  type="number"
                  value={typeof editedField.config?.min === 'number' ? editedField.config.min.toString() : ''}
                  onChange={(_e, v) => updateConfig({ min: v ? parseFloat(v) : undefined })}
                  styles={{ root: { marginBottom: 12 } }}
                />
                <TextField
                  label="最大值"
                  type="number"
                  value={typeof editedField.config?.max === 'number' ? editedField.config.max.toString() : ''}
                  onChange={(_e, v) => updateConfig({ max: v ? parseFloat(v) : undefined })}
                  styles={{ root: { marginBottom: 12 } }}
                />
              </>
            )}
            {editedField.type === 'text' && (
              <TextField
                label="最大长度"
                type="number"
                value={typeof editedField.config?.maxLength === 'number' ? editedField.config.maxLength.toString() : ''}
                onChange={(_e, v) => updateConfig({ maxLength: v ? parseInt(v) : undefined })}
                styles={{ root: { marginBottom: 12 } }}
              />
            )}
          </>
        )}
      </div>
    </Panel>
  );
};
