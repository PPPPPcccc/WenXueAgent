<template>
  <div class="app-container chat-view">
    <MountainDeco />

    <header class="page-header ink-spread-in">
      <h2 class="page-title">此时 · 此刻</h2>
      <p class="page-subtitle">写下你此刻的心境，典籍自有回应。</p>
    </header>

    <div v-if="!ready" class="loading-state">
      <p>正在加载典籍库…</p>
    </div>

    <!-- 对话列表 -->
    <div class="conversation-list" v-if="messages.length">
      <div v-for="m in messages" :key="m.id" class="turn" :class="m.role">
        <div v-if="m.role === 'user'" class="user-bubble ink-card ink-spread-in">
          <div class="bubble-meta">
            <span class="bubble-label">问</span>
            <span class="bubble-time">{{ formatTime(m.time) }}</span>
          </div>
          <p class="bubble-text">{{ m.content }}</p>
        </div>
        <ReplyCard
          v-else
          :reply="m"
          show-actions
          @favorite="onFavorite"
          @delete="onDelete"
        />
      </div>
    </div>

    <div v-else-if="ready" class="empty-state">
      <div class="empty-illustration">
        <svg viewBox="0 0 200 200" width="120" height="120" aria-hidden="true">
          <path d="M40 120 Q 100 60 160 120" stroke="#6b6b6b" stroke-width="1.5" fill="none" opacity="0.5"/>
          <path d="M60 130 Q 100 90 140 130" stroke="#4a4a4a" stroke-width="1.5" fill="none" opacity="0.7"/>
          <circle cx="100" cy="100" r="3" fill="#a8323a"/>
        </svg>
      </div>
      <p class="empty-text">此处无声，候君落墨。</p>
    </div>

    <!-- 输入区 -->
    <section class="ink-card input-area ink-spread-in" style="margin-top: 32px;">
      <textarea
        v-model="content"
        placeholder="把你的心情写下来……"
        rows="3"
        maxlength="500"
        class="ink-textarea chat-input"
        :disabled="!ready"
        @keydown.meta.enter="onSend"
        @keydown.ctrl.enter="onSend"
      />
      <div class="input-meta">
        <span class="char-counter">{{ content.length }} / 500</span>
        <button
          class="btn-ink send-btn"
          :disabled="!content.trim() || loading || !ready"
          @click="onSend"
        >
          <span v-if="!loading">提笔寄言</span>
          <span v-else>墨润纸上…</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { chatApi } from '@/api'
import { historyStore } from '@/lib/store'
import { useClassics } from '@/composables/useClassics'
import ReplyCard from '@/components/ReplyCard.vue'
import MountainDeco from '@/components/MountainDeco.vue'

const content = ref('')
const loading = ref(false)
const messages = ref([])
const ready = ref(false)

const { load: loadClassics } = useClassics()

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = () => {
  nextTick(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  })
}

const onSend = async () => {
  const text = content.value.trim()
  if (!text || loading.value) return

  const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, time: new Date().toISOString() }
  messages.value.push(userMsg)
  content.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const data = await chatApi.send(text)
    const msg = {
      id: data.id || `a-${Date.now()}`,
      role: 'assistant',
      part1: data.part1,
      quotes: data.quotes || [],
      model: data.model,
      is_favorite: false,
      time: data.created_at || new Date().toISOString(),
    }
    messages.value.push(msg)
    // 同步到历史
    historyStore.add({
      id: msg.id,
      user_input: text,
      part1: msg.part1,
      quotes: msg.quotes,
      model: msg.model,
    })
    scrollToBottom()
  } catch (err) {
    messages.value.push({
      id: `e-${Date.now()}`,
      role: 'assistant',
      part1: '（连接中断，请稍后再试）',
      quotes: [{ quote: '—', source: '', interpretation: err.message || '未知错误', matched: null }],
      model: 'error',
      time: new Date().toISOString(),
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const onFavorite = async (msg) => {
  // 先确保历史里存在这条
  const fav = historyStore.toggleFavorite(msg.id)
  msg.is_favorite = fav
}

const onDelete = (msg) => {
  if (!confirm('确认删除此回响？')) return
  historyStore.remove(msg.id)
  messages.value = messages.value.filter((m) => m.id !== msg.id)
}

onMounted(async () => {
  await loadClassics()
  ready.value = true
})
</script>

<style scoped>
.chat-view { padding-top: 24px; }

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--ink-100);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--ink-40);
  letter-spacing: 0.3em;
  font-style: italic;
}

.loading-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--ink-40);
  letter-spacing: 0.3em;
  font-family: 'KaiTi', 'STKaiti', serif;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
}

.empty-illustration {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 16px;
  color: var(--ink-40);
  letter-spacing: 0.3em;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.turn.user { display: flex; justify-content: flex-end; }

.user-bubble {
  max-width: 80%;
  background: var(--paper-dark);
  border: 1px solid var(--ink-10);
}

.bubble-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
  letter-spacing: 0.15em;
}

.bubble-label {
  color: var(--vermilion);
  font-weight: 600;
}

.bubble-time { color: var(--ink-40); }

.bubble-text {
  font-size: 15px;
  color: var(--ink-100);
  line-height: 1.7;
  letter-spacing: 0.04em;
  white-space: pre-wrap;
  word-break: break-word;
}

.input-area {
  position: sticky;
  bottom: 16px;
  z-index: 2;
  background: var(--paper-light);
  backdrop-filter: blur(8px);
  border: 1px solid var(--ink-10);
  box-shadow: 0 -4px 24px rgba(26, 26, 26, 0.08);
}

.chat-input {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 15px;
  color: var(--ink-100);
  resize: none;
  width: 100%;
  line-height: 1.7;
  padding: 4px 0;
}

.input-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.char-counter {
  font-size: 12px;
  color: var(--ink-40);
  letter-spacing: 0.1em;
}

.send-btn { font-weight: 500; }

@media (max-width: 768px) {
  .user-bubble { max-width: 90%; }
  .page-title { font-size: 24px; letter-spacing: 0.15em; }
}
</style>
