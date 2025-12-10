<template>
  <div
      class="message-item"
      :class="[message.role === 'user' ? 'message-user' : 'message-assistant']"
      :style="itemStyle"
  >
    <div class="message-bubble">
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
import { useColor } from '@/stores/color.ts'
import { storeToRefs } from 'pinia'
import { adjustBrightness, hexToRgb } from "@/utils/color.ts"

const props = defineProps<{ message: Message }>()

// --- 独立计算样式 ---
const colorStore = useColor()
const { color } = storeToRefs(colorStore)

const itemStyle = computed(() => {
  const mainColor = color.value
  const darkColor = adjustBrightness(mainColor, -40)
  const highlightColor = adjustBrightness(mainColor, 140) // 极亮色，用于深底文字

  const mainRgb = hexToRgb(mainColor)

  return {
    // User: 渐变
    '--user-bg': `linear-gradient(135deg, ${mainColor}, ${darkColor})`,

    // Assistant: 玻璃拟态变量
    // '--assist-bg': `rgba(${darkRgb}, 0.7)`, // 深色半透明
    '--assist-bg': `linear-gradient(135deg, ${darkColor}, ${mainColor})`, // 深色半透明
    '--assist-text': highlightColor, // 保证文字清晰
    '--assist-code-bg': `rgba(0, 0, 0, 0.3)`, // 代码块深色背景
    '--link-color': adjustBrightness(mainColor, 50), // 链接颜色
    // 确保边框颜色变量存在，即使 CSS 中目前没用，但 blockquote 需要
    '--assist-border': `rgba(${mainRgb}, 0.2)`,
  }
})

// Markdown 逻辑
const md = new MarkdownIt({ html: true, linkify: true, breaks: true })
const renderedContent = computed(() => md.render(props.message.content || ''))

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.message-user { justify-content: flex-end; }
.message-assistant { justify-content: flex-start; }

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

/* User 样式 */
.message-user .message-bubble {
  background: var(--user-bg);
  color: white;
  border-bottom-right-radius: 4px;
}

/* Assistant 样式 (玻璃拟态) */
.message-assistant .message-bubble {
  background: var(--assist-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--assist-text);
  border-bottom-left-radius: 4px;
}

.message-text { font-size: 14px; line-height: 1.6; word-wrap: break-word; }
.message-time { font-size: 11px; margin-top: 6px; opacity: 0.6; text-align: right; }

/* Markdown 深度样式适配 */
.message-text :deep(p) { margin: 0.5em 0; }
.message-text :deep(p:first-child) { margin-top: 0; }
.message-text :deep(p:last-child) { margin-bottom: 0; }

.message-text :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

/* 根据不同角色区分代码块背景 */
.message-assistant .message-text :deep(code) { background-color: var(--assist-code-bg); color: #e2e8f0; }
.message-user .message-text :deep(code) { background-color: rgba(255,255,255,0.2); color: inherit; }

.message-text :deep(pre) {
  background-color: rgba(0,0,0,0.4);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid rgba(255,255,255,0.1);
}
.message-text :deep(pre code) { background: transparent; padding: 0; }

.message-text :deep(a) { text-decoration: underline; color: var(--link-color); }
.message-user .message-text :deep(a) { color: white; }

.message-text :deep(blockquote) {
  border-left: 4px solid var(--assist-border);
  padding-left: 12px;
  margin: 8px 0;
  background: rgba(0,0,0,0.1);
}

.message-text :deep(ul),
.message-text :deep(ol) {
  /* 列表默认通常没有外边距，但需要内边距来显示序号或圆点 */
  margin: 8px 0;
  /* 增加左侧内边距，让序号/圆点和消息气泡保持间隙 */
  padding-left: 24px;
}

.message-text :deep(li) {
  /* 列表项之间的间距 */
  margin: 4px 0;
}
</style>