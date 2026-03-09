/**
 * Form Templates
 */

import { FormSchema } from '../formEngine/core/types';

export const BlankTemplate: FormSchema = {
  id: 'blank-form',
  name: '空白表单',
  mode: 'new',
  listName: '',
  steps: [{ id: 'step1', title: 'Step 1', fields: [] }],
};
