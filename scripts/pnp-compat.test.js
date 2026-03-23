const fs = require('fs');
const path = require('path');

const checks = [
  {
    file: path.join(__dirname, '..', 'src', 'formEngine', 'fields', 'PnpControlCompat.css'),
    selectors: [
      /\.spdf-taxonomy\s+\.termField\b/,
      /\.spdf-taxonomy\s+\.termFieldInput\b/,
      /\.spdf-taxonomy\s+\.pickedTermRoot\b/,
      /\.spdf-taxonomy\s+\.errorMessage\b/,
      /\.spdf-attachments\s+\.ListItemAttachments\b/,
      /\.spdf-attachments\s+\.documentCardWrapper\b/,
      /\.spdf-attachments\s+\.documentCard\b/,
      /\.spdf-attachments\s+\.fileLabel\b/,
    ],
  },
  {
    file: path.join(__dirname, '..', 'src', 'formEngine', 'fields', 'AttachmentField.css'),
    selectors: [
      /\.spdf-attachments\s+\.ListItemAttachments\b/,
      /\.spdf-attachments\s+\.documentCardWrapper\b/,
      /\.spdf-attachments\s+\.documentCard\b/,
      /\.spdf-attachments\s+\.fileLabel\b/,
    ],
  },
];

const failures = [];

for (const check of checks) {
  const css = fs.readFileSync(check.file, 'utf8');
  for (const selector of check.selectors) {
    if (!selector.test(css)) {
      failures.push(`${path.relative(process.cwd(), check.file)} missing selector: ${selector}`);
    }
  }
}

if (failures.length > 0) {
  console.error('PnP compat selector check failed:');
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('PnP compat selector check passed.');
