import Link from "next/link"

// 分页组件的 props
export type PaginationProps = {
  currentPage: number // 当前页码（1 起）
  totalPages: number // 总页数
  basePath: string // 页面路径，如 /books
  // 需要保留在翻页链接里的其他查询参数（如搜索词 q、状态筛选 status）
  params?: Record<string, string>
}

// 通用分页组件（服务端组件）：上一页/下一页 + 页码，页码过多时折叠为省略号
export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  params = {},
}: PaginationProps) {
  // 只有一页时不渲染
  if (totalPages <= 1) return null

  // 生成某页的链接：保留已有查询参数，替换 page
  const buildHref = (page: number) => {
    const sp = new URLSearchParams(params)
    sp.set("page", String(page))
    return `${basePath}?${sp.toString()}`
  }

  // 页码列表：始终保留首尾页，显示当前页前后各 2 页，其余用省略号折叠
  const pages: (number | "...")[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }

  return (
    <nav className="pagination">
      {currentPage > 1 ? (
        <Link className="page-link" href={buildHref(currentPage - 1)}>
          上一页
        </Link>
      ) : (
        <span className="page-link disabled">上一页</span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="page-ellipsis">
            …
          </span>
        ) : (
          <Link
            key={p}
            className={`page-link ${p === currentPage ? "active" : ""}`}
            href={buildHref(p)}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link className="page-link" href={buildHref(currentPage + 1)}>
          下一页
        </Link>
      ) : (
        <span className="page-link disabled">下一页</span>
      )}
    </nav>
  )
}
