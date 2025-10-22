# Frontend Tips - URL Redirector

A powerful browser extension that redirects HTTP requests based on URL patterns, organized in groups for easy management. This extension uses minimal permissions to ensure wide compatibility and avoid blocking by IT departments.

## Features

- **Group-Based Organization**: Organize redirect rules into named groups for better management
- **Simple String Matching**: Just enter text that should be contained in the URL (no regex required)
- **Visual Status Indicators**: Green background for active rules, gray for disabled
- **Collapsible Groups**: Expand/collapse groups to focus on specific rule sets
- **Group-Level Control**: Enable/disable entire groups of rules at once
- **Form Persistence**: Automatically saves form data when switching between applications
- **Minimal Permissions**: Uses only `declarativeNetRequest` and `storage` permissions
- **Real-time Updates**: Rules are applied immediately without browser restart

## Installation

### For Development/Testing

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### For Production

1. Package the extension as a ZIP file
2. Upload to Chrome Web Store or distribute as needed

## Usage

### Creating Groups

1. **Enter group name** in the "Group Name" field
2. **Click "Create Group"** to create a new group
3. **Groups can be enabled/disabled** to control all their rules at once

### Adding Rules

1. **Select a group** from the dropdown
2. **Enter URL pattern** in the "URL Contains" field
   - Example: `MyLibrary.js`
3. **Enter redirect URL** in the "Redirect To" field
   - Example: `https://new-cdn.com/MyLibrary.js`
4. **Enable/disable** the individual rule
5. **Click "Save Rule"**

### Managing Rules

- **Edit rules**: Click "Edit" on any rule to modify it
- **Delete rules**: Click "Delete" to remove a rule
- **Toggle rules**: Enable/disable individual rules
- **Group control**: Disable entire groups to disable all their rules
- **Collapsible groups**: Click group headers to expand/collapse

## Examples

### Development Environment Setup

**Group: "Dev API"**

- **URL Contains**: `api.production.com`
- **Redirect**: `https://localhost:3000/api`
- **Result**: All production API calls redirect to local development server

### CDN Migration

**Group: "CDN Redirects"**

- **URL Contains**: `old-cdn.example.com`
- **Redirect**: `https://new-cdn.example.com`
- **Result**: All old CDN requests redirect to new CDN

### Testing Scenarios

**Group: "Test Redirects"**

- **URL Contains**: `MyLibrary.js`
- **Redirect**: `https://test-server.com/MyLibrary.js`
- **Result**: Test specific library files from different server

## Visual Interface

### Status Indicators

- **Green background**: Rule is active and will redirect requests
- **Gray background**: Rule is disabled and will be ignored
- **Group headers**: Green when enabled, gray when disabled

### Compact Design

- **Horizontal layout**: Labels on the left, fields on the right
- **Collapsible groups**: Save space by collapsing unused groups
- **Form persistence**: Values are saved when switching to external applications

## Permissions

This extension requests minimal permissions:

- `declarativeNetRequest`: Required to intercept and redirect network requests
- `storage`: Required to save user-configured redirect rules
- `<all_urls>`: Required to apply redirects to any website

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Request Interception**: Uses Chrome's Declarative Net Request API
- **Storage**: Uses Chrome's local storage API with automatic form persistence
- **Background Processing**: Uses service worker for rule management
- **Group Hierarchy**: Group-level control overrides individual rule states

## Troubleshooting

### Rules Not Working

1. **Check group status**: Ensure the group containing the rule is enabled
2. **Check rule status**: Ensure the individual rule is enabled
3. **Verify URL pattern**: Make sure the text matches exactly (case-sensitive)
4. **Test redirect URL**: Ensure the redirect URL is accessible
5. **Refresh page**: Try refreshing the page after adding rules

### Extension Not Loading

1. **Check files**: Ensure all files are present in the extension folder
2. **Validate manifest**: Check that manifest.json is valid
3. **Console errors**: Check the browser console for errors
4. **Permissions**: Ensure extension has necessary permissions

### Form Data Loss

- **Auto-save**: Form data is automatically saved as you type
- **Persistence**: Values are restored when reopening the popup
- **Manual clear**: Use "Clear Form" button to reset fields

## Development

### File Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality with group management
├── popup.css         # Compact styling with collapsible groups
├── background.js     # Background service worker
├── logo.png          # Extension logo
├── test.html         # Test page for development
└── README.md         # This file
```

### Key Features Implemented

- **Group Management**: Create, edit, delete, and toggle groups
- **Rule Management**: Add, edit, delete, and toggle rules within groups
- **Visual Feedback**: Color-coded status indicators
- **Form Persistence**: Automatic saving and restoration of form data
- **Collapsible Interface**: Space-efficient group display
- **Copy-Paste Friendly**: Form values persist when switching applications

### Testing

1. **Load extension** in developer mode
2. **Create test groups** with different purposes
3. **Add test rules** with various URL patterns
4. **Test redirects** using the included test.html page
5. **Verify group control** by enabling/disabling groups
6. **Check form persistence** by switching between applications

## Security

This extension:

- Uses only necessary permissions
- Does not collect or transmit user data
- Processes redirects locally in the browser
- Stores rules locally using Chrome's storage API
- No external network requests for rule processing

## License

This project is open source and available under the MIT License.
