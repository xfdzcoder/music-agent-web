/**
 * 聊天 API 服务
 * 封装所有聊天相关的接口调用
 */

import { get } from '@/utils/request'
import type {
  ChatRequest,
  SendMessagePayload,
  HistoriesResponse,
  HistoryDetailResponse,
  SSEEventHandlers,
} from '@/api/chat/types.ts'
import { SSEConnection } from '@/utils/sse.ts'

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 发送聊天消息（SSE 流式响应）
 * @param threadId 会话 ID
 * @param payload 消息 payload
 * @param handlers SSE 事件处理器
 * @returns SSE 连接实例
 */
export function sendMessage(
  threadId: string,
  payload: SendMessagePayload,
  handlers: SSEEventHandlers
): SSEConnection {
  const runId = generateId()
  const messageId = generateId()

  const requestBody: ChatRequest = {
    thread_id: threadId,
    run_id: runId,
    state: payload.state ?? {},
    messages: payload.messages ?? [
      {
        id: messageId,
        role: 'user' as const,
        content: payload.content,
      },
    ],
    tools: payload.tools ?? [],
    context: payload.context ?? [],
    forwarded_props: payload.forwardedProps ?? {},
  }

  const connection = new SSEConnection(handlers)

  // 使用 fetch 发起 SSE 请求
  connection.connect('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  return connection
}

/**
 * 获取所有历史会话列表
 * @returns 历史会话列表
 */
export async function getHistories(): Promise<HistoriesResponse> {
  return get<HistoriesResponse>('/chat/histories')
}

/**
 * 获取单个历史会话的消息详情
 * @param threadId 会话 ID
 * @returns 消息列表
 */
export async function getHistoryDetail(
  threadId: string
): Promise<HistoryDetailResponse> {
  return get<HistoryDetailResponse>(`/chat/history/${threadId}`)
}


