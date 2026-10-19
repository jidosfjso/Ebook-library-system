"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { redirect } from "next/navigation"

// 图书表单的状态类型
export type BookFormState = { error?: string }

// 更新图书（含库存管理）Server Action
export async function updateBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  await requireAdmin()

  const id = formData.get("id") as string
  const title = (formData.get("title") as string)?.trim()
  const author = (formData.get("author") as string)?.trim()
  const isbn = (formData.get("isbn") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const totalCopies = parseInt(formData.get("totalCopies") as string, 10)
  const availableCopies = parseInt(
    formData.get("availableCopies") as string,
    10
  )
  const cover = formData.get("cover") as File | null

  // 1. 基础校验
  if (!id) return { error: "参数错误" }
  if (!title || !author || !isbn) {
    return { error: "请填写书名、作者和 ISBN" }
  }
  if (Number.isNaN(totalCopies) || totalCopies < 0) {
    return { error: "总库存必须是非负整数" }
  }
  if (Number.isNaN(availableCopies) || availableCopies < 0) {
    return { error: "可借库存必须是非负整数" }
  }
  // 库存约束：可借库存不能超过总库存
  if (availableCopies > totalCopies) {
    return { error: "可借库存不能超过总库存" }
  }

  // 2. 检查 ISBN 是否与其他图书冲突
  const exists = await prisma.book.findUnique({ where: { isbn } })
  if (exists && exists.id !== id) {
    return { error: "该 ISBN 已被其他图书使用" }
  }

  // 3. 上传新封面到 Vercel Blob（可选，不上传则保留原封面）
  let coverUrl: string | undefined
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

  // 4. 更新图书（只有上传了新封面才更新 coverUrl）
  await prisma.book.update({
    where: { id },
    data: {
      title,
      author,
      isbn,
      description: description || null,
      ...(coverUrl ? { coverUrl } : {}),
      totalCopies,
      availableCopies,
    },
  })

  // 5. 保存成功，跳回管理列表
  redirect("/admin/books")
}
