/**
 * Condition Builder
 */

import * as React from 'react';
import { Dropdown, TextField, PrimaryButton } from '@fluentui/react';
import { FilterExpression } from '../../formEngine/core/types';

export interface ConditionBuilderProps {
  condition?: FilterExpression;
  availableFields: string[];
  onChange: (condition: FilterExpression) => void;
}

type ODataOperator = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'and' | 'or' | 'contains' | 'startswith';

interface ConditionRule {
  field: string;
  operator: ODataOperator;
  value: string;
  logicalOperator?: 'and' | 'or';
}

const parseCondition = (expr: FilterExpression): ConditionRule[] => {
  const rules: ConditionRule[] = [];
  const andParts = expr.split(' and ');
  for (let i = 0; i < andParts.length; i++) {
    const part = andParts[i].trim();
    const containsMatch = part.match(/contains\((\w+),\s*'([^']*)'\)/);
    if (containsMatch) {
      rules.push({ field: containsMatch[1], operator: 'contains', value: containsMatch[2], logicalOperator: i > 0 ? 'and' : undefined });
      continue;
    }
    const match = part.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+'([^']*)'/);
    if (match) {
      rules.push({ field: match[1], operator: match[2] as ODataOperator, value: match[3], logicalOperator: i > 0 ? 'and' : undefined });
    }
  }
  return rules;
};

const buildCondition = (rules: ConditionRule[]): FilterExpression => {
  const parts: string[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (i > 0 && rule.logicalOperator) parts.push(rule.logicalOperator);
    if (!rule.field || !rule.value) continue;
    switch (rule.operator) {
      case 'contains': parts.push(`contains(${rule.field}, '${rule.value}')`); break;
      case 'startswith': parts.push(`startswith(${rule.field}, '${rule.value}')`); break;
      default: parts.push(`${rule.field} ${rule.operator} '${rule.value}'`);
    }
  }
  return parts.join(' ');
};

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  condition, availableFields, onChange,
}) => {
  const [rules, setRules] = React.useState<ConditionRule[]>([]);

  React.useEffect(() => {
    if (condition) setRules(parseCondition(condition));
  }, [condition]);

  const handleAddRule = (): void => {
    setRules([...rules, { field: '', operator: 'eq', value: '', logicalOperator: rules.length > 0 ? 'and' : undefined }]);
  };

  const handleRemoveRule = (index: number): void => {
    const newRules = rules.filter((_, i) => i !== index);
    if (newRules.length > 0 && !newRules[0].logicalOperator) {
      newRules[0].logicalOperator = undefined;
    }
    setRules(newRules);
    onChange(buildCondition(newRules));
  };

  const handleRuleChange = (index: number, key: keyof ConditionRule, value: string | number | undefined): void => {
    const newRules = [...rules];
    const stringValue = value === undefined ? undefined : String(value);
    if (key === 'logicalOperator') {
      (newRules[index] as unknown as Record<string, unknown>)[key] = stringValue as 'and' | 'or' | undefined;
    } else if (key === 'operator') {
      (newRules[index] as unknown as Record<string, unknown>)[key] = stringValue as ODataOperator;
    } else {
      (newRules[index] as unknown as Record<string, unknown>)[key] = stringValue;
    }
    setRules(newRules);
    onChange(buildCondition(newRules));
  };

  const operators = [
    { key: 'eq' as ODataOperator, text: '等于 (eq)' },
    { key: 'ne' as ODataOperator, text: '不等于 (ne)' },
    { key: 'gt' as ODataOperator, text: '大于 (gt)' },
    { key: 'ge' as ODataOperator, text: '大于等于 (ge)' },
    { key: 'lt' as ODataOperator, text: '小于 (lt)' },
    { key: 'le' as ODataOperator, text: '小于等于 (le)' },
    { key: 'contains' as ODataOperator, text: '包含 (contains)' },
    { key: 'startswith' as ODataOperator, text: '开始于 (startswith)' },
  ];

  const logicalOperators = [
    { key: 'and' as const, text: '并且 (and)' },
    { key: 'or' as const, text: '或者 (or)' },
  ];

  return (
    <div className="condition-builder">
      <div className="condition-builder__header"><h4>条件规则</h4><p>配置字段显示/隐藏/必填条件</p></div>
      <div className="condition-builder__rules">
        {rules.length === 0 ? (
          <div className="condition-builder__empty">暂无条件规则</div>
        ) : (
          rules.map((rule, index) => (
            <div key={index} className="condition-builder__rule">
              {index > 0 && (
                <Dropdown
                  options={logicalOperators}
                  selectedKey={rule.logicalOperator}
                  onChange={(_e, opt) => handleRuleChange(index, 'logicalOperator', opt?.key)}
                  styles={{ root: { width: 100, marginRight: 8 } }}
                />
              )}
              <Dropdown
                placeholder="选择字段"
                options={availableFields.map(f => ({ key: f, text: f }))}
                selectedKey={rule.field}
                onChange={(_e, opt) => handleRuleChange(index, 'field', opt?.key)}
                styles={{ root: { width: 150, marginRight: 8 } }}
              />
              <Dropdown
                options={operators}
                selectedKey={rule.operator}
                onChange={(_e, opt) => handleRuleChange(index, 'operator', opt?.key)}
                styles={{ root: { width: 150, marginRight: 8 } }}
              />
              <TextField
                placeholder="值"
                value={rule.value}
                onChange={(_e, v) => handleRuleChange(index, 'value', v)}
                styles={{ root: { width: 150, marginRight: 8 } }}
              />
              <button onClick={() => handleRemoveRule(index)}>删除</button>
            </div>
          ))
        )}
      </div>
      {rules.length > 0 && (
        <div className="condition-builder__preview">
          <strong>OData 表达式预览:</strong>
          <code>{buildCondition(rules)}</code>
        </div>
      )}
      <PrimaryButton text="添加条件" onClick={handleAddRule} styles={{ root: { marginTop: 8 } }} />
    </div>
  );
};
