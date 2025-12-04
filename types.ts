export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  CHINESE = 'Mandarin Chinese',
  KOREAN = 'Korean',
  PORTUGUESE = 'Portuguese',
  ARABIC = 'Arabic',
  RUSSIAN = 'Russian',
  HINDI = 'Hindi'
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export interface LiveConfig {
  targetLanguage: Language;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}