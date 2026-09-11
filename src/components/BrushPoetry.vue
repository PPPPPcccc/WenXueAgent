<template>
  <!-- 狂草 · 随机诗句循环书写：与 MountainDeco 同字体栈 -->
  <div class="brush-poetry" aria-hidden="true">
    <div
      v-if="currentLine"
      :key="currentKey"
      ref="lineEl"
      class="brush-line"
      :style="{ '--tilt': `${tilt}deg`, '--y': `${y}px` }"
    >{{ currentLine }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// 全部经过 LiuJianMaoCao 子集字体覆盖验证
const POEMS = [
  '月落乌啼霜满天', '江枫渔火对愁眠', '孤帆远影碧空尽', '惟见长江天际流',
  '春风又绿江南岸', '明月何时照我还', '江畔何人初见月', '江月何年初照人',
  '人生若只如初见', '此心安处是吾乡', '一蓑烟雨任平生', '大江东去浪淘尽',
  '千古风流人物', '行到水穷处', '坐看云起时', '落霞与孤鹜齐飞',
  '秋水共长天一色', '云山墨月风清远静', '月明如水照书人', '墨淡意自深',
  '心如止水月如霜', '墨色千年月一轮', '山色有无中', '山间明月江上风',
]

const currentLine = ref('')
const currentKey = ref(0)
const lineEl = ref(null)
let tilt = 0
let y = 0
let cancelled = false

function pickPoem() {
  let next = POEMS[Math.floor(Math.random() * POEMS.length)]
  while (next === currentLine.value) {
    next = POEMS[Math.floor(Math.random() * POEMS.length)]
  }
  return next
}

// 等待新 DOM 挂载完成（在 :key 变更后下一帧）
function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function playLine(line) {
  if (cancelled) return
  // 等 Vue 真正把新元素挂到 DOM 上
  await nextFrame()
  const el = lineEl.value
  if (!el || cancelled) return

  const FADE_IN  = 360
  const STROKE   = 1700
  const HOLD     = 1500
  const FADE_OUT = 1300
  const GAP      = 700

  // 淡入
  const a1 = el.animate(
    [{ opacity: 0 }, { opacity: 0.85 }],
    { duration: FADE_IN, fill: 'forwards', easing: 'ease-out' }
  )

  // 笔锋扫过
  const a2 = el.animate(
    [
      { clipPath: 'inset(-12% 100% -12% -12%)' },
      { clipPath: 'inset(-12% -12% -12% -12%)' },
    ],
    { duration: STROKE, fill: 'forwards', easing: 'cubic-bezier(0.45, 0, 0.25, 1)' }
  )

  await sleep(FADE_IN + STROKE + HOLD)
  if (cancelled) return

  // 淡出
  const a3 = el.animate(
    [{ opacity: 0.85 }, { opacity: 0 }],
    { duration: FADE_OUT, fill: 'forwards' }
  )

  await sleep(FADE_OUT + GAP)
}

async function cycle() {
  while (!cancelled) {
    const line = pickPoem()
    tilt = -3 + Math.random() * 6         // 微旋转 ±3°
    y = -8 + Math.random() * 16           // 微位移 ±8px
    currentLine.value = line
    currentKey.value++                     // 强制 :key 变更 → 新 div 挂载
    await playLine(line)
  }
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    // 不动效：只静态显示一句
    currentLine.value = POEMS[0]
    currentKey.value++
    return
  }
  // 进入页面前 1.2s 稍等，让主标题先安定
  setTimeout(() => { cycle() }, 1200)
})

onBeforeUnmount(() => { cancelled = true })
</script>

<style scoped>
/* 与 MountainDeco 的 ink-chars-bg span 完全相同的字体栈 */
.brush-poetry {
  position: relative;
  width: 100%;
  height: 80px;
  margin: 14px auto 0;
  overflow: hidden;
  display: block;
}

.brush-line {
  position: absolute;
  left: 0; right: 0;
  top: 50%;
  transform: translateY(-50%) rotate(var(--tilt, 0deg)) translateY(var(--y, 0px));
  font-family: "Liu Jian Mao Cao","Long Cang","Ma Shan Zheng","ZCOOL XiaoWei", cursive;
  font-weight: 400;
  font-size: 42px;
  color: #1a1610;
  letter-spacing: 0.06em;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  opacity: 0;                              /* 初始由 WAAPI 接管 */
  filter: blur(0.3px);                     /* 与 MountainDeco 同款柔化 */
  clip-path: inset(-12% 100% -12% -12%);   /* 初始被全裁，由 WAAPI 扫开 */
  user-select: none;
  will-change: opacity, clip-path;
}

@media (max-width: 768px) {
  .brush-poetry { height: 62px; margin-top: 10px; }
  .brush-line   { font-size: 30px; }
}
</style>
