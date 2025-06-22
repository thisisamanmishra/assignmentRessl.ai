export class MCPClient {
  private baseUrl = 'http://localhost:3001/api';

  async listFiles(folderId: string, path = '.') {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/files?path=${encodeURIComponent(path)}`);
    return response.json();
  }

  async readFile(folderId: string, filePath: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/files/${encodeURIComponent(filePath)}`);
    return response.json();
  }

  async createFile(folderId: string, filePath: string, content = '') {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/mcp-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'create_file',
        arguments: { filePath, content },
      }),
    });
    return response.json();
  }

  async editFile(folderId: string, filePath: string, content: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/mcp-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'edit_file',
        arguments: { filePath, content },
      }),
    });
    return response.json();
  }

  async deleteFile(folderId: string, filePath: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/mcp-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'delete_file',
        arguments: { filePath },
      }),
    });
    return response.json();
  }

  async createDirectory(folderId: string, dirPath: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/mcp-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'create_directory',
        arguments: { dirPath },
      }),
    });
    return response.json();
  }

  async deleteDirectory(folderId: string, dirPath: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/mcp-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'delete_directory',
        arguments: { dirPath },
      }),
    });
    return response.json();
  }

  async processPrompt(folderId: string, prompt: string) {
    const response = await fetch(`${this.baseUrl}/folders/${folderId}/process-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    return response.json();
  }
}