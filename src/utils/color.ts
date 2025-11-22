// ================= 工具函数：颜色变暗 =================
// 将 Hex 颜色变暗百分之多少 (amount: 0 ~ 100)
// 例如：adjustBrightness('#ffffff', -50) 变暗50%
export const adjustBrightness = (hex : string, percent : number) => {
  // 移除 # 号
  hex = hex.replace(/^\s*#|\s*$/g, "")
  // 处理简写 hex (e.g. #333)
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, "$1$1")
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // 计算新的 RGB
  const amount = Math.floor(255 * (percent / 100))

  const newR = Math.max(0, Math.min(255, r + amount))
  const newG = Math.max(0, Math.min(255, g + amount))
  const newB = Math.max(0, Math.min(255, b + amount))

  // 转回 Hex
  const result = ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)
  return `#${ result }`
}