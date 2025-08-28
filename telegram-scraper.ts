const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { OpenRouterService } = require('./openrouter-service');

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

class TelegramScraper {
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
    
    // Configuração padrão
    this.config = {
      enabled: false,
      intervalHours: 168, // 7 dias (24 * 7)
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
        .filter((msg: any) => msg.message && msg.message.length > 10) // Filtrar mensagens muito curtas
        .map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          date: new Date(msg.date * 1000),
          userId: msg.senderId?.toString() || '0',
          username: msg.sender?.username
        }));

      this.scrapedMessages = scrapedMessages;
      console.log(`📊 Scraped ${scrapedMessages.length} messages`);
      
      return scrapedMessages;
    } catch (error) {
      console.error('❌ Error scraping messages:', error);
      return [];
    }
  }

  async analyzeQuestions(): Promise<QuestionAnalysis[]> {
    if (this.scrapedMessages.length === 0) {
      console.log('⚠️ No messages to analyze');
      return [];
    }

    console.log('🤖 Analyzing messages for questions...');

    // Extrair perguntas usando regex
    const questionPatterns = [
      /\?$/, // Termina com ?
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
      console.log('⚠️ No questions found in messages');
      return [];
    }

    // Enviar todas as perguntas para IA analisar frequência e categoria
    const analysis = await this.analyzeQuestionsWithAI(potentialQuestions);

    console.log(`📈 Found ${analysis.length} relevant questions`);
    return analysis;
  }



  private async analyzeQuestionsWithAI(potentialQuestions: string[]): Promise<QuestionAnalysis[]> {
    try {
      const questionsList = potentialQuestions.map((question, index) => 
        `${index + 1}. "${question}"`
      ).join('\n');

      // PRIMEIRA CHAMADA: Selecionar perguntas mais frequentes
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

      console.log('🤖 Step 1: Analyzing question frequency...');
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
          console.log(`⚠️ Attempt ${retries}/${maxRetries} failed for frequency analysis`);
          if (retries >= maxRetries) {
            console.error('❌ All retries failed for frequency analysis');
            return potentialQuestions.slice(0, 10).map((question) => ({
              question,
              frequency: 1,
              category: 'intermediate' as const,
              confidence: 0.8
            }));
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }

      let frequentQuestions: any[] = [];
      try {
        let cleanResponse = frequencyResponse.trim();
        
        // Check if response is not JSON (like error messages)
        if (cleanResponse.toLowerCase().includes('desculpe') || 
            cleanResponse.toLowerCase().includes('error') ||
            cleanResponse.toLowerCase().includes('ocorreu um erro')) {
          console.error('❌ AI returned error message instead of JSON');
          console.log('Raw frequency response:', frequencyResponse);
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
        console.error('Error parsing frequency response:', parseError);
        console.log('Raw frequency response:', frequencyResponse);
        return potentialQuestions.slice(0, 10).map((question) => ({
          question,
          frequency: 1,
          category: 'intermediate' as const,
          confidence: 0.8
        }));
      }

      if (frequentQuestions.length === 0) {
        console.log('⚠️ No frequent questions found');
        return potentialQuestions.slice(0, 10).map((question) => ({
          question,
          frequency: 1,
          category: 'intermediate' as const,
          confidence: 0.8
        }));
      }

      // SEGUNDA CHAMADA: Filtrar apenas perguntas educacionais sobre DuckChain
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

      console.log('🤖 Step 2: Filtering educational questions...');
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
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }

      try {
        let cleanResponse = educationalResponse.trim();
        
        // Check if response is not JSON (like error messages)
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
        console.log('Raw educational response:', educationalResponse);
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
    const data = {
      scrapedAt: new Date().toISOString(),
      totalMessages: this.scrapedMessages.length,
      questions: await this.analyzeQuestions()
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved to ${filename}`);
  }

  // Métodos para scraping automático
  startAutoScraping(): void {
    if (this.config.enabled) {
      console.log('🔄 Auto-scraping already running');
      return;
    }

    this.config.enabled = true;
    console.log(`🤖 Starting auto-scraping every ${this.config.intervalHours} hours`);

    // Executar imediatamente
    this.runScheduledScraping();

    // Agendar execução periódica
    this.intervalId = setInterval(() => {
      this.runScheduledScraping();
    }, this.config.intervalHours * 60 * 60 * 1000); // Converter horas para milissegundos
  }

  stopAutoScraping(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.config.enabled = false;
    console.log('⏹️ Auto-scraping stopped');
  }

  private async runScheduledScraping(): Promise<void> {
    try {
      console.log('🕐 Running scheduled scraping...');
      
      // Conectar se necessário
      if (!this.client.connected) {
        await this.connect();
      }

      // Scraping de todos os grupos configurados
      for (const group of this.config.groups) {
        await this.scrapeGroupMessages(group, this.config.messagesPerGroup);
      }

      // Analisar e salvar
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
    console.log('⚙️ Scraping configuration updated');
  }

  async disconnect(): Promise<void> {
    this.stopAutoScraping();
    await this.client.disconnect();
    console.log('🔌 Disconnected from Telegram');
  }
}

// Exemplo de uso
async function scrapeDuckChainQuestions() {
  const scraper = new TelegramScraper(
    parseInt(process.env.TELEGRAM_API_ID || '0'),
    process.env.TELEGRAM_API_HASH || '',
    process.env.TELEGRAM_SESSION_STRING || '',
    {
      enabled: true,
      intervalHours: 168, // 7 days
      messagesPerGroup: 500,
      groups: ['@DuckChain_io'],
    }
  );

  try {
    await scraper.connect();
    
    // Iniciar scraping automático semanal
    scraper.startAutoScraping();
    
    console.log('🤖 Auto-scraping started! The scraper will run every 7 days.');
    console.log('📊 Check the generated JSON files for results.');
    
    // Manter o processo rodando
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping auto-scraping...');
      await scraper.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error in scraping process:', error);
    await scraper.disconnect();
  }
}

module.exports = { TelegramScraper, scrapeDuckChainQuestions };
