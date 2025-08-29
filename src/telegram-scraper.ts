import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { OpenRouterService } from './services/openrouter-service';

interface ScrapedMessage {
  id: number;
  text: string;
  date: Date;
  userId: number;
  username?: string;
}

interface QuestionAnalysis {
  question: string;
  frequency: number;
  category: 'basic' | 'intermediate' | 'advanced';
  confidence: number;
}

interface ScrapingConfig {
  enabled: boolean;
  intervalHours: number;
  messagesPerGroup: number;
  groups: string[];
  lastRun?: Date;
}

export class TelegramScraper {
  private client: any;
  private openRouterService: any;
  private scrapedMessages: ScrapedMessage[] = [];
  private config: ScrapingConfig;
  private intervalId: NodeJS.Timeout | undefined;

  constructor(
    private apiId: number,
    private apiHash: string,
    private sessionString: string,
    config?: Partial<ScrapingConfig>
  ) {
    this.client = new TelegramClient(
      new StringSession(sessionString),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );
    this.openRouterService = new OpenRouterService();
    
    this.config = {
      enabled: false,
      intervalHours: 168, // 7 days
      messagesPerGroup: 500,
      groups: ['@DuckChain_io'],
    };
  }

  async connect(): Promise<void> {
    await this.client.start();
    console.log('✅ Connected to Telegram');
  }

  async scrapeGroupMessages(
    groupUsername: string,
    limit: number = 1000
  ): Promise<ScrapedMessage[]> {
    try {
      console.log(`🔍 Scraping messages from @${groupUsername}...`);
      
      const messages = await this.client.getMessages(groupUsername, { limit });
      
      const scrapedMessages: ScrapedMessage[] = messages
        .filter((msg: any) => msg.message && msg.message.length > 10)
        .map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          date: new Date(msg.date * 1000),
          userId: msg.senderId?.toString() || '0',
          username: msg.sender?.username
        }));

      this.scrapedMessages = scrapedMessages;
      
      return scrapedMessages;
    } catch (error) {
      console.error('❌ Error scraping messages:', error);
      return [];
    }
  }

  async analyzeQuestions(): Promise<QuestionAnalysis[]> {
    if (this.scrapedMessages.length === 0) {
      return [];
    }

    const questionPatterns = [
      /\?$/,
      /^(como|what|how|quando|when|onde|where|por que|why)/i, 
      /^(explique|explain|me diga|tell me)/i 
    ];

    const potentialQuestions = this.scrapedMessages
      .filter(msg => 
        questionPatterns.some(pattern => pattern.test(msg.text)) &&
        msg.text.length > 15 && msg.text.length < 200 
      )
      .map(msg => msg.text);

    if (potentialQuestions.length === 0) {
      return [];
    }

    const analysis = await this.analyzeQuestionsWithAI(potentialQuestions);

    return analysis;
  }



  private async analyzeQuestionsWithAI(potentialQuestions: string[]): Promise<QuestionAnalysis[]> {
    try {
      const questionsList = potentialQuestions.map((question, index) => 
        `${index + 1}. "${question}"`
      ).join('\n');

      const frequencyPrompt = `Analyze these messages from a Telegram group and identify the most frequently asked questions.

Messages found:
${questionsList}

Instructions:
1. Look for questions that appear multiple times or have similar wording
2. Identify patterns and common themes
3. Focus on questions that seem to be asked by different users
4. Estimate frequency based on how often similar questions appear

Return ONLY the top 15 most frequently asked questions in JSON format:
[
  {"question": "How much is DUCK token worth?", "frequency": 8},
  {"question": "How do I bridge TON to DuckChain?", "frequency": 7}
]`;
      let frequencyResponse = '';
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          frequencyResponse = await this.openRouterService.chat([
            { role: 'user', content: frequencyPrompt }
          ], 'openai/gpt-4o-mini');
          break;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            return potentialQuestions.slice(0, 10).map((question) => ({
              question,
              frequency: 1,
              category: 'intermediate' as const,
              confidence: 0.8
            }));
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      let frequentQuestions: any[] = [];
      try {
        let cleanResponse = frequencyResponse.trim();
        
        if (cleanResponse.toLowerCase().includes('desculpe') || 
            cleanResponse.toLowerCase().includes('error') ||
            cleanResponse.toLowerCase().includes('ocorreu um erro')) {
          return potentialQuestions.slice(0, 10).map((question) => ({
            question,
            frequency: 1,
            category: 'intermediate' as const,
            confidence: 0.8
          }));
        }
        
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const parsed = JSON.parse(cleanResponse);
        if (Array.isArray(parsed)) {
          frequentQuestions = parsed;
        }
      } catch (parseError) {
        return potentialQuestions.slice(0, 10).map((question) => ({
          question,
          frequency: 1,
          category: 'intermediate' as const,
          confidence: 0.8
        }));
      }

      if (frequentQuestions.length === 0) {
        return potentialQuestions.slice(0, 10).map((question) => ({
          question,
          frequency: 1,
          category: 'intermediate' as const,
          confidence: 0.8
        }));
      }
      const frequentQuestionsList = frequentQuestions.map((item, index) => 
        `${index + 1}. "${item.question}" (Frequency: ${item.frequency})`
      ).join('\n');

      const educationalPrompt = `You are a DuckChain educator. Your job is to select ONLY educational questions that are perfect for teaching new users about DuckChain.

Frequent questions found:
${frequentQuestionsList}

STRICT EDUCATIONAL CRITERIA:
✅ SELECT ONLY questions that:
- Teach about DuckChain tokens, price, value
- Explain staking, unstaking, rewards
- Cover bridging (TON to DuckChain)
- Discuss ambassador program, hiring
- Help with wallet creation and management
- Explain DuckChain ecosystem features
- Cover blockchain concepts related to DuckChain

❌ REJECT ALL questions that:
- Are personal ("How did ...", "How much do u have", "had they..") that refers to a person not and not about DuckChain
- Are about other topics ("Do you have chatgpt", "Do they have their own language")
- Are bot responses or AI-generated
- Are generic greetings or non-questions
- Don't mention DuckChain, tokens, or blockchain
- Use informal language, slang, or abbreviations ("u", "r", "btw", "imo", etc.)
- Are poorly written or grammatically incorrect
- Use excessive jargon without explanation


EDUCATIONAL QUALITY:
1. Must be helpful for teaching new users
2. Must be about DuckChain ecosystem specifically
3. Must be clear and well-formed
4. Must be suitable for onboarding
5. Must use professional language (avoid slang, informal terms, abbreviations)
6. Must be grammatically correct and properly formatted
7. Must avoid jargon unless necessary (explain technical terms when used)
8. Must be written in a way that beginners can understand

Categorize by difficulty:
- basic: Simple concepts, suitable for beginners
- intermediate: Technical features, requires some knowledge

Return ONLY the top 5-8 most educational questions in JSON format:
[
  {"question": "What is the current value of the DUCK token?", "category": "basic", "frequency": 8, "confidence": 0.9},
  {"question": "How can I transfer TON tokens to the DuckChain network?", "category": "intermediate", "frequency": 7, "confidence": 0.8}
]

IMPORTANT: Rewrite and improve the questions to be professional, clear, and educational. Avoid informal language, slang, or abbreviations.`;

      let educationalResponse = '';
      retries = 0;
      
      while (retries < maxRetries) {
        try {
          educationalResponse = await this.openRouterService.chat([
            { role: 'user', content: educationalPrompt }
          ], 'openai/gpt-4o-mini');
          break;
        } catch (error) {
          retries++;
          console.log(`⚠️ Attempt ${retries}/${maxRetries} failed for educational filtering`);
          if (retries >= maxRetries) {
            console.error('❌ All retries failed for educational filtering');
            return frequentQuestions.slice(0, 8).map((item: any) => ({
              question: item.question,
              frequency: item.frequency || 1,
              category: 'intermediate' as const,
              confidence: 0.8
            }));
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      try {
        let cleanResponse = educationalResponse.trim();
        
        if (cleanResponse.toLowerCase().includes('desculpe') || 
            cleanResponse.toLowerCase().includes('error') ||
            cleanResponse.toLowerCase().includes('ocorreu um erro')) {
          console.error('❌ AI returned error message instead of JSON');
          console.log('Raw educational response:', educationalResponse);
          return frequentQuestions.slice(0, 8).map((item: any) => ({
            question: item.question,
            frequency: item.frequency || 1,
            category: 'intermediate' as const,
            confidence: 0.8
          }));
        }
        
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const parsed = JSON.parse(cleanResponse);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            question: item.question,
            frequency: item.frequency || 1,
            category: item.category || 'intermediate',
            confidence: item.confidence || 0.8
          }));
        }
      } catch (parseError) {
        console.error('Error parsing educational response:', parseError);
      }

      return frequentQuestions.slice(0, 8).map((item: any) => ({
        question: item.question,
        frequency: item.frequency || 1,
        category: 'intermediate' as const,
        confidence: 0.8
      }));

    } catch (error) {
      console.error('Error in AI analysis:', error);
      return potentialQuestions.slice(0, 10).map((question) => ({
        question,
        frequency: 1,
        category: 'intermediate' as const,
        confidence: 0.8
      }));
    }
  }



  async saveToFile(filename: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    const generatedQuestionsDir = path.join(__dirname, 'generated-questions');
    if (!fs.existsSync(generatedQuestionsDir)) {
      fs.mkdirSync(generatedQuestionsDir, { recursive: true });
    }
    
    const filepath = path.join(generatedQuestionsDir, filename);
    const data = {
      scrapedAt: new Date().toISOString(),
      totalMessages: this.scrapedMessages.length,
      questions: await this.analyzeQuestions()
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved to ${filepath}`);
  }

  startAutoScraping(): void {
    if (this.config.enabled) {
      return;
    }

    this.config.enabled = true;

    this.runScheduledScraping();

    this.intervalId = setInterval(() => {
      this.runScheduledScraping();
    }, this.config.intervalHours * 60 * 60 * 1000);
  }

  stopAutoScraping(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.config.enabled = false;
  }

  private async runScheduledScraping(): Promise<void> {
    try {
      if (!this.client.connected) {
        await this.connect();
      }

      for (const group of this.config.groups) {
        await this.scrapeGroupMessages(group, this.config.messagesPerGroup);
      }

      const questions = await this.analyzeQuestions();
      await this.saveToFile(`duckchain-questions-${new Date().toISOString().split('T')[0]}.json`);
      
      this.config.lastRun = new Date();
      console.log(`✅ Scheduled scraping completed. Found ${questions.length} questions.`);
      
    } catch (error) {
      console.error('❌ Error in scheduled scraping:', error);
    }
  }

  getScrapingStatus(): ScrapingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async disconnect(): Promise<void> {
    this.stopAutoScraping();
    await this.client.disconnect();
    console.log('🔌 Disconnected from Telegram');
  }
}

export async function scrapeDuckChainQuestions() {
  const scraper = new TelegramScraper(
    parseInt(process.env.TELEGRAM_API_ID || '0'),
    process.env.TELEGRAM_API_HASH || '',
    process.env.TELEGRAM_SESSION_STRING || '',
    {
      enabled: true,
      intervalHours: 168,
      messagesPerGroup: 500,
      groups: ['@DuckChain_io'],
    }
  );

  try {
    await scraper.connect();
    
    scraper.startAutoScraping();
    
    console.log('🤖 Auto-scraping started! The scraper will run every 7 days.');
    console.log('📊 Check the generated JSON files for results.');
    
    process.on('SIGINT', async () => {
      await scraper.disconnect();
      process.exit(0);
    });

  } catch (error) {
    await scraper.disconnect();
  }
}
