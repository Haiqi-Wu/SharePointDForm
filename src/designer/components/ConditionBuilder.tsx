/**
 * Condition Builder - Visual condition editor like SharePoint view filters
 */

import * as React from 'react';
import { Dropdown, TextField, PrimaryButton, DefaultButton, Label, Text } from '@fluentui/react';
import { FormField } from '../../formEngine/core/types';

export interface ConditionRule {
  field: string;
  operator: string;
  value: string;
}

export interface ConditionBuilderProps {
  allFields: FormField[];
  condition: string;
  onChange: (condition: string) => void;
}

const operatorOptions = [
  { key: 'eq', text: '等于' },
  { key: 'ne', text: '不等于' },
  { key: 'gt', text: '大于' },
  { key: 'ge', text: '大于或等于' },
  { key: 'lt', text: '小于' },
  { key: 'le', text: '小于或等于' },
  { key: 'contains', text: '包含' },
  { key: 'startswith', text: '开始于' },
];

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  allFields,
  condition,
  onChange,
}) => {
  // 将 OData 条件解析为规则数组
  const parseCondition = (cond: string): ConditionRule[] => {
    if (!cond || cond === 'false') return [];

    // 简单解析：支持单个条件或 and 连接的多个条件
    const rules: ConditionRule[] = [];

    // 尝试解析单个条件
    const singlePattern = /^(\w+)\s+(eq|ne|gt|ge|lt|le|contains|startswith)\s+'([^']*)'$/;
    const match = cond.match(singlePattern);

    if (match) {
      rules.push({
        field: match[1],
        operator: match[2],
        value: match[3],
      });
    } else {
      // 尝试解析 and 连接的条件
      const andParts = cond.split(/\s+and\s+/i);
      for (const part of andParts) {
        const partMatch = part.match(/^\s*(\w+)\s+(eq|ne|gt|ge|lt|le|contains|startswith)\s+'([^']*)'\s*$/);
        if (partMatch) {
          rules.push({
            field: partMatch[1],
            operator: partMatch[2],
            value: partMatch[3],
          });
        }
      }
    }

    return rules;
  };

  const [rules, setRules] = React.useState<ConditionRule[]>(() => parseCondition(condition));

  // 构建条件字符串
  const buildCondition = React.useCallback((newRules: ConditionRule[]) => {
    if (newRules.length === 0) {
      onChange('');
      return;
    }

    // 过滤掉未完成的规则
    const completedRules = newRules.filter(r => r.field && r.value !== '');

    if (completedRules.length === 0) {
      onChange('');
      return;
    }

    // 构建条件字符串
    const conditionParts = completedRules.map(r =>
      `${r.field} ${r.operator} '${r.value}'`
    );

    onChange(conditionParts.join(' and '));
  }, [onChange]);

  const handleAddRule = (): void => {
    const newRules = [...rules, { field: '', operator: 'eq', value: '' }];
    setRules(newRules);
  };

  const handleRemoveRule = (index: number): void => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    buildCondition(newRules);
  };

  const handleRuleChange = (index: number, key: keyof ConditionRule, value: string): void => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [key]: value };
    setRules(newRules);
    buildCondition(newRules);
  };

  // 可用的字段选项（排除当前字段自身，避免循环引用）
  const fieldOptions = React.useMemo(() => {
    return allFields.map(f => ({
      key: f.fieldName,
      text: f.label || f.fieldName,
    }));
  }, [allFields]);

  const ruleContainerStyle: React.CSSProperties = {
    padding: '16px',
    background: '#f9f9f9',
    border: '1px solid #e1dfdd',
    borderRadius: '4px',
    marginBottom: '12px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e1dfdd',
  };

  const ruleNumberStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0078d4',
  };

  return (
    <div>
      <Label style={{ marginBottom: 8, fontWeight: 600 }}>可见性条件</Label>
      <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
        设置字段何时显示。留空则始终显示。
      </Text>

      <div>
        {rules.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: '#f9f9f9',
            border: '1px dashed #e1dfdd',
            borderRadius: '4px',
            color: '#605e5c',
            marginBottom: '12px',
          }}>
            暂无条件设置，字段将始终显示
          </div>
        ) : (
          rules.map((rule, index) => (
            <div key={index} style={ruleContainerStyle}>
              <div style={headerStyle}>
                <span style={ruleNumberStyle}>条件 {index + 1}</span>
                <DefaultButton
                  onClick={() => handleRemoveRule(index)}
                  styles={{ root: { minWidth: 'auto', padding: '4px 12px' } }}
                >
                  删除
                </DefaultButton>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>字段</Label>
                  <Dropdown
                    placeholder="选择字段"
                    options={fieldOptions}
                    selectedKey={rule.field || null}
                    onChange={(_, option) => handleRuleChange(index, 'field', option?.key?.toString() || '')}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>

                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>操作符</Label>
                  <Dropdown
                    options={operatorOptions}
                    selectedKey={rule.operator}
                    onChange={(_, option) => handleRuleChange(index, 'operator', option?.key?.toString() || 'eq')}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>

                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>值</Label>
                  <TextField
                    placeholder="输入比较的值"
                    value={rule.value}
                    onChange={(_, value) => handleRuleChange(index, 'value', value || '')}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>
              </div>

              {index < rules.length - 1 && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #e1dfdd',
                  textAlign: 'center',
                  color: '#0078d4',
                  fontSize: '13px',
                  fontWeight: 600,
                }}>
                  且
                </div>
              )}
            </div>
          ))
        )}

        <PrimaryButton
          onClick={handleAddRule}
          styles={{ root: { width: '100%' } }}
        >
          + 添加条件
        </PrimaryButton>
      </div>

      <Text variant="xSmall" block style={{ color: '#605e5c', marginTop: 12 }}>
        💡 提示：所有条件之间是&quot;与&quot;的关系（必须同时满足）。例如：部门等于&quot;IT&quot; 且状态不等于&quot;已关闭&quot;
      </Text>
    </div>
  );
};
