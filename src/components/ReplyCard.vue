<template>
  <article class="reply-card ink-card">
    <section class="reply-part part-1 ink-spread-in">
      <div class="part-header">
        <span class="part-label">壹 · 通用回复</span>
        <span class="part-seal">General</span>
      </div>
      <p class="part-content part1-text">{{ reply.part1 }}</p>
    </section>

    <div class="ink-divider"></div>

    <section class="reply-part part-2 ink-spread-in" style="animation-delay: 0.1s;">
      <div class="part-header">
        <span class="part-label">贰 · 典籍名句</span>
        <span class="part-seal">Classic</span>
      </div>
      <blockquote class="part-content quote">{{ reply.part2 }}</blockquote>
    </section>

    <div class="ink-divider"></div>

    <section class="reply-part part-3 ink-spread-in" style="animation-delay: 0.2s;">
      <div class="part-header">
        <span class="part-label">叁 · 情境解读</span>
        <span class="part-seal">Insight</span>
      </div>
      <p class="part-content part3-text">{{ reply.part3 }}</p>
    </section>

    <div class="reply-actions" v-if="showActions">
      <button class="btn-seal" @click="$emit('favorite', reply)">
        <span v-if="reply.is_favorite">已收藏</span>
        <span v-else>收藏</span>
      </button>
      <button class="btn-ghost" @click="$emit('delete', reply)">删除</button>
    </div>
  </article>
</template>

<script setup>
defineProps({
  reply: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
})
defineEmits(['favorite', 'delete'])
</script>

<style scoped>
.reply-card {
  margin-bottom: 24px;
  position: relative;
}

.reply-card::after {
  content: "";
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: 3px;
  background: linear-gradient(180deg,
    rgba(168, 50, 58, 0.0) 0%,
    rgba(168, 50, 58, 0.15) 30%,
    rgba(168, 50, 58, 0.15) 70%,
    rgba(168, 50, 58, 0.0) 100%);
  pointer-events: none;
}

.reply-part { padding: 8px 28px 8px 8px; }

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.part-label {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  letter-spacing: 0.2em;
  color: var(--ink-60);
}

.part-seal {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--ink-20);
  text-transform: uppercase;
  font-family: serif;
}

.part-content {
  font-family: 'Noto Serif SC', 'KaiTi', 'STKaiti', serif;
  color: var(--ink-100);
  line-height: 1.85;
  letter-spacing: 0.04em;
}

.part1-text { font-size: 15px; }

.part-2 .quote {
  font-size: 19px;
  font-weight: 500;
  color: var(--ink-100);
  position: relative;
  padding: 12px 0 12px 24px;
  border-left: 3px solid var(--vermilion);
  background: linear-gradient(90deg,
    rgba(168, 50, 58, 0.04) 0%,
    transparent 50%);
  margin: 0;
  letter-spacing: 0.08em;
}

.part-2 .quote::before {
  content: "\201C";
  position: absolute;
  left: 8px;
  top: -4px;
  font-size: 32px;
  color: var(--vermilion);
  font-family: 'KaiTi', 'STKaiti', serif;
  line-height: 1;
}

.part-2 .quote::after {
  content: "\201D";
  position: absolute;
  right: 8px;
  bottom: -8px;
  font-size: 32px;
  color: var(--vermilion);
  font-family: 'KaiTi', 'STKaiti', serif;
  line-height: 1;
}

.part3-text {
  font-size: 14px;
  color: var(--ink-60);
  font-style: italic;
}

.reply-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .reply-card::after { display: none; }
  .reply-part { padding-right: 0; }
  .part-2 .quote { font-size: 16px; padding-left: 18px; }
}
</style>
