# Config Import/Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add property-pane file import/export to fully overwrite the web part configuration via a versioned JSON file.

**Architecture:** Introduce a small config IO utility for serialize/parse, a custom property pane field rendering a React control, and localization for new strings. Import overwrites all properties, syncs internal designer mode state, refreshes the property pane, and re-renders.

**Tech Stack:** SPFx 1.22, React, Fluent UI, TypeScript, Property Pane Custom Field

---

### Task 1: Add config IO helpers + minimal automated test

**Files:**
- Create: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/utils/configIO.ts`
- Create: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/scripts/config-io.test.ts`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/package.json`

**Step 1: Write the failing test**

```ts
// scripts/config-io.test.ts
import assert from 'node:assert/strict';
import { buildConfigExport, parseConfigExport } from '../src/webparts/sharePointDynamicForm/utils/configIO';

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
assert.equal(exported.version, 1);
assert.equal(exported.properties.listName, 'TestList');

const parsed = parseConfigExport(JSON.stringify(exported));
assert.equal(parsed.ok, true);
assert.equal(parsed.value?.listName, 'TestList');

const bad = parseConfigExport('not json');
assert.equal(bad.ok, false);
```

**Step 2: Run test to verify it fails**

Run: `npm run test:config-io`  
Expected: FAIL (module or functions missing)

**Step 3: Write minimal implementation**

```ts
// src/webparts/sharePointDynamicForm/utils/configIO.ts
import { ISharePointDynamicFormWebPartProps } from '../SharePointDynamicFormWebPart';

export const CONFIG_IO_VERSION = 1;

export type ConfigExport = {
  version: number;
  properties: Partial<ISharePointDynamicFormWebPartProps>;
};

export function buildConfigExport(props: ISharePointDynamicFormWebPartProps): ConfigExport {
  return { version: CONFIG_IO_VERSION, properties: { ...props } };
}

export function parseConfigExport(json: string): {
  ok: boolean;
  value?: Partial<ISharePointDynamicFormWebPartProps>;
  error?: string;
} {
  try {
    const data = JSON.parse(json);
    if (typeof data?.version !== 'number' || typeof data?.properties !== 'object') {
      return { ok: false, error: 'Invalid format' };
    }
    return { ok: true, value: data.properties };
  } catch (err) {
    return { ok: false, error: 'Invalid JSON' };
  }
}
```

**Step 4: Update package.json to run test**

Add to `devDependencies`: `ts-node`  
Add script: `"test:config-io": "node -r ts-node/register scripts/config-io.test.ts"`

**Step 5: Run test to verify it passes**

Run: `npm run test:config-io`  
Expected: PASS (no output, exit 0)

**Step 6: Commit**

```bash
git add src/webparts/sharePointDynamicForm/utils/configIO.ts scripts/config-io.test.ts package.json package-lock.json
git commit -m "test: add config IO helper tests"
```

---

### Task 2: Add Property Pane custom control (UI + wiring)

**Files:**
- Create: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/propertyPane/ConfigIOControl.tsx`
- Create: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/propertyPane/PropertyPaneConfigIO.ts`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/SharePointDynamicFormWebPart.ts`

**Step 1: Write the failing test**

Manual test placeholder (no UI tests in project):
- Add control to property pane → expect two buttons and file picker (currently missing).

**Step 2: Run manual test to verify it fails**

Run: `npm run build` and load in workbench  
Expected: No import/export buttons present.

**Step 3: Write minimal implementation**

```tsx
// ConfigIOControl.tsx (sketch)
export type ConfigIOControlProps = {
  exportConfig: () => string;
  importConfig: (json: string) => Promise<{ ok: boolean; message?: string; level?: 'error'|'warning'|'success' }>;
  strings: { exportLabel: string; importLabel: string; ... };
};
```

```ts
// PropertyPaneConfigIO.ts (sketch)
export function PropertyPaneConfigIO(targetProperty: string, props: ConfigIOFieldProps): IPropertyPaneField<IPropertyPaneCustomFieldProps> { ... }
```

In `SharePointDynamicFormWebPart.ts`:
- Add new property pane group for config IO.
- Wire `exportConfig` to `buildConfigExport`.
- Wire `importConfig` to `parseConfigExport`, then overwrite `this.properties` fields and sync `_isInDesignerMode`.
- `this.context.propertyPane.refresh()` and `this.render()` after import.
- If listName not in `_lists`, return a warning message.

**Step 4: Run manual test to verify it passes**

Run: `npm run build` and load in workbench  
Expected: Buttons render; export downloads JSON; import overwrites properties and re-renders.

**Step 5: Commit**

```bash
git add src/webparts/sharePointDynamicForm/propertyPane src/webparts/sharePointDynamicForm/SharePointDynamicFormWebPart.ts
git commit -m "feat: add property pane config import/export control"
```

---

### Task 3: Localization strings for new UI

**Files:**
- Modify: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/loc/mystrings.d.ts`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/loc/en-us.js`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/.worktrees/codex-config-import-export/src/webparts/sharePointDynamicForm/loc/zh-cn.js`

**Step 1: Write the failing test**

Manual check:
- Build should fail if string keys are missing.

**Step 2: Run build to verify it fails**

Run: `npm run build`  
Expected: FAIL due to missing string keys.

**Step 3: Implement strings**

Add keys such as:
- `PropertyGroupConfigIO`
- `ConfigExportButton`
- `ConfigImportButton`
- `ConfigImportSuccess`
- `ConfigImportError`
- `ConfigImportWarningList`

**Step 4: Run build to verify it passes**

Run: `npm run build`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/webparts/sharePointDynamicForm/loc
git commit -m "chore: add config IO localized strings"
```

---

### Task 4: End-to-end verification

**Files:**
- None

**Step 1: Manual validation**

1. Export config to file.
2. Change multiple settings.
3. Import exported file.
4. Verify all settings revert and web part re-renders.

**Step 2: Commit (if any changes)**

```bash
git status
```

