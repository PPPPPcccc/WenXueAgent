<template>
  <!-- 水墨杨柳：完整树干 + 斜枝（30–45°）+ 垂叶随风双层飘 -->
  <div class="willow-deco" aria-hidden="true">

    <!-- ==================== 桌面左侧整棵树 ==================== -->
    <svg class="wtree left desktop" viewBox="0 0 260 520" preserveAspectRatio="xMinYMax meet">
      <defs>
        <linearGradient id="tgL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#18100a" stop-opacity="0.60"/>
          <stop offset="100%" stop-color="#18100a" stop-opacity="0.30"/>
        </linearGradient>
      </defs>

      <!-- 树干（轻微弯曲） -->
      <path d="M 128 518 C 124 430 127 340 124 255 C 122 185 126 115 130 52"
            stroke="url(#tgL)" stroke-width="9" fill="none" stroke-linecap="round"/>

      <!-- 7 根斜枝：--bx/--by = 枝条挂载点（SVG 坐标），--ba = 摇摆幅度 -->
      <g class="branch" style="--bx:125px;--by:255px;--bd:6.0s;--bdl:0.0s;--ba:3.5deg">
        <path d="M 125 255 Q 95 226 65 204" stroke="#18100a" stroke-width="2.0" fill="none" stroke-linecap="round" opacity="0.55"/>
        <g class="lc" style="--lx:65px;--ly:204px;--ld:4.4s;--lal:0.2s;--la:5deg">
          <ellipse cx="-2" cy="20" rx="1.8" ry="9"   fill="#18100a" opacity="0.36" transform="rotate(-22 -2 20)"/>
          <ellipse cx="4"  cy="28" rx="1.6" ry="7.5" fill="#18100a" opacity="0.28" transform="rotate(14 4 28)"/>
          <ellipse cx="-6" cy="35" rx="1.4" ry="6.5" fill="#18100a" opacity="0.22" transform="rotate(-30 -6 35)"/>
          <ellipse cx="1"  cy="42" rx="1.3" ry="6"   fill="#18100a" opacity="0.18" transform="rotate(8 1 42)"/>
          <ellipse cx="-4" cy="50" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(-14 -4 50)"/>
          <ellipse cx="5"  cy="56" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(18 5 56)"/>
          <ellipse cx="-3" cy="62" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(-8 -3 62)"/>
        </g>
      </g>

      <g class="branch" style="--bx:122px;--by:190px;--bd:7.2s;--bdl:0.5s;--ba:-3.0deg">
        <path d="M 122 190 Q 92 160 62 136" stroke="#18100a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.50"/>
        <g class="lc" style="--lx:62px;--ly:136px;--ld:5.0s;--lal:0.7s;--la:4.5deg">
          <ellipse cx="0"  cy="18" rx="1.7" ry="8"   fill="#18100a" opacity="0.34" transform="rotate(-20 0 18)"/>
          <ellipse cx="-4" cy="26" rx="1.5" ry="7"   fill="#18100a" opacity="0.26" transform="rotate(16 -4 26)"/>
          <ellipse cx="3"  cy="33" rx="1.3" ry="6"   fill="#18100a" opacity="0.20" transform="rotate(-26 3 33)"/>
          <ellipse cx="-2" cy="40" rx="1.2" ry="5.5" fill="#18100a" opacity="0.16" transform="rotate(10 -2 40)"/>
          <ellipse cx="4"  cy="46" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-14 4 46)"/>
          <ellipse cx="-1" cy="52" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(6 -1 52)"/>
        </g>
      </g>

      <g class="branch" style="--bx:128px;--by:52px;--bd:5.8s;--bdl:0.2s;--ba:2.8deg">
        <path d="M 128 52 Q 130 22 142 4" stroke="#18100a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.47"/>
        <g class="lc" style="--lx:142px;--ly:4px;--ld:4.7s;--lal:0.4s;--la:5.5deg">
          <ellipse cx="0"  cy="14" rx="1.6" ry="7.5" fill="#18100a" opacity="0.32" transform="rotate(-22 0 14)"/>
          <ellipse cx="-4" cy="21" rx="1.4" ry="6.5" fill="#18100a" opacity="0.24" transform="rotate(14 -4 21)"/>
          <ellipse cx="3"  cy="28" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(-18 3 28)"/>
          <ellipse cx="-2" cy="34" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(8 -2 34)"/>
          <ellipse cx="4"  cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(-12 4 40)"/>
        </g>
      </g>

      <g class="branch" style="--bx:131px;--by:255px;--bd:6.6s;--bdl:0.8s;--ba:-3.2deg">
        <path d="M 131 255 Q 162 224 192 200" stroke="#18100a" stroke-width="2.0" fill="none" stroke-linecap="round" opacity="0.55"/>
        <g class="lc" style="--lx:192px;--ly:200px;--ld:4.9s;--lal:1.0s;--la:-5deg">
          <ellipse cx="2"  cy="20" rx="1.8" ry="9"   fill="#18100a" opacity="0.36" transform="rotate(22 2 20)"/>
          <ellipse cx="-4" cy="28" rx="1.6" ry="7.5" fill="#18100a" opacity="0.28" transform="rotate(-14 -4 28)"/>
          <ellipse cx="6"  cy="35" rx="1.4" ry="6.5" fill="#18100a" opacity="0.22" transform="rotate(30 6 35)"/>
          <ellipse cx="-1" cy="42" rx="1.3" ry="6"   fill="#18100a" opacity="0.18" transform="rotate(-8 -1 42)"/>
          <ellipse cx="4"  cy="50" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(14 4 50)"/>
          <ellipse cx="-5" cy="56" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-18 -5 56)"/>
          <ellipse cx="3"  cy="62" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(8 3 62)"/>
        </g>
      </g>

      <g class="branch" style="--bx:134px;--by:190px;--bd:7.0s;--bdl:0.3s;--ba:2.6deg">
        <path d="M 134 190 Q 166 158 198 132" stroke="#18100a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.50"/>
        <g class="lc" style="--lx:198px;--ly:132px;--ld:4.5s;--lal:0.9s;--la:-5deg">
          <ellipse cx="0"  cy="18" rx="1.7" ry="8"   fill="#18100a" opacity="0.34" transform="rotate(20 0 18)"/>
          <ellipse cx="4"  cy="26" rx="1.5" ry="7"   fill="#18100a" opacity="0.26" transform="rotate(-16 4 26)"/>
          <ellipse cx="-3" cy="33" rx="1.3" ry="6"   fill="#18100a" opacity="0.20" transform="rotate(26 -3 33)"/>
          <ellipse cx="2"  cy="40" rx="1.2" ry="5.5" fill="#18100a" opacity="0.16" transform="rotate(-10 2 40)"/>
          <ellipse cx="-5" cy="46" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(14 -5 46)"/>
          <ellipse cx="1"  cy="52" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(-6 1 52)"/>
        </g>
      </g>

      <g class="branch" style="--bx:131px;--by:315px;--bd:6.3s;--bdl:0.6s;--ba:-3.8deg">
        <path d="M 131 315 Q 162 286 190 260" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:190px;--ly:260px;--ld:5.2s;--lal:0.5s;--la:-4.5deg">
          <ellipse cx="1"  cy="16" rx="1.6" ry="7"   fill="#18100a" opacity="0.32" transform="rotate(18 1 16)"/>
          <ellipse cx="-4" cy="23" rx="1.4" ry="6"   fill="#18100a" opacity="0.24" transform="rotate(-12 -4 23)"/>
          <ellipse cx="3"  cy="29" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(22 3 29)"/>
          <ellipse cx="-2" cy="35" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(-16 -2 35)"/>
          <ellipse cx="4"  cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(10 4 40)"/>
        </g>
      </g>

      <g class="branch" style="--bx:123px;--by:315px;--bd:5.9s;--bdl:1.0s;--ba:2.4deg">
        <path d="M 123 315 Q 93 288 64 264" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:64px;--ly:264px;--ld:4.6s;--lal:0.6s;--la:4.5deg">
          <ellipse cx="-1" cy="16" rx="1.6" ry="7"   fill="#18100a" opacity="0.32" transform="rotate(-18 -1 16)"/>
          <ellipse cx="4"  cy="23" rx="1.4" ry="6"   fill="#18100a" opacity="0.24" transform="rotate(12 4 23)"/>
          <ellipse cx="-3" cy="29" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(-22 -3 29)"/>
          <ellipse cx="2"  cy="35" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(16 2 35)"/>
          <ellipse cx="-4" cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(-10 -4 40)"/>
        </g>
      </g>

    </svg>

    <!-- ==================== 桌面右侧整棵树（镜像） ==================== -->
    <svg class="wtree right desktop" viewBox="0 0 260 520" preserveAspectRatio="xMaxYMax meet">
      <defs>
        <linearGradient id="tgR" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#18100a" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#18100a" stop-opacity="0.60"/>
        </linearGradient>
      </defs>

      <path d="M 132 518 C 136 430 133 340 136 255 C 138 185 134 115 130 52"
            stroke="url(#tgR)" stroke-width="9" fill="none" stroke-linecap="round"/>

      <g class="branch" style="--bx:135px;--by:255px;--bd:6.2s;--bdl:0.3s;--ba:-3.5deg">
        <path d="M 135 255 Q 165 226 195 204" stroke="#18100a" stroke-width="2.0" fill="none" stroke-linecap="round" opacity="0.55"/>
        <g class="lc" style="--lx:195px;--ly:204px;--ld:4.6s;--lal:0.8s;--la:-5deg">
          <ellipse cx="2"  cy="20" rx="1.8" ry="9"   fill="#18100a" opacity="0.36" transform="rotate(22 2 20)"/>
          <ellipse cx="-4" cy="28" rx="1.6" ry="7.5" fill="#18100a" opacity="0.28" transform="rotate(-14 -4 28)"/>
          <ellipse cx="6"  cy="35" rx="1.4" ry="6.5" fill="#18100a" opacity="0.22" transform="rotate(30 6 35)"/>
          <ellipse cx="-1" cy="42" rx="1.3" ry="6"   fill="#18100a" opacity="0.18" transform="rotate(-8 -1 42)"/>
          <ellipse cx="4"  cy="50" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(14 4 50)"/>
          <ellipse cx="-5" cy="56" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-18 -5 56)"/>
          <ellipse cx="3"  cy="62" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(8 3 62)"/>
        </g>
      </g>

      <g class="branch" style="--bx:138px;--by:190px;--bd:7.5s;--bdl:0.7s;--ba:3.0deg">
        <path d="M 138 190 Q 168 160 198 136" stroke="#18100a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.50"/>
        <g class="lc" style="--lx:198px;--ly:136px;--ld:5.1s;--lal:0.3s;--la:-4.5deg">
          <ellipse cx="0"  cy="18" rx="1.7" ry="8"   fill="#18100a" opacity="0.34" transform="rotate(20 0 18)"/>
          <ellipse cx="4"  cy="26" rx="1.5" ry="7"   fill="#18100a" opacity="0.26" transform="rotate(-16 4 26)"/>
          <ellipse cx="-3" cy="33" rx="1.3" ry="6"   fill="#18100a" opacity="0.20" transform="rotate(26 -3 33)"/>
          <ellipse cx="2"  cy="40" rx="1.2" ry="5.5" fill="#18100a" opacity="0.16" transform="rotate(-10 2 40)"/>
          <ellipse cx="-5" cy="46" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(14 -5 46)"/>
          <ellipse cx="1"  cy="52" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(-6 1 52)"/>
        </g>
      </g>

      <g class="branch" style="--bx:132px;--by:52px;--bd:6.0s;--bdl:0.1s;--ba:-2.8deg">
        <path d="M 132 52 Q 130 22 118 4" stroke="#18100a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.47"/>
        <g class="lc" style="--lx:118px;--ly:4px;--ld:4.8s;--lal:0.5s;--la:-5.5deg">
          <ellipse cx="0"  cy="14" rx="1.6" ry="7.5" fill="#18100a" opacity="0.32" transform="rotate(22 0 14)"/>
          <ellipse cx="4"  cy="21" rx="1.4" ry="6.5" fill="#18100a" opacity="0.24" transform="rotate(-14 4 21)"/>
          <ellipse cx="-3" cy="28" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(18 -3 28)"/>
          <ellipse cx="2"  cy="34" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(-8 2 34)"/>
          <ellipse cx="-4" cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(12 -4 40)"/>
        </g>
      </g>

      <g class="branch" style="--bx:129px;--by:255px;--bd:6.8s;--bdl:0.9s;--ba:3.2deg">
        <path d="M 129 255 Q 98 224 68 200" stroke="#18100a" stroke-width="2.0" fill="none" stroke-linecap="round" opacity="0.55"/>
        <g class="lc" style="--lx:68px;--ly:200px;--ld:5.0s;--lal:0.2s;--la:5deg">
          <ellipse cx="-2" cy="20" rx="1.8" ry="9"   fill="#18100a" opacity="0.36" transform="rotate(-22 -2 20)"/>
          <ellipse cx="4"  cy="28" rx="1.6" ry="7.5" fill="#18100a" opacity="0.28" transform="rotate(14 4 28)"/>
          <ellipse cx="-6" cy="35" rx="1.4" ry="6.5" fill="#18100a" opacity="0.22" transform="rotate(-30 -6 35)"/>
          <ellipse cx="1"  cy="42" rx="1.3" ry="6"   fill="#18100a" opacity="0.18" transform="rotate(8 1 42)"/>
          <ellipse cx="-4" cy="50" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(-14 -4 50)"/>
          <ellipse cx="5"  cy="56" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(18 5 56)"/>
          <ellipse cx="-3" cy="62" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(-8 -3 62)"/>
        </g>
      </g>

      <g class="branch" style="--bx:126px;--by:190px;--bd:7.1s;--bdl:0.4s;--ba:-2.6deg">
        <path d="M 126 190 Q 94 158 62 132" stroke="#18100a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.50"/>
        <g class="lc" style="--lx:62px;--ly:132px;--ld:4.6s;--lal:1.1s;--la:5deg">
          <ellipse cx="0"  cy="18" rx="1.7" ry="8"   fill="#18100a" opacity="0.34" transform="rotate(-20 0 18)"/>
          <ellipse cx="-4" cy="26" rx="1.5" ry="7"   fill="#18100a" opacity="0.26" transform="rotate(16 -4 26)"/>
          <ellipse cx="3"  cy="33" rx="1.3" ry="6"   fill="#18100a" opacity="0.20" transform="rotate(-26 3 33)"/>
          <ellipse cx="-2" cy="40" rx="1.2" ry="5.5" fill="#18100a" opacity="0.16" transform="rotate(10 -2 40)"/>
          <ellipse cx="5"  cy="46" rx="1.0" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-14 5 46)"/>
          <ellipse cx="-1" cy="52" rx="0.9" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(6 -1 52)"/>
        </g>
      </g>

      <g class="branch" style="--bx:129px;--by:315px;--bd:6.5s;--bdl:0.55s;--ba:3.8deg">
        <path d="M 129 315 Q 98 286 70 260" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:70px;--ly:260px;--ld:5.3s;--lal:0.65s;--la:4.5deg">
          <ellipse cx="-1" cy="16" rx="1.6" ry="7"   fill="#18100a" opacity="0.32" transform="rotate(-18 -1 16)"/>
          <ellipse cx="4"  cy="23" rx="1.4" ry="6"   fill="#18100a" opacity="0.24" transform="rotate(12 4 23)"/>
          <ellipse cx="-3" cy="29" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(-22 -3 29)"/>
          <ellipse cx="2"  cy="35" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(16 2 35)"/>
          <ellipse cx="-4" cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(-10 -4 40)"/>
        </g>
      </g>

      <g class="branch" style="--bx:131px;--by:315px;--bd:6.1s;--bdl:0.85s;--ba:-2.4deg">
        <path d="M 131 315 Q 162 288 196 264" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:196px;--ly:264px;--ld:4.7s;--lal:0.35s;--la:-4.5deg">
          <ellipse cx="1"  cy="16" rx="1.6" ry="7"   fill="#18100a" opacity="0.32" transform="rotate(18 1 16)"/>
          <ellipse cx="-4" cy="23" rx="1.4" ry="6"   fill="#18100a" opacity="0.24" transform="rotate(-12 -4 23)"/>
          <ellipse cx="3"  cy="29" rx="1.2" ry="5.5" fill="#18100a" opacity="0.18" transform="rotate(22 3 29)"/>
          <ellipse cx="-2" cy="35" rx="1.1" ry="5"   fill="#18100a" opacity="0.14" transform="rotate(-16 -2 35)"/>
          <ellipse cx="4"  cy="40" rx="1.0" ry="4"   fill="#18100a" opacity="0.11" transform="rotate(10 4 40)"/>
        </g>
      </g>

    </svg>

    <!-- ==================== 移动端：顶部中央一棵 ==================== -->
    <svg class="wtree mobile" viewBox="0 0 220 320" preserveAspectRatio="xMidYMin meet">
      <path d="M 108 318 C 105 255 107 190 106 130 C 105 88 107 58 110 24"
            stroke="#18100a" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.55"/>

      <g class="branch" style="--bx:106px;--by:130px;--bd:5.8s;--bdl:0.0s;--ba:3.2deg">
        <path d="M 106 130 Q 80 108 55 92" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.52"/>
        <g class="lc" style="--lx:55px;--ly:92px;--ld:4.2s;--lal:0.3s;--la:4.5deg">
          <ellipse cx="-2" cy="16" rx="1.5" ry="7"   fill="#18100a" opacity="0.34" transform="rotate(-20 -2 16)"/>
          <ellipse cx="3"  cy="22" rx="1.3" ry="6"   fill="#18100a" opacity="0.26" transform="rotate(14 3 22)"/>
          <ellipse cx="-4" cy="28" rx="1.1" ry="5.5" fill="#18100a" opacity="0.20" transform="rotate(-26 -4 28)"/>
          <ellipse cx="2"  cy="34" rx="1.0" ry="5"   fill="#18100a" opacity="0.16" transform="rotate(10 2 34)"/>
          <ellipse cx="-3" cy="40" rx="0.9" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-14 -3 40)"/>
          <ellipse cx="4"  cy="46" rx="0.8" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(18 4 46)"/>
        </g>
      </g>

      <g class="branch" style="--bx:109px;--by:24px;--bd:6.4s;--bdl:0.4s;--ba:-2.6deg">
        <path d="M 109 24 Q 109 10 118 4" stroke="#18100a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.46"/>
        <g class="lc" style="--lx:118px;--ly:4px;--ld:4.7s;--lal:0.6s;--la:5deg">
          <ellipse cx="0"  cy="12" rx="1.4" ry="6.5" fill="#18100a" opacity="0.30" transform="rotate(-18 0 12)"/>
          <ellipse cx="-3" cy="18" rx="1.2" ry="5.5" fill="#18100a" opacity="0.22" transform="rotate(12 -3 18)"/>
          <ellipse cx="2"  cy="24" rx="1.0" ry="5"   fill="#18100a" opacity="0.16" transform="rotate(-14 2 24)"/>
          <ellipse cx="-1" cy="30" rx="0.9" ry="4"   fill="#18100a" opacity="0.12" transform="rotate(8 -1 30)"/>
          <ellipse cx="3"  cy="35" rx="0.8" ry="3.5" fill="#18100a" opacity="0.09" transform="rotate(-10 3 35)"/>
        </g>
      </g>

      <g class="branch" style="--bx:111px;--by:130px;--bd:5.5s;--bdl:0.2s;--ba:2.8deg">
        <path d="M 111 130 Q 138 108 164 92" stroke="#18100a" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.52"/>
        <g class="lc" style="--lx:164px;--ly:92px;--ld:4.0s;--lal:0.5s;--la:-4.5deg">
          <ellipse cx="2"  cy="16" rx="1.5" ry="7"   fill="#18100a" opacity="0.34" transform="rotate(20 2 16)"/>
          <ellipse cx="-3" cy="22" rx="1.3" ry="6"   fill="#18100a" opacity="0.26" transform="rotate(-14 -3 22)"/>
          <ellipse cx="4"  cy="28" rx="1.1" ry="5.5" fill="#18100a" opacity="0.20" transform="rotate(26 4 28)"/>
          <ellipse cx="-2" cy="34" rx="1.0" ry="5"   fill="#18100a" opacity="0.16" transform="rotate(-10 -2 34)"/>
          <ellipse cx="3"  cy="40" rx="0.9" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(14 3 40)"/>
          <ellipse cx="-4" cy="46" rx="0.8" ry="4"   fill="#18100a" opacity="0.10" transform="rotate(-18 -4 46)"/>
        </g>
      </g>

      <g class="branch" style="--bx:105px;--by:195px;--bd:6.8s;--bdl:0.6s;--ba:-3.2deg">
        <path d="M 105 195 Q 80 172 56 155" stroke="#18100a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:56px;--ly:155px;--ld:4.9s;--lal:0.8s;--la:4deg">
          <ellipse cx="-1" cy="14" rx="1.4" ry="6.5" fill="#18100a" opacity="0.30" transform="rotate(-16 -1 14)"/>
          <ellipse cx="3"  cy="20" rx="1.2" ry="5.5" fill="#18100a" opacity="0.22" transform="rotate(12 3 20)"/>
          <ellipse cx="-2" cy="26" rx="1.0" ry="5"   fill="#18100a" opacity="0.16" transform="rotate(-10 -2 26)"/>
          <ellipse cx="2"  cy="32" rx="0.9" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(8 2 32)"/>
          <ellipse cx="-3" cy="38" rx="0.8" ry="4"   fill="#18100a" opacity="0.09" transform="rotate(-6 -3 38)"/>
        </g>
      </g>

      <g class="branch" style="--bx:112px;--by:195px;--bd:6.2s;--bdl:0.3s;--ba:2.6deg">
        <path d="M 112 195 Q 138 172 164 155" stroke="#18100a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.45"/>
        <g class="lc" style="--lx:164px;--ly:155px;--ld:4.5s;--lal:0.7s;--la:-4deg">
          <ellipse cx="1"  cy="14" rx="1.4" ry="6.5" fill="#18100a" opacity="0.30" transform="rotate(16 1 14)"/>
          <ellipse cx="-3" cy="20" rx="1.2" ry="5.5" fill="#18100a" opacity="0.22" transform="rotate(-12 -3 20)"/>
          <ellipse cx="2"  cy="26" rx="1.0" ry="5"   fill="#18100a" opacity="0.16" transform="rotate(10 2 26)"/>
          <ellipse cx="-2" cy="32" rx="0.9" ry="4.5" fill="#18100a" opacity="0.12" transform="rotate(-8 -2 32)"/>
          <ellipse cx="3"  cy="38" rx="0.8" ry="4"   fill="#18100a" opacity="0.09" transform="rotate(6 3 38)"/>
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

.wtree {
  position: absolute;
  display: block;
}

/* 桌面：树根在底部，吸附视口左右边缘 */
.wtree.left.desktop  { left: -10px;  bottom: 0; width: 260px; height: 520px; }
.wtree.right.desktop { right: -10px; bottom: 0; width: 260px; height: 520px; }

/* 移动端：树冠从顶部垂下（锚顶部中央） */
.wtree.mobile {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 320px;
}

.wtree.desktop { display: block; }
.wtree.mobile  { display: none; }

@media (max-width: 768px) {
  .wtree.desktop { display: none; }
  .wtree.mobile  { display: block; }
}

/* ===== 枝条绕树干挂载点微旋转 ===== */
.branch {
  transform-box: view-box;                     /* SVG 用户坐标 */
  transform-origin: var(--bx, 0) var(--by, 0); /* 旋转中心 = 枝条挂载点 */
  animation: branch-sway var(--bd, 6s) ease-in-out infinite;
  animation-delay: var(--bdl, 0s);
  will-change: transform;
}

@keyframes branch-sway {
  0%, 100% { transform: rotate(0deg); }
  35%       { transform: rotate(var(--ba, 3deg)); }
  65%       { transform: rotate(calc(-0.6 * var(--ba, 3deg))); }
}

/* ===== 垂叶绕枝尾挂载点独立飘荡 ===== */
.lc {
  transform-box: view-box;
  transform-origin: var(--lx, 0) var(--ly, 0);
  animation: leaf-sway var(--ld, 4.5s) ease-in-out infinite;
  animation-delay: var(--lal, 0s);
  will-change: transform;
}

@keyframes leaf-sway {
  0%, 100% { transform: rotate(0deg); }
  40%       { transform: rotate(var(--la, 5deg)); }
  60%       { transform: rotate(calc(-0.5 * var(--la, 5deg))); }
}

@media (prefers-reduced-motion: reduce) {
  .branch, .lc { animation: none; }
}
</style>
