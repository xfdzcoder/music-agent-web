/**
 * SSE (Server-Sent Events) 服务封装
 * 支持 AG-UI 规范的流式响应处理
 */

import type { SSEEvent, SSEEventHandlers } from '@/api/chat/types.ts'

/**
 * SSE 连接类
 * 用于处理流式响应，自动解析 AG-UI 格式的事件
 */
export class SSEConnection {
  private abortController: AbortController | null = null
  private handlers: SSEEventHandlers

  constructor(handlers: SSEEventHandlers) {
    this.handlers = handlers
  }

  /**
   * 发起 SSE 请求
   * @param url 请求 URL
   * @param options fetch 请求选项
   */
  async connect(url: string, options: RequestInit = {}): Promise<void> {
    // 创建新的 AbortController
    this.abortController = new AbortController()

    try {
      const response = await fetch(url, {
        ...options,
        signal: this.abortController.signal,
        headers: {
          ...options.headers,
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 处理流式响应
      await this.processStream(response.body)
      
      // 调用完成回调
      this.handlers.onComplete?.()
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('SSE connection aborted')
        } else {
          this.handlers.onError?.(error)
        }
      }
    }
  }

  /**
   * 处理流式响应
   * @param body 响应体
   */
  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      // 解码数据块
      buffer += decoder.decode(value, { stream: true })
      
      // 按行分割
      const lines = buffer.split('\n')
      
      // 保留最后一个不完整的行
      buffer = lines.pop() || ''
      
      // 处理每一行
      for (const line of lines) {
        this.processLine(line)
      }
    }
    
    // 处理剩余的缓冲区
    if (buffer.trim()) {
      this.processLine(buffer)
    }
  }

  /**
   * 处理单行数据
   * @param line 数据行
   */
  private processLine(line: string): void {
    const trimmedLine = line.trim()
    
    if (!trimmedLine || !trimmedLine.startsWith('data:')) {
      return
    }
    
    // 提取 data: 后的 JSON 内容
    const jsonStr = trimmedLine.substring(5).trim()
    
    if (!jsonStr) {
      return
    }
    
    try {
      const event = JSON.parse(jsonStr) as SSEEvent
      this.handleEvent(event)
    } catch (error) {
      console.error('Failed to parse SSE event:', error, jsonStr)
    }
  }

  /**
   * 根据事件类型分发处理（支持所有 AG-UI 事件）
   * @param event SSE 事件
   */
  private handleEvent(event: SSEEvent): void {
    switch (event.type) {
      // 运行事件
      case 'RUN_STARTED':
        this.handlers.onRunStarted?.(event)
        break
      case 'RUN_FINISHED':
        this.handlers.onRunFinished?.(event)
        break
      case 'RUN_ERROR':
        this.handlers.onRunError?.(event)
        break
      
      // 步骤事件
      case 'STEP_STARTED':
        this.handlers.onStepStarted?.(event)
        break
      case 'STEP_FINISHED':
        this.handlers.onStepFinished?.(event)
        break
      
      // 文本消息事件
      case 'TEXT_MESSAGE_START':
        this.handlers.onMessageStart?.(event)
        break
      case 'TEXT_MESSAGE_CONTENT':
        this.handlers.onMessageContent?.(event)
        break
      case 'TEXT_MESSAGE_END':
        this.handlers.onMessageEnd?.(event)
        break
      case 'TEXT_MESSAGE_CHUNK':
        this.handlers.onMessageChunk?.(event)
        break
      
      // 思考消息事件
      case 'THINKING_TEXT_MESSAGE_START':
        this.handlers.onThinkingMessageStart?.(event)
        break
      case 'THINKING_TEXT_MESSAGE_CONTENT':
        this.handlers.onThinkingMessageContent?.(event)
        break
      case 'THINKING_TEXT_MESSAGE_END':
        this.handlers.onThinkingMessageEnd?.(event)
        break
      
      // 工具调用事件
      case 'TOOL_CALL_START':
        this.handlers.onToolCallStart?.(event)
        break
      case 'TOOL_CALL_ARGS':
        this.handlers.onToolCallArgs?.(event)
        break
      case 'TOOL_CALL_END':
        this.handlers.onToolCallEnd?.(event)
        break
      case 'TOOL_CALL_CHUNK':
        this.handlers.onToolCallChunk?.(event)
        break
      case 'TOOL_CALL_RESULT':
        this.handlers.onToolCallResult?.(event)
        break
      
      // 思考步骤事件
      case 'THINKING_START':
        this.handlers.onThinkingStart?.(event)
        break
      case 'THINKING_END':
        this.handlers.onThinkingEnd?.(event)
        break
      
      // 状态事件
      case 'STATE_SNAPSHOT':
        this.handlers.onStateSnapshot?.(event)
        break
      case 'STATE_DELTA':
        this.handlers.onStateDelta?.(event)
        break
      
      // 消息快照事件
      case 'MESSAGES_SNAPSHOT':
        this.handlers.onMessagesSnapshot?.(event)
        break
      
      // 活动事件
      case 'ACTIVITY_SNAPSHOT':
        this.handlers.onActivitySnapshot?.(event)
        break
      case 'ACTIVITY_DELTA':
        this.handlers.onActivityDelta?.(event)
        break
      
      // 其他事件
      case 'RAW':
        this.handlers.onRawEvent?.(event)
        break
      case 'CUSTOM':
        this.handlers.onCustomEvent?.(event)
        break
      
      default:
        console.warn('Unknown SSE event type:', event)
    }
  }

  /**
   * 中断连接
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.abortController !== null
  }
}

/**
 * 创建 SSE 连接的便捷函数
 * @param url 请求 URL
 * @param options 请求选项
 * @param handlers 事件处理器
 * @returns SSE 连接实例
 */
export function createSSEConnection(
  url: string,
  options: RequestInit,
  handlers: SSEEventHandlers
): SSEConnection {
  const connection = new SSEConnection(handlers)
  connection.connect(url, options)
  return connection
}
