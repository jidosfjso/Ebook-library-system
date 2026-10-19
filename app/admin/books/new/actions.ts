"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { redirect } from "next/navigation"

// 图书表单的状态类型
export type BookFormState = { error?: string }

// 上架新书 Server Action
export async function createBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  // 仅管理员可操作（非管理员会被重定向，不会继续执行）
  await requireAdmin()

  const title = (formData.get("title") as string)?.trim()
  const author = (formData.get("author") as string)?.trim()
  const isbn = (formData.get("isbn") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const totalCopies = parseInt(formData.get("totalCopies") as string, 10)
  const cover = formData.get("cover") as File | null

  // 1. 基础校验
  if (!title || !author || !isbn) {
    return { error: "请填写书名、作者和 ISBN" }
  }
  if (Number.isNaN(totalCopies) || totalCopies < 0) {
    return { error: "总库存必须是非负整数" }
  }

  // 2. 检查 ISBN 是否已被使用
  const exists = await prisma.book.findUnique({ where: { isbn } })
  if (exists) {
    return { error: "该 ISBN 已存在，请检查" }
  }

  // 3. 上传封面到 Vercel Blob（可选）
  let coverUrl: string | null = null
  if (cover && cover.size > 0) {
    try {
      const blob = await put(`covers/${Date.now()}-${cover.name}`, cover, {
        access: "public",
      })
      coverUrl = blob.url
    } catch (error) {
      // 打印底层错误到服务端日志，便于定位（token 失效/网络/权限等）
      console.error("封面上传失败：", error)
      return { error: "封面上传失败，请重试" }
    }
  }

  // 4. 创建图书：上架时可借库存 = 总库存
  await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      description: description || null,
      coverUrl,
      totalCopies,
      availableCopies: totalCopies,
    },
  })

  // 5. 保存成功，跳回管理列表
  redirect("/admin/books")
}
