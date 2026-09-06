<template>
  <!-- 远山水墨背景 -->
  <div class="mountain-deco" aria-hidden="true">
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <defs>
        <linearGradient id="inkMountain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1a1a1a" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#1a1a1a" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <path d="M0 80 Q 100 30 220 70 T 480 60 T 720 75 T 1000 55 T 1200 80 L 1200 120 L 0 120 Z"
            fill="url(#inkMountain)" />
      <path d="M0 95 Q 150 65 350 90 T 700 85 T 1100 95 T 1200 90 L 1200 120 L 0 120 Z"
            fill="#1a1a1a" fill-opacity="0.05" />
    </svg>
  </div>
</template>

<script setup>
</script>

<style scoped>
.mountain-deco {
  width: 100%;
  height: 80px;
  margin: 0 0 24px;
  pointer-events: none;
  opacity: 0.6;
}
.mountain-deco svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
