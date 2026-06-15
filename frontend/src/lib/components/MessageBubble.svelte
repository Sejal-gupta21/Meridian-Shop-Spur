<script lang="ts">
  import type { Message } from '$lib/api';

  export let message: Message;

  $: isUser = message.sender === 'user';
  $: isError = message.text.startsWith('⚠️');

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
</script>

<div class="wrapper" class:user={isUser} class:ai={!isUser}>
  {#if !isUser}
    <div class="avatar" aria-hidden="true">🤖</div>
  {/if}

  <div
    class="bubble"
    class:user-bubble={isUser}
    class:ai-bubble={!isUser}
    class:error={isError}
  >
    <p class="text">{message.text}</p>
    <time class="timestamp" datetime={message.createdAt}>
      {formatTime(message.createdAt)}
    </time>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    max-width: 82%;
  }

  .wrapper.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .wrapper.ai {
    align-self: flex-start;
  }

  .avatar {
    width: 30px;
    height: 30px;
    background: #ede9fe;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .bubble {
    padding: 10px 14px;
    border-radius: 18px;
    max-width: 100%;
    word-break: break-word;
  }

  .user-bubble {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .ai-bubble {
    background: #fff;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .ai-bubble.error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .text {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
  }

  .timestamp {
    display: block;
    font-size: 11px;
    opacity: 0.55;
    text-align: right;
  }
</style>
