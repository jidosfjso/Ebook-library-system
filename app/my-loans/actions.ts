"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// 归还表单的状态类型
export type ReturnState = { error?: string }

// 归还 Server Action：由「我的借阅」页的「归还」按钮触发
export async function returnBook(
  _prevState: ReturnState,
  formData: FormData
): Promise<ReturnState> {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const loanId = formData.get("loanId") as string
  const userId = session.user.id
  if (!loanId) return { error: "参数错误" }

  try {
    // 事务保证「写归还记录 + 加回库存」的原子性
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } })
      if (!loan) throw new Error("借阅记录不存在")
      // 只能归还自己的借阅记录
      if (loan.userId !== userId) throw new Error("无权操作此借阅记录")
      if (loan.status === "RETURNED") throw new Error("该图书已归还")

      // 写入实际归还时间，并把状态改为 RETURNED。
      // 用「条件更新」兜底并发：只有状态仍不是 RETURNED 时才更新成功，
      // 避免两个并发请求同时通过上面的校验，导致库存被重复加回。
      const updated = await tx.loan.updateMany({
        where: { id: loanId, status: { not: "RETURNED" } },
        data: { returnDate: new Date(), status: "RETURNED" },
      })
      if (updated.count === 0) throw new Error("该图书已归还")

      // 归还后，可借库存 +1
      await tx.book.update({
        where: { id: loan.bookId },
        data: { availableCopies: { increment: 1 } },
      })
    })
  } catch (error) {
    return { error: (error as Error).message || "归还失败，请重试" }
  }

  // 归还成功，刷新「我的借阅」页
  redirect("/my-loans")
}
