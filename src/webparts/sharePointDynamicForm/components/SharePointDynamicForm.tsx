import * as React from 'react';
import styles from './SharePointDynamicForm.module.scss';
import type { ISharePointDynamicFormProps } from './ISharePointDynamicFormProps';
import { FormRenderer } from '../../../formEngine/components/FormRenderer';
import { FormDesigner } from '../../../designer/components/FormDesigner';
import { SharePointDataSource } from '../../../formEngine/data/SharePointDataSource';
import { FormSchema, FormMode } from '../../../formEngine/core/types';
import { MessageBar, MessageBarType, PrimaryButton, DefaultButton, Dialog, DialogType, DialogFooter } from '@fluentui/react';
import { BlankTemplate } from '../../../templates/formTemplates';

export interface SharePointDynamicFormContainerProps {
  isInDesignerMode: boolean;
  onToggleDesignerMode: () => void;
  formSchemaJson: string;
  listName: string;
  mode: FormMode;
  useItemId: boolean;
  itemId: number;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  context: any;
  onSaveSchema: (schema: FormSchema) => void;
  labelPosition?: 'top' | 'left';
}

export const SharePointDynamicFormContainer: React.FC<SharePointDynamicFormContainerProps> = ({
  isInDesignerMode,
  onToggleDesignerMode,
  formSchemaJson,
  listName,
  mode,
  itemId,
  context,
  isDarkTheme,
  onSaveSchema,
  labelPosition = 'top',
}) => {
  const [schema, setSchema] = React.useState<FormSchema | null>(null);
  const [initialValues, setInitialValues] = React.useState<Record<string, any> | null>(null);
  const [lookupOptions, setLookupOptions] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const dataSource = React.useMemo(() => new SharePointDataSource(context), [context]);

  // 清理 schema 数据，确保字段属性正确
  const sanitizeSchema = React.useCallback((schema: FormSchema): FormSchema => {
    return {
      ...schema,
      steps: schema.steps.map(step => ({
        ...step,
        fields: step.fields.map(field => {
          const sanitized: typeof field = {
            ...field,
            // 确保 label 是字符串
            label: typeof field.label === 'string' ? field.label : String(field.label || ''),
            // 确保 fieldName 是字符串
            fieldName: typeof field.fieldName === 'string' ? field.fieldName : String(field.fieldName || ''),
          };
          // 清理 config 中的非字符串/非数字值
          if (field.config) {
            const cleanedConfig: typeof field.config = {};
            for (const [key, value] of Object.entries(field.config)) {
              if (value !== undefined && value !== null) {
                // 只保留有效的类型
                if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
                  cleanedConfig[key as keyof typeof field.config] = value as any;
                }
              }
            }
            if (Object.keys(cleanedConfig).length > 0) {
              sanitized.config = cleanedConfig;
            }
          }
          return sanitized;
        }),
      })),
    };
  }, []);

  // 从 SharePoint 对象中提取原始值
  const extractFieldValue = (item: any, fieldName: string, fieldType: string): any => {
    const value = item[fieldName];
    if (value == null) return undefined;

    switch (fieldType) {
      case 'person':
        // Person field: extract array or single object
        return Array.isArray(value) ? value : (value.Id ? value : null);
      case 'lookup':
        // Lookup field: extract the lookup value
        return value.Id ? value : null;
      case 'multiselect':
        // Multi-select: return choices array directly
        return Array.isArray(value) ? value : [];
      case 'datetime': {
        // DateTime: ensure it's a valid ISO string
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : value;
      }
      case 'boolean':
        // Boolean: ensure it's a boolean
        return typeof value === 'boolean' ? value : value === 'true';
      default:
        // For text, number, etc. return as-is
        return value;
    }
  };

  // 加载表单配置
  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        if (!formSchemaJson) {
          // 如果没有配置，使用空白模板
          setSchema(BlankTemplate);
          return;
        }

        const parsedSchema = JSON.parse(formSchemaJson) as FormSchema;
        setSchema(sanitizeSchema(parsedSchema));

        // 如果是编辑模式，加载现有数据
        const values: Record<string, any> = {};
        if (itemId && mode === 'edit') {
          const item = await dataSource.getItem(parsedSchema.listName || listName, itemId);
          for (const step of parsedSchema.steps) {
            for (const field of step.fields) {
              values[field.id] = extractFieldValue(item, field.fieldName, field.type);
            }
          }
        }

        // 加载查找字段选项
        const lookupOptionsMap: Record<string, any[]> = {};
        for (const step of parsedSchema.steps) {
          for (const field of step.fields) {
            console.log('Processing field:', { id: field.id, type: field.type, config: field.config });
            if (field.type === 'lookup' && field.config?.lookupList && field.config?.lookupField) {
              const options = await dataSource.getLookupChoices(field.config.lookupList, field.config.lookupField);
              lookupOptionsMap[field.id] = options;
              console.log('Loaded lookup options for', field.id, ':', options);
            }
          }
        }

        console.log('Final lookupOptionsMap:', lookupOptionsMap);
        setLookupOptions(lookupOptionsMap);
        setInitialValues(values);
      } catch (err: any) {
        setError(err.message || '加载表单配置失败');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [context, formSchemaJson, listName, mode, itemId, dataSource]);

  const handleResolveUsers = async (filter: string): Promise<any[]> => {
    try {
      return await dataSource.getUserSuggestions(filter);
    } catch {
      return [];
    }
  };

  const convertValueForSP = (value: any, field: any): any => {
    if (!value) return null;
    switch (field.type) {
      case 'person': return Array.isArray(value) ? value.map((v: any) => v.Id) : value?.Id;
      case 'lookup': return value?.Id;
      case 'multiselect': return { results: value };
      case 'datetime': return new Date(value).toISOString();
      default: return value;
    }
  };

  const handleSubmit = async (values: Record<string, any>): Promise<void> => {
    try {
      if (!schema) return;

      const itemData: Record<string, any> = {};
      for (const step of schema.steps) {
        for (const field of step.fields) {
          const fieldValue = values[field.id];
          itemData[field.fieldName] = convertValueForSP(fieldValue, field);
        }
      }

      const targetList = schema.listName || listName;
      if (itemId && mode === 'edit') {
        await dataSource.updateItem(targetList, itemId, itemData);
      } else {
        await dataSource.createItem(targetList, itemData);
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  // 设计模式：显示设计器
  if (isInDesignerMode) {
    return (
      <div className={styles.designerMode}>
        <div className={styles.designerToolbar}>
          <h2>表单设计器</h2>
          <div className={styles.designerActions}>
            <DefaultButton onClick={onToggleDesignerMode}>返回</DefaultButton>
            <PrimaryButton onClick={() => {
              if (schema) {
                // 确保 schema.theme 包含 labelPosition
                const schemaToSave = {
                  ...schema,
                  theme: {
                    ...schema.theme,
                    labelPosition,
                  },
                };
                onSaveSchema(schemaToSave);
                // 保存后切换回表单显示模式
                onToggleDesignerMode();
              }
            }}>保存</PrimaryButton>
          </div>
        </div>
        {schema && (
          <FormDesigner
            schema={schema}
            onChange={setSchema}
            context={context}
            listName={listName}
          />
        )}
      </div>
    );
  }

  // 运行模式：显示表单
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className={styles.container}>
        <MessageBar messageBarType={MessageBarType.warning}>请在 Web Part 属性中配置表单</MessageBar>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkTheme ? styles.dark : ''}`}>
      {/* 编辑按钮 */}
      {mode !== 'view' && (
        <div className={styles.editBar}>
          <PrimaryButton
            iconProps={{ iconName: 'Edit' }}
            onClick={onToggleDesignerMode}
            disabled={!listName}
          >
            设计表单
          </PrimaryButton>
        </div>
      )}

      {/* 成功消息 */}
      {submitSuccess && (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={() => setSubmitSuccess(false)}
          className={styles.message}
        >
          {mode === 'edit' ? '更新成功！' : '创建成功！'}
        </MessageBar>
      )}

      {/* 表单渲染 */}
      <FormRenderer
        schema={{
          ...schema,
          theme: {
            ...schema.theme,
            labelPosition,
          },
        }}
        initialValues={initialValues || undefined}
        lookupOptions={lookupOptions}
        onResolveUsers={handleResolveUsers}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
