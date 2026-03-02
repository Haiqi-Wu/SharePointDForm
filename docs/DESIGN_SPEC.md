# SPFx 动态表单引擎 - 设计规格文档

## 1. 需求总结

| 维度 | 需求 |
|-----|------|
| **驱动条件** | 字段值联动、列表项状态 |
| **配置存储** | Web Part Properties |
| **复杂度** | 企业级（线性步骤、条件分叉、自定义字段类型） |
| **设计器** | 可视化拖拽式设计器，内嵌在 Web Part 编辑模式中 |
| **表单模式** | New（新建）、Edit（编辑）、View（查看）|
| **模板复用** | 支持从模板创建、导入/导出 |
| **数据源** | 仅 SharePoint List |
| **验证** | 同步验证，无需异步 |
| **条件语法** | SharePoint OData 过滤语法（与原生 View Filter 一致）|

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPFx 动态表单引擎                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────────┐ │
│  │  设计器      │      │  渲染器      │    │  数据层         │ │
│  │  Designer    │──────│  Renderer    │────│  SharePoint     │ │
│  │              │      │              │    │  DataSource     │ │
│  │ • 拖拽字段   │      │ • 线性步骤   │    │                 │ │
│  │ • 属性配置   │      │ • 条件显示   │    │ • Get Items     │ │
│  │ • 条件构建   │      │ • 字段联动   │    │ • Create Item   │ │
│  │ • 预览测试   │      │ • OData 条件 │    │ • Update Item   │ │
│  └──────────────┘      └──────────────┘    └─────────────────┘ │
│           │                        │                  │        │
│           └────────────────────────┼──────────────────┘        │
│                                  ▼                            │
│                    ┌──────────────────────────┐               │
│                    │   Web Part Properties    │               │
│                    │   (FormSchema JSON)      │               │
│                    └──────────────────────────┘               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  核心模块                                                        │
├─────────────────────────────────────────────────────────────────┤
│  • ODataConditionEngine  OData 条件表达式引擎                   │
│  • ValidationEngine     同步验证引擎                            │
│  • FormStateManager     表单状态管理与字段联动                  │
│  • StepEngine           线性步骤引擎                            │
│  • FieldRegistry        字段类型注册器                          │
│  • SharePointDataSource SP 数据源封装                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心数据结构

### 3.1 表单模式

```typescript
type FormMode = 'new' | 'edit' | 'view';
```

### 3.2 字段类型

```typescript
type FieldType =
  | 'text'           // 单行文本
  | 'multiline'      // 多行文本
  | 'number'         // 数字
  | 'datetime'       // 日期时间
  | 'dropdown'       // 下拉选择 (Choice)
  | 'multiselect'    // 多选 (MultiChoice)
  | 'lookup'         // 查找字段
  | 'person'         // 人员选择器
  | 'boolean';       // 是/否
```

### 3.3 OData 过滤表达式

```typescript
// 使用 SharePoint OData 语法
type FilterExpression = string;
```

### 3.4 表单配置 (FormSchema)

```typescript
interface FormSchema {
  // 基本信息
  id: string;
  name: string;
  description?: string;

  // 表单模式
  mode: FormMode;

  // SharePoint 配置
  listName: string;           // 目标 List 名称或 ID
  itemId?: number;            // 编辑模式时的 Item ID（运行时动态）

  // 线性步骤
  steps: FormStep[];

  // 提交配置
  submitButtonLabel?: string;
  showCancelButton?: boolean;
  onSubmitMessage?: string;

  // 样式主题（可选）
  theme?: {
    layout?: 'stack' | 'grid';
    columns?: number;
  };
}
```

### 3.5 步骤配置 (FormStep)

```typescript
interface FormStep {
  id: string;
  title: string;
  description?: string;

  // 字段列表
  fields: FormField[];
}
```

### 3.6 字段配置 (FormField)

```typescript
interface FormField {
  // 基础属性
  id: string;
  type: FieldType;
  label: string;

  // 绑定到 SP 字段
  fieldName: string;          // SP 内部字段名

  // 显示控制 - 使用 OData 过滤语法
  visible?: FilterExpression;
  required?: FilterExpression;
  readOnly?: FilterExpression;

  // 字段联动
  onChange?: FieldAction[];

  // 验证规则
  validation?: ValidationRule[];

  // UI 配置
  config?: FieldConfig;
}
```

### 3.7 字段配置 (FieldConfig)

```typescript
interface FieldConfig {
  // 文本字段
  maxLength?: number;
  placeholder?: string;

  // 数字字段
  min?: number;
  max?: number;
  decimals?: number;

  // 日期时间
  displayFormat?: 'dateOnly' | 'dateTime';

  // 下拉/多选
  choices?: string[];
  allowFillIn?: boolean;

  // 查找字段
  lookupList?: string;
  lookupField?: string;
}
```

### 3.8 字段联动动作

```typescript
type FieldAction =
  | { type: 'show'; target: string; condition?: FilterExpression }
  | { type: 'hide'; target: string }
  | { type: 'set-value'; target: string; value: any }
  | { type: 'clear'; target: string }
  | { type: 'enable'; target: string }
  | { type: 'disable'; target: string };
```

### 3.9 验证规则

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  applyWhen?: FilterExpression;  // 何时应用此验证
}
```

---

## 4. OData 过滤语法参考

### 4.1 比较运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `eq` | 等于 | `Status eq 'Pending'` |
| `ne` | 不等于 | `Status ne 'Completed'` |
| `gt` | 大于 | `Amount gt 1000` |
| `ge` | 大于等于 | `Amount ge 1000` |
| `lt` | 小于 | `Amount lt 10000` |
| `le` | 小于等于 | `Amount le 10000` |

### 4.2 字符串运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `contains` | 包含 | `contains(Title, 'urgent')` |
| `startswith` | 开始于 | `startswith(Title, 'RE:')` |

### 4.3 逻辑运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `and` | 并且 | `Status eq 'Pending' and Amount gt 1000` |
| `or` | 或者 | `Status eq 'Pending' or Status eq 'Draft'` |
| `not` | 非 | `not(Status eq 'Completed')` |

### 4.4 空值检查

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `eq null` | 为空 | `ApprovalDate eq null` |
| `ne null` | 不为空 | `ApprovalDate ne null` |

### 4.5 表达式示例

```typescript
// 简单条件
"Status eq 'Pending'"

// 复合条件
"Status eq 'Pending' and Department eq 'IT'"

// 数值比较
"Amount ge 10000 and Amount lt 50000"

// 字符串包含
"contains(Title, 'urgent')"

// 多值条件
"Department eq 'IT' or Department eq 'Finance'"

// 空值检查
"ApprovalDate ne null and RejectionReason eq null"

// 复杂条件
"(Department eq 'IT' or Department eq 'Finance') and Amount gt 10000"
```

---

## 5. 项目结构

```
src/
├── formEngine/                          # 表单引擎核心
│   ├── core/
│   │   ├── types.ts                     # 所有类型定义
│   │   ├── ODataConditionEngine.ts      # OData 条件引擎
│   │   ├── ValidationEngine.ts          # 验证引擎
│   │   ├── FormStateManager.ts          # 表单状态管理
│   │   └── StepEngine.ts                # 步骤引擎
│   │
│   ├── data/
│   │   └── SharePointDataSource.ts       # SP 数据源封装
│   │
│   ├── fields/                          # 内置字段类型
│   │   ├── BaseField.tsx                # 字段基类
│   │   ├── TextField.tsx
│   │   ├── MultilineField.tsx
│   │   ├── NumberField.tsx
│   │   ├── DateTimeField.tsx
│   │   ├── DropdownField.tsx
│   │   ├── MultiSelectField.tsx
│   │   ├── LookupField.tsx
│   │   ├── PersonField.tsx
│   │   └── BooleanField.tsx
│   │
│   ├── components/
│   │   ├── FormRenderer.tsx             # 主表单渲染器
│   │   ├── StepRenderer.tsx             # 步骤渲染器
│   │   ├── FieldContainer.tsx           # 字段容器
│   │   └── FormStepper.tsx              # 步骤导航
│   │
│   └── utils/
│       ├── odata/
│       │   ├── ODataLexer.ts            # 词法分析
│       │   ├── ODataParser.ts           # 语法分析
│       │   └── ODataEvaluator.ts        # 求值器
│       └── fieldValidator.ts            # 字段验证器
│
├── designer/                            # 可视化设计器
│   ├── components/
│   │   ├── FormDesigner.tsx             # 设计器主组件
│   │   ├── DesignerCanvas.tsx           # 画布
│   │   ├── FieldPalette.tsx             # 字段面板
│   │   ├── PropertyPanel.tsx            # 属性配置面板
│   │   ├── StepEditor.tsx               # 步骤编辑器
│   │   ├── ConditionBuilder.tsx         # OData 条件构建器
│   │   └── PreviewPane.tsx              # 预览
│   │
│   └── controls/
│       ├── FieldPalette.tsx             # 字段面板
│       └── FieldLayout.tsx              # 字段布局
│
├── webparts/
│   └── dynamicForm/
│       ├── DynamicFormWebPart.ts
│       ├── components/
│       │   └── DynamicFormViewer.tsx    # 运行时表单查看器
│       │
│       └── properties/
│           ├── PropertyPaneDesigner.tsx # Property Panel 设计器
│           └── FormTemplateSelector.tsx # 模板选择器
│
├── templates/
│   └── formTemplates.ts                 # 预定义模板
│
└── common/
    ├── constants/
    ├── utilities/
    └── hooks/
        ├── useFormState.ts
        ├── useCondition.ts
        └── useDataSource.ts
```

---

## 6. 核心模块设计

### 6.1 OData 条件引擎

```typescript
class ODataConditionEngine {
  /**
   * 评估 OData 过滤表达式
   * @param expression - OData 过滤表达式
   * @param context - 当前表单数据
   * @returns boolean
   */
  evaluate(expression: string, context: Record<string, any>): boolean;

  /**
   * 解析表达式为 AST
   */
  private parse(expression: string): ASTNode;

  /**
   * 支持的运算符
   */
  private readonly operators = {
    'eq': (a, b) => a === b,
    'ne': (a, b) => a !== b,
    'gt': (a, b) => a > b,
    'ge': (a, b) => a >= b,
    'lt': (a, b) => a < b,
    'le': (a, b) => a <= b,
    'and': (a, b) => a && b,
    'or': (a, b) => a || b,
    'not': (a) => !a,
    'contains': (field, value) => field?.includes(value) || false,
    'startswith': (field, prefix) => field?.startsWith(prefix) || false
  };
}
```

### 6.2 表单状态管理器

```typescript
class FormStateManager {
  private state: Record<string, any>;
  private listeners: Map<string, Function[]>;

  setValue(fieldId: string, value: any): void;
  getValue(fieldId: string): any;
  subscribe(fieldId: string, callback: Function): void;
  triggerActions(actions: FieldAction[]): void;
  getAllState(): Record<string, any>;
}
```

### 6.3 SharePoint 数据源

```typescript
class SharePointDataSource {
  constructor(private context: WebPartContext) {}

  /**
   * 获取所有 Lists (用于属性面板下拉选择)
   */
  getLists(): Promise<any[]>;

  /**
   * 获取 List 的所有字段
   */
  getListFields(listName: string): Promise<SPField[]>;

  /**
   * 获取单个项
   */
  getItem(listName: string, itemId: number): Promise<any>;

  /**
   * 创建新项
   */
  createItem(listName: string, item: any): Promise<any>;

  /**
   * 更新项
   */
  updateItem(listName: string, itemId: number, item: any): Promise<any>;

  /**
   * 获取查找字段的可选值
   */
  getLookupChoices(lookupList: string, lookupField: string): Promise<any[]>;
}
```

**功能说明：**
- Web Part 初始化时自动加载当前站点的所有 SharePoint 列表
- 在属性面板中显示为下拉选择框，用户可以选择目标列表
- 列表数据在 Web Part 初始化完成后异步加载并刷新属性面板

---

## 7. 完整表单示例

### 7.1 采购申请表单

```json
{
  "id": "purchase-request",
  "name": "采购申请表单",
  "mode": "new",
  "listName": "PurchaseRequests",
  "submitButtonLabel": "提交申请",
  "steps": [
    {
      "id": "step1",
      "title": "基本信息",
      "fields": [
        {
          "id": "f1",
          "type": "text",
          "label": "标题",
          "fieldName": "Title",
          "required": "true"
        },
        {
          "id": "f2",
          "type": "dropdown",
          "label": "类别",
          "fieldName": "Category",
          "required": "true",
          "config": {
            "choices": ["设备", "软件", "服务", "其他"]
          },
          "onChange": [
            {
              "type": "show",
              "target": "f2_detail",
              "condition": "Category eq '其他'"
            }
          ]
        },
        {
          "id": "f2_detail",
          "type": "text",
          "label": "其他类别说明",
          "fieldName": "OtherCategory",
          "visible": "Category eq '其他'"
        },
        {
          "id": "f3",
          "type": "number",
          "label": "金额",
          "fieldName": "Amount",
          "required": "true",
          "config": {
            "min": 0,
            "decimals": 2
          },
          "validation": [
            {
              "type": "min",
              "value": 0,
              "message": "金额必须大于 0"
            }
          ]
        },
        {
          "id": "f4",
          "type": "dropdown",
          "label": "审批等级",
          "fieldName": "ApprovalLevel",
          "visible": "Amount ge 10000",
          "required": "Amount ge 10000",
          "config": {
            "choices": ["部门经理", "总监", "VP"]
          }
        },
        {
          "id": "f5",
          "type": "person",
          "label": "VP 审批人",
          "fieldName": "VPApprover",
          "visible": "Amount ge 50000 and ApprovalLevel eq 'VP'",
          "required": "Amount ge 50000 and ApprovalLevel eq 'VP'"
        },
        {
          "id": "f6",
          "type": "multiline",
          "label": "说明",
          "fieldName": "Description",
          "required": "Category eq '服务'"
        },
        {
          "id": "f7",
          "type": "datetime",
          "label": "期望日期",
          "fieldName": "ExpectedDate",
          "config": {
            "displayFormat": "dateOnly"
          }
        },
        {
          "id": "f8",
          "type": "boolean",
          "label": "紧急",
          "fieldName": "IsUrgent"
        }
      ]
    }
  ]
}
```

### 7.2 员工信息表单

```json
{
  "id": "employee-form",
  "name": "员工信息表单",
  "mode": "new",
  "listName": "Employees",
  "steps": [
    {
      "id": "step1",
      "title": "基本信息",
      "fields": [
        {
          "id": "f1",
          "type": "text",
          "label": "姓名",
          "fieldName": "Title",
          "required": "true"
        },
        {
          "id": "f2",
          "type": "dropdown",
          "label": "部门",
          "fieldName": "Department",
          "required": "true",
          "config": {
            "choices": ["技术部", "人事部", "财务部", "市场部"]
          }
        },
        {
          "id": "f3",
          "type": "dropdown",
          "label": "技术岗位",
          "fieldName": "TechRole",
          "visible": "Department eq '技术部'",
          "config": {
            "choices": ["前端工程师", "后端工程师", "测试工程师", "DevOps"]
          }
        },
        {
          "id": "f4",
          "type": "person",
          "label": "直属领导",
          "fieldName": "Manager",
          "required": "true"
        },
        {
          "id": "f5",
          "type": "datetime",
          "label": "入职日期",
          "fieldName": "StartDate",
          "required": "true",
          "config": {
            "displayFormat": "dateOnly"
          }
        }
      ]
    }
  ]
}
```

---

## 8. 设计器 UI 设计

### 8.1 条件构建器

```
┌─────────────────────────────────────────────────────────────┐
│  字段显示条件                                  [+ 添加条件]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [字段 ▼]  [运算符 ▼]  [值____________________]  [删除]│ │
│  │  Department  eq         'IT'                          │ │
│  │                                                        │ │
│  │  [and ▼] [字段 ▼] [运算符 ▼] [值______________] [删除]│ │
│  │          Status    eq         'Pending'               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  OData 表达式预览:                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Department eq 'IT' and Status eq 'Pending'             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [测试条件]                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 设计器主界面

```
┌─────────────────────────────────────────────────────────────────┐
│  表单设计器                                              保存 │
├──────────────┬────────────────────────────┬─────────────────────┤
│              │                             │                     │
│  字段面板    │      设计画布               │   属性面板          │
│              │                             │                     │
│ ┌──────────┐ │  ┌───────────────────────┐ │ ┌─────────────────┐ │
│ │ 基础字段  │ │  │ 步骤 1: 基本信息      │ │ │ 字段属性         │ │
│ ├──────────┤ │  │                       │ │ ├─────────────────┤ │
│ │[拖] 文本  │ │  │ ┌───────────────────┐ │ │ │ 标题            │ │
│ │[拖] 多行  │ │  │ │ 标题:             │ │ │ │ [Title________] │ │
│ │[拖] 数字  │ │  │ │ [________________] │ │ │ │                 │ │
│ │[拖] 日期  │ │  │ └───────────────────┘ │ │ │ 字段名          │ │
│ ├──────────┤ │  │                       │ │ │ [Title________] │ │
│ │ 选择字段  │ │  │ ┌───────────────────┐ │ │ │                 │ │
│ ├──────────┤ │  │ │ 部门: *           │ │ │ │ 显示条件        │ │
│ │[拖] 下拉  │ │  │ │ [部门 ▼]         │ │ │ │ [+ 添加条件]   │ │
│ │[拖] 多选  │ │  │ └───────────────────┘ │ │ │                 │ │
│ │[拖] 人员  │ │  │                       │ │ │ 必填条件        │ │
│ ├──────────┤ │  │ [+ 添加字段]           │ │ │ [+ 添加条件]   │ │
│ │ 高级字段  │ │  │                       │ │ │                 │ │
│ ├──────────┤ │  └───────────────────────┘ │ │ 验证规则        │ │
│ │[拖] 查找  │ │                             │ │ [+ 添加规则]   │ │
│ │[拖] 是/否 │ │  ┌─ 步骤导航 ─────────────┐ │ │                 │ │
│ └──────────┘ │  │ [步骤 1] [步骤 2] [+]   │ │ │ 字段联动        │ │
│              │  └─────────────────────────┘ │ │ [+ 添加动作]   │ │
│              │                             │ └─────────────────┘ │
├──────────────┴─────────────────────────────┴─────────────────────┤
│  [预览表单]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. 实施计划

### 阶段 1: 核心引擎
- [x] 创建类型定义文件
- [x] 实现 OData 条件引擎
- [x] 实现表单状态管理器
- [x] 实现验证引擎

### 阶段 2: 数据层与字段
- [x] 实现 SharePoint 数据源
- [x] 实现 SharePoint 列表自动获取
- [x] 实现内置字段类型组件
- [x] 实现字段容器组件

### 阶段 3: 表单渲染
- [x] 实现表单渲染器
- [x] 实现步骤渲染器
- [x] 实现步骤导航组件

### 阶段 4: 设计器
- [x] 实现设计器主组件
- [x] 实现字段面板
- [x] 实现属性配置面板
- [x] 实现 OData 条件构建器
- [x] 实现预览功能

### 阶段 5: Web Part 集成
- [x] 实现属性面板集成
- [x] 实现 SharePoint 列表下拉选择
- [x] 实现表单查看器
- [x] 支持新建/编辑/查看模式

### 阶段 6: 模板与导出
- [x] 创建预定义模板
- [x] 实现导入/导出功能

---

## 10. 技术栈

- **框架**: SPFx 1.21 + React 17
- **UI 库**: Fluent UI 8
- **语言**: TypeScript 5.3
- **状态管理**: 自定义 (FormStateManager)
- **构建**: Gulp

---

*文档版本: 1.0*
*最后更新: 2025-02-01*
