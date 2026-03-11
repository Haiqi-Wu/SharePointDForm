# GitHub Pages 单页设计文档（SPFx Dynamic Form）

日期：2026-03-11

## 目标
为 SharePoint 开发者提供一个简洁、专业、双语（中英）单页介绍，清晰说明项目价值、核心特性与快速上手方式，并提供清晰的 CTA/链接入口。

## 受众
- 主要：SharePoint / SPFx 开发者
- 次要：技术负责人、PO、IT 负责人（快速理解能力边界）

## 范围（单页，简化信息）
只包含 6 个区块：
1. 项目简介（Hero + CTA）
2. 核心特性（卡片）
3. 快速开始（步骤）
4. 技术栈/兼容性（标签/简表）
5. FAQ（2-3 条）
6. CTA/链接

## 双语呈现策略
- 同一区块内“中文主文 + 英文副文”并列排版。
- 桌面端两列，移动端上下堆叠。
- 中文字号略大，英文字号略小且降权色。

## 视觉方向（Fluent 企业感）
- 气质：清爽、理性、轻层次
- 主色：深蓝（主按钮/强调） + 中性灰
- 背景：极浅灰渐变或轻微噪点纹理，避免纯白空洞
- 卡片：圆角 12px、轻阴影

## 版式与排版
- 12 栅格布局，最大宽度 1120px
- Section 垂直间距 56–72px
- 字体：`Segoe UI` / `Microsoft YaHei` 组合
- 字号：
  - Hero 标题 36–40px
  - 正文 15–16px
  - 英文副文 13–14px

## 内容草案（中英对照）

### 1) 项目简介（Hero）
- 中文标题：SharePoint 动态表单引擎（SPFx 1.22）
- 英文标题：SharePoint Dynamic Form Engine (SPFx 1.22)
- 中文副文：面向 SharePoint 列表的可视化表单设计器与运行时渲染器。
- 英文副文：A visual form designer and runtime renderer for SharePoint lists.
- CTA：`Get Started`（锚点至快速开始） / `View on GitHub`

### 2) 核心特性（4 张卡片）
1. 可视化设计器 / Visual Designer
2. 条件显示与验证 / Conditional Rules & Validation
3. 多种字段类型 / Rich Field Types
4. SharePoint 列表集成 / SharePoint List Integration

### 3) 快速开始（4 步）
1. 安装依赖 `npm install`
2. 启动开发 `heft start`
3. 将 Web Part 添加到页面
4. 选择列表并进入设计模式

### 4) 技术栈/兼容性
- SPFx 1.22
- React 17
- Fluent UI 8
- TypeScript 5.3
- Heft toolchain

### 5) FAQ（3 条）
- 设计器如何工作？
- 是否支持附件与复杂字段？
- PnP 控件样式异常怎么办？

### 6) CTA/链接
- GitHub Repo
- 设计规格文档
- Issue / Feedback

## 插图与占位
- 使用几何抽象图或简化 UI 线框图占位
- 后续可替换为真实截图/动图

## 实施说明（待实现）
- 静态单页 `docs/index.html` + `docs/assets/*`
- GitHub Pages 指向 `/docs` 目录
- 纯静态 HTML/CSS/少量 JS，无构建链

## 成功标准
- 10 秒内可理解项目定位与核心能力
- 30 秒内可完成快速开始路径
- 双语阅读自然，无切换成本
