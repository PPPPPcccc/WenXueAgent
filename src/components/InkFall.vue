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

// 创建粒子
function spawn(initial = false) {
  const isMobile = w <= 768
  const r = Math.random()
  const isStreak = r < 0.35   // 35% 拉成短笔触（带运动感）
  const isDot = !isStreak

  return {
    x: Math.random() * w,
    y: initial ? Math.random() * h : -20 - Math.random() * 80,
    size: isMobile
      ? (isDot ? 0.7 + Math.random() * 1.6 : 0.9 + Math.random() * 1.8)
      : (isDot ? 1.1 + Math.random() * 2.0 : 1.3 + Math.random() * 2.4),
    opacity: 0.18 + Math.random() * 0.42,
    // 飘落速度（像素/秒）
    vy: isMobile ? 22 + Math.random() * 38 : 28 + Math.random() * 55,
    // 个体偏移：让不同粒子有不同运动相位
    phase: Math.random() * Math.PI * 2,
    sway: 0.5 + Math.random() * 1.2,            // 摆动幅度
    spin: 0.6 + Math.random() * 0.8,             // 摆动频率
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    type: isStreak ? 'streak' : 'dot',
    streak: 4 + Math.random() * 10,              // 笔触长度
    angle: 0                                     // 笔触倾角（风向决定）
  }
}

function initCanvas() {
  dpr = window.devicePixelRatio || 1
  const rect = canvasRef.value.getBoundingClientRect()
  w = rect.width
  h = rect.height
  canvasRef.value.width = Math.floor(w * dpr)
  canvasRef.value.height = Math.floor(h * dpr)
  ctx = canvasRef.value.getContext('2d')      // ← 之前漏了这行
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function update(dt) {
  const dtS = Math.min(dt, 50) / 1000   // 秒（限制单帧最大步长）
  windT += dtS

  // 风：慢正弦 + 阵风脉冲（让画面有"被吹"的感觉）
  const slowWind = Math.sin(windT * 0.35) * 18
  const gust = Math.max(0, Math.sin(windT * 0.18) - 0.55) * 70

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // 风向随时间微微偏转
    const windDir = Math.sin(windT * 0.12) * 25 + gust
    const sway = Math.sin(windT * p.spin + p.phase) * p.sway

    p.y += p.vy * dtS
    p.x += (windDir + sway) * dtS
    p.angle = Math.atan2(windDir + sway, p.vy) * (180 / Math.PI)

    // 越过底部 → 从顶部重生
    if (p.y > h + 30) {
      p.y = -20
      p.x = Math.random() * w
      p.phase = Math.random() * Math.PI * 2
    }
    // 横向飘出 → 回到另一侧
    if (p.x > w + 20) p.x = -20
    if (p.x < -20) p.x = w + 20
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.strokeStyle = p.color

    if (p.type === 'dot') {
      // 墨点（部分拉成椭圆，更像飞溅）
      const r = p.size
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, r, r * 0.85, (p.angle * Math.PI) / 180, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 笔触：短弧线，沿运动方向倾斜（视觉上像落墨）
      const angleRad = (p.angle * Math.PI) / 180
      const dx = Math.sin(angleRad) * p.streak
      const dy = -Math.cos(angleRad) * p.streak
      ctx.lineWidth = p.size * 0.55
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p.x - dx, p.y - dy)
      ctx.lineTo(p.x + dx, p.y + dy)
      ctx.stroke()
    }
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
  // 重新均匀分布
  particles = particles.map((p) => ({
    ...p,
    x: Math.random() * w,
    y: Math.random() * h,
  }))
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  initCanvas()

  const isMobile = w <= 768
  const count = isMobile ? 90 : 180
  for (let i = 0; i < count; i++) particles.push(spawn(true))

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
  z-index: 0;       /* 在内容之下 */
  overflow: hidden;
  display: block;
}
</style>
