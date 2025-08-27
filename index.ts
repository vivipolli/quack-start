require('dotenv/config');
const { Telegraf, Markup } = require('telegraf');
const { translations } = require('./translations');
const { OpenRouterService } = require('./openrouter-service');
const { CampanhaService } = require('./sorteio-service');
const { OnboardingService } = require('./onboarding-service');

// Type imports for Telegraf
import type { Context } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN as string);
const openRouterService = new OpenRouterService();
const campanhaService = new CampanhaService();
const onboardingService = new OnboardingService(openRouterService);

// Armazenamento de preferências de idioma dos usuários
const userLanguages: { [userId: number]: string } = {};

// Função de detecção de idioma
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

// Dynamic import for franc-min
let franc: any;
(async () => {
  const francModule = await import('franc-min');
  franc = francModule;
})();

// Helper function to get translation based on language
function getTranslation(key: string, lang: string): string {
  const translation = translations[key];
  return translation[lang] || translation.default;
}

// Comando start
bot.start((ctx: Context) => {
  const lang = 'PT'; // Default to Portuguese for start command
  ctx.reply(getTranslation('welcome', lang), Markup.inlineKeyboard([
    Markup.button.callback('🇧🇷 Português', 'lang_PT'),
    Markup.button.callback('🇪🇸 Español', 'lang_ES'),
    Markup.button.callback('🇺🇸 English', 'lang_EN'),
    Markup.button.callback('🇮🇳 हिंदी', 'lang_HI')
  ]));
});

// Comando para criar wallet
bot.command('wallet', async (ctx: Context) => {
  const lang = 'PT'; // Default to Portuguese for wallet command
  ctx.reply(getTranslation('walletQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('yesButton', lang), 'create_wallet'),
    Markup.button.callback(getTranslation('laterButton', lang), 'later')
  ]));
});

// Ações dos botões
bot.action('create_wallet', async (ctx: Context) => {
  const lang = 'PT'; // Default to Portuguese for wallet actions
  // Simulação de criação de wallet
  const walletAddress = '0x' + Math.random().toString(16).slice(2, 12) + '...';
  ctx.reply(getTranslation('walletCreated', lang) + walletAddress);

  // Simulação de mint NFT
  ctx.reply(getTranslation('nftMinted', lang));
});

bot.action('later', (ctx: Context) => {
  const lang = 'PT'; // Default to Portuguese for later action
  ctx.reply(getTranslation('walletLater', lang));
});

// Ações para onboarding
bot.action('beginner', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
    const onboarding = onboardingService.startOnboarding(userId);
    await ctx.reply(onboarding.message, Markup.inlineKeyboard(onboarding.keyboard.inline_keyboard));
  }
});

bot.action('experienced', (ctx: Context) => {
  const lang = ctx.from ? (userLanguages[ctx.from.id] || 'EN') : 'EN';
  ctx.reply(getTranslation('goToMiniApp', lang), Markup.inlineKeyboard([
    [Markup.button.url('🚀 DuckChain Mini App', 'https://duckchain.app')]
  ]));
});

bot.action('go_miniapp', (ctx: Context) => {
  const lang = ctx.from ? (userLanguages[ctx.from.id] || 'EN') : 'EN';
  ctx.reply(getTranslation('goToMiniApp', lang), Markup.inlineKeyboard([
    [Markup.button.url('🚀 DuckChain Mini App', 'https://duckchain.app')]
  ]));
});

bot.action('skip_question', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const lang = userLanguages[userId] || 'EN';
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
      const result = await onboardingService.selectQuestion(userId, callbackData, lang);
      await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
    }
  }
});

bot.action('back_to_questions', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const userState = onboardingService.getUserState(userId);
    if (userState) {
      const questions = onboardingService['questions'].filter((q: any) => q.category === userState.category);
      let message = `🎓 **DuckChain Onboarding - ${userState.category.charAt(0).toUpperCase() + userState.category.slice(1)} Level**\n\nEscolha uma pergunta:\n\n`;
      questions.forEach((question: any, index: number) => {
        message += `${index + 1}. ${question.question}\n`;
      });
      await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions).inline_keyboard));
    }
  }
});

bot.action('next_level', async (ctx: Context) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    const userState = onboardingService.getUserState(userId);
    if (userState) {
      if (userState.category === 'basic') {
        userState.category = 'intermediate';
        const questions = onboardingService['questions'].filter((q: any) => q.category === 'intermediate');
        let message = `🎯 **Intermediate Level**\n\nEscolha uma pergunta:\n\n`;
        questions.forEach((question: any, index: number) => {
          message += `${index + 1}. ${question.question}\n`;
        });
        await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions).inline_keyboard));
      } else if (userState.category === 'intermediate') {
        userState.category = 'advanced';
        const questions = onboardingService['questions'].filter((q: any) => q.category === 'advanced');
        let message = `🚀 **Advanced Level**\n\nEscolha uma pergunta:\n\n`;
        questions.forEach((question: any, index: number) => {
          message += `${index + 1}. ${question.question}\n`;
        });
        await ctx.reply(message, Markup.inlineKeyboard(onboardingService['getQuestionSelectionKeyboard'](questions).inline_keyboard));
      } else {
        userState.completed = true;
        onboardingService['userStates'].delete(userId);
        await ctx.reply('🎉 **Onboarding Complete!**\n\nYou\'re now ready to explore DuckChain!\n\n🎁 Click "Claim Welcome NFT" to receive your welcome NFT!', Markup.inlineKeyboard([
          [Markup.button.callback('🎁 Claim Welcome NFT', 'claim_nft')],
          [Markup.button.url('🚀 Open DuckChain Mini App', 'https://duckchain.app')]
        ]));
      }
    }
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

// Comando para verificar status da campanha
bot.command('status', async (ctx: Context) => {
  const status = campanhaService.getStatusCampanha();
  ctx.reply(status.message);
});

// Ações para seleção de idioma
bot.action('lang_PT', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'PT';
  }
  const lang = 'PT';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('beginnerButton', lang), 'beginner'),
    Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')
  ]));
});

bot.action('lang_ES', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'ES';
  }
  const lang = 'ES';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('beginnerButton', lang), 'beginner'),
    Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')
  ]));
});

bot.action('lang_EN', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'EN';
  }
  const lang = 'EN';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('beginnerButton', lang), 'beginner'),
    Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')
  ]));
});

bot.action('lang_HI', (ctx: Context) => {
  if (ctx.from) {
    userLanguages[ctx.from.id] = 'HI';
  }
  const lang = 'HI';
  ctx.reply(getTranslation('experienceQuestion', lang), Markup.inlineKeyboard([
    Markup.button.callback(getTranslation('beginnerButton', lang), 'beginner'),
    Markup.button.callback(getTranslation('experiencedButton', lang), 'experienced')
  ]));
});

// Resposta com IA OpenRouter
bot.on('text', async (ctx: Context) => {
  if (ctx.message && 'text' in ctx.message && ctx.from) {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const userLang = userLanguages[userId] || detectLanguage(userMessage);
    
    // Check if user is in onboarding
    if (onboardingService.isInOnboarding(userId)) {
      await ctx.replyWithChatAction('typing');
      try {
        const result = await onboardingService.handleAnswer(userId, userMessage, userLang);
        await ctx.reply(result.message, Markup.inlineKeyboard(result.keyboard.inline_keyboard));
      } catch (error) {
        console.error('Error in onboarding:', error);
        await ctx.reply('Sorry, there was an error. Please try again.');
      }
      return;
    }
    
    // No AI response for general messages
    const fallbackMessage = translations.messageReceived[userLang] || translations.messageReceived.default;
    await ctx.reply(fallbackMessage);
  }
});

bot.launch()
  .then(() => {
    console.log('DuckMate rodando em TypeScript 🦆');
  })
  .catch((error: any) => {
    console.error('Erro ao iniciar o bot:', error);
  });
