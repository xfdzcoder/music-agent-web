<template>
  <div
    class="message-item"
    :class="[
      message.role === 'user' ? 'message-user' : 'message-assistant'
    ]"
  >
    <div class="message-avatar">
      <span v-if="message.role === 'user'">👤</span>
      <span v-else>🤖</span>
    </div>
    <div class="message-content">
      <div class="message-role">
        {{ message.role === 'user' ? '我' : 'AI助手' }}
      </div>
      <div class="message-text" v-html="renderedContent"></div>
      <div v-if="message.createdAt" class="message-time">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import type { Message } from '@/api/chat/types.ts'

// Props
const props = defineProps<{
  message: Message
}>()

// 创建 Markdown 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
})

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  return md.render(props.message.content || '')
})

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  
  // 小于 1 天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  
  // 返回具体时间
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.message-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: #f5f5f5;
}

.message-user {
  flex-direction: row-reverse;
  background-color: #f0f9ff;
}

.message-user:hover {
  background-color: #e0f2fe;
}

.message-assistant {
  background-color: #f9fafb;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-user .message-content {
  text-align: right;
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  word-wrap: break-word;
}

.message-user .message-text {
  text-align: left;
}

/* Markdown 样式 */
.message-text :deep(p) {
  margin: 0.5em 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.message-text :deep(a:hover) {
  color: #2563eb;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 12px;
  margin: 8px 0;
  color: #6b7280;
}

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: left;
}

.message-text :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
