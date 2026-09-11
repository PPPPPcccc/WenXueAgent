// store.js
// 用户自定义经典库 + 对话历史的 localStorage 封装
//
// keys:
//   lh_user_classics    : 用户新增/编辑/删除的经典（与初始 classics.json 合并）
//   lh_user_classics_removed : 被用户删除的初始经典 id 集合
//   lh_history          : 对话历史（含收藏）

const KEY_USER_CLASSICS = 'lh_user_classics'
const KEY_REMOVED = 'lh_user_classics_removed'
const KEY_HISTORY = 'lh_history'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('localStorage 写入失败', err)
  }
}

export const userClassicsStore = {
  list() {
    return read(KEY_USER_CLASSICS, [])
  },
  save(list) {
    write(KEY_USER_CLASSICS, list)
  },
  add(item) {
    const list = this.list()
    if (list.some((x) => x.id === item.id)) return false
    list.push(item)
    this.save(list)
    return true
  },
  update(id, patch) {
    const list = this.list()
    const i = list.findIndex((x) => x.id === id)
    if (i < 0) return false
    list[i] = { ...list[i], ...patch }
    this.save(list)
    return true
  },
  remove(id) {
    const list = this.list().filter((x) => x.id !== id)
    this.save(list)
    // 同时记入 removed
    const removed = read(KEY_REMOVED, [])
    if (!removed.includes(id)) {
      removed.push(id)
      write(KEY_REMOVED, removed)
    }
    return true
  },
  removedIds() {
    return read(KEY_REMOVED, [])
  },
}

export const historyStore = {
  list() {
    return read(KEY_HISTORY, [])
  },
  add(item) {
    const list = this.list()
    // 去重：相同 id 不重复保存
    if (list.some((x) => x.id === item.id)) return false
    list.unshift({
      ...item,
      id: item.id || `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: item.created_at || new Date().toISOString(),
      is_favorite: false,
    })
    write(KEY_HISTORY, list.slice(0, 500)) // 最多 500 条
    return true
  },
  toggleFavorite(id) {
    const list = this.list()
    const i = list.findIndex((x) => x.id === id)
    if (i < 0) return false
    list[i].is_favorite = !list[i].is_favorite
    write(KEY_HISTORY, list)
    return list[i].is_favorite
  },
  remove(id) {
    const list = this.list().filter((x) => x.id !== id)
    write(KEY_HISTORY, list)
    return true
  },
  clear() {
    write(KEY_HISTORY, [])
  },
}
