/**
 * Property Panel - 简化版
 * 只配置条件显示，其他属性从 SharePoint 字段获取
 */

import * as React from 'react';
import { Panel, TextField, PrimaryButton, DefaultButton, Label, Text } from '@fluentui/react';
import { FormField, SPFieldInfo } from '../../formEngine/core/types';

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

  const handleSave = React.useCallback((): void => {
    if (editedField) {
      onSave(editedField);
      onClose();
    }
  }, [editedField, onSave, onClose]);

  const renderFooter = React.useCallback(() => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <DefaultButton onClick={onClose}>取消</DefaultButton>
      <PrimaryButton onClick={handleSave} disabled={!editedField}>保存</PrimaryButton>
    </div>
  ), [onClose, handleSave, editedField]);

  // 获取对应的 SharePoint 字段信息
  const spField = React.useMemo(() => {
    if (!editedField || !spFields) return null;
    return spFields.find(f => f.internalName === editedField.fieldName) || null;
  }, [editedField, spFields]);

  // 字段类型映射
  const fieldTypeLabels: Record<string, string> = {
    'text': '单行文本',
    'multiline': '多行文本',
    'number': '数字',
    'datetime': '日期时间',
    'dropdown': '下拉选择',
    'multiselect': '多选',
    'lookup': '查找',
    'person': '人员',
    'boolean': '是/否',
  };

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
            {/* 字段基本信息 - 只读显示 */}
            <div style={{ marginBottom: 20, padding: 12, background: '#f3f2f1', borderRadius: 4 }}>
              <Label style={{ marginBottom: 8, fontWeight: 600 }}>字段信息</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                <div style={{ color: '#605e5c' }}>字段名：</div>
                <div style={{ fontWeight: 500 }}>{editedField.label}</div>

                <div style={{ color: '#605e5c' }}>字段类型：</div>
                <div>{fieldTypeLabels[editedField.type] || editedField.type}</div>

                <div style={{ color: '#605e5c' }}>内部名称：</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{editedField.fieldName}</div>

                {spField && (
                  <>
                    <div style={{ color: '#605e5c' }}>必填：</div>
                    <div>{spField.required ? '是' : '否'}</div>

                    {spField.maxLength && (
                      <>
                        <div style={{ color: '#605e5c' }}>最大长度：</div>
                        <div>{spField.maxLength}</div>
                      </>
                    )}

                    {spField.choices && spField.choices.length > 0 && (
                      <>
                        <div style={{ color: '#605e5c' }}>选项：</div>
                        <div>{spField.choices.join(', ')}</div>
                      </>
                    )}

                    {spField.lookupList && (
                      <>
                        <div style={{ color: '#605e5c' }}>查找列表：</div>
                        <div>{spField.lookupField || 'Title'}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 可见性条件配置 */}
            <div>
              <Label style={{ marginBottom: 8, fontWeight: 600 }}>可见性条件</Label>
              <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
                设置字段何时显示。留空则始终显示。
              </Text>
              <TextField
                value={typeof editedField.visible === 'string' ? editedField.visible : (editedField.visible === false ? 'false' : '')}
                onChange={(_e, v) => {
                  const trimmed = v?.trim();
                  if (trimmed === '' || trimmed === 'false') {
                    setEditedField({ ...editedField, visible: false });
                  } else {
                    setEditedField({ ...editedField, visible: trimmed || undefined });
                  }
                }}
                placeholder="例如：Department eq 'IT'"
                multiline
                rows={3}
                styles={{ root: { marginBottom: 8 } }}
              />
              <Text variant="xSmall" block style={{ color: '#605e5c' }}>
                💡 提示：直接使用字段内部名称（如 Title、Department），支持 eq, ne, gt, lt, ge, le, and, or, not, contains, startswith 等操作符
              </Text>
              <Text variant="xSmall" block style={{ color: '#605e5c', marginTop: 4 }}>
                示例：Department eq 'IT' 或 Status ne 'Closed' 或 startswith(Title, 'Re')
              </Text>
            </div>

            {!spField && (
              <div style={{ marginTop: 16, padding: '12px', background: '#fff4ce', border: '1px solid #ffb900', borderRadius: '4px', fontSize: '12px' }}>
                ⚠️ 未找到对应的 SharePoint 字段信息，部分配置可能无法正确显示。
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};
