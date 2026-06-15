const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

/**
 * Send a user message and receive the AI reply.
 * Throws a descriptive Error on any failure.
 */
export async function sendMessage(
  message: string,
  sessionId: string | null,
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;

  try {
    response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...(sessionId ? { sessionId } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Cannot reach the server. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const data = await response.json();
      if (typeof data.error === 'string') message = data.error;
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }

  return response.json() as Promise<ChatResponse>;
}

/**
 * Fetch conversation history for a given sessionId.
 * Returns an empty array on any failure (graceful degradation).
 */
export async function fetchHistory(sessionId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE}/chat/history/${sessionId}`);
    if (!response.ok) return [];
    const data = (await response.json()) as { messages: Message[] };
    return data.messages ?? [];
  } catch {
    return [];
  }
}
