/**
 * Image Field - File upload with preview
 * Supports uploading images to SharePoint library and URL input
 */

import * as React from 'react';
import {
  Label,
  TextField,
  IconButton,
  ProgressIndicator,
  PrimaryButton,
  Stack,
  Image,
  ImageFit,
  MessageBar,
  MessageBarType,
  Icon,
} from '@fluentui/react';
import { BaseFieldProps } from './BaseField';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ImageFieldValue {
  serverRelativeUrl?: string;
  fileName?: string;
  url?: string;
}

export interface ImageFieldProps extends BaseFieldProps {
  spfxContext?: WebPartContext;
}

const IMAGE_LIBRARY = 'SiteAssets';

// Fluent UI 样式
const styles = {
  uploadArea: {
    border: '1px dashed #8a8886',
    borderRadius: '2px',
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: '#faf9f8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  uploadAreaHover: {
    borderColor: '#0078d4',
    backgroundColor: '#f3f2f1',
  },
  imagePreview: {
    position: 'relative' as const,
    display: 'inline-block',
    maxWidth: '200px',
    maxHeight: '150px',
  },
  imageContainer: {
    border: '1px solid #edebe9',
    borderRadius: '2px',
    padding: '8px',
    display: 'inline-block',
    backgroundColor: '#fff',
  },
};

export const ImageField: React.FC<ImageFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext,
}) => {
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Extract image URL from value
  const imageUrl = React.useMemo(() => {
    if (!value) return '';
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
    return '';
  }, [value, spfxContext]);

  const fileName = React.useMemo(() => {
    if (!value) return '';
    if (value.fileName) return value.fileName;
    if (typeof value === 'string') {
      const parts = value.split('/');
      return parts[parts.length - 1] || '';
    }
    if (value.serverRelativeUrl) {
      const parts = value.serverRelativeUrl.split('/');
      return parts[parts.length - 1] || '';
    }
    if (value.url) {
      const parts = value.url.split('/');
      return parts[parts.length - 1] || '';
    }
    return '';
  }, [value]);

  // Handle file upload
  const uploadFile = async (file: File): Promise<void> => {
    if (!spfxContext) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('请选择有效的图片文件 (JPEG, PNG, GIF, WebP, BMP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('图片文件大小不能超过 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const sp = spfi().using(SPFx(spfxContext));
      const webUrl = spfxContext.pageContext.web.absoluteUrl;
      const serverRelativeUrl = spfxContext.pageContext.web.serverRelativeUrl;

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'jpg';
      const uniqueFileName = `img_${timestamp}_${randomSuffix}.${ext}`;
      const folderPath = `${serverRelativeUrl === '/' ? '' : serverRelativeUrl}/${IMAGE_LIBRARY}/FormImages`;

      try {
        await sp.web.getFolderByServerRelativePath(folderPath)();
      } catch {
        await sp.web.folders.addUsingPath(folderPath);
      }

      await sp.web.getFolderByServerRelativePath(folderPath).files.addUsingPath(
        uniqueFileName,
        file,
        { Overwrite: true }
      );
      setUploadProgress(100);

      const fileServerRelUrl = `${folderPath}/${uniqueFileName}`;
      onChange({
        serverRelativeUrl: fileServerRelUrl,
        fileName: uniqueFileName,
        url: `${webUrl.replace(/\/$/, '')}${fileServerRelUrl.startsWith('/') ? '' : '/'}${fileServerRelUrl}`,
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err?.message || '上传图片失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const handleUrlChange = (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
    if (!newValue) {
      onChange(null);
    } else {
      onChange({ url: newValue });
    }
  };

  const handleRemove = (): void => {
    onChange(null);
    setUploadError(null);
  };

  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const isReadOnly = disabled || state.readOnly || state.disabled;
  const canUpload = spfxContext && !isReadOnly && !isUploading;

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {/* Label */}
      <Label required={state.required} disabled={isReadOnly}>
        {field.label}
      </Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={isUploading || isReadOnly}
      />

      {/* Upload progress */}
      {isUploading && (
        <ProgressIndicator
          label="正在上传..."
          percentComplete={uploadProgress / 100}
        />
      )}

      {/* Error message */}
      {uploadError && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setUploadError(null)}>
          {uploadError}
        </MessageBar>
      )}

      {/* Image preview or upload area */}
      {imageUrl ? (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <div style={styles.imageContainer}>
            <Image
              src={imageUrl}
              alt={field.label}
              width={150}
              height={100}
              imageFit={ImageFit.contain}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <Stack tokens={{ childrenGap: 4 }}>
            {fileName && (
              <span style={{ fontSize: '12px', color: '#605e5c' }}>{fileName}</span>
            )}
            {!isReadOnly && (
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <PrimaryButton
                  text="更换图片"
                  iconProps={{ iconName: 'Photo2' }}
                  onClick={handleUploadClick}
                  disabled={isUploading}
                />
                <IconButton
                  iconProps={{ iconName: 'Delete' }}
                  title="移除图片"
                  onClick={handleRemove}
                  disabled={isUploading}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      ) : canUpload ? (
        <div
          style={{
            ...styles.uploadArea,
            ...(isDragOver ? styles.uploadAreaHover : {}),
          }}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon iconName="Photo2" styles={{ root: { fontSize: 32, color: '#8a8886', marginBottom: 8 } }} />
          <div style={{ color: '#323130', marginBottom: 4 }}>拖拽图片到此处或点击上传</div>
          <div style={{ fontSize: 12, color: '#605e5c' }}>支持 JPEG, PNG, GIF, WebP, BMP (最大 10MB)</div>
        </div>
      ) : (
        <div style={{ ...styles.uploadArea, cursor: 'default', borderColor: '#edebe9' }}>
          <Icon iconName="Photo2" styles={{ root: { fontSize: 32, color: '#c8c6c4', marginBottom: 8 } }} />
          <div style={{ color: '#a19f9d' }}>暂无图片</div>
        </div>
      )}

      {/* URL input for manual entry */}
      <TextField
        placeholder="或输入图片 URL..."
        value={imageUrl}
        onChange={handleUrlChange}
        disabled={isReadOnly || isUploading}
        styles={{
          root: { marginTop: 4 },
          field: { fontSize: 13 },
        }}
      />

      {/* Validation error */}
      {state.errors.length > 0 && (
        <MessageBar messageBarType={MessageBarType.error}>
          {state.errors[0]}
        </MessageBar>
      )}
    </Stack>
  );
};
