<template>
  <div class="chat-input">
    <div class="input-container" :style="inputStyle">
      <textarea
          ref="textareaRef"
          v-model="inputText"
          class="input-field"
          placeholder="输入消息... (Shift + Enter 换行)"
          rows="1"
          :disabled="disabled"
          @keydown="handleKeydown"
          @input="adjustHeight"
      />
      <button
          class="send-button"
          :disabled="!canSend"
          @click="handleSend"
      >
        <span v-if="!isSending">发送</span>
        <span v-else>...</span>
      </button>
    </div>
    <div v-if="isSending" class="sending-indicator">
      <span class="dot" :style="{ background: themeColor }"></span>
      <span class="dot" :style="{ background: themeColor }"></span>
      <span class="dot" :style="{ background: themeColor }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useColor } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { adjustBrightness } from '@/utils/color'

const props = defineProps<{ isSending?: boolean; disabled?: boolean }>()
const emit = defineEmits<{(e: 'send', content: string): void}>()

// --- 独立样式计算 ---
const colorStore = useColor()
const { color } = storeToRefs(colorStore)

// 方便模板直接使用主色调
const themeColor = computed(() => color.value)

const inputStyle = computed(() => {
  const mainColor = color.value
  const darkColor = adjustBrightness(mainColor, -40)
  const highlightColor = adjustBrightness(mainColor, 140)

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '0,0,0'
  }

  const mainRgb = hexToRgb(mainColor)
  const darkRgb = hexToRgb(darkColor)

  return {
    // 输入框背景：深色主色 + 透明
    '--input-bg': `rgba(${darkRgb}, 0.5)`,
    '--input-bg-focus': `rgba(${darkRgb}, 0.7)`,
    '--input-border': `rgba(${mainRgb}, 0.3)`,
    '--input-text': highlightColor,
    '--input-placeholder': `rgba(${mainRgb}, 0.6)`,
    '--theme-color': mainColor,
    '--btn-shadow': `rgba(${mainRgb}, 0.4)`,
    // 禁用按钮样式变量
    '--disabled-bg': `rgba(${mainRgb}, 0.2)`,
    '--disabled-text': `rgba(255, 255, 255, 0.6)`,
  }
})

// --- 业务逻辑 ---
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 定义最大高度（用于 adjustHeight）
const MAX_ROWS = 3

const canSend = computed(() => inputText.value.trim().length > 0 && !props.isSending && !props.disabled)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!canSend.value) return
  const content = inputText.value.trim()
  if (content) {
    emit('send', content)
    inputText.value = ''
    nextTick(() => adjustHeight())
  }
}

function adjustHeight() {
  const textarea = textareaRef.value
  if (!textarea) return

  // 1. 重置高度以获取正确的 scrollHeight
  textarea.style.height = 'auto'

  // 2. 计算最大高度（基于 line-height 和 padding）
  // line-height: 1.5; font-size: 14px => 21px/line
  const lineHeight = 21
  // padding-top (12px) + padding-bottom (12px) + 3 lines * lineHeight (21px) = 24 + 63 = 87px
  const maxHeight = lineHeight * MAX_ROWS + 24

  // 3. 设置新高度，限制在 MAX_ROWS 内
  const newHeight = Math.min(textarea.scrollHeight, maxHeight)
  textarea.style.height = `${newHeight}px`
}

defineExpose({
  focus: () => textareaRef.value?.focus(),
  clear: () => { inputText.value = ''; adjustHeight() }
})
</script>

<style scoped>
.chat-input {
  background: transparent;
  backdrop-filter: none;
  padding: 16px 24px;
  border-radius: 0 0 24px 24px;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-height: 46px;
  max-height: 200px; /* 逻辑上通过 JS 控制最大行数，这里保持较大值或移除 */
  padding: 12px 18px;

  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);

  border-radius: 24px;
  font-size: 14px;
  line-height: 1.5; /* 21px */
  font-family: inherit;
  resize: none;
  /* 允许滚动，但我们要隐藏滚动条 */
  overflow-y: auto;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* 优化 1: 隐藏滚动条 */
.input-field::-webkit-scrollbar { width: 0px; } /* Chrome, Safari, Opera */
.input-field { -ms-overflow-style: none; } /* IE and Edge */
.input-field { scrollbar-width: none; } /* Firefox */

.input-field:focus {
  outline: none;
  background: var(--input-bg-focus);
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.input-field::placeholder { color: var(--input-placeholder); }
.input-field:disabled { opacity: 0.8; cursor: not-allowed; }


/* 发送按钮 */
.send-button {
  flex-shrink: 0;
  height: 46px;
  padding: 0 24px;
  background: var(--theme-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px var(--btn-shadow);
  backdrop-filter: blur(4px);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.send-button:active:not(:disabled) { transform: scale(0.96); }

/* 优化 2: 禁用按钮颜色基于主题色 */
.send-button:disabled {
  background: var(--disabled-bg); /* 主题色半透明背景 */
  color: var(--disabled-text);   /* 浅色半透明文字 */
  box-shadow: none;
  cursor: not-allowed;
}

.sending-indicator {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  height: 20px;
}
.dot { width: 6px; height: 6px; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
</style>