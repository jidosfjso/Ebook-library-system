import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import BorrowButton from "./borrow-button"

// 图书详情页：展示一本书的完整信息，并提供借阅入口（仅普通读者）
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const book = await prisma.book.findUnique({ where: { id } })
  if (!book) notFound()

  const isReader = session.user.role === "USER"
  const canBorrow = book.availableCopies > 0

  // 查询当前读者是否已借阅该书且未归还（用于把按钮置为「已借阅」状态）
  const activeLoan = isReader
    ? await prisma.loan.findFirst({
        where: {
          userId: session.user.id,
          bookId: book.id,
          status: { in: ["BORROWED", "OVERDUE"] },
        },
      })
    : null

  return (
    <main className="detail-page">
      <Link href="/books" className="back-link">
        ← 返回图书列表
      </Link>

      <div className="detail-card">
        <div className="detail-cover">
          {book.coverUrl ? (
            // 封面来自 Vercel Blob，课程作业里直接用 <img> 最简单
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt={book.title} />
          ) : (
            <span className="book-cover-placeholder">📚</span>
          )}
        </div>

        <div className="detail-info">
          <h1>{book.title}</h1>
          <p className="detail-author">{book.author}</p>
          <p className="detail-meta">ISBN：{book.isbn}</p>
          <p className="detail-meta">
            库存：可借 {book.availableCopies} / 共 {book.totalCopies} 本
          </p>
          <p className="detail-desc">{book.description || "暂无简介"}</p>

          {isReader && (
            <BorrowButton
              bookId={book.id}
              disabled={!canBorrow}
              borrowed={!!activeLoan}
            />
          )}
        </div>
      </div>
    </main>
  )
}
