<template>
  <header class="app-header">
    <div class="header-inner app-container">
      <router-link to="/" class="brand">
        <span class="brand-seal">文心</span>
        <div class="brand-text">
          <h1 class="brand-title">文心疗愈</h1>
          <p class="brand-sub">Literary Heal</p>
        </div>
      </router-link>

      <nav class="nav">
        <router-link to="/" class="nav-link" exact>
          <span class="nav-zh">问心</span>
          <span class="nav-en">Chat</span>
        </router-link>
        <router-link to="/history" class="nav-link">
          <span class="nav-zh">回响</span>
          <span class="nav-en">History</span>
        </router-link>
        <router-link to="/admin" class="nav-link">
          <span class="nav-zh">藏书阁</span>
          <span class="nav-en">Library</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(245, 239, 225, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ink-10);
  box-shadow: 0 1px 0 rgba(26, 26, 26, 0.04);
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  padding-bottom: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.brand-seal {
  display: inline-block;
  background: var(--vermilion);
  color: var(--paper-light);
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.18em;
  padding: 6px 8px;
  border: 2px solid var(--vermilion-dark);
  border-radius: 2px;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba(168, 50, 58, 0.15);
  transform: rotate(-3deg);
  transition: transform 0.3s var(--ease);
}

.brand:hover .brand-seal { transform: rotate(0deg) scale(1.05); }

.brand-title {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink-100);
  line-height: 1;
}

.brand-sub {
  font-family: serif;
  font-size: 10px;
  color: var(--ink-40);
  letter-spacing: 0.2em;
  margin-top: 2px;
  text-transform: uppercase;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 4px;
  transition: all 0.3s var(--ease);
  position: relative;
}

.nav-zh {
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  letter-spacing: 0.18em;
  color: var(--ink-80);
  transition: color 0.3s var(--ease);
}

.nav-en {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--ink-40);
  margin-top: 2px;
  text-transform: uppercase;
}

.nav-link:hover {
  background: rgba(168, 50, 58, 0.06);
}

.nav-link.router-link-active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--vermilion);
}

.nav-link.router-link-active .nav-zh {
  color: var(--vermilion);
}

@media (max-width: 768px) {
  .header-inner { padding: 10px 14px; }
  .brand-title { font-size: 18px; }
  .brand-sub { display: none; }
  .nav-link { padding: 6px 8px; }
  .nav-zh { font-size: 13px; letter-spacing: 0.1em; }
  .nav-en { display: none; }
}
</style>
