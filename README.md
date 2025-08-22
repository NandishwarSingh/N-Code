# N-Code Editor - AI-Enhanced Web IDE

N-Code is a modern, feature-rich, client-side code editor that runs entirely in your browser with powerful **AI assistance powered by Google Gemini**. It provides a clean, intuitive, and intelligent environment for editing code, with support for multiple languages, syntax highlighting, direct file system integration, and comprehensive AI-powered code analysis and optimization.

## 🤖 AI Features (Powered by Google Gemini)

N-Code integrates Google's Gemini AI to provide intelligent coding assistance:

- **🧠 Code Explanation**: Get plain-English explanations of complex code, including algorithm analysis and complexity insights
- **⚡ Code Optimization**: Receive performance improvements, memory efficiency suggestions, and best practice recommendations
- **📝 Smart Documentation**: Auto-generate comprehensive JSDoc comments, function descriptions, and usage examples
- **🧪 Test Generation**: Create comprehensive unit tests with edge cases and error conditions
- **🔄 Code Refactoring**: Improve code structure, readability, and maintainability following SOLID principles
- **🐛 Bug Detection**: Identify logic errors, memory leaks, security vulnerabilities, and performance bottlenecks
- **🔄 Language Translation**: Convert code between different programming languages while maintaining functionality
- **💡 Real-time AI Assistant**: Interactive AI panel with context-aware suggestions and help

### AI Integration Setup
1. Get your free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enter the API key in the AI panel sidebar
3. Select code and use AI features via toolbar buttons or keyboard shortcuts
4. AI responses appear in both the sidebar panel and modal dialogs for easy reference

## Core Features

- **Client-Side Operation**: No backend required. The editor works completely within your browser with all processing happening locally.
- **Direct File System Access**: Leveraging the File System Access API, N-Code allows you to open, edit, and save files and folders directly on your local machine.
- **Code Seeker (Search & Replace)**: Easily find and replace text within your code with a dedicated search interface.
- **Advanced Autocompletion**: Intelligent code suggestions that appear automatically as you type, supporting multiple languages.
- **Sublime Text Keymap**: Familiar keyboard shortcuts from Sublime Text for enhanced productivity.
- **Multi-Language Support**: Syntax highlighting for JavaScript, Python, HTML, CSS, XML, Markdown, and JSON.
- **Real-time Markdown Preview**: Toggle live preview panel for Markdown files to see rendered output.
- **Tabbed Interface**: Open and manage multiple files with visual indicators for unsaved changes.
- **File Explorer**: Tree view sidebar for browsing, creating, renaming, and deleting files and folders.
- **Dark Theme**: Comfortable dark theme optimized for coding.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Getting Started

### Quick Setup
1. **Download the code**:
   ```bash
   git clone https://github.com/NandishwarSingh/N-Code.git
   cd N-Code
   ```

2. **Open the Editor**:
   - Open `index.html` in a modern web browser (Chrome or Edge recommended for full functionality)

3. **Enable AI Features** (Optional but Recommended):
   - Get your free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click the AI tab in the sidebar and enter your API key
   - Start using AI-powered code assistance!

## User Guide

### The AI-Enhanced Toolbar

- **Save File**: Saves content to your local file system
- **Undo/Redo**: Revert or reapply changes
- **🤖 Explain**: AI explains selected code in plain English
- **⚡ Optimize**: AI suggests performance improvements
- **Filename Input**: Rename files with auto-language detection
- **Language Selection**: Manual syntax highlighting selection
- **Open Files/Folder**: Local file system integration
- **Search**: CodeMirror search and replace
- **Toggle Sidebar**: Show/hide file explorer and AI panel

### AI Assistant Sidebar

The AI panel provides:
- **API Key Management**: Secure local storage of your Gemini API key
- **Quick Actions**: One-click buttons for common AI tasks
- **Response Display**: Formatted AI responses with syntax highlighting
- **Apply Changes**: Direct integration to apply AI suggestions to your code

Available AI actions:
- 🧠 **Explain Code**: Understand complex algorithms and logic
- ⚡ **Optimize Code**: Performance and efficiency improvements
- 📝 **Add Documentation**: Generate comprehensive comments
- 🧪 **Generate Tests**: Create unit tests with edge cases
- 🔄 **Refactor Code**: Improve structure and maintainability
- 🐛 **Find & Fix Bugs**: Identify and resolve issues
- 🔄 **Convert Language**: Translate between programming languages

### File Explorer & Management

- **File Tree**: Visual representation of your project structure
- **Context Menu**: Right-click for file operations
- **Auto-Save**: Intelligent saving with change tracking
- **Multi-Tab Support**: Work with multiple files simultaneously

### Enhanced Code Editor

Powered by CodeMirror with:
- **Syntax Highlighting**: Multi-language support with theme customization
- **Intelligent Autocompletion**: Context-aware suggestions with Tab completion
- **Code Folding**: Collapse code blocks for better navigation
- **Auto-closing Brackets**: Automatic bracket and quote completion
- **Line Numbers & Gutter**: Easy navigation and debugging

## Keyboard Shortcuts

### AI Shortcuts
- `Ctrl+Shift+E`: AI Explain selected code
- `Ctrl+Shift+O`: AI Optimize selected code

### General Shortcuts
- `Ctrl+S`: Save current file
- `Ctrl+O`: Open files
- `Ctrl+Shift+N`: New file
- `Ctrl+W`: Close current tab
- `Tab`: Accept autocompletion suggestion

### Sublime Text Keymap
- `Ctrl+D`: Select next occurrence
- `Ctrl+L`: Select current line
- `Ctrl+Shift+K`: Delete current line
- `Ctrl+Shift+D`: Duplicate current line
- `Ctrl+F`: Find
- `Ctrl+H`: Replace
- `Ctrl+G`: Go to line
- `Ctrl+/`: Toggle comment

## For Developers

### Architecture

```
N-Code Editor/
├── index.html              # Main application file
├── README.md              # Documentation
├── embedded CSS & JS      # Fully self-contained
└── AI Integration/
    ├── Google Gemini API  # AI processing
    ├── Local key storage  # Secure API key management
    └── Response handling  # AI output processing
```

### Key Components

1. **AI Assistant Class**: Handles all Gemini API interactions
2. **File System Manager**: Manages local file operations via File System Access API
3. **Tab Manager**: Multi-file editing with state persistence
4. **CodeMirror Integration**: Advanced editor functionality with extensions
5. **UI Components**: Modern, responsive interface components

### AI Implementation Details

- **API Integration**: Direct REST API calls to Google's Gemini endpoint
- **Security**: API keys stored locally, never transmitted except to Google's servers
- **Error Handling**: Comprehensive error management with user feedback
- **Rate Limiting**: Built-in protection against API abuse
- **Content Processing**: Intelligent parsing of AI responses with code extraction

### Browser Compatibility

**Full Support (Recommended)**:
- Chrome 86+
- Edge 86+
- Opera 72+

**Partial Support**:
- Firefox 111+ (requires `dom.fs.enabled` flag)

**Fallback Mode**:
- Safari and other browsers (file download/upload instead of direct file system access)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Test AI features with various code samples
- Ensure browser compatibility
- Update documentation for new features
- Consider accessibility in UI changes

## Security & Privacy

- **Local-First**: All code processing happens in your browser
- **API Keys**: Stored locally using localStorage, never shared
- **No Data Collection**: Your code never leaves your machine except for AI processing
- **Secure Communication**: All AI requests use HTTPS encryption

## License

MIT License - feel free to use, modify, and distribute as needed.

---

**Experience the future of coding with AI-powered assistance built right into your browser!** 🚀