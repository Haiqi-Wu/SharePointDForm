import * as React from 'react';
import styles from './SharePointDynamicForm.module.scss';
import type { ISharePointDynamicFormProps } from './ISharePointDynamicFormProps';
import { FormRenderer } from '../../../formEngine/components/FormRenderer';
import { FormDesigner } from '../../../designer/components/FormDesigner';
import { SharePointDataSource } from '../../../formEngine/data/SharePointDataSource';
import { FormSchema, FormMode } from '../../../formEngine/core/types';
import { MessageBar, MessageBarType, PrimaryButton, DefaultButton, Dialog, DialogType, DialogFooter } from '@fluentui/react';
import { BlankTemplate } from '../../../templates/formTemplates';
import { SPHttpClient } from '@microsoft/sp-http';

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
  isPageEditMode: boolean;
  // 按钮配置
  submitButtonLabel?: string;
  showCancelButton?: boolean;
  cancelButtonLabel?: string;
  cancelRedirectUrl?: string;
  submitRedirectUrl?: string;
  onSubmitMessage?: string;
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
  isPageEditMode = false,
  // 按钮配置
  submitButtonLabel,
  showCancelButton,
  cancelButtonLabel,
  cancelRedirectUrl,
  submitRedirectUrl,
  onSubmitMessage,
}) => {
  const [schema, setSchema] = React.useState<FormSchema | null>(null);
  const [initialValues, setInitialValues] = React.useState<Record<string, any> | null>(null);
  const [lookupOptions, setLookupOptions] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = React.useState<{
    phase: 'uploading';
    total: number;
    completed: number;
    currentFile?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const dataSource = React.useMemo(() => new SharePointDataSource(context), [context]);

  // 清理 schema 数据，确保字段属性正确
  const sanitizeSchema = React.useCallback((schema: FormSchema): FormSchema => {
    const useGridLayout = schema.theme?.layout === 'grid' && (schema.theme?.columns || 0) > 1;
    return {
      ...schema,
      steps: schema.steps.map(step => {
        const mapped = step.fields.map(field => {
          if (!field || field.type === 'newline') return null;
          const sanitized: typeof field = {
            ...field,
            // 确保 label 是字符串
            label: typeof field.label === 'string' ? field.label : String(field.label || ''),
            // 确保 fieldName 是字符串
            fieldName: typeof field.fieldName === 'string' ? field.fieldName : String(field.fieldName || ''),
            // 确保 required 属性被保留（布尔值或字符串）
            required: field.required !== undefined ? field.required : false,
            // 确保 visible 属性被保留
            visible: field.visible !== undefined ? field.visible : true,
            // 确保 readOnly 属性被保留
            readOnly: field.readOnly !== undefined ? field.readOnly : false,
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
        });
        return {
          ...step,
          fields: useGridLayout ? mapped : mapped.filter((f): f is NonNullable<typeof f> => f !== null),
        };
      }),
    };
  }, []);

  const prepareSchemaForSave = React.useCallback((schema: FormSchema): FormSchema => {
    const useGridLayout = schema.theme?.layout === 'grid' && (schema.theme?.columns || 0) > 1;
    return {
      ...schema,
      steps: schema.steps.map(step => {
        const mapped = step.fields.map(field => {
          if (!field || field.type === 'newline') return null;
          // 确保关键字段属性被保留
          return {
            ...field,
            required: field.required,
            visible: field.visible,
            readOnly: field.readOnly,
          };
        });
        return {
          ...step,
          fields: useGridLayout ? mapped : mapped.filter((f): f is NonNullable<typeof f> => f !== null),
        };
      }),
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
      case 'image':
        // Image field: SharePoint returns { serverRelativeUrl, fileName } or similar
        if (typeof value === 'string') {
          return { url: value };
        }
        // Return as-is (contains serverRelativeUrl, fileName, etc.)
        return value;
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

        // 设计模式不过滤 null 占位符，保留网格布局结构
        // 运行模式才需要清理数据
        setSchema(isInDesignerMode ? parsedSchema : sanitizeSchema(parsedSchema));

        // 如果是编辑模式，加载现有数据
        const values: Record<string, any> = {};
        if (itemId && mode === 'edit') {
          const item = await dataSource.getItem(parsedSchema.listName || listName, itemId);
          for (const step of parsedSchema.steps) {
            for (const field of step.fields) {
              if (field) { // 检查 null
                values[field.id] = extractFieldValue(item, field.fieldName, field.type);
              }
            }
          }
        }

        // 加载查找字段选项
        const lookupOptionsMap: Record<string, any[]> = {};
        for (const step of parsedSchema.steps) {
          for (const field of step.fields) {
            if (field && field.type === 'lookup' && field.config?.lookupList && field.config?.lookupField) {
              const options = await dataSource.getLookupChoices(field.config.lookupList, field.config.lookupField);
              lookupOptionsMap[field.id] = options;
            }
          }
        }
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
    // 使用更精确的 null/undefined 检查，避免 0、''、false 被错误过滤
    if (value === null || value === undefined) return null;
    
    switch (field.type) {
      case 'multiselect':
        if (!Array.isArray(value) || value.length === 0) return null;
        return { results: value };
      case 'datetime':
        if (!value) return null;
        return new Date(value).toISOString();
      case 'image':
        // SharePoint Image 字段需要 JSON 字符串格式
        if (!value) return null;
        if (typeof value === 'string') {
          return JSON.stringify({ serverRelativeUrl: value });
        }
        if (value.serverRelativeUrl) {
          return JSON.stringify({
            serverRelativeUrl: value.serverRelativeUrl,
            fileName: value.fileName || ''
          });
        }
        if (value.url) {
          return JSON.stringify({ serverRelativeUrl: value.url });
        }
        return null;
      case 'url':
        // URL/Hyperlink 字段返回特殊格式
        if (typeof value === 'string') {
          return { Url: value, Description: '' };
        } else if (value.url) {
          return { Url: value.url, Description: value.description || '' };
        }
        return { Url: value, Description: '' };
      case 'taxonomy':
        // Taxonomy 字段返回特殊格式
        if (Array.isArray(value)) {
          if (value.length === 0) return null;
          return value.map((v: any) => ({
            Label: v.Label,
            TermGuid: v.TermGuid,
            WssId: v.WssId ?? -1
          }));
        } else if (value.Label && value.TermGuid) {
          return {
            Label: value.Label,
            TermGuid: value.TermGuid,
            WssId: value.WssId ?? -1
          };
        }
        return null;
      case 'number':
      {
        // 数字字段：空字符串转为 null，确保 0 值能正确提交
        if (value === '' || value === null) return null;
        const numVal = parseFloat(value);
        return isNaN(numVal) ? null : numVal;
      }
      case 'boolean':
        // 布尔字段：确保 false 值能正确提交
        return value;
      default:
        return value;
    }
  };

  // 上传附件到 SharePoint
  const uploadAttachments = async (
    listName: string,
    itemId: number,
    attachmentFields: Array<{ field: any; files: any[] }>
  ): Promise<void> => {
    const totalFiles = attachmentFields.reduce((sum, group) => sum + (group.files?.length || 0), 0);
    let completed = 0;
    if (totalFiles > 0) {
      setSubmitProgress({ phase: 'uploading', total: totalFiles, completed: 0 });
    }

    try {
      for (const { files } of attachmentFields) {
        for (const fileData of files) {
          try {
            const file = fileData.file;
            setSubmitProgress((prev) => prev ? { ...prev, completed, currentFile: file.name } : prev);
            const endpoint = `/web/lists/getbytitle('${listName}')/items(${itemId})/AttachmentFiles/add(FileName='${file.name}')`;

            // 读取文件为 ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // 使用 SPHttpClient 上传文件
            await context.spHttpClient.post(
              endpoint,
              SPHttpClient.configurations.v1,
              {
                headers: {
                  'X-RequestDigest': (context as any).pageContext?.requestDigest,
                },
                body: arrayBuffer,
              }
            );

            completed += 1;
            setSubmitProgress((prev) => prev ? { ...prev, completed, currentFile: file.name } : prev);
          } catch (err: any) {
            console.error(`Failed to upload attachment ${fileData.name}:`, err);
            throw new Error(`上传附件 "${fileData.name}" 失败: ${err?.message || '未知错误'}`);
          }
        }
      }
    } finally {
      setSubmitProgress(null);
    }
  };

  const handleSubmit = async (values: Record<string, any>): Promise<void> => {
    try {
      if (!schema) return;

      // 收集附件字段（稍后处理）
      const attachmentFields: Array<{ field: any; files: any[] }> = [];

      const itemData: Record<string, any> = {};
      for (const step of schema.steps) {
        for (const field of step.fields) {
          if (!field) continue; // 跳过 null 占位符
          // 跳过富文本字段，它们只是显示内容，不需要提交到SharePoint
          if (field.type === 'richtext') {
            continue;
          }

          // 收集附件字段，稍后处理
          if (field.type === 'attachment') {
            const fieldValue = values[field.id];
            const files = fieldValue?.files || [];
            if (files.length > 0) {
              attachmentFields.push({ field, files });
            }
            continue;
          }

          const fieldValue = values[field.id];

          // People/Lookup 字段必须使用 *Id 属性更新，否则 SharePoint 会忽略改动
          if (field.type === 'person') {
            const allowMultiple = field.config?.allowMultiple ?? Array.isArray(fieldValue);
            const ids = Array.isArray(fieldValue)
              ? fieldValue.filter((v: any) => v && v.Id).map((v: any) => v.Id)
              : (fieldValue?.Id ? [fieldValue.Id] : []);
            const key = `${field.fieldName}Id`;
            itemData[key] = allowMultiple ? { results: ids || [] } : (ids[0] ?? null);
            continue;
          }

          if (field.type === 'lookup') {
            const allowMultiple = field.config?.allowMultiple ?? Array.isArray(fieldValue);
            const ids = Array.isArray(fieldValue)
              ? fieldValue.filter((v: any) => v && v.Id).map((v: any) => v.Id)
              : (fieldValue?.Id ? [fieldValue.Id] : []);
            const key = `${field.fieldName}Id`;
            itemData[key] = allowMultiple ? { results: ids || [] } : (ids[0] ?? null);
            continue;
          }

          const convertedValue = convertValueForSP(fieldValue, field);
          // 跳过 null/undefined 值，让 SharePoint 使用默认值
          if (convertedValue !== null && convertedValue !== undefined) {
            itemData[field.fieldName] = convertedValue;
          }
        }
      }

      const targetList = schema.listName || listName;
      let createdItemId: number | undefined = itemId;

      if (itemId && mode === 'edit') {
        await dataSource.updateItem(targetList, itemId, itemData);
      } else {
        const newItem = await dataSource.createItem(targetList, itemData);
        createdItemId = newItem?.Id;
      }

      // 处理附件上传
      if (attachmentFields.length > 0 && context && createdItemId) {
        await uploadAttachments(targetList, createdItemId, attachmentFields);
      }

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
            <DefaultButton onClick={onToggleDesignerMode} disabled={isSaving}>返回</DefaultButton>
            {saveError && (
              <MessageBar
                messageBarType={MessageBarType.error}
                onDismiss={() => setSaveError(null)}
                styles={{ root: { marginRight: '8px' } }}
              >
                {saveError}
              </MessageBar>
            )}
            <PrimaryButton
              onClick={async () => {
                if (schema) {
                  setIsSaving(true);
                  setSaveError(null);
                  try {
                    // 确保 schema.theme 包含配置
                    const schemaToSave = prepareSchemaForSave({
                      ...schema,
                      theme: {
                        ...schema.theme,
                        labelPosition,
                      },
                    });
                    // 调用保存回调
                    onSaveSchema(schemaToSave);
                    // 保存后切换回表单显示模式
                    onToggleDesignerMode();
                  } catch (err: any) {
                    setSaveError(err?.message || '保存失败，请重试');
                    console.error('Save error:', err);
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </PrimaryButton>
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
      {/* 编辑按钮 - 仅在页面编辑模式下显示 */}
      {isPageEditMode && (
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

      {/* 表单渲染 */}
      <FormRenderer
        schema={{
          ...schema,
          itemId: itemId,
          theme: {
            ...schema.theme,
            labelPosition,
          },
          // Web Part 按钮配置覆盖 schema 中的配置
          ...(submitButtonLabel && { submitButtonLabel }),
          ...(showCancelButton !== undefined && { showCancelButton }),
          ...(cancelButtonLabel && { cancelButtonLabel }),
          ...(cancelRedirectUrl && { cancelRedirectUrl }),
          ...(submitRedirectUrl && { submitRedirectUrl }),
          ...(onSubmitMessage && { onSubmitMessage }),
        }}
        initialValues={initialValues || undefined}
        lookupOptions={lookupOptions}
        onResolveUsers={handleResolveUsers}
        onSubmit={handleSubmit}
        spfxContext={context}
        mode={mode}
        submitProgress={submitProgress || undefined}
      />
    </div>
  );
};
