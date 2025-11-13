<template>
  <div class="chat-view">
    <!-- 头部工具栏 -->
    <div class="chat-header">
      <button class="header-button" @click="openHistory">
        📋 历史会话
      </button>
      <h1 class="header-title">AI 助手</h1>
      <button class="header-button" @click="handleNewChat">
        ➕ 新对话
      </button>
    </div>

    <!-- 消息列表区域 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="chatStore.allMessages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h2>开始对话</h2>
        <p>向 AI 助手发送消息，开始你的对话之旅</p>
      </div>

      <div v-else class="messages-list">
        <MessageItem
          v-for="message in chatStore.allMessages"
          :key="message.id"
          :message="message"
        />
      </div>
    </div>

    <!-- 输入区域 -->
    <ChatInput
      :is-sending="chatStore.isSending"
      @send="handleSend"
    />

    <!-- 历史会话侧边栏 -->
    <HistorySidebar
      :is-open="isHistoryOpen"
      :histories="chatStore.histories"
      :current-thread-id="chatStore.currentThreadId"
      :loading="isLoadingHistory"
      @close="closeHistory"
      @select="handleSelectHistory"
      @refresh="loadHistories"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import MessageItem from '@/components/MessageItem.vue'
import ChatInput from '@/components/ChatInput.vue'
import HistorySidebar from '@/components/HistorySidebar.vue'

// 使用 Store
const chatStore = useChatStore()

// 状态
const messagesContainer = ref<HTMLDivElement>()
const isHistoryOpen = ref(false)
const isLoadingHistory = ref(false)

// 发送消息
async function handleSend(content: string) {
  await chatStore.send(content)
  // 滚动到底部
  scrollToBottom()
}

// 新建对话
function handleNewChat() {
  if (chatStore.isSending) {
    if (confirm('当前正在发送消息，确定要创建新对话吗？')) {
      chatStore.abortSending()
      chatStore.createNewChat()
    }
  } else {
    chatStore.createNewChat()
  }
}

// 打开历史会话
function openHistory() {
  isHistoryOpen.value = true
}

// 关闭历史会话
function closeHistory() {
  isHistoryOpen.value = false
}

// 加载历史会话列表
async function loadHistories() {
  isLoadingHistory.value = true
  try {
    await chatStore.loadHistories()
  } finally {
    isLoadingHistory.value = false
  }
}

// 选择历史会话
async function handleSelectHistory(threadId: string) {
  await chatStore.loadHistoryChat(threadId)
  scrollToBottom()
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动到底部
watch(
  () => chatStore.allMessages.length,
  () => {
    scrollToBottom()
  }
)

// 监听流式消息内容变化，自动滚动
watch(
  () => chatStore.streamingMessage?.content,
  () => {
    scrollToBottom()
  }
)
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f9fafb;
}

.chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-button {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.header-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.header-button:active {
  transform: scale(0.98);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.messages-list {
  max-width: 900px;
  margin: 0 auto;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
