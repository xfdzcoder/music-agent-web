/**
 * 聊天状态管理 Store
 * 管理当前会话、消息列表、历史会话等状态
 */

import { defineStore } from "pinia"
import { computed, ref } from "vue"
import type { HistoryItem, Message } from "@/api/chat/types.ts"
import { getHistories, getHistoryDetail, sendMessage } from "@/api/chat/chat.ts"
import { SSEConnection } from "@/utils/sse.ts"

/**
 * 生成唯一的会话 ID
 */
function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 聊天 Store
 */
export const useChatStore = defineStore('chat', () => {
  // ============ 状态定义 ============
  
  /** 当前会话 ID */
  const currentThreadId = ref<string>(generateThreadId())
  
  /** 当前会话的消息列表 */
  const messages = ref<Message[]>([])
  
  /** 历史会话列表 */
  const histories = ref<HistoryItem[]>([])
  
  /** 是否正在发送消息 */
  const isSending = ref(false)
  
  /** 当前 SSE 连接 */
  let currentConnection: SSEConnection | null = null
  
  /** 正在接收的消息内容（用于流式显示） */
  const streamingMessage = ref<Message | null>(null)

  // ============ 计算属性 ============
  
  /** 当前会话的所有消息（包括流式消息） */
  const allMessages = computed(() => {
    if (streamingMessage.value) {
      return [...messages.value, streamingMessage.value]
    }
    return messages.value
  })

  // ============ 操作方法 ============
  
  /**
   * 发送消息
   */
  async function send(content: string) {
    if (!content.trim() || isSending.value) {
      return
    }

    isSending.value = true

    // 添加用户消息到列表
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }
    messages.value.push(userMessage)

    // 初始化流式消息
    streamingMessage.value = {
      id: 'temp-assistant',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    try {
      // 发送消息并处理 SSE 响应
      currentConnection = sendMessage(
        currentThreadId.value,
        { content: content.trim() },
        {
          onRunStarted: (event) => {
            console.log('Run started:', event)
          },
          onMessageStart: (event) => {
            console.log('Message start:', event)
            if (streamingMessage.value) {
              streamingMessage.value.id = event.message_id
            }
          },
          onMessageContent: (event) => {
            // 追加消息内容
            if (streamingMessage.value) {
              streamingMessage.value.content += event.delta
            }
          },
          onMessageEnd: (event) => {
            console.log('Message end:', event)
            // 将流式消息添加到正式消息列表
            if (streamingMessage.value) {
              messages.value.push({ ...streamingMessage.value })
              streamingMessage.value = null
            }
          },
          onRunFinished: (event) => {
            console.log('Run finished:', event)
            isSending.value = false
          },
          onError: (error) => {
            console.error('SSE error:', error)
            isSending.value = false
            streamingMessage.value = null
            // 可以在这里添加错误提示
          },
          onComplete: () => {
            console.log('SSE connection completed')
            isSending.value = false
          },
        }
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      isSending.value = false
      streamingMessage.value = null
    }
  }

  /**
   * 创建新对话
   */
  function createNewChat() {
    // 中断当前连接
    if (currentConnection) {
      currentConnection.abort()
      currentConnection = null
    }

    // 重置状态
    currentThreadId.value = generateThreadId()
    messages.value = []
    streamingMessage.value = null
    isSending.value = false
  }

  /**
   * 加载历史会话列表
   */
  async function loadHistories() {
    try {
      histories.value = await getHistories()
    } catch (error) {
      console.error('Failed to load histories:', error)
    }
  }

  /**
   * 加载并切换到指定的历史会话
   */
  async function loadHistoryChat(threadId: string) {
    try {
      // 中断当前连接
      if (currentConnection) {
        currentConnection.abort()
        currentConnection = null
      }

      // 加载历史消息
      const historyMessages = await getHistoryDetail(threadId)
      
      // 更新状态
      currentThreadId.value = threadId
      messages.value = historyMessages
      streamingMessage.value = null
      isSending.value = false
    } catch (error) {
      console.error('Failed to load history chat:', error)
    }
  }

  /**
   * 中断当前消息发送
   */
  function abortSending() {
    if (currentConnection) {
      currentConnection.abort()
      currentConnection = null
    }
    isSending.value = false
    streamingMessage.value = null
  }

  // ============ 返回 ============
  
  return {
    // 状态
    currentThreadId,
    messages,
    histories,
    isSending,
    streamingMessage,
    allMessages,
    
    // 方法
    send,
    createNewChat,
    loadHistories,
    loadHistoryChat,
    abortSending,
  }
})
