<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="isOpen" class="history-overlay" tabindex="-1" ref="overlayRef">
        <div
            class="history-container"
            ref="containerRef"
            @click.stop
            :style="containerStyle"
        >

          <!-- 内容 -->
          <div class="history-body">
            <div
                ref="listRef"
                class="history-list"
                role="list"
                tabindex="0"
                aria-label="历史会话列表"
            >
              <!-- empty / loading -->
              <div v-if="loading" class="history-empty">
                <div class="spinner" aria-hidden="true"></div>
                <div class="empty-txt">加载中...</div>
              </div>

              <div v-else-if="histories.length === 0" class="history-empty">
                <div class="empty-icon">✨</div>
                <h4 class="empty-title">还没有会话</h4>
                <p class="empty-desc">开始一个新对话，历史会在这里保存</p>
              </div>

              <!-- items -->
              <div v-else class="history-items">
                <div
                    v-for="item in histories"
                    :key="item.thread_id"
                    class="history-item"
                    :class="{ 'is-active': item.thread_id === currentThreadId }"
                    @click="select(item.thread_id)"
                    role="listitem"
                >
                  <div class="item-bubble">
                    <div class="item-title" :title="item.name">{{ item.name || '未命名会话' }}</div>
                    <div class="item-time">{{ formatTime(item.updated_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useColor } from '@/stores/color' // 若不存在，请替换为你的主题获取方法
import { storeToRefs } from 'pinia'
import { adjustBrightness } from '@/utils/color'
import { useChatStore } from "@/stores/chat.ts"
import { formatTime } from "@/utils/date.ts" // 请确保存在；若不存在可替换实现

// props / emits
const props = defineProps<{ isOpen: boolean }>()

// refs
const overlayRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

// 内部状态（组件自己维护）
// const histories = ref<HistoryItem[]>([])
// const loading = ref(false)
const currentThreadId = ref<string | null>(null)

const colorStore = useColor()
const { color } = storeToRefs(colorStore)

const chatStore = useChatStore()
const { histories } = storeToRefs(chatStore)
const { loadHistories, loadHistoryChat } = chatStore

// 颜色辅助函数
function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return { r, g, b }
}
function clamp(n: number, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, Math.round(n))) }
function adjustHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return '#' + [clamp(r + amount).toString(16).padStart(2, '0'),
    clamp(g + amount).toString(16).padStart(2, '0'),
    clamp(b + amount).toString(16).padStart(2, '0')].join('')
}

// 计算样式变量（绑定到 container）
const mainRgb = (() => {
  const { r, g, b } = hexToRgb(color.value)
  return `${r}, ${g}, ${b}`
})()

const containerStyle = computed(() => {
  const light = adjustBrightness ? adjustBrightness(color.value, 60) : adjustHex(color.value, 60)
  const dark = adjustBrightness ? adjustBrightness(color.value, -30) : adjustHex(color.value, -30)
  // 背景渐变用于 item（气泡）；container 本身透明
  return {
    '--main-rgb': mainRgb,
    '--theme-color': color.value,
    '--theme-light': light,
    '--theme-dark': dark,
    '--item-hover-bg': `linear-gradient(135deg, ${color.value}, ${dark})`,
    '--item-active-bg': `linear-gradient(135deg, ${dark}, ${color.value})`
  }
})

function select(threadId: string) {
  currentThreadId.value = threadId
  loadHistoryChat(threadId)
}

// 生命周期
onMounted(() => {
  // 如果打开则加载
  if (props.isOpen) loadHistories()
})

watch(() => props.isOpen, (val) => {
  if (val) {
    loadHistories()
  }
})
</script>

<style scoped>
/* Overlay（透明、pointer-events 控制）—— 与 ChatDialog 的 overlay 保持一致 */
.history-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 9999;
  padding: 20px;
  pointer-events: none;
}

/* Container 与 ChatDialog 一致：透明、无边框、无阴影 */
.history-container {
  width: 100%;
  max-width: 800px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 24px;
  overflow: hidden;

  /* 关键：全透明，无背景，无阴影 */
  background: transparent;
  box-shadow: none;
  border: none;

  margin-right: 92px;
  margin-bottom: 132px;
  pointer-events: auto;
}

/* Body 包含列表 */
.history-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 列表区域：mask-image 实现上下渐隐 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px 18px 28px;
  position: relative;
  -webkit-overflow-scrolling: touch;

  /* mask-image 渐隐（与 ChatDialog messages-container 保持一致） */
  mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
  );
  -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
  );
}

/* 隐藏或细化滚动条 */
.history-list::-webkit-scrollbar { width: 6px; }
.history-list::-webkit-scrollbar-track { background: transparent; }
.history-list::-webkit-scrollbar-thumb { background: rgba(var(--main-rgb), 0.12); border-radius: 3px; }

/* loading / empty */
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 12px;
  color: rgba(255,255,255,0.85);
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 8px 20px rgba(var(--main-rgb), 0.25));
  animation: float 3s ease-in-out infinite;
}
.empty-title {
  font-size: 18px;
  margin: 6px 0 4px;
  font-weight: 600;
  background: linear-gradient(135deg, #fff 0%, var(--theme-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.empty-desc { font-size: 13px; margin: 0; color: rgba(255,255,255,0.75); }

@keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }

/* -----------------------
   history-item（气泡卡片）—— 仿 MessageItem 的风格
   ----------------------- */
.history-items { display: flex; flex-direction: column; gap: 10px; }

/* 每个条目容器（透明背景，内层 bubble 展示渐变） */
.history-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 4px;
  transition: transform 0.16s ease, opacity 0.18s ease;
}

/* 气泡 */
.item-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  max-width: 100%;
  min-width: 0;
  width: 100%;
  /* 默认气泡为半透明玻璃（保持整体透明但有层次） */
  background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.95);
  box-shadow: none; /* 无阴影（按要求） */
  cursor: pointer;
  transform-origin: left center;
  transition: transform 0.18s ease, background 0.18s ease;
}

/* 标题/时间 */
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-time {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  opacity: 0.95;
}

/* hover - 采用主题渐变（更有质感） */
.history-item:hover .item-bubble {
  transform: translateY(-4px);
  background-image: var(--item-hover-bg);
  color: white;
  /* 增强文字可读性 */
  -webkit-text-fill-color: white;
}

/* active（选中） */
.history-item.is-active .item-bubble {
  transform: translateY(-4px);
  background-image: var(--item-active-bg);
  color: white;
  -webkit-text-fill-color: white;
  outline: none;
}

/* 轻微入场动画 */
.history-item { opacity: 0; animation: slideIn 0.28s ease forwards; }
.history-item:nth-child(1){ animation-delay: 0.02s }
.history-item:nth-child(2){ animation-delay: 0.04s }
.history-item:nth-child(3){ animation-delay: 0.06s }
.history-item:nth-child(4){ animation-delay: 0.08s }
.history-item:nth-child(5){ animation-delay: 0.10s }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 小屏 / 自适应微调 */
@media (max-width: 480px) {
  .history-container {
    max-width: calc(100% - 40px);
    margin-right: 20px;
    margin-bottom: 90px;
    height: 70vh;
  }
}

/* dialog-fade 动画（与 ChatDialog 保持一致） */
.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
