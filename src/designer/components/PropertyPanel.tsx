/**
 * Property Panel - 简化版
 * 只配置条件显示，其他属性从 SharePoint 字段获取
 */

import * as React from 'react';
import { Panel, TextField, PrimaryButton, DefaultButton, Label, Text } from '@fluentui/react';
import { FormField, SPFieldInfo } from '../../formEngine/core/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../formEngine/fields/RichTextField.css';
import { ConditionBuilder } from './ConditionBuilder';
import * as strings from 'SharePointDynamicFormWebPartStrings';

const toolbarOptions = {
  container: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const quillModules = {
  toolbar: toolbarOptions,
  clipboard: {
    matchVisual: false,
  },
};

export interface PropertyPanelProps {
  isOpen: boolean;
  field?: FormField;
  spFields?: SPFieldInfo[];
  allFields?: FormField[];
  onSave: (field: FormField) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  isOpen, field, spFields, allFields = [], onSave, onClose,
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
      <DefaultButton onClick={onClose}>{strings.CommonCancel}</DefaultButton>
      <PrimaryButton onClick={handleSave} disabled={!editedField}>{strings.CommonSave}</PrimaryButton>
    </div>
  ), [onClose, handleSave, editedField]);

  // 获取对应的 SharePoint 字段信息
  const spField = React.useMemo(() => {
    if (!editedField || !spFields) return null;
    return spFields.find(f => f.internalName === editedField.fieldName) || null;
  }, [editedField, spFields]);

  // 字段类型映射
  const fieldTypeLabels: Record<string, string> = {
    'text': strings.PropertyFieldTypeText,
    'multiline': strings.PropertyFieldTypeMultiline,
    'number': strings.PropertyFieldTypeNumber,
    'datetime': strings.PropertyFieldTypeDatetime,
    'dropdown': strings.PropertyFieldTypeDropdown,
    'multiselect': strings.PropertyFieldTypeMultiselect,
    'lookup': strings.PropertyFieldTypeLookup,
    'person': strings.PropertyFieldTypePerson,
    'boolean': strings.PropertyFieldTypeBoolean,
    'image': strings.PropertyFieldTypeImage,
    'url': strings.PropertyFieldTypeUrl,
    'taxonomy': strings.PropertyFieldTypeTaxonomy,
    'attachment': strings.PropertyFieldTypeAttachment,
    'richtext': strings.PropertyFieldTypeRichtext,
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onClose}
      headerText={strings.PropertyPanelTitle}
      isFooterAtBottom={true}
      onRenderFooterContent={renderFooter}
    >
      <div style={{ padding: '16px 0' }}>
        {!editedField ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#605e5c' }}>{strings.CommonLoading}</div>
        ) : (
          <>
            {/* 字段基本信息 - 只读显示 */}
            <div style={{ marginBottom: 20, padding: 12, background: '#f3f2f1', borderRadius: 4 }}>
              <Label style={{ marginBottom: 8, fontWeight: 600 }}>{strings.PropertyPanelFieldInfo}</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldName}</div>
                <div style={{ fontWeight: 500 }}>{editedField.label}</div>

                <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldType}</div>
                <div>{fieldTypeLabels[editedField.type] || editedField.type}</div>

                <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldInternalName}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{editedField.fieldName}</div>

                {spField && (
                  <>
                    <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldRequired}</div>
                    <div>{spField.required ? strings.FieldBooleanYes : strings.FieldBooleanNo}</div>

                    {spField.maxLength && (
                      <>
                        <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldMaxLength}</div>
                        <div>{spField.maxLength}</div>
                      </>
                    )}

                    {spField.choices && spField.choices.length > 0 && (
                      <>
                        <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldChoices}</div>
                        <div>{spField.choices.join(', ')}</div>
                      </>
                    )}

                    {spField.lookupList && (
                      <>
                        <div style={{ color: '#605e5c' }}>{strings.PropertyPanelFieldLookupList}</div>
                        <div>{spField.lookupField || 'Title'}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 列跨度配置 */}
            <div style={{ marginBottom: 20 }}>
              <Label style={{ marginBottom: 8, fontWeight: 600 }}>{strings.PropertyPanelColumnSpan}</Label>
              <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
                {strings.PropertyPanelColumnSpanDesc}
              </Text>
              <TextField
                type="number"
                value={editedField.columnSpan?.toString() || '1'}
                onChange={(_e, v) => {
                  const span = parseInt(v || '1', 10);
                  setEditedField({
                    ...editedField,
                    columnSpan: isNaN(span) ? 1 : Math.max(1, span),
                  });
                }}
                placeholder="1"
                min={1}
                styles={{ root: { marginBottom: 8 } }}
              />
              <Text variant="xSmall" block style={{ color: '#605e5c' }}>
                {strings.PropertyPanelColumnSpanHint}
              </Text>
            </div>

            {/* 字段提示/说明 */}
            <div style={{ marginBottom: 20 }}>
              <Label style={{ marginBottom: 8, fontWeight: 600 }}>{strings.PropertyPanelHelpText}</Label>
              <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
                {strings.PropertyPanelHelpTextDesc}
              </Text>
              <TextField
                multiline
                value={editedField.config?.helpText || ''}
                onChange={(_e, v) => {
                  setEditedField({
                    ...editedField,
                    config: {
                      ...(editedField.config || {}),
                      helpText: v || '',
                    },
                  });
                }}
                placeholder={strings.PropertyPanelHelpTextPlaceholder}
              />
            </div>

            {/* 富文本内容编辑 */}
            {editedField.type === 'richtext' && (
              <div style={{ marginBottom: 20 }}>
                <Label style={{ marginBottom: 8, fontWeight: 600 }}>{strings.PropertyPanelRichTextContent}</Label>
                <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
                  {strings.PropertyPanelRichTextDesc}
                </Text>
                <ReactQuill
                  theme="snow"
                  value={editedField.defaultValue || ''}
                  onChange={(content) => {
                    setEditedField({
                      ...editedField,
                      defaultValue: content,
                    });
                  }}
                  modules={quillModules}
                  formats={[
                    'header', 'font', 'size',
                    'bold', 'italic', 'underline', 'strike', 'blockquote',
                    'list', 'bullet', 'indent',
                    'link', 'image',
                    'color', 'background',
                    'align',
                    'clean',
                  ]}
                  style={{ minHeight: '200px' }}
                  placeholder={strings.DesignerRichTextPlaceholder}
                />
              </div>
            )}

            {/* 可见性条件配置 */}
            <ConditionBuilder
              allFields={allFields}
              condition={typeof editedField.visible === 'string' ? editedField.visible : ''}
              onChange={(condition) => {
                const trimmed = condition?.trim();
                if (trimmed === '') {
                  setEditedField({ ...editedField, visible: true });
                } else {
                  setEditedField({ ...editedField, visible: trimmed });
                }
              }}
            />

            {!spField && (
              <div style={{ marginTop: 16, padding: '12px', background: '#fff4ce', border: '1px solid #ffb900', borderRadius: '4px', fontSize: '12px' }}>
                {strings.PropertyPanelMissingSPField}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};
