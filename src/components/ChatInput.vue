<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="input-field"
        placeholder="输入消息... (Shift + Enter 换行，Enter 发送)"
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
        <span v-else>发送中...</span>
      </button>
    </div>
    <div v-if="isSending" class="sending-indicator">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

// Props
const props = defineProps<{
  isSending?: boolean
  disabled?: boolean
}>()

// Emits
const emit = defineEmits<{
  send: [content: string]
}>()

// 状态
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 计算属性
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !props.isSending && !props.disabled
})

// 处理键盘事件
function handleKeydown(event: KeyboardEvent) {
  // Enter 发送，Shift + Enter 换行
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

// 发送消息
function handleSend() {
  if (!canSend.value) {
    return
  }

  const content = inputText.value.trim()
  if (content) {
    emit('send', content)
    inputText.value = ''
    
    // 重置高度
    nextTick(() => {
      adjustHeight()
    })
  }
}

// 自动调整文本框高度
function adjustHeight() {
  const textarea = textareaRef.value
  if (!textarea) return

  // 重置高度以获取正确的 scrollHeight
  textarea.style.height = 'auto'
  
  // 设置新高度，最大 200px
  const newHeight = Math.min(textarea.scrollHeight, 200)
  textarea.style.height = `${newHeight}px`
}

// 暴露方法
defineExpose({
  focus: () => {
    textareaRef.value?.focus()
  },
  clear: () => {
    inputText.value = ''
    adjustHeight()
  }
})
</script>

<style scoped>
.chat-input {
  border-top: 1px solid #e5e7eb;
  background-color: white;
  padding: 16px;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-height: 42px;
  max-height: 200px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow-y: auto;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-field:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: #9ca3af;
}

.send-button {
  flex-shrink: 0;
  height: 42px;
  padding: 0 24px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.send-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.send-button:active:not(:disabled) {
  transform: scale(0.98);
}

.send-button:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.sending-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  height: 20px;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
