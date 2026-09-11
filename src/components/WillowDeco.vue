<template>
  <!-- 水墨杨柳 · 飘荡：桌面左右两棵，移动端顶部中央一棵 -->
  <div class="willow-deco" aria-hidden="true">

    <!-- ==================== 桌面左侧 ==================== -->
    <svg class="willow left desktop" viewBox="0 0 220 360" preserveAspectRatio="xMidYMin meet">
      <!-- strand 的包围盒起点各不相同：
           strand 1: bbox.x=14 → translate(14,0) 把(0,0)挪到顶悬挂点 -->
      <g class="strands" stroke="#18100a" fill="none" stroke-linecap="round">
        <g class="strand" style="--dur:5.6s;--delay:0s;--amp:-2.6deg" transform="translate(14,0)">
          <path d="M 18 0 Q 28 70 20 150 Q 14 230 26 320" stroke-width="1.2" opacity="0.42" />
          <ellipse cx="18" cy="305" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.55" transform="rotate(-12 18 305)" />
          <ellipse cx="26" cy="312" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.42" transform="rotate(8 26 312)" />
          <ellipse cx="14" cy="295" rx="1.2" ry="4"   fill="#18100a" stroke="none" opacity="0.4"  transform="rotate(-20 14 295)" />
        </g>
        <g class="strand" style="--dur:6.4s;--delay:0.4s;--amp:2.4deg" transform="translate(46,0)">
          <path d="M 55 0 Q 66 80 56 170 Q 50 260 60 340" stroke-width="1.4" opacity="0.5" />
          <ellipse cx="56" cy="320" rx="1.8" ry="5.2" fill="#18100a" stroke="none" opacity="0.6" transform="rotate(-14 56 320)" />
          <ellipse cx="63" cy="330" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.48" transform="rotate(6 63 330)" />
          <ellipse cx="50" cy="312" rx="1.4" ry="4.4" fill="#18100a" stroke="none" opacity="0.45" transform="rotate(-22 50 312)" />
        </g>
        <g class="strand" style="--dur:7.2s;--delay:0.2s;--amp:-2.8deg" transform="translate(85,0)">
          <path d="M 95 0 Q 106 100 96 200 Q 90 290 100 350" stroke-width="1.5" opacity="0.55" />
          <ellipse cx="96" cy="335" rx="2" ry="5.6" fill="#18100a" stroke="none" opacity="0.62" transform="rotate(-20 96 335)" />
          <ellipse cx="103" cy="346" rx="1.7" ry="5" fill="#18100a" stroke="none" opacity="0.5" transform="rotate(8 103 346)" />
          <ellipse cx="89" cy="328" rx="1.5" ry="4.8" fill="#18100a" stroke="none" opacity="0.46" transform="rotate(-30 89 328)" />
        </g>
        <g class="strand" style="--dur:6.6s;--delay:0.9s;--amp:2.6deg" transform="translate(118,0)">
          <path d="M 135 0 Q 124 90 132 180 Q 138 270 126 340" stroke-width="1.4" opacity="0.5" />
          <ellipse cx="132" cy="320" rx="1.8" ry="5.2" fill="#18100a" stroke="none" opacity="0.6" transform="rotate(14 132 320)" />
          <ellipse cx="124" cy="330" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.48" transform="rotate(-8 124 330)" />
        </g>
        <g class="strand" style="--dur:5.9s;--delay:0.6s;--amp:-2.4deg" transform="translate(158,0)">
          <path d="M 172 0 Q 184 80 174 170 Q 168 260 178 330" stroke-width="1.3" opacity="0.46" />
          <ellipse cx="174" cy="310" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.52" transform="rotate(-12 174 310)" />
          <ellipse cx="182" cy="318" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.42" transform="rotate(10 182 318)" />
        </g>
        <g class="strand" style="--dur:6.1s;--delay:0.3s;--amp:2.2deg" transform="translate(190,0)">
          <path d="M 202 0 Q 192 70 200 150 Q 206 230 196 300" stroke-width="1.1" opacity="0.4" />
          <ellipse cx="198" cy="290" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.45" transform="rotate(-8 198 290)" />
        </g>
      </g>
    </svg>

    <!-- ==================== 桌面右侧（坐标镜像） ==================== -->
    <svg class="willow right desktop" viewBox="0 0 220 360" preserveAspectRatio="xMidYMin meet">
      <g class="strands" stroke="#18100a" fill="none" stroke-linecap="round">
        <!-- bbox.x=14 → translate(14,0) -->
        <g class="strand" style="--dur:6s;--delay:0.2s;--amp:2.6deg" transform="translate(14,0)">
          <path d="M 18 0 Q 28 70 20 150 Q 14 230 26 320" stroke-width="1.1" opacity="0.4" />
          <ellipse cx="22" cy="290" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.45" transform="rotate(8 22 290)" />
        </g>
        <!-- bbox.x=38 → translate(38,0) -->
        <g class="strand" style="--dur:5.8s;--delay:0.7s;--amp:-2.4deg" transform="translate(38,0)">
          <path d="M 48 0 Q 36 80 46 170 Q 52 260 42 330" stroke-width="1.3" opacity="0.46" />
          <ellipse cx="46" cy="310" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.52" transform="rotate(12 46 310)" />
          <ellipse cx="38" cy="318" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.42" transform="rotate(-10 38 318)" />
        </g>
        <!-- bbox.x=80 → translate(80,0) -->
        <g class="strand" style="--dur:6.8s;--delay:0.5s;--amp:2.6deg" transform="translate(80,0)">
          <path d="M 85 0 Q 96 90 88 180 Q 82 270 94 340" stroke-width="1.4" opacity="0.5" />
          <ellipse cx="88" cy="320" rx="1.8" ry="5.2" fill="#18100a" stroke="none" opacity="0.6" transform="rotate(-14 88 320)" />
          <ellipse cx="96" cy="330" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.48" transform="rotate(8 96 330)" />
        </g>
        <!-- bbox.x=114 → translate(114,0) -->
        <g class="strand" style="--dur:7s;--delay:0.1s;--amp:-2.8deg" transform="translate(114,0)">
          <path d="M 125 0 Q 114 100 124 200 Q 130 290 120 350" stroke-width="1.5" opacity="0.55" />
          <ellipse cx="124" cy="335" rx="2" ry="5.6" fill="#18100a" stroke="none" opacity="0.62" transform="rotate(20 124 335)" />
          <ellipse cx="117" cy="346" rx="1.7" ry="5" fill="#18100a" stroke="none" opacity="0.5" transform="rotate(-8 117 346)" />
          <ellipse cx="131" cy="328" rx="1.5" ry="4.8" fill="#18100a" stroke="none" opacity="0.46" transform="rotate(30 131 328)" />
        </g>
        <!-- bbox.x=152 → translate(152,0) -->
        <g class="strand" style="--dur:6.5s;--delay:0.8s;--amp:2.4deg" transform="translate(152,0)">
          <path d="M 165 0 Q 154 80 164 170 Q 170 260 160 340" stroke-width="1.4" opacity="0.5" />
          <ellipse cx="164" cy="320" rx="1.8" ry="5.2" fill="#18100a" stroke="none" opacity="0.6" transform="rotate(14 164 320)" />
          <ellipse cx="157" cy="330" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.48" transform="rotate(-6 157 330)" />
        </g>
        <!-- bbox.x=190 → translate(190,0) -->
        <g class="strand" style="--dur:5.7s;--delay:0.4s;--amp:-2.6deg" transform="translate(190,0)">
          <path d="M 202 0 Q 192 70 200 150 Q 206 230 196 300" stroke-width="1.2" opacity="0.42" />
          <ellipse cx="202" cy="305" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.55" transform="rotate(12 202 305)" />
          <ellipse cx="194" cy="312" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.42" transform="rotate(-8 194 312)" />
        </g>
      </g>
    </svg>

    <!-- ==================== 移动端：顶部中央一棵（更紧凑） ==================== -->
    <svg class="willow mobile" viewBox="0 0 240 220" preserveAspectRatio="xMidYMin meet">
      <g class="strands" stroke="#18100a" fill="none" stroke-linecap="round">
        <!-- bbox.x=22 -->
        <g class="strand" style="--dur:5.4s;--delay:0s;--amp:-2deg" transform="translate(22,0)">
          <path d="M 30 0 Q 36 50 28 100 Q 22 150 32 200" stroke-width="1.1" opacity="0.4" />
          <ellipse cx="28" cy="190" rx="1.3" ry="4" fill="#18100a" stroke="none" opacity="0.5" transform="rotate(-12 28 190)" />
        </g>
        <!-- bbox.x=67 -->
        <g class="strand" style="--dur:6.2s;--delay:0.3s;--amp:2deg" transform="translate(67,0)">
          <path d="M 75 0 Q 84 60 76 120 Q 70 170 80 210" stroke-width="1.3" opacity="0.5" />
          <ellipse cx="76" cy="198" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.58" transform="rotate(-16 76 198)" />
          <ellipse cx="83" cy="206" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.45" transform="rotate(6 83 206)" />
        </g>
        <!-- bbox.x=112 -->
        <g class="strand" style="--dur:7s;--delay:0.1s;--amp:-2.4deg" transform="translate(112,0)">
          <path d="M 120 0 Q 130 70 122 140 Q 116 190 124 215" stroke-width="1.4" opacity="0.55" />
          <ellipse cx="122" cy="205" rx="1.7" ry="5" fill="#18100a" stroke="none" opacity="0.62" transform="rotate(-20 122 205)" />
          <ellipse cx="129" cy="212" rx="1.4" ry="4.4" fill="#18100a" stroke="none" opacity="0.5" transform="rotate(8 129 212)" />
        </g>
        <!-- bbox.x=153 -->
        <g class="strand" style="--dur:6s;--delay:0.5s;--amp:2deg" transform="translate(153,0)">
          <path d="M 165 0 Q 156 60 164 120 Q 170 170 160 210" stroke-width="1.3" opacity="0.5" />
          <ellipse cx="164" cy="198" rx="1.5" ry="4.6" fill="#18100a" stroke="none" opacity="0.58" transform="rotate(16 164 198)" />
          <ellipse cx="157" cy="206" rx="1.3" ry="4.2" fill="#18100a" stroke="none" opacity="0.45" transform="rotate(-6 157 206)" />
        </g>
        <!-- bbox.x=202 -->
        <g class="strand" style="--dur:5.5s;--delay:0.2s;--amp:-2deg" transform="translate(202,0)">
          <path d="M 210 0 Q 204 50 212 100 Q 218 150 208 200" stroke-width="1.1" opacity="0.4" />
          <ellipse cx="212" cy="190" rx="1.3" ry="4" fill="#18100a" stroke="none" opacity="0.5" transform="rotate(12 212 190)" />
        </g>
      </g>
    </svg>

  </div>
</template>

<style scoped>
.willow-deco {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.willow {
  position: absolute;
  top: -6px;
  display: block;
}

.willow.left.desktop  { left: -10px; width: 220px; height: 360px; }
.willow.right.desktop { right: -10px; width: 220px; height: 360px; }
.willow.mobile {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 220px;
}

.willow.desktop { display: block; }
.willow.mobile  { display: none; }

@media (max-width: 768px) {
  .willow.desktop { display: none; }
  .willow.mobile  { display: block; }
}

/*
 * 摇摆动画：每根柳条绕其 SVG 顶悬挂点微旋转
 * strand 使用 transform="translate(bboxX,0)" 把(0,0)对齐到悬挂点
 * transform-origin: top left → 绕(0,0)旋转
 */
.strand {
  transform-box: fill-box;
  transform-origin: top left;
  animation: willow-sway var(--dur, 6s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  will-change: transform;
}

@keyframes willow-sway {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(var(--amp, -2deg)); }
  75%      { transform: rotate(calc(-1 * var(--amp, -2deg))); }
}

@media (prefers-reduced-motion: reduce) {
  .strand { animation: none; }
}
</style>
