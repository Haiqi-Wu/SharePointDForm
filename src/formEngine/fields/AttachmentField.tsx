/**
 * Attachment Field - Using PnP ListItemAttachments control
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';
import { ListItemAttachments } from '@pnp/spfx-controls-react/lib/ListItemAttachments';
import { MessageBar, MessageBarType, DefaultButton, IconButton, Text } from '@fluentui/react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx as spSPFx } from '@pnp/sp/presets/all';
import '@pnp/sp/lists/web';
import './AttachmentField.css';
import './PnpControlCompat.css';

export interface AttachmentFieldValue {
  // Value is managed by the ListItemAttachments component
}

export interface AttachmentFieldProps extends BaseFieldProps {
  spfxContext?: any;
  listName?: string;
  listId?: string;
  itemId?: number;
}

export const AttachmentField: React.FC<AttachmentFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext, listName: propListName, listId: propListId, itemId: propItemId,
}) => {
  const [listId, setListId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const listName = propListName || field.config?.listName;
  const itemId = propItemId || field.config?.itemId;
  const initialListId = propListId || field.config?.listId;
  const isReadOnly = Boolean(disabled || state.readOnly || state.disabled);
  const isNewItem = !itemId || itemId === 0;

  const attachmentsRef = React.useRef<any>(null);

  // Get listId from listName if not provided
  React.useEffect(() => {
    const fetchListId = async () => {
      if (!spfxContext) {
        setError('缺少 SharePoint Context');
        return;
      }

      if (isNewItem) {
        setError(null);
        setLoading(false);
        return;
      }

      if (initialListId) {
        setListId(initialListId);
        return;
      }

      if (!listName) {
        setError('请在表单配置中指定列表名称');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const sp: SPFI = spfi().using(spSPFx(spfxContext));
        const list = await sp.web.lists.getByTitle(listName).select('Id')();
        setListId(list.Id);
      } catch (err) {
        console.error('Error fetching list ID:', err);
        setError(`无法获取列表 "${listName}" 的 ID`);
      } finally {
        setLoading(false);
      }
    };

    void fetchListId();
  }, [spfxContext, listName, initialListId, isNewItem]);

  React.useEffect(() => {
    if (!isNewItem) return;
    if (value && Array.isArray(value.files)) {
      const files = value.files.map((f: any) => f.file).filter(Boolean);
      setSelectedFiles(files);
    } else {
      setSelectedFiles([]);
    }
  }, [value, isNewItem]);

  // Show loading state
  if (loading) {
    return (
      <MessageBar messageBarType={MessageBarType.info}>
        正在加载列表信息...
      </MessageBar>
    );
  }

  // Show error state
  if (error) {
    return (
      <MessageBar messageBarType={MessageBarType.error}>
        {error}
      </MessageBar>
    );
  }

  // Show warning if no listId or listName
  if (!listId && !listName) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        请在表单配置中指定列表名称或列表 ID（GUID）以启用附件功能。
      </MessageBar>
    );
  }

  const updateSelectedFiles = (files: File[]) => {
    setSelectedFiles(files);
    onChange({
      files: files.map((file) => ({ file, name: file.name })),
    });
  };

  // 新建项：使用本地文件选择，提交时统一上传
  if (isNewItem) {
    return (
      <div className="spdf-attachments spdf-attachments--new">
        <MessageBar messageBarType={MessageBarType.info}>
          附件将在提交时统一上传。
        </MessageBar>
        <div className="spdf-attachments__picker">
          <input
            type="file"
            multiple
            disabled={isReadOnly}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              updateSelectedFiles(files);
            }}
          />
          {!isReadOnly && selectedFiles.length > 0 && (
            <DefaultButton onClick={() => updateSelectedFiles([])}>清空</DefaultButton>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <ul className="spdf-attachments__list">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="spdf-attachments__item">
                <span className="spdf-attachments__file">{file.name}</span>
                {!isReadOnly && (
                  <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    ariaLabel="移除附件"
                    onClick={() => {
                      const next = selectedFiles.filter((_, i) => i !== index);
                      updateSelectedFiles(next);
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {selectedFiles.length === 0 && (
          <Text variant="small" className="spdf-attachments__empty">尚未选择附件</Text>
        )}
      </div>
    );
  }

  // 编辑项：使用 ListItemAttachments
  if (listId) {
    return (
      <div className="spdf-attachments spdf-attachments--edit">
        <ListItemAttachments
          ref={attachmentsRef}
          context={spfxContext}
          listId={listId}
          itemId={itemId || 0}
          disabled={isReadOnly}
        />
      </div>
    );
  }

  return null;
};
