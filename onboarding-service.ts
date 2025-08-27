interface OnboardingQuestion {
  id: string;
  category: 'basic' | 'intermediate' | 'advanced';
  question: string;
}

interface UserOnboardingState {
  userId: number;
  currentStep: number;
  category: 'basic' | 'intermediate' | 'advanced';
  completed: boolean;
}

class OnboardingService {
  private userStates: Map<number, UserOnboardingState> = new Map();
  private openRouterService: any;

  constructor(openRouterService: any) {
    this.openRouterService = openRouterService;
  }

  private readonly questions: OnboardingQuestion[] = [
    // Basic Level - Foundation
    {
      id: 'what_is_duckchain',
      category: 'basic',
      question: 'What is DuckChain?'
    },
    {
      id: 'advantages',
      category: 'basic',
      question: 'What are the advantages of using DuckChain?'
    },
    {
      id: 'token_purpose',
      category: 'basic',
      question: 'What is the purpose of the $DUCK token?'
    },
    {
      id: 'telegram_integration',
      category: 'basic',
      question: 'How does DuckChain integrate with Telegram?'
    },
    {
      id: 'mass_adoption',
      category: 'basic',
      question: 'How does DuckChain enable mass adoption?'
    },
    
    // Intermediate Level - Practical Usage
    {
      id: 'create_wallet',
      category: 'intermediate',
      question: 'How do I create a wallet on DuckChain?'
    },
    {
      id: 'transfer_nft',
      category: 'intermediate',
      question: 'How do I create and transfer NFTs?'
    },
    {
      id: 'gas_fees',
      category: 'intermediate',
      question: 'How do gas fees work on DuckChain?'
    },
    {
      id: 'staking',
      category: 'intermediate',
      question: 'How does staking work on DuckChain?'
    },
    {
      id: 'governance',
      category: 'intermediate',
      question: 'How does governance work on DuckChain?'
    },
    
    // Advanced Level - Technical Details
    {
      id: 'infrastructure',
      category: 'advanced',
      question: 'What is DuckChain\'s technical infrastructure?'
    },
    {
      id: 'ai_module',
      category: 'advanced',
      question: 'How does the AI Module work on DuckChain?'
    },
    {
      id: 'cross_chain',
      category: 'advanced',
      question: 'How does cross-chain interoperability work?'
    },
    {
      id: 'security',
      category: 'advanced',
      question: 'What security features does DuckChain have?'
    },
    {
      id: 'developer_tools',
      category: 'advanced',
      question: 'What developer tools are available on DuckChain?'
    }
  ];

  startOnboarding(userId: number): { message: string; keyboard: any } {
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
        keyboard: this.getOnboardingKeyboard()
      };
    }
    
    let message = `🎓 **DuckChain Onboarding - Basic Level**\n\nEscolha uma pergunta para começar:\n\n`;
    
    basicQuestions.forEach((question, index) => {
      message += `${index + 1}. ${question.question}\n`;
    });
    
    return {
      message: message,
      keyboard: this.getQuestionSelectionKeyboard(basicQuestions)
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
    
    let message = `${aiResponse}\n\n🎓 **DuckChain Onboarding - ${userState.category.charAt(0).toUpperCase() + userState.category.slice(1)} Level**\n\nEscolha outra pergunta ou continue:\n\n`;
    currentQuestions.forEach((question, index) => {
      message += `${index + 1}. ${question.question}\n`;
    });
    
    return {
      message: message,
      keyboard: this.getQuestionSelectionKeyboard(currentQuestions),
      completed: false
    };
  }

  private getOnboardingKeyboard(): any {
    return {
      inline_keyboard: [
        [
          { text: '📱 Go to Mini App', callback_data: 'go_miniapp' },
          { text: '⏭️ Skip Question', callback_data: 'skip_question' }
        ]
      ]
    };
  }

  private getQuestionSelectionKeyboard(questions: OnboardingQuestion[]): any {
    const keyboard = [];
    
    questions.forEach((question, index) => {
      keyboard.push([
        { text: `${index + 1}. ${question.question.substring(0, 30)}...`, callback_data: `select_question_${question.id}` }
      ]);
    });
    
    keyboard.push([
      { text: '🚀 Próximo Nível', callback_data: 'next_level' },
      { text: '📱 Go to Mini App', callback_data: 'go_miniapp' }
    ]);
    
    return { inline_keyboard: keyboard };
  }

  private getMiniAppKeyboard(): any {
    return {
      inline_keyboard: [
        [
          { text: '🎁 Claim Welcome NFT', callback_data: 'claim_nft' },
          { text: '🚀 Open DuckChain Mini App', callback_data: 'go_miniapp' }
        ]
      ]
    };
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

    // Get AI response immediately
    const aiResponse = await this.openRouterService.getDuckChainResponse(
      `Question: ${question.question}\nProvide a helpful response based on the official DuckChain documentation.`,
      language
    );

    return {
      message: `🎯 **${question.question}**\n\n${aiResponse}`,
      keyboard: {
        inline_keyboard: [
          [
            { text: '⏭️ Voltar às Perguntas', callback_data: 'back_to_questions' },
            { text: '📱 Go to Mini App', callback_data: 'go_miniapp' }
          ]
        ]
      }
    };
  }

  getUserState(userId: number): UserOnboardingState | undefined {
    return this.userStates.get(userId);
  }

  isInOnboarding(userId: number): boolean {
    return this.userStates.has(userId);
  }
}

module.exports = { OnboardingService };
