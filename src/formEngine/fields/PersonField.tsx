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
  // 转换值格式以匹配 PnP PeoplePicker 的期望格式
  const convertToPnPFormat = React.useCallback((val: any): any[] => {
    if (!val) return [];

    // 单个用户对象
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.Id && val.Title) {
        return [{
          Id: val.Id,
          LoginName: val.Email || '',
          Email: val.Email || '',
          Title: val.Title,
          PrincipalType: PrincipalType.User
        }];
      }
    }

    // 数组格式
    if (Array.isArray(val)) {
      return val.map(item => ({
        Id: item.Id || item.id,
        LoginName: item.Email || '',
        Email: item.Email || '',
        Title: item.Title || item.displayName || '',
        PrincipalType: PrincipalType.User
      }));
    }

    return [];
  }, []);

  const selectedUsers = React.useMemo(() => convertToPnPFormat(value), [value, convertToPnPFormat]);

  const handleChange = (items: any[]): void => {
    const allowMultiple = field.config?.allowMultiple ?? false;

    if (allowMultiple) {
      // 多选：保存为对象数组
      const converted = items.map(item => ({
        Id: item.Id,
        Title: item.Title
      }));
      onChange(converted);
    } else {
      // 单选：保存单个对象或 null
      if (items.length > 0) {
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
      key={selectedUsers.map((u: any) => u.Id).join(',') || 'empty'} // 当用户改变时强制重新渲染
      placeholder={field.config?.placeholder || '输入姓名或邮箱搜索（至少3个字符）...'}
      disabled={disabled || state.readOnly || state.disabled}
      principalTypes={[PrincipalType.User]}
      ensureUser={true}
      webAbsoluteUrl={webAbsoluteUrl}
    />
  );
};
