import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import DeleteBookButton from "./delete-button"
import Pagination from "@/app/components/pagination"

// 图书管理列表每页数量
const PAGE_SIZE = 10

// 管理后台：图书管理列表（仅管理员）
export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdmin()

  // 读取 URL 里的页码 ?page=N
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  // 先查总数算总页数，页码超出范围时收敛到最后一页
  const total = await prisma.book.count()
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  // 统计当前页每本书「未归还」的借阅数量：大于 0 的书禁止删除
  const activeLoans = await prisma.loan.groupBy({
    by: ["bookId"],
    where: {
      bookId: { in: books.map((b) => b.id) },
      status: { in: ["BORROWED", "OVERDUE"] },
    },
    _count: { _all: true },
  })
  const activeLoanMap = new Map(
    activeLoans.map((item) => [item.bookId, item._count._all])
  )

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>图书管理</h1>
        <div className="admin-header-actions">
          <Link href="/">返回首页</Link>
          <Link href="/admin/loans">借阅管理</Link>
          <Link className="primary-btn" href="/admin/books/new">
            + 上架新书
          </Link>
        </div>
      </header>

      {books.length === 0 ? (
        <p className="empty">暂无图书，点击右上角「上架新书」添加</p>
      ) : (
        <table className="loans-table">
          <thead>
            <tr>
              <th>书名</th>
              <th>作者</th>
              <th>ISBN</th>
              <th>总库存</th>
              <th>可借库存</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.totalCopies}</td>
                <td>{book.availableCopies}</td>
                <td>
                  <div className="table-actions">
                    <Link className="edit-link" href={`/admin/books/${book.id}`}>
                      编辑
                    </Link>
                    <DeleteBookButton
                      bookId={book.id}
                      activeLoans={activeLoanMap.get(book.id) ?? 0}
                    />
                  </div>
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
        basePath="/admin/books"
      />
    </main>
  )
}
