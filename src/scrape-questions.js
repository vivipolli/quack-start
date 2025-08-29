require('dotenv/config');
const { TelegramScraper } = require('./telegram-scraper');

async function main() {
  console.log('🦆 DuckChain Question Scraper');
  console.log('==============================\n');

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

  const scraper = new TelegramScraper(
    parseInt(apiId),
    apiHash,
    sessionString
  );

  try {
    await scraper.connect();
    
    const groups = [
      '@duckchain',
      '@duckchain_community', 
      '@duckchain_support'
    ];

    console.log('🔍 Starting scraping process...\n');

    for (const group of groups) {
      console.log(`📱 Scraping ${group}...`);
      await scraper.scrapeGroupMessages(group, 300); 
      console.log(`✅ Completed ${group}\n`);
    }

    console.log('🤖 Analyzing questions...');
    const questions = await scraper.analyzeQuestions();
    
    await scraper.saveToFile('duckchain-questions.json');
    
    console.log('\n🎯 Top 10 Most Frequent Questions:');
    console.log('==================================');
    
    questions.slice(0, 10).forEach((q, i) => {
      const emoji = q.category === 'basic' ? '🟢' : 
                   q.category === 'intermediate' ? '🟡' : '🔴';
      console.log(`${i + 1}. ${emoji} [${q.category.toUpperCase()}] ${q.question}`);
      console.log(`   📊 Frequency: ${q.frequency} times\n`);
    });

    console.log(`📈 Total questions found: ${questions.length}`);
    console.log(`💾 Results saved to: duckchain-questions.json`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await scraper.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
