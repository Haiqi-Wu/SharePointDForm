/**
 * Image Field - Using PnP ImagePicker control
 * SharePoint Online native image picker experience
 */

import * as React from 'react';
import { Label, MessageBar, MessageBarType } from '@fluentui/react';
import { ImagePicker, IFilePickerResult } from '@pnp/spfx-controls-react/lib/ImagePicker';
import { BaseFieldProps } from './BaseField';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/files';
import '@pnp/sp/folders';

export interface ImageFieldValue {
  serverRelativeUrl?: string;
  fileName?: string;
  url?: string;
}

export interface ImageFieldProps extends BaseFieldProps {
  spfxContext?: WebPartContext;
}

const IMAGE_LIBRARY = 'SiteAssets';

export const ImageField: React.FC<ImageFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext,
}) => {
  const [error, setError] = React.useState<string | null>(null);

  // Extract image URL from value
  const imageUrl = React.useMemo(() => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (value.serverRelativeUrl) {
      if (spfxContext?.pageContext?.web?.absoluteUrl) {
        const webUrl = spfxContext.pageContext.web.absoluteUrl;
        const serverRelUrl = value.serverRelativeUrl;
        if (serverRelUrl.startsWith('http')) return serverRelUrl;
        return `${webUrl.replace(/\/$/, '')}${serverRelUrl.startsWith('/') ? '' : '/'}${serverRelUrl}`;
      }
      return value.serverRelativeUrl;
    }
    if (value.url) return value.url;
    return undefined;
  }, [value, spfxContext]);

  const handleFileSelected = async (file: IFilePickerResult): Promise<void> => {
    if (!spfxContext) return;

    try {
      setError(null);

      // If file is already selected from SharePoint (has serverRelativeUrl)
      if (file.fileAbsoluteUrl) {
        const serverRelUrl = file.fileAbsoluteUrl;
        const webUrl = spfxContext.pageContext.web.absoluteUrl;
        
        // Extract relative URL if it's absolute
        let relativeUrl = serverRelUrl;
        if (serverRelUrl.startsWith('http')) {
          try {
            const url = new URL(serverRelUrl);
            relativeUrl = url.pathname;
          } catch {
            // keep as is
          }
        }

        onChange({
          serverRelativeUrl: relativeUrl,
          fileName: file.fileName,
          url: file.fileAbsoluteUrl,
        });
        return;
      }

      // If file is from local (needs upload)
      const fileContent = await file.downloadFileContent();
      if (!fileContent) {
        setError('无法读取文件内容');
        return;
      }

      const sp = spfi().using(SPFx(spfxContext));
      const webUrl = spfxContext.pageContext.web.absoluteUrl;
      const serverRelativeUrl = spfxContext.pageContext.web.serverRelativeUrl;

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const ext = file.fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `img_${timestamp}_${randomSuffix}.${ext}`;
      const folderPath = `${serverRelativeUrl === '/' ? '' : serverRelativeUrl}/${IMAGE_LIBRARY}/FormImages`;

      // Ensure folder exists
      try {
        await sp.web.getFolderByServerRelativePath(folderPath)();
      } catch {
        await sp.web.folders.addUsingPath(folderPath);
      }

      // Upload file
      await sp.web.getFolderByServerRelativePath(folderPath).files.addUsingPath(
        uniqueFileName,
        fileContent,
        { Overwrite: true }
      );

      const fileServerRelUrl = `${folderPath}/${uniqueFileName}`;
      onChange({
        serverRelativeUrl: fileServerRelUrl,
        fileName: uniqueFileName,
        url: `${webUrl.replace(/\/$/, '')}${fileServerRelUrl.startsWith('/') ? '' : '/'}${fileServerRelUrl}`,
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err?.message || '上传图片失败');
    }
  };

  const handleDeleteFile = (): void => {
    onChange(null);
    setError(null);
  };

  const isReadOnly = disabled || state.readOnly || state.disabled;

  // In read-only mode, just display the image
  if (isReadOnly) {
    return (
      <div>
        <Label>{field.label}</Label>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={field.label}
            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span style={{ color: '#666' }}>无图片</span>
        )}
        {state.errors.length > 0 && (
          <div style={{ color: '#a80000', fontSize: 12, marginTop: 4 }}>
            {state.errors[0]}
          </div>
        )}
      </div>
    );
  }

  // In design mode without context, show placeholder
  if (!spfxContext) {
    return (
      <div>
        <Label required={state.required}>{field.label}</Label>
        <div style={{ 
          padding: '40px', 
          border: '1px dashed #c8c8c8', 
          textAlign: 'center',
          backgroundColor: '#f8f8f8',
        }}>
          <span style={{ color: '#666' }}>图片选择器在运行模式下可用</span>
        </div>
        {state.errors.length > 0 && (
          <div style={{ color: '#a80000', fontSize: 12, marginTop: 4 }}>
            {state.errors[0]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Label required={state.required}>{field.label}</Label>
      
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
          styles={{ root: { marginBottom: 8 } }}
        >
          {error}
        </MessageBar>
      )}

      <ImagePicker
        key={imageUrl || 'empty'}
        context={spfxContext as any}
        onFileSelected={handleFileSelected}
        onDeleteFile={handleDeleteFile}
        selectedFileUrl={imageUrl || ''}
      />

      {state.errors.length > 0 && (
        <div style={{ color: '#a80000', fontSize: 12, marginTop: 4 }}>
          {state.errors[0]}
        </div>
      )}
    </div>
  );
};
