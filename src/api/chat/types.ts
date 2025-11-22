/**
 * API 类型定义文件
 */

// ============ 消息相关类型 ============

/**
 * 消息角色（扩展版，包含所有 AG-UI 支持的角色）
 */
export type TextMessageRole = 'developer' | 'system' | 'assistant' | 'user'
export type MessageRole = TextMessageRole | 'tool'

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
 * SSE 事件类型常量（完整版）
 */
export const SSEEventType = {
  // 文本消息事件
  TEXT_MESSAGE_START: 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT: 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END: 'TEXT_MESSAGE_END',
  TEXT_MESSAGE_CHUNK: 'TEXT_MESSAGE_CHUNK',
  
  // 思考消息事件
  THINKING_TEXT_MESSAGE_START: 'THINKING_TEXT_MESSAGE_START',
  THINKING_TEXT_MESSAGE_CONTENT: 'THINKING_TEXT_MESSAGE_CONTENT',
  THINKING_TEXT_MESSAGE_END: 'THINKING_TEXT_MESSAGE_END',
  
  // 工具调用事件
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_ARGS: 'TOOL_CALL_ARGS',
  TOOL_CALL_END: 'TOOL_CALL_END',
  TOOL_CALL_CHUNK: 'TOOL_CALL_CHUNK',
  TOOL_CALL_RESULT: 'TOOL_CALL_RESULT',
  
  // 思考步骤事件
  THINKING_START: 'THINKING_START',
  THINKING_END: 'THINKING_END',
  
  // 状态事件
  STATE_SNAPSHOT: 'STATE_SNAPSHOT',
  STATE_DELTA: 'STATE_DELTA',
  
  // 消息快照事件
  MESSAGES_SNAPSHOT: 'MESSAGES_SNAPSHOT',
  
  // 活动事件
  ACTIVITY_SNAPSHOT: 'ACTIVITY_SNAPSHOT',
  ACTIVITY_DELTA: 'ACTIVITY_DELTA',
  
  // 其他事件
  RAW: 'RAW',
  CUSTOM: 'CUSTOM',
  
  // 运行事件
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  RUN_ERROR: 'RUN_ERROR',
  
  // 步骤事件
  STEP_STARTED: 'STEP_STARTED',
  STEP_FINISHED: 'STEP_FINISHED',
} as const

export type SSEEventType = typeof SSEEventType[keyof typeof SSEEventType]

/**
 * SSE 基础事件接口
 */
export interface BaseSSEEvent {
  type: string
  timestamp?: number
  raw_event?: any
}

// ============ 运行事件 ============

/**
 * 运行开始事件
 */
export interface RunStartedEvent extends BaseSSEEvent {
  type: 'RUN_STARTED'
  thread_id: string
  run_id: string
  parent_run_id?: string
  input?: any
}

/**
 * 运行结束事件
 */
export interface RunFinishedEvent extends BaseSSEEvent {
  type: 'RUN_FINISHED'
  thread_id: string
  run_id: string
  result?: any
}

/**
 * 运行错误事件
 */
export interface RunErrorEvent extends BaseSSEEvent {
  type: 'RUN_ERROR'
  message: string
  code?: string
}

// ============ 步骤事件 ============

/**
 * 步骤开始事件
 */
export interface StepStartedEvent extends BaseSSEEvent {
  type: 'STEP_STARTED'
  step_name: string
}

/**
 * 步骤结束事件
 */
export interface StepFinishedEvent extends BaseSSEEvent {
  type: 'STEP_FINISHED'
  step_name: string
}

// ============ 文本消息事件 ============

/**
 * 文本消息开始事件
 */
export interface TextMessageStartEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_START'
  message_id: string
  role: TextMessageRole
}

/**
 * 文本消息内容事件
 */
export interface TextMessageContentEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_CONTENT'
  message_id: string
  delta: string
}

/**
 * 文本消息结束事件
 */
export interface TextMessageEndEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_END'
  message_id: string
}

/**
 * 文本消息块事件
 */
export interface TextMessageChunkEvent extends BaseSSEEvent {
  type: 'TEXT_MESSAGE_CHUNK'
  message_id?: string
  role?: TextMessageRole
  delta?: string
}

// ============ 思考消息事件 ============

/**
 * 思考文本消息开始事件
 */
export interface ThinkingTextMessageStartEvent extends BaseSSEEvent {
  type: 'THINKING_TEXT_MESSAGE_START'
}

/**
 * 思考文本消息内容事件
 */
export interface ThinkingTextMessageContentEvent extends BaseSSEEvent {
  type: 'THINKING_TEXT_MESSAGE_CONTENT'
  delta: string
}

/**
 * 思考文本消息结束事件
 */
export interface ThinkingTextMessageEndEvent extends BaseSSEEvent {
  type: 'THINKING_TEXT_MESSAGE_END'
}

// ============ 工具调用事件 ============

/**
 * 工具调用开始事件
 */
export interface ToolCallStartEvent extends BaseSSEEvent {
  type: 'TOOL_CALL_START'
  tool_call_id: string
  tool_call_name: string
  parent_message_id?: string
}

/**
 * 工具调用参数事件
 */
export interface ToolCallArgsEvent extends BaseSSEEvent {
  type: 'TOOL_CALL_ARGS'
  tool_call_id: string
  delta: string
}

/**
 * 工具调用结束事件
 */
export interface ToolCallEndEvent extends BaseSSEEvent {
  type: 'TOOL_CALL_END'
  tool_call_id: string
}

/**
 * 工具调用块事件
 */
export interface ToolCallChunkEvent extends BaseSSEEvent {
  type: 'TOOL_CALL_CHUNK'
  tool_call_id?: string
  tool_call_name?: string
  parent_message_id?: string
  delta?: string
}

/**
 * 工具调用结果事件
 */
export interface ToolCallResultEvent extends BaseSSEEvent {
  type: 'TOOL_CALL_RESULT'
  message_id: string
  tool_call_id: string
  content: string
  role?: 'tool'
}

// ============ 思考步骤事件 ============

/**
 * 思考开始事件
 */
export interface ThinkingStartEvent extends BaseSSEEvent {
  type: 'THINKING_START'
  title?: string
}

/**
 * 思考结束事件
 */
export interface ThinkingEndEvent extends BaseSSEEvent {
  type: 'THINKING_END'
}

// ============ 状态事件 ============

/**
 * 状态快照事件
 */
export interface StateSnapshotEvent extends BaseSSEEvent {
  type: 'STATE_SNAPSHOT'
  snapshot: Record<string, any>
}

/**
 * 状态增量事件（JSON Patch RFC 6902）
 */
export interface StateDeltaEvent extends BaseSSEEvent {
  type: 'STATE_DELTA'
  delta: any[] // JSON Patch 格式
}

// ============ 消息快照事件 ============

/**
 * 消息快照事件
 */
export interface MessagesSnapshotEvent extends BaseSSEEvent {
  type: 'MESSAGES_SNAPSHOT'
  messages: Message[]
}

// ============ 活动事件 ============

/**
 * 活动快照事件
 */
export interface ActivitySnapshotEvent extends BaseSSEEvent {
  type: 'ACTIVITY_SNAPSHOT'
  message_id: string
  activity_type: string
  content: any
  replace?: boolean
}

/**
 * 活动增量事件（JSON Patch）
 */
export interface ActivityDeltaEvent extends BaseSSEEvent {
  type: 'ACTIVITY_DELTA'
  message_id: string
  activity_type: string
  patch: any[] // JSON Patch 格式
}

// ============ 其他事件 ============

/**
 * 原始事件
 */
export interface RawEvent extends BaseSSEEvent {
  type: 'RAW'
  event: any
  source?: string
}

/**
 * 自定义事件
 */
export interface CustomEvent extends BaseSSEEvent {
  type: 'CUSTOM'
  name: string
  value: any
}

/**
 * SSE 事件联合类型（完整版）
 */
export type SSEEvent =
  // 运行事件
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  // 步骤事件
  | StepStartedEvent
  | StepFinishedEvent
  // 文本消息事件
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | TextMessageChunkEvent
  // 思考消息事件
  | ThinkingTextMessageStartEvent
  | ThinkingTextMessageContentEvent
  | ThinkingTextMessageEndEvent
  // 工具调用事件
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallChunkEvent
  | ToolCallResultEvent
  // 思考步骤事件
  | ThinkingStartEvent
  | ThinkingEndEvent
  // 状态事件
  | StateSnapshotEvent
  | StateDeltaEvent
  // 消息快照事件
  | MessagesSnapshotEvent
  // 活动事件
  | ActivitySnapshotEvent
  | ActivityDeltaEvent
  // 其他事件
  | RawEvent
  | CustomEvent

// ============ SSE 处理器类型 ============

/**
 * SSE 事件处理器（完整版）
 */
export interface SSEEventHandlers {
  // 运行事件处理器
  onRunStarted?: (event: RunStartedEvent) => void
  onRunFinished?: (event: RunFinishedEvent) => void
  onRunError?: (event: RunErrorEvent) => void
  
  // 步骤事件处理器
  onStepStarted?: (event: StepStartedEvent) => void
  onStepFinished?: (event: StepFinishedEvent) => void
  
  // 文本消息事件处理器
  onMessageStart?: (event: TextMessageStartEvent) => void
  onMessageContent?: (event: TextMessageContentEvent) => void
  onMessageEnd?: (event: TextMessageEndEvent) => void
  onMessageChunk?: (event: TextMessageChunkEvent) => void
  
  // 思考消息事件处理器
  onThinkingMessageStart?: (event: ThinkingTextMessageStartEvent) => void
  onThinkingMessageContent?: (event: ThinkingTextMessageContentEvent) => void
  onThinkingMessageEnd?: (event: ThinkingTextMessageEndEvent) => void
  
  // 工具调用事件处理器
  onToolCallStart?: (event: ToolCallStartEvent) => void
  onToolCallArgs?: (event: ToolCallArgsEvent) => void
  onToolCallEnd?: (event: ToolCallEndEvent) => void
  onToolCallChunk?: (event: ToolCallChunkEvent) => void
  onToolCallResult?: (event: ToolCallResultEvent) => void
  
  // 思考步骤事件处理器
  onThinkingStart?: (event: ThinkingStartEvent) => void
  onThinkingEnd?: (event: ThinkingEndEvent) => void
  
  // 状态事件处理器
  onStateSnapshot?: (event: StateSnapshotEvent) => void
  onStateDelta?: (event: StateDeltaEvent) => void
  
  // 消息快照事件处理器
  onMessagesSnapshot?: (event: MessagesSnapshotEvent) => void
  
  // 活动事件处理器
  onActivitySnapshot?: (event: ActivitySnapshotEvent) => void
  onActivityDelta?: (event: ActivityDeltaEvent) => void
  
  // 其他事件处理器
  onRawEvent?: (event: RawEvent) => void
  onCustomEvent?: (event: CustomEvent) => void
  
  // 错误和完成处理器
  onError?: (error: Error) => void
  onComplete?: () => void
}
