/**
 * Condition Builder - Visual condition editor like SharePoint view filters
 */

import * as React from 'react';
import { Text as CoreText } from '@microsoft/sp-core-library';
import { Dropdown, TextField, PrimaryButton, DefaultButton, Label, Text } from '@fluentui/react';
import { FormField } from '../../formEngine/core/types';
import * as strings from 'SharePointDynamicFormWebPartStrings';

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
  { key: 'eq', text: strings.ConditionOpEq },
  { key: 'ne', text: strings.ConditionOpNe },
  { key: 'gt', text: strings.ConditionOpGt },
  { key: 'ge', text: strings.ConditionOpGe },
  { key: 'lt', text: strings.ConditionOpLt },
  { key: 'le', text: strings.ConditionOpLe },
  { key: 'contains', text: strings.ConditionOpContains },
  { key: 'startswith', text: strings.ConditionOpStartsWith },
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
      <Label style={{ marginBottom: 8, fontWeight: 600 }}>{strings.ConditionVisibilityLabel}</Label>
      <Text variant="small" block style={{ marginBottom: 12, color: '#605e5c' }}>
        {strings.ConditionVisibilityDesc}
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
            {strings.ConditionNoRules}
          </div>
        ) : (
          rules.map((rule, index) => (
            <div key={index} style={ruleContainerStyle}>
              <div style={headerStyle}>
                <span style={ruleNumberStyle}>{CoreText.format(strings.ConditionRuleLabel, String(index + 1))}</span>
                <DefaultButton
                  onClick={() => handleRemoveRule(index)}
                  styles={{ root: { minWidth: 'auto', padding: '4px 12px' } }}
                >
                  {strings.DesignerDelete}
                </DefaultButton>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>{strings.ConditionFieldLabel}</Label>
                  <Dropdown
                    placeholder={strings.ConditionFieldPlaceholder}
                    options={fieldOptions}
                    selectedKey={rule.field || null}
                    onChange={(_, option) => handleRuleChange(index, 'field', option?.key?.toString() || '')}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>

                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>{strings.ConditionOperatorLabel}</Label>
                  <Dropdown
                    options={operatorOptions}
                    selectedKey={rule.operator}
                    onChange={(_, option) => handleRuleChange(index, 'operator', option?.key?.toString() || 'eq')}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>

                <div>
                  <Label style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>{strings.ConditionValueLabel}</Label>
                  <TextField
                    placeholder={strings.ConditionValuePlaceholder}
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
                  {strings.ConditionAnd}
                </div>
              )}
            </div>
          ))
        )}

        <PrimaryButton
          onClick={handleAddRule}
          styles={{ root: { width: '100%' } }}
        >
          {strings.ConditionAdd}
        </PrimaryButton>
      </div>

      <Text variant="xSmall" block style={{ color: '#605e5c', marginTop: 12 }}>
        {strings.ConditionHint}
      </Text>
    </div>
  );
};
