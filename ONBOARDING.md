# DuckChain Bot Onboarding System

## Overview

The DuckChain bot now includes a comprehensive onboarding system that guides new users through the platform with AI-powered responses and progressive learning levels.

## Flow

### 1. Language Selection
- User starts bot with `/start`
- Chooses preferred language (PT, ES, EN, HI)
- Language preference is stored for the session

### 2. Experience Assessment
After language selection, user is asked:
- **Beginner**: Start guided onboarding
- **Experienced**: Redirect to DuckChain Mini App

### 3. Onboarding Levels

#### Basic Level
- What is DuckChain?
- What are the advantages of using DuckChain?
- What is the purpose of the DuckChain token?

#### Intermediate Level
- How do I create a wallet on DuckChain?
- How do I create and transfer NFTs?

#### Advanced Level
- What is DuckChain's technical infrastructure?

## Features

### AI-Powered Responses
- Uses OpenRouter service with GPT-4o-mini
- Context-aware responses based on question categories
- Responds in user's chosen language

### Progressive Learning
- Three difficulty levels (Basic → Intermediate → Advanced)
- Users can skip questions at any time
- Option to go to Mini App during onboarding

### User State Management
- Tracks user progress through onboarding
- Maintains language preferences
- Handles session management

## Technical Implementation

### Files
- `onboarding-service.ts`: Core onboarding logic
- `translations.ts`: Multilingual support
- `index.ts`: Bot integration
- `openrouter-service.ts`: AI responses

### Key Components

#### OnboardingService
```typescript
class OnboardingService {
  startOnboarding(userId: number): { message: string; keyboard: any }
  handleAnswer(userId: number, answer: string, language: string): Promise<{ message: string; keyboard: any; completed: boolean }>
  isInOnboarding(userId: number): boolean
}
```

#### Question Structure
```typescript
interface OnboardingQuestion {
  id: string;
  category: 'basic' | 'intermediate' | 'advanced';
  question: string;
  context: string;
}
```

## Usage

### For Beginners
1. Select language
2. Choose "I'm a Beginner"
3. Answer questions progressively
4. Complete onboarding to access Mini App

### For Experienced Users
1. Select language
2. Choose "I Already Know"
3. Direct access to Mini App

### During Onboarding
- Answer questions naturally
- Use "Skip Question" to move forward
- Use "Go to Mini App" to exit early

## NFT Integration

### Welcome NFT System
- **When**: After completing onboarding (any level)
- **How**: Random rarity through Chainlink VRF
- **Rarities**: Common (90%), Rare (9%), Legendary (1%)
- **Campaign**: Fixed supply managed by contract owner

### NFT Claim Process
1. User completes onboarding
2. "Claim Welcome NFT" button appears
3. User clicks to participate in campaign
4. Chainlink VRF determines rarity
5. NFT is minted to user's wallet

## Benefits

- **Personalized Experience**: AI adapts responses to user level
- **Multilingual Support**: Full localization
- **Flexible Flow**: Users can exit anytime
- **Progressive Learning**: Builds knowledge systematically
- **Seamless Integration**: Works with existing bot features
- **Fair Distribution**: Random rarity ensures fairness
- **Transparent Process**: Chainlink VRF provides verifiable randomness
