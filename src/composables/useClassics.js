// composables/useClassics.js
// 在所有视图之间共享经典库（初始 + 用户自定义 - 用户删除的）
import { ref, computed } from 'vue'
import { fetchInitialClassics } from '@/api'
import { userClassicsStore } from '@/lib/store'

const initialClassics = ref([])
const loaded = ref(false)
const loading = ref(false)

async function load(force = false) {
  if (loaded.value && !force) return
  loading.value = true
  try {
    initialClassics.value = await fetchInitialClassics()
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
    initialClassics,
    books,
    loading,
    loaded,
    load,
    refresh,
  }
}
