# Config Import/Export (Property Pane) Design

**Goal:** Allow users to export the full web part configuration to a JSON file and import it back, from the web part property pane, with import fully overwriting current settings.

## Scope
- **In scope:** Export/import of all `ISharePointDynamicFormWebPartProps` fields via property pane UI; versioned JSON format.
- **Out of scope:** Merging configs, schema diffing, server-side persistence, or designer UI changes.

## UX Overview
- Add a new property pane section with two buttons:
  - **Export config**: downloads a JSON file containing the full config.
  - **Import config**: opens file picker, parses JSON, overwrites properties, re-renders the web part.
- Errors (invalid JSON / missing fields) show a clear message (MessageBar or alert) and do not change state.

## Data Format
```json
{
  "version": 1,
  "properties": {
    "formSchemaJson": "...",
    "listName": "...",
    "mode": "new|edit|view",
    "useItemId": true,
    "itemId": 0,
    "itemIdQueryParam": "ID",
    "isInDesignerMode": false,
    "labelPosition": "top|left",
    "showFieldDescription": true,
    "submitButtonLabel": "...",
    "showCancelButton": true,
    "cancelButtonLabel": "...",
    "cancelRedirectUrl": "...",
    "submitRedirectUrl": "...",
    "onSubmitMessage": "..."
  }
}
```

## Import Behavior
- Validate JSON parses.
- Require `version` (number) and `properties` (object).
- Overwrite all properties with imported values (missing fields fall back to defaults).
- Sync internal `_isInDesignerMode` to the imported `isInDesignerMode`.
- Refresh property pane and re-render web part.
- If imported `listName` does not exist in current site, keep value but warn user to reselect.

## Implementation Notes
- Implement a custom Property Pane field (PropertyPaneFieldType.Custom).
- Use React DOM to render a small control with two buttons and a hidden file input.
- Use `FileReader` for import and `Blob + URL.createObjectURL` for export.
- Localize all new UI strings.

## Testing
- Manual test:
  - Export → import same file → config unchanged.
  - Import invalid JSON → error shown, config unchanged.
  - Import missing listName → warning shown, drop-down shows no match.

