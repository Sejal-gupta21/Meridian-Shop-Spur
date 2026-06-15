import { Router, type Request, type Response } from 'express';
import OpenAI from 'openai';
import { chatMessageSchema, validateBody } from '../middleware/validate';
import {
  getOrCreateConversation,
  saveMessage,
  getConversationMessages,
  getRecentMessages,
} from '../services/conversation.service';
import { generateReply } from '../services/llm.service';
import { env } from '../config/env';

const router = Router();

// Reusable UUID pattern
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// POST /chat/message
// ---------------------------------------------------------------------------
router.post(
  '/message',
  validateBody(chatMessageSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { message, sessionId } = req.body as {
      message: string;
      sessionId?: string;
    };

    try {
      // 1. Resolve (or create) the conversation
      const conversation = getOrCreateConversation(sessionId);

      // 2. Persist the user turn
      saveMessage(conversation.id, 'user', message);

      // 3. Build context window (excludes the message we just saved)
      const history = getRecentMessages(conversation.id, env.maxHistoryMessages);
      const historyWithoutLatest = history.slice(0, -1);

      // 4. Call the LLM
      const reply = await generateReply(historyWithoutLatest, message);

      // 5. Persist the AI turn
      saveMessage(conversation.id, 'ai', reply);

      res.json({ reply, sessionId: conversation.id });
    } catch (error: unknown) {
      console.error('[POST /chat/message]', error);

      if (
        error instanceof OpenAI.APIConnectionError ||
        error instanceof OpenAI.APIConnectionTimeoutError
      ) {
        res.status(503).json({ error: 'Cannot reach AI service. Check your internet connection.' });
        return;
      }

      if (error instanceof OpenAI.APIError) {
        const { status, message } = error;
        console.error(`[LLM] APIError ${status}:`, message);

        if (status === 400) {
          res.status(503).json({ error: `AI rejected the request: ${message}` });
          return;
        }
        if (status === 401 || status === 403) {
          res.status(503).json({
            error:
              'Gemini rejected the API key. The key may be invalid, revoked, or auto-blocked by Google leak protection. Generate a fresh key in AI Studio and keep it only in backend/.env.',
          });
          return;
        }
        if (status === 429) {
          const isQuota = message.toLowerCase().includes('quota');
          res.status(503).json({
            error: isQuota
              ? 'Gemini free quota exceeded. Try again later or check aistudio.google.com.'
              : 'AI is busy. Please try again in a moment.',
          });
          return;
        }
        res.status(503).json({ error: `AI error (${status}): ${message}` });
        return;
      }

      res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
    }
  },
);


// ---------------------------------------------------------------------------
// GET /chat/history/:sessionId
// ---------------------------------------------------------------------------
router.get('/history/:sessionId', (req: Request, res: Response): void => {
  const { sessionId } = req.params;

  if (!UUID_RE.test(sessionId)) {
    res.status(400).json({ error: 'Invalid sessionId format' });
    return;
  }

  try {
    const messages = getConversationMessages(sessionId);
    res.json({ sessionId, messages });
  } catch (error: unknown) {
    console.error('[GET /chat/history]', error);
    res.status(500).json({ error: 'Failed to fetch conversation history.' });
  }
});

export default router;
