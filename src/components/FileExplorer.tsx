import React, { useState } from 'react';
import { Folder, File, FolderOpen, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onRefresh: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onRefresh,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.path) ? 
        <FolderOpen className="w-4 h-4 text-blue-400" /> : 
        <Folder className="w-4 h-4 text-blue-400" />;
    }
    
    const ext = getFileExtension(file.name);
    const iconColor = {
      'js': 'text-yellow-400',
      'ts': 'text-blue-400',
      'jsx': 'text-cyan-400',
      'tsx': 'text-cyan-400',
      'html': 'text-orange-400',
      'css': 'text-pink-400',
      'json': 'text-green-400',
      'md': 'text-gray-400',
      'txt': 'text-gray-400',
    }[ext] || 'text-gray-400';
    
    return <File className={`w-4 h-4 ${iconColor}`} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderFile = (file: FileNode, depth = 0) => {
    const isSelected = selectedFile === file.path;
    const isExpanded = expandedFolders.has(file.path);

    return (
      <div key={file.path}>
        <div
          className={`flex items-center py-2 px-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-white/10 ${
            isSelected ? 'bg-blue-500/20 border-l-2 border-blue-400' : ''
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (file.type === 'directory') {
              toggleFolder(file.path);
            } else {
              onFileSelect(file.path);
            }
          }}
        >
          {file.type === 'directory' && (
            <div className="mr-1">
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-400" /> : 
                <ChevronRight className="w-3 h-3 text-gray-400" />
              }
            </div>
          )}
          
          <div className="mr-2">
            {getFileIcon(file)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{file.name}</div>
            {file.type === 'file' && file.size && (
              <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
            )}
          </div>
        </div>
        
        {file.type === 'directory' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFile(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Folder className="w-5 h-5 mr-2 text-blue-400" />
          File Explorer
        </h3>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No files found</p>
          </div>
        ) : (
          files.map(file => renderFile(file))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;