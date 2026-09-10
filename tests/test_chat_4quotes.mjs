// test_chat_4quotes.mjs
// 测试新 4-quote 格式的解析和 prompt 构建

import { strict as assert } from 'node:assert'
import {
  parseResponse,
  parseQuotesResponse,
  buildPrompt,
  selectClassics,
} from '../lib/chat.mjs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

let pass = 0, fail = 0
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => {
    pass++
    console.log(`  ✓ ${name}`)
  }).catch(e => {
    fail++
    console.error(`  ✗ ${name}\n    ${e.message}`)
  })
}

;(async () => {
  console.log('\n=== parseResponse：新 4-quote 格式 ===')

  await test('完整 4 句格式', () => {
    const raw = `第一部分-通用回复：考试只是人生一站。
第二部分-典籍名句：
譬如为山，未成一篑｜《论语》子罕章｜比喻坚持
驽马十驾，功在不舍｜《荀子》劝学章｜努力终有回报
野火烧不尽，春风吹又生｜《白居易诗》｜生命力顽强
知之者不如好之者，好之者不如乐之者｜《论语》雍也章｜以学习为乐`
    const r = parseResponse(raw)
    assert.equal(r.success, true)
    assert.equal(r.isNewFormat, true)
    assert.equal(r.reply.part1, '考试只是人生一站。')
    assert.equal(r.reply.quotes.length, 4)
    assert.equal(r.reply.quotes[0].quote, '譬如为山，未成一篑')
    assert.equal(r.reply.quotes[0].source, '《论语》子罕章')
    assert.equal(r.reply.quotes[0].interpretation, '比喻坚持')
  })

  await test('无章节格式（仅《书名》）', () => {
    const raw = `第一部分-通用回复：深呼吸。
第二部分-典籍名句：
三人行必有我师焉｜《论语》｜谦逊`
    const r = parseResponse(raw)
    assert.equal(r.success, true)
    assert.equal(r.reply.quotes.length, 1)
    assert.equal(r.reply.quotes[0].source, '《论语》')
  })

  await test('兼容旧格式（单条名句）', () => {
    const raw = `第一部分-通用回复：深呼吸。
第二部分-典籍名句：譬如为山，未成一篑
第三部分-轻量情境解读："这句话出自《论语》第十九章。坚持。"`
    const r = parseResponse(raw)
    assert.equal(r.success, true)
    assert.equal(r.isNewFormat, false)
    assert.equal(r.reply.quotes.length, 1)
        assert.equal(r.reply.quotes[0].quote, '譬如为山，未成一篑')
  })

  await test('空响应失败', () => {
    const r = parseResponse('')
    assert.equal(r.success, false)
  })

  await test('随机文本失败', () => {
    const r = parseResponse('just some random text')
    assert.equal(r.success, false)
  })

  console.log('\n=== parseQuotesResponse ===')

  await test('4 句解析', () => {
    const raw = `第一部分-通用回复：深呼吸。
第二部分-典籍名句：
床前明月光｜《唐诗》｜月夜
海上生明月｜《唐诗》｜望月
但愿人长久｜《苏轼词》｜祝安
春江潮水｜《唐诗》｜春江`
    const q = parseQuotesResponse(raw, classics)
    assert.equal(q.length, 4)
  })

  await test('解析时反查经典库', () => {
    const raw = `第一部分-通用回复：深呼吸。
第二部分-典籍名句：
学而时习之，不亦说乎｜《论语》｜学习的乐趣`
    const q = parseQuotesResponse(raw, classics)
    assert.equal(q.length, 1)
    assert.ok(q[0].matched)
    assert.equal(q[0].matched.id, 'c_lunyu_xueer_1')
  })

  await test('未匹配经典时 matched 为 null', () => {
    const raw = `第一部分-通用回复：深呼吸。
第二部分-典籍名句：
某个不存在的句子｜《某书》｜解读`
    const q = parseQuotesResponse(raw, classics)
    assert.equal(q.length, 1)
    assert.equal(q[0].matched, null)
  })

  await test('空响应返回 null', () => {
    assert.equal(parseQuotesResponse('', classics), null)
  })

  console.log('\n=== buildPrompt：新格式 ===')

  await test('包含 4 条指令', () => {
    const p = buildPrompt('我很焦虑', classics, 16)
    assert.ok(p.includes('4 条'))
  })

  await test('包含 30 字限制', () => {
    const p = buildPrompt('我很焦虑', classics, 16)
    assert.ok(p.includes('30 个汉字'))
  })

  await test('包含不同作者要求', () => {
    const p = buildPrompt('我很焦虑', classics, 16)
    assert.ok(p.includes('不同作者'))
  })

  await test('包含用户输入', () => {
    const p = buildPrompt('我很焦虑', classics, 16)
    assert.ok(p.includes('我很焦虑'))
  })

  await test('limit=16 时取 16 条候选', () => {
    // 现在只有 26 条，验证 prompt 包含足够候选
    const p = buildPrompt('A', classics, 16)
    const counts = (p.match(/^\d+\. /gm) || []).length
    assert.ok(counts <= 16)
  })

  console.log('\n=== selectClassics：候选数 ===')

  await test('limit=16 时返回最多 16 条', () => {
    const out = selectClassics(classics, '我对未来迷茫', 16)
    assert.ok(out.length <= 16)
  })

  console.log(`\n=== 总结 ===\n通过 ${pass} / 失败 ${fail}\n`)
  process.exit(fail > 0 ? 1 : 0)
})()
