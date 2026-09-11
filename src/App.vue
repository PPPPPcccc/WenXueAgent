<template>
  <div id="app-root">
    <AppHeader />
    <MountainDeco />

    <!-- 固定背景标题区 -->
    <div class="bg-header" aria-hidden="true">
      <h2 class="bg-title">此时 · 此刻</h2>
      <p class="bg-subtitle">写下你此刻的心境，典籍自有回应。</p>
      <BrushPoetry />
    </div>

    <main>
      <InkFall />
      <InkRipples />
      <router-view v-slot="{ Component }">
        <transition name="fade-up" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
import MountainDeco from '@/components/MountainDeco.vue'
import BrushPoetry from '@/components/BrushPoetry.vue'
import InkFall from '@/components/InkFall.vue'
import InkRipples from '@/components/InkRipples.vue'
</script>

<style>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 固定背景标题区 */
.bg-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  text-align: center;
  padding: 56px 24px 0;
  pointer-events: none;
}

.bg-title {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--ink-100);
  margin-bottom: 8px;
}

.bg-subtitle {
  font-size: 13px;
  color: var(--ink-40);
  letter-spacing: 0.3em;
  font-style: italic;
}

@media (max-width: 768px) {
  .bg-title { font-size: 24px; letter-spacing: 0.15em; }
  .bg-subtitle { font-size: 12px; }
  .bg-header { padding-top: 48px; }
}

main {
  flex: 1;
  position: relative;
}

main::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='400' height='400' filter='url(%23n)' opacity='0.025'/></svg>");
  background-size: 400px 400px;
  z-index: 0;
  opacity: 0.5;
}

.app-footer {
  text-align: center;
  padding: 32px 0 24px;
  color: var(--ink-40);
  font-size: 13px;
  letter-spacing: 0.3em;
  position: relative;
  z-index: 1;
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: opacity 0.4s var(--ease), transform 0.4s var(--ease);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
