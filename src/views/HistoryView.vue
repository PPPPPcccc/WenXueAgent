<template>
  <div class="app-container history-view">
    <MountainDeco />

    <header class="page-header ink-spread-in">
      <h2 class="page-title">回响 · 留声</h2>
      <p class="page-subtitle">所有曾在此留下的话，都被典籍默默收藏。</p>
    </header>

    <section class="filter-bar ink-card ink-spread-in" style="animation-delay: 0.1s;">
      <button
        :class="['filter-btn', { active: !favoritesOnly }]"
        @click="setFilter(false)"
      >
        <span>全部</span>
        <span class="filter-count">{{ totalAll }}</span>
      </button>
      <button
        :class="['filter-btn', { active: favoritesOnly }]"
        @click="setFilter(true)"
      >
        <span>★ 珍藏</span>
        <span class="filter-count">{{ favoritesCount }}</span>
      </button>
      <button class="btn-ghost refresh-btn" @click="load">刷新</button>
      <button class="btn-ghost refresh-btn" @click="onClear" title="清空所有历史（不可恢复）">清空</button>
    </section>

    <p v-if="!items.length" class="empty">尚无记录</p>

    <div class="history-list">
      <article
        v-for="(item, idx) in items"
        :key="item.id"
        class="ink-card history-item ink-spread-in"
        :style="{ animationDelay: `${idx * 0.05}s` }"
      >
        <header class="history-head">
          <div class="head-meta">
            <span class="vermilion-seal">第 {{ formatDate(item.created_at) }}</span>
            <span class="head-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="head-actions">
            <button class="fav-btn" :class="{ on: item.is_favorite }" @click="toggleFav(item)" :title="item.is_favorite ? '取消收藏' : '收藏'">
              {{ item.is_favorite ? '★' : '☆' }}
            </button>
            <button class="del-btn" @click="removeItem(item)" title="删除">×</button>
          </div>
        </header>

        <p class="user-input">"{{ item.user_input }}"</p>

        <div class="ink-divider"></div>

        <section class="history-part">
          <span class="part-tag">壹</span>
          <p>{{ item.part1 }}</p>
        </section>

        <template v-if="getQuotes(item).length">
          <section class="history-part quote-part" v-for="(q, qi) in getQuotes(item)" :key="qi">
            <span class="part-tag" :style="qi === 0 ? '' : 'opacity:0'">{{ qi === 0 ? '贰' : '' }}</span>
            <div class="quote-block">
              <p class="history-quote-text">{{ q.quote }}</p>
              <p class="history-quote-meta">{{ q.interpretation }}</p>
              <p class="history-quote-source">{{ q.source }}</p>
            </div>
          </section>
        </template>

        <p class="model-meta">— 由 {{ item.model || 'qwen-plus' }} 回答 · 本机保存</p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { historyStore } from '@/lib/store'
import MountainDeco from '@/components/MountainDeco.vue'

const items = ref([])
const favoritesOnly = ref(false)
const totalAll = ref(0)
const favoritesCount = ref(0)

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getQuotes(item) {
  if (Array.isArray(item.quotes)) return item.quotes
  // 兼容旧格式
  if (item.part2) return [{ quote: item.part2, source: item.part2_source || '', interpretation: item.part3 || '', matched: null }]
  return []
}

const load = () => {
  items.value = historyStore.list().filter((x) => (favoritesOnly.value ? x.is_favorite : true))
  const all = historyStore.list()
  totalAll.value = all.length
  favoritesCount.value = all.filter((x) => x.is_favorite).length
}

const setFilter = (fav) => {
  favoritesOnly.value = fav
  load()
}

const toggleFav = (item) => {
  historyStore.toggleFavorite(item.id)
  if (favoritesOnly.value && !item.is_favorite) {
    items.value = items.value.filter((x) => x.id !== item.id)
  }
  item.is_favorite = !item.is_favorite
  favoritesCount.value = historyStore.list().filter((x) => x.is_favorite).length
}

const removeItem = (item) => {
  if (!confirm(`确认删除"${item.user_input.slice(0, 12)}..."？`)) return
  historyStore.remove(item.id)
  items.value = items.value.filter((x) => x.id !== item.id)
  totalAll.value = historyStore.list().length
  favoritesCount.value = historyStore.list().filter((x) => x.is_favorite).length
}

const onClear = () => {
  if (!confirm('确认清空所有历史？此操作不可恢复。')) return
  historyStore.clear()
  load()
}

onMounted(load)
</script>

<style scoped>
.history-view { padding-top: 24px; }

.page-header { text-align: center; margin-bottom: 32px; }

.page-title {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.2em;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--ink-40);
  letter-spacing: 0.2em;
  font-style: italic;
}

.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 16px;
  background: transparent;
  color: var(--ink-60);
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.1em;
  transition: all 0.3s var(--ease);
}

.filter-btn:hover { background: var(--paper-dark); }
.filter-btn.active { background: var(--ink-100); color: var(--paper-light); }

.filter-count {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 8px;
  border-radius: 8px;
}

.filter-btn:not(.active) .filter-count {
  background: var(--ink-10);
  color: var(--ink-40);
}

.refresh-btn {
  margin-left: auto;
  padding: 6px 14px;
  font-size: 13px;
}

.empty {
  text-align: center;
  color: var(--ink-40);
  font-style: italic;
  padding: 60px 0;
  letter-spacing: 0.2em;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item { transition: all 0.4s var(--ease); }
.history-item:hover { transform: translateY(-1px); }

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.head-meta { display: flex; align-items: center; gap: 12px; }
.head-time { font-size: 12px; color: var(--ink-40); letter-spacing: 0.1em; }
.head-actions { display: flex; gap: 6px; }

.fav-btn, .del-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--paper-dark);
  color: var(--ink-40);
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.fav-btn:hover, .fav-btn.on { background: rgba(168, 50, 58, 0.1); color: var(--vermilion); }
.del-btn:hover { background: rgba(0, 0, 0, 0.05); color: var(--ink-100); }

.user-input {
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 16px;
  color: var(--ink-100);
  letter-spacing: 0.04em;
  line-height: 1.7;
  margin-bottom: 16px;
}

.history-part {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-80);
}

.history-part p { flex: 1; }

.part-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--paper-dark);
  color: var(--ink-60);
  font-family: 'Noto Serif SC', serif;
  font-size: 12px;
}

.quote-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-quote-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-100);
  border-left: 2px solid var(--vermilion);
  padding-left: 10px;
  line-height: 1.6;
}

.history-quote-meta {
  font-size: 13px;
  color: var(--ink-50);
  font-style: italic;
  padding-left: 22px;
}

.history-quote-source {
  font-size: 11px;
  color: var(--ink-40);
  padding-left: 22px;
  letter-spacing: 0.08em;
}

.insight-part p {
  font-size: 13px;
  color: var(--ink-60);
  font-style: italic;
}

.model-meta {
  margin-top: 12px;
  font-size: 11px;
  color: var(--ink-20);
  letter-spacing: 0.1em;
  text-align: right;
}

@media (max-width: 768px) {
  .page-title { font-size: 24px; letter-spacing: 0.15em; }
  .filter-bar { flex-wrap: wrap; }
  .refresh-btn { margin-left: 0; }
}
</style>
