# Code Editor

A modern web-based code editor built with Node.js, Express, and CodeMirror 6.

## Features

- **CodeMirror 6 Integration**: Modern code editor with JavaScript syntax highlighting
- **Full-Screen Editor**: Editor fills the entire browser window
- **Save Functionality**: Save your code to the server with custom filenames
- **Dark Theme**: Beautiful dark theme with syntax highlighting
- **Keyboard Shortcuts**: Ctrl+S to save
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. **Install Dependencies**:
   ```bash
   cd code-editor
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:3000`

## Usage

- **Edit Code**: Start typing in the editor area
- **Save Code**: Click the "Save Code" button or press Ctrl+S
- **Custom Filename**: Enter a filename in the input field before saving
- **Syntax Highlighting**: JavaScript syntax is automatically highlighted

## Project Structure

```
code-editor/
├── server.js          # Express server
├── package.json       # Dependencies and scripts
├── public/            # Static files
│   ├── index.html     # Main HTML page
│   └── style.css      # Styling
├── saved/             # Saved code files (created automatically)
└── README.md          # This file
```

## API Endpoints

- `GET /` - Serves the main editor page
- `POST /save` - Saves code content to a file
  - Body: `{ "content": "code content", "filename": "optional-filename.js" }`
  - Response: `{ "success": true, "message": "File saved", "filename": "actual-filename.js" }`

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules)
- **Editor**: CodeMirror 6
- **Theme**: One Dark theme

## Development

To extend this editor:

1. **Add Language Support**: Import additional language packages from CodeMirror
2. **Add Themes**: Import different themes from CodeMirror
3. **Add Features**: Extend the editor with plugins like autocomplete, linting, etc.
4. **File Management**: Add file loading, directory browsing, etc.

## License

MIT License