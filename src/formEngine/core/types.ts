/**
 * SPFx Dynamic Form Engine - Core Type Definitions
 */

// ============================================================================
// Basic Types
// ============================================================================

export type FormMode = 'new' | 'edit' | 'view';

export type FieldType =
  | 'text'
  | 'multiline'
  | 'number'
  | 'datetime'
  | 'dropdown'
  | 'multiselect'
  | 'lookup'
  | 'person'
  | 'boolean';

export type FilterExpression = string;

// ============================================================================
// Form Schema
// ============================================================================

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  mode: FormMode;
  listName: string;
  itemId?: number;
  steps: FormStep[];
  submitButtonLabel?: string;
  showCancelButton?: boolean;
  onSubmitMessage?: string;
  theme?: FormTheme;
}

export interface FormTheme {
  layout?: 'stack' | 'grid';
  columns?: number;
  labelPosition?: 'top' | 'left';
}

// ============================================================================
// Step & Field
// ============================================================================

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  fieldName: string;
  visible?: boolean | FilterExpression;
  required?: boolean | FilterExpression;
  readOnly?: boolean | FilterExpression;
  onChange?: FieldAction[];
  validation?: ValidationRule[];
  config?: FieldConfig;
}

export interface FieldConfig {
  maxLength?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  decimals?: number;
  displayFormat?: 'dateOnly' | 'dateTime';
  choices?: string[];
  allowFillIn?: boolean;
  lookupList?: string;
  lookupField?: string;
  allowMultiple?: boolean;
}

export type FieldAction =
  | { type: 'show'; target: string; condition?: FilterExpression }
  | { type: 'hide'; target: string }
  | { type: 'set-value'; target: string; value: any }
  | { type: 'clear'; target: string }
  | { type: 'enable'; target: string }
  | { type: 'disable'; target: string };

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  applyWhen?: FilterExpression;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

// ============================================================================
// Form State
// ============================================================================

export interface FieldState {
  value: any;
  touched: boolean;
  dirty: boolean;
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  disabled: boolean;
  valid: boolean;
  errors: string[];
}

export interface FormState {
  fields: Record<string, FieldState>;
  currentStep: number;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// OData AST
// ============================================================================

export type ASTNode =
  | BinaryOpNode
  | UnaryOpNode
  | FunctionCallNode
  | FieldNode
  | ValueNode
  | GroupNode;

export interface BinaryOpNode {
  type: 'BinaryOp';
  operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'and' | 'or';
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  type: 'UnaryOp';
  operator: 'not';
  operand: ASTNode;
}

export interface FunctionCallNode {
  type: 'FunctionCall';
  name: 'contains' | 'startswith';
  args: ASTNode[];
}

export interface FieldNode {
  type: 'Field';
  name: string;
}

export interface ValueNode {
  type: 'Value';
  value: string | number | boolean | null;
}

export interface GroupNode {
  type: 'Group';
  expression: ASTNode;
}

// ============================================================================
// SharePoint Types
// ============================================================================

export enum SPFieldType {
  Text = 'Text',
  Note = 'Note',
  Number = 'Number',
  Integer = 'Integer',
  DateTime = 'DateTime',
  Choice = 'Choice',
  MultiChoice = 'MultiChoice',
  Lookup = 'Lookup',
  User = 'User',
  UserMulti = 'UserMulti',
  Boolean = 'Boolean',
  URL = 'URL',
  Calculated = 'Calculated',
}

export interface SPFieldInfo {
  id: string;
  internalName: string;
  title: string;
  type: SPFieldType;
  required: boolean;
  readOnly: boolean;
  choices?: string[];
  lookupList?: string;
  lookupField?: string;
  allowMultipleValues?: boolean;
  maxLength?: number;
}

// ============================================================================
// Context Types
// ============================================================================

export interface DataContextValue {
  getListFields: (listName: string) => Promise<SPFieldInfo[]>;
  getItem: (listName: string, itemId: number) => Promise<any>;
  createItem: (listName: string, item: any) => Promise<any>;
  updateItem: (listName: string, itemId: number, item: any) => Promise<any>;
  getLookupChoices: (lookupList: string, lookupField: string) => Promise<any[]>;
}
