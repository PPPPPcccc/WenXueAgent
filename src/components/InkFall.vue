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

/** 随机化单个粒子（含树叶形状参数） */
function randomize(p, initialY = false) {
  p.x = Math.random() * w
  p.y = initialY ? Math.random() * h : -rand(8, 30)
  p.size = (w <= 768 ? rand(2.5, 6.0) : rand(3.75, 7.5))
  p.baseOpacity = rand(0.25, 0.6)
  p.vy = rand(7, 20)

  // 树叶形状参数（5 个独立维度 → 每片叶子都不一样）
  p.leafLen  = rand(1.05, 1.35)   // 长度比例
  p.leafWR   = rand(0.40, 0.62)   // 右半宽
  p.leafWL   = rand(0.40, 0.62)   // 左半宽（≠WR → 不对称叶）
  p.leafTip  = rand(-0.10, 0.10)  // 叶尖 x 偏移
  p.leafStem = rand(-0.10, 0.10)  // 叶柄 x 偏移

  // 三组不可通约频率的正弦摆动 → 不规则轨迹
  p.p1 = rand(0, Math.PI * 2); p.f1 = rand(0.25, 0.65); p.a1 = rand(10, 26)
  p.p2 = rand(0, Math.PI * 2); p.f2 = rand(0.7,  1.5);  p.a2 = rand(5,  16)
  p.p3 = rand(0, Math.PI * 2); p.f3 = rand(1.6,  2.6);  p.a3 = rand(3,  10)

  // 寿命
  p.life = 1
  p.maxLife = rand(8, 26)

  p.color = COLORS[Math.floor(Math.random() * COLORS.length)]
  p.angle = 0   // 每帧根据运动方向重算
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

/** 画一片不规则树叶（局部坐标：原点=叶中心，y 上负下正） */
function drawLeafShape(ctx, p) {
  const L    = p.size * p.leafLen
  const WR   = p.size * p.leafWR
  const WL   = p.size * p.leafWL
  const tip  = p.size * p.leafTip
  const stem = p.size * p.leafStem

  ctx.beginPath()
  ctx.moveTo(stem, L)                              // 起：叶柄（底）

  // 左半：从叶柄经左侧鼓出到叶尖
  ctx.bezierCurveTo(
    -WL * 1.10,  L * 0.50,                         // 下左控制
    -WL * 0.95, -L * 0.35,                         // 上左控制
     tip,        -L                                // 收：叶尖（顶）
  )

  // 右半：从叶尖经右侧鼓出回到叶柄
  ctx.bezierCurveTo(
     WR * 1.05, -L * 0.40,                         // 上右控制
     WR * 1.00,  L * 0.45,                         // 下右控制
     stem,        L                                // 收：叶柄
  )

  ctx.closePath()
  ctx.fill()
}

function update(dt) {
  const dtS = Math.min(dt, 50) / 1000
  windT += dtS

  // 全局缓风 + 偶发阵风
  const slowWind = Math.sin(windT * 0.25) * 10
  const gust     = Math.max(0, Math.sin(windT * 0.13) - 0.55) * 32

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    const vx =
      slowWind + gust +
      Math.sin(windT * p.f1 + p.p1) * p.a1 +
      Math.sin(windT * p.f2 + p.p2) * p.a2 +
      Math.sin(windT * p.f3 + p.p3) * p.a3

    p.x += vx * dtS
    p.y += p.vy * dtS
    p.life -= dtS / p.maxLife

    // 叶尖朝运动方向（atan2(vy, vx) 是与 x 轴夹角，叶尖原朝上 → +π/2 校正）
    p.angle = Math.atan2(p.vy, vx) + Math.PI / 2

    if (p.life <= 0 || p.y > h + 30) randomize(p, false)
    if (p.x > w + 20) p.x = -20
    if (p.x < -20) p.x = w + 20
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    let alpha
    if (p.life > 0.85) {
      alpha = p.baseOpacity * Math.min(1, (1 - p.life) / 0.15)
    } else if (p.life < 0.3) {
      alpha = p.baseOpacity * Math.max(0, p.life / 0.3)
    } else {
      alpha = p.baseOpacity
    }
    if (alpha <= 0.005) continue

    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)
    drawLeafShape(ctx, p)
    ctx.restore()
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

  // 数量减少 1/3（原 120 / 60 → 80 / 40）
  const count = w <= 768 ? 40 : 80
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
