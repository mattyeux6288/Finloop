export interface KrokmouConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface KrokmouMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface KrokmouChatRequest {
  conversationId?: string;
  message: string;
}

export interface KrokmouChatResponse {
  conversationId: string;
  assistantMessage: string;
}

export interface KrokmouDocument {
  id: string;
  filename: string;
  page_count: number | null;
  uploaded_at: string;
}
