require('dotenv/config');
import { Telegraf, Markup } from 'telegraf';
import { translations } from './translations';
import { OpenRouterService } from './src/services/openrouter-service';
import { CampanhaService } from './src/services/nft-service';
import { OnboardingService } from './src/services/onboarding-service';
import { TelegramScraper } from './src/telegram-scraper';

import type { Context } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN as string);
const openRouterService = new OpenRouterService();
const campanhaService = new CampanhaService();
const onboardingService = new OnboardingService(openRouterService);

let scraper: any = null;
if (process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH && process.env.TELEGRAM_SESSION_STRING) {
  scraper = new TelegramScraper(
    parseInt(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    process.env.TELEGRAM_SESSION_STRING,
    {
      enabled: true,
      intervalHours: 168,
      messagesPerGroup: 500,
      groups: ['@DuckChain_io']
    }
  );
}

const userLanguages: { [userId: number]: string } = {};

function detectLanguage(text: string): string {
  const langCode = franc(text);
  switch (langCode) {
    case 'por': return 'PT';
    case 'spa': return 'ES';
    case 'eng': return 'EN';
    case 'hin': return 'HI';
    default: return 'EN';
  }
}

let franc: any;
(async () => {
  try {
    const francModule = await import('franc-min');
    franc = francModule.default || francModule;
  } catch (error) {
    franc = () => 'eng';
  }
})();

function getTranslation(key: keyof typeof translations, lang: string): string {
  const translation = translations[key];
  return (translation as any)[lang] || translation.default;
}
bot.start((ctx: Context) => {
  const lang = 'EN';
  ctx.replyWithPhoto({ source: 'PATINHO.jpeg' }, { 
    caption: getTranslation('welcome', lang),
    reply_markup: Markup.inlineKeyboard([
      Markup.button.callback('🇧🇷 Português', 'lang_PT'),
      Markup.button.callback('🇪🇸 Español', 'lang_ES'),
      Markup.button.callback('🇺🇸 English', 'lang_EN'),
      Markup.button.callback('🇮🇳 हिंदी', 'lang_HI')
    ]).reply_markup
  });
});

bot.command('wallet', async (ctx: Context) => {
  const lang = 'EN';
  ctx.reply(getTranslation('walletQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('yesButton', lang), 'create_wallet'),
    Markup.button.callback(getTranslation('laterButton', lang), 'later')
  ]));
});

bot.action('create_wallet', async (ctx: Context) => {
  const lang = 'EN';
  const walletAddress = '0x' + Math.random().toString(16).slice(2, 12) + '...';
  ctx.reply(getTranslation('walletCreated', lang) + walletAddress);
  ctx.reply(getTranslation('nftMinted', lang));
});

bot.action('later', (ctx: Context) => {
  const lang = 'EN';
  ctx.reply(getTranslation('walletLater', lang));
});

bot.action('blockchain_beginner', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingPreparingQuestions', lang));
    
    const onboarding = await onboardingService.startOnboarding(userId, 'blockchain_beginner', lang);
    await ctx.reply(onboarding.message, Markup.inlineKeyboard(onboarding.keyboard.inline_keyboard));
  }
});

bot.action('duckchain_new', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingPreparingQuestions', lang));
    
    const onboarding = await onboardingService.startOnboarding(userId, 'duckchain_new', lang);
    await ctx.reply(onboarding.message, Markup.inlineKeyboard(onboarding.keyboard.inline_keyboard));
  }
});

bot.action('experienced', (ctx: Context) => {
  const lang = ctx.from ? (userLanguages[ctx.from.id] || 'EN') : 'EN';
  ctx.reply(getTranslation('goToMiniApp', lang), Markup.inlineKeyboard([
    [Markup.button.url('🦆 @DuckChain_bot', 'https://t.me/DuckChain_bot')]
  ]));
});

bot.action('go_miniapp', (ctx: Context) => {
  const lang = ctx.from ? (userLanguages[ctx.from.id] || 'EN') : 'EN';
  ctx.reply(getTranslation('goToMiniApp', lang), Markup.inlineKeyboard([
    [Markup.button.url('🦆 @DuckChain_bot', 'https://t.me/DuckChain_bot')]
  ]));
});

bot.action('skip_question', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingPreparingNextQuestion', lang));
    
    const result = await onboardingService.handleAnswer(userId, 'skip', lang);
    await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
  }
});

bot.action(/^select_question_(.+)$/, async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const callbackData = (ctx as any).match?.[1];
    if (callbackData) {
      const lang = userLanguages[userId] || 'EN';
      
      await ctx.replyWithChatAction('typing');
      await ctx.reply(getTranslation('loadingGeneratingResponse', lang));
      
      const result = await onboardingService.selectQuestion(userId, callbackData, lang);
      await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
    }
  }
});

bot.action('back_to_questions', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingLoadingQuestions', lang));
    
    const userState = onboardingService.getUserState(userId);
    if (userState) {
      const questions = onboardingService['questions'].filter((q: any) => q.category === userState.category);
      
      const getTitleKey = (category: string) => {
        switch (category) {
          case 'basic': return 'onboardingTitleBasic';
          case 'intermediate': return 'onboardingTitleIntermediate';
          case 'advanced': return 'onboardingTitleAdvanced';
          default: return 'onboardingTitleBasic';
        }
      };

      let message = `${getTranslation(getTitleKey(userState.category), lang)}\n\n${getTranslation('onboardingDescription', lang)}\n\n`;
      questions.forEach((question: any, index: number) => {
        const { getQuestionText } = require('./src/onboarding-questions');
        message += `${index + 1}. ${getQuestionText(question, lang)}\n`;
      });
      await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions, lang).inline_keyboard));
    }
  }
});

bot.action('next_level', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingLoadingNextLevel', lang));
    
    const userState = onboardingService.getUserState(userId);
    if (userState) {
      if (userState.category === 'basic') {
        userState.category = 'intermediate';
        const questions = onboardingService['questions'].filter((q: any) => q.category === 'intermediate');
        let message = `${getTranslation('onboardingTitleIntermediate', lang)}\n\n${getTranslation('onboardingDescription', lang)}\n\n`;
        questions.forEach((question: any, index: number) => {
          const { getQuestionText } = require('./src/onboarding-questions');
          message += `${index + 1}. ${getQuestionText(question, lang)}\n`;
        });
        await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions, lang).inline_keyboard));
      } else if (userState.category === 'intermediate') {
        userState.category = 'advanced';
        const { getQuestionsByCategory } = require('./src/onboarding-questions');
        const questions = getQuestionsByCategory('advanced');
        let message = `${getTranslation('onboardingTitleAdvanced', lang)}\n\n${getTranslation('onboardingDescription', lang)}\n\n`;
        questions.forEach((question: any, index: number) => {
          const { getQuestionText } = require('./src/onboarding-questions');
          message += `${index + 1}. ${getQuestionText(question, lang)}\n`;
        });
        await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions, lang).inline_keyboard));
      } else {
        userState.completed = true;
        onboardingService['userStates'].delete(userId);
        await ctx.reply(getTranslation('onboardingComplete', lang), Markup.inlineKeyboard([
          [Markup.button.callback(getTranslation('claimWelcomeNFT', lang), 'claim_nft')],
          [Markup.button.url(getTranslation('openDuckChainMiniApp', lang), 'https://duckchain.app')]
        ]));
      }
    }
  }
});

bot.action('start_nft_quiz', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    await ctx.replyWithChatAction('typing');
    await ctx.reply(getTranslation('loadingGeneratingQuizQuestion', lang));
    
    const result = await onboardingService.startNFTQuiz(userId, lang);
    await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
  }
});

bot.action('claim_nft', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    
    try {
      const resultado = await campanhaService.participarCampanha(userId);
      await ctx.reply(resultado.message);
    } catch (error) {
      console.error('Error claiming NFT:', error);
      await ctx.reply('Sorry, there was an error claiming your NFT. Please try again later.');
    }
  }
});

bot.command('status', async (ctx: Context) => {
  const status = campanhaService.getStatusCampanha();
  ctx.reply(status.message);
});

bot.command('scraping', async (ctx: Context) => {
  if (scraper) {
    const status = scraper.getScrapingStatus();
    const message = `📊 Status do Scraping Automático:\n\n` +
      `🔄 Ativo: ${status.enabled ? 'Sim' : 'Não'}\n` +
      `⏰ Intervalo: ${status.intervalHours} horas\n` +
      `📱 Mensagens por grupo: ${status.messagesPerGroup}\n` +
      `👥 Grupos: ${status.groups.join(', ')}\n` +
      `🕐 Última execução: ${status.lastRun ? status.lastRun.toLocaleString('pt-BR') : 'Nunca'}`;
    
    await ctx.reply(message);
  } else {
    await ctx.reply('❌ Scraping automático não configurado.');
  }
});

bot.action('lang_PT', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'PT';
  }
  const lang = 'PT';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    [Markup.button.callback(getTranslation('blockchainBeginnerButton', lang), 'blockchain_beginner')],
    [Markup.button.callback(getTranslation('duckchainNewButton', lang), 'duckchain_new')],
    [Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')]
  ]));
});

bot.action('lang_ES', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'ES';
  }
  const lang = 'ES';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    [Markup.button.callback(getTranslation('blockchainBeginnerButton', lang), 'beginner')],
    [Markup.button.callback(getTranslation('duckchainNewButton', lang), 'duckchain_new')],
    [Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')]
  ]));
});

bot.action('lang_EN', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'EN';
  }
  const lang = 'EN';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    [Markup.button.callback(getTranslation('blockchainBeginnerButton', lang), 'blockchain_beginner')],
    [Markup.button.callback(getTranslation('duckchainNewButton', lang), 'duckchain_new')],
    [Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')]
  ]));
});

bot.action('lang_HI', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'HI';
  }
  const lang = 'HI';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    [Markup.button.callback(getTranslation('blockchainBeginnerButton', lang), 'blockchain_beginner')],
    [Markup.button.callback(getTranslation('duckchainNewButton', lang), 'duckchain_new')],
    [Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')]
  ]));
});

bot.on('text', async (ctx: Context) => {
  if (ctx.message && 'text' in ctx.message && ctx.from) {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const userLang = userLanguages[userId] || detectLanguage(userMessage);
    
    const userState = onboardingService.getUserState(userId);
    if (userState && userState.inQuiz) {
      await ctx.replyWithChatAction('typing');
      await ctx.reply(getTranslation('loadingCheckingAnswer', userLang));
      try {
        const result = await onboardingService.checkQuizAnswer(userId, userMessage, userLang);
        await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
      } catch (error) {
        console.error('Error in quiz:', error);
        await ctx.reply('Sorry, there was an error. Please try again.');
      }
      return;
    }
    
    if (onboardingService.isInOnboarding(userId)) {
      await ctx.replyWithChatAction('typing');
      await ctx.reply(getTranslation('loadingGeneratingResponse', userLang));
      try {
        const result = await onboardingService.handleAnswer(userId, userMessage, userLang);
        await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
      } catch (error) {
        console.error('Error in onboarding:', error);
        await ctx.reply('Sorry, there was an error. Please try again.');
      }
      return;
    }
    
    const fallbackMessage = (translations.messageReceived as any)[userLang] || translations.messageReceived.default;
    await ctx.reply(fallbackMessage);
  }
});

async function initializeAutoScraper() {
  console.log('🔍 Checking scraper configuration...');
  
  if (scraper) {
    console.log('✅ Scraper instance found, initializing...');
    try {
      console.log('🔗 Connecting to Telegram for scraping...');
      await scraper.connect();
      
      console.log('🤖 Starting auto scraping...');
      scraper.startAutoScraping();
      
      console.log('✅ Auto scraping started! It will run every 7 days.');
      
      const status = scraper.getScrapingStatus();
      console.log('📊 Scraping Configuration:');
      console.log(`   - Interval: ${status.intervalHours} hours`);
      console.log(`   - Messages per group: ${status.messagesPerGroup}`);
      console.log(`   - Groups: ${status.groups.join(', ')}`);
      console.log(`   - Last run: ${status.lastRun || 'Never'}\n`);
      
    } catch (error) {
      console.error('❌ Error initializing auto scraping:', error);
    }
  } else {
    console.log('⚠️ Auto scraping not configured. Set the environment variables:');
    console.log('   TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING');
  }
}

async function startServices() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} to start services...`);
      console.log('📡 Connecting to Telegram Bot API...');
      
      await bot.launch();
      console.log('🤖 Bot started successfully!');
      
      console.log('🔍 Checking scraper configuration...');
      await initializeAutoScraper();
      
      console.log('🚀 All services started successfully!');
      break;
      
    } catch (error: any) {
      retryCount++;
      console.error(`❌ Error starting services (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`⏳ Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('❌ Failed to start services after all retries');
        throw error;
      }
    }
  }
}

const http = require('http');
const healthServer = http.createServer((req: any, res: any) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'quack-start-bot',
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
healthServer.listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
});
  
startServices();

process.once('SIGINT', async () => {
  console.log('\n🛑 Shutting down services...');
  if (scraper) {
    await scraper.disconnect();
  }
  bot.stop('SIGINT');
  console.log('👋 Services stopped.');
});

process.once('SIGTERM', async () => {
  console.log('\n🛑 Shutting down services...');
  if (scraper) {
    await scraper.disconnect();
  }
  bot.stop('SIGTERM');
  console.log('👋 Services stopped.');
});
