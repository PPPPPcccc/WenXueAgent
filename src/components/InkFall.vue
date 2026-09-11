<template>
  <canvas ref="canvasRef" class="ink-fall" aria-hidden="true" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let ctx = null
let particles = []
let raf = null
let cancelled = false
let w = 0, h = 0
let lastTime = 0
let windT = 0
let dpr = 1

const COLORS = ['#18100a', '#241a10', '#312517', '#1d150d']

function rand(min, max) { return min + Math.random() * (max - min) }

/** 随机化单个粒子的所有参数 */
function randomize(p, initialY = false) {
  p.x = Math.random() * w
  p.y = initialY ? Math.random() * h : -rand(8, 30)
  p.size = (w <= 768 ? rand(0.8, 2.4) : rand(1.2, 3.2))
  p.baseOpacity = rand(0.22, 0.55)

  // 飘落速度（更慢，单位 px/s）
  p.vy = rand(8, 22)

  // 三组不可通约频率的正弦摆动 → 合成"不规则"轨迹
  p.p1 = rand(0, Math.PI * 2); p.f1 = rand(0.25, 0.65); p.a1 = rand(10, 26)
  p.p2 = rand(0, Math.PI * 2); p.f2 = rand(0.7,  1.5);  p.a2 = rand(5,  16)
  p.p3 = rand(0, Math.PI * 2); p.f3 = rand(1.6,  2.6);  p.a3 = rand(3,  10)

  // 寿命（秒）—— 随时可能淡化消失的关键
  p.life = 1
  p.maxLife = rand(8, 26)

  p.color = COLORS[Math.floor(Math.random() * COLORS.length)]
}

function initCanvas() {
  dpr = window.devicePixelRatio || 1
  const rect = canvasRef.value.getBoundingClientRect()
  w = rect.width
  h = rect.height
  canvasRef.value.width = Math.floor(w * dpr)
  canvasRef.value.height = Math.floor(h * dpr)
  ctx = canvasRef.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function update(dt) {
  const dtS = Math.min(dt, 50) / 1000
  windT += dtS

  // 全局缓风 + 偶发阵风（让画面有大方向感）
  const slowWind = Math.sin(windT * 0.25) * 10
  const gust = Math.max(0, Math.sin(windT * 0.13) - 0.55) * 32

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // 三个不可通约频率叠加 + 全局风 → 每颗粒子轨迹都不一样
    const vx =
      slowWind + gust +
      Math.sin(windT * p.f1 + p.p1) * p.a1 +
      Math.sin(windT * p.f2 + p.p2) * p.a2 +
      Math.sin(windT * p.f3 + p.p3) * p.a3

    p.x += vx * dtS
    p.y += p.vy * dtS

    // 寿命流逝
    p.life -= dtS / p.maxLife

    // 寿命到 0 或飘出底边 → 在顶部重生（参数全随机化）
    if (p.life <= 0 || p.y > h + 30) randomize(p, false)

    // 横向飘出 → 从另一侧回来
    if (p.x > w + 20) p.x = -20
    if (p.x < -20) p.x = w + 20
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // 透明度根据寿命平滑过渡：前 15% 渐入、中段保持、后 30% 渐出
    let alpha
    if (p.life > 0.85) {
      alpha = p.baseOpacity * Math.min(1, (1 - p.life) / 0.15)
    } else if (p.life < 0.3) {
      alpha = p.baseOpacity * Math.max(0, p.life / 0.3)
    } else {
      alpha = p.baseOpacity
    }

    if (alpha <= 0.005) continue   // 完全透明就不画

    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function loop(time) {
  if (cancelled) return
  const dt = time - lastTime
  lastTime = time
  update(dt)
  draw()
  raf = requestAnimationFrame(loop)
}

function handleResize() {
  initCanvas()
  particles.forEach((p) => randomize(p, true))
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  initCanvas()

  // 数量减少一些，让慢飘更有空间感
  const count = w <= 768 ? 60 : 120
  for (let i = 0; i < count; i++) {
    const p = {}
    randomize(p, true)
    particles.push(p)
  }

  lastTime = performance.now()
  raf = requestAnimationFrame(loop)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  cancelled = true
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.ink-fall {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  display: block;
}
</style>
