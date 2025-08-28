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

const onboardingQuestions: OnboardingQuestion[] = [
  // Basic Level - Foundation
  {
    id: 'what_is_duckchain',
    category: 'basic',
    question: {
      PT: 'O que é o DuckChain?',
      ES: '¿Qué es DuckChain?',
      EN: 'What is DuckChain?',
      HI: 'DuckChain क्या है?',
      default: 'What is DuckChain?'
    }
  },
  {
    id: 'advantages',
    category: 'basic',
    question: {
      PT: 'Quais são as vantagens de usar o DuckChain?',
      ES: '¿Cuáles son las ventajas de usar DuckChain?',
      EN: 'What are the advantages of using DuckChain?',
      HI: 'DuckChain का उपयोग करने के क्या फायदे हैं?',
      default: 'What are the advantages of using DuckChain?'
    }
  },
  {
    id: 'token_purpose',
    category: 'basic',
    question: {
      PT: 'Qual é o propósito do token $DUCK?',
      ES: '¿Cuál es el propósito del token $DUCK?',
      EN: 'What is the purpose of the $DUCK token?',
      HI: '$DUCK टोकन का उद्देश्य क्या है?',
      default: 'What is the purpose of the $DUCK token?'
    }
  },
  {
    id: 'telegram_integration',
    category: 'basic',
    question: {
      PT: 'Como o DuckChain se integra com o Telegram?',
      ES: '¿Cómo se integra DuckChain con Telegram?',
      EN: 'How does DuckChain integrate with Telegram?',
      HI: 'DuckChain Telegram के साथ कैसे एकीकृत होता है?',
      default: 'How does DuckChain integrate with Telegram?'
    }
  },
  {
    id: 'mass_adoption',
    category: 'basic',
    question: {
      PT: 'Como o DuckChain permite a adoção em massa?',
      ES: '¿Cómo permite DuckChain la adopción masiva?',
      EN: 'How does DuckChain enable mass adoption?',
      HI: 'DuckChain बड़े पैमाने पर अपनाने को कैसे सक्षम बनाता है?',
      default: 'How does DuckChain enable mass adoption?'
    }
  },
  
  // Intermediate Level - Practical Usage
  {
    id: 'create_wallet',
    category: 'intermediate',
    question: {
      PT: 'Como criar uma carteira no DuckChain?',
      ES: '¿Cómo crear una wallet en DuckChain?',
      EN: 'How do I create a wallet on DuckChain?',
      HI: 'DuckChain पर वॉलेट कैसे बनाएं?',
      default: 'How do I create a wallet on DuckChain?'
    }
  },
  {
    id: 'transfer_nft',
    category: 'intermediate',
    question: {
      PT: 'Como criar e transferir NFTs?',
      ES: '¿Cómo crear y transferir NFTs?',
      EN: 'How do I create and transfer NFTs?',
      HI: 'NFT कैसे बनाएं और ट्रांसफर करें?',
      default: 'How do I create and transfer NFTs?'
    }
  },
  {
    id: 'gas_fees',
    category: 'intermediate',
    question: {
      PT: 'Como funcionam as taxas de gas no DuckChain?',
      ES: '¿Cómo funcionan las tarifas de gas en DuckChain?',
      EN: 'How do gas fees work on DuckChain?',
      HI: 'DuckChain पर gas fees कैसे काम करती हैं?',
      default: 'How do gas fees work on DuckChain?'
    }
  },
  {
    id: 'staking',
    category: 'intermediate',
    question: {
      PT: 'Como funciona o staking no DuckChain?',
      ES: '¿Cómo funciona el staking en DuckChain?',
      EN: 'How does staking work on DuckChain?',
      HI: 'DuckChain पर staking कैसे काम करता है?',
      default: 'How does staking work on DuckChain?'
    }
  },
  {
    id: 'governance',
    category: 'intermediate',
    question: {
      PT: 'Como funciona a governança no DuckChain?',
      ES: '¿Cómo funciona la gobernanza en DuckChain?',
      EN: 'How does governance work on DuckChain?',
      HI: 'DuckChain पर governance कैसे काम करता है?',
      default: 'How does governance work on DuckChain?'
    }
  },
  
  // Advanced Level - Technical Details
  {
    id: 'infrastructure',
    category: 'advanced',
    question: {
      PT: 'Qual é a infraestrutura técnica do DuckChain?',
      ES: '¿Cuál es la infraestructura técnica de DuckChain?',
      EN: 'What is DuckChain\'s technical infrastructure?',
      HI: 'DuckChain की तकनीकी बुनियादी ढांचा क्या है?',
      default: 'What is DuckChain\'s technical infrastructure?'
    }
  },
  {
    id: 'ai_module',
    category: 'advanced',
    question: {
      PT: 'Como funciona o Módulo de IA no DuckChain?',
      ES: '¿Cómo funciona el Módulo de IA en DuckChain?',
      EN: 'How does the AI Module work on DuckChain?',
      HI: 'DuckChain पर AI Module कैसे काम करता है?',
      default: 'How does the AI Module work on DuckChain?'
    }
  },
  {
    id: 'cross_chain',
    category: 'advanced',
    question: {
      PT: 'Como funciona a interoperabilidade entre chains?',
      ES: '¿Cómo funciona la interoperabilidad entre cadenas?',
      EN: 'How does cross-chain interoperability work?',
      HI: 'Cross-chain interoperability कैसे काम करती है?',
      default: 'How does cross-chain interoperability work?'
    }
  },
  {
    id: 'security',
    category: 'advanced',
    question: {
      PT: 'Quais recursos de segurança o DuckChain possui?',
      ES: '¿Qué características de seguridad tiene DuckChain?',
      EN: 'What security features does DuckChain have?',
      HI: 'DuckChain में कौन सी सुरक्षा सुविधाएं हैं?',
      default: 'What security features does DuckChain have?'
    }
  },
  {
    id: 'developer_tools',
    category: 'advanced',
    question: {
      PT: 'Quais ferramentas de desenvolvedor estão disponíveis no DuckChain?',
      ES: '¿Qué herramientas de desarrollador están disponibles en DuckChain?',
      EN: 'What developer tools are available on DuckChain?',
      HI: 'DuckChain पर कौन से developer tools उपलब्ध हैं?',
      default: 'What developer tools are available on DuckChain?'
    }
  }
];

function getQuestionText(question: OnboardingQuestion, language: string): string {
  return question.question[language as keyof typeof question.question] || question.question.default;
}

function getQuestionsByCategory(category: 'basic' | 'intermediate' | 'advanced'): OnboardingQuestion[] {
  return onboardingQuestions.filter(q => q.category === category);
}

function getAllQuestions(): OnboardingQuestion[] {
  return onboardingQuestions;
}

module.exports = { 
  onboardingQuestions, 
  getQuestionText, 
  getQuestionsByCategory, 
  getAllQuestions 
};
