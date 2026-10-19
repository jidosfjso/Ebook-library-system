import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import EditBookForm from "./edit-form"

// 编辑图书页（仅管理员）：展示表单，可修改信息和库存
export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params
  const book = await prisma.book.findUnique({ where: { id } })
  if (!book) notFound()

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>编辑图书</h1>
        <Link href="/admin/books">← 返回管理列表</Link>
      </header>

      <EditBookForm
        id={book.id}
        title={book.title}
        author={book.author}
        isbn={book.isbn}
        description={book.description ?? ""}
        coverUrl={book.coverUrl ?? ""}
        totalCopies={book.totalCopies}
        availableCopies={book.availableCopies}
      />
    </main>
  )
}
