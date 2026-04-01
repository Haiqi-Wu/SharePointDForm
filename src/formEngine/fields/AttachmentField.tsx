/**
 * Attachment Field - Using PnP ListItemAttachments control for all modes
 *
 * - New item (itemId=0): PnP control with itemId=0, files stored internally,
 *   uploaded via ref.uploadAttachments() after item creation
 * - Edit item (itemId>0): PnP control manages attachments directly
 * - View mode: PnP control with disabled=true
 */

import * as React from 'react';
import { Text as CoreText } from '@microsoft/sp-core-library';
import { BaseFieldProps } from './BaseField';
import { ListItemAttachments } from '@pnp/spfx-controls-react/lib/ListItemAttachments';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx as spSPFx } from '@pnp/sp/presets/all';
import '@pnp/sp/lists/web';
import './PnpControlCompat.css';
import * as strings from 'SharePointDynamicFormWebPartStrings';

export interface AttachmentFieldValue {
  // Value managed by PnP ListItemAttachments control
}

/** Upload handler exposed by AttachmentField for new items */
export interface AttachmentUploadHandler {
  uploadAttachments: (itemId: number) => void;
}

/**
 * Context for registering attachment upload handlers.
 * Provided by SharePointDynamicForm, consumed by AttachmentField.
 * Avoids threading refs through the entire component tree.
 */
export const AttachmentHandlerContext = React.createContext<{
  registerHandler: (fieldId: string, handler: AttachmentUploadHandler | null) => void;
} | null>(null);

export interface AttachmentFieldProps extends BaseFieldProps {
  spfxContext?: any;
  listName?: string;
  listId?: string;
  itemId?: number;
}

export const AttachmentField: React.FC<AttachmentFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext,
  listName: propListName, listId: propListId, itemId: propItemId,
}) => {
  const [listId, setListId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const attachmentsRef = React.useRef<any>(null);
  const ctx = React.useContext(AttachmentHandlerContext);

  const listName = propListName || field.config?.listName;
  const itemId = propItemId || field.config?.itemId;
  const initialListId = propListId || field.config?.listId;
  const isReadOnly = Boolean(disabled || state.readOnly || state.disabled);
  const isNewItem = !itemId || itemId === 0;

  // Fetch listId (required by ListItemAttachments for all modes)
  React.useEffect(() => {
    const fetchListId = async () => {
      if (!spfxContext) {
        setError(strings.FieldAttachmentMissingContext);
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
  }, [spfxContext, listName, initialListId]);

  // Register upload handler for new items so parent can call uploadAttachments after item creation
  React.useEffect(() => {
    if (!ctx || !isNewItem) return;

    ctx.registerHandler(field.id, {
      uploadAttachments: (targetItemId: number) => {
        attachmentsRef.current?.uploadAttachments(targetItemId);
      },
    });

    return () => {
      ctx.registerHandler(field.id, null);
    };
  }, [ctx, field.id, isNewItem]);

  // Notify form of changes for dirty state tracking
  const handleAttachmentChange = React.useCallback(() => {
    onChange({ changed: true });
  }, [onChange]);

  if (loading) {
    return (
      <MessageBar messageBarType={MessageBarType.info}>
        {strings.FieldAttachmentLoadingList}
      </MessageBar>
    );
  }

  if (error) {
    return (
      <MessageBar messageBarType={MessageBarType.error}>
        {error}
      </MessageBar>
    );
  }

  if (!listId) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        {strings.FieldAttachmentNeedListInfo}
      </MessageBar>
    );
  }

  return (
    <div className="spdf-attachments">
      <ListItemAttachments
        ref={attachmentsRef}
        context={spfxContext}
        listId={listId}
        itemId={itemId || 0}
        disabled={isReadOnly}
        onAttachmentChange={handleAttachmentChange}
      />
    </div>
  );
};
