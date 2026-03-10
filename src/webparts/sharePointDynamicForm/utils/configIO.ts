import type { ISharePointDynamicFormWebPartProps } from '../SharePointDynamicFormWebPart';

export const CONFIG_IO_VERSION = 1;

export type ConfigExport = {
  version: number;
  properties: Partial<ISharePointDynamicFormWebPartProps>;
};

export function buildConfigExport(
  props: ISharePointDynamicFormWebPartProps
): ConfigExport {
  return {
    version: CONFIG_IO_VERSION,
    properties: { ...props },
  };
}

export function parseConfigExport(json: string): {
  ok: boolean;
  value?: Partial<ISharePointDynamicFormWebPartProps>;
  error?: string;
} {
  try {
    const data = JSON.parse(json) as Partial<ConfigExport>;
    if (typeof data?.version !== 'number' || typeof data?.properties !== 'object') {
      return { ok: false, error: 'Invalid format' };
    }
    return { ok: true, value: data.properties };
  } catch (error) {
    return { ok: false, error: 'Invalid JSON' };
  }
}
