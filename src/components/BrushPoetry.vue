<template>
  <!-- 狂草 · 随机诗句循环书写：在"此时·此刻"下方淡入、笔锋展开、淡出 -->
  <div class="brush-poetry" aria-hidden="true">
    <svg
      v-if="currentLine"
      :key="renderKey"
      class="brush-svg"
      viewBox="0 0 600 80"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <!-- 飞白笔触感：字符边缘微微颗粒化 -->
        <filter id="brush-feather" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>
      <text
        :x="textX"
        :y="textY"
        text-anchor="middle"
        dominant-baseline="middle"
        :class="['brush-text', reveal ? 'revealed' : '']"
        filter="url(#brush-feather)"
      >{{ currentLine }}</text>
    </svg>
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
const reveal = ref(false)
const renderKey = ref(0)
const textX = '50%'
const textY = '50%'

let timer = null
let timeoutFadeIn = null
let timeoutStroke = null
let timeoutFadeOut = null

function pickPoem() {
  // 避免连续重复
  let next = POEMS[Math.floor(Math.random() * POEMS.length)]
  if (POEMS.length > 1) {
    while (next === currentLine.value) {
      next = POEMS[Math.floor(Math.random() * POEMS.length)]
    }
  }
  return next
}

function step() {
  // 清场
  currentLine.value = ''
  reveal.value = false
  clearAll()
  renderKey.value++

  const line = pickPoem()
  // 短句放中，长句拉宽
  currentLine.value = line

  // 360ms 淡入
  timeoutFadeIn = setTimeout(() => {
    // 触发 .revealed → CSS 跑 1700ms 的 clipPath 笔锋展开
    reveal.value = true
  }, 360)

  // 3.5s 后开始 1.3s 淡出
  timeoutStroke = setTimeout(() => {
    reveal.value = false
  }, 360 + 1700 + 1500)

  // 5.6s 后下一句
  timeoutFadeOut = setTimeout(() => {
    step()
  }, 360 + 1700 + 1500 + 1300 + 700)
}

function clearAll() {
  if (timeoutFadeIn)  { clearTimeout(timeoutFadeIn);  timeoutFadeIn  = null }
  if (timeoutStroke)  { clearTimeout(timeoutStroke);  timeoutStroke  = null }
  if (timeoutFadeOut) { clearTimeout(timeoutFadeOut); timeoutFadeOut = null }
}

onMounted(() => {
  // 尊重用户的减少动效设置
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    // 静态显示一句
    currentLine.value = POEMS[0]
    reveal.value = true
    return
  }
  // 首次延迟 1.5s 等用户进入
  timer = setTimeout(step, 1500)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  clearAll()
})
</script>

<style scoped>
.brush-poetry {
  position: relative;
  width: 100%;
  height: 64px;
  margin: 14px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.brush-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: poetry-in 360ms ease-out forwards;
}

.brush-text {
  font-family: "Liu Jian Mao Cao","Long Cang","Ma Shan Zheng","ZCOOL XiaoWei", cursive;
  font-weight: 400;
  font-size: 38px;
  fill: #1a1610;
  letter-spacing: 0.04em;

  /* 初始：只在最右边露出 0% —— 笔锋还未到来 */
  clip-path: inset(-10% 100% -10% -10%);
  transition: none;
}

.brush-text.revealed {
  /* 笔锋从左扫到右 */
  animation: brush-write 1700ms cubic-bezier(0.45, 0, 0.25, 1) forwards,
             poetry-out 1300ms ease-in forwards 1700ms;
}

@keyframes poetry-in {
  from { opacity: 0; }
  to   { opacity: 0.9; }
}

@keyframes brush-write {
  from { clip-path: inset(-10% 100% -10% -10%); }
  to   { clip-path: inset(-10% -10% -10% -10%); }
}

@keyframes poetry-out {
  from { opacity: 0.9; }
  to   { opacity: 0; }
}

@media (max-width: 768px) {
  .brush-poetry { height: 56px; margin-top: 10px; }
  .brush-text   { font-size: 28px; }
}
</style>
