require('dotenv/config');
const { TelegramScraper } = require('./telegram-scraper');

async function startAutoScraper() {
  console.log('🦆 DuckChain Auto-Scraper');
  console.log('========================\n');

  // Verificar variáveis de ambiente
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const sessionString = process.env.TELEGRAM_SESSION_STRING;

  if (!apiId || !apiHash || !sessionString) {
    console.error('❌ Missing environment variables:');
    console.error('TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING');
    console.error('\n📝 How to get them:');
    console.error('1. Go to https://my.telegram.org');
    console.error('2. Create an application');
    console.error('3. Get API ID and API Hash');
    console.error('4. Generate session string');
    return;
  }

  // Configuração do scraping automático
  const scraper = new TelegramScraper(
    parseInt(apiId),
    apiHash,
    sessionString,
    {
      enabled: true,
      intervalHours: 168, // 7 dias (24 * 7)
      messagesPerGroup: 500,
      groups: [
        '@duckchain',
        '@duckchain_community', 
        '@duckchain_support'
      ]
    }
  );

  try {
    console.log('🔗 Connecting to Telegram...');
    await scraper.connect();
    
    console.log('🤖 Starting auto-scraping...');
    scraper.startAutoScraper();
    
    console.log('\n✅ Auto-scraper is now running!');
    console.log('📅 Will scrape every 7 days');
    console.log('📁 Results saved as: duckchain-questions-YYYY-MM-DD.json');
    console.log('⏹️  Press Ctrl+C to stop\n');
    
    // Mostrar status inicial
    const status = scraper.getScrapingStatus();
    console.log('📊 Current Configuration:');
    console.log(`   - Interval: ${status.intervalHours} hours`);
    console.log(`   - Messages per group: ${status.messagesPerGroup}`);
    console.log(`   - Groups: ${status.groups.join(', ')}`);
    console.log(`   - Last run: ${status.lastRun || 'Never'}\n`);
    
    // Manter o processo rodando
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping auto-scraper...');
      await scraper.disconnect();
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Mostrar status a cada hora
    setInterval(() => {
      const currentStatus = scraper.getScrapingStatus();
      console.log(`⏰ Status check: Auto-scraping ${currentStatus.enabled ? 'active' : 'inactive'}`);
    }, 60 * 60 * 1000); // 1 hora

  } catch (error) {
    console.error('❌ Error starting auto-scraper:', error.message);
    await scraper.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  startAutoScraper().catch(console.error);
}

module.exports = { startAutoScraper };
