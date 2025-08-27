const fs = require('fs');
const path = require('path');

interface DocumentationSection {
  name: string;
  content: string;
}

class DocsService {
  private docsPath: string;
  private documentation: Map<string, string> = new Map();

  constructor() {
    this.docsPath = path.join(__dirname, 'duckchain-docs');
    this.loadDocumentation();
  }

  private loadDocumentation(): void {
    try {
      const files = fs.readdirSync(this.docsPath);
      
      files.forEach((file: string) => {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.docsPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const sectionName = file.replace('.md', '');
          this.documentation.set(sectionName, content);
        }
      });
    } catch (error) {
      console.error('Error loading documentation:', error);
    }
  }

  getDocumentationContext(): string {
    let context = 'DuckChain Official Documentation:\n\n';
    
    this.documentation.forEach((content, section) => {
      context += `=== ${section.toUpperCase()} ===\n`;
      context += content + '\n\n';
    });
    
    return context;
  }

  getSectionContent(section: string): string | undefined {
    return this.documentation.get(section);
  }

  getAllSections(): string[] {
    return Array.from(this.documentation.keys());
  }
}

module.exports = { DocsService };
