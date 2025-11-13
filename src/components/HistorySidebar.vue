<template>
  <div class="history-sidebar" :class="{ 'is-open': isOpen }">
    <!-- 遮罩层 -->
    <div v-if="isOpen" class="sidebar-overlay" @click="close"></div>
    
    <!-- 侧边栏内容 -->
    <div class="sidebar-content">
      <!-- 头部 -->
      <div class="sidebar-header">
        <h2 class="sidebar-title">历史会话</h2>
        <button class="close-button" @click="close">
          ✕
        </button>
      </div>

      <!-- 历史列表 -->
      <div class="history-list">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="histories.length === 0" class="empty">
          <p>暂无历史会话</p>
        </div>

        <div
          v-else
          v-for="item in histories"
          :key="item.thread_id"
          class="history-item"
          :class="{ 'is-active': item.thread_id === currentThreadId }"
          @click="handleSelectHistory(item)"
        >
          <div class="history-name">{{ item.name || '未命名会话' }}</div>
          <div class="history-time">{{ formatTime(item.updated_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { HistoryItem } from '@/api/chat/types.ts'

// Props
const props = defineProps<{
  isOpen: boolean
  histories: HistoryItem[]
  currentThreadId: string
  loading?: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  select: [threadId: string]
  refresh: []
}>()

// 关闭侧边栏
function close() {
  emit('close')
}

// 选择历史会话
function handleSelectHistory(item: HistoryItem) {
  emit('select', item.thread_id)
  emit('close')
}

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 今天
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate()) {
    return '昨天'
  }
  
  // 本周
  if (diff < 604800000) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  })
}

// 监听打开状态，自动刷新数据
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    emit('refresh')
  }
})
</script>

<style scoped>
.history-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

.history-sidebar.is-open {
  pointer-events: auto;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s;
}

.sidebar-content {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  background-color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
}

.history-sidebar.is-open .sidebar-content {
  transform: translateX(0);
}

.sidebar-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.history-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.history-item:hover {
  background-color: #f3f4f6;
}

.history-item.is-active {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: #9ca3af;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
