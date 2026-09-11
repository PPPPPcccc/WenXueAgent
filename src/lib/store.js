// store.js
// 用户自定义经典库 + 对话历史的 localStorage 封装
//
// keys:
//   lh_user_classics    : 用户新增/编辑的经典（与初始 classics.json 合并）
//   lh_user_embeddings  : 用户新增典籍对应的 1024 维向量（Float32Array 序列化为 number[]）
//   lh_user_classics_removed : 被用户删除的初始经典 id 集合
//   lh_history          : 对话历史（含收藏）

const KEY_USER_CLASSICS = 'lh_user_classics'
const KEY_USER_EMBEDDINGS = 'lh_user_embeddings'
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

  // 追加新 items（可带 embedding）
  add(item) {
    const list = this.list()
    if (list.some((x) => x.id === item.id)) return false
    list.push(item)
    this.save(list)
    if (item._embedding) {
      this.appendEmbedding(item.id, item._embedding)
      delete item._embedding
    }
    return true
  },

  // 批量添加（供批量导入用，自动对每条调用 add）
  addAll(items) {
    const added = [], skipped = []
    for (const item of items) {
      if (this.add(item)) added.push(item.id)
      else skipped.push(item.id)
    }
    return { added, skipped }
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
    // 从 embeddings 里删除该 id 对应的向量（保持 id→index 对齐）
    this.removeEmbeddingById(id)
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

  // ===== embeddings =====

  // 读取所有用户 embeddings（按 list 顺序排列，每项 1024 维）
  embeddings() {
    return read(KEY_USER_EMBEDDINGS, [])
  },

  // 追加一条 embedding（与 list 末尾对齐）
  appendEmbedding(id, embedding) {
    const emb = this.embeddings()
    // 同时维护 id → index 映射
    const ids = this._embeddingIds()
    if (ids.includes(id)) return  // 已存在则不追加
    const map = read(KEY_USER_EMBEDDINGS + '_ids', [])
    map.push(id)
    write(KEY_USER_EMBEDDINGS + '_ids', map)
    emb.push(embedding)
    write(KEY_USER_EMBEDDINGS, emb)
  },

  // 根据 id 删除对应 embedding（保持列表顺序稳定）
  removeEmbeddingById(id) {
    const ids = read(KEY_USER_EMBEDDINGS + '_ids', [])
    const idx = ids.indexOf(id)
    if (idx < 0) return
    const emb = this.embeddings()
    ids.splice(idx, 1)
    emb.splice(idx, 1)
    write(KEY_USER_EMBEDDINGS + '_ids', ids)
    write(KEY_USER_EMBEDDINGS, emb)
  },

  // 获取 id → index 映射
  _embeddingIds() {
    return read(KEY_USER_EMBEDDINGS + '_ids', [])
  },

  // 把外部加载的 embeddings 数组（Float32Array 序列化后的 number[][]）
  // 注入到 store（供 useClassics 初始化时调用）
  loadEmbeddings(embeddingsArray, idsArray) {
    write(KEY_USER_EMBEDDINGS, embeddingsArray)
    write(KEY_USER_EMBEDDINGS + '_ids', idsArray || [])
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
