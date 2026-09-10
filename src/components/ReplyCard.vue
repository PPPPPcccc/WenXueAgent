<template>
  <article class="reply-card ink-card">
    <!-- 壹 · 通用回复 -->
    <section class="reply-part part-1 ink-spread-in">
      <div class="part-header">
        <span class="part-label">壹 · 通用回复</span>
        <span class="part-seal">General</span>
      </div>
      <p class="part-content part1-text">{{ reply.part1 }}</p>
    </section>

    <div class="ink-divider"></div>

    <!-- 贰 · 典籍名句 + 情境解读（选中引用 + 解读一体化） -->
    <section class="reply-part part-2 ink-spread-in" style="animation-delay: 0.1s;">
      <div class="part-header">
        <span class="part-label">贰 · 典籍名句</span>
        <span class="part-seal">Classics</span>
      </div>

      <!-- 选中引用展示 -->
      <div class="selected-quote-wrap" v-if="activeQuote">
        <blockquote class="selected-quote">
          <span class="quote-text">{{ activeQuote.quote }}</span>
        </blockquote>
        <p class="quote-source" v-if="activeQuote.source">
          —— {{ activeQuote.source }}
        </p>
        <!-- 情境解读（紧跟选中引用，位于卡片上方） -->
        <p class="quote-interpretation" v-if="activeQuote.interpretation">
          {{ activeQuote.interpretation }}
        </p>
      </div>
    </section>

    <div class="ink-divider"></div>

    <!-- 叁 · 古人各异（4 卡片切换展示不同古人答案） -->
    <section class="reply-part part-3 ink-spread-in" style="animation-delay: 0.2s;" v-if="reply.quotes && reply.quotes.length">
      <div class="part-header">
        <span class="part-label">叁 · 古人各异</span>
        <span class="part-seal">Plural Answers</span>
      </div>
      <p class="plural-hint" v-if="!hidePluralHint">同一个问题，古人没有同一个答案。</p>
      <div class="quotes-grid">
        <button
          v-for="(q, i) in reply.quotes"
          :key="i"
          class="quote-card-btn"
          :class="{ active: activeIndex === i }"
          @click="activeIndex = i"
          :aria-label="`选择第 ${i + 1} 条名句`"
        >
          <span class="quote-card-book">{{ getBookLabel(q) }}</span>
          <span class="quote-card-preview">{{ q.quote.slice(0, 12) }}{{ q.quote.length > 12 ? '…' : '' }}</span>
        </button>
      </div>
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
import { ref, computed, watch } from 'vue'

const props = defineProps({
  reply: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
  hidePluralHint: { type: Boolean, default: false },
})
defineEmits(['favorite', 'delete'])

// 活跃卡片索引
const activeIndex = ref(0)

// 活跃引用
const activeQuote = computed(() => {
  if (!props.reply.quotes?.length) return null
  return props.reply.quotes[activeIndex.value] || props.reply.quotes[0]
})

// 从 source 中提取书名作为卡片标签
function getBookLabel(q) {
  if (!q.source) return '佚名'
  // 《书名》第X章  → 提取书名
  const m = q.source.match(/《(.+?)》/)
  return m ? m[1] : q.source.split('|')[0].trim()
}

// 切换到新数据时重置索引
watch(() => props.reply, () => { activeIndex.value = 0 }, { immediate: true })
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

/* ===== 选中引用展示 ===== */
.selected-quote-wrap {
  margin-bottom: 0;
}

.selected-quote {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-100);
  position: relative;
  padding: 14px 0 14px 28px;
  border-left: 3px solid var(--vermilion);
  background: linear-gradient(90deg,
    rgba(168, 50, 58, 0.04) 0%,
    transparent 60%);
  margin: 0;
  letter-spacing: 0.08em;
  line-height: 1.6;
}

.selected-quote::before {
  content: "\201C";
  position: absolute;
  left: 8px;
  top: -2px;
  font-size: 36px;
  color: var(--vermilion);
  font-family: 'KaiTi', 'STKaiti', serif;
  line-height: 1;
}

.selected-quote::after {
  content: "\201D";
  position: absolute;
  right: 12px;
  bottom: -4px;
  font-size: 36px;
  color: var(--vermilion);
  font-family: 'KaiTi', 'STKaiti', serif;
  line-height: 1;
}

.quote-text {
  display: block;
  position: relative;
  z-index: 1;
}

.quote-source {
  font-size: 12px;
  color: var(--ink-40);
  text-align: right;
  margin-top: 8px;
  letter-spacing: 0.1em;
}

/* ===== 情境解读（紧跟引用，位于卡片上方） ===== */
.quote-interpretation {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(176, 140, 60, 0.06);
  border-left: 3px solid var(--ochre);
  border-radius: 0 4px 4px 0;
  font-size: 13.5px;
  color: var(--ink-60);
  font-style: italic;
  letter-spacing: 0.04em;
  line-height: 1.75;
}

/* ===== 叁 · 古人各异（4 卡片） ===== */
.plural-hint {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  color: var(--ink-40);
  letter-spacing: 0.15em;
  font-style: italic;
  margin-bottom: 12px;
  text-align: center;
}

.quotes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.quote-card-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  background: var(--paper);
  border: 1.5px solid var(--ink-10);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.25s var(--ease);
  text-align: center;
  gap: 4px;
  min-height: 68px;
  box-shadow: 0 1px 3px rgba(26, 26, 26, 0.05);
}

.quote-card-btn:hover {
  border-color: var(--vermilion-light);
  background: rgba(168, 50, 58, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(168, 50, 58, 0.1);
}

.quote-card-btn.active {
  border-color: var(--vermilion);
  background: rgba(168, 50, 58, 0.07);
  box-shadow:
    0 0 0 1px var(--vermilion),
    0 2px 12px rgba(168, 50, 58, 0.15);
}

.quote-card-btn.active::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--vermilion);
  border-radius: 0 0 2px 2px;
}

.quote-card-book {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-80);
  letter-spacing: 0.1em;
  line-height: 1;
}

.quote-card-btn.active .quote-card-book {
  color: var(--vermilion-dark);
}

.quote-card-preview {
  font-family: 'Noto Serif SC', serif;
  font-size: 11px;
  color: var(--ink-40);
  letter-spacing: 0.04em;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.quote-card-btn.active .quote-card-preview {
  color: var(--ink-60);
}

/* ===== 操作按钮 ===== */
.reply-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .reply-card::after { display: none; }
  .reply-part { padding-right: 0; }
  .selected-quote { font-size: 17px; padding-left: 24px; }
  .quotes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .quote-card-btn { min-height: 60px; }
  .quote-card-book { font-size: 12px; }
  .quote-card-preview { font-size: 10px; }
}
</style>
