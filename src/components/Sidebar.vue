<template>
  <div class="sidebar-container" @mouseleave="handleMouseLeave">

    <div class="hover-trigger" @mouseenter="handleMouseEnter"></div>

    <div
        class="sidebar"
        :class="{ 'sidebar-visible': isHovered }"
        :style="{
          '--bg-color': color,
          '--bg-dark': themeDarkColor,
        }"
        @mouseenter="handleMouseEnter"
    >
      <div class="sidebar-logo">
        <span class="logo-icon">🎵</span>
      </div>

      <nav class="sidebar-menu">
        <div
            v-for="item in menuItems"
            :key="item.key"
            class="menu-item"
            :class="{ 'menu-item-active': currentMenu === item.key }"
            @click="$emit('menu-change', item.key)"
            :title="item.label"
        >
          <span class="menu-icon">{{ item.icon }}</span>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useColor } from "@/stores/color.ts"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color.ts"

interface MenuItem {
  key: string
  label: string
  icon: string
}

defineProps<{
  currentMenu: string
}>()

defineEmits<{
  "menu-change": [key: string]
}>()

const isHovered = ref(false)

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const menuItems = computed<MenuItem[]>(() => [
  { key: "now-playing", label: "正在播放", icon: "🎶" },
  { key: "all-songs", label: "所有歌曲", icon: "🎼" },
  { key: "my-playlists", label: "我的歌单", icon: "📁" },
  { key: "settings", label: "设置", icon: "⚙️" },
])

const colorStore = useColor()
const { color } = storeToRefs(colorStore)

const themeDarkColor = computed(() => {
  return adjustBrightness(color.value, -20)
})
</script>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 9999;
  display: flex;
  /* 关键：让鼠标事件可以穿透容器本身，只由子元素捕获 */
  pointer-events: none;
}

.hover-trigger {
  /* 建议 20px，只负责边缘触发 */
  width: 20px;
  height: 100%;
  background: transparent;
  position: absolute;
  left: 0;
  top: 0;
  /* 修复重点：层级要比 sidebar 低 */
  z-index: 10000;
  /* 开启鼠标交互 */
  pointer-events: auto;
}

.sidebar {
  width: 80px;
  height: 100%;
  transform: translateX(-100%);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  background: radial-gradient(
      circle at 50% 20%,
      var(--bg-color) 0%,
      var(--bg-dark) 100%
  );
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;

  /* 修复重点：层级要比 trigger 高，这样出来后才能被点击 */
  z-index: 10001;
  /* 开启鼠标交互 */
  pointer-events: auto;

  padding-top: 60px;
}

.sidebar-visible {
  transform: translateX(0);
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s;
}

.sidebar-logo:hover .logo-icon {
  transform: scale(1.1) rotate(10deg);
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 10px;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
}

.menu-item {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: rgba(255, 255, 255, 0.6);
  position: relative;
  flex-shrink: 0; /* 防止被压缩 */
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: scale(1.05);
}

.menu-item-active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-icon {
  font-size: 24px;
  line-height: 1;
  display: block;
  color: var(--bg-color);
}

/* 左侧指示条修复 */
.menu-item-active::before {
  content: '';
  position: absolute;
  /* 计算逻辑：
     Sidebar宽80px，Item宽50px，Item居中。
     所以Item距离左边界 = (80 - 50) / 2 = 15px。
     为了贴在屏幕最左边，left 应该是 -15px。
  */
  left: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: white;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 10px rgba(255,255,255,0.5);
}
</style>