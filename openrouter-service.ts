import { DocsService } from './docs-service';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private docsService: any;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY as string;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.docsService = new DocsService();
  }

  async chat(messages: OpenRouterMessage[], model: string = 'openai/gpt-4o-mini'): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://duckchain-bot.com',
          'X-Title': 'DuckChain Bot',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not process your message.';
    } catch (error) {
      return 'Sorry, an error occurred while processing your message.';
    }
  }

  async getDuckChainResponse(userMessage: string, language: string = 'EN'): Promise<string> {
    const systemPrompt = this.getSystemPrompt(language);
    
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return await this.chat(messages);
  }

  private getSystemPrompt(language: string): string {
    const docsContext = this.docsService.getDocumentationContext();
    
    const prompt = `You are DuckChain Bot, a friendly and helpful Web3 assistant for DuckChain. Respond in the ${language} language.

IMPORTANT: Use the following official DuckChain documentation to answer questions:

${docsContext}

Focus on helping with DuckChain-specific questions and onboarding. Always be polite and use emojis occasionally to keep the tone friendly. Base your responses on the official documentation provided above.`;

    return prompt;
  }
}
