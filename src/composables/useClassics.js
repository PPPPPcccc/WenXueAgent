// composables/useClassics.js
// 在所有视图之间共享经典库（初始 + 用户自定义 - 用户删除的）
import { ref, computed } from 'vue'
import { fetchInitialClassics } from '@/api'
import { userClassicsStore } from '@/lib/store'

const initialClassics = ref([])
const initialEmbeddings = ref(null)   // Float32Array，静态向量库
const loaded = ref(false)
const loading = ref(false)
const embeddingsLoaded = ref(false)

const DIM = 1024

async function loadInitialEmbeddings() {
  if (embeddingsLoaded.value) return
  try {
    const resp = await fetch('/data/classics_embeddings.f16.bin')
    if (!resp.ok) throw new Error('加载 embeddings 失败')
    const buf = await resp.arrayBuffer()
    const u8 = new Uint8Array(buf)
    const u16 = new Uint16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2)
    const f32 = new Float32Array(u16.length)
    for (let i = 0; i < u16.length; i++) {
      const h = u16[i]
      const s = (h & 0x8000) >> 15
      const e = (h & 0x7c00) >> 10
      const f = h & 0x03ff
      if (e === 0) f32[i] = (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024)
      else if (e === 0x1f) f32[i] = f ? NaN : (s ? -Infinity : Infinity)
      else f32[i] = (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024)
    }
    initialEmbeddings.value = f32
    embeddingsLoaded.value = true
  } catch (err) {
    console.error('加载初始 embeddings 失败', err)
    initialEmbeddings.value = null
  }
}

async function load(force = false) {
  if (loaded.value && !force) return
  loading.value = true
  try {
    initialClassics.value = await fetchInitialClassics()
    await loadInitialEmbeddings()
    loaded.value = true
  } catch (err) {
    console.error('加载初始经典库失败', err)
  } finally {
    loading.value = false
  }
}

const allClassics = computed(() => {
  const userItems = userClassicsStore.list()
  const removed = new Set(userClassicsStore.removedIds())
  const base = initialClassics.value.filter((c) => !removed.has(c.id))
  // 用户新增可能与基础库 id 冲突：以基础库为准
  const baseIds = new Set(base.map((c) => c.id))
  const extra = userItems.filter((c) => !baseIds.has(c.id))
  return [...base, ...extra]
})

// 所有激活的 embeddings（Float32Array，按 allClassics 顺序排列）
const allEmbeddings = computed(() => {
  if (!initialEmbeddings.value) return null
  const baseCount = initialClassics.value.length
  const userEmbed = userClassicsStore.embeddings()
  const removed = new Set(userClassicsStore.removedIds())

  // 初始 embeddings：只取未被删除的项
  const activeBaseCount = baseCount - removed.size
  const userCount = userEmbed.length

  const total = activeBaseCount + userCount
  if (total === 0) return null

  const result = new Float32Array(total * DIM)

  // 填入激活的初始项
  let dstBase = 0
  for (let i = 0; i < baseCount; i++) {
    if (removed.has(initialClassics.value[i].id)) continue
    const src = i * DIM
    result.set(initialEmbeddings.value.subarray(src, src + DIM), dstBase * DIM)
    dstBase++
  }

  // 追加用户 embeddings
  for (let i = 0; i < userCount; i++) {
    const emb = userEmbed[i]
    if (!emb) continue
    const flat = Array.isArray(emb) ? emb : []
    for (let j = 0; j < Math.min(flat.length, DIM); j++) {
      result[(dstBase * DIM) + j] = flat[j]
    }
    dstBase++
  }

  return result
})

const books = computed(() => {
  const map = new Map()
  for (const c of allClassics.value) {
    map.set(c.book, (map.get(c.book) || 0) + 1)
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

function refresh() {
  loaded.value = false
  return load()
}

export function useClassics() {
  return {
    classics: allClassics,
    allEmbeddings,          // Float32Array | null，供 RAG 使用
    initialClassics,
    books,
    loading,
    loaded,
    removedIds: userClassicsStore.removedIds,
    load,
    refresh,
    loadInitialEmbeddings,  // 暴露：AdminView 新建/导入时需先调用
  }
}
