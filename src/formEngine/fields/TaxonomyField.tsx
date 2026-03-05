/**
 * Taxonomy/Managed Metadata Field - Using PnP TaxonomyPicker (v1.0 API)
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';
import { TaxonomyPicker } from '@pnp/spfx-controls-react/lib/TaxonomyPicker';
import { TextField, Link, MessageBar, MessageBarType } from '@fluentui/react';
import { SPHttpClient } from '@microsoft/sp-http';
import './PnpControlCompat.css';

export interface TaxonomyFieldValue {
  Label: string;
  TermGuid: string;
  WssId: number;
}

export interface TaxonomyFieldProps extends BaseFieldProps {
  spfxContext?: any;
}

export const TaxonomyField: React.FC<TaxonomyFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext,
}) => {
  const [selectedTerms, setSelectedTerms] = React.useState<any[]>([]);
  const [isWorkbench, setIsWorkbench] = React.useState<boolean>(false);
  const termLabelCacheRef = React.useRef<Map<string, string>>(new Map());

  const termSetId = field.config?.termSetId;
  const allowMultiple = field.config?.allowMultiple || false;

  // Detect if running in workbench
  React.useEffect(() => {
    if (spfxContext) {
      const webUrl = spfxContext.pageContext?.web?.absoluteUrl;
      const isLocalWorkbench = !webUrl ||
                               webUrl.includes('localhost') ||
                               webUrl.includes('contoso') ||
                               window.location.hostname === 'localhost';
      setIsWorkbench(isLocalWorkbench);
    }
  }, [spfxContext]);

  const isLabelLikelyId = (label?: string): boolean => {
    if (!label) return true;
    return /^\d+$/.test(label.trim());
  };

  const resolveTermLabel = React.useCallback(async (termGuid: string): Promise<string | null> => {
    if (!termGuid || !spfxContext) return null;
    const cached = termLabelCacheRef.current.get(termGuid);
    if (cached) return cached;
    const webUrl = spfxContext.pageContext?.web?.absoluteUrl;
    if (!webUrl || !termSetId) return null;

    try {
      const endpoint = `${webUrl}/_api/v2.1/termstore/sets('${termSetId}')/terms('${termGuid}')?$select=id,labels`;
      const response = await spfxContext.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
      if (!response.ok) return null;
      const data = await response.json();
      const labels: Array<{ name?: string; isDefault?: boolean; languageTag?: string }> = data?.labels || [];
      const preferred = labels.find((l) => l.isDefault) || labels[0];
      const resolved = preferred?.name || null;
      if (resolved) {
        termLabelCacheRef.current.set(termGuid, resolved);
      }
      return resolved;
    } catch {
      return null;
    }
  }, [spfxContext, termSetId]);

  // Helper to convert TaxonomyFieldValue to IPickerTerm (for TaxonomyPicker)
  const convertToPickerTerm = (val: any): any => {
    if (val.TermGuid && val.Label) {
      return {
        key: val.TermGuid,
        name: val.Label,
        path: val.Label,
        termSet: termSetId,
      };
    }
    return null;
  };

  // Initialize selectedTerms from value (and resolve label by TermGuid if needed)
  React.useEffect(() => {
    let cancelled = false;

    const updateSelectedTerms = async (): Promise<void> => {
      if (!value) {
        if (!cancelled) setSelectedTerms([]);
        return;
      }

      const rawTerms = Array.isArray(value) ? value : [value];
      const resolvedTerms = await Promise.all(rawTerms.map(async (term: any) => {
        if (term && term.TermGuid) {
          if (isLabelLikelyId(term.Label)) {
            const resolved = await resolveTermLabel(term.TermGuid);
            if (resolved) {
              return { ...term, Label: resolved };
            }
          }
          return term;
        }
        return term;
      }));

      if (cancelled) return;

      if (resolvedTerms.length === 1 && typeof resolvedTerms[0] === 'string') {
        setSelectedTerms([{
          key: '',
          name: resolvedTerms[0],
          path: resolvedTerms[0],
          termSet: termSetId,
        }]);
        return;
      }

      const pickerTerms = resolvedTerms
        .map((v: any) => convertToPickerTerm(v))
        .filter(Boolean);
      setSelectedTerms(pickerTerms);

      // If we resolved any labels, sync back to form state for consistent display
      const shouldSync = resolvedTerms.some((term: any, idx: number) => {
        const original = rawTerms[idx];
        return term?.TermGuid && original?.TermGuid && term?.Label !== original?.Label;
      });
      if (shouldSync) {
        if (allowMultiple) {
          onChange(resolvedTerms);
        } else {
          onChange(resolvedTerms[0] ?? null);
        }
      }
    };

    void updateSelectedTerms();

    return () => {
      cancelled = true;
    };
  }, [value, termSetId, allowMultiple, resolveTermLabel, onChange]);

  // Helper to convert IPickerTerm to TaxonomyFieldValue
  const convertFromPickerTerm = (term: any): TaxonomyFieldValue => {
    return {
      Label: term.name,
      TermGuid: term.key,
      WssId: -1,
    };
  };

  const handleChange = (terms?: any[]): void => {
    const newTerms = terms || [];
    setSelectedTerms(newTerms);

    if (allowMultiple) {
      if (newTerms.length === 0) {
        onChange(null);
      } else {
        const result = newTerms.map(convertFromPickerTerm);
        onChange(result);
      }
    } else {
      if (newTerms.length > 0) {
        const result = convertFromPickerTerm(newTerms[0]);
        onChange(result);
      } else {
        onChange(null);
      }
    }
  };

  // 如果没有 context，显示提示
  if (!spfxContext) {
    return (
      <div style={{ color: '#d13438', padding: '8px', background: '#fde7e9', borderRadius: '4px' }}>
        ⚠️ 缺少 SharePoint Context
      </div>
    );
  }

  // 如果没有 termSetId，显示提示
  if (!termSetId) {
    return (
      <div style={{ color: '#a80000', padding: '8px', background: '#fff4ce', borderRadius: '4px' }}>
        ⚠️ 缺少术语集 ID (TermSetId)
      </div>
    );
  }

  // Workbench 环境提示
  if (isWorkbench) {
    return (
      <div>
        <MessageBar messageBarType={MessageBarType.info}>
          <div>
            <strong>ℹ️ Workbench 环境限制</strong><br />
            Taxonomy 字段在本地 Workbench 中不可用，需要部署到 SharePoint 才能测试。<br />
            <Link
              href="https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/hosting-webpart-from-office-365-cdn"
              target="_blank"
              underline
            >
              部署到 SharePoint →
            </Link>
          </div>
        </MessageBar>
        <TextField
          label={field.label}
          value={typeof value === 'string' ? value : (value?.Label || '')}
          onChange={(_e, newVal) => {
            if (allowMultiple) {
              onChange([{ Label: newVal || '', TermGuid: '', WssId: -1 }]);
            } else {
              onChange({ Label: newVal || '', TermGuid: '', WssId: -1 });
            }
          }}
          disabled={disabled || state.readOnly || state.disabled}
          required={state.required}
          placeholder="（仅在真实 SharePoint 环境中可用）"
          description="此为占位符，请部署到 SharePoint 后测试完整功能"
          errorMessage={state.errors.length > 0 ? state.errors[0] : undefined}
        />
      </div>
    );
  }

  // Validate termSetId format (should be a GUID)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(termSetId)) {
    console.error('TaxonomyField - Invalid termSetId format:', termSetId);
    return (
      <div style={{ color: '#a80000', padding: '8px', background: '#fff4ce', borderRadius: '4px' }}>
        ⚠️ 无效的术语集 ID 格式: {termSetId}
      </div>
    );
  }

  return (
    <div className="spdf-taxonomy">
      <TaxonomyPicker
        context={spfxContext}
        label={field.label}
        termsetNameOrID={termSetId}
        onChange={handleChange}
        initialValues={selectedTerms}
        allowMultipleSelections={allowMultiple}
        disabled={disabled || state.readOnly || state.disabled}
        required={state.required}
        panelTitle={`选择${field.label}`}
        placeholder={field.config?.placeholder || '选择术语...'}
        hideTagsNotAvailableForTagging={false}
        hideDeprecatedTags={true}
      />
    </div>
  );
};
