# SharePoint Dynamic Form - SPFx Dynamic Form Builder | SharePoint 动态表单

<!-- 
  Keywords: SharePoint, SPFx, Dynamic Form, Form Builder, Web Part, React, SharePoint Framework, 
  表单设计器, 动态表单, SharePoint 表单, SPFx Web Part, 表单引擎, Form Engine
-->

<p align="center">
  <strong>A powerful SPFx dynamic form builder for SharePoint with visual designer</strong><br>
  <strong>一个强大的 SharePoint 动态表单解决方案，支持可视化设计器</strong><br>
  <em>Built on SPFx 1.22 | 基于 SPFx 1.22 构建</em>
</p>

<p align="center">
  <a href="#-features--核心特性">Features | 特性</a> •
  <a href="#-getting-started--快速开始">Quick Start | 快速开始</a> •
  <a href="#-usage-guide--使用指南">Usage | 使用</a> •
  <a href="#-project-structure--项目结构">Structure | 结构</a> •
  <a href="#-faq--常见问题">FAQ | 常见问题</a>
</p>

---

## What is this project? | 这个项目是什么？

**English**: SharePoint Dynamic Form is a SharePoint Framework (SPFx) web part that provides a **no-code form builder** for SharePoint lists. Users can visually design forms with drag-and-drop fields, configure conditional logic, and render dynamic forms without writing any code.

**中文**: SharePoint Dynamic Form 是一个 SharePoint Framework (SPFx) Web Part，为 SharePoint 列表提供**零代码表单构建器**。用户可以通过拖拽字段可视化设计表单、配置条件逻辑，无需编写任何代码即可渲染动态表单。

### Use Cases | 使用场景

- Business process forms | 业务流程表单
- Data collection forms | 数据收集表单
- Approval request forms | 审批申请表单
- Employee onboarding forms | 员工入职表单
- Survey and feedback forms | 调查问卷表单
- Multi-step wizard forms | 多步骤向导表单

---

## 📖 Features | 核心特性

### Visual Form Designer | 可视化表单设计器

| Feature | Description | 功能说明 |
|---------|-------------|----------|
| Drag-and-Drop | Add fields by clicking `+` button | 点击 `+` 按钮添加字段 |
| WYSIWYG Preview | See form layout in real-time | 实时预览表单布局 |
| Field Configuration | Configure field properties inline | 内联配置字段属性 |
| Layout Control | Grid and stack layout options | 网格和堆叠布局选项 |

### Rich Field Types | 丰富字段类型

This SPFx form builder supports **15+ field types** including:

| Category | Field Types | 类别 | 字段类型 |
|----------|-------------|------|----------|
| Text | Text, Multiline, Rich Text | 文本 | 单行、多行、富文本 |
| Number | Number, Integer | 数字 | 数字、整数 |
| Date | DateTime, Date Only | 日期 | 日期时间、仅日期 |
| Selection | Dropdown, MultiSelect, Lookup, Boolean | 选择 | 下拉、多选、查找、是/否 |
| People | Person (single/multiple) | 人员 | 人员选择（单选/多选） |
| Metadata | Taxonomy, Term Store | 元数据 | 术语库、托管元数据 |
| Media | Image, URL, Attachment | 媒体 | 图片、链接、附件 |

### Conditional Logic | 条件逻辑

- **Visibility Rules**: Show/hide fields based on conditions | 根据条件显示/隐藏字段
- **Required Rules**: Make fields required dynamically | 动态设置必填项
- **Readonly Rules**: Control field editability | 控制字段可编辑性
- **Value Actions**: Auto-set field values | 自动设置字段值

### Multi-Step Forms | 多步骤表单

- Step-by-step wizard navigation | 步骤向导导航
- Progress indicator | 进度指示器
- Per-step validation | 分步验证
- Custom step titles and descriptions | 自定义步骤标题和描述

### SharePoint Integration | SharePoint 集成

- Direct binding to SharePoint lists | 直接绑定 SharePoint 列表
- Automatic field type mapping | 自动字段类型映射
- New/Edit/View modes | 新建/编辑/查看模式
- Attachment upload support | 附件上传支持
- People picker integration | 人员选择器集成
- Term store (taxonomy) support | 术语库支持

---

## 🚀 Getting Started | 快速开始

### Prerequisites | 环境要求

| Requirement | Version | Required | 必需 |
|-------------|---------|----------|------|
| Node.js | 22.14.x | ✅ Yes | ✅ 是 |
| npm | Latest | ✅ Yes | ✅ 是 |
| SharePoint Online | - | ✅ Yes | ✅ 是 |
| SPFx | 1.22 | ✅ Yes | ✅ 是 |

### Installation Steps | 安装步骤

```bash
# Step 1: Clone or download the project | 克隆或下载项目
git clone <repository-url>
cd SharePointDForm

# Step 2: Install dependencies | 安装依赖
npm install

# Step 3: Start development server | 启动开发服务器
npm start
# or use heft directly | 或直接使用 heft
heft start
```

### Build for Production | 构建生产版本

```bash
# Build and package | 构建和打包
npm run build
```

The solution package (`.sppkg`) will be generated in the `sharepoint/solution` folder.

解决方案包 (`.sppkg`) 将生成在 `sharepoint/solution` 目录中。

---

## 📚 Usage Guide | 使用指南

### How to Create a Dynamic Form | 如何创建动态表单

#### Step 1: Add Web Part to Page | 步骤 1：添加 Web Part

1. Edit a SharePoint page | 编辑 SharePoint 页面
2. Add the "SharePoint Dynamic Form" web part | 添加 "SharePoint Dynamic Form" Web Part
3. Configure the web part properties | 配置 Web Part 属性

#### Step 2: Configure List and Mode | 步骤 2：配置列表和模式

| Property | Description | 属性 | 说明 |
|----------|-------------|------|------|
| List Name | Target SharePoint list | 列表名称 | 目标 SharePoint 列表 |
| Form Mode | New / Edit / View | 表单模式 | 新建 / 编辑 / 查看 |
| Item ID | Specific item (for Edit/View) | 条目 ID | 指定条目（编辑/查看模式） |

#### Step 3: Design the Form | 步骤 3：设计表单

1. Enable "Designer Mode" in property pane | 在属性面板启用"设计器模式"
2. Left panel shows available SharePoint fields | 左侧面板显示可用的 SharePoint 字段
3. Click `+` to add fields to the form | 点击 `+` 将字段添加到表单
4. Configure field properties (label, required, visible) | 配置字段属性（标签、必填、可见性）
5. Arrange fields in grid layout | 在网格布局中排列字段

#### Step 4: Configure Buttons and Actions | 步骤 4：配置按钮和动作

| Setting | Purpose | 设置 | 用途 |
|---------|---------|------|------|
| Submit Button Label | Customize submit button text | 提交按钮文本 | 自定义提交按钮文字 |
| Show Cancel Button | Add cancel option | 显示取消按钮 | 添加取消选项 |
| Submit Redirect URL | Redirect after submit | 提交后跳转 | 提交成功后跳转 |
| Submit Success Message | Show confirmation | 提交成功消息 | 显示确认信息 |

### Configuration Import/Export | 配置导入导出

Export and import form configurations as JSON for:
- Backup and restore | 备份和恢复
- Environment migration | 环境迁移
- Version control | 版本控制
- Template sharing | 模板共享

---

## 🏗️ Project Structure | 项目结构

```
src/
├── designer/                    # Form Designer Module | 表单设计器模块
│   ├── components/
│   │   ├── FormDesigner.tsx         # Main designer component | 设计器主组件
│   │   └── DesignerCanvas.tsx       # Drag-drop canvas | 拖拽画布
│   └── controls/
│       └── FieldPalette.tsx         # Available fields panel | 可用字段面板
│
├── formEngine/                  # Form Engine Core | 表单引擎核心
│   ├── core/
│   │   ├── types.ts                 # TypeScript type definitions | 类型定义
│   │   ├── FormStateManager.ts      # State management | 状态管理
│   │   └── ValidationEngine.ts      # Field validation | 字段验证
│   ├── components/
│   │   ├── FormRenderer.tsx         # Main form renderer | 表单渲染器
│   │   ├── StepRenderer.tsx         # Step container | 步骤容器
│   │   └── FormStepper.tsx          # Navigation stepper | 导航步进器
│   ├── fields/                      # Field Components | 字段组件
│   │   ├── TextField.tsx            # Single line text | 单行文本
│   │   ├── MultilineField.tsx       # Multi-line text | 多行文本
│   │   ├── RichTextField.tsx        # Rich text editor | 富文本编辑器
│   │   ├── NumberField.tsx          # Numeric input | 数字输入
│   │   ├── DateTimeField.tsx        # Date time picker | 日期时间选择器
│   │   ├── DropdownField.tsx        # Dropdown select | 下拉选择
│   │   ├── MultiSelectField.tsx     # Multi-select | 多选
│   │   ├── LookupField.tsx           # Lookup field | 查找字段
│   │   ├── PersonField.tsx           # People picker | 人员选择器
│   │   ├── BooleanField.tsx          # Yes/No toggle | 是/否开关
│   │   ├── UrlField.tsx             # URL field | 链接字段
│   │   ├── ImageField.tsx           # Image upload | 图片上传
│   │   ├── TaxonomyField.tsx         # Term store picker | 术语库选择器
│   │   ├── AttachmentField.tsx       # File attachments | 附件上传
│   │   └── NewLineField.tsx          # Layout newline | 布局换行
│   ├── hooks/                       # Custom React Hooks | 自定义 Hooks
│   └── data/
│       └── SharePointDataSource.ts  # SharePoint API layer | SharePoint API 层
│
└── webparts/sharePointDynamicForm/  # SPFx Web Part | SPFx Web Part
    ├── SharePointDynamicFormWebPart.ts   # Entry point | 入口文件
    ├── propertyPane/                     # Property pane config | 属性面板配置
    └── loc/                              # Localization | 本地化
        ├── en-us.js                      # English | 英文
        └── zh-cn.js                      # Chinese | 中文
```

---

## ❓ FAQ | 常见问题

### General Questions | 一般问题

<details>
<summary><strong>What SharePoint versions are supported? | 支持哪些 SharePoint 版本？</strong></summary>

**English**: This project is built on SPFx 1.22 and targets SharePoint Online. It may work with SharePoint 2019/SE with modifications.

**中文**: 本项目基于 SPFx 1.22 构建，主要面向 SharePoint Online。经修改后可能适用于 SharePoint 2019/SE。
</details>

<details>
<summary><strong>Is coding required to use this? | 使用需要编程吗？</strong></summary>

**English**: No coding is required. The visual designer allows you to build forms through a user-friendly interface.

**中文**: 不需要编程。可视化设计器允许您通过友好的界面构建表单。
</details>

<details>
<summary><strong>Can I customize field styles? | 可以自定义字段样式吗？</strong></summary>

**English**: Yes, you can modify the CSS files in `src/formEngine/fields/*.css` or use Fluent UI theming.

**中文**: 可以，您可以修改 `src/formEngine/fields/*.css` 中的样式文件或使用 Fluent UI 主题。
</details>

### Technical Questions | 技术问题

<details>
<summary><strong>PnP controls have style issues, how to fix? | PnP 控件样式有问题，如何解决？</strong></summary>

**English**: This project includes compatibility patches:
- Webpack CSS hash patch: `config/spfx-customize-webpack.js`
- Fallback styles: `src/formEngine/fields/PnpControlCompat.css`
Clear browser cache after deployment.

**中文**: 本项目包含兼容性补丁：
- Webpack CSS 哈希补丁: `config/spfx-customize-webpack.js`
- 兼容性样式: `src/formEngine/fields/PnpControlCompat.css`
部署后请清除浏览器缓存。
</details>

<details>
<summary><strong>How do I add custom field types? | 如何添加自定义字段类型？</strong></summary>

**English**: 
1. Create a new component in `src/formEngine/fields/`
2. Extend `BaseField` component
3. Register in `src/formEngine/fields/index.tsx`
4. Add type definition in `src/formEngine/core/types.ts`

**中文**:
1. 在 `src/formEngine/fields/` 创建新组件
2. 继承 `BaseField` 组件
3. 在 `src/formEngine/fields/index.tsx` 注册
4. 在 `src/formEngine/core/types.ts` 添加类型定义
</details>

<details>
<summary><strong>How to handle form validation? | 如何处理表单验证？</strong></summary>

**English**: The form engine includes a `ValidationEngine` that supports:
- Required field validation
- Min/Max length validation
- Pattern (regex) validation
- Custom validation rules

**中文**: 表单引擎包含 `ValidationEngine`，支持：
- 必填字段验证
- 最小/最大长度验证
- 正则表达式验证
- 自定义验证规则
</details>

### Deployment Questions | 部署问题

<details>
<summary><strong>How to deploy to SharePoint? | 如何部署到 SharePoint？</strong></summary>

**English**:
1. Run `npm run build`
2. Upload `.sppkg` from `sharepoint/solution/` to App Catalog
3. Add the app to your site

**中文**:
1. 运行 `npm run build`
2. 将 `sharepoint/solution/` 中的 `.sppkg` 上传到应用目录
3. 将应用添加到您的网站
</details>

---

## 🔧 Troubleshooting | 故障排除

| Issue | Solution | 问题 | 解决方案 |
|-------|----------|------|----------|
| Fields not loading | Check list permissions | 字段未加载 | 检查列表权限 |
| Styles missing | Clear browser cache | 样式丢失 | 清除浏览器缓存 |
| Submit fails | Check required fields | 提交失败 | 检查必填字段 |
| Designer blank | Select a valid list | 设计器空白 | 选择有效列表 |

---

## 📦 Tech Stack | 技术栈

| Category | Technology | 类别 | 技术 |
|----------|------------|------|------|
| Framework | SPFx 1.22, React 17 | 框架 | SPFx 1.22, React 17 |
| UI Library | Fluent UI React 8.x | UI 库 | Fluent UI React 8.x |
| SharePoint | PnP.js 4.x | SharePoint | PnP.js 4.x |
| Controls | @pnp/spfx-controls-react | 控件 | @pnp/spfx-controls-react |
| Editor | React Quill | 编辑器 | React Quill |
| Build | Heft, Webpack 5 | 构建 | Heft, Webpack 5 |
| Language | TypeScript 5.8 | 语言 | TypeScript 5.8 |

---

## 🤝 Contributing | 贡献

Contributions are welcome! Please read the contributing guidelines before submitting PR.

欢迎贡献代码！提交 PR 前请阅读贡献指南。

---

## 📄 License | 许可证

MIT License - See [LICENSE](LICENSE) for details.

MIT 许可证 - 详见 [LICENSE](LICENSE)。

---

<p align="center">
  <strong>SharePoint Dynamic Form</strong> - Build dynamic forms without code<br>
  <strong>SharePoint 动态表单</strong> - 零代码构建动态表单<br><br>
  Made with ❤️ for SharePoint developers
</p>
