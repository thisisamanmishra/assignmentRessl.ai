import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Storage for uploaded folders - use absolute path
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
console.log('Upload directory:', UPLOAD_DIR);

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Generate folderId if not present (for multipart/form-data, req.body may not be populated yet)
    let folderId = req.body && req.body.folderId;
    if (!folderId) {
      if (!req.generatedFolderId) {
        req.generatedFolderId = Date.now().toString();
      }
      folderId = req.generatedFolderId;
    }
    // Save folderId for later use in response
    req.folderIdUsed = folderId;
    const uploadPath = path.join(UPLOAD_DIR, folderId);
    
    console.log('Creating upload path:', uploadPath);
    fs.ensureDirSync(uploadPath);
    
    // Handle nested directory structure from webkitRelativePath
    if (file.originalname.includes('/')) {
      const relativePath = file.originalname;
      const filePath = path.join(uploadPath, relativePath);
      const fileDir = path.dirname(filePath);
      
      console.log('Creating nested directory:', fileDir);
      fs.ensureDirSync(fileDir);
      cb(null, fileDir);
    } else {
      cb(null, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    // Use just the filename, not the full path
    const filename = path.basename(file.originalname);
    console.log('Saving file as:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', file.originalname);
    // Accept all file types but exclude system files
    if (file.originalname.startsWith('.DS_Store') || 
        file.originalname.includes('/.git/') ||
        file.originalname.startsWith('.git')) {
      console.log('Filtering out system file:', file.originalname);
      cb(null, false);
    } else {
      cb(null, true);
    }
  }
});

// MCP Server Tools Implementation
class MCPFileSystemTools {
  constructor() {
    this.tools = {
      create_file: this.createFile.bind(this),
      edit_file: this.editFile.bind(this),
      delete_file: this.deleteFile.bind(this),
      read_file: this.readFile.bind(this),
      list_files: this.listFiles.bind(this),
      create_directory: this.createDirectory.bind(this),
      delete_directory: this.deleteDirectory.bind(this)
    };
  }

  validatePath(basePath, targetPath) {
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(basePath, targetPath);
    
    // Ensure the target path is within the base directory
    if (!resolvedTarget.startsWith(resolvedBase)) {
      throw new Error('Access denied: Path outside of allowed directory');
    }
    
    return resolvedTarget;
  }

  async createFile(basePath, filePath, content = '') {
    try {
      const fullPath = this.validatePath(basePath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf8');
      return { success: true, message: `File created: ${filePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async editFile(basePath, filePath, content) {
    try {
      const fullPath = this.validatePath(basePath, filePath);
      await fs.writeFile(fullPath, content, 'utf8');
      return { success: true, message: `File edited: ${filePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteFile(basePath, filePath) {
    try {
      const fullPath = this.validatePath(basePath, filePath);
      await fs.unlink(fullPath);
      return { success: true, message: `File deleted: ${filePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async readFile(basePath, filePath) {
    try {
      const fullPath = this.validatePath(basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listFiles(basePath, dirPath = '.') {
    try {
      console.log('listFiles called with basePath:', basePath, 'dirPath:', dirPath);
      
      const fullPath = this.validatePath(basePath, dirPath);
      console.log('Resolved full path:', fullPath);
      
      // Check if directory exists
      if (!await fs.pathExists(fullPath)) {
        console.log('Directory does not exist:', fullPath);
        return { success: false, error: `Directory does not exist: ${fullPath}` };
      }
      
      const items = await fs.readdir(fullPath, { withFileTypes: true });
      console.log('Found items:', items.map(item => item.name));
      
      const result = await Promise.all(
        items
          .filter(item => !item.name.startsWith('.')) // Filter out hidden files
          .map(async (item) => {
            const itemPath = path.join(dirPath, item.name);
            const fullItemPath = path.join(fullPath, item.name);
            const stats = await fs.stat(fullItemPath);
            
            return {
              name: item.name,
              path: itemPath === '.' ? item.name : itemPath,
              type: item.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modifiedAt: stats.mtime
            };
          })
      );
      
      // Sort directories first, then files
      result.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      console.log('Returning files:', result);
      return { success: true, files: result };
    } catch (error) {
      console.error('Error in listFiles:', error);
      return { success: false, error: error.message };
    }
  }

  async createDirectory(basePath, dirPath) {
    try {
      const fullPath = this.validatePath(basePath, dirPath);
      await fs.ensureDir(fullPath);
      return { success: true, message: `Directory created: ${dirPath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteDirectory(basePath, dirPath) {
    try {
      const fullPath = this.validatePath(basePath, dirPath);
      await fs.remove(fullPath);
      return { success: true, message: `Directory deleted: ${dirPath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const mcpTools = new MCPFileSystemTools();

// Routes
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    // Use the folderId used by multer
    const folderId = req.folderIdUsed || (req.body && req.body.folderId) || (req.generatedFolderId) || 'default';
    const fileCount = req.files?.length || 0;
    
    console.log(`Upload successful: ${fileCount} files uploaded to folder ${folderId}`);
    console.log('Files uploaded:', req.files?.map(f => f.filename));
    
    res.json({ 
      success: true, 
      folderId, 
      fileCount,
      message: `Successfully uploaded ${fileCount} files`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/folders/:folderId/files', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { path: dirPath = '.' } = req.query;
    const basePath = path.join(UPLOAD_DIR, folderId);
    
    console.log(`Listing files for folder ${folderId}, path: ${dirPath}`);
    console.log('Base path:', basePath);
    
    const result = await mcpTools.listFiles(basePath, dirPath);
    res.json(result);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/folders/:folderId/files/*', async (req, res) => {
  try {
    const { folderId } = req.params;
    const filePath = req.params[0];
    const basePath = path.join(UPLOAD_DIR, folderId);
    
    console.log(`Reading file: ${filePath} from folder ${folderId}`);
    
    const result = await mcpTools.readFile(basePath, filePath);
    res.json(result);
  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/folders/:folderId/mcp-execute', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { tool, arguments: args } = req.body;
    const basePath = path.join(UPLOAD_DIR, folderId);
    
    console.log(`Executing MCP tool: ${tool} for folder ${folderId}`);
    
    if (!mcpTools.tools[tool]) {
      return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` });
    }
    
    const result = await mcpTools.tools[tool](basePath, ...Object.values(args));
    res.json(result);
  } catch (error) {
    console.error('MCP execute error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Natural language processing endpoint (simplified)
app.post('/api/folders/:folderId/process-prompt', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { prompt } = req.body;
    const basePath = path.join(UPLOAD_DIR, folderId);
    
    console.log(`Processing prompt for folder ${folderId}: ${prompt}`);
    
    // Simple prompt processing (in a real app, you'd use an LLM here)
    const commands = parsePrompt(prompt);
    const results = [];
    
    for (const command of commands) {
      const result = await mcpTools.tools[command.tool](basePath, ...command.args);
      results.push({ command: command.description, result });
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Process prompt error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple prompt parser (would be replaced with LLM in production)
function parsePrompt(prompt) {
  const commands = [];
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('create') && lowerPrompt.includes('file')) {
    const match = prompt.match(/create.*file.*['""]([^'""]*)['""]/i);
    if (match) {
      commands.push({
        tool: 'create_file',
        args: [match[1], '// New file created\n'],
        description: `Create file: ${match[1]}`
      });
    }
  }
  
  if (lowerPrompt.includes('delete') && lowerPrompt.includes('file')) {
    const match = prompt.match(/delete.*file.*['""]([^'""]*)['""]/i);
    if (match) {
      commands.push({
        tool: 'delete_file',
        args: [match[1]],
        description: `Delete file: ${match[1]}`
      });
    }
  }
  
  if (lowerPrompt.includes('create') && lowerPrompt.includes('directory')) {
    const match = prompt.match(/create.*directory.*['""]([^'""]*)['""]/i);
    if (match) {
      commands.push({
        tool: 'create_directory',
        args: [match[1]],
        description: `Create directory: ${match[1]}`
      });
    }
  }
  
  return commands;
}

app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
});