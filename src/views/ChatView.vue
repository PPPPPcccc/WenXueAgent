<template>
  <div class="app-container chat-view">

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

    <!-- 输入区：文档流中位于最新聊天下方，不再 fixed -->
    <section
      class="ink-card input-area ink-spread-in"
    >
      <textarea
        v-model="content"
        placeholder="把你的心情写下来……"
        rows="2"
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
.chat-view {
  padding-top: 24px;
  padding-bottom: 80px;          /* 底部留白，避免贴边 */
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
  min-height: 200px;
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

/* 输入区：文档流中的普通块级元素，位于最新回复下方 */
.input-area {
  margin: 32px auto 0;
  width: calc(100% - 48px);
  max-width: 720px;
  background: var(--paper-light);
  border: 1px solid var(--ink-10);
  box-shadow: 0 -4px 24px rgba(26, 26, 26, 0.08);
  padding: 10px 16px;
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
  margin-top: 6px;
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
