<template>
  <!-- 随机水墨波纹：在视口随机点产生墨圈扩散 -->
  <div class="ink-ripples" aria-hidden="true">
    <div
      v-for="r in ripples"
      :key="r.id"
      class="ripple"
      :style="{
        left: r.x + '%',
        top: r.y + '%',
        width: r.size + 'px',
        height: r.size + 'px',
        '--d': r.duration + 'ms'
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const ripples = ref([])
let nextId = 0
let timer = null
let cancelled = false

function spawnRipple() {
  if (cancelled) return
  const w = window.innerWidth
  const h = window.innerHeight
  const isMobile = w <= 768

  // 避开中间阅读区域（桌面端避开 320-560px 区间；移动端避开 60-300px）
  let x, y, tries = 0
  do {
    x = 4 + Math.random() * 92
    y = 6 + Math.random() * 88
    tries++
    if (tries > 8) break  // 强制接受
  } while (
    isMobile
      ? (x > 18 && x < 82 && y > 30 && y < 70)   // 移动端避开主体区
      : (x > 22 && x < 78)                       // 桌面避开 .app-container 横向
  )

  const size = isMobile
    ? 56 + Math.random() * 64
    : 80 + Math.random() * 120
  const duration = 1900 + Math.random() * 1700

  const id = nextId++
  ripples.value.push({ id, x, y, size, duration })
  // 维护数组大小：动画结束后移除
  setTimeout(() => {
    const i = ripples.value.findIndex((r) => r.id === id)
    if (i >= 0) ripples.value.splice(i, 1)
  }, duration + 200)
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  // 每 700-1100ms 生成一个，错开节奏
  function loop() {
    if (cancelled) return
    spawnRipple()
    const gap = 700 + Math.random() * 400
    timer = setTimeout(loop, gap)
  }
  timer = setTimeout(loop, 1200)  // 首次延迟 1.2s
})

onBeforeUnmount(() => {
  cancelled = true
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.ink-ripples {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;        /* 在内容之下；与 WillowDeco 同级 */
  overflow: hidden;
}

.ripple {
  position: absolute;
  margin: 0;
  border: 1.4px solid #18100a;
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.05);
  animation: ripple-spread var(--d, 2400ms) ease-out forwards;
}

@keyframes ripple-spread {
  0%   { transform: translate(-50%, -50%) scale(0.05); opacity: 0; }
  12%  { opacity: 0.45; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ink-ripples { display: none; }
}
</style>
