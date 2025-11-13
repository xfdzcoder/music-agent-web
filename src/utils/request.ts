/**
 * Axios 全局封装
 * 提供统一的请求/响应拦截、错误处理等功能
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'

/**
 * 创建 axios 实例
 */
const instance: AxiosInstance = axios.create({
  baseURL: '/api', // 使用代理路径
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器
 */
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据
    return response
  },
  (error: AxiosError) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          console.error('请求参数错误', data)
          break
        case 401:
          console.error('未授权，请重新登录', data)
          // 可以在这里处理登出逻辑
          break
        case 403:
          console.error('拒绝访问', data)
          break
        case 404:
          console.error('请求的资源不存在', data)
          break
        case 500:
          console.error('服务器内部错误', data)
          break
        default:
          console.error(`请求失败: ${status}`, data)
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * 通用请求方法
 */
export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return instance.request<T>(config).then((res) => res.data)
}

/**
 * GET 请求
 */
export function get<T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.get<T>(url, { params, ...config }).then((res) => res.data)
}

/**
 * POST 请求
 */
export function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.post<T>(url, data, config).then((res) => res.data)
}

/**
 * PUT 请求
 */
export function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.put<T>(url, data, config).then((res) => res.data)
}

/**
 * DELETE 请求
 */
export function del<T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.delete<T>(url, { params, ...config }).then((res) => res.data)
}

/**
 * PATCH 请求
 */
export function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.patch<T>(url, data, config).then((res) => res.data)
}

/**
 * 上传文件
 */
export function upload<T = any>(
  url: string,
  file: File | Blob,
  onProgress?: (progressEvent: any) => void
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)

  return instance.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress,
  }).then((res) => res.data)
}

/**
 * 下载文件
 */
export function download(url: string, filename?: string): Promise<void> {
  return instance.get(url, {
    responseType: 'blob',
  }).then((response) => {
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename || 'download'
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

/**
 * 导出 axios 实例（用于特殊需求）
 */
export default instance
