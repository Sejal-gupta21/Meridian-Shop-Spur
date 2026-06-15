<script lang="ts">
  import ChatWidget from '$lib/components/ChatWidget.svelte';
</script>

<svelte:head>
  <title>Meridian Shop — Support</title>
  <meta
    name="description"
    content="Meridian Shop AI support — get instant answers about shipping, returns, and more."
  />
</svelte:head>

<main class="page">
  <ChatWidget />
</main>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
</style>
