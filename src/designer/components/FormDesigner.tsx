/**
 * Form Designer
 */

import * as React from 'react';
import { FormSchema, FormField, SPFieldInfo } from '../../formEngine/core/types';
import { FieldPalette } from '../controls/FieldPalette';
import { DesignerCanvas } from './DesignerCanvas';
import { SharePointDataSource } from '../../formEngine/data/SharePointDataSource';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface FormDesignerProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
  onSave?: () => void;
  context?: any;
  listName?: string;
}

export const FormDesigner: React.FC<FormDesignerProps> = ({ schema, onChange, context, listName }) => {
  const [spFields, setSpFields] = React.useState<SPFieldInfo[]>([]);
  const [isLoadingFields, setIsLoadingFields] = React.useState(true);
  const [fieldsError, setFieldsError] = React.useState<string | null>(null);

  // 获取已使用的字段名集合
  const usedFieldNames = React.useMemo(() => {
    const used = new Set<string>();
    for (const step of schema.steps) {
      // 过滤掉 null 占位符
      const actualFields = step.fields.filter((f): f is FormField => f !== null && f.type !== 'newline');
      for (const field of actualFields) {
        used.add(field.fieldName);
      }
    }
    return used;
  }, [schema]);

  // 过滤后的可用字段
  const availableFields = React.useMemo(() => {
    const filtered = spFields.filter(field => !usedFieldNames.has(field.internalName));
    return filtered;
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
          setFieldsError(error?.message || strings.DesignerLoadFieldsFailed);
        }
      } else if (!listName) {
        setFieldsError(strings.DesignerNoListSelected);
      }
      setIsLoadingFields(false);
    };
    void loadFields();
  }, [context, listName]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f3f2f1' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '280px', background: 'white', borderRight: '1px solid #e1dfdd', overflowY: 'auto' }}>
          <FieldPalette
            spFields={availableFields}
            isLoading={isLoadingFields}
            error={fieldsError}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <DesignerCanvas
            schema={schema}
            onChange={onChange}
            spFields={spFields}
            listName={listName}
          />
        </div>
      </div>
    </div>
  );
};
