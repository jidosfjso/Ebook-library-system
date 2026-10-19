import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Pagination from "@/app/components/pagination"
import { LOAN_STATUS_LABEL, formatDateTime } from "@/lib/loan"

// 借阅管理列表每页数量
const PAGE_SIZE = 10

// 状态筛选选项（key 对应 URL ?status= 的值，空串表示全部）
const STATUS_FILTERS = [
  { key: "", label: "全部" },
  { key: "BORROWED", label: "借阅中" },
  { key: "OVERDUE", label: "已逾期" },
  { key: "RETURNED", label: "已归还" },
] as const

type LoanStatusKey = "BORROWED" | "OVERDUE" | "RETURNED"

// 借阅管理页（仅管理员）：查看全站借阅记录，支持按状态筛选
export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  await requireAdmin()

  // 读取 URL 里的状态筛选 ?status=xxx 和页码 ?page=N
  const { status, page: pageParam } = await searchParams
  const validStatus = STATUS_FILTERS.some((f) => f.key === status && f.key !== "")
    ? (status as LoanStatusKey)
    : undefined
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  // 懒更新：把「已过应还时间但仍标记为 BORROWED」的记录置为 OVERDUE
  // （全站范围，保证管理员看到的状态是新的）
  await prisma.loan.updateMany({
    where: { status: "BORROWED", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  })

  const where = validStatus ? { status: validStatus } : {}

  // 先查总数算总页数，页码超出范围时收敛到最后一页
  const total = await prisma.loan.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const loans = await prisma.loan.findMany({
    where,
    include: { book: true, user: true },
    orderBy: { borrowDate: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>借阅管理</h1>
        <div className="admin-header-actions">
          <Link href="/">返回首页</Link>
          <Link href="/admin/books">图书管理</Link>
        </div>
      </header>

      {/* 状态筛选 */}
      <nav className="filter-tabs">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/loans?status=${f.key}` : "/admin/loans"}
            className={`filter-tab ${(validStatus ?? "") === f.key ? "active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {loans.length === 0 ? (
        <p className="empty">暂无借阅记录</p>
      ) : (
        <table className="loans-table">
          <thead>
            <tr>
              <th>读者</th>
              <th>图书</th>
              <th>借出时间</th>
              <th>应还时间</th>
              <th>归还时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>
                  {loan.user.name}
                  <br />
                  <span className="muted-text">{loan.user.email}</span>
                </td>
                <td>{loan.book.title}</td>
                <td>{formatDateTime(loan.borrowDate)}</td>
                <td>{formatDateTime(loan.dueDate)}</td>
                <td>{loan.returnDate ? formatDateTime(loan.returnDate) : "-"}</td>
                <td>
                  <span className={`status status-${loan.status.toLowerCase()}`}>
                    {LOAN_STATUS_LABEL[loan.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 翻页（保留状态筛选） */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/loans"
        params={validStatus ? { status: validStatus } : {}}
      />
    </main>
  )
}
