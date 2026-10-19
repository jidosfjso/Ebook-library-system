import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ReturnButton from "./return-button"
import Pagination from "@/app/components/pagination"
import { LOAN_STATUS_LABEL, formatDateTime } from "@/lib/loan"

// 我的借阅每页数量
const PAGE_SIZE = 10

// 我的借阅页：列出当前用户的所有借阅记录，支持归还
export default async function MyLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  // 读取 URL 里的页码 ?page=N
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  // 懒更新：把「已过应还时间但仍标记为 BORROWED」的记录置为 OVERDUE
  // （课程作业里不做定时任务，改为在读取时更新状态）
  await prisma.loan.updateMany({
    where: { userId, status: "BORROWED", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  })

  // 先查总数算总页数，页码超出范围时收敛到最后一页
  const total = await prisma.loan.count({ where: { userId } })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const loans = await prisma.loan.findMany({
    where: { userId },
    include: { book: true },
    orderBy: { borrowDate: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return (
    <main className="loans-page">
      <header className="loans-header">
        <h1>我的借阅</h1>
        <Link href="/">返回首页</Link>
      </header>

      {loans.length === 0 ? (
        <p className="empty">
          还没有借阅记录，去 <Link href="/books">浏览图书</Link> 吧
        </p>
      ) : (
        <table className="loans-table">
          <thead>
            <tr>
              <th>图书</th>
              <th>借出时间</th>
              <th>应还时间</th>
              <th>归还时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.book.title}</td>
                <td>{formatDateTime(loan.borrowDate)}</td>
                <td>{formatDateTime(loan.dueDate)}</td>
                <td>
                  {loan.returnDate ? formatDateTime(loan.returnDate) : "-"}
                </td>
                <td>
                  <span className={`status status-${loan.status.toLowerCase()}`}>
                    {LOAN_STATUS_LABEL[loan.status]}
                  </span>
                </td>
                <td>
                  {(loan.status === "BORROWED" || loan.status === "OVERDUE") && (
                    <ReturnButton loanId={loan.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 翻页 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/my-loans"
      />
    </main>
  )
}
