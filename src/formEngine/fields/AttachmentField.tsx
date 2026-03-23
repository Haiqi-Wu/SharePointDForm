/**
 * Attachment Field - Using PnP controls (FilePicker for new, ListItemAttachments for edit)
 */

import * as React from 'react';
import { Text as CoreText } from '@microsoft/sp-core-library';
import { BaseFieldProps } from './BaseField';
import { ListItemAttachments } from '@pnp/spfx-controls-react/lib/ListItemAttachments';
import { FilePicker, IFilePickerResult } from '@pnp/spfx-controls-react/lib/FilePicker';
import { MessageBar, MessageBarType, IconButton, Text, Label, DocumentCard, DocumentCardDetails, DocumentCardTitle } from '@fluentui/react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx as spSPFx } from '@pnp/sp/presets/all';
import '@pnp/sp/lists/web';
import './AttachmentField.css';
import './PnpControlCompat.css';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface AttachmentFieldValue {
  files?: Array<{ file?: File; name: string }>;
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
        setError(strings.FieldAttachmentMissingContext);
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
        setError(strings.FieldAttachmentNeedListName);
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
        setError(CoreText.format(strings.FieldAttachmentLoadListFailed, listName));
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
        {strings.FieldAttachmentLoadingList}
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
        {strings.FieldAttachmentNeedListInfo}
      </MessageBar>
    );
  }

  const handleFilePickerChange = async (files: IFilePickerResult[]) => {
    const filePromises = files.map(async (fp) => {
      const file = await fp.downloadFileContent();
      return file;
    });
    const resolvedFiles = (await Promise.all(filePromises)).filter(Boolean);
    setSelectedFiles(resolvedFiles);
    onChange({
      files: resolvedFiles.map((file) => ({ file, name: file.name })),
    });
  };

  const removeFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(next);
    onChange({
      files: next.map((file) => ({ file, name: file.name })),
    });
  };

  // 新建项：使用 PnP FilePicker
  if (isNewItem) {
    return (
      <div className="spdf-attachments spdf-attachments--new">
        <Label required={state.required}>{field.label}</Label>
        <MessageBar messageBarType={MessageBarType.info}>
          {strings.FieldAttachmentUploadOnSubmit}
        </MessageBar>
        <div className="spdf-attachments__picker">
          <FilePicker
            context={spfxContext}
            accepts={field.config?.accepts ? field.config.accepts.split(',') : ['.*']}
            buttonLabel={strings.FieldAttachmentAddButton}
            buttonIcon="Attach"
            onSave={handleFilePickerChange}
            disabled={isReadOnly}
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="spdf-attachments__list">
            {selectedFiles.map((file, index) => (
              <DocumentCard key={`${file.name}-${index}`} className="spdf-attachments__card">
                <DocumentCardDetails>
                  <DocumentCardTitle
                    title={file.name}
                    shouldTruncate
                  />
                </DocumentCardDetails>
                {!isReadOnly && (
                  <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    ariaLabel={strings.FieldAttachmentRemoveAria}
                    onClick={() => removeFile(index)}
                    styles={{ root: { position: 'absolute', top: 4, right: 4 } }}
                  />
                )}
              </DocumentCard>
            ))}
          </div>
        )}
        {selectedFiles.length === 0 && (
          <Text variant="small" className="spdf-attachments__empty">{strings.FieldAttachmentEmpty}</Text>
        )}
      </div>
    );
  }

  // 编辑项：使用 PnP ListItemAttachments
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
