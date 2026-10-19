// 借阅相关常量与工具函数（集中管理，避免魔法数字散落各处）

// 借阅期限（天）
export const BORROW_DAYS = 14

// 同一读者最多同时未归还的借阅数量
export const MAX_ACTIVE_LOANS = 5

// 借阅状态 -> 中文标签
export const LOAN_STATUS_LABEL: Record<
  "BORROWED" | "RETURNED" | "OVERDUE",
  string
> = {
  BORROWED: "借阅中",
  RETURNED: "已归还",
  OVERDUE: "已逾期",
}

// 格式化日期时间为「2026/10/19 20:30」这种易读格式
export function formatDateTime(date: Date) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
