/**
 * Person Field
 */

import * as React from 'react';
import { NormalPeoplePicker, IBasePickerSuggestionsProps, IPersonaProps } from '@fluentui/react';
import { BaseFieldProps } from './BaseField';

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: '建议的人员',
  noResultsFoundText: '未找到结果',
  loadingText: '加载中...',
  searchForMoreText: '搜索更多结果',
  resultsMaximumNumber: 20,
};

export interface PersonFieldValue {
  id?: number;
  displayName?: string;
  email?: string;
}

const convertItem = (item: unknown): IPersonaProps => {
  if (typeof item === 'string') {
    return { key: item, text: item } as IPersonaProps;
  }
  const obj = item as Record<string, unknown>;
  if (obj.Id || obj.id) {
    const id = obj.Id || obj.id;
    const title = obj.Title || obj.displayName || obj.email || String(id);
    return { key: String(id), text: String(title) } as IPersonaProps;
  }
  return { key: String(item), text: String(item) } as IPersonaProps;
};

export const PersonField: React.FC<BaseFieldProps & {
  onResolveUsers?: (filter: string) => Promise<PersonFieldValue[]>;
}> = ({
  field, state, value, onChange, onBlur, disabled, onResolveUsers,
}) => {
  const convertToPickerItems = React.useCallback((val: unknown): IPersonaProps[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => convertItem(item));
    }
    return [convertItem(val)];
  }, []);

  const [pickerItems, setPickerItems] = React.useState<IPersonaProps[]>(convertToPickerItems(value));

  React.useEffect(() => {
    setPickerItems(convertToPickerItems(value));
  }, [value, convertToPickerItems]);

  const handleChange = (items?: IPersonaProps[]): void => {
    const safeItems = items || [];
    setPickerItems(safeItems);
    const allowMultiple = field.config?.allowMultiple ?? false;

    if (allowMultiple) {
      const converted = safeItems.map(item => ({ Id: parseInt(String(item.key), 10), Title: item.text }));
      onChange(converted);
    } else {
      if (safeItems.length > 0) {
        onChange({ Id: parseInt(String(safeItems[0].key), 10), Title: safeItems[0].text });
      } else {
        onChange(null);
      }
    }
  };

  const handleResolveSuggestions = async (filter: string): Promise<IPersonaProps[]> => {
    if (onResolveUsers) {
      const users = await onResolveUsers(filter);
      return users.map(user => convertItem(user));
    }
    return [];
  };

  const allowMultiple = field.config?.allowMultiple ?? false;

  return (
    <div className="form-field form-field--person">
      <label className={state.required ? 'ms-Label is-required' : 'ms-Label'}>{field.label}</label>
      <NormalPeoplePicker
        onChange={handleChange}
        onResolveSuggestions={handleResolveSuggestions}
        pickerSuggestionsProps={suggestionProps}
        pickerCalloutProps={{ doNotLayer: true }}
        onBlur={onBlur}
        disabled={disabled || state.readOnly || state.disabled}
        defaultSelectedItems={pickerItems}
        removeButtonAriaLabel="移除"
        resolveDelay={300}
      />
      {state.errors.length > 0 && (
        <div className="form-field__error">{state.errors[0]}</div>
      )}
    </div>
  );
};
