"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { createBook } from "./actions"

// 上架新书页（客户端组件，使用 useActionState 处理表单提交和错误）
export default function NewBookPage() {
  const [state, formAction, pending] = useActionState(createBook, {})

  // 本地选择的封面预览（objectURL），保存前即可看到效果
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  // 更换选择或组件卸载时，释放上一个 objectURL，避免内存泄漏
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  // 选择本地图片后生成预览
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLocalPreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>上架新书</h1>
        <Link href="/admin/books">← 返回管理列表</Link>
      </header>

      <form className="book-form" action={formAction}>
        <label>
          书名
          <input name="title" type="text" required />
        </label>

        <label>
          作者
          <input name="author" type="text" required />
        </label>

        <label>
          ISBN
          <input name="isbn" type="text" required />
        </label>

        <label>
          简介
          <textarea name="description" rows={4} />
        </label>

        <label>
          封面图片（可选）
          {localPreview ? (
            // 展示刚选择的本地图片
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cover-preview" src={localPreview} alt="封面预览" />
          ) : (
            <span className="cover-preview-empty">未选择图片</span>
          )}
          <input
            name="cover"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
          />
        </label>

        <label>
          总库存
          <input
            name="totalCopies"
            type="number"
            min={0}
            defaultValue={1}
            required
          />
        </label>

        {state.error && <p className="error-text">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "保存中..." : "上架"}
        </button>
      </form>
    </main>
  )
}
