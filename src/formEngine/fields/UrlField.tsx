/**
 * URL/Hyperlink Field
 */

import * as React from 'react';
import { TextField } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

export interface UrlFieldValue {
  url: string;
  description?: string;
}

export interface UrlFieldProps extends BaseFieldProps {}

export const UrlField: React.FC<UrlFieldProps> = ({
  field, state, value, onChange, disabled,
}) => {
  const [url, setUrl] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');

  React.useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        setUrl(value);
      } else if (value.url) {
        setUrl(value.url);
        setDescription(value.description || '');
      }
    }
  }, [value]);

  const updateValue = (urlValue: string, descValue: string): void => {
    if (!urlValue) {
      onChange(null);
    } else {
      onChange({
        url: urlValue,
        description: descValue,
      });
    }
  };

  const handleUrlChange = (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
    setUrl(newValue || '');
    updateValue(newValue || '', description);
  };

  const handleDescriptionChange = (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
    setDescription(newValue || '');
    updateValue(url, newValue || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <TextField
        value={url}
        onChange={handleUrlChange}
        label={field.label}
        placeholder="https://example.com"
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        errorMessage={state.errors.length > 0 ? state.errors[0] : undefined}
      />
      <TextField
        value={description}
        onChange={handleDescriptionChange}
        label="描述（可选）"
        placeholder="链接显示的文本"
        disabled={disabled || state.readOnly || state.disabled}
      />
      {url && (
        <div style={{ marginTop: '8px' }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0078d4', textDecoration: 'underline' }}
            onClick={(e) => e.preventDefault()}
          >
            {description || url}
          </a>
        </div>
      )}
    </div>
  );
};
