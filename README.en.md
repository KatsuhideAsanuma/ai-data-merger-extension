# AI Data Merger Extension

A VSCode extension that merges multiple files to generate reference data for AI. Efficiently create input data files for large language models (LLMs).

![Extension Icon](resources/icon.png)

## Overview

In AI development and prompt engineering, you often need to collect context information from multiple files to provide to AI. This extension supports efficient information provision by selecting multiple files and combining them into a single formatted Markdown file. The prompt management functionality is also integrated with merge functionality, allowing created prompts to be reflected in merged files.

### Key Features

- **Intuitive File Selection**: Add files from the Explorer right-click menu
- **Category Management**: Classify files into categories such as "Prompt Output", "Design Document Output", "Reference Code Output", etc.
- **Flexible Order Management**: Change file order and categories in the sidebar
- **Table of Contents Generation**: Automatically generates hierarchical table of contents in merged files
- **Advanced Prompt Management**: Template-based prompt creation with variable substitution
- **Real-time Editing**: Real-time editing and auto-save function for prompts and templates
- **Customizable**: Customize output paths, filenames, categories, etc.
- **Merge History**: Save and replay past merge operations
- **Project-specific Merge Lists**: Save and reuse frequently used merge lists by project
- **Prompt Templates**: Create and manage reusable prompt templates
- **Variable Substitution**: Easily replace variables in templates to generate custom prompts
- **Prompt Merging**: Reflect prompts in merged files as well

## Installation

### Method 1: Install from VSCode Marketplace

1. Open the Extensions tab in VSCode
2. Type "AI Data Merger" in the search box
3. Select "AI Data Merger Extension" and install

### Method 2: Install from VSIX file

1. Clone the repository: `git clone https://github.com/katsuhideAsanuma/ai-data-merger-extension.git`
2. Install dependencies: `npm install`
3. Package the extension: `npm run package`
4. Install the generated VSIX file:
   - In VSCode, press `Ctrl+Shift+P` → Select "Install from VSIX"
   - Or via command line: `code --install-extension ai-data-merger-extension-0.1.0.vsix`

## Usage

### Basic Usage

1. **Sidebar Icon**: Click the "AI Data Merger" icon in the activity bar on the left side of VSCode
2. **Adding Files**: Right-click on files in Explorer and select "Add to File Merge Queue"
   - Files will be added to the category specified in the category selection dialog
3. **Generating Merged Files**: Click the "Generate Merged File" button in the sidebar
   - A dialog will appear asking you to specify a filename
   - Enter the default filename or a custom filename
4. **Check Results**: The generated merged file will open automatically

### Prompt Management Features

Equipped with a next-generation prompt management system that provides intuitive editing and auto-save functionality.

#### Creating and Editing Templates

1. **Creating Templates**: Click the "Create Prompt Template" button in the "Prompts" tab in the sidebar
   - Specify template name and category
   - Write variables in the format `[[variable name]]` (e.g., `Hello, [[name]]`)
   - **Auto-save Changes**: Edited content is automatically saved and variables are extracted

2. **Editing Templates**: Click the edit icon on the template item
   - Edit directly as a Markdown file
   - Variables are automatically extracted and updated when saved

#### Managing Simple Text Prompts

1. **Creating Prompts**: Click the "Create Simple Text Prompt" button
   - Specify prompt name and category
   - Edit prompt content in the editor
   - **Real-time Saving**: Changes are automatically saved

2. **Generating from Templates**: Click "Generate from Template" on the template item
   - A variable input form appears where you can set values for each variable
   - After entering variable values, save as a new prompt

#### Import/Export

1. **Export**: Click the "Export Prompts" button
   - Export in JSON, Markdown, or text format
   - Choose from all prompts, templates only, or simple text only

2. **Import**: Click the "Import Prompts" button
   - Choose from file, clipboard, or editor
   - Select how to handle duplicate prompts (overwrite, rename, skip)

### File Management Features

- **Changing File Order**: Change order using the up/down arrow buttons on file items in the sidebar
- **Changing Categories**: Click the folder icon on file items to change the category
- **Deleting Files**: Click the trash icon on file items to delete
- **Clearing the Queue**: Clear the queue using the "Clear Merge Queue" button at the top of the sidebar

### History and Reuse

- **Merge History**: Check past merge operations in the "Merge History" tab in the sidebar
- **Replaying Merges**: Click on history items to replay past merge settings
- **Saving Merge Lists**: Save frequently used merge settings with "Add to Project Merge Lists"
- **Loading Saved Lists**: Load merge lists in the project using the "Load Project Merge List" button

## Configuration Options

You can customize the following items in VSCode settings (`settings.json`):

```json
{
  "aiDataMerger.outputPath": "./merged",      // Output folder for merged files
  "aiDataMerger.defaultFileName": "merged_data.md",  // Default filename
  "aiDataMerger.allowedFileTypes": [          // File formats that can be merged
    "markdown", "plaintext", "javascript", "typescript", "json", "yaml",
    "python", "java", "cpp", "csharp", "go", "rust", "ruby", "php",
    "html", "css", "xml", "shellscript", "bat", "sql"
    // Many other file formats supported
  ],
  "aiDataMerger.showDataFileContent": false,  // Show all code in JSON/YAML files (if false, shows structure only)
  "aiDataMerger.categories": [                // Categories in merged files
    "Prompt Output",
    "Design Document Output", 
    "Reference Code Output"
    // Custom categories can be added
  ],
  "aiDataMerger.promptsStoragePath": "./prompts", // Directory for storing prompts
  "aiDataMerger.promptCategories": [          // Default list of prompt categories
    "Code Generation", "Explanation Request", "Summary", "Debug", "General"
  ],
  "aiDataMerger.maxTokenWarningThreshold": 4000, // Token count warning threshold
}
```

### Customizing Categories

Categories can be easily customized from VSCode settings:

1. **Change from Settings Screen**: 
   - Open VSCode settings (`Ctrl+,`)
   - Search for "AI Data Merger"
   - Edit the `aiDataMerger.categories` array

2. **Edit Directly in settings.json**:
   - Add or edit the following in `settings.json`
   ```json
   "aiDataMerger.categories": [
     "Prompt Output",
     "Design Document Output",
     "Reference Code Output",
     "Custom Category 1",  // Add your own categories
     "Custom Category 2"
   ]
   ```

### Customizing Prompt Categories

Prompt categories can be changed similarly from settings:

```json
"aiDataMerger.promptCategories": [
  "Code Generation",
  "Explanation Request",
  "Summary",
  "Debug",
  "General",
  "API Calls",  // Add new categories
  "Data Analysis"
]
```

### Data File Display Settings

You can configure how data files like JSON and YAML are displayed:

- `aiDataMerger.showDataFileContent`: If `false` (default), data files show structure only, not the entire code. If set to `true`, data files are fully displayed.

## Output File Format

The generated merged file is structured in the following format:

1. **Metadata Section**: Information such as title, timestamp, number of files, etc.
2. **Table of Contents**: Hierarchical table of contents with links to all categories and files
3. **Content**: File contents grouped by category
   - Markdown files: Display content inline, adjusting heading levels
   - Code files: Display in code blocks with syntax highlighting according to language
   - Directories: Display file list in code blocks

## Project Structure

```
ai-data-merger-extension/
├── src/                    # Source code
│   ├── extension.ts        # Extension entry point
│   ├── components/         # Main components
│   │   ├── ConfigManager.ts    # Configuration management
│   │   ├── HistoryManager.ts   # History management
│   │   ├── MergeManager.ts     # Merge processing
│   │   ├── PromptManager.ts    # Prompt management
│   │   └── QueueManager.ts     # File queue management
│   ├── treeViews/          # Tree view implementation
│   │   ├── HistoryTreeViewProvider.ts
│   │   ├── PromptTreeViewProvider.ts
│   │   └── SelectionTreeViewProvider.ts
│   ├── commands/           # Command implementation
│   └── utils/              # Utility functions
├── resources/              # Resources such as icons
├── config/                 # Configuration files
├── prompts/                # Prompt storage directory
│   ├── templates/          # Template storage
│   └── simpleTexts/        # Simple text storage
└── merged/                 # Default output directory
```

## Debugging

1. Clone the repository: `git clone https://github.com/katsuhideAsanuma/ai-data-merger-extension.git`
2. Install dependencies: `npm install`
3. Open in VSCode: `code ai-data-merger-extension`
4. Press F5 to start a debug session (a new VSCode window will open)
5. Test the extension in the opened window

## License

Published under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- This extension is developed using the VSCode Extension API
- Icons and UI elements use VSCode's standard icon set

## Feedback and Contributions

This extension was created with the noble Data Science Lady's outstanding intelligence and aesthetics. From the extension's algorithm design to optimization, it was completed under the Lady's elegant handling. It is a masterpiece where the Lady's elegant statistical sense and artistic coding sense are beautifully fused.

Please submit issue reports and feature suggestions to the [GitHub repository](https://github.com/katsuhideAsanuma/ai-data-merger-extension/issues). Pull requests are also welcome. 