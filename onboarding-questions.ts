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
      PT: 'Vantagens do DuckChain',
      ES: 'Ventajas de DuckChain',
      EN: 'DuckChain advantages',
      HI: 'DuckChain के फायदे',
      default: 'DuckChain advantages'
    }
  },
  {
    id: 'token_purpose',
    category: 'basic',
    question: {
      PT: 'Para que serve o token $DUCK?',
      ES: '¿Para qué sirve el token $DUCK?',
      EN: 'What is the $DUCK token for?',
      HI: '$DUCK टोकन किस लिए है?',
      default: 'What is the $DUCK token for?'
    }
  },
  {
    id: 'telegram_integration',
    category: 'basic',
    question: {
      PT: 'Integração com Telegram',
      ES: 'Integración con Telegram',
      EN: 'Telegram integration',
      HI: 'Telegram एकीकरण',
      default: 'Telegram integration'
    }
  },
  {
    id: 'mass_adoption',
    category: 'basic',
    question: {
      PT: 'Como funciona a adoção em massa?',
      ES: '¿Cómo funciona la adopción masiva?',
      EN: 'How does mass adoption work?',
      HI: 'बड़े पैमाने पर अपनाना कैसे काम करता है?',
      default: 'How does mass adoption work?'
    }
  },
  
  // Intermediate Level - Practical Usage
  {
    id: 'create_wallet',
    category: 'intermediate',
    question: {
      PT: 'Como criar uma carteira?',
      ES: '¿Cómo crear una wallet?',
      EN: 'How to create a wallet?',
      HI: 'वॉलेट कैसे बनाएं?',
      default: 'How to create a wallet?'
    }
  },
  {
    id: 'transfer_nft',
    category: 'intermediate',
    question: {
      PT: 'Como criar e transferir NFTs?',
      ES: '¿Cómo crear y transferir NFTs?',
      EN: 'How to create and transfer NFTs?',
      HI: 'NFT कैसे बनाएं और ट्रांसफर करें?',
      default: 'How to create and transfer NFTs?'
    }
  },
  {
    id: 'gas_fees',
    category: 'intermediate',
    question: {
      PT: 'Como funcionam as taxas de gas?',
      ES: '¿Cómo funcionan las tarifas de gas?',
      EN: 'How do gas fees work?',
      HI: 'Gas fees कैसे काम करती हैं?',
      default: 'How do gas fees work?'
    }
  },
  {
    id: 'staking',
    category: 'intermediate',
    question: {
      PT: 'Como funciona o staking?',
      ES: '¿Cómo funciona el staking?',
      EN: 'How does staking work?',
      HI: 'Staking कैसे काम करता है?',
      default: 'How does staking work?'
    }
  },
  {
    id: 'governance',
    category: 'intermediate',
    question: {
      PT: 'Como funciona a governança?',
      ES: '¿Cómo funciona la gobernanza?',
      EN: 'How does governance work?',
      HI: 'Governance कैसे काम करता है?',
      default: 'How does governance work?'
    }
  },
  
  // Advanced Level - Technical Details
  {
    id: 'infrastructure',
    category: 'advanced',
    question: {
      PT: 'Infraestrutura técnica',
      ES: 'Infraestructura técnica',
      EN: 'Technical infrastructure',
      HI: 'तकनीकी बुनियादी ढांचा',
      default: 'Technical infrastructure'
    }
  },
  {
    id: 'ai_module',
    category: 'advanced',
    question: {
      PT: 'Módulo de IA',
      ES: 'Módulo de IA',
      EN: 'AI Module',
      HI: 'AI Module',
      default: 'AI Module'
    }
  },
  {
    id: 'cross_chain',
    category: 'advanced',
    question: {
      PT: 'Interoperabilidade entre chains',
      ES: 'Interoperabilidad entre cadenas',
      EN: 'Cross-chain interoperability',
      HI: 'Cross-chain interoperability',
      default: 'Cross-chain interoperability'
    }
  },
  {
    id: 'security',
    category: 'advanced',
    question: {
      PT: 'Recursos de segurança',
      ES: 'Características de seguridad',
      EN: 'Security features',
      HI: 'सुरक्षा सुविधाएं',
      default: 'Security features'
    }
  },
  {
    id: 'developer_tools',
    category: 'advanced',
    question: {
      PT: 'Ferramentas de desenvolvedor',
      ES: 'Herramientas de desarrollador',
      EN: 'Developer tools',
      HI: 'Developer tools',
      default: 'Developer tools'
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

export { 
  onboardingQuestions, 
  getQuestionText, 
  getQuestionsByCategory, 
  getAllQuestions 
};
