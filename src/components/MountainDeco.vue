<template>
  <!-- 云山墨月：月晕 + 墨色大字网格 + 双层远山 -->
  <div class="cloud-mountain" aria-hidden="true">
    <!-- 月晕（背景光圈） -->
    <div class="moon-halo">
      <div class="moon"></div>
      <div class="halo halo-1"></div>
      <div class="halo halo-2"></div>
    </div>

    <!-- 墨色大字网格（2 行 × 4 列，无重叠） -->
    <div class="ink-grid">
      <span v-for="(c, i) in chars" :key="i" class="ink-char"
            :style="{ '--idx': i, '--rot': rot(i), '--op': op(i) }">
        {{ c }}
      </span>
    </div>

    <!-- 远山 SVG -->
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

      <path d="M0 140 Q 80 80 180 110 T 380 95 T 580 120 T 780 100 T 980 115 T 1200 105 L 1200 240 L 0 240 Z"
            fill="url(#inkFarMountain)" />
      <path d="M0 180 Q 120 130 260 165 T 540 150 T 820 175 T 1100 160 T 1200 170 L 1200 240 L 0 240 Z"
            fill="url(#inkNearMountain)" />
      <path d="M0 220 Q 200 200 400 215 T 800 210 T 1200 220 L 1200 240 L 0 240 Z"
            fill="#f0e6c8" fill-opacity="0.6" />
    </svg>
  </div>
</template>

<script setup>
// 8 字诗：云山墨月风清远静 —— 子集字体全部支持，无重叠网格排版
const chars = ['云', '山', '墨', '月', '风', '清', '远', '静']

// 微旋转（±4°）和微透明度差异（0.05–0.09）保留手写感
function rot(i) {
  const map = [-3, 2, -2, 4, -4, 1, 3, -1]
  return `${map[i % map.length]}deg`
}
function op(i) {
  const map = [0.07, 0.06, 0.08, 0.05, 0.07, 0.06, 0.08, 0.05]
  return map[i % map.length]
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

/* ---- 墨色大字：2 行 × 4 列等距网格（避开重叠） ---- */
.ink-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  pointer-events: none;
  z-index: 0;
}

.ink-char {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Liu Jian Mao Cao","Long Cang","Ma Shan Zheng","ZCOOL XiaoWei", cursive;
  font-size: 80px;
  line-height: 1;
  color: #18100a;
  opacity: var(--op);
  transform: rotate(var(--rot));
  user-select: none;
  filter: blur(0.3px);
}

/* 让边缘的字稍微靠向内，避免被父容器裁切 */
.ink-char:nth-child(1) { justify-content: flex-end; padding-right: 6%; }
.ink-char:nth-child(4) { justify-content: flex-start; padding-left: 6%; }
.ink-char:nth-child(5) { justify-content: flex-end; padding-right: 6%; }
.ink-char:nth-child(8) { justify-content: flex-start; padding-left: 6%; }

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
  .ink-char       { font-size: 48px; }
  .mountains-svg  { height: 80px; }
}
</style>
