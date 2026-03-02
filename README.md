# SharePoint Dynamic Form (SPFx 1.22)

A SharePoint Framework web part for building and rendering dynamic forms against SharePoint lists. Includes a designer UI, grid layout, conditional visibility, and PnP controls (PeoplePicker, TaxonomyPicker, ListItemAttachments).

## Features

- Designer mode with button-based field insertion (no drag and drop)
- Grid and stack layouts with column spans
- Field types: text, multiline, number, datetime, dropdown, multiselect, lookup, person, boolean, image, URL, taxonomy, attachment, richtext
- Conditional visibility and required rules
- Draft autosave (localStorage)
- Attachments upload on submit
- PnP controls compatibility patch for SPFx 1.22

## Prerequisites

- Node.js 22.14.x
- npm
- SPFx 1.22 toolchain (Heft)

## Build and Run

- `npm install`
- `npm run start`
- `npm run build`

## Usage

1. Add the web part to a page.
2. Choose a list in the property pane.
3. Toggle designer mode.
4. Use the `+` buttons to insert fields.
5. Save the schema and switch to runtime mode.

## Notes

- Drag and drop is intentionally removed. Field insertion is button-driven.
- PnP controls are not fully aligned with SPFx 1.22. This project includes:
  - Webpack CSS hashing patch: `config/spfx-customize-webpack.js`
  - Fallback styles: `src/formEngine/fields/PnpControlCompat.css`

## Troubleshooting

- If PnP control styles look off in SPFx 1.22, verify the patch file is loaded and clear the browser cache.
- If a field does not update on submit, confirm the field is not in read-only or hidden state.

## License

Provided as-is.
