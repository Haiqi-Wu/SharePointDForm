/**
 * Person Field - Using PnP PeoplePicker
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';
import { PeoplePicker, PrincipalType } from '@pnp/spfx-controls-react/lib/PeoplePicker';

export interface PersonFieldValue {
  Id?: number;
  Title?: string;
  Email?: string;
}

export interface PersonFieldProps extends BaseFieldProps {
  spfxContext?: any; // 添加 SPFx context prop
}

export const PersonField: React.FC<PersonFieldProps> = ({
  field, state, value, onChange, disabled, spfxContext,
}) => {
  const resolveUserIdentifier = React.useCallback((val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.EMail || val.Email || val.LoginName || val.Title || val.displayName || null;
    }
    return null;
  }, []);

  const selectedUsers = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map(resolveUserIdentifier)
        .filter((v): v is string => Boolean(v));
    }
    const single = resolveUserIdentifier(value);
    return single ? [single] : [];
  }, [value, resolveUserIdentifier]);

  const handleChange = (items: any[]): void => {
    const allowMultiple = field.config?.allowMultiple ?? false;

    if (allowMultiple) {
      // 多选：保存为对象数组
      const converted = (items || [])
        .filter((item: any) => item && item.Id)
        .map((item: any) => ({
          Id: item.Id,
          Title: item.Title
        }));
      onChange(converted.length > 0 ? converted : null);
    } else {
      // 单选：保存单个对象或 null
      if (items.length > 0 && items[0] && items[0].Id) {
        onChange({
          Id: items[0].Id,
          Title: items[0].Title
        });
      } else {
        onChange(null);
      }
    }
  };

  const allowMultiple = field.config?.allowMultiple ?? false;

  // 如果没有 context，显示提示
  if (!spfxContext) {
    return (
      <div style={{ color: '#d13438', padding: '8px', background: '#fde7e9', borderRadius: '4px' }}>
        ⚠️ 缺少 SharePoint Context
      </div>
    );
  }

  // 获取 web absolute URL
  const webAbsoluteUrl = spfxContext.pageContext?.web?.absoluteUrl;

  return (
    <PeoplePicker
      context={spfxContext}
      personSelectionLimit={allowMultiple ? undefined : 1}
      onChange={handleChange}
      defaultSelectedUsers={selectedUsers}
      key={selectedUsers.join(',') || 'empty'} // 当用户改变时强制重新渲染
      placeholder={field.config?.placeholder || '输入姓名或邮箱搜索（至少3个字符）...'}
      disabled={disabled || state.readOnly || state.disabled}
      principalTypes={[PrincipalType.User]}
      ensureUser={true}
      webAbsoluteUrl={webAbsoluteUrl}
    />
  );
};
