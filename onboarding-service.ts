const { translations } = require('./translations');
const { onboardingQuestions, getQuestionText, getQuestionsByCategory } = require('./onboarding-questions');

function getTranslation(key: string, language: string): string {
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
    return onboardingQuestions;
  }

  startOnboarding(userId: number, language: string = 'EN'): { message: string; keyboard: any } {
    const userState: UserOnboardingState = {
      userId,
      currentStep: 0,
      category: 'basic',
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
    
    let message = `🎓 ${getTranslation('onboardingTitle', language)}\n`;
    
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

    // Get AI response for the user's question
    const aiResponse = await this.openRouterService.getDuckChainResponse(
      `User question: ${answer}\nProvide a helpful response based on the official DuckChain documentation.`,
      language
    );

    // Show the same question selection again
    const currentQuestions = this.questions.filter(q => q.category === userState.category);
    
    let message = `${aiResponse}\n\n🎓 ${getTranslation('onboardingTitle', language)}\n\n${getTranslation('onboardingDescription', language)}\n\n`;
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
          { text: getTranslation('goMiniAppButton', language), callback_data: 'go_miniapp' },
          { text: getTranslation('skipQuestionButton', language), callback_data: 'skip_question' }
        ],
        [
          { text: getTranslation('nftQuizButton', language), callback_data: 'start_nft_quiz' }
        ]
      ]
    };
  }

  private getQuestionSelectionKeyboard(questions: OnboardingQuestion[], language: string = 'EN'): any {
    const keyboard = [];
    
    questions.forEach((question, index) => {
      const questionText = getQuestionText(question, language);
      keyboard.push([
        { text: `${index + 1}. ${questionText.substring(0, 30)}...`, callback_data: `select_question_${question.id}` }
      ]);
    });
    
    keyboard.push([
      { text: getTranslation('nextLevelButton', language), callback_data: 'next_level' },
      { text: getTranslation('goMiniAppButton', language), callback_data: 'go_miniapp' }
    ]);
    
    keyboard.push([
      { text: getTranslation('nftQuizButton', language), callback_data: 'start_nft_quiz' }
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

    // Get AI response immediately
    const aiResponse = await this.openRouterService.getDuckChainResponse(
      `Question: ${questionText}\nProvide a helpful response based on the official DuckChain documentation.`,
      language
    );

    return {
      message: `🎯 *${questionText}*\n\n${aiResponse}`,
      keyboard: {
        inline_keyboard: [
          [
            { text: getTranslation('backToQuestionsButton', language), callback_data: 'back_to_questions' },
            { text: getTranslation('goMiniAppButton', language), callback_data: 'go_miniapp' }
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

    // Generate a specific question based on DuckChain documentation
    const quizPrompt = `Generate ONE specific question about DuckChain based ONLY on the official documentation. The question should be:
1. Specific to DuckChain (not generic blockchain questions)
2. Based on the documentation content
3. Have a clear correct answer
4. Be challenging but answerable

Format: Return only the question, nothing else.`;

    const quizQuestion = await this.openRouterService.getDuckChainResponse(quizPrompt, language);
    
    // Generate the correct answer
    const answerPrompt = `Based on the DuckChain documentation, what is the correct answer to this question: "${quizQuestion}"

Provide only the correct answer, nothing else.`;

    const correctAnswer = await this.openRouterService.getDuckChainResponse(answerPrompt, language);
    console.log('correctAnswer', correctAnswer);

    // Update user state
    userState.inQuiz = true;
    userState.quizQuestion = quizQuestion;
    userState.quizAnswer = correctAnswer;

    return {
      message: `${getTranslation('nftQuizTitle', language)}\n\n${quizQuestion}\n\n${getTranslation('nftQuizPrompt', language)}`,
      keyboard: {
        inline_keyboard: [
          [
            { text: getTranslation('backButton', language), callback_data: 'back_to_questions' },
            { text: getTranslation('goMiniAppButton', language), callback_data: 'go_miniapp' }
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

    // Check if answer is correct using AI
    const checkPrompt = `Compare these two answers for a DuckChain question:

User Answer: "${userAnswer}"
Correct Answer: "${userState.quizAnswer}"

Are they essentially the same or very similar in meaning? Respond with only "YES" or "NO".`;

    const aiCheck = await this.openRouterService.getDuckChainResponse(checkPrompt, language);
    const isCorrect = aiCheck.trim().toUpperCase().includes('YES');

    // Reset quiz state
    userState.inQuiz = false;
    userState.quizQuestion = undefined;
    userState.quizAnswer = undefined;

    if (isCorrect) {
      return {
        message: `${getTranslation('nftQuizCorrect', language)}`,
        keyboard: {
          inline_keyboard: [
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

module.exports = { OnboardingService };
