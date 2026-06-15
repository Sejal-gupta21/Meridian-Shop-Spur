<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { sendMessage, fetchHistory, type Message } from '$lib/api';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let messages: Message[] = [];
  let inputText = '';
  let isLoading = false;
  let sessionId: string | null = null;

  let messagesEl: HTMLElement;
  let inputEl: HTMLInputElement;

  const MAX_LENGTH = 5000;
  const SUGGESTIONS = [
    "What's your return policy?",
    'How much does shipping cost?',
    'What payment methods do you accept?',
    'What are your support hours?',
  ];

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  $: canSend = inputText.trim().length > 0 && !isLoading;
  $: charsLeft = MAX_LENGTH - inputText.length;
  $: showCounter = inputText.length > MAX_LENGTH - 200;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  onMount(async () => {
    const stored = localStorage.getItem('spur_session_id');
    if (stored) {
      sessionId = stored;
      const history = await fetchHistory(stored);
      if (history.length > 0) {
        messages = history;
        await scrollToBottom();
      }
    }
    inputEl?.focus();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  async function scrollToBottom() {
    await tick();
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function makeLocalMessage(
    text: string,
    sender: 'user' | 'ai',
    convId = sessionId ?? '',
  ): Message {
    return {
      id: crypto.randomUUID(),
      conversationId: convId,
      sender,
      text,
      createdAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Send a message
  // ---------------------------------------------------------------------------
  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    inputText = '';

    // Optimistic user message
    const tempMsg = makeLocalMessage(trimmed, 'user');
    messages = [...messages, tempMsg];
    isLoading = true;
    await scrollToBottom();

    try {
      const data = await sendMessage(trimmed, sessionId);

      // Persist session ID on first reply (or if it changed)
      if (data.sessionId !== sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('spur_session_id', sessionId);
        // Patch the optimistic message with the real conversationId
        messages = messages.map((m) =>
          m.id === tempMsg.id ? { ...m, conversationId: sessionId! } : m,
        );
      }

      messages = [...messages, makeLocalMessage(data.reply, 'ai', sessionId!)];
    } catch (err) {
      const errText =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      messages = [...messages, makeLocalMessage(`⚠️ ${errText}`, 'ai')];
    } finally {
      isLoading = false;
      await scrollToBottom();
      inputEl?.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler — Enter sends, Shift+Enter inserts newline
  // ---------------------------------------------------------------------------
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ---------------------------------------------------------------------------
  // Quick-reply suggestion chips
  // ---------------------------------------------------------------------------
  function useSuggestion(text: string) {
    inputText = text;
    handleSend();
  }

  // ---------------------------------------------------------------------------
  // Start a brand-new conversation
  // ---------------------------------------------------------------------------
  function handleNewChat() {
    localStorage.removeItem('spur_session_id');
    sessionId = null;
    messages = [];
    inputEl?.focus();
  }
</script>

<!-- ------------------------------------------------------------------ -->
<!-- Widget shell                                                         -->
<!-- ------------------------------------------------------------------ -->
<div class="widget" role="region" aria-label="Meridian Shop support chat">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <div class="header-avatar" aria-hidden="true">M</div>
      <div class="header-info">
        <span class="store-name">Meridian Shop</span>
        <span class="status">
          <span class="dot" class:pulse={isLoading} aria-hidden="true"></span>
          {isLoading ? 'Typing…' : 'Online'}
        </span>
      </div>
    </div>

    <button
      class="btn-icon"
      on:click={handleNewChat}
      title="Start new conversation"
      aria-label="Start new conversation"
    >
      <!-- Plus icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="17"
        height="17"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </header>

  <!-- Message list -->
  <div class="messages" bind:this={messagesEl} aria-live="polite" aria-atomic="false">
    {#if messages.length === 0}
      <div class="empty">
        <div class="empty-icon" aria-hidden="true">💬</div>
        <p class="empty-title">Hi! I'm the Meridian Shop support assistant.</p>
        <p class="empty-sub">Ask me anything or pick a question below:</p>
        <div class="suggestions">
          {#each SUGGESTIONS as suggestion}
            <button
              class="chip"
              on:click={() => useSuggestion(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      {#each messages as message (message.id)}
        <MessageBubble {message} />
      {/each}
    {/if}

    {#if isLoading}
      <TypingIndicator />
    {/if}
  </div>

  <!-- Input area -->
  <div class="input-area">
    <div class="input-row">
      <input
        bind:this={inputEl}
        bind:value={inputText}
        on:keydown={handleKeydown}
        class="input"
        type="text"
        placeholder="Type your message…"
        maxlength={MAX_LENGTH}
        disabled={isLoading}
        aria-label="Message input"
        autocomplete="off"
      />

      <button
        class="send-btn"
        on:click={handleSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        <!-- Send icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>

    {#if showCounter}
      <p class="char-count" class:warn={charsLeft < 100}>
        {charsLeft} characters remaining
      </p>
    {/if}
  </div>
</div>

<!-- ------------------------------------------------------------------ -->
<!-- Styles                                                               -->
<!-- ------------------------------------------------------------------ -->
<style>
  /* Widget shell */
  .widget {
    display: flex;
    flex-direction: column;
    width: 430px;
    height: 640px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 72px rgba(0, 0, 0, 0.28);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Oxygen, Ubuntu, sans-serif;
  }

  /* ---- Header ---- */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #fff;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .header-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
  }

  .store-name {
    display: block;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.01em;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    opacity: 0.85;
  }

  .dot {
    width: 7px;
    height: 7px;
    background: #4ade80;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.pulse {
    background: #facc15;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }

  .btn-icon {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #fff;
    border-radius: 8px;
    padding: 7px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .btn-icon:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  /* ---- Messages ---- */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f8f9fc;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar {
    width: 4px;
  }

  .messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  /* ---- Empty state ---- */
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 6px;
    padding: 24px;
    color: #4b5563;
  }

  .empty-icon {
    font-size: 42px;
    margin-bottom: 6px;
  }

  .empty-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-sub {
    margin: 0 0 12px;
    font-size: 13px;
    color: #6b7280;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .chip {
    padding: 7px 13px;
    border: 1.5px solid #c4b5fd;
    background: #fff;
    border-radius: 999px;
    color: #4f46e5;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .chip:hover:not(:disabled) {
    background: #ede9fe;
    border-color: #7c3aed;
  }

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---- Input area ---- */
  .input-area {
    border-top: 1px solid #e5e7eb;
    background: #fff;
    padding: 10px 14px 12px;
    flex-shrink: 0;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input {
    flex: 1;
    border: 1.5px solid #e5e7eb;
    border-radius: 24px;
    padding: 10px 16px;
    font-size: 14px;
    outline: none;
    background: #f9fafb;
    color: #111827;
    transition: border-color 0.2s, background 0.2s;
  }

  .input:focus {
    border-color: #6366f1;
    background: #fff;
  }

  .input:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .send-btn {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    border: none;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s, transform 0.1s;
  }

  .send-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: scale(1.06);
  }

  .send-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    transform: none;
  }

  .char-count {
    margin: 4px 0 0;
    font-size: 11px;
    color: #9ca3af;
    text-align: right;
  }

  .char-count.warn {
    color: #dc2626;
    font-weight: 600;
  }

  /* ---- Responsive ---- */
  @media (max-width: 480px) {
    .widget {
      width: 100%;
      height: 100vh;
      border-radius: 0;
    }
  }
</style>
