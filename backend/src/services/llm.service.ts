import OpenAI from 'openai';
import { env } from '../config/env';
import { STORE_KNOWLEDGE } from '../config/knowledge';
import type { Message } from '../types';

// Lazy singleton
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    // Gemini exposes an OpenAI-compatible REST API — we just point the SDK at it.
    client = new OpenAI({
      apiKey: env.geminiApiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      timeout: 30_000,
      maxRetries: 1,
    });
  }
  return client;
}

/**
 * Call Gemini via its OpenAI-compatible endpoint and return the assistant reply.
 * Model: gemini-2.5-flash-lite — current low-cost stable model.
 */
export async function generateReply(
  history: Message[],
  userMessage: string,
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: STORE_KNOWLEDGE },
  ];

  for (const msg of history) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const completion = await getClient().chat.completions.create({
    model: 'gemini-2.5-flash-lite',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
}

