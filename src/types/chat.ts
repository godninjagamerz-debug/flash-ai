export interface ApiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  [key: string]: any;
}

export interface ApiContent {
  role: 'user' | 'model' | 'system';
  parts: ApiPart[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}