import * as React from 'react';
import styles from './SharePointDynamicForm.module.scss';
import { FormRenderer } from '../../../formEngine/components/FormRenderer';
import { FormDesigner } from '../../../designer/components/FormDesigner';
import { SharePointDataSource } from '../../../formEngine/data/SharePointDataSource';
import { FormSchema, FormMode } from '../../../formEngine/core/types';
import { Text } from '@microsoft/sp-core-library';
import { MessageBar, MessageBarType, PrimaryButton, DefaultButton } from '@fluentui/react';
import { BlankTemplate } from '../../../templates/formTemplates';
import { SPHttpClient } from '@microsoft/sp-http';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface SharePointDynamicFormContainerProps {
  isInDesignerMode: boolean;
  onToggleDesignerMode: () => void;
  formSchemaJson: string;
  listName: string;
  mode: FormMode;
  useItemId: boolean;
  itemId: number;
  itemIdQueryParam?: string;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  context: any;
  onSaveSchema: (schema: FormSchema) => void;
  labelPosition?: 'top' | 'left';
  isPageEditMode: boolean;
  showFieldDescription?: boolean;
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
  useItemId,
  itemId,
  itemIdQueryParam,
  context,
  isDarkTheme,
  onSaveSchema,
  labelPosition = 'top',
  isPageEditMode = false,
  showFieldDescription,
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

  const getODataFieldName = React.useCallback((fieldName: string): string => {
    if (!fieldName) return fieldName;
    if (fieldName.startsWith('OData__')) return fieldName;
    if (fieldName.startsWith('_')) return `OData__${fieldName.slice(1)}`;
    return fieldName;
  }, []);

  const getItemIdFromUrl = React.useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    const params = new URLSearchParams(window.location.search);
    const trimmedKey = itemIdQueryParam ? itemIdQueryParam.trim() : '';
    const primaryKey = trimmedKey || 'ID';
    const keys = [
      primaryKey,
      ...['ID', 'Id', 'id', 'ItemId', 'itemId', 'ListItemId', 'listItemId']
    ].filter((key, index, arr) => key && arr.indexOf(key) === index);
    for (const key of keys) {
      const value = params.get(key);
      if (!value) continue;
      const parsed = parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }, [itemIdQueryParam]);

  const getItemIdFromContext = React.useCallback((): number => {
    const ctxId = context?.pageContext?.listItem?.id;
    if (typeof ctxId === 'number' && Number.isFinite(ctxId) && ctxId > 0) {
      return ctxId;
    }
    if (typeof ctxId === 'string') {
      const parsed = parseInt(ctxId, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }, [context]);

  const urlItemId = React.useMemo(() => getItemIdFromUrl(), [getItemIdFromUrl]);
  const contextItemId = React.useMemo(() => getItemIdFromContext(), [getItemIdFromContext]);
  const resolvedItemId = React.useMemo(() => {
    if (mode === 'edit' || mode === 'view') {
      return urlItemId || contextItemId || itemId || 0;
    }
    if (useItemId) {
      return urlItemId || contextItemId || itemId || 0;
    }
    return itemId || 0;
  }, [mode, useItemId, urlItemId, contextItemId, itemId]);

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

  const getItemValueByFieldName = React.useCallback((item: any, fieldName: string): any => {
    if (!item || !fieldName) return undefined;
    if (Object.prototype.hasOwnProperty.call(item, fieldName)) {
      return item[fieldName];
    }
    const lowered = fieldName.toLowerCase();
    const matchedKey = Object.keys(item).find((k) => k.toLowerCase() === lowered);
    return matchedKey ? item[matchedKey] : undefined;
  }, []);

  // 从 SharePoint 对象中提取原始值
  const extractFieldValue = (item: any, fieldName: string, fieldType: string): any => {
    const odataFieldName = getODataFieldName(fieldName);
    const value = getItemValueByFieldName(item, fieldName) ?? getItemValueByFieldName(item, odataFieldName);
    const taxonomyGuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const parseTaxonomyString = (text: string): any => {
      if (!text) return undefined;
      const parts = text.split(';#').filter(p => p !== '');
      const terms: any[] = [];
      let pendingLabel: string | null = null;
      let pendingWssId: number | null = null;

      for (const part of parts) {
        if (part.includes('|')) {
          const [label, guid] = part.split('|');
          if (label && guid && taxonomyGuidRegex.test(guid)) {
            terms.push({ Label: label, TermGuid: guid, WssId: pendingWssId ?? -1 });
          }
          pendingLabel = null;
          pendingWssId = null;
          continue;
        }

        if (/^-?\d+$/.test(part)) {
          pendingWssId = parseInt(part, 10);
          continue;
        }

        if (taxonomyGuidRegex.test(part)) {
          if (pendingLabel) {
            terms.push({ Label: pendingLabel, TermGuid: part, WssId: pendingWssId ?? -1 });
          }
          pendingLabel = null;
          pendingWssId = null;
          continue;
        }

        pendingLabel = part;
      }

      if (terms.length === 1) return terms[0];
      if (terms.length > 1) return terms;
      return text;
    };

    switch (fieldType) {
      case 'person':
        // Person field: extract array or single object
        if (value == null) {
          const idValue = getItemValueByFieldName(item, `${fieldName}Id`) ?? getItemValueByFieldName(item, `${odataFieldName}Id`);
          if (Array.isArray(idValue?.results)) {
            return idValue.results.map((id: number) => ({ Id: id }));
          }
          if (Array.isArray(idValue)) {
            return idValue.map((id: number) => ({ Id: id }));
          }
          if (typeof idValue === 'number') {
            return { Id: idValue };
          }
          return undefined;
        }
        if (Array.isArray(value)) return value;
        if (typeof value === 'object') return value;
        if (typeof value === 'number') return { Id: value };
        return null;
      case 'lookup':
        // Lookup field: extract the lookup value
        if (value == null) {
          const idValue = getItemValueByFieldName(item, `${fieldName}Id`) ?? getItemValueByFieldName(item, `${odataFieldName}Id`);
          if (Array.isArray(idValue?.results)) {
            return idValue.results.map((id: number) => ({ Id: id }));
          }
          if (Array.isArray(idValue)) {
            return idValue.map((id: number) => ({ Id: id }));
          }
          if (typeof idValue === 'number') {
            return { Id: idValue };
          }
          return undefined;
        }
        if (Array.isArray(value)) return value;
        if (typeof value === 'object') return value.Id ? value : value;
        if (typeof value === 'number') return { Id: value };
        return null;
      case 'multiselect':
        // Multi-select: return choices array directly
        if (value == null) return [];
        if (Array.isArray(value)) return value;
        if (value?.results && Array.isArray(value.results)) return value.results;
        if (typeof value === 'string' && value) return [value];
        return [];
      case 'taxonomy': {
        if (value == null) return undefined;
        if (Array.isArray(value)) return value;
        if (value?.results && Array.isArray(value.results)) {
          const parsed = value.results.map((v: any) => {
            if (!v) return null;
            if (typeof v === 'string') return parseTaxonomyString(v);
            if (v.Label && v.TermGuid) return v;
            return v;
          }).filter(Boolean);
          if (parsed.length === 1) return parsed[0];
          if (parsed.length > 1) return parsed;
        }
        if (typeof value === 'string') return parseTaxonomyString(value);
        if (value?.Label && value?.TermGuid) return value;
        return value;
      }
      case 'datetime': {
        if (value == null) return undefined;
        // DateTime: ensure it's a valid ISO string
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : value;
      }
      case 'boolean':
        if (value == null) return undefined;
        // Boolean: ensure it's a boolean
        return typeof value === 'boolean' ? value : value === 'true';
      case 'image':
        if (value == null) return undefined;
        // Image field: SharePoint returns { serverRelativeUrl, fileName } or similar
        if (typeof value === 'string') {
          return { url: value };
        }
        // Return as-is (contains serverRelativeUrl, fileName, etc.)
        return value;
      case 'url':
        if (value == null) return undefined;
        if (typeof value === 'string') return value;
        if (value?.Url) {
          return { url: value.Url, description: value.Description || '' };
        }
        return value;
      default:
        // For text, number, etc. return as-is
        return value == null ? undefined : value;
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

        // 如果是编辑/查看模式，加载现有数据
        const values: Record<string, any> = {};
        if ((mode === 'edit' || mode === 'view') && !resolvedItemId) {
          setError(strings.LoadErrorNoItemIdFromUrl);
          return;
        }

        if (resolvedItemId && (mode === 'edit' || mode === 'view')) {
          const fieldDefs = parsedSchema.steps.flatMap(step => step.fields.filter((f): f is NonNullable<typeof f> => Boolean(f)));
          const odataFieldDefs = fieldDefs.map(field => ({
            ...field,
            fieldName: getODataFieldName(field.fieldName),
          }));
          const item = await dataSource.getItem(parsedSchema.listName || listName, resolvedItemId, odataFieldDefs);
          for (const step of parsedSchema.steps) {
            for (const field of step.fields) {
              if (field) { // 检查 null
                const extracted = extractFieldValue(item, field.fieldName, field.type);
                if (extracted !== undefined) {
                  values[field.id] = extracted;
                  values[field.fieldName] = extracted;
                }
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
        setError(err.message || strings.LoadConfigFailed);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [context, formSchemaJson, listName, mode, resolvedItemId, dataSource, sanitizeSchema, isInDesignerMode, getODataFieldName]);

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
            throw new Error(Text.format(strings.UploadAttachmentFailedTemplate, fileData.name, err?.message || strings.CommonUnknownError));
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

          const odataFieldName = getODataFieldName(field.fieldName);

          // People/Lookup 字段必须使用 *Id 属性更新，否则 SharePoint 会忽略改动
          if (field.type === 'person') {
            const allowMultiple = field.config?.allowMultiple ?? Array.isArray(fieldValue);
            const ids = Array.isArray(fieldValue)
              ? fieldValue.filter((v: any) => v && v.Id).map((v: any) => v.Id)
              : (fieldValue?.Id ? [fieldValue.Id] : []);
            const key = `${odataFieldName}Id`;
            itemData[key] = allowMultiple ? { results: ids || [] } : (ids[0] ?? null);
            continue;
          }

          if (field.type === 'lookup') {
            const allowMultiple = field.config?.allowMultiple ?? Array.isArray(fieldValue);
            const ids = Array.isArray(fieldValue)
              ? fieldValue.filter((v: any) => v && v.Id).map((v: any) => v.Id)
              : (fieldValue?.Id ? [fieldValue.Id] : []);
            const key = `${odataFieldName}Id`;
            itemData[key] = allowMultiple ? { results: ids || [] } : (ids[0] ?? null);
            continue;
          }

          const convertedValue = convertValueForSP(fieldValue, field);
          // 跳过 null/undefined 值，让 SharePoint 使用默认值
          if (convertedValue !== null && convertedValue !== undefined) {
            itemData[odataFieldName] = convertedValue;
          }
        }
      }

      const targetList = schema.listName || listName;
      let createdItemId: number | undefined = resolvedItemId;

      if (resolvedItemId && mode === 'edit') {
        await dataSource.updateItem(targetList, resolvedItemId, itemData);
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
          <h2>{strings.DesignerTitle}</h2>
          <div className={styles.designerActions}>
            <DefaultButton onClick={onToggleDesignerMode} disabled={isSaving}>{strings.DesignerBackButton}</DefaultButton>
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
                    setSaveError(err?.message || strings.SaveFailedDefault);
                    console.error('Save error:', err);
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? strings.CommonSaving : strings.CommonSave}
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
        <div className={styles.loading}>{strings.CommonLoading}</div>
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
        <MessageBar messageBarType={MessageBarType.warning}>{strings.RuntimeNoSchemaWarning}</MessageBar>
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
            {strings.DesignerButton}
          </PrimaryButton>
        </div>
      )}

      {/* 表单渲染 */}
      <FormRenderer
        schema={{
          ...schema,
          itemId: resolvedItemId,
          theme: {
            ...schema.theme,
            labelPosition,
          },
          ...(showFieldDescription !== undefined && { showFieldDescription }),
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
