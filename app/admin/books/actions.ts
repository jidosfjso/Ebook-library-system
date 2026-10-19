"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// 删除图书的状态类型
export type DeleteBookState = { error?: string }

// 删除图书 Server Action：由管理列表的「删除」按钮触发
export async function deleteBook(
  _prevState: DeleteBookState,
  formData: FormData
): Promise<DeleteBookState> {
  // 仅管理员可操作（非管理员会被重定向，不会继续执行）
  await requireAdmin()

  const bookId = formData.get("bookId") as string
  if (!bookId) return { error: "参数错误" }

  // 有未归还借阅的图书禁止删除，避免「书没了但读者还欠着书」的数据不一致
  const activeLoans = await prisma.loan.count({
    where: { bookId, status: { in: ["BORROWED", "OVERDUE"] } },
  })
  if (activeLoans > 0) {
    return { error: `该书还有 ${activeLoans} 本未归还，无法删除` }
  }

  // 删除图书；已归还的借阅记录随 schema 的 onDelete: Cascade 一并清除
  await prisma.book.delete({ where: { id: bookId } })

  // 删除成功，跳回管理列表
  redirect("/admin/books")
}
