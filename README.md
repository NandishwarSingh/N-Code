# N-Code Editor

N-Code is a modern, feature-rich, client-side code editor that runs entirely in your browser. It provides a clean, intuitive, and powerful environment for editing code, with support for multiple languages, syntax highlighting, and direct file system integration. This editor is designed for developers who need a quick and efficient way to work with local files without the need for a heavy IDE.

## Features

- **Code Seeker (Search & Replace)**: Easily find and replace text within your code with a dedicated search interface.
- **Advanced Autocompletion**: Enjoy intelligent code suggestions that appear automatically as you type, supporting multiple languages. Confirm suggestions with `Tab` for a smooth workflow.
- **Sublime Text Keymap**: Utilize familiar keyboard shortcuts from Sublime Text for enhanced productivity.
- **Undo/Redo Functionality**: Easily revert or reapply changes within the code editor.
- **Enhanced Button Aesthetics**: Improved visual styling for key toolbar buttons, including "Undo", "Redo", "Open Folder", and "Search".
- **Client-Side Operation**: No backend required. The editor works completely within your browser. All your files and settings are handled locally.
- **Direct File System Access**: Leveraging the File System Access API, N-Code allows you to open, edit, and save files and folders directly on your local machine. This provides a seamless workflow similar to a desktop application (requires a supported browser like Chrome or Edge).
- **Multi-Language Support**: Syntax highlighting for various languages including JavaScript, Python, HTML, CSS, XML, and Markdown.
- **Real-time Markdown Preview**: When editing Markdown files, you can toggle a live preview panel to see the rendered output as you type.
- **Tabbed Interface**: Open and manage multiple files in tabs. Each tab shows the filename and indicates if there are unsaved changes.
- **File Explorer**: A sidebar provides a tree view of your opened folder, allowing you to browse, open, create, rename, and delete files and folders.
- **Dark Theme**: A comfortable dark theme for coding.
- **Responsive Design**: Usable on both desktop and mobile devices.

## Getting Started

To get started with N-Code, follow these simple steps:

1. **Download the code**:
   - Clone the repository: `git clone https://github.com/NandishwarSingh/N-Code.git`
   - Or download the ZIP file and extract it.

2. **Open the Editor**:
   - Navigate to the project directory.
   - Open the `index.html` file in a modern web browser (Chrome or Edge is recommended for full functionality).

That's it! You are now ready to use the N-Code editor.

## User Guide

This guide explains the various components of the N-Code editor.

### The Toolbar

The toolbar at the top of the editor provides access to the main functionalities:

- **Save File**: Saves the content of the active tab to your local file system. If the file is new, it will prompt you to choose a location.
- **Undo**: Reverts the last change in the code editor.
- **Redo**: Reapplies the last undone change in the code editor.
- **Filename Input**: Displays the name of the current file. You can also rename the file by changing the name here and saving.
- **Language Selection**: A dropdown menu to manually select the language for syntax highlighting.
- **Toggle Preview**: When editing a Markdown file, this button appears to show or hide the live preview panel.
- **Open Files**: Allows you to open one or more files from your local machine.
- **Open Folder**: Opens a directory from your local file system and displays it in the file explorer.
- **Search**: Activates the CodeMirror search and replace interface, allowing you to find and replace text within the current file.
- **Toggle Sidebar**: Shows or hides the file explorer sidebar.

### The Sidebar (File Explorer)

The sidebar on the left gives you a view of your project's file structure:

- **File Tree**: Displays the files and folders of the directory you have opened.
- **Actions**: You can perform actions by right-clicking on a file or folder:
  - **New File**: Creates a new file in the selected directory.
  - **New Folder**: Creates a new folder in the selected directory.
  - **Rename**: Renames the selected file or folder.
  - **Delete**: Deletes the selected file or folder (with a confirmation prompt).

### The Editor

The central part of the interface is the code editor, powered by CodeMirror. It offers:

- **Syntax Highlighting**: Code is colored based on the selected language to improve readability.
- **Line Numbers**: Gutter with line numbers for easy navigation.
- **Code Folding**: Collapse blocks of code to focus on specific sections.
- **Auto-closing Brackets**: Automatically closes brackets and quotes.
- **Intelligent Autocompletion**: As you type, the editor provides context-aware suggestions.
  - **Triggering**: Suggestions appear automatically as you type.
  - **Confirming**: Press `Tab` to accept the highlighted suggestion.
  - **New Line**: Press `Enter` to insert a new line without confirming the suggestion.

### The Tab Bar

Above the editor, the tab bar displays all the files you have open:

- **Switching Tabs**: Click on a tab to switch to that file.
- **Closing Tabs**: Click the `x` button on a tab to close it.
- **Unsaved Changes**: A dot `●` will appear next to the filename if the file has unsaved changes.

### Keyboard Shortcuts

N-Code leverages the Sublime Text keymap for a familiar and efficient editing experience.

- **General Shortcuts**:
  - `Ctrl+S`: Save the current file.
  - `Ctrl+O`: Open the file picker to select files.
  - `Tab`: Accept autocompletion suggestion (when popup is active).
  - `Enter`: Insert new line (even when autocompletion popup is active).

- **Sublime Text Keymap Specifics**:
  - `Ctrl+D`: Select next occurrence of the current selection.
  - `Ctrl+L`: Select current line.
  - `Ctrl+Shift+L`: Split selection into lines.
  - `Ctrl+Shift+K`: Delete current line.
  - `Ctrl+Shift+D`: Duplicate current line.
  - `Ctrl+Z`: Undo (also available via button).
  - `Ctrl+Y` or `Ctrl+Shift+Z`: Redo (also available via button).
  - `Ctrl+F`: Open search dialog.
  - `Ctrl+H`: Open replace dialog.
  - `Ctrl+G`: Go to line.
  - `Ctrl+/`: Toggle comment for selected lines.
  - `Ctrl+[` / `Ctrl+]`: Indent / Outdent selected lines.

## For Developers

### Project Structure

```
/home/nandishwar/Desktop/code-editor/
├───index.html         # The main HTML file for the editor
├───README.md          # This file
├───public/
│   ├───client-fs.js   # The core JavaScript for the editor's functionality
│   └───style.css      # The stylesheet for the editor
└───saved/             # A directory for saved files (if using a server, not used in client-side version)
```

### Code Overview

- **`index.html`**: This file sets up the structure of the editor, including the toolbar, sidebar, and editor area. It also includes the necessary scripts and stylesheets for CodeMirror and its addons.
- **`public/client-fs.js`**: This is the heart of the editor. It contains the JavaScript code that handles:
  - File system operations using the File System Access API.
  - CodeMirror editor setup and configuration, including enabling various addons (search, hint, keymaps).
  - UI interactions, such as button clicks, tab management, and sidebar actions.
  - Language detection and dynamic hint options.
  - Markdown preview functionality.
- **`public/style.css`**: This file contains all the CSS rules for styling the editor, including the dark theme, layout, and responsive design.

### How to Contribute

Contributions are welcome! If you want to improve N-Code, you can:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes to your fork.
5. Create a pull request to the main repository.

## Browser Compatibility

The File System Access API is a relatively new technology and is not yet supported by all browsers. For the best experience, please use a browser that supports this API.

- **Full Support**: Chrome, Edge, Opera
- **Partial Support**: Firefox (requires enabling a flag)
- **No Support**: Safari

In browsers that do not support the File System Access API, the editor will fall back to a legacy mode where you can open and download files, but you cannot directly save to the file system or open folders.

## License

This project is licensed under the MIT License.