/**
 * Form Templates
 */

import { FormSchema } from '../formEngine/core/types';

export const PurchaseRequestTemplate: FormSchema = {
  id: 'purchase-request',
  name: '采购申请表单',
  mode: 'new',
  listName: 'PurchaseRequests',
  submitButtonLabel: '提交申请',
  steps: [{
    id: 'step1',
    title: '基本信息',
    fields: [
      { id: 'f1', type: 'text', label: '标题', fieldName: 'Title', required: 'true' },
      { id: 'f2', type: 'dropdown', label: '类别', fieldName: 'Category', required: 'true', config: { choices: ['设备', '软件', '服务'] } },
      { id: 'f3', type: 'number', label: '金额', fieldName: 'Amount', required: 'true', config: { min: 0, decimals: 2 } },
      { id: 'f4', type: 'multiline', label: '说明', fieldName: 'Description' },
    ],
  }],
};

export const EmployeeInfoTemplate: FormSchema = {
  id: 'employee-info',
  name: '员工信息表单',
  mode: 'new',
  listName: 'Employees',
  steps: [{
    id: 'step1',
    title: '基本信息',
    fields: [
      { id: 'f1', type: 'text', label: '姓名', fieldName: 'Title', required: 'true' },
      { id: 'f2', type: 'dropdown', label: '部门', fieldName: 'Department', required: 'true', config: { choices: ['技术部', '人事部', '财务部'] } },
      { id: 'f3', type: 'person', label: '直属领导', fieldName: 'Manager', required: 'true' },
    ],
  }],
};

export const BlankTemplate: FormSchema = {
  id: 'blank-form',
  name: '空白表单',
  mode: 'new',
  listName: '',
  steps: [{ id: 'step1', title: '步骤 1', fields: [] }],
};

export const FormTemplates: Record<string, FormSchema> = {
  'purchase-request': PurchaseRequestTemplate,
  'employee-info': EmployeeInfoTemplate,
  'blank': BlankTemplate,
};

export function exportFormToJson(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}

export function importFormFromJson(json: string): FormSchema | null {
  try {
    const schema = JSON.parse(json);
    if (!schema.id || !schema.name || !schema.steps) throw new Error('Invalid schema');
    return schema as FormSchema;
  } catch {
    return null;
  }
}

export function downloadFormJson(schema: FormSchema, filename?: string): void {
  const json = exportFormToJson(schema);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${schema.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
