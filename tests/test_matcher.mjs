// test_matcher.mjs
// improved_matcher 的单元测试（不调真实 API）
// 运行：node vercel-app/tests/test_matcher.mjs

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  selectClassics,
  detectThemes,
  RotationLog,
  shuffleInPlace,
  mulberry32,
  djb2,
  matchByQuote,
  tagMatches,
} from '../src/lib/improved_matcher.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

let pass = 0
let fail = 0
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      pass++
      console.log(`  ✓ ${name}`)
    })
    .catch((e) => {
      fail++
      console.error(`  ✗ ${name}\n    ${e.message}`)
    })
}

;(async () => {
  console.log('\n=== 基础工具 ===')

  await test('djb2: 相同输入相同 hash', () => {
    assert.equal(djb2('你好'), djb2('你好'))
    assert.notEqual(djb2('你好'), djb2('再见'))
  })

  await test('mulberry32: 种子确定，0<=x<1', () => {
    const r1 = mulberry32(123)
    const r2 = mulberry32(123)
    for (let i = 0; i < 10; i++) {
      const a = r1(), b = r2()
      assert.equal(a, b)
      assert.ok(a >= 0 && a < 1)
    }
  })

  await test('shuffleInPlace: 同种子同结果，不同种子不同结果', () => {
    const a = [1, 2, 3, 4, 5]
    const b = [1, 2, 3, 4, 5]
    const c = [1, 2, 3, 4, 5]
    shuffleInPlace(a, mulberry32(1))
    shuffleInPlace(b, mulberry32(1))
    shuffleInPlace(c, mulberry32(2))
    assert.deepEqual(a, b)
    assert.notDeepEqual(a, c)
  })

  await test('detectThemes: 关键词→主题映射', () => {
    const themes = detectThemes('我最近很焦虑，工作压力大')
    assert.ok(themes.includes('平和'))
    assert.ok(themes.includes('担当'))
  })

  await test('detectThemes: 空/无关键词返回空', () => {
    assert.deepEqual(detectThemes(''), [])
    assert.deepEqual(detectThemes('今天天气真好'), [])
  })

  await test('tagMatches: 完全匹配 / 包含匹配', () => {
    assert.equal(tagMatches({ tags: ['坚持', '努力'] }, '坚持'), true)
    assert.equal(tagMatches({ tags: ['谦逊'] }, '谦'), true)
    assert.equal(tagMatches({ tags: ['坚持'] }, '平和'), false)
  })

  console.log('\n=== selectClassics 主流程 ===')

  await test('空输入返回 limit 条', () => {
    const out = selectClassics(classics, '', { limit: 8 })
    assert.equal(out.length, 8)
  })

  await test('limit<=0 返回空', () => {
    assert.deepEqual(selectClassics(classics, '你好', { limit: 0 }), [])
    assert.deepEqual(selectClassics(classics, '你好', { limit: -1 }), [])
  })

  await test('空库返回空', () => {
    assert.deepEqual(selectClassics([], '你好'), [])
    assert.deepEqual(selectClassics(null, '你好'), [])
  })

  await test('确定性：同一输入 → 同一候选', () => {
    const a = selectClassics(classics, '今天心情很低落，孤独又难过', { limit: 8 })
    const b = selectClassics(classics, '今天心情很低落，孤独又难过', { limit: 8 })
    assert.deepEqual(a.map((x) => x.id), b.map((x) => x.id))
  })

  await test('多样性：不同输入 → 不同候选顺序（不是完全相同）', () => {
    const a = selectClassics(classics, '我对未来很迷茫', { limit: 8 })
    const b = selectClassics(classics, '我失恋了很痛苦', { limit: 8 })
    const c = selectClassics(classics, '我考试很紧张', { limit: 8 })
    const idsA = a.map((x) => x.id)
    const idsB = b.map((x) => x.id)
    const idsC = c.map((x) => x.id)
    // 三个候选集合至少有差异
    const symDiff = (x, y) => x.filter((i) => !y.includes(i)).length
    assert.ok(symDiff(idsA, idsB) >= 1 || symDiff(idsB, idsC) >= 1)
  })

  await test('书内配额：每本最多 2 条', () => {
    const out = selectClassics(classics, '我不知道该怎么办，迷茫又焦虑', {
      limit: 8,
      perBookQuota: 2,
    })
    const counts = {}
    for (const c of out) counts[c.book] = (counts[c.book] || 0) + 1
    for (const [b, n] of Object.entries(counts)) {
      assert.ok(n <= 2, `书 ${b} 出现 ${n} 条，超出配额`)
    }
  })

  await test('主题命中：关键词触发的标签会被优先选中', () => {
    const out = selectClassics(classics, '我很自卑', { limit: 8 })
    // "自卑" → tags: 谦逊/自信/修养
    const matched = out.filter((c) =>
      (c.tags || []).some((t) => ['谦逊', '自信', '修养'].includes(t))
    )
    assert.ok(matched.length >= 1, '至少应有 1 条命中主题的')
  })

  await test('旋转惩罚：最近用过的会被扣分', () => {
    const log = new RotationLog(10)
    const out1 = selectClassics(classics, '今天下雨', { limit: 8 })
    log.record(out1.map((c) => c.id))
    // 再选一次同样输入
    const out2 = selectClassics(classics, '今天下雨', {
      limit: 8,
      rotationLog: log,
    })
    // 由于确定性，输入相同时打乱顺序相同，但旋转会让 out1 整体扣分
    // out2 应包含一些原本未入选的新条目
    const newIds = out2.filter((c) => !out1.some((x) => x.id === c.id)).map((c) => c.id)
    assert.ok(newIds.length >= 1, `应有至少 1 条新条目取代旧的，实际 ${newIds.length}`)
  })

  await test('旋转：多次调用逐渐展开更多条目', () => {
    const log = new RotationLog(20)
    const seen = new Set()
    const inputs = ['A', 'B', 'C', 'D', 'E', 'F']
    for (let i = 0; i < inputs.length; i++) {
      const out = selectClassics(classics, inputs[i], { limit: 8, rotationLog: log })
      log.record(out.map((c) => c.id))
      for (const c of out) seen.add(c.id)
    }
    assert.ok(seen.size > 8, `6 次调用后应见到超过 8 个不同的 id，实际 ${seen.size}`)
  })

  await test('Regression: 原 26 条下，每个输入都能返回 8 条', () => {
    const inputs = [
      '考试压力好大',
      '失恋了很难过',
      '工作不顺',
      '我很自卑',
      '对未来迷茫',
      '我失败了',
      '好孤独',
      '我很愤怒',
      '每天都好疲惫',
      '我很恐惧未来',
    ]
    for (const inp of inputs) {
      const out = selectClassics(classics, inp, { limit: 8 })
      assert.equal(out.length, 8, `输入 "${inp}" 返回 ${out.length} 条`)
    }
  })

  await test('Regression: 不传 rotation 也兼容', () => {
    const out = selectClassics(classics, '我很难过', { limit: 8, rotationLog: null })
    assert.equal(out.length, 8)
  })

  await test('Regression: 不传 perBookQuota 也兼容', () => {
    const out = selectClassics(classics, '我很难过', { limit: 8 })
    assert.equal(out.length, 8)
  })

  console.log('\n=== matchByQuote ===')

  await test('完整 quote 包含在 part2', () => {
    const c = matchByQuote(classics, '有朋自远方来，不亦乐乎。古人的智慧。')
    assert.ok(c)
    assert.equal(c.book, '论语')
  })

  await test('quote 前 8 字命中（自动跳过子曰:等前缀）', () => {
    // 模拟 LLM 输出："学而时习之确实让人愉悦"
    // 实际 DB 中的 quote 是 "子曰:"学而时习之,不亦说乎" (带前缀和 ASCII 逗号)
    const c = matchByQuote(classics, '学而时习之确实让人愉悦')
    assert.ok(c)
    assert.equal(c.book, '论语')
  })

  await test('quote 4 字片段命中', () => {
    const c = matchByQuote(classics, '学而时习之确实让人愉悦')
    assert.ok(c)
    assert.equal(c.book, '论语')
  })

  await test('无匹配返回 null', () => {
    const c = matchByQuote(classics, '完全不相干的现代白话文')
    assert.equal(c, null)
  })

  console.log('\n=== RotationLog ===')

  await test('基础记录 + 查重', () => {
    const log = new RotationLog(3)
    log.record(['a', 'b'])
    log.record(['b', 'c'])
    // a 是最老的，c 是最新的，b 被移到 c 之前
    assert.deepEqual(log.order, ['a', 'b', 'c'])
    assert.ok(log.getPenalty('c') < log.getPenalty('a'))
  })

  await test('超过 maxSize 自动剔除最老', () => {
    const log = new RotationLog(3)
    log.record(['a', 'b', 'c', 'd'])
    assert.deepEqual(log.order, ['b', 'c', 'd'])
    assert.equal(log.getPenalty('a'), 0)
  })

  console.log(`\n=== 总结 ===\n通过 ${pass} / 失败 ${fail}\n`)
  process.exit(fail > 0 ? 1 : 0)
})()
