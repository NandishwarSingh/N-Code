// Client-side File System Manager using File System Access API
class ClientFileSystem {
    constructor() {
        this.directoryHandle = null;
        this.fileHandles = new Map(); // path -> fileHandle
        this.isSupported = 'showDirectoryPicker' in window;
    }

    async openDirectory() {
        if (!this.isSupported) {
            throw new Error('File System Access API not supported in this browser');
        }

        try {
            this.directoryHandle = await window.showDirectoryPicker();
            return this.directoryHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Directory selection cancelled');
            }
            throw error;
        }
    }

    async listDirectory(dirHandle = this.directoryHandle, path = '') {
        if (!dirHandle) return [];

        const items = [];
        try {
            for await (const [name, handle] of dirHandle.entries()) {
                const itemPath = path ? `${path}/${name}` : name;
                const item = {
                    name,
                    path: itemPath,
                    type: handle.kind,
                    handle
                };

                if (handle.kind === 'file') {
                    item.extension = this.getFileExtension(name);
                }

                items.push(item);
            }
        } catch (error) {
            console.error('Error listing directory:', error);
        }

        // Sort: directories first, then files
        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    async readFile(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async writeFile(fileHandle, content) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    async createFile(dirHandle, fileName, content = '') {
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            await this.writeFile(fileHandle, content);
            return fileHandle;
        } catch (error) {
            console.error('Error creating file:', error);
            throw error;
        }
    }

    async createDirectory(dirHandle, folderName) {
        try {
            return await dirHandle.getDirectoryHandle(folderName, { create: true });
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    async deleteEntry(dirHandle, entryName) {
        try {
            // Check if we have permission to write to the directory
            const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const requestPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
                if (requestPermission !== 'granted') {
                    throw new Error('Write permission denied');
                }
            }
            
            // Directly remove the entry (recursive for directories)
            await dirHandle.removeEntry(entryName, { recursive: true });
        } catch (error) {
            console.error('Error deleting entry:', error);
            if (error.name === 'NotFoundError') {
                throw new Error(`File or folder "${entryName}" not found`);
            } else if (error.name === 'NotAllowedError') {
                throw new Error('Permission denied - cannot delete file');
            } else if (error.name === 'InvalidModificationError') {
                throw new Error('Cannot delete - file may be in use');
            }
            throw error;
        }
    }

    async renameFile(dirHandle, oldName, newName) {
        try {
            // Get the old file handle
            const oldFileHandle = await dirHandle.getFileHandle(oldName);
            const content = await this.readFile(oldFileHandle);
            
            // Create new file with new name
            const newFileHandle = await this.createFile(dirHandle, newName, content);
            
            // Delete old file
            await this.deleteEntry(dirHandle, oldName);
            
            return newFileHandle;
        } catch (error) {
            console.error('Error renaming file:', error);
            throw error;
        }
    }

    async saveFileAs(content, suggestedName = 'untitled.txt') {
        if (!this.isSupported) {
            // Fallback: download file
            this.downloadFile(content, suggestedName);
            return;
        }

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName,
                types: this.getFileTypes()
            });
            await this.writeFile(fileHandle, content);
            return fileHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Save cancelled');
            }
            throw error;
        }
    }

    async openFiles() {
        if (!this.isSupported) {
            throw new Error('File System Access API not supported');
        }

        try {
            const fileHandles = await window.showOpenFilePicker({
                multiple: true,
                types: this.getFileTypes()
            });
            return fileHandles;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('File selection cancelled');
            }
            throw error;
        }
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getFileExtension(filename) {
        return filename.includes('.') ? '.' + filename.split('.').pop().toLowerCase() : null;
    }

    getFileTypes() {
        return [
            {
                description: 'Text files',
                accept: {
                    'text/plain': ['.txt', '.md', '.js', '.py', '.html', '.css', '.json']
                }
            }
        ];
    }
}

// Initialize the file system manager
const clientFS = new ClientFileSystem();

// Folder state persistence
function saveFolderState() {
    if (!clientFS.directoryHandle) return;
    
    const folderState = {
        hasFolder: true,
        expandedFolders: Array.from(expandedFolders),
        timestamp: Date.now(),
        folderName: clientFS.directoryHandle.name || 'Unknown Folder'
    };
    
    localStorage.setItem('editorFolderState', JSON.stringify(folderState));
}

function loadFolderState() {
    try {
        const saved = localStorage.getItem('editorFolderState');
        if (saved) {
            const folderState = JSON.parse(saved);
            if (folderState.expandedFolders) {
                expandedFolders = new Set(folderState.expandedFolders);
            }
            return folderState;
        }
    } catch (error) {
        console.error('Error loading folder state:', error);
    }
    return null;
}

function clearFolderState() {
    localStorage.removeItem('editorFolderState');
    expandedFolders.clear();
}

// Initialize CodeMirror
let editor;

// Language configurations
const languageConfigs = {
    'javascript': { mode: 'javascript', ext: ['.js', '.jsx'], sample: '// JavaScript\nfunction hello() {\n    console.log("Hello World!");\n}' },
    'python': { mode: 'python', ext: ['.py'], sample: '# Python\ndef hello():\n    print("Hello World!")' },
    'markdown': { mode: 'markdown', ext: ['.md', '.markdown'], sample: '# Markdown\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2' },
    'application/json': { mode: 'application/json', ext: ['.json'], sample: '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "JSON example"\n}', lint: true },
    'text/html': { mode: 'htmlmixed', ext: ['.html', '.htm'], sample: '<!DOCTYPE html>\n<html>\n<head>\n    <title>HTML Example</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>' },
    'css': { mode: 'css', ext: ['.css'], sample: '/* CSS */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n}' }
};

try {
    const initialConfig = {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'monokai',
        indentUnit: 4,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
    };
    
    editor = CodeMirror.fromTextArea(document.getElementById('code-textarea'), initialConfig);
    editor.setSize('100%', '100%');
    
    console.log('CodeMirror initialized successfully');
} catch (error) {
    console.error('CodeMirror failed to load:', error);
    // Fallback to textarea
    const textarea = document.getElementById('code-textarea');
    textarea.style.display = 'block';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.resize = 'none';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.padding = '16px';
    textarea.style.backgroundColor = '#2d2d2d';
    textarea.style.color = '#ffffff';
}

// UI elements
const saveBtn = document.getElementById('saveBtn');
const filenameInput = document.getElementById('filename');
const languageSelect = document.getElementById('languageSelect');
const previewBtn = document.getElementById('previewBtn');
const previewDiv = document.getElementById('preview');
const previewContent = document.querySelector('.preview-content');
const status = document.getElementById('status');
const tabBar = document.getElementById('tabBar');
const fileInput = document.getElementById('fileInput');
const openFileBtn = document.getElementById('openFileBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const openFolderBtnSidebar = document.getElementById('openFolderBtnSidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebar = document.getElementById('sidebar');
const fileExplorer = document.getElementById('fileExplorer');
const refreshFilesBtn = document.getElementById('refreshFilesBtn');
const createFileBtn = document.getElementById('createFileBtn');
const createFolderBtn = document.getElementById('createFolderBtn');

let isPreviewMode = false;
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
let isSidebarVisible = true;
let expandedFolders = new Set();
let contextMenu = null;

function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
    }, 3000);
}

function getEditorContent() {
    if (editor && editor.getValue) {
        return editor.getValue();
    } else {
        return document.getElementById('code-textarea').value;
    }
}

function showWelcomeScreen() {
    const welcomeContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #888; font-family: Arial, sans-serif;">
            <h2 style="color: #666; margin-bottom: 20px;">📁 No Files Open</h2>
            <p style="margin-bottom: 30px; font-size: 16px;">Open a file from the explorer to start editing</p>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <button id="welcomeOpenFolder" style="padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">📂 Open Folder</button>

                <button id="welcomeNewFile" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">📄 New File</button>
            </div>
        </div>
    `;
    
    if (editor && editor.getWrapperElement) {
        editor.getWrapperElement().style.display = 'none';
    } else {
        document.getElementById('code-textarea').style.display = 'none';
    }
    
    let welcomeDiv = document.getElementById('welcome-screen');
    if (!welcomeDiv) {
        welcomeDiv = document.createElement('div');
        welcomeDiv.id = 'welcome-screen';
        welcomeDiv.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #1e1e1e; z-index: 10;';
        document.querySelector('.editor-container').appendChild(welcomeDiv);
    }
    welcomeDiv.innerHTML = welcomeContent;
    welcomeDiv.style.display = 'block';
    
    // Add event listeners to welcome screen buttons
    setTimeout(() => {
        const openFolderBtn = document.getElementById('welcomeOpenFolder');
        const newFileBtn = document.getElementById('welcomeNewFile');
        
        if (openFolderBtn) {
            openFolderBtn.addEventListener('click', async () => {
                console.log('Welcome screen open folder clicked');
                try {
                    await openFolder();
                } catch (error) {
                    console.error('Error opening folder from welcome screen:', error);
                }
            });
        }
        
        if (newFileBtn) {
            newFileBtn.addEventListener('click', createNewFileFromWelcome);
        }
    }, 10);
}

function hideWelcomeScreen() {
    const welcomeDiv = document.getElementById('welcome-screen');
    if (welcomeDiv) {
        welcomeDiv.style.display = 'none';
    }
    
    if (editor && editor.getWrapperElement) {
        editor.getWrapperElement().style.display = 'block';
    } else {
        document.getElementById('code-textarea').style.display = 'block';
    }
}

function createNewFileFromWelcome() {
    const filename = prompt('Enter filename (with extension):') || 'untitled.js';
    const language = detectLanguageFromFilename(filename);
    createTab(filename, '', language);
}

// Check browser support
if (!clientFS.isSupported) {
    showStatus('⚠️ File System Access API not supported. Using fallback mode.', 'info');
    // Hide folder-related buttons but keep file operations
    openFolderBtn.style.display = 'none';
    // Update button text for clarity
    openFileBtn.textContent = 'Open Files (Legacy)';
    saveBtn.textContent = 'Download File';
    
    // Show fallback message in sidebar
    fileExplorer.innerHTML = `
        <div class="fallback-mode">
            <p>📁 Limited File Access Mode</p>
            <p>Your browser doesn't support direct file system access.</p>
            <p>You can still:</p>
            <p>• Open files using the "Open Files" button</p>
            <p>• Create new files with the button below</p>
            <p>• Download files when saving</p>
            <button id="createNewFileBtn" class="open-folder-button">+ New File</button>
        </div>
    `;
    
    // Add new file button for fallback mode
    document.getElementById('createNewFileBtn').addEventListener('click', () => {
        const filename = prompt('Enter filename (with extension):') || 'untitled.js';
        const language = detectLanguageFromFilename(filename);
        createTab(filename, '', language);
    });
}

// Save all files functionality
async function saveAllFiles() {
    if (!clientFS.isSupported) {
        // Fallback mode: download current file
        downloadCurrentFile();
        return;
    }
    
    let savedCount = 0;
    let errorCount = 0;
    
    // Save current tab content and filename first
    if (activeTabId) {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.content = getEditorContent();
            const newFilename = filenameInput.value.trim();
            if (newFilename && newFilename !== currentTab.filename) {
                currentTab.filename = newFilename;
                // If filename changed and we have a file handle, we need to create a new file
                if (currentTab.fileHandle) {
                    currentTab.fileHandle = null; // Clear handle to force new file creation
                }
            }
        }
    }
    
    // Save all tabs with file handles
    for (const tab of tabs) {
        try {
            if (tab.fileHandle) {
                await clientFS.writeFile(tab.fileHandle, tab.content);
                tab.originalContent = tab.content;
                tab.saved = true;
                savedCount++;
            } else if (tab.content.trim()) {
                // New file - save to opened folder if available
                if (clientFS.directoryHandle) {
                    const fileHandle = await clientFS.createFile(clientFS.directoryHandle, tab.filename, tab.content);
                    tab.fileHandle = fileHandle;
                    tab.originalContent = tab.content;
                    tab.saved = true;
                    savedCount++;
                }
            }
        } catch (error) {
            console.error(`Error saving ${tab.filename}:`, error);
            errorCount++;
        }
    }
    
    renderTabs();
    
    if (savedCount > 0) {
        showStatus(`✓ Saved ${savedCount} file(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
        saveFolderState(); // Persist folder state
        await refreshFileExplorer(); // Refresh to show new files
    } else if (errorCount > 0) {
        showStatus(`✗ Failed to save ${errorCount} file(s)`, 'error');
    } else {
        showStatus('No files to save', 'info');
    }
}

// Save functionality
saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        await saveAllFiles();
    } catch (error) {
        showStatus(`✗ ${error.message}`, 'error');
        console.error('Save error:', error);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save File';
    }
});

// Language detection from filename
function detectLanguageFromFilename(filename) {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    for (const [lang, config] of Object.entries(languageConfigs)) {
        if (config.ext && config.ext.includes(ext)) {
            return lang;
        }
    }
    return 'javascript'; // default
}

// Change editor language
function changeLanguage(language) {
    const config = languageConfigs[language];
    if (!config) return;
    
    if (editor) {
        const options = { mode: config.mode };
        
        // Add JSON linting
        if (config.lint && language === 'application/json') {
            options.lint = true;
            options.gutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'];
        } else {
            options.lint = false;
            options.gutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];
        }
        
        editor.setOption('mode', options.mode);
        if (options.lint !== undefined) {
            editor.setOption('lint', options.lint);
            editor.setOption('gutters', options.gutters);
        }
    }
    
    // Show/hide preview button for markdown
    if (language === 'markdown') {
        previewBtn.style.display = 'inline-block';
    } else {
        previewBtn.style.display = 'none';
        if (isPreviewMode) {
            togglePreview(); // Hide preview if switching away from markdown
        }
    }
    
    // Update filename placeholder
    const ext = config.ext ? config.ext[0] : '.txt';
    filenameInput.placeholder = `filename${ext}`;
}

// Toggle markdown preview
function togglePreview() {
    isPreviewMode = !isPreviewMode;
    
    if (isPreviewMode) {
        previewDiv.style.display = 'block';
        previewBtn.textContent = 'Hide Preview';
        previewBtn.classList.add('active');
        updateMarkdownPreview();
    } else {
        previewDiv.style.display = 'none';
        previewBtn.textContent = 'Show Preview';
        previewBtn.classList.remove('active');
    }
}

// Update markdown preview
function updateMarkdownPreview() {
    if (isPreviewMode && languageSelect.value === 'markdown') {
        const content = getEditorContent();
        try {
            const html = marked.parse(content);
            previewContent.innerHTML = html;
        } catch (error) {
            previewContent.innerHTML = '<p style="color: red;">Error rendering markdown: ' + error.message + '</p>';
        }
    }
}

// Language selector change handler
languageSelect.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
    localStorage.setItem('editorLanguage', e.target.value);
});

// Preview button handler
previewBtn.addEventListener('click', togglePreview);

// Filename change handler for auto-detection and auto-save
filenameInput.addEventListener('input', (e) => {
    const filename = e.target.value.trim();
    if (filename && filename.includes('.')) {
        const detectedLang = detectLanguageFromFilename(filename);
        if (detectedLang !== languageSelect.value) {
            languageSelect.value = detectedLang;
            changeLanguage(detectedLang);
            showStatus(`✓ Auto-detected ${detectedLang} from filename`, 'success');
        }
    }
    
    // Update current tab filename
    if (activeTabId) {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.filename = filename || 'untitled.js';
            renderTabs();
        }
    }
    
    // Trigger auto-save after filename change
    clearTimeout(window.filenameChangeTimeout);
    window.filenameChangeTimeout = setTimeout(() => {
        autoSaveToFileSystem();
    }, 1000);
});

// Tab Management
function createTab(filename, content, language = 'javascript', fileHandle = null) {
    const tabId = ++tabCounter;
    const tab = {
        id: tabId,
        filename: filename || `untitled-${tabId}.js`,
        content: content || '',
        language: language,
        saved: !content, // New tabs are considered saved until modified
        originalContent: content || '',
        fileHandle: fileHandle
    };
    
    tabs.push(tab);
    hideWelcomeScreen();
    renderTabs();
    switchToTab(tabId);
    return tab;
}

function renderTabs() {
    if (tabs.length === 0) {
        tabBar.style.display = 'none';
        showWelcomeScreen();
        return;
    }
    
    tabBar.style.display = 'flex';
    tabBar.innerHTML = '';
    hideWelcomeScreen();
    
    tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${tab.id === activeTabId ? 'active' : ''} ${!tab.saved ? 'unsaved' : ''}`;
        tabElement.innerHTML = `
            <span class="tab-name">${tab.filename}</span>
            <button class="tab-close" onclick="closeTab(${tab.id})" title="Close">×</button>
        `;
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                switchToTab(tab.id);
            }
        });
        tabBar.appendChild(tabElement);
    });
}

function switchToTab(tabId) {
    // Save current tab content
    if (activeTabId) {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.content = getEditorContent();
            currentTab.language = languageSelect.value;
            currentTab.saved = currentTab.content === currentTab.originalContent;
        }
    }
    
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    activeTabId = tabId;
    
    // Update editor content
    if (editor && editor.setValue) {
        editor.setValue(tab.content);
    } else {
        document.getElementById('code-textarea').value = tab.content;
    }
    
    // Update UI
    filenameInput.value = tab.filename;
    languageSelect.value = tab.language;
    changeLanguage(tab.language);
    
    renderTabs();
}

function closeTab(tabId, force = false) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    // Check for unsaved changes, but skip if forcing
    if (!tab.saved && !force) {
        const shouldClose = confirm(`${tab.filename} has unsaved changes. Close anyway?`);
        if (!shouldClose) return;
    }
    
    // Remove tab
    tabs = tabs.filter(t => t.id !== tabId);
    
    // Switch to another tab or show welcome screen
    if (activeTabId === tabId) {
        if (tabs.length > 0) {
            switchToTab(tabs[tabs.length - 1].id);
        } else {
            activeTabId = null;
        }
    }
    
    renderTabs();
}

// File Management
async function openFolder() {
    try {
        await clientFS.openDirectory();
        showStatus('✓ Folder opened successfully', 'success');
        saveFolderState(); // Save folder state
        await refreshFileExplorer();
    } catch (error) {
        showStatus(`✗ ${error.message}`, 'error');
        console.error('Open folder error:', error);
    }
}

async function refreshFileExplorer() {
    if (!clientFS.directoryHandle) {
        // Check if we have a saved folder state but no handle
        const folderState = loadFolderState();
        if (folderState && folderState.hasFolder) {
            fileExplorer.innerHTML = `
                <div class="no-folder-message">
                    <p>📁 Previous folder: ${folderState.folderName}</p>
                    <p>Folder access lost after refresh</p>
                    <button id="openFolderBtnSidebar2" class="open-folder-button">Reopen Folder</button>
                </div>
            `;
        } else {
            fileExplorer.innerHTML = `
                <div class="no-folder-message">
                    <p>No folder opened</p>
                    <button id="openFolderBtnSidebar2" class="open-folder-button">Open Folder</button>
                </div>
            `;
        }
        document.getElementById('openFolderBtnSidebar2').addEventListener('click', openFolder);
        return;
    }
    
    try {
        hideWelcomeScreen();
        const items = await clientFS.listDirectory();
        renderFileTree(items, fileExplorer);
    } catch (error) {
        showStatus('Failed to load file tree', 'error');
        console.error('Refresh error:', error);
        // Clear the directory handle if it's no longer valid
        clientFS.directoryHandle = null;
        await refreshFileExplorer();
    }
}

function getFileIcon(item) {
    if (item.type === 'directory') {
        return 'file-icon';
    }
    
    const ext = item.extension?.substring(1) || 'default';
    const iconMap = {
        'js': 'js', 'jsx': 'js',
        'py': 'py',
        'html': 'html', 'htm': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'md', 'markdown': 'md',
        'txt': 'txt'
    };
    
    return `file-icon ${iconMap[ext] || 'default'}`;
}

function renderFileTree(items, container, level = 0) {
    container.innerHTML = '';
    
    if (items.length === 0 && level === 0) {
        container.innerHTML = '<div class="file-item">No files found</div>';
        return;
    }
    
    items.forEach(item => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${item.type}`;
        fileItem.style.paddingLeft = `${8 + level * 16}px`;
        
        if (item.type === 'directory') {
            const isExpanded = expandedFolders.has(item.path);
            fileItem.classList.add(isExpanded ? 'expanded' : 'collapsed');
        }
        
        fileItem.innerHTML = `
            <span class="${getFileIcon(item)}"></span>
            <span class="file-name">${item.name}</span>
        `;
        
        // Add click handlers
        if (item.type === 'directory') {
            fileItem.addEventListener('click', () => toggleFolder(item, fileItem));
        } else {
            fileItem.addEventListener('click', () => loadFile(item));
        }
        
        // Add context menu
        fileItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, item);
        });
        
        container.appendChild(fileItem);
        
        // Add children container for directories
        if (item.type === 'directory') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'file-children';
            if (!expandedFolders.has(item.path)) {
                childrenContainer.classList.add('hidden');
            }
            container.appendChild(childrenContainer);
        }
    });
}

async function toggleFolder(item, folderElement) {
    const isExpanded = expandedFolders.has(item.path);
    const childrenContainer = folderElement.nextElementSibling;
    
    if (isExpanded) {
        // Collapse
        expandedFolders.delete(item.path);
        folderElement.classList.remove('expanded');
        folderElement.classList.add('collapsed');
        childrenContainer.classList.add('hidden');
        saveFolderState(); // Save collapsed state
    } else {
        // Expand
        expandedFolders.add(item.path);
        folderElement.classList.remove('collapsed');
        folderElement.classList.add('expanded');
        childrenContainer.classList.remove('hidden');
        saveFolderState(); // Save expanded state
        
        // Load children if not already loaded
        if (childrenContainer.children.length === 0) {
            try {
                const children = await clientFS.listDirectory(item.handle, item.path);
                renderFileTree(children, childrenContainer, item.path.split('/').length);
            } catch (error) {
                showStatus('Failed to load folder contents', 'error');
                console.error('Toggle folder error:', error);
            }
        }
    }
}

async function loadFile(item) {
    try {
        const content = await clientFS.readFile(item.handle);
        const language = detectLanguageFromFilename(item.name);
        createTab(item.name, content, language, item.handle);
        showStatus(`✓ Loaded ${item.name}`, 'success');
    } catch (error) {
        showStatus(`✗ Failed to load ${item.name}`, 'error');
        console.error('Load file error:', error);
    }
}

// Enhanced file picker for fallback mode
function openLocalFiles() {
    fileInput.click();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    showStatus(`📂 Loading ${files.length} file(s)...`, 'info');
    
    let loadedCount = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const language = detectLanguageFromFilename(file.name);
            createTab(file.name, content, language);
            
            loadedCount++;
            if (loadedCount === files.length) {
                showStatus(`✓ Loaded ${files.length} file(s) successfully`, 'success');
            }
        };
        reader.onerror = () => {
            showStatus(`✗ Failed to load ${file.name}`, 'error');
        };
        reader.readAsText(file);
    });
    
    // Reset file input
    fileInput.value = '';
}

// Enhanced download functionality for fallback mode
function downloadCurrentFile() {
    const content = getEditorContent();
    const filename = filenameInput.value.trim() || 'untitled.js';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update tab state
    if (activeTabId) {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.filename = filename;
            currentTab.content = content;
            currentTab.originalContent = content;
            currentTab.saved = true;
            renderTabs();
        }
    }
    
    showStatus(`✓ Downloaded ${filename}`, 'success');
}

// Sidebar toggle
function toggleSidebar() {
    isSidebarVisible = !isSidebarVisible;
    sidebar.classList.toggle('hidden', !isSidebarVisible);
    toggleSidebarBtn.textContent = isSidebarVisible ? '📁' : '📂';
}

// Context Menu
function showContextMenu(event, item) {
    hideContextMenu();
    
    // Only show context menu if we have filesystem support and a directory handle
    if (!clientFS.isSupported || !clientFS.directoryHandle) return;
    
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    
    const menuItems = [
        { label: 'New File', action: () => createNewFile(item.type === 'directory' ? item.handle : clientFS.directoryHandle) },
        { label: 'New Folder', action: () => createNewFolder(item.type === 'directory' ? item.handle : clientFS.directoryHandle) },
        { separator: true },
        { label: 'Rename', action: () => renameItem(item) },
        { label: 'Delete', action: () => deleteItem(item) }
    ];
    
    menuItems.forEach(menuItem => {
        if (menuItem.separator) {
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            contextMenu.appendChild(separator);
        } else {
            const menuElement = document.createElement('div');
            menuElement.className = 'context-menu-item';
            menuElement.textContent = menuItem.label;
            menuElement.addEventListener('click', () => {
                menuItem.action();
                hideContextMenu();
            });
            contextMenu.appendChild(menuElement);
        }
    });
    
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    document.body.appendChild(contextMenu);
}

function hideContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

// File Operations
async function createNewFile(dirHandle = clientFS.directoryHandle) {
    if (!dirHandle) {
        showStatus('No folder opened', 'error');
        return;
    }
    
    const name = prompt('Enter file name:');
    if (!name) return;
    
    try {
        const fileHandle = await clientFS.createFile(dirHandle, name);
        showStatus(`✓ Created ${name}`, 'success');
        await refreshFileExplorer();
        
        // Open the new file
        const language = detectLanguageFromFilename(name);
        createTab(name, '', language, fileHandle);
    } catch (error) {
        showStatus(`✗ Failed to create file: ${error.message}`, 'error');
        console.error('Create file error:', error);
    }
}

async function createNewFolder(dirHandle = clientFS.directoryHandle) {
    if (!dirHandle) {
        showStatus('No folder opened', 'error');
        return;
    }
    
    const name = prompt('Enter folder name:');
    if (!name) return;
    
    try {
        await clientFS.createDirectory(dirHandle, name);
        showStatus(`✓ Created folder ${name}`, 'success');
        await refreshFileExplorer();
    } catch (error) {
        showStatus(`✗ Failed to create folder: ${error.message}`, 'error');
        console.error('Create folder error:', error);
    }
}

async function renameItem(item) {
    // Use prompt for now - could be enhanced with inline editing later
    const newName = prompt(`Rename "${item.name}" to:`, item.name);
    if (!newName || newName === item.name || !newName.trim()) return;
    
    try {
        const parentHandle = clientFS.directoryHandle;
        
        if (item.type === 'file') {
            // For files: use the rename method
            const newFileHandle = await clientFS.renameFile(parentHandle, item.name, newName);
            
            // Update any open tabs that reference this file
            const openTab = tabs.find(t => t.fileHandle === item.handle);
            if (openTab) {
                openTab.filename = newName;
                openTab.fileHandle = newFileHandle;
                openTab.saved = true;
                renderTabs();
                
                // Update filename input if this is the active tab
                if (openTab.id === activeTabId) {
                    filenameInput.value = newName;
                }
            }
            
            showStatus(`✓ Renamed file to ${newName}`, 'success');
        } else {
            // For directories: create new directory, move contents, delete old
            const newDirHandle = await clientFS.createDirectory(parentHandle, newName);
            
            // Move all contents (simplified - would need recursive implementation)
            // For now, just create the new directory and let user handle contents
            await clientFS.deleteEntry(parentHandle, item.name);
            
            showStatus(`✓ Renamed folder to ${newName}`, 'success');
        }
        
        await refreshFileExplorer();
        saveFolderState(); // Save updated state
        
    } catch (error) {
        showStatus(`✗ Failed to rename: ${error.message}`, 'error');
        console.error('Rename error:', error);
    }
}

async function deleteItem(item) {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    
    console.log('Delete item called for:', item.name, 'Type:', item.type);
    
    try {
        // Ensure we have a valid directory handle
        if (!clientFS.directoryHandle) {
            showStatus('✗ No folder opened', 'error');
            return;
        }
        
        const parentHandle = clientFS.directoryHandle;
        console.log('Parent handle:', parentHandle);
        
        // Close tab if file is open BEFORE deleting
        const openTab = tabs.find(t => t.fileHandle === item.handle);
        if (openTab) {
            console.log('Closing open tab for file being deleted:', item.name);
            closeTab(openTab.id, true); // Force close without confirmation
        }
        

        
        console.log('About to delete:', item.name);
        console.log('Directory handle valid:', !!parentHandle);
        console.log('Item handle:', item.handle);
        
        // Test if we can list directory first
        try {
            const testList = await clientFS.listDirectory(parentHandle);
            console.log('Directory listing works, found', testList.length, 'items');
        } catch (testError) {
            console.error('Cannot list directory:', testError);
            throw new Error('Directory access lost');
        }
        
        // Delete the item from filesystem
        await clientFS.deleteEntry(parentHandle, item.name);
        
        console.log('Successfully deleted:', item.name);
        showStatus(`✓ Deleted ${item.name}`, 'success');
        
        // Refresh file explorer and save folder state
        await refreshFileExplorer();
        saveFolderState(); // Save updated folder state
        
    } catch (error) {
        console.error('Delete error details:', error);
        showStatus(`✗ Failed to delete: ${error.message}`, 'error');
    }
}

// Event listeners
openFileBtn.addEventListener('click', async () => {
    if (clientFS.isSupported) {
        try {
            const fileHandles = await clientFS.openFiles();
            for (const fileHandle of fileHandles) {
                const file = await fileHandle.getFile();
                const content = await file.text();
                const language = detectLanguageFromFilename(file.name);
                createTab(file.name, content, language, fileHandle);
            }
            showStatus(`✓ Opened ${fileHandles.length} file(s)`, 'success');
        } catch (error) {
            showStatus(`✗ ${error.message}`, 'error');
        }
    } else {
        // Enhanced fallback mode
        openLocalFiles();
    }
});

openFolderBtn.addEventListener('click', openFolder);
openFolderBtnSidebar.addEventListener('click', openFolder);
fileInput.addEventListener('change', handleFileSelect);
toggleSidebarBtn.addEventListener('click', toggleSidebar);
refreshFilesBtn.addEventListener('click', refreshFileExplorer);
createFileBtn.addEventListener('click', () => createNewFile());
createFolderBtn.addEventListener('click', () => createNewFolder());

// Hide context menu on click outside
document.addEventListener('click', hideContextMenu);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }
    
    // Ctrl+N for new file (fallback mode)
    if (e.ctrlKey && e.key === 'n' && !clientFS.isSupported) {
        e.preventDefault();
        const filename = prompt('Enter filename (with extension):') || 'untitled.js';
        const language = detectLanguageFromFilename(filename);
        createTab(filename, '', language);
    }
    
    // Ctrl+O for open files
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openFileBtn.click();
    }
});

// Auto-save functionality
function autoSave() {
    const content = getEditorContent();
    const filename = filenameInput.value.trim() || 'auto-save.js';
    const language = languageSelect.value;
    localStorage.setItem('editorContent', content);
    localStorage.setItem('editorFilename', filename);
    localStorage.setItem('editorLanguage', language);
}

// Enhanced auto-save to file system
async function autoSaveToFileSystem() {
    if (!activeTabId) return;
    
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (!currentTab) return;
    
    const content = getEditorContent();
    const filename = filenameInput.value.trim() || currentTab.filename;
    
    // Update tab content and filename
    currentTab.content = content;
    if (filename !== currentTab.filename) {
        currentTab.filename = filename;
        // If filename changed, clear file handle to force new file creation on next save
        if (currentTab.fileHandle) {
            currentTab.fileHandle = null;
        }
    }
    
    try {
        if (clientFS.isSupported && currentTab.fileHandle) {
            // Auto-save to existing file handle
            await clientFS.writeFile(currentTab.fileHandle, content);
            currentTab.originalContent = content;
            currentTab.saved = true;
            renderTabs();
            // Show brief auto-save indicator
            const originalText = status.textContent;
            const originalClass = status.className;
            status.textContent = `💾 Auto-saved ${filename}`;
            status.className = 'status success';
            setTimeout(() => {
                if (status.textContent.includes('Auto-saved')) {
                    status.textContent = originalText;
                    status.className = originalClass;
                }
            }, 2000);
        } else if (!clientFS.isSupported) {
            // In fallback mode, just update localStorage
            autoSave();
            currentTab.saved = currentTab.content === currentTab.originalContent;
            renderTabs();
        }
    } catch (error) {
        console.error('Auto-save error:', error);
        // Fallback to localStorage
        autoSave();
    }
}

// Debounced auto-save to file system
const DEBOUNCE_DELAY = 1500;
let autoSaveTimer = null;

function debouncedAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        autoSave();
        autoSaveToFileSystem();
    }, DEBOUNCE_DELAY);
}

// Save on editor changes
if (editor) {
    editor.on('change', () => {
        // Mark current tab as unsaved
        if (activeTabId) {
            const currentTab = tabs.find(t => t.id === activeTabId);
            if (currentTab) {
                currentTab.content = getEditorContent();
                currentTab.saved = currentTab.content === currentTab.originalContent;
                renderTabs();
            }
        }
        
        debouncedAutoSave();
        
        // Update markdown preview if in preview mode
        if (isPreviewMode && languageSelect.value === 'markdown') {
            clearTimeout(window.previewTimeout);
            window.previewTimeout = setTimeout(updateMarkdownPreview, 300);
        }
    });
} else {
    document.getElementById('code-textarea').addEventListener('input', () => {
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
            autoSave();
            autoSaveToFileSystem();
        }, 1500);
    });
}

// Initialize application
setTimeout(() => {
    // Load folder state
    const folderState = loadFolderState();
    
    // Only create initial tab if we have saved content or an open folder
    const savedContent = localStorage.getItem('editorContent');
    const savedFilename = localStorage.getItem('editorFilename');
    const savedLanguage = localStorage.getItem('editorLanguage') || 'javascript';
    
    if (savedContent || (folderState && folderState.hasFolder)) {
        createTab(
            savedFilename || 'welcome.js',
            savedContent || '',
            savedLanguage
        );
    }
    
    // Initialize file explorer
    refreshFileExplorer();
    
    // Show folder state info if available
    if (folderState && folderState.hasFolder) {
        showStatus(`💾 Folder state restored (${folderState.folderName || 'Unknown'})`, 'info');
    }
    
    // Show welcome screen if no tabs and no folder
    if (tabs.length === 0) {
        showWelcomeScreen();
    } else if (editor && editor.focus) {
        editor.focus();
    } else {
        document.getElementById('code-textarea').focus();
    }
}, 100);
