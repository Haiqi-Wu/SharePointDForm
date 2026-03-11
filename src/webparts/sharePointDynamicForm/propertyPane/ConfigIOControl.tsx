import * as React from 'react';
import { DefaultButton, MessageBar, MessageBarType, Stack } from '@fluentui/react';

export type ConfigIOStrings = {
  exportLabel: string;
  importLabel: string;
  importSuccess: string;
  importInvalid: string;
  importReadError: string;
  importWarningList: string;
};

export type ConfigIOImportResult = {
  ok: boolean;
  level?: 'success' | 'warning' | 'error';
  message?: string;
};

export type ConfigIOControlProps = {
  exportConfig: () => string;
  importConfig: (json: string) => Promise<ConfigIOImportResult>;
  strings: ConfigIOStrings;
};

type StatusState = { message: string; type: MessageBarType } | null;

function buildFileName(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    'spfx-form-config-',
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    '.json',
  ].join('');
}

export const ConfigIOControl: React.FC<ConfigIOControlProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = React.useState<StatusState>(null);

  const onExport = React.useCallback(() => {
    const json = props.exportConfig();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildFileName();
    link.click();
    URL.revokeObjectURL(url);
  }, [props]);

  const onImportClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        setStatus({ message: props.strings.importReadError, type: MessageBarType.error });
      };
      reader.onload = async () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : '';
          const result = await props.importConfig(text);
          if (!result.ok) {
            setStatus({ message: result.message || props.strings.importInvalid, type: MessageBarType.error });
            return;
          }

          const level = result.level || 'success';
          const message =
            result.message ||
            (level === 'warning' ? props.strings.importWarningList : props.strings.importSuccess);
          const type =
            level === 'warning'
              ? MessageBarType.warning
              : level === 'error'
              ? MessageBarType.error
              : MessageBarType.success;
          setStatus({ message, type });
        } catch (error) {
          setStatus({ message: props.strings.importInvalid, type: MessageBarType.error });
        } finally {
          event.target.value = '';
        }
      };

      reader.readAsText(file);
    },
    [props]
  );

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <DefaultButton text={props.strings.exportLabel} onClick={onExport} />
        <DefaultButton text={props.strings.importLabel} onClick={onImportClick} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </Stack>
      {status && <MessageBar messageBarType={status.type}>{status.message}</MessageBar>}
    </Stack>
  );
};
