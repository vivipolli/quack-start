import { translations } from './translations';
import { onboardingQuestions, getQuestionText } from './onboarding-questions';
import * as fs from 'fs';

function getTranslation(key: keyof typeof translations, language: string): string {
  const translation = translations[key];
  if (!translation) {
    return key;
  }
  return translation[language as keyof typeof translation] || translation.default || key;
}

interface OnboardingQuestion {
  id: string;
  category: 'basic' | 'intermediate' | 'advanced';
  question: {
    PT: string;
    ES: string;
    EN: string;
    HI: string;
    default: string;
  };
}

interface UserOnboardingState {
  userId: number;
  currentStep: number;
  category: 'basic' | 'intermediate' | 'advanced';
  userType: 'blockchain_beginner' | 'duckchain_new' | 'experienced';
  completed: boolean;
  inQuiz?: boolean;
  quizQuestion?: string | undefined;
  quizAnswer?: string | undefined;
}

class OnboardingService {
  private userStates: Map<number, UserOnboardingState> = new Map();
  private openRouterService: any;

  constructor(openRouterService: any) {
    this.openRouterService = openRouterService;
  }

  private get questions(): OnboardingQuestion[] {
    const fundamentalQuestion = onboardingQuestions.find((q: OnboardingQuestion) => q.id === 'what_is_duckchain');
    
    const dynamicQuestions = this.loadDynamicQuestions();
    
    if (dynamicQuestions.length > 0 && fundamentalQuestion) {
      return [fundamentalQuestion, ...dynamicQuestions];
    } else if (dynamicQuestions.length > 0) {
      return dynamicQuestions;
    }
    
    return onboardingQuestions;
  }



  private loadDynamicQuestions(): OnboardingQuestion[] {
    try {
      const files = fs.readdirSync('.').filter((file: string) => file.startsWith('duckchain-questions-') && file.endsWith('.json'));
      if (files.length === 0) {
        return [];
      }
      
      const latestFile = files.sort().pop();
      if (!latestFile) {
        return [];
      }
      const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      
      return data.questions.map((q: any, index: number) => ({
        id: `dynamic_${index}`,
        category: q.category,
        question: {
          PT: q.question,
          ES: q.question,
          EN: q.question,
          HI: q.question,
          default: q.question
        }
      }));
    } catch (error) {
      console.error('Error loading dynamic questions:', error);
      return [];
    }
  }

  private async translateQuestion(question: string, language: string): Promise<string> {
    if (language === 'EN') {
      return question;
    }
    
    try {
      const translation = await this.openRouterService.chat([
        { 
          role: 'user', 
          content: `Translate this question to ${language === 'PT' ? 'Portuguese' : language === 'ES' ? 'Spanish' : 'Hindi'}. Keep it natural and conversational:\n\n"${question}"` 
        }
      ], 'openai/gpt-4o-mini');
      
      return translation.trim();
    } catch (error) {
      console.error('Error translating question:', error);
      return question;
    }
  }

  async startOnboarding(userId: number, userType: 'blockchain_beginner' | 'duckchain_new' | 'experienced', language: string = 'EN'): Promise<{ message: string; keyboard: any }> {
    const userState: UserOnboardingState = {
      userId,
      currentStep: 0,
      category: 'basic',
      userType,
      completed: false
    };
    
    this.userStates.set(userId, userState);
    
    const basicQuestions = this.questions.filter(q => q.category === 'basic');
    
    if (basicQuestions.length === 0) {
      return {
        message: 'Onboarding not available at the moment.',
        keyboard: this.getOnboardingKeyboard(language)
      };
    }
    
    let message = `🎓 ${getTranslation('onboardingTitleBasic', language)}\n`;
    
    for (const question of basicQuestions) {
      if (question.id.startsWith('dynamic_')) {
        const translatedQuestion = await this.translateQuestion(question.question.EN, language);
        question.question[language as keyof typeof question.question] = translatedQuestion;
      }
    }
    
    basicQuestions.forEach((question, index) => {
      message += `${index + 1}. ${getQuestionText(question, language)}\n`;
    });
    
    return {
      message: message,
      keyboard: this.getQuestionSelectionKeyboard(basicQuestions, language)
    };
  }

  async handleAnswer(userId: number, answer: string, language: string): Promise<{ message: string; keyboard: any; completed: boolean }> {
    const userState = this.userStates.get(userId);
    if (!userState) {
      return {
        message: 'Onboarding session not found. Please start again.',
        keyboard: null,
        completed: false
      };
    }

    let teachingStyle: string;
    
    if (userState.userType === 'blockchain_beginner' && (userState.category === 'basic' || userState.category === 'intermediate')) {
      teachingStyle = 'Use a very didactic and educational language, as if teaching someone who is completely new to blockchain technology. Explain concepts step by step, use simple analogies when helpful, and be very patient and clear. However, always base your response on the official DuckChain documentation.';
    } else {
      teachingStyle = 'Provide a comprehensive response based on the official DuckChain documentation.';
    }

    const aiResponse = await this.openRouterService.getDuckChainResponse(
      `User question: ${answer}\n\nTeaching style: ${teachingStyle}\n\nProvide a helpful response.`,
      language
    );

    const cleanAiResponse = aiResponse.replace(/[#*]/g, '');

    const currentQuestions = this.questions.filter(q => q.category === userState.category);
    
    const getTitleKey = (category: string) => {
      switch (category) {
        case 'basic': return 'onboardingTitleBasic';
        case 'intermediate': return 'onboardingTitleIntermediate';
        case 'advanced': return 'onboardingTitleAdvanced';
        default: return 'onboardingTitleBasic';
      }
    };

    let message = `${cleanAiResponse}\n\n🎓 ${getTranslation(getTitleKey(userState.category), language)}\n\n${getTranslation('onboardingDescription', language)}\n\n`;
    currentQuestions.forEach((question, index) => {
      message += `${index + 1}. ${getQuestionText(question, language)}\n`;
    });
    
    return {
      message: message,
      keyboard: this.getQuestionSelectionKeyboard(currentQuestions, language),
      completed: false
    };
  }

  private getOnboardingKeyboard(language: string = 'EN'): any {
    return {
      inline_keyboard: [
        [
          { text: getTranslation('goMiniAppButton', language), url: 'https://t.me/DuckChain_bot' },
          { text: getTranslation('skipQuestionButton', language), callback_data: 'skip_question' }
        ],
        [
          { text: getTranslation('nftQuizButton', language), callback_data: 'start_nft_quiz' }
        ],
        [
          { text: getTranslation('officialDocsButton', language), url: 'https://diary.duckchain.io/' }
        ]
      ]
    };
  }

  private getQuestionSelectionKeyboard(questions: OnboardingQuestion[], language: string = 'EN'): any {
    const keyboard = [];
    
    questions.forEach((question, index) => {
      const questionText = getQuestionText(question, language);
      const buttonText = questionText.length > 50 
        ? `${index + 1}. ${questionText.substring(0, 47)}...` 
        : `${index + 1}. ${questionText}`;
      
      keyboard.push([
        { text: buttonText, callback_data: `select_question_${question.id}` }
      ]);
    });
    
    keyboard.push([
      { text: getTranslation('nextLevelButton', language), callback_data: 'next_level' },
      { text: getTranslation('goMiniAppButton', language), url: 'https://t.me/DuckChain_bot' }
    ]);
    
    keyboard.push([
      { text: getTranslation('nftQuizButton', language), callback_data: 'start_nft_quiz' }
    ]);
    
    keyboard.push([
      { text: getTranslation('officialDocsButton', language), url: 'https://diary.duckchain.io/' }
    ]);
    
    return { inline_keyboard: keyboard };
  }

  async selectQuestion(userId: number, questionId: string, language: string): Promise<{ message: string; keyboard: any }> {
    const userState = this.userStates.get(userId);
    if (!userState) {
      return {
        message: 'Onboarding session not found. Please start again.',
        keyboard: null
      };
    }

    const question = this.questions.find(q => q.id === questionId);
    if (!question) {
      return {
        message: 'Question not found.',
        keyboard: null
      };
    }

    const questionText = getQuestionText(question, language);

    let teachingStyle: string;
    
    if (userState.userType === 'blockchain_beginner' && (question.category === 'basic' || question.category === 'intermediate')) {
      teachingStyle = 'Use a very didactic and educational language, as if teaching someone who is completely new to blockchain technology. Explain concepts step by step, use simple analogies when helpful, and be very patient and clear. However, always base your response on the official DuckChain documentation.';
    } else {
      teachingStyle = 'Provide a comprehensive response based on the official DuckChain documentation.';
    }

    const aiResponse = await this.openRouterService.getDuckChainResponse(
      `Question: ${questionText}\n\nTeaching style: ${teachingStyle}\n\nProvide a helpful response.`,
      language
    );

    const cleanAiResponse = aiResponse.replace(/[#*]/g, '');

    return {
      message: `🎯 ${questionText}\n\n${cleanAiResponse}`,
              keyboard: {
          inline_keyboard: [
            [
              { text: getTranslation('backToQuestionsButton', language), callback_data: 'back_to_questions' },
              { text: getTranslation('goMiniAppButton', language), url: 'https://t.me/DuckChain_bot' }
            ],
            [
              { text: getTranslation('nftQuizButton', language), callback_data: 'start_nft_quiz' }
            ]
          ]
        }
    };
  }

  async startNFTQuiz(userId: number, language: string): Promise<{ message: string; keyboard: any }> {
    const userState = this.userStates.get(userId);
    if (!userState) {
      return {
        message: 'Session not found. Please start again.',
        keyboard: null
      };
    }

    const quizPrompt = `Generate ONE specific question about DuckChain based ONLY on the official documentation. The question should be:
1. Specific to DuckChain (not generic blockchain questions)
2. Based on the documentation content
3. Have a clear correct answer
4. Be challenging but answerable

Format: Return only the question, nothing else.`;

    const quizQuestion = await this.openRouterService.getDuckChainResponse(quizPrompt, language);
    
    const answerPrompt = `Based on the DuckChain documentation, what is the correct answer to this question: "${quizQuestion}"

Provide only the correct answer, nothing else.`;

    const correctAnswer = await this.openRouterService.getDuckChainResponse(answerPrompt, language);
    
    const cleanQuizQuestion = quizQuestion.replace(/[#*]/g, '');
    const cleanCorrectAnswer = correctAnswer.replace(/[#*]/g, '');
    console.log('correctAnswer', cleanCorrectAnswer);

    userState.inQuiz = true;
    userState.quizQuestion = cleanQuizQuestion;
    userState.quizAnswer = cleanCorrectAnswer;

    return {
      message: `${getTranslation('nftQuizTitle', language)}\n\n${getTranslation('docsRecommendationBefore', language)}\n\n${cleanQuizQuestion}\n\n${getTranslation('nftQuizPrompt', language)}`,
      keyboard: {
        inline_keyboard: [
          [
            { text: getTranslation('officialDocsButton', language), url: 'https://diary.duckchain.io/' }
          ],
          [
            { text: getTranslation('backButton', language), callback_data: 'back_to_questions' },
            { text: getTranslation('goMiniAppButton', language), url: 'https://t.me/DuckChain_bot' }
          ]
        ]
      }
    };
  }

  async checkQuizAnswer(userId: number, userAnswer: string, language: string): Promise<{ message: string; keyboard: any; correct: boolean }> {
    const userState = this.userStates.get(userId);
    if (!userState || !userState.inQuiz || !userState.quizAnswer) {
      return {
        message: 'Quiz session not found.',
        keyboard: null,
        correct: false
      };
    }

    const checkPrompt = `Compare these two answers for a DuckChain question:

User Answer: "${userAnswer}"
Correct Answer: "${userState.quizAnswer}"

Are they essentially the same or very similar in meaning? Respond with only "YES" or "NO".`;

    const aiCheck = await this.openRouterService.getDuckChainResponse(checkPrompt, language);
    const isCorrect = aiCheck.trim().toUpperCase().includes('YES');

    userState.inQuiz = false;
    userState.quizQuestion = undefined;
    userState.quizAnswer = undefined;

    if (isCorrect) {
      return {
        message: `${getTranslation('nftQuizCorrect', language)}\n\n${getTranslation('docsRecommendationAfter', language)}`,
        keyboard: {
          inline_keyboard: [
            [
              { text: getTranslation('officialDocsButton', language), url: 'https://diary.duckchain.io/' }
            ],
            [
              { text: getTranslation('nftQuizReceiveButton', language), callback_data: 'claim_nft' }
            ],
            [
              { text: getTranslation('backButton', language), callback_data: 'back_to_questions' }
            ]
          ]
        },
        correct: true
      };
    } else {
      return {
        message: `${getTranslation('nftQuizIncorrect', language)} "${userState.quizAnswer}"\n\n${getTranslation('nftQuizTryAgain', language)}`,
        keyboard: {
          inline_keyboard: [
            [
              { text: getTranslation('nftQuizTryAgainButton', language), callback_data: 'start_nft_quiz' }
            ],
            [
              { text: getTranslation('backButton', language), callback_data: 'back_to_questions' }
            ]
          ]
        },
        correct: false
      };
    }
  }

  getUserState(userId: number): UserOnboardingState | undefined {
    return this.userStates.get(userId);
  }

  isInOnboarding(userId: number): boolean {
    return this.userStates.has(userId);
  }
}

export { OnboardingService };
