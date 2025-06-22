import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, File } from 'lucide-react';

interface FileEditorProps {
  selectedFile: string | null;
  content: string;
  onEdit: (path: string, content: string) => void;
}

const FileEditor: React.FC<FileEditorProps> = ({
  selectedFile,
  content,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setEditContent(content);
    setIsDirty(false);
    setIsEditing(false);
  }, [content, selectedFile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedFile && isDirty) {
      onEdit(selectedFile, editContent);
      setIsDirty(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);
    setIsDirty(value !== content);
  };

  const getLanguageFromFileName = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'markup',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
    };
    return langMap[ext || ''] || 'text';
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <File className="w-5 h-5 mr-2 text-green-400" />
          File Editor
        </h3>
        
        {selectedFile && (
          <div className="flex items-center space-x-2">
            {isDirty && (
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                Unsaved
              </span>
            )}
            
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a file to view or edit</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="mb-2 text-sm text-gray-300">
              {selectedFile}
            </div>
            
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 w-full bg-black/30 text-white rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10"
                placeholder="Enter file content..."
              />
            ) : (
              <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-auto">
                <pre className="text-white font-mono text-sm whitespace-pre-wrap">
                  {content || 'Empty file'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileEditor;