import {
  buildConfigExport,
  parseConfigExport,
} from '../src/webparts/sharePointDynamicForm/utils/configIO';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)} but got ${String(actual)}`);
  }
}

function assertTrue(value: boolean, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

const sampleProps = {
  formSchemaJson: '{"steps":[]}',
  listName: 'TestList',
  mode: 'new',
  useItemId: false,
  itemId: 0,
  itemIdQueryParam: 'ID',
  isInDesignerMode: true,
  labelPosition: 'top',
  showFieldDescription: true,
  submitButtonLabel: 'Submit',
  showCancelButton: true,
  cancelButtonLabel: 'Cancel',
  cancelRedirectUrl: '',
  submitRedirectUrl: '',
  onSubmitMessage: 'OK',
};

const exported = buildConfigExport(sampleProps as any);
assertEqual(exported.version, 1, 'version should be 1');
assertEqual(exported.properties.listName, 'TestList', 'listName should match');

const parsed = parseConfigExport(JSON.stringify(exported));
assertTrue(parsed.ok, 'parse should succeed');
assertEqual(parsed.value?.listName, 'TestList', 'parsed listName should match');

const bad = parseConfigExport('not json');
assertEqual(bad.ok, false, 'parse should fail for invalid json');
