<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="isOpen" class="chat-dialog-overlay">
        <div class="chat-dialog-container" ref="dialogContainer">

          <div class="chat-content">
            <div ref="messagesContainer" class="messages-container">
              <div
                  v-if="chatStore.allMessages.length === 0"
                  class="empty-state"
                  :style="emptyStateStyle"
              >
                <div class="empty-icon">✨</div>
                <h2>你好！我是你的音乐小精灵</h2>
                <p>有什么我可以帮你的吗？</p>
              </div>

              <div v-else class="messages-list">
                <MessageItem
                    v-for="message in chatStore.allMessages"
                    :key="message.id"
                    :message="message"
                />
              </div>
            </div>

            <ChatInput
                :is-sending="chatStore.isSending"
                @send="handleSend"
            />
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from "vue"
import { useChatStore } from "@/stores/chat"
import { useColor } from "@/stores/color"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color"
import MessageItem from "@/components/MessageItem.vue"
import ChatInput from "@/components/ChatInput.vue"

// Props & Emits
const props = defineProps<{ isOpen : boolean }>()
const emit = defineEmits<{ close : [], "update:isOpen" : [value : boolean] }>()

// Store
const chatStore = useChatStore()
const colorStore = useColor()
const { color } = storeToRefs(colorStore)

// State
const messagesContainer = ref<HTMLDivElement>()
const dialogContainer = ref<HTMLDivElement>()

// --- 1. 计算空状态的样式 (仅父组件使用) ---
const emptyStateStyle = computed(() => {
  const mainColor = color.value
  const lightColor = adjustBrightness(mainColor, 60)
  // 将 Hex 转 RGB 用于阴影
  const hexToRgb = (hex : string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${ parseInt(result[1], 16) }, ${ parseInt(result[2], 16) }, ${ parseInt(result[3], 16) }` : "255,255,255"
  }

  return {
    "--empty-title-gradient": `linear-gradient(135deg, #fff 0%, ${ lightColor } 100%)`,
    "--empty-icon-shadow": `rgba(${ hexToRgb(mainColor) }, 0.4)`,
    "--empty-text-color": lightColor
  }
})

// --- 逻辑部分 ---
function handleClickOutside(event : MouseEvent) {
  if (props.isOpen && dialogContainer.value && ! dialogContainer.value.contains(event.target as Node)) {
    // 点击外部逻辑
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside))
onUnmounted(() => document.removeEventListener("click", handleClickOutside))

async function handleSend(content : string) {
  await chatStore.send(content)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => chatStore.allMessages.length, scrollToBottom)
watch(() => chatStore.streamingMessage?.content, scrollToBottom)
</script>

<style scoped>
.chat-dialog-overlay {
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

.chat-dialog-container {
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

.chat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px 24px 40px;

  position: relative; /* 确保 mask-image 在某些浏览器中工作 */

  /* =====================================
     新增渐变遮罩效果
     ===================================== */
  mask-image: linear-gradient(
      to bottom,
      transparent 0%, /* 顶部开始透明 (隐藏内容) */ black 10%, /* 5% 处开始完全不透明 (显示内容) */ black 90%, /* 保持不透明直到 95% */ transparent 100% /* 底部结束透明 (隐藏内容) */
  );
  -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 10%,
      black 90%,
      transparent 100%
  );
}

/* 滚动条隐藏或美化 */
.messages-container::-webkit-scrollbar {
  width: 0px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 10px 20px var(--empty-icon-shadow));
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  background: var(--empty-title-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
  color: var(--empty-text-color);
  opacity: 0.8;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 弹窗动画 */
.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-active .chat-dialog-container, .dialog-fade-leave-active .chat-dialog-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .chat-dialog-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
</style>