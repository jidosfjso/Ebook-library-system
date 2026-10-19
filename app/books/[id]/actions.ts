"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BORROW_DAYS, MAX_ACTIVE_LOANS } from "@/lib/loan"

// 借阅表单的状态类型
export type BorrowState = { error?: string }

// 借阅 Server Action：由图书详情页的「借阅」按钮触发
export async function borrowBook(
  _prevState: BorrowState,
  formData: FormData
): Promise<BorrowState> {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // 只有普通读者能借阅，管理员负责管理图书
  if (session.user.role !== "USER") {
    return { error: "管理员账号不支持借阅" }
  }

  const bookId = formData.get("bookId") as string
  const userId = session.user.id
  if (!bookId) return { error: "参数错误" }

  // 计算应还时间：借出时间 + 借期
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + BORROW_DAYS)

  try {
    // 用事务保证「查重 + 扣减库存 + 创建借阅记录」的原子性
    await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } })
      if (!book) throw new Error("图书不存在")

      // 同一用户对同一本书只能有一笔未归还的借阅
      const existing = await tx.loan.findFirst({
        where: { userId, bookId, status: { in: ["BORROWED", "OVERDUE"] } },
      })
      if (existing) throw new Error("您已借阅这本书，请先归还")

      // 锁定当前用户行，把同一读者的并发借阅串行化，
      // 否则两个并发请求可能同时读到「未超上限」而都放行，导致借出数量超限
      await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`

      // 同一读者同时未归还的借阅不能超过上限
      const activeLoanCount = await tx.loan.count({
        where: { userId, status: { in: ["BORROWED", "OVERDUE"] } },
      })
      if (activeLoanCount >= MAX_ACTIVE_LOANS) {
        throw new Error(
          `最多同时借阅 ${MAX_ACTIVE_LOANS} 本书，请先归还部分图书`
        )
      }

      // 用「条件更新」原子扣减库存：只有库存 > 0 时才扣减成功。
      // 如果先查库存再扣减，两个并发请求可能同时读到库存 1 而都放行，导致超借。
      const updated = await tx.book.updateMany({
        where: { id: bookId, availableCopies: { gt: 0 } },
        data: { availableCopies: { decrement: 1 } },
      })
      if (updated.count === 0) throw new Error("该图书已借完")

      // 创建借阅记录（borrowDate 用数据库默认 now()，status 默认 BORROWED）
      await tx.loan.create({
        data: { bookId, userId, dueDate },
      })
    })
  } catch (error) {
    return { error: (error as Error).message || "借阅失败，请重试" }
  }

  // 借阅成功，跳转到「我的借阅」页
  redirect("/my-loans")
}
