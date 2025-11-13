/**
 * API 类型定义文件
 */

// ============ 消息相关类型 ============

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant'

/**
 * 消息接口
 */
export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
}

// ============ 聊天请求/响应类型 ============

/**
 * 发送消息请求体
 */
export interface ChatRequest {
  thread_id: string
  run_id: string
  state?: Record<string, any>
  messages?: Message[]
  tools?: any[]
  context?: any[]
  forwarded_props?: Record<string, any>
}

/**
 * 发送消息的Payload（简化版）
 */
export interface SendMessagePayload {
  content: string
  state?: Record<string, any>
  messages?: Message[]
  tools?: any[]
  context?: any[]
  forwardedProps?: Record<string, any>
}

// ============ 历史记录类型 ============

/**
 * 历史会话项
 */
export interface HistoryItem {
  user_id: string
  thread_id: string
  name: string
  created_at: string
  updated_at: string
}

/**
 * 历史会话列表响应
 */
export type HistoriesResponse = HistoryItem[]

/**
 * 单个历史记录详情响应
 */
export type HistoryDetailResponse = Message[]

// ============ SSE 事件类型 ============

/**
 * SSE 事件类型常量
 */
export const SSEEventType = {
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  TEXT_MESSAGE_START: 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT: 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END: 'TEXT_MESSAGE_END',
} as const

export type SSEEventType = typeof SSEEventType[keyof typeof SSEEventType]

/**
 * SSE 基础事件接口
 */
export interface BaseSSEEvent {
  type: SSEEventType
}

/**
 * 运行开始事件
 */
export interface RunStartedEvent extends BaseSSEEvent {
  type: 'RUN_STARTED'
  threadId: string
  runId: string
}

/**
 * 运行结束事件
 */
export interface RunFinishedEvent extends BaseSSEEvent {
  type: 'RUN_FINISHED'
  threadId: string
  runId: string
}

/**
 * 文本消息开始事件
 */
export interface TextMessageStartEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_START'
  messageId: string
  role: MessageRole
}

/**
 * 文本消息内容事件
 */
export interface TextMessageContentEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_CONTENT'
  messageId: string
  delta: string
}

/**
 * 文本消息结束事件
 */
export interface TextMessageEndEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_END'
  messageId: string
}

/**
 * SSE 事件联合类型
 */
export type SSEEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent

// ============ SSE 处理器类型 ============

/**
 * SSE 事件处理器
 */
export interface SSEEventHandlers {
  onRunStarted?: (event: RunStartedEvent) => void
  onRunFinished?: (event: RunFinishedEvent) => void
  onMessageStart?: (event: TextMessageStartEvent) => void
  onMessageContent?: (event: TextMessageContentEvent) => void
  onMessageEnd?: (event: TextMessageEndEvent) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}
