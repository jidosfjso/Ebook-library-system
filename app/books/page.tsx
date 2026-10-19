import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import Link from "next/link"
import Pagination from "@/app/components/pagination"

// 图书列表每页数量
const PAGE_SIZE = 12

// 图书列表页：登录后所有用户（读者/管理员）都能访问，支持按书名/作者/ISBN 搜索
export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // 读取 URL 里的搜索关键词 ?q=xxx 和页码 ?page=N
  const { q, page: pageParam } = await searchParams
  const query = (q ?? "").trim()
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  // 根据关键词构建查询条件（模糊匹配书名/作者/ISBN，忽略大小写）
  const where: Prisma.BookWhereInput = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
          { isbn: { contains: query, mode: "insensitive" } },
        ],
      }
    : {}

  // 先查总数算总页数，页码超出范围时收敛到最后一页
  const total = await prisma.book.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  // 查询当前页的图书（按上架时间倒序）
  const books = await prisma.book.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return (
    <main className="books-page">
      <header className="books-header">
        <h1>图书列表</h1>
        <Link href="/">返回首页</Link>
      </header>

      {/* 搜索表单：GET 提交，关键词会出现在 URL 的 ?q= 上 */}
      <form className="search-bar" action="/books" method="GET">
        <input name="q" defaultValue={query} placeholder="搜索书名、作者或 ISBN" />
        <button type="submit">搜索</button>
        {query && (
          <Link className="search-clear" href="/books">
            清除
          </Link>
        )}
      </form>

      {books.length === 0 ? (
        <p className="empty">没有找到相关图书</p>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className="book-card">
              <div className="book-cover">
                {book.coverUrl ? (
                  // 封面来自 Vercel Blob，课程作业里直接用 <img> 最简单
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt={book.title} />
                ) : (
                  <span className="book-cover-placeholder">📚</span>
                )}
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="book-author">{book.author}</p>
                <p className="book-meta">ISBN：{book.isbn}</p>
                <p
                  className={`book-stock ${
                    book.availableCopies === 0 ? "out" : ""
                  }`}
                >
                  {book.availableCopies === 0
                    ? "已借完"
                    : `可借 ${book.availableCopies} / 共 ${book.totalCopies} 本`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 翻页（保留搜索关键词） */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/books"
        params={query ? { q: query } : {}}
      />
    </main>
  )
}
