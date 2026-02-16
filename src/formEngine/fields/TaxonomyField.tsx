/**
 * Taxonomy/Managed Metadata Field - Using PnP TaxonomyPicker (v1.0 API)
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';
import { TaxonomyPicker } from '@pnp/spfx-controls-react/lib/TaxonomyPicker';
import { TextField, Link, MessageBar, MessageBarType } from '@fluentui/react';

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

  // Initialize selectedTerms from value
  React.useEffect(() => {
    if (value) {
      if (Array.isArray(value)) {
        const terms = value.map((v: any) => convertToPickerTerm(v)).filter(Boolean);
        setSelectedTerms(terms);
      } else if (value.TermGuid && value.Label) {
        const term = convertToPickerTerm(value);
        setSelectedTerms(term ? [term] : []);
      } else if (typeof value === 'string') {
        setSelectedTerms([{
          key: '',
          name: value,
          path: value,
          termSet: termSetId,
        }]);
      }
    } else {
      setSelectedTerms([]);
    }
  }, [value]);

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
  );
};
