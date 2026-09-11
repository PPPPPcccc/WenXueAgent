<template>
  <!-- 狂草 · 随机两句循环书写：与 MountainDeco 同字体栈 -->
  <div class="brush-poetry" aria-hidden="true">
    <div class="brush-lines" :style="{ '--tilt': `${tilt}deg` }">
      <div
        v-if="line1"
        :key="key1"
        ref="line1El"
        class="brush-line line-top"
      >{{ line1 }}</div>
      <div
        v-if="line2"
        :key="key2"
        ref="line2El"
        class="brush-line line-bottom"
      >{{ line2 }}</div>
    </div>
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

const line1 = ref('')
const line2 = ref('')
const key1 = ref(0)
const key2 = ref(0)
const line1El = ref(null)
const line2El = ref(null)
let tilt = 0
let cancelled = false

// 抽取两句不重复的诗
function pickPair() {
  const pool = POEMS.slice()
  const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
  const b = pool[Math.floor(Math.random() * pool.length)]
  return [a, b]
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

async function playPair() {
  if (cancelled) return
  // 等 Vue 真正把新元素挂到 DOM 上
  await nextFrame()
  const el1 = line1El.value
  const el2 = line2El.value
  if (!el1 || !el2 || cancelled) return

  // 全部时长 ×2，速度减半
  const FADE_IN  = 720
  const STROKE   = 3400
  const STAGGER  = 800
  const HOLD     = 3000
  const FADE_OUT = 2600
  const GAP      = 1400

  // 上句淡入
  const a1 = el1.animate(
    [{ opacity: 0 }, { opacity: 0.85 }],
    { duration: FADE_IN, fill: 'forwards', easing: 'ease-out' }
  )
  // 上句笔锋
  const a2 = el1.animate(
    [
      { clipPath: 'inset(-12% 100% -12% -12%)' },
      { clipPath: 'inset(-12% -12% -12% -12%)' },
    ],
    { duration: STROKE, fill: 'forwards', easing: 'cubic-bezier(0.45, 0, 0.25, 1)' }
  )

  // 等 STAGGER 时间后，下句跟上
  await sleep(STAGGER)
  if (cancelled) return

  const el2Now = line2El.value
  if (!el2Now || cancelled) return

  const a3 = el2Now.animate(
    [{ opacity: 0 }, { opacity: 0.85 }],
    { duration: FADE_IN, fill: 'forwards', easing: 'ease-out' }
  )
  const a4 = el2Now.animate(
    [
      { clipPath: 'inset(-12% 100% -12% -12%)' },
      { clipPath: 'inset(-12% -12% -12% -12%)' },
    ],
    { duration: STROKE, fill: 'forwards', easing: 'cubic-bezier(0.45, 0, 0.25, 1)' }
  )

  // 两句都写完后停留
  await sleep(FADE_IN + STROKE + HOLD)
  if (cancelled) return

  // 两句一起淡出
  const a5 = el1.animate(
    [{ opacity: 0.85 }, { opacity: 0 }],
    { duration: FADE_OUT, fill: 'forwards' }
  )
  const a6 = el2Now.animate(
    [{ opacity: 0.85 }, { opacity: 0 }],
    { duration: FADE_OUT, fill: 'forwards' }
  )

  await sleep(FADE_OUT + GAP)
}

async function cycle() {
  while (!cancelled) {
    const [a, b] = pickPair()
    tilt = -3 + Math.random() * 6
    line1.value = a
    line2.value = b
    key1.value++
    key2.value++
    await playPair()
  }
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    line1.value = POEMS[0]
    line2.value = POEMS[1]
    key1.value++
    key2.value++
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
  height: 160px;
  margin: 14px auto 0;
  overflow: hidden;
  display: block;
}

.brush-lines {
  position: absolute;
  inset: 0;
}

.brush-line {
  position: absolute;
  left: 0;
  right: 0;
  font-family: "Liu Jian Mao Cao","Long Cang","Ma Shan Zheng","ZCOOL XiaoWei", cursive;
  font-weight: 400;
  font-size: 38px;
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

.line-top {
  top: 28%;
  transform: translateY(-50%) rotate(var(--tilt, 0deg));
}

.line-bottom {
  top: 72%;
  transform: translateY(-50%) rotate(calc(var(--tilt, 0deg) * -0.7));
}

@media (max-width: 768px) {
  .brush-poetry { height: 120px; margin-top: 10px; }
  .brush-line   { font-size: 26px; }
}
</style>
