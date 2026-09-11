<template>
  <!-- 云山墨月：月晕 + 墨色大字 + 双层远山 -->
  <div class="cloud-mountain" aria-hidden="true">
    <!-- 月晕（背景光圈） -->
    <div class="moon-halo">
      <div class="moon"></div>
      <div class="halo halo-1"></div>
      <div class="halo halo-2"></div>
    </div>

    <!-- 墨色大字铺底 -->
    <div class="ink-chars-bg">
      <span v-for="(c, i) in chars" :key="i" :style="charStyle(i)">{{ c }}</span>
    </div>

    <!-- 远山 SVG（双层 + 山前雾） -->
    <svg class="mountains-svg" viewBox="0 0 1200 240" preserveAspectRatio="none">
      <defs>
        <linearGradient id="inkFarMountain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#4a3525" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#4a3525" stop-opacity="0.02" />
        </linearGradient>
        <linearGradient id="inkNearMountain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#18100a" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#18100a" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <path
        d="M0 140 Q 80 80 180 110 T 380 95 T 580 120 T 780 100 T 980 115 T 1200 105 L 1200 240 L 0 240 Z"
        fill="url(#inkFarMountain)" />
      <path
        d="M0 180 Q 120 130 260 165 T 540 150 T 820 175 T 1100 160 T 1200 170 L 1200 240 L 0 240 Z"
        fill="url(#inkNearMountain)" />
      <path
        d="M0 220 Q 200 200 400 215 T 800 210 T 1200 220 L 1200 240 L 0 240 Z"
        fill="#f0e6c8" fill-opacity="0.6" />
    </svg>
  </div>
</template>

<script setup>
const chars = ['云', '山', '墨', '月', '此', '时', '心', '境', '静']

// 交错定位 + 微调透明度 / 旋转，避免规律感
function charStyle(i) {
  const top = (i * 17) % 80
  const left = (i * 23) % 90
  const opacity = (0.04 + (i * 0.011) % 0.04).toFixed(3)
  const rotate = ((i % 5) - 2) * 4
  return {
    top: `${top}%`,
    left: `${left}%`,
    opacity,
    transform: `rotate(${rotate}deg)`,
  }
}
</script>

<style scoped>
.cloud-mountain {
  position: relative;
  width: 100%;
  height: 240px;
  margin: 0 0 24px;
  pointer-events: none;
  overflow: hidden;
}

/* ---- 月晕 ---- */
.moon-halo {
  position: absolute;
  top: 12%;
  right: 8%;
  width: 120px;
  height: 120px;
  z-index: 1;
}

.moon {
  position: absolute;
  inset: 30px;
  border-radius: 50%;
  background: radial-gradient(circle, #f0d080 0%, #d4b56e 60%, transparent 100%);
  filter: blur(2px);
  opacity: 0.7;
}

.halo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle,
    transparent 40%,
    rgba(212, 175, 55, 0.10) 50%,
    transparent 70%);
  animation: pulse 6s ease-in-out infinite;
}

.halo-2 { animation-delay: 3s; }

@keyframes pulse {
  0%, 100% { transform: scale(1);   opacity: 0.7; }
  50%      { transform: scale(1.15); opacity: 1;   }
}

/* ---- 墨色大字 ---- */
.ink-chars-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.ink-chars-bg span {
  position: absolute;
  font-family: "Liu Jian Mao Cao","Long Cang","Ma Shan Zheng","ZCOOL XiaoWei", cursive;
  font-size: 96px;
  color: #18100a;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  filter: blur(0.3px);
}

/* ---- 远山 ---- */
.mountains-svg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 120px;
  z-index: 2;
}

@media (max-width: 768px) {
  .cloud-mountain { height: 160px; }
  .moon-halo      { width: 80px; height: 80px; top: 6%; right: 4%; }
  .moon           { inset: 22px; }
  .ink-chars-bg span { font-size: 56px; }
  .mountains-svg     { height: 80px; }
}
</style>
