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
   * 根据事件类型分发处理
   * @param event SSE 事件
   */
  private handleEvent(event: SSEEvent): void {
    switch (event.type) {
      case 'RUN_STARTED':
        this.handlers.onRunStarted?.(event)
        break
      case 'RUN_FINISHED':
        this.handlers.onRunFinished?.(event)
        break
      case 'TEXT_MESSAGE_START':
        this.handlers.onMessageStart?.(event)
        break
      case 'TEXT_MESSAGE_CONTENT':
        this.handlers.onMessageContent?.(event)
        break
      case 'TEXT_MESSAGE_END':
        this.handlers.onMessageEnd?.(event)
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
