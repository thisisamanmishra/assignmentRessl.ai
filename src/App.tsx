import React, { useState, useCallback } from 'react';
import { Upload, Folder, File, Play, Trash2, Plus, Edit3 } from 'lucide-react';
import FileExplorer from './components/FileExplorer';
import FileEditor from './components/FileEditor';
import PromptInterface from './components/PromptInterface';
import { MCPClient } from './utils/mcpClient';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  children?: FileNode[];
}

function App() {
  // Load folderId from localStorage if present
  const [folderId, setFolderId] = useState<string | null>(() => {
    return localStorage.getItem('folderId') || null;
  });
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mcpClient] = useState(() => new MCPClient());

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    console.log('Files selected:', files.length);

    setLoading(true);
    try {
      const newFolderId = Date.now().toString();
      const formData = new FormData();
      
      files.forEach(file => {
        console.log('Adding file:', file.name, file.webkitRelativePath || 'no relative path');
        formData.append('files', file);
      });
      formData.append('folderId', newFolderId);

      console.log('Uploading to server...');
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success) {
        setFolderId(result.folderId);
        localStorage.setItem('folderId', result.folderId);
        // Wait a moment for files to be written to disk
        setTimeout(() => {
          loadFiles(result.folderId);
        }, 500);
      } else {
        console.error('Upload failed:', result);
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
      // Reset the input
      event.target.value = '';
    }
  }, []);

  const loadFiles = useCallback(async (folderId: string, path = '.') => {
    try {
      console.log('Loading files for folder:', folderId, 'path:', path);
      const result = await mcpClient.listFiles(folderId, path);
      console.log('Files loaded:', result);
      if (result.success) {
        setFiles(result.files);
      } else {
        console.error('Failed to load files:', result.error);
        alert('Failed to load files: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      alert('Failed to load files: ' + error.message);
    }
  }, [mcpClient]);

  const handleFileSelect = useCallback(async (filePath: string) => {
    if (!folderId) return;
    
    console.log('Selecting file:', filePath);
    setSelectedFile(filePath);
    try {
      const result = await mcpClient.readFile(folderId, filePath);
      console.log('File content loaded:', result);
      if (result.success) {
        setFileContent(result.content);
      } else {
        console.error('Failed to read file:', result.error);
        // For binary files, show a message instead of content
        if (result.error.includes('invalid') || result.error.includes('binary')) {
          setFileContent('This file appears to be binary and cannot be displayed as text.');
        } else {
          setFileContent('Error loading file: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      setFileContent('Error loading file: ' + error.message);
    }
  }, [folderId, mcpClient]);

  const handleFileEdit = useCallback(async (filePath: string, content: string) => {
    if (!folderId) return;
    
    try {
      const result = await mcpClient.editFile(folderId, filePath, content);
      if (result.success) {
        setFileContent(content);
        alert('File saved successfully!');
      } else {
        alert('Failed to save file: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to edit file:', error);
      alert('Failed to save file: ' + error.message);
    }
  }, [folderId, mcpClient]);

  const handlePromptExecute = useCallback(async (prompt: string) => {
    if (!folderId) return;
    
    try {
      const result = await mcpClient.processPrompt(folderId, prompt);
      if (result.success) {
        await loadFiles(folderId);
        return result.results;
      } else {
        alert('Failed to execute prompt: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to execute prompt:', error);
      alert('Failed to execute prompt: ' + error.message);
    }
  }, [folderId, mcpClient, loadFiles]);

  const triggerFolderSelect = () => {
    const input = document.getElementById('folder-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">MCP Filesystem Server</h1>
          <p className="text-slate-300">Upload folders and use natural language to edit files</p>
        </div>

        {!folderId ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Upload Your Project Folder</h2>
                <p className="text-slate-300 mb-6">Select a folder to start editing files with natural language commands</p>
                
                <div className="relative">
                  <input
                    id="folder-input"
                    type="file"
                    multiple
                    webkitdirectory=""
                    directory=""
                    onChange={handleFolderUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <button
                    onClick={triggerFolderSelect}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Folder className="w-5 h-5 mr-2" />
                        Choose Folder
                      </div>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-slate-400 mt-4">
                  Your files will be processed securely and stored temporarily
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* File Explorer */}
            <div className="lg:col-span-1">
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onRefresh={() => loadFiles(folderId)}
              />
            </div>

            {/* File Editor */}
            <div className="lg:col-span-1">
              <FileEditor
                selectedFile={selectedFile}
                content={fileContent}
                onEdit={handleFileEdit}
              />
            </div>

            {/* Prompt Interface */}
            <div className="lg:col-span-1">
              <PromptInterface
                onExecute={handlePromptExecute}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;