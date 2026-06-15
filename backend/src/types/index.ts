export type Sender = 'user' | 'ai';

export interface Message {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: Message[];
}
