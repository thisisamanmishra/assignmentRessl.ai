import React, { useState } from 'react';
import { Send, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PromptResult {
  command: string;
  result: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

interface PromptInterfaceProps {
  onExecute: (prompt: string) => Promise<PromptResult[] | undefined>;
}

const PromptInterface: React.FC<PromptInterfaceProps> = ({ onExecute }) => {
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<PromptResult[]>([]);

  const handleExecute = async () => {
    if (!prompt.trim() || isExecuting) return;
    
    setIsExecuting(true);
    try {
      const executionResults = await onExecute(prompt);
      if (executionResults) {
        setResults(prev => [...executionResults, ...prev]);
      }
      setPrompt('');
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const examplePrompts = [
    'Create a new file called "config.json"',
    'Delete the file "temp.txt"',
    'Create a directory called "assets"',
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-400" />
          AI Assistant
        </h3>
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        {/* Prompt Input */}
        <div className="mb-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to do with your files..."
              className="w-full bg-black/30 text-white rounded-lg p-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 min-h-[100px]"
              disabled={isExecuting}
            />
            <button
              onClick={handleExecute}
              disabled={!prompt.trim() || isExecuting}
              className="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              {isExecuting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Example Prompts */}
        {results.length === 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Try these examples:</p>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="w-full text-left text-sm bg-white/5 hover:bg-white/10 text-gray-300 p-3 rounded-lg transition-colors duration-200 border border-white/10"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {results.map((item, index) => (
            <div
              key={index}
              className="bg-black/20 rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">
                  {item.result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-1">
                    {item.command}
                  </p>
                  <p className={`text-xs ${
                    item.result.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {item.result.success ? 
                      (item.result.message || 'Success') : 
                      (item.result.error || 'Failed')
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptInterface;