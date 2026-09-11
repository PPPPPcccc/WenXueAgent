<template>
  <div class="app-container admin-view">
    <MountainDeco />

    <header class="page-header ink-spread-in">
      <h2 class="page-title">藏书阁</h2>
      <p class="page-subtitle">录典籍，承文脉。</p>
    </header>

    <section class="toolbar ink-card ink-spread-in" style="animation-delay: 0.1s;">
      <select v-model="filterBook" class="ink-select" @change="load">
        <option value="">全部书目</option>
        <option v-for="b in books" :key="b.name" :value="b.name">
          {{ b.name }}（{{ b.count }}）
        </option>
      </select>
      <input
        v-model="keyword"
        @input="onSearchInput"
        placeholder="检索书名/章节/名句/标签..."
        class="ink-input search-input"
      />
      <div class="spacer"></div>
      <button class="btn-ghost" @click="showImporter = !showImporter">
        {{ showImporter ? '收起' : '批量导入' }}
      </button>
      <button class="btn-ghost" @click="openCreator">＋ 新建</button>
      <button class="btn-ghost" @click="exportTxt">导出</button>
    </section>

    <!-- 批量导入区 -->
    <section v-if="showImporter" class="ink-card importer ink-spread-in">
      <h4 class="importer-title">批量导入</h4>
      <p class="importer-hint">
        每行一条：<code>书名|章节|名句|标签1,标签2</code>
      </p>
      <div class="importer-tabs">
        <button :class="['tab-btn', { active: importTab === 'paste' }]" @click="importTab = 'paste'">粘贴文本</button>
        <button :class="['tab-btn', { active: importTab === 'file' }]" @click="importTab = 'file'">上传 TXT 文件</button>
      </div>
      <textarea
        v-if="importTab === 'paste'"
        v-model="importContent"
        rows="8"
        class="ink-textarea"
        placeholder="论语|子罕|譬如为山|坚持&#10;诗经|关雎|关关雎鸠|爱情"
      />
      <div v-else class="file-drop">
        <input ref="fileInput" type="file" accept=".txt,text/plain" @change="onFileSelected" hidden />
        <button class="btn-ghost" @click="$refs.fileInput.click()">选择 TXT 文件</button>
        <span v-if="importFileName" class="file-name">{{ importFileName }}</span>
        <span v-else class="file-hint">支持 UTF-8 编码的 .txt 文件</span>
      </div>
      <div class="importer-actions">
        <button class="btn-ghost" @click="resetImporter">清空</button>
        <button class="btn-ink" :disabled="!canImport || importing" @click="doImport">
          {{ importing ? '导入中…' : '开始导入' }}
        </button>
      </div>
      <p v-if="importResult" class="import-result">{{ importResult }}</p>
    </section>

    <!-- 编辑弹窗 -->
    <div v-if="editorOpen" class="modal-mask" @click.self="closeEditor">
      <div class="modal ink-card ink-spread-in">
        <h3 class="modal-title">{{ editing.id ? '编辑典籍' : '新建典籍' }}</h3>
        <label class="modal-field">
          <span>书名</span>
          <input v-model="editing.book" class="ink-input" />
        </label>
        <label class="modal-field">
          <span>章节</span>
          <input v-model="editing.chapter" class="ink-input" />
        </label>
        <label class="modal-field">
          <span>名句</span>
          <textarea v-model="editing.quote" rows="4" class="ink-textarea" />
        </label>
        <label class="modal-field">
          <span>标签（逗号分隔）</span>
          <input v-model="editing.tagInput" class="ink-input" placeholder="坚持, 学习" />
        </label>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeEditor">取消</button>
          <button class="btn-ink" :disabled="savingEdit" @click="saveEdit">
            {{ savingEdit ? '生成向量中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="!items.length && !loading" class="empty">
      {{ ready ? '未匹配到任何典籍。' : '正在加载典籍库…' }}
    </p>

    <article
      v-for="(item, idx) in items"
      :key="item.id"
      class="ink-card classic-item ink-spread-in"
      :style="{ animationDelay: `${Math.min(idx, 12) * 0.04}s` }"
    >
      <header class="classic-head">
        <h4 class="classic-title">
          <span class="classic-book">{{ item.book }}</span>
          <span class="classic-sep">·</span>
          <span class="classic-chapter">{{ item.chapter }}</span>
        </h4>
        <span class="classic-meta">{{ item.char_count || (item.quote || '').length }}字</span>
      </header>

      <blockquote class="classic-quote">{{ item.quote }}</blockquote>

      <footer class="classic-foot">
        <div class="tag-list">
          <span v-for="t in item.tags" :key="t" class="ink-badge-seal">{{ t }}</span>
        </div>
        <div class="item-actions">
          <button class="btn-ghost-sm" @click="openEditor(item)">编辑</button>
          <button class="btn-ghost-sm danger" @click="deleteItem(item)">删除</button>
        </div>
      </footer>
    </article>

    <div v-if="hasMore && items.length" class="load-more">
      <button class="btn-ghost" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClassics } from '@/composables/useClassics'
import { userClassicsStore } from '@/lib/store'
import { parseText, exportText, makeId } from '@/lib/classics-io'
import { embedTexts } from '@/api'
import MountainDeco from '@/components/MountainDeco.vue'

const { classics, books, load: loadClassics, refresh, allEmbeddings, loadInitialEmbeddings } = useClassics()

const items = ref([])
const keyword = ref('')
const filterBook = ref('')
const offset = ref(0)
const limit = 50
const loading = ref(false)
const ready = ref(false)

const showImporter = ref(false)
const importTab = ref('paste')
const importContent = ref('')
const importFileName = ref('')
const importFileContent = ref('')
const importing = ref(false)
const importResult = ref('')

const editorOpen = ref(false)
const editing = ref({ id: '', book: '', chapter: '', quote: '', tagInput: '' })
const savingEdit = ref(false)   // 保存时是否有 embedding 生成中

const hasMore = computed(() => offset.value < items.value.length || items.value.length === totalFiltered.value)

let searchTimer = null

const filtered = computed(() => {
  let list = classics.value
  if (filterBook.value) list = list.filter((c) => c.book === filterBook.value)
  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    list = list.filter((c) =>
      (c.book || '').toLowerCase().includes(k) ||
      (c.chapter || '').toLowerCase().includes(k) ||
      (c.quote || '').toLowerCase().includes(k) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(k))
    )
  }
  return list
})

const totalFiltered = computed(() => filtered.value.length)

const load = () => {
  offset.value = 0
  items.value = filtered.value.slice(0, limit)
}

const loadMore = () => {
  offset.value += limit
  items.value = filtered.value.slice(0, offset.value + limit)
}

const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 250)
}

const openCreator = () => {
  editing.value = { id: '', book: '', chapter: '', quote: '', tagInput: '' }
  editorOpen.value = true
}

const openEditor = (item) => {
  editing.value = {
    id: item.id,
    book: item.book,
    chapter: item.chapter,
    quote: item.quote,
    tagInput: (item.tags || []).join(', '),
  }
  editorOpen.value = true
}

const closeEditor = () => {
  editorOpen.value = false
}

const saveEdit = async () => {
  const payload = {
    book: editing.value.book.trim(),
    chapter: editing.value.chapter.trim(),
    quote: editing.value.quote.trim(),
    tags: editing.value.tagInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
  }
  if (!payload.book || !payload.chapter || !payload.quote) {
    alert('书名 / 章节 / 名句 必填')
    return
  }
  savingEdit.value = true
  try {
    // 生成这条名句的向量
    let embedding = null
    try {
      const emb = await embedTexts([payload.quote])
      embedding = emb[0] || null
    } catch (err) {
      console.warn('Embedding 生成失败，将无法用于 RAG 向量检索：', err.message)
    }

    const id = editing.value.id || makeId(payload.book, payload.chapter, payload.quote)
    const item = { id, ...payload, char_count: payload.quote.length }
    if (embedding) item._embedding = embedding

    if (editing.value.id) {
      userClassicsStore.update(id, { ...payload, char_count: payload.quote.length })
    } else {
      userClassicsStore.add(item)
    }
    editorOpen.value = false
    refresh()
    load()
  } finally {
    savingEdit.value = false
  }
}

const deleteItem = (item) => {
  if (!confirm(`确认删除 "${item.book}|${item.chapter}|${item.quote.slice(0, 16)}..." ？`)) return
  userClassicsStore.remove(item.id)
  refresh()
  load()
}

const canImport = computed(() => {
  if (importTab.value === 'paste') return importContent.value.trim().length > 0
  return importFileContent.value.length > 0
})

const resetImporter = () => {
  importContent.value = ''
  importFileName.value = ''
  importFileContent.value = ''
  importResult.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const onFileSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  importFileName.value = file.name
  try {
    importFileContent.value = await file.text()
  } catch (err) {
    alert('读取文件失败：' + err.message)
  }
}

const doImport = async () => {
  importing.value = true
  importResult.value = ''
  try {
    const text = importTab.value === 'paste' ? importContent.value : importFileContent.value
    const records = parseText(text)

    // 批量生成 embedding
    let allEmbeddings = null
    try {
      allEmbeddings = await embedTexts(records.map((r) => r.quote))
    } catch (err) {
      console.warn('批量 embedding 生成失败，将跳过向量生成：', err.message)
    }

    let added = 0, skipped = 0
    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const item = { ...rec, char_count: rec.quote.length }
      if (allEmbeddings && allEmbeddings[i]) {
        item._embedding = allEmbeddings[i]
      }
      if (userClassicsStore.add(item)) added++
      else skipped++
    }

    importResult.value = `导入完成：新增 ${added} 条${skipped ? `，跳过重复 ${skipped} 条` : ''}`
    if (!allEmbeddings) {
      importResult.value += '（向量生成失败，向量检索暂不可用）'
    }
    importContent.value = ''
    importFileContent.value = ''
    importFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
    refresh()
    load()
  } catch (err) {
    importResult.value = '导入失败：' + err.message
  } finally {
    importing.value = false
  }
}

const exportTxt = () => {
  const text = exportText(classics.value)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'classics.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const fileInput = ref(null)

onMounted(async () => {
  await loadClassics()
  // 确保初始 embeddings 已加载（供后续新建/导入时参考）
  await loadInitialEmbeddings()
  ready.value = true
  load()
})
</script>

<style scoped>
.admin-view { padding-top: 24px; }

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
  letter-spacing: 0.3em;
  font-style: italic;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 18px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ink-select {
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--paper-dark);
  color: var(--ink-80);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

.search-input {
  max-width: 280px;
  background: var(--paper-dark);
  padding: 8px 12px;
  border-radius: var(--radius);
}

.spacer { flex: 1; }

.importer {
  margin-bottom: 20px;
  border: 1px dashed var(--ink-20);
}

.importer-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  letter-spacing: 0.15em;
  margin-bottom: 8px;
}

.importer-hint {
  font-size: 12px;
  color: var(--ink-40);
  margin-bottom: 12px;
}

.importer-hint code {
  background: var(--paper-dark);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.importer-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--ink-10);
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  color: var(--ink-40);
  font-family: inherit;
  font-size: 13px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.tab-btn:hover { background: var(--paper-dark); }
.tab-btn.active { background: var(--paper-dark); color: var(--ink-100); }

.file-drop {
  background: var(--paper-dark);
  border: 1px dashed var(--ink-20);
  border-radius: var(--radius);
  padding: 28px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-name {
  font-family: 'KaiTi', serif;
  color: var(--ink-100);
  font-size: 14px;
}

.file-hint {
  font-size: 12px;
  color: var(--ink-40);
  font-style: italic;
}

.importer-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.import-result {
  margin-top: 10px;
  font-size: 13px;
  color: var(--ink-60);
  font-style: italic;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 520px;
  background: var(--paper-light);
  z-index: 101;
}

.modal-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  letter-spacing: 0.15em;
  margin-bottom: 16px;
}

.modal-field { display: block; margin-bottom: 14px; }

.modal-field > span {
  display: block;
  font-size: 12px;
  color: var(--ink-60);
  letter-spacing: 0.15em;
  margin-bottom: 4px;
}

.modal-field .ink-input,
.modal-field .ink-textarea {
  background: var(--paper-dark);
  border-radius: var(--radius);
  padding: 8px 12px;
  border-bottom: none;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.empty {
  text-align: center;
  color: var(--ink-40);
  padding: 60px 0;
  font-style: italic;
}

.classic-item { transition: all 0.4s var(--ease); }
.classic-item:hover { transform: translateY(-1px); }

.classic-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.classic-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 500;
}

.classic-book { color: var(--vermilion); letter-spacing: 0.1em; }
.classic-sep { color: var(--ink-20); margin: 0 6px; }
.classic-chapter { color: var(--ink-100); }

.classic-meta {
  font-size: 11px;
  color: var(--ink-40);
  letter-spacing: 0.1em;
}

.classic-quote {
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 15px;
  line-height: 1.85;
  color: var(--ink-100);
  border-left: 2px solid var(--ink-10);
  padding-left: 14px;
  margin: 8px 0 12px;
  letter-spacing: 0.04em;
}

.classic-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.item-actions { display: flex; gap: 6px; }

.btn-ghost-sm {
  background: transparent;
  color: var(--ink-60);
  border: 1px solid var(--ink-20);
  padding: 4px 10px;
  font-size: 12px;
  border-radius: var(--radius);
  letter-spacing: 0.05em;
  transition: all 0.3s var(--ease);
}

.btn-ghost-sm:hover { background: var(--paper-dark); color: var(--ink-100); }
.btn-ghost-sm.danger:hover { color: var(--vermilion); border-color: var(--vermilion); }

.load-more {
  text-align: center;
  margin: 24px 0;
}

@media (max-width: 768px) {
  .page-title { font-size: 24px; letter-spacing: 0.15em; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .spacer { display: none; }
  .search-input { max-width: none; }
}
</style>
