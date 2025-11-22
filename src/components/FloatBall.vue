<template>
  <div 
    class="float-ball-container"
    @mouseenter="showMenu = true"
    @mouseleave="showMenu = false"
    :style="{
      '--bg-color': color,
      '--bg-dark': themeDarkColor
    }"
  >
    <!-- 菜单小球 -->
    <Transition name="menu-fade">
      <div v-if="showMenu || menuContentVisible" class="menu-balls">
        <div
          class="menu-ball"
          @click="handleNewChat"
          title="新会话"
        >
          <span class="menu-icon">
            <i class="bi bi-chat" :style="{ color: clockHistory }"></i>
          </span>
        </div>
        <div
          class="menu-ball"
          @click="handleHistory"
          title="历史会话"
        >
          <span class="menu-icon">
            <i class="bi bi-clock-history" :style="{ color: clockHistory }"></i>
          </span>
        </div>
      </div>
    </Transition>

    <!-- 主悬浮球 -->
    <div
      class="float-ball"
      @click="handleClick"
    >
      <!--      :class="{ 'is-hover': showMenu }"-->
      <div class="ball-avatar">
        <span class="ball-icon">
          <i class="bi bi-music-note-beamed" :style="{ color: musicNoteBeamedColor }"></i>
        </span>
      </div>
      <div class="ball-glow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useChatStore } from '@/stores/chat'
import { useColor } from "@/stores/color.ts"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color.ts"

defineProps<{
  menuContentVisible: boolean
}>()

// Emits
const emit = defineEmits<{
  'open-chat': []
  'open-history': []
}>()

const chatStore = useChatStore()
const showMenu = ref(false)

// 点击主球 - 打开聊天
function handleClick() {
  emit('open-chat')
}

// 新会话
function handleNewChat() {
  chatStore.createNewChat()
  emit('open-chat')
}

// 历史会话
function handleHistory() {
  emit('open-history')
}

const colorStore = useColor()
const { color } = storeToRefs(colorStore)
const themeDarkColor = computed(() => {
  // 核心修改：基于提取的颜色，生成一个暗 60% 的颜色
  // 这样右侧背景就是深色系的主题色，而不是死板的纯黑
  return adjustBrightness(color.value, 0)
})
const musicNoteBeamedColor = computed(() => {
  return adjustBrightness(color.value, 12)
})
const clockHistory = computed(() => {
  return adjustBrightness(color.value, 32)
})
</script>
<style scoped>
.float-ball-container {
  position: fixed;     /* 固定在视口 */
  right: 32px;
  bottom: 132px;
  z-index: 9998;
  width: 64px;
  height: 200px;       /* 包含主球 + 两个菜单项的高度：64 + 2*(56+12) = 200 */
  pointer-events: auto;
}

/* 主悬浮球 */
.float-ball {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(
      circle at 20% 50%,
      var(--bg-color) 0%,
      var(--bg-dark) 100%
  );
  box-shadow: 0 8px 24px var(--bg-color);
  cursor: pointer;
  position: absolute;  /* 绝对定位在容器内底部 */
  bottom: 0;
  right: 0;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;         /* 主球置顶 */
}

.float-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px var(--bg-color);
}

.float-ball.is-hover {
  transform: scale(0.95);
}

.ball-avatar {
  position: relative;
  z-index: 2;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.ball-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  color: var(--bg-color);
}

/* 光晕效果 */
.ball-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(
      circle at 20% 50%,
      var(--bg-color) 0%,
      var(--bg-dark) 100%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.float-ball:hover .ball-glow {
  opacity: 1;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* 菜单小球容器（绝对定位，不会撑开父容器布局） */
.menu-balls {
  position: absolute;
  bottom: 76px; /* 放在主球正上方 */
  width: 64px;
  right: 0;
  display: flex;
  flex-direction: column; /* 从下到上排列（第一个在上面），如需第一个在最近主球可改为 column-reverse */
  align-items: center;
  gap: 12px;
  z-index: 5; /* 菜单在主球下层 */
  pointer-events: auto; /* 允许点击菜单 */
}

/* 菜单小球 */
.menu-ball {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(
      circle at 20% 50%,
      var(--bg-color) 0%,
      var(--bg-dark) 100%
  );
  box-shadow: 0 6px 20px var(--bg-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s;
  opacity: 1;
}

/* 进入动画（Vue Transition 名称为 menu-fade）*/
.menu-fade-enter-from .menu-ball {
  opacity: 0;
  transform: translateY(20px) scale(0.5);
}
.menu-fade-enter-to .menu-ball {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.menu-fade-enter-active .menu-ball:nth-child(1) {
  transition-delay: 0.05s;
}
.menu-fade-enter-active .menu-ball:nth-child(2) {
  transition-delay: 0.10s;
}

/* 离开动画 */
.menu-fade-leave-from .menu-ball {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.menu-fade-leave-to .menu-ball {
  opacity: 0;
  transform: translateY(20px) scale(0.5);
}
.menu-fade-leave-active .menu-ball:nth-child(1) {
  transition-delay: 0.05s;
}
.menu-fade-leave-active .menu-ball:nth-child(2) {
  transition-delay: 0.10s;
}
</style>
