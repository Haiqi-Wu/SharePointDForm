# SharePoint Dynamic Form

<!-- 
  Keywords: SharePoint, SPFx, Dynamic Form, Form Builder, Web Part, React, SharePoint Framework, 
  Form Engine, Visual Designer, No-code Form, SharePoint Online, TypeScript
-->

<p align="center">
  <strong>A powerful SPFx dynamic form builder for SharePoint with visual designer</strong><br>
  <em>Built on SPFx 1.22 with multi-step forms, conditional logic, and 15+ field types</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Quick Start</a> •
  <a href="#usage-guide">Usage</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#faq">FAQ</a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> | English
</p>

---

## What is this project?

SharePoint Dynamic Form is a SharePoint Framework (SPFx) web part that provides a **no-code form builder** for SharePoint lists. Users can visually design forms with drag-and-drop fields, configure conditional logic, and render dynamic forms without writing any code.

### Use Cases

- Business process forms
- Data collection forms
- Approval request forms
- Employee onboarding forms
- Survey and feedback forms
- Multi-step wizard forms

---

## Features

### Visual Form Designer

| Feature | Description |
|---------|-------------|
| Drag-and-Drop | Add fields by clicking `+` button |
| WYSIWYG Preview | See form layout in real-time |
| Field Configuration | Configure field properties inline |
| Layout Control | Grid and stack layout options |

### Rich Field Types (15+)

| Category | Field Types |
|----------|-------------|
| Text | Text, Multiline, Rich Text |
| Number | Number, Integer |
| Date | DateTime, Date Only |
| Selection | Dropdown, MultiSelect, Lookup, Boolean |
| People | Person (single/multiple) |
| Metadata | Taxonomy, Term Store |
| Media | Image, URL, Attachment |

### Conditional Logic

- **Visibility Rules**: Show/hide fields based on conditions
- **Required Rules**: Make fields required dynamically
- **Readonly Rules**: Control field editability
- **Value Actions**: Auto-set field values

### Multi-Step Forms

- Step-by-step wizard navigation
- Progress indicator
- Per-step validation
- Custom step titles and descriptions

### SharePoint Integration

- Direct binding to SharePoint lists
- Automatic field type mapping
- New/Edit/View modes
- Attachment upload support
- People picker integration
- Term store (taxonomy) support

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 22.14.x |
| npm | Latest |
| SharePoint Online | - |
| SPFx | 1.22 |

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SharePointDForm

# Install dependencies
npm install

# Start development server
npm start
```

### Build for Production

```bash
npm run build
```

The solution package (`.sppkg`) will be generated in `sharepoint/solution/`.

---

## Usage Guide

### Step 1: Add Web Part to Page

1. Edit a SharePoint page
2. Add the "SharePoint Dynamic Form" web part
3. Configure the web part properties

### Step 2: Configure List and Mode

| Property | Description |
|----------|-------------|
| List Name | Target SharePoint list |
| Form Mode | New / Edit / View |
| Item ID | Specific item (for Edit/View) |

### Step 3: Design the Form

1. Enable "Designer Mode" in property pane
2. Left panel shows available SharePoint fields
3. Click `+` to add fields to the form
4. Configure field properties (label, required, visible)
5. Arrange fields in grid layout

### Step 4: Configure Buttons and Actions

| Setting | Purpose |
|---------|---------|
| Submit Button Label | Customize submit button text |
| Show Cancel Button | Add cancel option |
| Submit Redirect URL | Redirect after submit |
| Submit Success Message | Show confirmation |

### Configuration Import/Export

Export and import form configurations as JSON for:
- Backup and restore
- Environment migration
- Version control
- Template sharing

---

## Project Structure

```
src/
├── designer/                    # Form Designer Module
│   ├── components/
│   │   ├── FormDesigner.tsx         # Main designer component
│   │   └── DesignerCanvas.tsx       # Drag-drop canvas
│   └── controls/
│       └── FieldPalette.tsx         # Available fields panel
│
├── formEngine/                  # Form Engine Core
│   ├── core/
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── FormStateManager.ts      # State management
│   │   └── ValidationEngine.ts      # Field validation
│   ├── components/
│   │   ├── FormRenderer.tsx         # Main form renderer
│   │   ├── StepRenderer.tsx         # Step container
│   │   └── FormStepper.tsx          # Navigation stepper
│   ├── fields/                      # Field Components (15+ types)
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
│   ├── hooks/                       # Custom React Hooks
│   └── data/
│       └── SharePointDataSource.ts  # SharePoint API layer
│
└── webparts/sharePointDynamicForm/  # SPFx Web Part
    ├── SharePointDynamicFormWebPart.ts   # Entry point
    ├── propertyPane/                     # Property pane config
    └── loc/                              # Localization (en-us, zh-cn)
```

---

## FAQ

### General Questions

<details>
<summary><strong>What SharePoint versions are supported?</strong></summary>

This project is built on SPFx 1.22 and targets SharePoint Online. It may work with SharePoint 2019/SE with modifications.
</details>

<details>
<summary><strong>Is coding required to use this?</strong></summary>

No coding is required. The visual designer allows you to build forms through a user-friendly interface.
</details>

<details>
<summary><strong>Can I customize field styles?</strong></summary>

Yes, you can modify the CSS files in `src/formEngine/fields/*.css` or use Fluent UI theming.
</details>

### Technical Questions

<details>
<summary><strong>PnP controls have style issues, how to fix?</strong></summary>

This project includes compatibility patches:
- Webpack CSS hash patch: `config/spfx-customize-webpack.js`
- Fallback styles: `src/formEngine/fields/PnpControlCompat.css`

Clear browser cache after deployment.
</details>

<details>
<summary><strong>How do I add custom field types?</strong></summary>

1. Create a new component in `src/formEngine/fields/`
2. Extend `BaseField` component
3. Register in `src/formEngine/fields/index.tsx`
4. Add type definition in `src/formEngine/core/types.ts`
</details>

<details>
<summary><strong>How to handle form validation?</strong></summary>

The form engine includes a `ValidationEngine` that supports:
- Required field validation
- Min/Max length validation
- Pattern (regex) validation
- Custom validation rules
</details>

### Deployment Questions

<details>
<summary><strong>How to deploy to SharePoint?</strong></summary>

1. Run `npm run build`
2. Upload `.sppkg` from `sharepoint/solution/` to App Catalog
3. Add the app to your site
</details>

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Fields not loading | Check list permissions |
| Styles missing | Clear browser cache |
| Submit fails | Check required fields |
| Designer blank | Select a valid list |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SPFx 1.22, React 17 |
| UI Library | Fluent UI React 8.x |
| SharePoint | PnP.js 4.x |
| Controls | @pnp/spfx-controls-react |
| Editor | React Quill |
| Build | Heft, Webpack 5 |
| Language | TypeScript 5.8 |

---

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PR.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>SharePoint Dynamic Form</strong> - Build dynamic forms without code<br><br>
  Made with ❤️ for SharePoint developers
</p>
