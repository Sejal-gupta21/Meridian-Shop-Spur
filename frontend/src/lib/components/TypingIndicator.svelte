<div class="wrapper" aria-label="Agent is typing" aria-live="polite">
  <div class="avatar" aria-hidden="true">🤖</div>
  <div class="bubble">
    <span></span>
    <span></span>
    <span></span>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
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
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    padding: 13px 16px;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  span {
    width: 8px;
    height: 8px;
    background: #9ca3af;
    border-radius: 50%;
    display: inline-block;
    animation: bounce 1.3s ease-in-out infinite;
  }

  span:nth-child(2) {
    animation-delay: 0.2s;
  }

  span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes bounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-6px);
    }
  }
</style>
