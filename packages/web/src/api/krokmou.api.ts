import api from './client';
import type {
  ApiResponse,
  KrokmouConversation,
  KrokmouMessage,
  KrokmouChatResponse,
  KrokmouDocument,
} from '@finthesis/shared';

export async function sendMessage(
  fyId: string,
  message: string,
  conversationId?: string,
): Promise<KrokmouChatResponse> {
  const { data } = await api.post<ApiResponse<KrokmouChatResponse>>(
    `/krokmou/${fyId}/chat`,
    { message, conversationId },
  );
  return data.data!;
}

export async function getConversations(fyId: string): Promise<KrokmouConversation[]> {
  const { data } = await api.get<ApiResponse<KrokmouConversation[]>>(
    `/krokmou/${fyId}/conversations`,
  );
  return data.data!;
}

export async function getMessages(convId: string): Promise<KrokmouMessage[]> {
  const { data } = await api.get<ApiResponse<KrokmouMessage[]>>(
    `/krokmou/conversations/${convId}/messages`,
  );
  return data.data!;
}

export async function deleteConversation(convId: string): Promise<void> {
  await api.delete(`/krokmou/conversations/${convId}`);
}

export async function uploadDocument(fyId: string, file: File): Promise<KrokmouDocument> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ApiResponse<KrokmouDocument>>(
    `/krokmou/${fyId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data!;
}

export async function getDocuments(fyId: string): Promise<KrokmouDocument[]> {
  const { data } = await api.get<ApiResponse<KrokmouDocument[]>>(
    `/krokmou/${fyId}/documents`,
  );
  return data.data!;
}

export async function deleteDocument(docId: string): Promise<void> {
  await api.delete(`/krokmou/documents/${docId}`);
}
