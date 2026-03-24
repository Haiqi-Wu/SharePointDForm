# SharePoint 动态表单

<!-- 
  关键词: SharePoint, SPFx, 动态表单, 表单设计器, Web Part, React, SharePoint Framework,
  表单引擎, 可视化设计器, 零代码表单, SharePoint Online, TypeScript, 表单构建器
-->

<p align="center">
  <strong>一个强大的 SharePoint 动态表单解决方案，支持可视化设计器</strong><br>
  <em>基于 SPFx 1.22 构建，支持多步骤表单、条件逻辑和 15+ 种字段类型</em>
</p>

<p align="center">
  <a href="#核心特性">核心特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#常见问题">常见问题</a>
</p>

<p align="center">
  English | <a href="README.md">简体中文</a>
</p>

---

## 这个项目是什么？

SharePoint Dynamic Form 是一个 SharePoint Framework (SPFx) Web Part，为 SharePoint 列表提供**零代码表单构建器**。用户可以通过拖拽字段可视化设计表单、配置条件逻辑，无需编写任何代码即可渲染动态表单。

### 使用场景

- 业务流程表单
- 数据收集表单
- 审批申请表单
- 员工入职表单
- 调查问卷表单
- 多步骤向导表单

---

## 核心特性

### 可视化表单设计器

| 功能 | 说明 |
|------|------|
| 拖拽添加 | 点击 `+` 按钮添加字段 |
| 所见即所得 | 实时预览表单布局 |
| 内联配置 | 直接配置字段属性 |
| 灵活布局 | 网格和堆叠布局选项 |

### 丰富字段类型（15+ 种）

| 类别 | 字段类型 |
|------|----------|
| 文本 | 单行文本、多行文本、富文本 |
| 数字 | 数字、整数 |
| 日期 | 日期时间、仅日期 |
| 选择 | 下拉、多选、查找、是/否 |
| 人员 | 人员选择（单选/多选） |
| 元数据 | 术语库、托管元数据 |
| 媒体 | 图片、链接、附件 |

### 条件逻辑

- **可见性规则**：根据条件显示/隐藏字段
- **必填规则**：动态设置必填项
- **只读规则**：控制字段可编辑性
- **值操作**：自动设置字段值

### 多步骤表单

- 步骤向导导航
- 进度指示器
- 分步验证
- 自定义步骤标题和描述

### SharePoint 集成

- 直接绑定 SharePoint 列表
- 自动字段类型映射
- 新建/编辑/查看模式
- 附件上传支持
- 人员选择器集成
- 术语库支持

---

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | 22.14.x |
| npm | 最新版 |
| SharePoint Online | - |
| SPFx | 1.22 |

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd SharePointDForm

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 构建生产版本

```bash
npm run build
```

解决方案包 (`.sppkg`) 将生成在 `sharepoint/solution/` 目录中。

---

## 使用指南

### 步骤 1：添加 Web Part 到页面

1. 编辑 SharePoint 页面
2. 添加 "SharePoint Dynamic Form" Web Part
3. 配置 Web Part 属性

### 步骤 2：配置列表和模式

| 属性 | 说明 |
|------|------|
| 列表名称 | 目标 SharePoint 列表 |
| 表单模式 | 新建 / 编辑 / 查看 |
| 条目 ID | 指定条目（编辑/查看模式） |

### 步骤 3：设计表单

1. 在属性面板启用"设计器模式"
2. 左侧面板显示可用的 SharePoint 字段
3. 点击 `+` 将字段添加到表单
4. 配置字段属性（标签、必填、可见性）
5. 在网格布局中排列字段

### 步骤 4：配置按钮和动作

| 设置 | 用途 |
|------|------|
| 提交按钮文本 | 自定义提交按钮文字 |
| 显示取消按钮 | 添加取消选项 |
| 提交后跳转 URL | 提交成功后跳转 |
| 提交成功消息 | 显示确认信息 |

### 配置导入导出

支持 JSON 格式的配置导入导出，用于：
- 备份和恢复
- 环境迁移
- 版本控制
- 模板共享

---

## 项目结构

```
src/
├── designer/                    # 表单设计器模块
│   ├── components/
│   │   ├── FormDesigner.tsx         # 设计器主组件
│   │   └── DesignerCanvas.tsx       # 拖拽画布
│   └── controls/
│       └── FieldPalette.tsx         # 可用字段面板
│
├── formEngine/                  # 表单引擎核心
│   ├── core/
│   │   ├── types.ts                 # TypeScript 类型定义
│   │   ├── FormStateManager.ts      # 状态管理
│   │   └── ValidationEngine.ts      # 字段验证
│   ├── components/
│   │   ├── FormRenderer.tsx         # 表单渲染器
│   │   ├── StepRenderer.tsx         # 步骤容器
│   │   └── FormStepper.tsx          # 导航步进器
│   ├── fields/                      # 字段组件（15+ 种类型）
│   │   ├── TextField.tsx
│   │   ├── MultilineField.tsx
│   │   ├── RichTextField.tsx
│   │   ├── NumberField.tsx
│   │   ├── DateTimeField.tsx
│   │   ├── DropdownField.tsx
│   │   ├── MultiSelectField.tsx
│   │   ├── LookupField.tsx
│   │   ├── PersonField.tsx
│   │   ├── BooleanField.tsx
│   │   ├── UrlField.tsx
│   │   ├── ImageField.tsx
│   │   ├── TaxonomyField.tsx
│   │   ├── AttachmentField.tsx
│   │   └── NewLineField.tsx
│   ├── hooks/                       # 自定义 React Hooks
│   └── data/
│       └── SharePointDataSource.ts  # SharePoint API 层
│
└── webparts/sharePointDynamicForm/  # SPFx Web Part
    ├── SharePointDynamicFormWebPart.ts   # 入口文件
    ├── propertyPane/                     # 属性面板配置
    └── loc/                              # 本地化（英文、中文）
```

---

## 常见问题

### 一般问题

<details>
<summary><strong>支持哪些 SharePoint 版本？</strong></summary>

本项目基于 SPFx 1.22 构建，主要面向 SharePoint Online。经修改后可能适用于 SharePoint 2019/SE。
</details>

<details>
<summary><strong>使用需要编程吗？</strong></summary>

不需要编程。可视化设计器允许您通过友好的界面构建表单。
</details>

<details>
<summary><strong>可以自定义字段样式吗？</strong></summary>

可以，您可以修改 `src/formEngine/fields/*.css` 中的样式文件或使用 Fluent UI 主题。
</details>

### 技术问题

<details>
<summary><strong>PnP 控件样式有问题，如何解决？</strong></summary>

本项目包含兼容性补丁：
- Webpack CSS 哈希补丁：`config/spfx-customize-webpack.js`
- 兼容性样式：`src/formEngine/fields/PnpControlCompat.css`

部署后请清除浏览器缓存。
</details>

<details>
<summary><strong>如何添加自定义字段类型？</strong></summary>

1. 在 `src/formEngine/fields/` 创建新组件
2. 继承 `BaseField` 组件
3. 在 `src/formEngine/fields/index.tsx` 注册
4. 在 `src/formEngine/core/types.ts` 添加类型定义
</details>

<details>
<summary><strong>如何处理表单验证？</strong></summary>

表单引擎包含 `ValidationEngine`，支持：
- 必填字段验证
- 最小/最大长度验证
- 正则表达式验证
- 自定义验证规则
</details>

### 部署问题

<details>
<summary><strong>如何部署到 SharePoint？</strong></summary>

1. 运行 `npm run build`
2. 将 `sharepoint/solution/` 中的 `.sppkg` 上传到应用目录
3. 将应用添加到您的网站
</details>

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 字段未加载 | 检查列表权限 |
| 样式丢失 | 清除浏览器缓存 |
| 提交失败 | 检查必填字段 |
| 设计器空白 | 选择有效列表 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | SPFx 1.22, React 17 |
| UI 库 | Fluent UI React 8.x |
| SharePoint | PnP.js 4.x |
| 控件 | @pnp/spfx-controls-react |
| 编辑器 | React Quill |
| 构建 | Heft, Webpack 5 |
| 语言 | TypeScript 5.8 |

---

## 贡献

欢迎贡献代码！提交 PR 前请阅读贡献指南。

---

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)。

---

<p align="center">
  <strong>SharePoint 动态表单</strong> - 零代码构建动态表单<br><br>
  Made with ❤️ for SharePoint developers
</p>
